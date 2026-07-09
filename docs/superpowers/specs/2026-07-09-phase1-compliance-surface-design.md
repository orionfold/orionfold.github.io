# Phase-1 compliance surface (website half): design

_Design doc. 2026-07-09. Status: approved, ready for `writing-plans`._

## Why

Marketing is re-architecting demand-gen sends onto a single Orionfold-owned Resend pipe and retiring beehiiv (spec SSOT: `marketing/_SPECS/2026-07-09-marketing-owned-send-infrastructure-design.md`, Phase 1). beehiiv's daily pull-back used to flip both unsubscribes and hard bounces to `mailable:false`; once beehiiv is gone, the website must host the domain-tied compliance surface that replaces it. **Nothing broadcasts on Resend until this ships** (spec §Phasing P1).

Marketing has already built + tested the drain leg (`pull_suppressions.py`, 14 tests green, wired into `run_pipeline.sh`). It consumes ONE contract; this design builds the website half to match it exactly. Requested via `strategy/orionfold-website/_RELAY.md` #9 (2026-07-09).

## Contract verified against marketing's drain

`pull_suppressions.py` pages `suppressions-export` oldest-first and **matches CRM contacts by `email`** (never by `token`). The `token` field is carried in the export row shape but is not a join key on the marketing side. Therefore:

- The suppression table stores **`email` directly** on every row (both unsubscribe and bounce/complaint).
- `token` is echoed through for row-shape parity but is nullable and not required for the drain.
- `email_tokens` exists purely to keep PII out of the unsubscribe **URL**, not to be a suppression join key.

## Data model (2 tables, 1 migration)

```
email_tokens                          suppressions
  id           bigint pk               id            bigint pk
  email        text unique             email         text not null   (drain join key)
  token        text unique  (opaque)   token         text null       (echoed from email_tokens)
  created_at   timestamptz             reason        text check in (unsubscribe|bounce|complaint)
                                        suppressed_at timestamptz default now()
                                        index on suppressed_at        (cursor paging)
```

- `email_tokens`: mint-on-demand map, any email → stable opaque token (`crypto.randomUUID()`, mirroring `waitlist.confirm_token`). Idempotent upsert — reused across every send to that address.
- `suppressions`: written by both the `unsubscribe` and `resend-webhook` fns. Append-only; no DB-level dedup (the export is monotonic and marketing's drain is idempotent, so duplicate rows are harmless). `suppressed_at` is the cursor.

Both tables are service-role only (no RLS grant to anon/authenticated); the fns use the service-role key exactly like `confirm-email` / `waitlist-export`.

## Components

### 1. `unsubscribe` Supabase fn (new) — mirrors `confirm-email`

`verify_jwt = false`. Public URL: `https://orionfold.com/unsubscribe?t=<token>`.

- **GET** (link click): resolve `token → email` in `email_tokens`; insert suppression `reason:unsubscribe`; return a small HTML confirmation page (200). Not a redirect — the click comes from an email client, so we render "You're unsubscribed" in place.
- **POST** (RFC 8058 one-click; Gmail/Apple/Resend hit this automatically): same suppression write, return 200 empty body.
- Missing / unknown token: friendly page, still 200 — never leak whether a token exists.
- Idempotent: a re-click is a harmless second insert.

### 2. `resend-webhook` Supabase fn (new) — signature-verified callback

`verify_jwt = false`. Receives Resend event callbacks.

- Verify Resend's Svix-style signing headers (`svix-id` + `svix-timestamp` + `svix-signature`, HMAC-SHA256) against `RESEND_WEBHOOK_SECRET`. Bad/absent signature → 401.
- `email.bounced`, **hard bounces only** (gate on the bounce type/subType so transient soft bounces are ignored) → suppression `reason:bounce`.
- `email.complained` → suppression `reason:complaint`.
- Email is read straight from the event payload — no token lookup.
- Any other event type → 200 ignored (Resend retries on non-2xx).

### 3. `suppressions-export` read-only endpoint (new) — byte-for-byte `waitlist-export`

`verify_jwt = false`. Server-to-server, shared-credential (constant-time) auth.

```
GET https://lgnmmcxvwdnusvfpguvf.supabase.co/functions/v1/suppressions-export?since=<ISO>&limit=<n<=1000>
Authorization: Bearer <SUPPRESSIONS_EXPORT_TOKEN>
-> { rows: [{ email, token, reason, suppressed_at }], next_cursor: string|null }   // oldest-first
```

Cursor on `suppressed_at`; null `next_cursor` = caught up. Reuse the `authorized` / `clampLimit` / `json` helpers from `waitlist-export` verbatim, keep the `import.meta.main` guard so the logic is unit-testable.

### 4. Tokenized footer (cross-cutting) — `_shared/email-footer.ts` + new `_shared/email-tokens.ts`

`EMAIL_FOOTER` today is a static constant appended by 6 callers. It becomes a function of the recipient:

- **`_shared/email-tokens.ts` (new):** `getOrMintToken(supabase, email)` — idempotent upsert into `email_tokens`, returns the stable token. Unit-tested with a fake client.
- **`_shared/email-footer.ts`:** keep `EMAIL_FOOTER` as a fallback for any no-email context; add `footerFor(token)` (postal address + tokenized one-click link, keeps CAN-SPAM postal address + plain-language opt-out) and `footerForEmail(supabase, email)`.
- **Caller migration (6 sites):** each already has the recipient email + a supabase client, so swaps `${EMAIL_FOOTER}` → `${await footerForEmail(supabase, email)}`:
  - `stripe-webhook` (3 footer sites), `renewal-reminder`, `book-files`, `confirmation-email`.
  - `resend-send`: the one caller that is stateless today. It mints the token itself (given a service-role client used *only* to mint — it still writes no business data), so marketing's POST contract `{to, subject, text, html?, tags?}` stays unchanged. It also sets `List-Unsubscribe: <https://orionfold.com/unsubscribe?t=<token>>` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers on the Resend payload (spec §5). `resend-send` stays live transitionally.

**No behavior regression:** transactional receipts now carry a real one-click link. Unsubscribing suppresses *marketing* sends (gated on `mailable`); transactional receipts for a completed purchase are not `mailable`-gated and still send.

## Error handling

- Missing `SUPABASE_SERVICE_ROLE_KEY` / `SUPPRESSIONS_EXPORT_TOKEN` / `RESEND_WEBHOOK_SECRET` → fail closed (401/500), never a blind write or send.
- `unsubscribe`: token-resolution failure or DB error still returns a friendly 200 page (never leak; never 500 to an email client) but logs server-side and does NOT claim success it didn't achieve — a write failure is logged and surfaced in logs.
- `resend-webhook`: bad signature → 401; DB write failure → 500 so Resend retries.
- `suppressions-export`: DB error → 500 with `error.message` (matches `waitlist-export`).
- Footer token mint failure inside a send caller: fall back to the static `EMAIL_FOOTER` (reply-to-opt-out) rather than block the transactional email — the email must ship; a missing one-click link degrades to the manual opt-out, still CAN-SPAM compliant.

## Testing (Deno, `import.meta.main` guard)

- `unsubscribe`: token→email resolution; GET returns HTML page; POST returns 200 empty; missing/invalid token → 200 no-leak; suppression row shape `reason:unsubscribe`.
- `resend-webhook`: Svix signature valid passes / tampered fails 401; hard-bounce → `reason:bounce`; complaint → `reason:complaint`; soft-bounce ignored; unknown event → 200 ignored.
- `suppressions-export`: constant-time auth (401 on bad token); cursor paging oldest-first; `clampLimit`; row shape `{email, token, reason, suppressed_at}`.
- `email-tokens`: `getOrMintToken` idempotent (same email → same token).
- `email-footer`: `footerFor` contains the tokenized link + postal address.
- `resend-send`: extend existing suite — `List-Unsubscribe` + `List-Unsubscribe-Post` headers present; footer now tokenized.

## Config + deploy posture

- `config.toml`: three new `[functions.X]` blocks, each `verify_jwt = false` ([[supabase-edge-fn-verify-jwt-footgun]]).
- New env secrets (operator-set on deploy, never inline): `SUPPRESSIONS_EXPORT_TOKEN`, `RESEND_WEBHOOK_SECRET`.
- **Everything is local build + `deno test` only.** No migration push, no `functions deploy`, no live edge-fn deploy. Build, test, then STOP for the operator's explicit go ([[confirm-before-live-deploy]]). On deploy the operator sets both secrets and drops `SUPPRESSIONS_EXPORT_TOKEN=<value>` into `marketing/leads/.secrets/leads.env` out-of-band.

## Deliverables → relay ask #9

| Ask | Deliverable |
|---|---|
| #1 suppression table | `suppressions` table (+ supporting `email_tokens`) in one migration |
| #2 `unsubscribe` fn | GET (page) + POST (RFC 8058), tokenized, no PII in URL |
| #3 `resend-webhook` fn | Svix-verified; hard-bounce + complaint → suppression |
| #4 `suppressions-export` | `waitlist-export` clone, oldest-first cursor |
| #5 footer + headers | tokenized `email-footer.ts` + `email-tokens.ts`; `List-Unsubscribe` on `resend-send` |

## Boundaries

- Public repo: fns read `SUPPRESSIONS_EXPORT_TOKEN` / `RESEND_WEBHOOK_SECRET` / `RESEND_API_KEY` / service-role from env, never inline.
- `resend-send` stays live transitionally (spec §Phasing — retired later, after marketing verifies direct-send).
- Website never commits to the marketing repo; the export is the one-direction read seam.
- Deploy is operator-gated; this session ships reversible local work only.

## Out of scope (Phase 2+)

Newsletter on Resend, `email_common.py`, beehiiv cutover, LinkedIn graduation, `demand-gen-engine.svg` v3 — all marketing-side and later phases.
