# Confirmed Living Documents receipt export

A separate authenticated, read-only integration for marketing intake. It never sends an email, changes a row, widens historical consent or enables capture. The legacy `waitlist-export` source and endpoint remain unchanged.

**Request:** `GET /functions/v1/flow-living-documents-export` with the same `Authorization: Bearer …` credential as the existing legacy waitlist export. The new endpoint reads the existing `WAITLIST_EXPORT_TOKEN` setting; no credential creation or rotation is needed. It is server-to-server, without browser CORS. JWT verification is disabled because the handler implements the shared export authorization. Responses use `Cache-Control: no-store`.

Optional query parameters:

| Parameter | Contract |
|---|---|
| `limit` | Integer 1–500; default 200. Invalid values return 400. |
| `cursor` | Opaque base64url JSON representing `{v:1,updated_at,id}`. Omit for the first page. Store and replay the returned value verbatim; timestamp precision includes PostgreSQL microseconds. Invalid values return 400. |

Response: `{rows: [...], next_cursor: "..."}`. `next_cursor` is derived from the last returned `(updated_at,id)` tuple. An empty page returns `rows: []` and `next_cursor: null`. Continue requesting pages until empty, even if a page is smaller than the requested limit. On empty, retain the last non-null durable checkpoint rather than resetting it. This avoids assuming a particular server row cap. Identical cursor replay returns the same ordered records unless the underlying confirmed receipts change; import idempotently by receipt ID and updated timestamp.

Each row contains exactly:

- `id`: stable subscription UUID.
- `email`: normalized existing contact identity.
- `offer`: exactly `flow-living-documents-v1`.
- `consent_text`: the exact active sentence from the new signup contract.
- `source`: exactly `manifesto-living-documents`.
- `requested_at`, `confirmed_at`, `updated_at`: UTC timestamps, preserved without rounding.
- `double_optin`: always `confirmed`.
- `suppressed`: current global suppression snapshot for that normalized email, including historical rows with different case or surrounding spaces.

Only rows with confirmed_at set and exact offer, consent and source are selected. The export includes **no** confirmation token/hash, request UUID, fingerprint, provider receipt, raw metadata or attribution. Email is disclosed only to the authenticated intake service.

A suppressed confirmed receipt is still returned with `suppressed: true` so marketing can record the historical permission without reopening eligibility. False is only a current snapshot, never permission to clear an existing CRM suppression or to send. Continue the existing global suppression drain and recheck before every send. Any receipt or suppression read error returns 503 with no rows/cursor; do not advance the checkpoint. The endpoint does not enforce cross-campaign cadence: marketing must share one rolling seven-day clock across nurture, newsletter and broadcasts.

Later confirmation on an existing email changes updated_at and is therefore discoverable. Identity deduplication must not inherit this new scope from any other old receipt. Retain exact text, offer, confirmation time, receipt ID and source in the contact's consent history. No send is authorized by this export.

`handler.test.ts` covers authorization, limits/cursor validation, microsecond/tie ordering, replay/exhaustion, existing-contact confirmation, scoped mapping, suppression snapshots, privacy allowlisting and fail-closed errors. Hosted read acceptance and consumer tests are separate activation evidence.

Suppression reads use the service-role-only `flow_living_documents_suppressions` RPC. It accepts at most 500 normalized identities and returns one scalar array, avoiding API row-cap truncation. It matches historical rows with `lower(btrim(email))`; this does not rewrite the legacy suppression table or its writers. Apply migration `20260906020000_normalize_flow_living_documents_suppressions.sql` before deploying the updated export or signup adapters. Missing or invalid RPC results fail closed. The signup reservation, pre-send check and confirmation use the same normalized identity boundary.
