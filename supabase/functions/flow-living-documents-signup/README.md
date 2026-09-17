# Living Documents email permission

This signup and `flow-living-documents-confirm` form a separate affirmative-consent flow. Existing waitlist offers, confirmation URLs, mail delivery, commerce and global suppression handlers are unchanged.

The permission is: **Send me Flow updates, Living Documents Jobs, and the AI Native Newsletter. Up to one email a week. Unsubscribe any time.** Offer `flow-living-documents-v1`; source `manifesto-living-documents`.

The original migration creates `flow_living_documents_subscriptions` and `flow_living_documents_signup_attempts`. Only the service role can read them. Writes go through three restricted transactional functions. The browser sends a UUID, email, exact consent and affirmative boolean, fixed offer/source, optional honeypot and allowlisted attribution. Unknown fields are discarded.

Confirmation tokens are opaque HMAC outputs. Only their SHA256 hash is retained in the database. Confirmation expires after seven days and atomically consumes the hash. New confirmation URLs open the standalone, analytics-free `/flow/confirm/` site page. Old Edge Function GET links redirect there without reading or consuming a token. The page removes the opaque token from its address and prepares a native form; pressing Confirm subscription submits an explicit POST to the confirmation function. Global suppressions prevent reservation, delivery and confirmation. The unchanged unsubscribe service remains authoritative.

Delivery uses a one-minute reservation lease, a maximum of three attempts per request UUID within one hour, and a stable Resend idempotency key. Five new requests per IP fingerprint or email per hour. Failed or uncertain provider/database results return an error, never a false delivered message. The client retains its UUID across retries until the payload changes or a completed acknowledgement arrives.

Required server environment:

- `LIVING_DOCUMENTS_SIGNUP_ENABLED=true` only after activation acceptance.
- `FLOW_LIVING_DOCUMENTS_SIGNUP_SECRET`: at least 32 characters, used with distinct HMAC domains for tokens and IP fingerprints. Keep stable during outstanding retries; rotating invalidates deterministic resend identity, so let the one-hour retry window drain first. Already delivered token hashes remain valid for confirmation.
- Existing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and `RESEND_FROM`.
- Explicit isolated environment settings when testing staging; production confirmation and unsubscribe URLs remain canonical.

The frontend has its own default-off `PUBLIC_LIVING_DOCUMENTS_SIGNUP_ENABLED` flag. Backend acceptance comes first. Do not deploy unrelated existing functions to activate this flow.

Marketing reads confirmed rows by `(updated_at, id)`, imports idempotently by subscription ID and offer, and applies the existing global suppression feed before every send. The permission promises up to one email a week across its topics. Do not infer this permission from legacy audience membership.

Run the handler tests and type checks with Deno. `verify-database.sql` is an isolated PostgreSQL acceptance script enclosed in a rollback transaction; it never sends an email. Real database/role and controlled delivery acceptance are required before activation.

Suppression identity is matched case-insensitively with surrounding spaces removed for this offer only. Migration `20260906020000_normalize_flow_living_documents_suppressions.sql` adds a read-only service-role RPC and updates this offer's reservation/confirmation predicates; the original migration and legacy suppression writers remain unchanged. Deploy that migration before the updated signup/export adapters. A pre-send RPC error prevents delivery. `verify-suppression-normalization.sql` is a rollback-only acceptance check covering mixed-case historical rows, late suppression before send/confirmation, an unsuppressed control and RPC access/input bounds.


## Jobs terminology and earlier consent

Current forms request **Living Documents Jobs**. The signup contract accepts exactly that sentence and the earlier **Living Documents methods** sentence. It preserves the submitted sentence in storage, the canonical retry payload, and every confirmation email. Old retries keep their original email body, token, and provider idempotency key. Existing confirmed subscriptions and historical rows are not rewritten or re-enrolled.

Migration `20260917010000_allow_flow_living_documents_jobs_consent.sql` changes only the consent-text check to permit the two exact sentences. Apply it before deploying the updated signup handler. Make the standalone site confirmation page available before deploying the companion confirmation handler, which redirects older Edge Function links there. The site page reminds recipients to confirm the exact permission in their email rather than substituting a new consent sentence. GET remains scanner-safe and does not read or consume a token.

Run `verify-consent-versions.sql` against an isolated database after migrations to verify both accepted sentences, unchanged historical confirmed consent, retry conflicts when consent changes, and rejection of unknown consent. This rollback-only script sends nothing. Database acceptance and customer-identical controlled delivery for both old retries and new signups remain production activation prerequisites. Inspect actual repository build variables and backend activation before rollout; default-off source code does not establish production state. For an active signup service, preserve existing activation and finish backward-compatible database and endpoint rollout before publishing frontend Jobs consent. Never disable or re-enable production implicitly.


The hosted Supabase shared domain rewrites HTML GET responses as plain text, so a form returned directly by an Edge Function is not a usable confirmation page. The standalone site route has no analytics, has `noindex, nofollow` and `no-referrer`, accepts one strict token, and never confirms on load. Its form POST uses the configured confirmation endpoint. Successful POSTs retain the existing `/manifesto/?living-documents-confirmed=1#email-updates` return and measurement. Legacy consent email bodies retain their original Edge Function URL for retry idempotency; current Jobs consent email bodies use the site URL. The backend GET redirect keeps already-delivered older links usable.
