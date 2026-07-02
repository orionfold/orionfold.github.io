# Relay T-30 renewal reminder email — design

_Date: 2026-07-02 · Origin: relay peer channel `strategy/relay/_RELAY.md` later-9/later-10 (PLG-4a renewal value-recap loop). Relay shipped its half in `orionfold-relay@0.22.0`; this is the Website's half — the one owed ask._

## Goal

Send a single **T-30 renewal reminder email** to each active Relay license holder about
30 days before their license expires. The email recaps what their license year shipped
(from public release history) and offers a one-command update + renewal CTA. It never
threatens that packs will stop working — installed packs are theirs forever (D4).

One reminder per license year. Timing is ours; T-30 only for v1 (optional T-7 second
touch deferred — YAGNI until there is a renewal cohort to warrant it).

## The load-bearing constraint (why the copy is shaped this way)

Relay has **no phone-home** — that is the product wedge. The site therefore **cannot see
customer installs**. The email is built ONLY from:

- **Issuance data we already hold** in `fe_entitlements`: `email`, `expires_at`,
  entitlements/tier, `status`.
- **Public release history**: the pack changelog line (what the license year shipped).

It must **never** say "you haven't installed X" — only "here is what your license year
shipped." This honesty constraint is quoted verbatim on `_RELAY` later-9 and is the whole
reason the loop is trustworthy.

## Architecture

A new service-role edge function **`renewal-reminder`**, gated by a new
`RENEWAL_REMINDER_TOKEN` shared credential with a constant-time compare, `verify_jwt =
false` — the exact idiom as `admin-issue-license` / `purchases-export` / `resend-send`.

A daily scheduled trigger — a **GitHub Actions cron** workflow — makes an authenticated
POST to the deployed function. Scheduling stays visible in `.github/`; PII (the customer
email) never leaves Supabase.

## Data flow

1. Actions cron fires daily → `POST` with `Authorization: Bearer <RENEWAL_REMINDER_TOKEN>`.
2. The function queries `fe_entitlements` (service-role, deny-all RLS) using the existing
   `idx_fe_entitlements_status (status, expires_at)` index:
   - `status = 'active'`
   - `tier = 'relay'` (Relay-only for now; other products can opt in later)
   - `expires_at` inside the T-30 window (≈ 28–31 days from now — a small band, not a
     single day, so a missed cron run does not skip a cohort)
   - `renewal_reminded_at IS NULL` (idempotency guard)
3. For each selected row, compose the renewal text (see Copy) and send via the same
   **direct Resend POST** `stripe-webhook` uses: `from: Orionfold
   <manav@updates.orionfold.com>`, `reply_to: manav@orionfold.com`, `EMAIL_FOOTER`
   appended (CAN-SPAM postal address + opt-out). No attachment.
4. On a 2xx from Resend, stamp `renewal_reminded_at = now()` for that row (one reminder
   per license year). A send failure leaves the column null so the next run retries.
5. Return `{ scanned, sent, errors }` JSON for the cron log.

## Data model change

New migration: add `renewal_reminded_at timestamptz` (nullable) to `fe_entitlements`.
Additive, no backfill. NOT a reuse of `delivered_at` (that tracks the *fulfilment* email;
reusing it would either break fulfilment tracking or re-send the reminder daily).

## Email copy (aligned verbatim to `_RELAY` later-9 canonical pieces)

- **Subject:** `Your Orionfold Relay license renews in 30 days`
- **D4 promise, byte-identical to the CLI ceremony / /promise/ / the fulfilment email:**
  _"Your packs are yours forever. Renewal gets you the year's new and updated packs and priority support."_
- **The year's evidence** (from the pack changelog — single recap source in the Relay repo
  at `src/lib/packs/templates/relay-agency-pro/pack.yaml → changelog:`; mirrored here as a
  constant): _"Your license year included Agency Pro v0.2.0 — the Nonprofit deep chapter: a
  grant pipeline that takes every opportunity from fit-scored go/no-go through LOI, full
  application, and post-award restricted-funds compliance with a reporting calendar."_
- **The cure, one command:** `relay pack update relay-agency-pro` (if they have not taken
  the update yet) + renewal CTA → https://orionfold.com/relay/
- **Never a threat:** no "your packs will stop working" framing anywhere. Renewal buys the
  *next* year's flow; installed content is theirs forever.

House voice: grade 3–5 English, no em-dashes, explain jargon (website copy style rule).

## Changelog freshness

The evidence line is a small constant in the function. It stays current via the standing
`_RELAY` obligation: Relay flags each new pack `changelog:` line per release, and we edit
this one constant. No live coupling to the Relay repo.

## Error handling

- Bad/missing token → 401 (constant-time compare, like the exports).
- Non-POST → 405.
- `RESEND_API_KEY` / `RENEWAL_REMINDER_TOKEN` missing → 500 with a clear message.
- Per-row send failure is caught, counted in `errors`, and does NOT stamp
  `renewal_reminded_at` (so it retries next run) and does NOT abort the batch.
- DB query failure → 500, whole run aborts (nothing stamped).

## Testing

Deno unit tests, same shape as `resend-send/index.test.ts` (no live send):

1. **Window predicate** — a license 30 days out is selected; 60 days / 10 days / already
   reminded / non-active / non-relay rows are excluded.
2. **Idempotency** — a row with `renewal_reminded_at` set is never re-selected.
3. **Copy composition** — the D4 sentence appears verbatim; the renewal CTA URL is present;
   no threat phrases ("stop working", "will be locked", "lose access") appear.

## Deploy (operator-gated — reversible work first, then STOP)

Local/reversible now: function code, migration file, tests, `config.toml` entry, the
Actions workflow, the `_RELAY` handback draft. Then STOP for explicit go before:

- `supabase db push` (the migration)
- `supabase functions deploy renewal-reminder --no-verify-jwt`
- set the `RENEWAL_REMINDER_TOKEN` secret (secret-only, never on disk)
- enabling the Actions cron

Per memory `confirm-before-live-deploy`: plan approval ≠ deploy approval.

## Out of scope (YAGNI)

- T-7 second-touch email.
- Non-Relay products (the query is tier-scoped; widening is a one-line change later).
- Any read of customer install state (impossible by design, and the honesty constraint
  forbids implying it).
