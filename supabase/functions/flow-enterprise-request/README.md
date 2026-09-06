# Flow enterprise request endpoint

`POST /functions/v1/flow-enterprise-request` saves a Flow pricing enquiry and alerts `manav@orionfold.com`. It does not enroll the contact in a newsletter and does not send a customer confirmation email.

The JSON contract is:

```json
{
  "requestId": "UUID generated once by the browser",
  "name": "required, at most 120 characters",
  "email": "required, at most 254 characters",
  "company": "required, at most 200 characters",
  "requirements": "required, at most 6000 characters",
  "licenses": 25,
  "heardAbout": "optional, at most 240 characters",
  "website": ""
}
```

`licenses` must be an integer from 1 through 100000. `website` is the honeypot and must remain empty. The source is fixed by the server to `flow_pricing`; caller-supplied source or price fields are ignored. The endpoint rejects foreign browser origins before database or email-provider IO and caps the complete UTF-8 request body at 32768 bytes.

A saved request returns HTTP 200 when the operator alert is recorded as sent, or HTTP 202 when it is saved and alert delivery is pending:

```json
{
  "success": true,
  "requestId": "the submitted UUID",
  "notificationStatus": "sent"
}
```

Errors return only `{ "error": "..." }`. Reusing a request ID with the same normalized payload is idempotent. Reusing it with different details returns HTTP 409. The database transaction serializes request IDs and IP fingerprints and accepts at most five new requests per fingerprint per hour.

The row records the first alert attempt before calling Resend and stores the successful provider message ID. The first-attempt timestamp is immutable. A pending or failed alert may retry with the stable idempotency key only inside 23 hours of that first attempt, within Resend's 24-hour deduplication window. An older uncertain delivery is flagged for manual review and is not sent automatically.

## Production activation order

1. Apply the additive migration that creates `flow_enterprise_enquiries` and the service-role-only save function.
2. Confirm the following Edge Function secrets exist without printing their values: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`, and `FLOW_ENTERPRISE_FINGERPRINT_SECRET`. Keep `FLOW_ENTERPRISE_CONTACT_ENABLED` absent or set to `false`.
3. Deploy `flow-enterprise-request` with JWT verification disabled. The repository entry is `[functions.flow-enterprise-request] verify_jwt = false`; the deploy command must also explicitly use `--no-verify-jwt`.
4. With the frontend contact surface still disabled, set `FLOW_ENTERPRISE_CONTACT_ENABLED=true` and run one controlled request from an allowed origin. Verify the row exists, its structured fields and `flow_pricing` source are correct, the alert reaches `manav@orionfold.com`, `reply_to` is the submitter, and `alert_status` is `sent`. Also verify a provider-denied test remains saved with a pending public receipt and a failed internal alert status.
5. Set the repository build variable `PUBLIC_FLOW_ENTERPRISE_CONTACT_ENABLED=true` (the deployment workflow defaults it to `false`) only after the migration, function gate, database receipt, and provider smoke are all green. Roll back the surface by disabling the frontend gate first and the Edge Function gate second; retained enquiries remain private.

Do not place secret values, customer data, or hosted smoke payloads in source, logs, or deployment records.
