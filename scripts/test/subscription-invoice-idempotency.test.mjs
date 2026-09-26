// Subscription renewals must count once per invoice (ops ledger 2026-09-26 0027).
//
// A renewal extends a licence on top of its current expiry, so applying the same
// invoice twice (a Stripe re-delivery, or two handlers during a webhook cutover)
// would grant two periods for one payment. The extension must go through the
// database function that records the invoice id under a UNIQUE key and moves the
// licence in the same transaction. Behaviour of that function was exercised on
// real Postgres (PGlite) when it was written; these guards keep the webhook on it.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const webhook = read("supabase/functions/stripe-webhook/index.ts");
const migration = read("supabase/migrations/20260926010000_subscription_invoice_extensions.sql");

const extendFn = webhook.slice(
  webhook.indexOf("async function extendSubscriptionLicense("),
  webhook.indexOf("async function onInvoicePaid("),
);

test("renewal extension goes through the once-per-invoice database function", () => {
  assert.match(extendFn, /db\.rpc\("apply_subscription_invoice_extension", \{\s*p_invoice_id: invoiceId,/);
  assert.doesNotMatch(extendFn, /\.update\(/, "no direct expires_at update that could apply twice");
  assert.match(webhook, /await extendSubscriptionLicense\(db, subscriptionId, lookupKey!, invoice\.id\);/);
});

test("the migration keys applied invoices uniquely and writes both rows in one function", () => {
  assert.match(migration, /invoice_id\s+text PRIMARY KEY/);
  assert.match(migration, /ON CONFLICT \(invoice_id\) DO NOTHING;\s*IF NOT FOUND THEN\s*RETURN false;/);
  assert.match(migration, /UPDATE public\.fe_entitlements/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.apply_subscription_invoice_extension\(text, bigint, timestamptz\)\s*FROM PUBLIC, anon, authenticated;/);
});
