# Living Documents email permission

This signup and `flow-living-documents-confirm` form a separate affirmative-consent flow. Existing waitlist offers, confirmation URLs, mail delivery, commerce and global suppression handlers are unchanged.

The permission is: **Send me Flow updates, Living Documents methods, and the AI Native Newsletter. Up to one email a week. Unsubscribe any time.** Offer `flow-living-documents-v1`; source `manifesto-living-documents`.

The migration creates `flow_living_documents_subscriptions` and `flow_living_documents_signup_attempts`. Only the service role can read them. Writes go through three restricted transactional functions. The browser sends a UUID, email, exact consent and affirmative boolean, fixed offer/source, optional honeypot and allowlisted attribution. Unknown fields are discarded.

Confirmation tokens are opaque HMAC outputs. Only their SHA256 hash is retained in the database. Confirmation expires after seven days and atomically consumes the hash. Opening a confirmation URL renders a native form without changing consent; pressing its confirmation button submits a POST. Global suppressions prevent reservation, delivery and confirmation. The unchanged unsubscribe service remains authoritative.

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
