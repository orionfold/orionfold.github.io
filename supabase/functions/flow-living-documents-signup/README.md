# Living Documents email permission

This signup and `flow-living-documents-confirm` form a separate affirmative-consent flow. Existing waitlist offers, confirmation URLs, mail delivery, commerce and global suppression handlers are unchanged.

The permission is: **Send me Flow updates, Living Documents Jobs, and the AI Native Newsletter. Up to one email a week. Unsubscribe any time.** Offer `flow-living-documents-v1`; source `manifesto-living-documents`.

The original migration creates `flow_living_documents_subscriptions` and `flow_living_documents_signup_attempts`. Only the service role can read them. Writes go through restricted transactional functions. The browser sends a UUID, email, exact consent and affirmative boolean, fixed offer/source, optional honeypot and allowlisted attribution. Unknown fields are discarded.

Confirmation tokens are opaque HMAC outputs. The email link confirms the subscription and redirects to the homepage, where the existing top banner briefly thanks the subscriber. It closes after eight seconds or when dismissed, then restores Download Flow. There is no extra confirmation button. New links go directly to the confirmation function; `/flow/confirm/` is only a silent compatibility redirect for previously issued links.

Only SHA256 hashes are stored. First confirmation clears the active token hash and retains a receipt hash; a repeated valid click returns `already` without changing consent or timestamps. Both first use and replay expire at the original seven-day boundary and respect normalized global suppression. HEAD and explicitly marked prefetch requests do not confirm. Ordinary GET follows the requested email-link confirmation behavior; unmarked automated link scanners can also follow it. The unchanged unsubscribe service remains authoritative.

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

Migration `20260917010000_allow_flow_living_documents_jobs_consent.sql` changes only the consent-text check to permit the two exact sentences. Migration `20260917020000_add_flow_confirmation_replay_receipts.sql` adds consumed-hash receipts, the result-aware confirmation RPC, and persisted email-template versions. Apply the database changes before deploying their adapters. Keep the existing boolean confirmation RPC for earlier callers.

Email version 1 preserves the earlier body and link exactly for outstanding retries. Version 2 uses a direct email confirmation link and the instruction “Click to confirm your subscription:”. A restricted RPC marks version 2 only on a fresh first sending claim; later claims retain their stored version. No table-write privilege is added. The consent sentence, canonical request hash, token and provider idempotency key remain stable.

`verify-consent-versions.sql` and `flow-living-documents-confirm/verify-replay-database.sql` verify exact consent, replay, expiry, suppression, version bounds, claim ownership and role access inside rollback transactions. They send no email. Controlled production delivery and click-to-notification acceptance remain release prerequisites. Inspect actual repository variables and backend activation; default-off source code does not establish production state. Preserve existing activation and deploy only the two related handlers. The website banner must be available before the confirmation handler starts returning its homepage acknowledgement namespace.
