# Marketing Funnel Work Queue — A16 + title-tag + A17 + A18

Date: 2026-06-27
Relay ask: Mac→Website 2026-06-27 ("Post-launch demand-gen assessment", `strategy/orionfold-website/_RELAY.md`), asks A16 / title-tag quick-win / A17 / A18.

## Context

orionfold.com is traffic-positive post-launch (GA4 7d: +12.4% users; GSC 28d jumped to 19 clicks / 295 impressions / 6.4% CTR). But the capture middle is severed: the live opt-in form writes to Supabase and stops there — website-form leads never reach the marketing CRM (`marketing/leads/`, the single source of truth for every lead). This queue closes that seam (A16, the keystone) and tightens the on-page funnel (title-tag, A17, A18).

**Operator-ratified architecture (2026-06-27):** website demand-gen forms stay on Supabase. Do NOT reroute to beehiiv. The sinks split by channel: beehiiv = online-channel leads (Substack, Meta Ads); **Supabase = website demand-gen form leads**; both feed `leads/`. So A16 is an **ingestion seam, not a migration**.

**Boundary:** the website side OWNS the exposure (a read endpoint). Marketing OWNS the ingestion leg (the poller that pulls into `leads/`). This spec covers only the website side.

## Hard constraints (apply to every item)

- **No em-dashes** anywhere in any copy added by this work (operator directive, reaffirmed 2026-06-27; see [[website-copy-style]]). Use periods or commas. This is a blocking review check.
- Copy is humanized, grade 3–5 English, no AI tells.
- Public repo: no secrets in tracked files; edge-fn secrets read from env only (the `.claude/hooks/publish-guard.py` backstop enforces this).
- Deploy of `supabase/functions/*` is operator-gated. Static site changes ship on push to `main`.

---

## Item 1 — A16: `waitlist-export` cursor-poll edge fn  [P0 keystone]

### Problem

`/proof/` (and the A6 `OfferSlot` on letters/stories) captures land in the Supabase `waitlist` table and stop there. Marketing's poller has no way to pull them, so the +12% traffic lift captures 0 owned contacts.

### Design

A new **read-only** Supabase edge fn `supabase/functions/waitlist-export/index.ts` that marketing's poller calls to pull captures. Mirrors the existing beehiiv read leg (`marketing/crm/lib/beehiiv.py`): a cursor-poll GET, auth header out, the website side returns rows and persists nothing new.

**Auth.** A shared bearer secret `WAITLIST_EXPORT_TOKEN` (Supabase fn env var, set by operator via `supabase secrets set`, never in tracked files). Read from `Authorization: Bearer <token>`; constant-time compare; `401` on mismatch or absence. This is server-to-server from marketing's box, so it does NOT use the browser CORS allowlist (`_shared/cors.ts` stays for the browser-facing fns only).

**Request.** `GET ?since=<ISO8601 cursor>&limit=<n>`
- `since` optional; absent = bootstrap from the beginning (poller's first run).
- `limit` default 500, hard-capped at 1000.

**Response.** `200` JSON:
```
{
  "rows": [
    {
      "email": "<string>",
      "offer": "<string|null>",
      "consent_text": "<string|null>",
      "captured_at": "<ISO8601>",        // = waitlist.created_at
      "utm_source": "<string|null>",
      "utm_medium": "<string|null>",
      "utm_campaign": "<string|null>",
      "utm_content": "<string|null>",
      "utm_term": "<string|null>",
      "double_optin": "pending" | "confirmed"   // = waitlist.confirmed ? "confirmed" : "pending"
    }
  ],
  "next_cursor": "<ISO8601 | null>"   // max created_at in this page, or null if empty
}
```
Query: `select(...).gt("created_at", since).order("created_at", asc).limit(limit)`. The poller advances `since` to `next_cursor` each call → monotonic, idempotent, no missed/duplicate rows (ties on identical `created_at` are accepted as a rare benign re-pull; the poller dedupes by email on its side, same as beehiiv).

**The `leads/` field mapping** (documented in the fn header + relay handback so marketing builds the ingestion leg to it):
- `email` → contact id
- `offer` → `source.campaign` (also drives stage)
- `consent_text` → `consent.scope`
- `captured_at` → `consent.captured_at`
- `utm_*` → `source.campaign` round-trip
- `double_optin` → `consent.double_optin`
- fixed: `source.origin: website`, `consent.basis: website-optin`

**Privacy.** Email (PII) leaves ONLY to the authenticated poller over TLS — same trust boundary as the beehiiv leg. The `metadata` JSONB overflow is NOT exported (keeps the surface tight; promote a field to a top-level column if it ever needs to ship). Never place PII in URL/query params (the `since` cursor is a timestamp, not PII).

### Components

- `supabase/functions/waitlist-export/index.ts` — the fn.
- `supabase/functions/waitlist-export/index.test.ts` — Deno tests: (1) 401 on missing/wrong token; (2) bootstrap (no `since`) returns rows + `next_cursor`; (3) cursor pagination advances correctly; (4) `double_optin` maps `confirmed` bool → string; (5) empty page returns `{rows:[], next_cursor:null}`; (6) `limit` cap enforced. Same `_shared`-seam discipline as `lead-input.test.ts`.

### Isolation

Fully independent — no UI, no other item depends on it. Build + test first. Deploy is operator-gated (`supabase functions deploy waitlist-export` + `supabase secrets set WAITLIST_EXPORT_TOKEN=…`).

### Verification

Deno tests green; local serve + curl with/without the token (401 path + a real page); confirm no row mutation (read-only). After operator deploys: one live curl from the marketing box validates the contract end-to-end.

---

## Item 2 — Title-tag quick-win  [P1, trivial]

### Problem

The homepage `<title>` still reads the OLD positioning: `'Orionfold · private AI capability for small teams'`. The whole page is Proof-led now; the title tag is the single highest-visibility AEO/SERP string on a domain whose entire priority layer is AEO. It contradicts the spear.

### Design

Two one-line edits:
- `src/layouts/Layout.astro:25` — default `title` → `'Orionfold · Prove which AI you can trust'`.
- `src/data/seo.ts:13` — the default meta description → a Proof-led line, grade 3–5, **no em-dashes**, e.g.:
  > `Run real AI on your own machine and check the receipts yourself. Prove which AI you can trust. Rerun it, never take our word for it.`

Only the homepage uses the *default* title/description; per-page titles are unaffected (verify this assumption holds — grep for pages that override vs inherit).

### Verification

Build; confirm the homepage `<title>` and `<meta name="description">` render the new strings; confirm no per-page title regressed. Em-dash check on both strings.

---

## Item 3 — A17: OfferSlot opt-in + proof-bridge UTM on detail pages  [P1]

### ⚠️ Scope correction (audit first)

A4 (shipped `5447f85`) ALREADY added a `ProofCta` band linking to `/proof/` on every software + model detail page. A10 (`418783b`) added the A6 `OfferSlot` to letters/stories. So A17 is NOT "add a Proof CTA" — that exists. A17's real delta on model/software detail pages is:

1. **The A6 `OfferSlot` opt-in** (if not already present on these pages — AUDIT; books got the CTA in A10 but detail-page opt-in coverage must be checked, no duplicate capture cards).
2. **The `proof-bridge` UTM** on the existing `ProofCta` link (so cross-property attribution lines up with ainative.business's `proof-bridge` campaign).
3. **Persona-matched CTA copy** in the P0 builder voice (the A4 band copy is honesty-gradient generic; A17 sharpens it for the local-AI builder).

The executing session MUST audit each detail-page family first (read the `.astro` for software + model detail pages) and fill only real gaps — same discipline A10 used (it found the premise partly stale and filled only real gaps with no duplicated capture cards).

### Design

- **OfferSlot** on model + software detail pages, `offer="proof-playbook"` (reuses the existing offer-aware confirmation-email variant — no new email copy). Heading/dek/consent per the A6 `OfferSlot` props. Do NOT add a second opt-in where one already exists.
- **CTA copy** (no em-dashes): `Think a small local model can beat the frontier ones? We proved it. Rerun it yourself, do not take our word for it.`
- **UTM** on the `/proof/` link: `utm_source=orionfold&utm_medium=cross-sell&utm_campaign=proof-bridge&utm_content=model-<slug>` (or `software-<slug>`).

### Verification

Build clean both themes; each detail page has exactly one opt-in (no dup, `formCount=1`); the `/proof/` link carries the proof-bridge UTM with the correct per-page `utm_content`; no console errors.

---

## Item 4 — A18: wire bands to specific receipts  [P2, depends on A17]

### Problem

A11 gave `ProofCta.astro` / `ProofBand.astro` an optional `receipt` prop, but no caller passes it — every band falls back to `/proof/` top.

### Design

Where a product page maps cleanly to a specific receipt, pass `receipt=<slug>` so the reader lands on the exact `/receipts/<slug>/` instead of the wall.
- **Discovery step (not hardcoded):** derive the model/software-slug → receipt-slug mapping by reading `src/data/proof.ts` receipt slugs against the model/software slugs. Only pass the prop where a clean 1:1 mapping exists.
- Where no clean mapping exists, leave the `/proof/` fallback (receipt-honesty: no invented deep-links).

### Sequencing

Rides on A17's wired bands → sequenced AFTER A17 in the plan.

### Verification

The bands that map to a receipt emit `/receipts/<slug>/`; the rest still emit `/proof/`; no regression on the ~47 band pages A11 verified.

---

## Build order (plan will detail)

1. **A16** — independent, edge fn + tests. Build first.
2. **Title-tag** — independent, trivial. Any time.
3. **A17** — audit detail pages → fill gaps. After A16/title (no dep, just ordering).
4. **A18** — after A17 (needs the wired bands).

A16 deploy + secret are operator-gated. The rest ship on push. Relay handback to marketing on A16 (the field contract) so they build the ingestion leg.
