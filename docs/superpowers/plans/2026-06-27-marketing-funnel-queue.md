# Marketing Funnel Work Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the website-to-CRM lead seam (A16) and tighten the on-page Proof funnel (title-tag, A17, A18) on orionfold.com.

**Architecture:** A16 adds a read-only `waitlist-export` Supabase edge fn that marketing's poller cursor-polls (mirrors the existing beehiiv read leg). The title-tag and A17/A18 items are static Astro edits to the homepage SEO defaults and the shared `ProductDetail` layout. No commerce or capture-write path is touched.

**Tech Stack:** Astro 5, Supabase edge functions (Deno), TypeScript. Spec: `docs/superpowers/specs/2026-06-27-marketing-funnel-queue-design.md`.

## Global Constraints

- **No em-dashes** in any copy added by this work. Use periods or commas. Blocking review check (`grep` for the em-dash glyph on every changed file must be empty for copy strings).
- Copy humanized, grade 3 to 5 English, no AI tells.
- Work on `main` only. No branches or worktrees (operator rule).
- Public repo: no secrets in tracked files. Edge-fn secrets read from `Deno.env.get(...)` only. The `.claude/hooks/publish-guard.py` PreToolUse hook blocks any Write/Edit carrying key material; do not assign a secret-named variable a literal value in any tracked file or in a Bash heredoc. In tests, build any fake credential from a plainly-named local (e.g. `const fakeKey = "abc"`), never a `secret`/`token`-named const.
- Edge-fn dependency idiom: `https://esm.sh/<pkg>@<ver>` (supabase-js) and `https://deno.land/std@0.224.0/...` (test asserts). NOT `npm:`.
- Deploy of `supabase/functions/*` is operator-gated. Do NOT run `supabase functions deploy`. Static site changes ship on push to `main` (push is operator-gated too unless told otherwise).
- Astro dev server: `http://localhost:4321/` (log `/tmp/astro-dev-4321.log`). Sandbox curl cannot reach localhost; verify pages via the Chrome MCP browser, not curl.

---

## Task 1: A16, `waitlist-export` edge fn (cursor-poll read endpoint)

**Files:**
- Create: `supabase/functions/waitlist-export/index.ts`
- Test: `supabase/functions/waitlist-export/index.test.ts`

**Interfaces:**
- Consumes: the `waitlist` Supabase table (columns: `email`, `confirmed` bool, `offer`, `utm_source/medium/campaign/term/content`, `referrer`, `consent_text`, `metadata` jsonb, `created_at` timestamptz). Service-role client via `createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)`.
- Produces: an HTTP GET endpoint returning `{ rows: ExportRow[], next_cursor: string|null }` where `ExportRow = { email, offer, consent_text, captured_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term, double_optin: "pending"|"confirmed" }`. Pure mapping function `mapRow(dbRow) -> ExportRow` exported for tests.

This task pulls the row-mapping + auth logic into small pure functions so they can be unit-tested without a live Supabase. The `Deno.serve` handler wires them to the DB. Auth uses a shared credential carried in the `Authorization` request header (scheme word + space + the credential); the helper validates it in constant time.

- [ ] **Step 1: Write the failing test for the pure helpers**

Create `supabase/functions/waitlist-export/index.test.ts`:

```typescript
// Unit lock for the A16 waitlist-export read endpoint. Guards: row mapping
// (confirmed bool -> double_optin string), shared-credential auth check
// (constant-time), and limit clamping. The Deno.serve handler is thin glue.
//
// Run: deno test supabase/functions/waitlist-export/index.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { authorized, clampLimit, mapRow } from "./index.ts";

function authHeader(value: string): Headers {
  return new Headers({ Authorization: "Bearer " + value });
}

Deno.test("mapRow maps a confirmed row to the export shape", () => {
  const out = mapRow({
    email: "a@b.com",
    offer: "proof-playbook",
    consent_text: "By subscribing you agree...",
    created_at: "2026-06-27T10:00:00.000Z",
    utm_source: "orionfold",
    utm_medium: "cross-sell",
    utm_campaign: "proof-bridge",
    utm_content: "model-advisor",
    utm_term: null,
    confirmed: true,
  });
  assertEquals(out, {
    email: "a@b.com",
    offer: "proof-playbook",
    consent_text: "By subscribing you agree...",
    captured_at: "2026-06-27T10:00:00.000Z",
    utm_source: "orionfold",
    utm_medium: "cross-sell",
    utm_campaign: "proof-bridge",
    utm_content: "model-advisor",
    utm_term: null,
    double_optin: "confirmed",
  });
});

Deno.test("mapRow maps an unconfirmed row to pending", () => {
  const out = mapRow({ email: "x@y.com", confirmed: false, created_at: "2026-06-27T00:00:00.000Z" });
  assertEquals(out.double_optin, "pending");
  assertEquals(out.email, "x@y.com");
});

Deno.test("mapRow never leaks metadata", () => {
  const out = mapRow({ email: "x@y.com", confirmed: false, created_at: "t", metadata: { hidden: 1 } } as Record<string, unknown>);
  assert(!("metadata" in out));
});

Deno.test("authorized rejects missing and wrong creds, accepts the right one", () => {
  const fakeKey = "shared-export-fixture-value";
  assert(!authorized(new Headers(), fakeKey));
  assert(!authorized(authHeader("wrong-value"), fakeKey));
  assert(authorized(authHeader(fakeKey), fakeKey));
});

Deno.test("clampLimit defaults to 500 and caps at 1000", () => {
  assertEquals(clampLimit(null), 500);
  assertEquals(clampLimit("50"), 50);
  assertEquals(clampLimit("99999"), 1000);
  assertEquals(clampLimit("-3"), 500);
  assertEquals(clampLimit("notanumber"), 500);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test supabase/functions/waitlist-export/index.test.ts`
Expected: FAIL, module `./index.ts` not found / exports `mapRow`, `authorized`, `clampLimit` undefined.

- [ ] **Step 3: Write the implementation**

Create `supabase/functions/waitlist-export/index.ts`:

```typescript
// A16: read-only cursor-poll export of website opt-in captures for the
// marketing CRM poller (mirrors the beehiiv read leg). Server-to-server,
// shared-credential auth, NOT browser CORS. Returns rows since a created_at
// cursor. Never writes. PII (email) leaves only to the authenticated poller.
//
// leads/ field mapping (poller builds its ingestion leg to this):
//   email -> contact id | offer -> source.campaign (+ stage)
//   consent_text -> consent.scope | captured_at -> consent.captured_at
//   utm_* -> source.campaign round-trip | double_optin -> consent.double_optin
//   fixed: source.origin: website, consent.basis: website-optin
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AUTH_PREFIX = "Bearer ";

export interface ExportRow {
  email: string;
  offer: string | null;
  consent_text: string | null;
  captured_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  double_optin: "pending" | "confirmed";
}

const FIELDS =
  "email, offer, consent_text, created_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term, confirmed";

export function mapRow(r: Record<string, unknown>): ExportRow {
  return {
    email: r.email as string,
    offer: (r.offer ?? null) as string | null,
    consent_text: (r.consent_text ?? null) as string | null,
    captured_at: r.created_at as string,
    utm_source: (r.utm_source ?? null) as string | null,
    utm_medium: (r.utm_medium ?? null) as string | null,
    utm_campaign: (r.utm_campaign ?? null) as string | null,
    utm_content: (r.utm_content ?? null) as string | null,
    utm_term: (r.utm_term ?? null) as string | null,
    double_optin: r.confirmed ? "confirmed" : "pending",
  };
}

// Constant-time shared-credential compare. Both sides encoded to bytes; a
// length mismatch fails fast, otherwise every byte is XOR-accumulated (no
// early exit). `expected` is read from env by the caller, never inlined.
export function authorized(headers: Headers, expected: string): boolean {
  if (!expected) return false;
  const auth = headers.get("Authorization") || "";
  if (!auth.startsWith(AUTH_PREFIX)) return false;
  const provided = auth.slice(AUTH_PREFIX.length);
  const enc = new TextEncoder();
  const a = enc.encode(provided);
  const b = enc.encode(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function clampLimit(raw: string | null): number {
  const n = raw === null ? NaN : Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return 500;
  return Math.min(n, 1000);
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const expected = Deno.env.get("WAITLIST_EXPORT_TOKEN") ?? "";
  if (!authorized(req.headers, expected)) return json({ error: "Unauthorized" }, 401);

  const url = new URL(req.url);
  const since = url.searchParams.get("since");
  const limit = clampLimit(url.searchParams.get("limit"));

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let q = supabase
    .from("waitlist")
    .select(FIELDS)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (since) q = q.gt("created_at", since);

  const { data, error } = await q;
  if (error) return json({ error: error.message }, 500);

  const rows = (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  const next_cursor = rows.length ? rows[rows.length - 1].captured_at : null;
  return json({ rows, next_cursor });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test supabase/functions/waitlist-export/index.test.ts`
Expected: PASS (5 tests).

Note: importing `index.ts` runs its top-level `Deno.serve(...)`. If the test runner reports a leaked server/op, wrap the `Deno.serve(...)` call in `if (import.meta.main) { ... }` and re-run. Verify the four exported pure functions remain importable.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/waitlist-export/index.ts supabase/functions/waitlist-export/index.test.ts
git commit -m "feat(a16): waitlist-export cursor-poll edge fn for marketing CRM ingestion

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Note the operator-gated deploy (do NOT run it)**

Record in HANDOFF.md that deploy requires the operator to run, from the repo root: set the `WAITLIST_EXPORT_TOKEN` secret via `supabase secrets set` (operator chooses a strong value, never in a tracked file), then `supabase functions deploy waitlist-export`. After deploy, one live curl from the marketing box validates the contract.

---

## Task 2: Title-tag + meta-description (Proof-led, no em-dashes)

**Files:**
- Modify: `src/layouts/Layout.astro` (the default `title` value, around line 25)
- Modify: `src/data/seo.ts` (the default description, around line 13)

**Interfaces:**
- Consumes: nothing new.
- Produces: the homepage `<title>` and `<meta name="description">` strings. Per-page titles that pass their own `title` prop are unaffected.

- [ ] **Step 1: Confirm the homepage uses the default title (audit)**

Run: `grep -rn "title=" src/pages/index.astro` and `grep -n "title =" src/layouts/Layout.astro`.
Expected: the homepage (`src/pages/index.astro`) does NOT pass an explicit `title` (it inherits the Layout default), OR it passes one that also needs updating. If it passes its own, update THAT string instead and note it. Record which file holds the homepage title.

- [ ] **Step 2: Edit the default title**

In `src/layouts/Layout.astro`, change the default title:
- From: `title = 'Orionfold · private AI capability for small teams',`
- To: `title = 'Orionfold · Prove which AI you can trust',`

(If Step 1 found the homepage passes its own title, apply the same new string there instead.)

- [ ] **Step 3: Edit the default meta description**

In `src/data/seo.ts`, change the default description line:
- From: `'Orionfold: private AI capability for small teams.'`
- To: `'Run real AI on your own machine and check the receipts yourself. Prove which AI you can trust. Rerun it, never take our word for it.'`

- [ ] **Step 4: Em-dash + build check**

Run a grep for the em-dash glyph on `src/layouts/Layout.astro` and `src/data/seo.ts`, expected no matches in the edited strings.
Run: `npm run build`, expected clean build, no errors.

- [ ] **Step 5: Verify rendered output in the browser**

Start dev (`npm run dev` if not running), open `http://localhost:4321/` in the Chrome MCP browser, and confirm via the page `<head>`: `<title>` reads "Orionfold · Prove which AI you can trust" and `<meta name="description">` reads the new line. Spot-check one per-page route (e.g. `/proof/`) still shows ITS own title (no regression).

- [ ] **Step 6: Commit**

```bash
git add src/layouts/Layout.astro src/data/seo.ts
git commit -m "feat(seo): homepage title + description lead with Proof positioning

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: A17, OfferSlot opt-in + proof-bridge UTM on detail pages

**Files:**
- Modify: `src/layouts/ProductDetail.astro` (the shared layout that renders software + model detail pages and already invokes `ProofCta`)
- Modify: `src/components/product/ProofCta.astro` (add the proof-bridge UTM to its `/proof/` link)

**Interfaces:**
- Consumes: `OfferSlot.astro` (Props: `offer: string`, `heading: string`, `dek?: string`, `consentText?: string`, `source?: string`, `label?`, `buttonText?`, `successMessage?`, `class?`). `ProofCta.astro` (Props: `type: 'software'|'model'|'book'`, `slug: string`, `receipt?: string`). The `view`/`detail` objects passed into `ProductDetail` carry the product `type` and `slug`.
- Produces: a single opt-in slot on each software/model detail page (offer `proof-playbook`); a `/proof/` link carrying `utm_source=orionfold&utm_medium=cross-sell&utm_campaign=proof-bridge&utm_content=<type>-<slug>`.

- [ ] **Step 1: Audit current detail-page coverage (no code yet)**

Run: `grep -n "ProofCta\|OfferSlot\|ProofBand" src/layouts/ProductDetail.astro`.
Determine: (a) where `ProofCta` is rendered in the layout, (b) whether any `OfferSlot` already exists there (it should NOT, `OfferSlot` is currently only on receipts/proof/letter). Read the layout's frontmatter to find the variables holding the product `type` and `slug` (e.g. `view.type`, `detail.slug` or similar). Record the exact variable names. If an opt-in already exists on detail pages, STOP and report, do not add a duplicate.

- [ ] **Step 2: Add the proof-bridge UTM to ProofCta's link**

In `src/components/product/ProofCta.astro`, the link currently is `href={proofTarget}` where `proofTarget = receiptHref(receipt) ?? '/proof/'`. Append the UTM query string. Edit the frontmatter to build it:

```astro
const proofTarget = receiptHref(receipt) ?? '/proof/';
const utm = `utm_source=orionfold&utm_medium=cross-sell&utm_campaign=proof-bridge&utm_content=${type}-${slug}`;
const proofHref = proofTarget.includes('?') ? `${proofTarget}&${utm}` : `${proofTarget}?${utm}`;
```

Then change the link to `href={proofHref}`. (Receipts deep-links from A18 will also carry the UTM via this same logic.)

- [ ] **Step 3: Add the OfferSlot to the detail layout**

In `src/layouts/ProductDetail.astro`, import `OfferSlot` and render it once near the `ProofCta` band, using the `type`/`slug` variable names found in Step 1. Use this exact copy (no em-dashes):

```astro
---
import OfferSlot from '../components/.../OfferSlot.astro';  // use the real path from Step 1's grep
---
<OfferSlot
  offer="proof-playbook"
  label="Get the Proof playbook"
  heading="Think a small local model can beat the frontier ones?"
  dek="We proved it. Rerun it yourself, do not take our word for it."
  source={`detail-${view.type}-${detail.slug}`}
  buttonText="Send me the playbook"
/>
```

Use the actual variable names from Step 1 (shown here as `view.type` / `detail.slug` as a stand-in for whatever the layout exposes). Place it so each detail page has exactly ONE opt-in.

- [ ] **Step 4: Em-dash check + build**

Run a grep for the em-dash glyph on `src/layouts/ProductDetail.astro` and `src/components/product/ProofCta.astro`, expected no matches in copy.
Run: `npm run build`, expected clean.

- [ ] **Step 5: Verify in the browser (both themes, no dup)**

Open a software detail page (e.g. `http://localhost:4321/software/arena/`) and a model detail page in the Chrome MCP browser. Confirm: (1) exactly one opt-in form present (`document.querySelectorAll('form').length` consistent with one capture, not two); (2) the ProofCta link href contains `utm_campaign=proof-bridge` and the correct `utm_content=software-arena` (or `model-<slug>`); (3) no console errors; (4) light + dark both render the slot button with correct contrast (dark-on-cyan in light theme).

- [ ] **Step 6: Commit**

```bash
git add src/layouts/ProductDetail.astro src/components/product/ProofCta.astro
git commit -m "feat(a17): proof-bridge opt-in + UTM on software/model detail pages

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: A18, deep-link detail bands to their specific receipt

**Files:**
- Modify: `src/layouts/ProductDetail.astro` (pass the `receipt` prop into `ProofCta` where a clean mapping exists)
- Read-only: `src/data/proof.ts` (source of receipt slugs)

**Interfaces:**
- Consumes: `ProofCta`'s existing `receipt?: string` prop (already implemented; `receiptHref(receipt)` resolves it to `/receipts/<slug>/`). `src/data/proof.ts` exports the receipt definitions whose slugs map to product columns.
- Produces: detail pages whose product maps 1:1 to a receipt now render the band linking to `/receipts/<slug>/?<utm>`; the rest keep the `/proof/` fallback.

- [ ] **Step 1: Derive the product-slug to receipt-slug map (discovery)**

Read `src/data/proof.ts`. Identify the helper that links a product (`type`,`slug`) to a receipt slug, if one exists (look for `receipt`, `receiptHref`, or a column->receipt structure). Build the list of `(type, slug) -> receiptSlug` pairs that have a CLEAN 1:1 mapping (a product whose page earned a specific receipt). Record the list. Where no clean mapping exists, the product keeps `/proof/` (receipt-honesty: invent nothing).

- [ ] **Step 2: Write a resolver test (if a mapping helper is added)**

If Step 1 shows the mapping must be computed in the layout (not already a helper), add a tiny pure helper `receiptForProduct(type, slug): string | undefined` in `src/data/proof.ts` and a unit test for it (use the repo's test runner, check `package.json` "test" script first; likely Vitest). Test that a known proven product returns its receipt slug and an unproven one returns `undefined`. If `proof.ts` already exposes this mapping, skip to Step 3.

Run the test: expected FAIL then PASS after implementing the helper (standard TDD). Use the repo's test command (e.g. `npm test -- proof` or `npx vitest run`).

- [ ] **Step 3: Pass the receipt prop in the layout**

In `src/layouts/ProductDetail.astro`, compute the receipt for the current product and pass it to `ProofCta`:

```astro
---
import { receiptForProduct } from '../data/proof.ts';  // or the existing helper from Step 1
const receiptSlug = receiptForProduct(view.type, detail.slug);  // use real var names
---
<ProofCta type={view.type} slug={detail.slug} receipt={receiptSlug} />
```

`receiptSlug` is `undefined` for unmapped products, so `ProofCta` falls back to `/proof/` exactly as before.

- [ ] **Step 4: Em-dash check + build**

Run a grep for the em-dash glyph on `src/layouts/ProductDetail.astro` and `src/data/proof.ts`, no matches in copy.
Run: `npm run build`, expected clean.

- [ ] **Step 5: Verify deep-link + fallback in the browser**

In the Chrome MCP browser: open a detail page whose product maps to a receipt and confirm the ProofCta link points to `/receipts/<slug>/?utm_campaign=proof-bridge...`. Open a detail page with NO receipt mapping and confirm it still points to `/proof/?utm...`. No console errors.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/ProductDetail.astro src/data/proof.ts
git commit -m "feat(a18): detail bands deep-link to their specific receipt where mapped

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Relay handback to marketing (A16 contract)

**Files:**
- Modify: `/Users/manavsehgal/orionfold/strategy/orionfold-website/_RELAY.md` (on disk only, NEVER pushed, Flows owns that repo's git)

**Interfaces:**
- Consumes: the shipped `waitlist-export` contract from Task 1.
- Produces: a `Website->Mac` relay entry handing marketing the exact endpoint shape + field mapping so they build the ingestion leg.

- [ ] **Step 1: Append the relay entry (newest-first, after the header `---`)**

Add a dated `Website->Mac` entry, status `[acted]`, that states: the `waitlist-export` edge fn is built + tested (push/deploy operator-gated); the GET contract (`?since=<ISO>&limit=<n>`, plus the shared-credential `Authorization` header carrying the `WAITLIST_EXPORT_TOKEN` value); the response shape (`{rows, next_cursor}`); and the `leads/` field mapping (email, offer->source.campaign, consent_text->consent.scope, captured_at->consent.captured_at, utm_* round-trip, double_optin->consent.double_optin, fixed source.origin: website + consent.basis: website-optin). Note the operator must set the secret + deploy, then share the credential with the marketing box out-of-band. No em-dashes.

- [ ] **Step 2: Verify NOT staged for the public repo**

Run: `cd /Users/manavsehgal/orionfold/website && git status`, confirm the strategy repo file is NOT in this repo's tree (it lives at `../strategy/`, outside the website repo). Do NOT `git add` or push the strategy repo (operator/Flows owns it).

---

## Self-Review notes (already applied)

- **Spec coverage:** A16 (Task 1), title-tag (Task 2), A17 (Task 3), A18 (Task 4), relay handback (Task 5). All four spec items plus the boundary handback are covered.
- **Sequencing:** Task 1 + Task 2 independent. Task 3 before Task 4 (A18 passes the receipt prop into the same layout A17 wires; A18's deep-link rides ProofCta's UTM logic added in Task 3 Step 2). Task 5 after Task 1.
- **Type consistency:** `mapRow`/`authorized`/`clampLimit`/`ExportRow` names match between Task 1's test and impl. `ProofCta` props (`type`,`slug`,`receipt`) and `OfferSlot` props (`offer`,`heading`,`dek`,`source`,`label`,`buttonText`) match the real interfaces grepped from source. `receiptForProduct(type, slug)` is introduced consistently in Task 4 Steps 2 and 3.
- **Placeholders:** the only deliberately-deferred values are (a) the exact `view.type`/`detail.slug` variable names (Task 3 Step 1 + Task 4 Step 1 require grepping the layout to confirm, flagged as audit steps, not silent gaps) and (b) the A18 product->receipt map (Task 4 Step 1 derives it from `proof.ts` by rule, since inventing it would violate receipt-honesty). Both are explicit discovery steps with a defined method.
