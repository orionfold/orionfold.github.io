# A6 — Future-proof reusable opt-in slot + attributable lead funnel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Supabase double-opt-in lead funnel attributable and future-proof end-to-end, and ship a reusable `OfferSlot.astro` wired onto `/proof/`.

**Architecture:** A pure, unit-tested `parseLeadInput()` module in `supabase/functions/_shared/` validates an evolvable payload (Zod `safeParse` + `.catchall`), routing known fields to typed columns and unknown extras to a JSONB `metadata` column. The `waitlist-signup` edge fn uses it; an additive migration extends the `waitlist` table; `WaitlistForm.astro` is extended to send offer + UTM (read from the URL) + consent text; a new `OfferSlot.astro` wraps it and is placed on `/proof/`.

**Tech Stack:** Astro (static), Supabase Edge Functions (Deno/TypeScript), Postgres, Zod (`npm:zod@3`), Resend, Deno test (`deno.land/std@0.224.0/assert`).

> **Note for the implementer:** this is a PUBLIC repo with a publish-guard PreToolUse hook that flags any identifier ending in Token, Key, or Secret when it is assigned a 16-plus-character literal. The waitlist function already contains such a line (a randomUUID call assigned to a token variable). Where this plan says to keep existing token-generation lines, leave them exactly as they are in the file; edit around them rather than retyping them through a fresh Write.

## Global Constraints

- **Public repo = publishing.** No secrets/PII/keys in tracked files; only `manav@orionfold.com` as an email. The `.claude/hooks/publish-guard.py` PreToolUse hook backstops this.
- **Copy rules:** humanize, grade 3–5 English, no em-dashes / AI tells. Orionfold is a "startup", never a "studio" ([[drop-studio-framing]]).
- **Work on `main` only.** Commit + push directly to main; NEVER branch/PR/worktree ([[work-on-main-no-worktrees]]).
- **Live funnel + live backend.** Migration must be additive (existing rows + still-live old fn keep working during deploy). Edge-fn rewrite must be backward-compatible (old `{email, website, source}` payload still validates).
- **Stripe/commerce/enquiry funnel/secrets:** out of scope except the literal `from`-name string sweep.
- **Edge-fn shared logic idiom:** pure logic into a `_shared/*.ts` module (no `Deno.serve`/IO); a `*.test.ts` imports it; run with `deno test <path>`. Std assert from `https://deno.land/std@0.224.0/assert/mod.ts`.
- **Edge-fn CORS allowlist** is `https://orionfold.com` only, so a real submit CORS-fails from localhost by design; full live submit verified post-deploy against the prod origin.

---

### Task 1: Additive migration — attribution columns on `waitlist`

**Files:**
- Create: `supabase/migrations/20260626000000_waitlist_attribution.sql`

**Interfaces:**
- Produces: `waitlist` table gains columns `offer text`, `utm_source text`, `utm_medium text`, `utm_campaign text`, `utm_term text`, `utm_content text`, `referrer text`, `consent_text text`, `metadata jsonb NOT NULL DEFAULT '{}'::jsonb`; plus three indexes. Task 3 (edge fn) writes these.

- [ ] **Step 1: Write the migration file**

```sql
-- A6: attribution + consent provenance on the lead-capture table.
-- Additive + nullable (metadata defaults '{}') so existing rows and the still-live
-- old waitlist-signup function keep working during deploy. RLS stays deny-all;
-- only the service-role edge fn writes. Hybrid schema: typed columns for the
-- fields marketing reports on constantly (offer + 5 UTM + referrer); a JSONB
-- metadata overflow for the volatile long tail (new field = zero migration).
ALTER TABLE public.waitlist
  ADD COLUMN offer        text,
  ADD COLUMN utm_source   text,
  ADD COLUMN utm_medium   text,
  ADD COLUMN utm_campaign text,
  ADD COLUMN utm_term     text,
  ADD COLUMN utm_content  text,
  ADD COLUMN referrer     text,
  ADD COLUMN consent_text text,
  ADD COLUMN metadata     jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX idx_waitlist_offer    ON public.waitlist (offer)        WHERE offer IS NOT NULL;
CREATE INDEX idx_waitlist_campaign ON public.waitlist (utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX idx_waitlist_metadata ON public.waitlist USING gin (metadata jsonb_path_ops);
```

- [ ] **Step 2: Sanity-check SQL parses locally (no DB needed)**

Run: `grep -c "ADD COLUMN" supabase/migrations/20260626000000_waitlist_attribution.sql`
Expected: `9`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260626000000_waitlist_attribution.sql
git commit -m "feat(funnel): additive waitlist attribution + metadata columns (A6)"
```

(Deploy of this migration happens in Task 8, after the code is in place.)

---

### Task 2: Pure `parseLeadInput()` module + unit tests

**Files:**
- Create: `supabase/functions/_shared/lead-input.ts`
- Test: `supabase/functions/_shared/lead-input.test.ts`

**Interfaces:**
- Produces:
  - `parseLeadInput(body: unknown, headers: Headers): { ok: true; columns: LeadColumns; metadata: Record<string, unknown> } | { ok: false; error: string }`
  - `type LeadColumns = { email: string; offer: string | null; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; utm_term: string | null; utm_content: string | null; referrer: string | null; consent_text: string | null; ip_address: string; user_agent: string; }`
  - `isHoneypotTripped(body: unknown): boolean`
  - Task 3 (edge fn) consumes both.
- Consumes: nothing from earlier tasks.

- [ ] **Step 1: Write the failing tests**

```ts
// Unit lock for the A6 evolvable lead payload. Guards: email validation,
// known-fields-to-columns, unknown-extras-to-metadata (the future-proof seam),
// honeypot detection, server-side IP/UA derivation, and backward-compat with
// the legacy {email, website, source} payload (source must land in metadata).
//
// Run: deno test supabase/functions/_shared/lead-input.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isHoneypotTripped, parseLeadInput } from "./lead-input.ts";

function hdrs(ip = "203.0.113.7", ua = "test-agent") {
  return new Headers({ "x-forwarded-for": ip, "user-agent": ua });
}

Deno.test("rejects a missing/invalid email", () => {
  const r = parseLeadInput({ email: "not-an-email" }, hdrs());
  assert(!r.ok);
});

Deno.test("known fields land in columns", () => {
  const r = parseLeadInput(
    { email: "A@Example.com ", offer: "proof-playbook", utm_source: "x", consent_text: "I agree" },
    hdrs(),
  );
  assert(r.ok);
  assertEquals(r.columns.email, "a@example.com");
  assertEquals(r.columns.offer, "proof-playbook");
  assertEquals(r.columns.utm_source, "x");
  assertEquals(r.columns.consent_text, "I agree");
});

Deno.test("unknown extras land in metadata, not columns", () => {
  const r = parseLeadInput(
    { email: "a@b.com", offer: "o", experiment_arm: "B", deep_page: "/proof/" },
    hdrs(),
  );
  assert(r.ok);
  assertEquals(r.metadata, { experiment_arm: "B", deep_page: "/proof/" });
});

Deno.test("legacy {source} payload stays backward-compatible (source to metadata)", () => {
  const r = parseLeadInput({ email: "a@b.com", website: "", source: "home" }, hdrs());
  assert(r.ok);
  assertEquals(r.metadata, { source: "home" });
  // website is the honeypot field and must NOT leak into metadata
  assertEquals("website" in r.metadata, false);
});

Deno.test("ip + ua are derived server-side from headers, never the body", () => {
  const r = parseLeadInput(
    { email: "a@b.com", ip_address: "1.1.1.1", user_agent: "evil" },
    hdrs("203.0.113.7", "real-agent"),
  );
  assert(r.ok);
  assertEquals(r.columns.ip_address, "203.0.113.7");
  assertEquals(r.columns.user_agent, "real-agent");
  // forged body ip/ua must not survive as columns; they fall to metadata harmlessly
  assert(r.metadata.ip_address === "1.1.1.1");
});

Deno.test("missing optional fields are null, not undefined", () => {
  const r = parseLeadInput({ email: "a@b.com" }, hdrs());
  assert(r.ok);
  assertEquals(r.columns.offer, null);
  assertEquals(r.columns.utm_campaign, null);
  assertEquals(r.columns.referrer, null);
});

Deno.test("honeypot detection is independent of parse", () => {
  assert(isHoneypotTripped({ email: "a@b.com", website: "bot" }));
  assert(!isHoneypotTripped({ email: "a@b.com", website: "" }));
  assert(!isHoneypotTripped({ email: "a@b.com" }));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `deno test supabase/functions/_shared/lead-input.test.ts`
Expected: FAIL — `Module not found "./lead-input.ts"`

- [ ] **Step 3: Write the module**

```ts
// A6 — evolvable lead payload parser (the future-proof seam).
//
// Splits IO from logic the same way license-payload.ts splits from license.ts:
// the edge function does Deno.serve + DB IO; THIS does pure validation/routing
// and is unit-tested without a server. Contract rules (forward-compatible):
//   - Never remove/rename a field; never make an optional field required.
//   - Known fields  -> typed columns.
//   - Unknown extras -> metadata JSONB (so a new front-end field needs NO redeploy).
//   - ip/user_agent are derived SERVER-SIDE from headers (body values are forgeable).
import { z } from "npm:zod@3";

export type LeadColumns = {
  email: string;
  offer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer: string | null;
  consent_text: string | null;
  ip_address: string;
  user_agent: string;
};

export type ParseResult =
  | { ok: true; columns: LeadColumns; metadata: Record<string, unknown> }
  | { ok: false; error: string };

// Known top-level keys: the honeypot + every field that maps to a typed column.
// Anything NOT here is an "unknown extra" routed to metadata JSONB.
const KNOWN_KEYS = new Set([
  "email", "website",
  "offer", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "referrer", "consent_text",
]);

const LeadInput = z.object({
  email: z.string().email(),
  website: z.string().optional(), // honeypot
  offer: z.string().max(120).optional(),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  utm_term: z.string().max(200).optional(),
  utm_content: z.string().max(200).optional(),
  referrer: z.string().max(2048).optional(),
  consent_text: z.string().max(2000).optional(),
}).catchall(z.unknown());

export function isHoneypotTripped(body: unknown): boolean {
  return typeof body === "object" && body !== null &&
    typeof (body as Record<string, unknown>).website === "string" &&
    (body as Record<string, unknown>).website !== "";
}

export function parseLeadInput(body: unknown, headers: Headers): ParseResult {
  const parsed = LeadInput.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  const d = parsed.data;

  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("cf-connecting-ip") ||
    "unknown";
  const userAgent = headers.get("user-agent") || "";

  const metadata: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(d)) {
    if (!KNOWN_KEYS.has(k)) metadata[k] = v;
  }

  return {
    ok: true,
    columns: {
      email: d.email.trim().toLowerCase(),
      offer: d.offer ?? null,
      utm_source: d.utm_source ?? null,
      utm_medium: d.utm_medium ?? null,
      utm_campaign: d.utm_campaign ?? null,
      utm_term: d.utm_term ?? null,
      utm_content: d.utm_content ?? null,
      referrer: d.referrer ?? null,
      consent_text: d.consent_text ?? null,
      ip_address: ip,
      user_agent: userAgent,
    },
    metadata,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `deno test supabase/functions/_shared/lead-input.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/lead-input.ts supabase/functions/_shared/lead-input.test.ts
git commit -m "feat(funnel): pure evolvable lead-input parser + unit tests (A6)"
```

---

### Task 3: Rewrite `waitlist-signup` to use the parser + persist attribution

**Files:**
- Modify: `supabase/functions/waitlist-signup/index.ts`

**Interfaces:**
- Consumes: `parseLeadInput`, `isHoneypotTripped` from Task 2; the new columns from Task 1.
- Produces: an edge fn that inserts the attribution columns + `metadata` and updates the same on token reissue. Response shape unchanged (`{ success, message?, already_confirmed? }`). **Keep the existing token-generation lines untouched** (see the publish-guard note in the header).

- [ ] **Step 1: Add the shared import**

Add a second import line directly under the existing `createClient` import at the top of the file:

```ts
import { isHoneypotTripped, parseLeadInput } from "../_shared/lead-input.ts";
```

- [ ] **Step 2: Replace the body-parse + honeypot + email-validation block**

Inside the `try`, replace the current body-read / `const { email, website } = body;` / honeypot / email-regex / `cleanEmail` section (current lines 45–57) with:

```ts
    const body = await req.json().catch(() => null);

    // Honeypot — bots fill hidden fields. Pretend success.
    if (isHoneypotTripped(body)) {
      return jsonResponse({ success: true }, corsHeaders);
    }

    const parsed = parseLeadInput(body, req.headers);
    if (!parsed.ok) {
      return jsonResponse({ error: parsed.error }, corsHeaders, 400);
    }
    const { columns, metadata } = parsed;
    const cleanEmail = columns.email;
```

- [ ] **Step 3: Remove the now-dead manual ip/userAgent derivation; point the rate-limit at `columns.ip_address`**

Delete the standalone `const ip = req.headers...` block (current lines 64–67) and the later `const userAgent = req.headers.get("user-agent") || "";` line (current line 114). Change the rate-limit query's `.eq("ip_address", ip)` to:

```ts
      .eq("ip_address", columns.ip_address)
```

- [ ] **Step 4: Add attribution to the token-reissue update (returning unconfirmed lead)**

In the existing-email reissue branch, the code generates a fresh token (leave that generation line exactly as-is) and calls `.update({ ... })`. Extend that update object to also write the attribution, so it becomes (the first property keeps referencing the existing token variable):

```ts
        .update({
          confirm_token: newToken,
          offer: columns.offer,
          utm_source: columns.utm_source,
          utm_medium: columns.utm_medium,
          utm_campaign: columns.utm_campaign,
          utm_term: columns.utm_term,
          utm_content: columns.utm_content,
          referrer: columns.referrer,
          consent_text: columns.consent_text,
          metadata,
        })
        .eq("email", cleanEmail);
```

(Leave the token-variable generation line above this update unchanged.)

- [ ] **Step 5: Add attribution to the new-row insert**

The new-row branch generates a confirm token (leave that generation line unchanged) then calls `.insert({...})`. Replace the insert object's body so it carries the attribution (the `confirm_token` property keeps referencing the existing variable):

```ts
    const { error: insertError } = await supabase.from("waitlist").insert({
      email: cleanEmail,
      confirmed: false,
      confirm_token: confirmToken,
      ip_address: columns.ip_address,
      user_agent: columns.user_agent,
      offer: columns.offer,
      utm_source: columns.utm_source,
      utm_medium: columns.utm_medium,
      utm_campaign: columns.utm_campaign,
      utm_term: columns.utm_term,
      utm_content: columns.utm_content,
      referrer: columns.referrer,
      consent_text: columns.consent_text,
      metadata,
    });
```

- [ ] **Step 6: Fix the from-name (drop-studio-framing)**

Change the `from:` line (current line ~153) to drop the word Studio:

```ts
      from: "Orionfold <manav@updates.orionfold.com>",
```

- [ ] **Step 7: Type-check the function with Deno**

Run: `deno check supabase/functions/waitlist-signup/index.ts`
Expected: no errors (exit 0).

- [ ] **Step 8: Re-run the parser tests (regression guard)**

Run: `deno test supabase/functions/_shared/lead-input.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 9: Commit**

```bash
git add supabase/functions/waitlist-signup/index.ts
git commit -m "feat(funnel): waitlist-signup persists attribution via evolvable parser (A6)"
```

---

### Task 4: from-name sweep across the remaining 4 edge functions

**Files:**
- Modify: `supabase/functions/stripe-webhook/index.ts` (two occurrences), `supabase/functions/enquiry-submit/index.ts`, `supabase/functions/customer-portal/index.ts`

**Interfaces:** none (string-only change).

- [ ] **Step 1: Replace every remaining occurrence**

Run:
```bash
cd /Users/manavsehgal/orionfold/website
grep -rl 'Orionfold Studio <manav@updates.orionfold.com>' supabase/functions/ \
  | xargs sed -i '' 's/Orionfold Studio <manav@updates.orionfold.com>/Orionfold <manav@updates.orionfold.com>/g'
```

- [ ] **Step 2: Verify zero remain**

Run: `grep -rn 'Orionfold Studio' supabase/functions/`
Expected: no output (grep exits 1 = none found).

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/stripe-webhook/index.ts supabase/functions/enquiry-submit/index.ts supabase/functions/customer-portal/index.ts
git commit -m "fix(email): drop 'Studio' from sender name across edge functions (drop-studio-framing)"
```

---

### Task 5: Extend `WaitlistForm.astro` — new props + URL-derived UTM

**Files:**
- Modify: `src/components/ui/WaitlistForm.astro`

**Interfaces:**
- Consumes: the edge fn from Task 3 (accepts the richer payload).
- Produces: `WaitlistForm` accepts new optional props `offer?: string`, `consentText?: string`; its client script reads `utm_*` from `location.search` + `referrer` from `document.referrer` and POSTs them. `StorySubscribe` (which passes none) keeps working unchanged. Task 6 (`OfferSlot`) consumes these props.

- [ ] **Step 1: Add props to the frontmatter `interface Props` and destructure**

Add to `interface Props` (after `watchConfirmed?: boolean;`):

```ts
  offer?: string;
  consentText?: string;
```

Add to the destructure defaults (after `watchConfirmed = false,`):

```ts
  offer = '',
  consentText = '',
```

- [ ] **Step 2: Replace the header comment's frozen-contract note**

Replace the two comment lines that currently say not to change the endpoint or payload shape (current lines 7–8) with:

```
//      The payload is EVOLVABLE: the edge fn validates a known core (Zod) and
//      routes unknown extra fields into a metadata JSONB column, so adding a new
//      field here never breaks a deployed page and needs no fn redeploy.
//      See docs/superpowers/specs/2026-06-26-a6-reusable-offer-slot-design.md.
```

- [ ] **Step 3: Thread `offer` + `consentText` into the inline script's `define:vars`**

Change the `<script define:vars={{ formId, source, successMessage, watchConfirmed }}>` opening to:

```astro
<script define:vars={{ formId, source, successMessage, watchConfirmed, offer, consentText }}>
```

- [ ] **Step 4: Build the richer POST body in the submit handler**

The submit handler currently passes the body inline as `{ email, website: honeypot.value, source }`. Build a `payload` object just above the `fetch` call instead:

```js
        const params = new URLSearchParams(location.search);
        const utm = {};
        for (const k of ['utm_source','utm_medium','utm_campaign','utm_term','utm_content']) {
          const v = params.get(k);
          if (v) utm[k] = v;
        }
        const payload = {
          email,
          website: honeypot.value,
          source,
          referrer: document.referrer || undefined,
          ...(offer ? { offer } : {}),
          ...(consentText ? { consent_text: consentText } : {}),
          ...utm,
        };
```

…and change the fetch's body to `body: JSON.stringify(payload),`.

- [ ] **Step 5: Build to confirm the component still compiles + StorySubscribe unaffected**

Run: `npm run build`
Expected: build succeeds, 68 pages (same page count as before — no new route).

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/WaitlistForm.astro
git commit -m "feat(funnel): WaitlistForm sends offer + URL UTM + consent text (A6)"
```

---

### Task 6: New `OfferSlot.astro` reusable component

**Files:**
- Create: `src/components/ui/OfferSlot.astro`

**Interfaces:**
- Consumes: `WaitlistForm` (Task 5) props `offer`, `consentText`, `source`, `buttonText`, `successMessage`, `id`.
- Produces: `<OfferSlot offer heading dek artifact consentText source class />` — Task 7 places it on `/proof/`.

- [ ] **Step 1: Write the component**

```astro
---
// A6 — reusable opt-in slot. A soft email capture for visitors not ready to
// buy: an offer headline, a companion-artifact line, and a compliant consent
// note, all wrapping the live double-opt-in WaitlistForm. The offer + UTM (read
// from the URL by WaitlistForm) + the verbatim consent text are persisted as
// lead attribution. Drop it on any deep page (A10).
import SectionLabel from './SectionLabel.astro';
import WaitlistForm from './WaitlistForm.astro';

interface Props {
  offer: string;                 // named offer -> `offer` column (e.g. "proof-playbook")
  heading: string;
  dek?: string;
  artifact?: string;             // companion-artifact line
  consentText?: string;          // verbatim consent copy -> stored
  source?: string;               // logical placement id -> metadata.source
  label?: string;                // eyebrow label
  buttonText?: string;
  successMessage?: string;
  class?: string;
}

const {
  offer,
  heading,
  dek,
  artifact,
  source = 'offer-slot',
  label = 'Stay in the loop',
  buttonText = 'Get it',
  successMessage = 'Check your inbox to confirm.',
  class: className,
  consentText = 'By subscribing you agree to receive occasional Orionfold emails. You can unsubscribe any time. See our privacy policy.',
} = Astro.props;
const privacyNote = consentText.replace(' See our privacy policy.', '');
---
<section class:list={['px-6 py-16', className]} aria-labelledby={`offer-${offer}-heading`}>
  <div class="mx-auto max-w-2xl">
    <div class="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.04] px-6 py-12 text-center sm:px-10">
      <div class="pointer-events-none absolute left-1/2 top-0 -z-10 h-48 w-[90%] -translate-x-1/2 rounded-full bg-primary/[0.06] blur-[80px]"></div>
      <SectionLabel text={label} />
      <h2 id={`offer-${offer}-heading`} class="mb-3 mt-4 leading-tight" style="font-size: clamp(1.6rem, 4vw, 2.2rem);">
        {heading}
      </h2>
      {dek && (
        <p class="mx-auto mb-2 max-w-md leading-relaxed text-text-muted">{dek}</p>
      )}
      {artifact && (
        <p class="mx-auto mb-8 max-w-md font-mono text-xs uppercase tracking-[0.18em] text-primary">{artifact}</p>
      )}
      <div data-animate style="transition-delay: 160ms">
        <WaitlistForm
          id={`offer-${offer}`}
          source={source}
          offer={offer}
          buttonText={buttonText}
          successMessage={successMessage}
          consentText={consentText}
        />
      </div>
      <p class="mx-auto mt-5 max-w-sm text-xs leading-relaxed text-text-dim">
        {privacyNote}{' '}
        <a class="underline underline-offset-2 hover:text-text-muted" href="/privacy/">See our privacy policy.</a>
      </p>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Build to confirm it compiles (not yet placed)**

Run: `npm run build`
Expected: build succeeds, 68 pages (component compiles even though unused; the real proof is Task 7).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/OfferSlot.astro
git commit -m "feat(funnel): reusable OfferSlot opt-in component (A6)"
```

---

### Task 7: Wire `OfferSlot` onto `/proof/`

**Files:**
- Modify: `src/pages/proof.astro`

**Interfaces:**
- Consumes: `OfferSlot` (Task 6).
- Produces: a Proof-specific opt-in between the "Proof in the field" stories and `<ProofBox />`.

- [ ] **Step 1: Import `OfferSlot`**

Add to the imports at the top of `proof.astro` (alongside the other `../components/...` imports):

```astro
import OfferSlot from '../components/ui/OfferSlot.astro';
```

- [ ] **Step 2: Place the slot immediately before `<ProofBox />`**

Insert right before the `<!-- Own the tool behind the receipts -->` comment + `<ProofBox />` (current lines 210–211):

```astro
    <!-- Soft opt-in: catch receipt-readers who aren't checkout-ready yet -->
    <OfferSlot
      offer="proof-playbook"
      source="proof-page"
      label="Not ready to buy?"
      heading="Get the proof playbook."
      dek="The one-page guide to locking a test, running it on your own desk, and reading the receipts. Plus a note when we publish new proof."
      artifact="One-page PDF + new-proof notes"
      buttonText="Send it"
    />
```

- [ ] **Step 3: Build + confirm the slot renders in the dist HTML**

Run: `npm run build && grep -c "offer-proof-playbook" dist/proof/index.html`
Expected: build succeeds (68 pages); grep returns a count `>= 1` (the form id appears).

- [ ] **Step 4: Visual check in the browser (both themes)**

Start dev if needed (`npm run dev`, log `/tmp/astro-dev-4321.log`), open `http://localhost:4321/proof/` via the Chrome MCP browser (curl can't reach localhost). Confirm: the slot renders between the stories and the buy block; consent line + privacy link present; legible in dark AND light theme (toggle in nav). A real submit CORS-fails from localhost — expected.

- [ ] **Step 5: Commit**

```bash
git add src/pages/proof.astro
git commit -m "feat(proof): soft opt-in slot before the buy block (A6)"
```

---

### Task 8: Deploy migration + functions to live Supabase, verify end-to-end

**Files:** none (deploy + verification). Operator decision: this session deploys + verifies.

- [ ] **Step 1: Push the migration to live**

Run: `supabase db push`
Expected: applies `20260626000000_waitlist_attribution.sql`; reports the new columns/indexes. The project is the live Orionfold Supabase (`orionfold.supabase.co`).

- [ ] **Step 2: Verify the columns exist**

Run (CLI or Supabase SQL editor):
`select column_name from information_schema.columns where table_name='waitlist' order by column_name`
Expected: includes `offer, utm_source, utm_medium, utm_campaign, utm_term, utm_content, referrer, consent_text, metadata`.

- [ ] **Step 3: Deploy the changed functions**

Run:
```bash
supabase functions deploy waitlist-signup
supabase functions deploy stripe-webhook
supabase functions deploy enquiry-submit
supabase functions deploy customer-portal
```
Expected: each reports a successful deploy.

- [ ] **Step 4: Live submit smoke test (real attribution round-trip)**

On the live page in a real browser: `https://orionfold.com/proof/?utm_source=plan-smoke&utm_campaign=a6-verify`, enter a test email you control, submit.
Expected: success message ("Check your inbox to confirm.").

- [ ] **Step 5: Confirm the row landed with attribution**

Run: `select email, offer, utm_source, utm_campaign, consent_text, metadata, confirmed from waitlist order by created_at desc limit 1`
Expected: `offer='proof-playbook'`, `utm_source='plan-smoke'`, `utm_campaign='a6-verify'`, `consent_text` populated, `metadata` contains `source='proof-page'`, `confirmed=false`.

- [ ] **Step 6: Confirm double-opt-in still works + attribution survives**

Click the confirmation link in the test inbox.
Expected: redirect to `/?confirmed=1`; re-run the query → same row now `confirmed=true`, `confirmed_at` set, attribution columns unchanged.

- [ ] **Step 7: Confirm the from-name fix is live**

Inspect the confirmation email's From header.
Expected: `Orionfold <manav@updates.orionfold.com>` (no "Studio").

- [ ] **Step 8: Final regression sweep + push**

Run:
```bash
deno test supabase/functions/_shared/lead-input.test.ts
npm run build
```
Expected: 7 tests PASS; build 68 pages clean. Then sweep the unpushed range for local-only filenames before pushing:
```bash
git log --name-only origin/main..HEAD
git push origin main
```
Expected: no local-only paths (CLAUDE.md, _TODOS.json, *HANDOFF*, audit-reports/, .env) in the range; push lands.

---

## Self-Review

**Spec coverage:**
- Hybrid schema (typed + JSONB) → Task 1.
- Evolvable payload (Zod + catchall, allowlist→JSONB, backward-compat) → Task 2 + Task 3.
- Server-side consent provenance (ip/ua from headers) → Task 2 (test + impl).
- from-name sweep all 5 → Task 3 (waitlist-signup) + Task 4 (other 4).
- `WaitlistForm` extension (offer, consent, URL UTM) + StorySubscribe unaffected → Task 5.
- `OfferSlot.astro` with all spec props → Task 6.
- `/proof/` placement before ProofBox → Task 7.
- Deploy + verify end-to-end (this session deploys, per operator) → Task 8.
- Deferred (Resend Audience, unsubscribe header/endpoint, A10 rollout) → explicitly NOT in any task.
- Compliance (visible consent + privacy link, no pre-checked box, email-only, store consent_text/timestamps/ip/ua) → Tasks 1/5/6 + verified in Task 8.

**Placeholder scan:** No TBD/TODO/"add error handling". Consent default wording is a concrete string in Task 6. All code shown in full.

**Type consistency:** `parseLeadInput` / `LeadColumns` / `isHoneypotTripped` + the `{ ok, columns, metadata }` shape are identical across Task 2 (def) and Task 3 (consume). `offer`/`consentText` prop names match across Task 5, 6, 7. Column names match across Task 1 (migration), Task 3 (insert/update), Task 8 (verify query).
