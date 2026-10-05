// Subscription renewals must count once per invoice (ops ledger 2026-09-26 0027).
//
// A renewal extends a licence on top of its current expiry, so applying the same
// invoice twice would grant two periods for one payment. The database function
// records the invoice id under a UNIQUE key and moves the licence in the same
// transaction. Website's webhook no longer calls it (0248 P1: Flow's own webhook
// renews Flow licences); the migration stays shared, so its shape is kept here.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/20260926010000_subscription_invoice_extensions.sql");

test("the migration keys applied invoices uniquely and writes both rows in one function", () => {
  assert.match(migration, /invoice_id\s+text PRIMARY KEY/);
  assert.match(migration, /ON CONFLICT \(invoice_id\) DO NOTHING;\s*IF NOT FOUND THEN\s*RETURN false;/);
  assert.match(migration, /UPDATE public\.fe_entitlements/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.apply_subscription_invoice_extension\(text, bigint, timestamptz\)\s*FROM PUBLIC, anon, authenticated;/);
});
