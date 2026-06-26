# A6 — Future-proof reusable opt-in slot + attributable lead funnel

Date: 2026-06-26
Relay ask: A6 (single-product pivot set, `strategy/orionfold-website/_RELAY.md`)
Status: design approved, pre-implementation

## Problem

A6 asks for a reusable "honeypot-offer slot" (offer name, companion artifact, consent copy, UTM, destination) built off the existing `WaitlistForm.astro`, AND a decision on funnel reconciliation. The operator already settled the funnel question: **keep the Supabase double-opt-in funnel** (beehiiv→poller→`leads/` stays separate). What remains is the slot — but investigation showed the deeper gap.

### What the funnel actually does today (verified in code)

| Layer | Reality |
|---|---|
| `WaitlistForm.astro` | POSTs `{ email, website (honeypot), source }` |
| `waitlist-signup` edge fn | Destructures **only** `{ email, website }`. `source` is silently dropped. |
| `waitlist` table | `email, confirmed, confirm_token, created_at, confirmed_at, ip_address, user_agent` — **no attribution column** |
| `confirm-email` fn | Flips `confirmed=true` + `confirmed_at`; redirects `/?confirmed=1` |

So **zero marketing attribution survives end-to-end.** For a demand-funnel pivot whose whole purpose is knowing *which offer / which deep page / which campaign* converted, that is the real gap — not form ergonomics.

### The "DO NOT change payload shape" constraint is self-imposed

The comment in `WaitlistForm.astro` landed in commit `f35165d` (initial site build, ported from the donor template). It was a porting-safety note, not an architectural decision. We replace the frozen contract with an **evolvable** one.

## Goal

Make the funnel **attributable and future-proof end-to-end**, and ship a **reusable `OfferSlot.astro`** so A10 can drop a consistent next-step capture on deep pages. Future attribution fields must require **no migration and no edge-fn redeploy**.

## Architecture

```
OfferSlot.astro (new, reusable)
   → WaitlistForm.astro (extended: offer + UTM-from-URL + consent_text; richer POST)
   → waitlist-signup edge fn (rewritten: Zod safeParse, allowlist→columns, unknown→JSONB)
   → waitlist table (extended: + offer, utm_*, referrer, consent_text, metadata jsonb)
   → confirm-email fn (unchanged behavior; attribution persisted at submit, survives confirm)
   → [DEFERRED] Resend Audience projection on confirm + one-click unsubscribe
```

### Design principles (validated against current Supabase + Resend + compliance docs, 2026)

- **Hybrid schema.** Promote the stable, reported-on fields (offer + 5 UTM + referrer) to **typed columns** (b-tree indexed, direct `GROUP BY`); keep a **JSONB `metadata`** overflow (GIN `jsonb_path_ops`) for the volatile long tail. Rule of thumb: a key that appears constantly → column; sparse/experimental → JSONB. New field = zero migration.
- **Evolvable payload.** Zod `safeParse` validates a known core; `.catchall(z.unknown())` captures extras. Known UTM/offer → columns; unknown extras → `metadata`. Old deployed clients keep working (never remove/rename a field, never make an optional field required).
- **Consent provenance captured server-side.** `consent_ip`/`consent_ua` derive from request headers (forgeable in the body) — current fn already does this and persists to the **existing** `ip_address` / `user_agent` columns; we keep it (no new consent_ip/consent_ua columns). Store the verbatim `consent_text` + `offer` + `created_at` (submit) + `confirmed_at` (double-opt-in click) = the proof record GDPR/CASL want.
- **Data minimization.** Email-only capture; no name/company demanded. No pre-checked consent.

## Data model — one additive migration

New file `supabase/migrations/20260626000000_waitlist_attribution.sql`. Keep the existing `waitlist` table (renaming orphans live confirmed subscribers).

```sql
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

- All additive + nullable (except `metadata` which defaults `{}`), so existing rows and the still-live old function keep working during deploy.
- RLS stays deny-all; only the service-role edge fn writes.
- `ip_address` / `user_agent` / `confirmed_at` already present = consent provenance, kept as-is.

## Edge function — `waitlist-signup` rewrite

- **Zod `safeParse`** (`npm:zod@3`) on the body; `.catchall(z.unknown())` for forward-compat.
- Known fields → typed columns; remaining extras → `metadata` JSONB (allowlist-persist idiom).
- **Unchanged:** honeypot short-circuit, IP rate-limit (5/hr), existing-email dedup + token reissue, double-opt-in email send, CORS allowlist (`https://orionfold.com`).
- **IP/UA** derived server-side from headers (kept).
- **Backward-compatible:** old `{email, website, source}` still validates; `source` falls into catchall→`metadata.source`. No deployed page breaks.
- **from-name fix:** `"Orionfold Studio <…>"` → `"Orionfold <…>"` per drop-studio-framing — **swept across all 5 edge functions** that carry it (`waitlist-signup`, `stripe-webhook` ×2, `enquiry-submit`, `customer-portal`). All require redeploy to take effect; only the from-name string changes.

### Payload contract (the evolvable seam)

```ts
const LeadInput = z.object({
  email:        z.string().email(),
  website:      z.string().optional(),        // honeypot
  offer:        z.string().max(120).optional(),
  utm_source:   z.string().max(200).optional(),
  utm_medium:   z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  utm_term:     z.string().max(200).optional(),
  utm_content:  z.string().max(200).optional(),
  referrer:     z.string().max(2048).optional(),
  consent_text: z.string().max(2000).optional(),
}).catchall(z.unknown());                       // unknown extras → metadata JSONB
```

Insert: known columns from parsed core; `metadata` = `{ ...unknownExtras }` (excludes the known keys). A future field a new page sends appears in `metadata` automatically — no redeploy.

## Reusable component — `src/components/ui/OfferSlot.astro`

Wraps `WaitlistForm`, presents the offer + companion artifact + consent UI.

| Prop | Type | Purpose |
|---|---|---|
| `offer` | string (required) | named offer → `offer` column (e.g. `"proof-playbook"`) |
| `heading` | string | the pitch headline |
| `dek` | string | sub-line |
| `artifact` | string? | companion-artifact line ("Get the 1-page playbook") |
| `consentText` | string? | verbatim consent copy → stored; compliant default supplied |
| `destination` | string? | post-confirm CTA target (default `/proof/`) |
| `source` | string? | logical placement id → `metadata.source` |
| `class` | string? | layout passthrough |

- **Consent UI:** visible consent line + link to `/privacy`, no pre-checked box, email-only.
- Default `consentText`: e.g. *"By subscribing you agree to receive occasional Orionfold emails. Unsubscribe any time. See our privacy policy."* (final wording in plan).

### `WaitlistForm.astro` extension

- New optional props: `offer`, `consentText`, `destination`.
- Client script reads `utm_*` from `window.location.search` at submit time, plus `referrer` from `document.referrer`, and POSTs the richer body (email, website, offer, utm_*, referrer, consent_text, source).
- **`StorySubscribe.astro` keeps working** — it passes none of the new props → those fields are null. No behavior change for the existing story-subscribe capture.
- The old header comment "DO NOT change payload shape" is replaced with a note describing the evolvable contract.

## Scope fence (this session)

**Build + deploy now:**
1. Migration (additive).
2. `waitlist-signup` rewrite (Zod + allowlist→JSONB).
3. from-name sweep across all 5 edge functions.
4. `WaitlistForm.astro` extension.
5. New `OfferSlot.astro`.
6. Wire `OfferSlot` onto `StorySubscribe` (or a single proof placement) to prove composition.

**Designed-for, DEFERRED (flagged, separate verify loop — NOT built now):**
- Resend Audience projection on confirm (keep Postgres as consent SSOT; project only *confirmed* contacts; mirror unsubscribes back).
- One-click unsubscribe endpoint + `List-Unsubscribe` / `List-Unsubscribe-Post` headers + idempotency key on the Resend send.
- A10 drops `OfferSlot` across deep pages.

## Verification

- **Deno test** on the edge-fn parse/allowlist logic (known→columns, unknown→metadata, honeypot, bad email → 400, backward-compat old payload).
- `npm run build` clean (68pp).
- `supabase functions deploy` + migration push to live; **verify live submit end-to-end** (real submit CORS-fails from localhost by design — verified against `https://orionfold.com`).
- Confirm a test row lands with attribution columns + `metadata` populated; confirm-email flips `confirmed_at` and attribution survives.
- `scripts/check_agent_parity.py` green if CLAUDE.md touched (not expected).

## Compliance checklist (carry into implementation)

- [ ] Consent text visible at submit + `/privacy` link; no pre-checked box; email-only (minimization).
- [ ] Store verbatim `consent_text` + `offer`.
- [ ] Store `created_at`/`consent_at` (submit) + `confirmed_at` (double-opt-in click).
- [ ] Store `ip_address` + `user_agent` server-side (provenance).
- [ ] (Deferred) working unsubscribe + physical address in any future marketing Broadcast; mirror suppression to the SSOT.

## Out of scope

- beehiiv→poller→`leads/` reconciliation (operator settled: stays separate).
- Touching commerce / Stripe / secrets / the enquiry funnel beyond the from-name string.
- A10 deep-page rollout (depends on this, lands later).

## Risks / notes

- **Live backend change** on a public repo + LIVE funnel. Migration is additive (safe); edge-fn rewrite is backward-compatible (old payload still validates). Deploy verified step-by-step.
- Resend shares one stream for transactional + broadcast (no Postmark-style separation) → when the deferred Audience/Broadcast work lands, keep `waitlist` as consent SSOT so an ESP switch never loses proof-of-consent.
- `metadata` is the future-proof seam: resist promoting every new field to a column; promote only when a key proves durable and reported-on.
