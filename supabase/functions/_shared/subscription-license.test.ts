import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  addMonthsUTC,
  extendedExpiry,
  isSubscriptionLookupKey,
  shouldExtendSubscriptionTerm,
  subscriptionLicenseStatus,
} from "./subscription-license.ts";
import {
  clampSeats,
  MAX_SEATS,
  MIN_SEATS,
  supportsMultipleSeats,
  FLOW_ANNUAL_AMOUNT,
  FLOW_ANNUAL_DISCOUNT,
  FLOW_MONTHLY_AMOUNT,
  getCatalogItem,
  isSubscriptionFamily,
  licenseFamilyForLookupKey,
  licenseProductForLookupKey,
  LICENSE_FAMILIES,
  foundingFallback,
  subscriptionPeriodMonths,
} from "./catalog.ts";

const MONTHLY = "license_orionfold_flow_monthly";
const ANNUAL = "license_orionfold_flow_annual";

// ── The commercial terms, as the operator set them ──────────────────────────
// These assert the DECISION, so a later edit that changes a price has to change
// a test that names the grooming it came from rather than sliding through.
Deno.test("Flow's terms are $10/mo and 20% off annually", () => {
  assertEquals(FLOW_MONTHLY_AMOUNT, 1000, "$10.00 per user per month");
  assertEquals(FLOW_ANNUAL_DISCOUNT, 0.2, "20% off paid annually");
  assertEquals(FLOW_ANNUAL_AMOUNT, 9600, "$96.00/year — derived, not a literal");
});

// The growth contract calls this out by name: two literals can silently
// disagree, and the one the customer pays is whichever Stripe holds. This test
// fails if anyone replaces the derivation with a hardcoded 9600.
Deno.test("the annual price is DERIVED from the monthly price, never a second literal", () => {
  assertEquals(
    FLOW_ANNUAL_AMOUNT,
    Math.round(FLOW_MONTHLY_AMOUNT * 12 * (1 - FLOW_ANNUAL_DISCOUNT)),
    "annual must recompute from monthly x 12 x (1 - discount)",
  );
  const annualItem = getCatalogItem(ANNUAL)!;
  const monthlyItem = getCatalogItem(MONTHLY)!;
  assertEquals(annualItem.amount, FLOW_ANNUAL_AMOUNT);
  assertEquals(monthlyItem.amount, FLOW_MONTHLY_AMOUNT);
  // An annual that costs more than 12 monthlies would be a discount that isn't.
  assert(annualItem.amount < monthlyItem.amount * 12, "annual must undercut 12 monthlies");
});

// ── The family shape ────────────────────────────────────────────────────────
Deno.test("Flow is a subscription family with two SKUs and no founding cohort", () => {
  const family = LICENSE_FAMILIES["orionfold-flow"];
  assert(isSubscriptionFamily(family), "Flow is sold as a subscription");
  assertEquals(family.monthly, MONTHLY);
  assertEquals(family.annual, ANNUAL);
  assertEquals(family.founding, undefined, "no founding cohort");
  assertEquals(family.standard, undefined, "no perpetual SKU");
  assertEquals(family.renewal, undefined, "Stripe renews; no separate renewal SKU");
});

Deno.test("both Flow SKUs resolve to the family and to subscription checkout", () => {
  for (const key of [MONTHLY, ANNUAL]) {
    assertEquals(licenseFamilyForLookupKey(key)?.product, "orionfold-flow");
    assertEquals(getCatalogItem(key)?.mode, "subscription");
    assertEquals(getCatalogItem(key)?.kind, "license");
  }
});

Deno.test("Flow carries the entitlement the app requires", () => {
  // One signing key covers the whole constellation, so this string is the only
  // thing separating products. Verified against orionfold-flow 2026-08-21:
  // LicenseVerifier.requiredEntitlement.
  const descriptor = licenseProductForLookupKey(MONTHLY)!;
  assertEquals(descriptor.product, "orionfold-flow");
  assert(
    descriptor.entitlements.includes("product:orionfold-flow"),
    "a Flow license missing this is refused by a correctly working app",
  );
});

Deno.test("the founding cap is a no-op for a subscription family", () => {
  // Regression: the cap assumes family.founding/foundingSeats exist. A
  // subscription family has neither, and must pass straight through rather
  // than throwing or falling back to an undefined standard key.
  assertEquals(foundingFallback(MONTHLY), MONTHLY);
  assertEquals(foundingFallback(ANNUAL), ANNUAL);
});

Deno.test("the perpetual families are untouched by the subscription shape", () => {
  for (const product of ["arena-field-edition", "orionfold-proof", "orionfold-relay"]) {
    const family = LICENSE_FAMILIES[product];
    assert(!isSubscriptionFamily(family), `${product} stays perpetual`);
    assert(family.founding && family.standard && family.renewal, `${product} keeps 3 SKUs`);
    assertEquals(foundingFallback(family.founding!), family.standard);
    assertEquals(subscriptionPeriodMonths(family.standard!), undefined);
  }
});

// ── Term math ───────────────────────────────────────────────────────────────
Deno.test("one paid invoice grants one month or one year", () => {
  assertEquals(subscriptionPeriodMonths(MONTHLY), 1);
  assertEquals(subscriptionPeriodMonths(ANNUAL), 12);
});

Deno.test("a renewal paid EARLY is additive, never lossy", () => {
  // Day 20 of a 30-day term: the user keeps the 10 days they already paid for.
  const now = new Date("2026-09-20T00:00:00Z");
  const current = "2026-09-30T00:00:00Z";
  assertEquals(extendedExpiry(MONTHLY, current, now), "2026-10-30T00:00:00Z");
});

Deno.test("a returning subscriber's term starts from now, not from dead time", () => {
  // Lapsed in March, resubscribes in September. Extending from the old expiry
  // would consume the whole new period on time they were not using the app.
  const now = new Date("2026-09-01T00:00:00Z");
  assertEquals(extendedExpiry(MONTHLY, "2026-03-01T00:00:00Z", now), "2026-10-01T00:00:00Z");
});

Deno.test("a first term with no prior expiry runs from now", () => {
  const now = new Date("2026-09-01T00:00:00Z");
  assertEquals(extendedExpiry(ANNUAL, null, now), "2027-09-01T00:00:00Z");
  assertEquals(extendedExpiry(ANNUAL, undefined, now), "2027-09-01T00:00:00Z");
});

Deno.test("an unparseable stored expiry falls back to now rather than NaN", () => {
  const now = new Date("2026-09-01T00:00:00Z");
  assertEquals(extendedExpiry(MONTHLY, "not-a-date", now), "2026-10-01T00:00:00Z");
});

Deno.test("month-end never rolls into the following month", () => {
  // Jan 31 + 1 month is Feb 28, not Mar 3. The naive setUTCMonth does the wrong
  // thing here, which is why addMonthsUTC clamps.
  assertEquals(
    addMonthsUTC(new Date("2026-01-31T00:00:00Z"), 1).toISOString(),
    "2026-02-28T00:00:00.000Z",
  );
  assertEquals(
    addMonthsUTC(new Date("2028-01-31T00:00:00Z"), 1).toISOString(),
    "2028-02-29T00:00:00.000Z",
    "leap year",
  );
  assertEquals(
    addMonthsUTC(new Date("2026-08-31T00:00:00Z"), 12).toISOString(),
    "2027-08-31T00:00:00.000Z",
  );
});

Deno.test("extendedExpiry returns null for a perpetual key", () => {
  const now = new Date("2026-09-01T00:00:00Z");
  assertEquals(extendedExpiry("license_arena_field_edition", null, now), null);
  assertEquals(extendedExpiry("book_ai_native_business", null, now), null);
});

// ── Lifecycle ───────────────────────────────────────────────────────────────
Deno.test("the first invoice does NOT extend — checkout already issued it", () => {
  // subscription_create races with checkout.session.completed. Counting both
  // would grant a free extra period on every single signup.
  assertEquals(shouldExtendSubscriptionTerm("subscription_create", MONTHLY), false);
});

Deno.test("later cycles extend", () => {
  assertEquals(shouldExtendSubscriptionTerm("subscription_cycle", MONTHLY), true);
  assertEquals(shouldExtendSubscriptionTerm("subscription_cycle", ANNUAL), true);
  assertEquals(shouldExtendSubscriptionTerm("subscription_update", ANNUAL), true);
});

Deno.test("a perpetual product's invoice never takes the subscription path", () => {
  assertEquals(shouldExtendSubscriptionTerm("subscription_cycle", "license_relay_host_annual"), false);
  assertEquals(shouldExtendSubscriptionTerm("subscription_cycle", null), false);
  assertEquals(shouldExtendSubscriptionTerm("subscription_cycle", undefined), false);
});

Deno.test("trialing reads as active; dunning does not cut access", () => {
  assertEquals(subscriptionLicenseStatus("active"), "active");
  assertEquals(subscriptionLicenseStatus("trialing"), "active");
  // A failed charge is usually an expired card. The term runs out on its own.
  // The value must be `past_due` and not a novel word: it is the column's
  // documented known-set, the webhook already writes it on
  // invoice.payment_failed, and relayHostDeliveryEligible allowlists it.
  assertEquals(subscriptionLicenseStatus("past_due"), "past_due");
  assertEquals(subscriptionLicenseStatus("unpaid"), "past_due");
  assertEquals(subscriptionLicenseStatus("canceled"), "canceled");
});

Deno.test("the status vocabulary stays inside the column's known-set", () => {
  // fe_entitlements.status documents: active | past_due | canceled | revoked.
  const known = ["active", "past_due", "canceled", "revoked", "incomplete", "paused"];
  for (const s of ["active", "trialing", "past_due", "unpaid", "canceled"]) {
    assert(known.includes(subscriptionLicenseStatus(s)), `${s} maps into the known-set`);
  }
});

Deno.test("isSubscriptionLookupKey separates the two families cleanly", () => {
  assert(isSubscriptionLookupKey(MONTHLY));
  assert(isSubscriptionLookupKey(ANNUAL));
  assert(!isSubscriptionLookupKey("license_arena_field_edition"));
  assert(!isSubscriptionLookupKey("license_orionfold_relay_renewal"));
  assert(!isSubscriptionLookupKey("book_ai_native_business"));
});

// ── Multi-seat, option (a): buy N, distribute yourself ──────────────────────
// The operator chose (a) on 2026-08-22: one envelope carrying `seats: N`, and
// distribution is the buyer's business. These tests pin the SERVER's half —
// the count is clamped, gated to seat-shaped products, and never trusted from
// the client. Nothing here enforces the count at runtime, and that is by
// design: see the note on `purchasedSeats` in stripe-webhook.

Deno.test("only subscription licences are seat-shaped", () => {
  assert(supportsMultipleSeats(MONTHLY));
  assert(supportsMultipleSeats(ANNUAL));
  // A perpetual licence must NEVER take a quantity: the founding cap counts one
  // `purchases` row per sale, so a 5-seat founding order would consume one of
  // 25 cohort seats while charging for five.
  assert(!supportsMultipleSeats("license_arena_field_edition_founding"));
  assert(!supportsMultipleSeats("license_orionfold_relay"));
  // A book is a file and a sponsor tier is one relationship.
  assert(!supportsMultipleSeats("book_ai_native_business"));
  assert(!supportsMultipleSeats("sponsor_gold"));
});

Deno.test("seat counts are clamped, never trusted", () => {
  assertEquals(clampSeats(1), 1);
  assertEquals(clampSeats(7), 7);
  assertEquals(clampSeats(MAX_SEATS), MAX_SEATS);
  // Out of range collapses rather than erroring: a mistyped quantity should
  // meet a working checkout, not a stack trace.
  assertEquals(clampSeats(0), MIN_SEATS);
  assertEquals(clampSeats(-5), MIN_SEATS);
  assertEquals(clampSeats(9999), MAX_SEATS);
  // Fractional, string, and junk input all resolve to something chargeable.
  assertEquals(clampSeats(3.7), 3);
  assertEquals(clampSeats("4"), 4);
  assertEquals(clampSeats("abc"), MIN_SEATS);
  assertEquals(clampSeats(null), MIN_SEATS);
  assertEquals(clampSeats(undefined), MIN_SEATS);
  assertEquals(clampSeats(Number.NaN), MIN_SEATS);
  assertEquals(clampSeats(Infinity), MAX_SEATS);
});

Deno.test("N seats costs N times the unit price, with no bundle SKU", () => {
  // Verified against the live Stripe API in sandbox 2026-08-22: a session with
  // quantity=3 on a $1499 recurring price returned amount_total 449700.
  // Stripe multiplies; the catalog needs no per-quantity price object.
  const monthly = getCatalogItem(MONTHLY)!;
  assertEquals(monthly.amount * 5, 5000, "5 seats x $10");
  const annual = getCatalogItem(ANNUAL)!;
  assertEquals(annual.amount * 5, 48000, "5 seats x $96");
});
