// Subscription-shaped licenses — the term math for a family sold monthly or
// annually rather than bought outright. Added 2026-08-22 for Orionfold Flow
// (goal 0127 A2, the server half the app repo structurally cannot do).
//
// WHY THIS IS SEPARATE FROM THE PERPETUAL PATH. Arena, Proof and Relay are
// bought once and carry a fixed kept-proven window (KEPT_PROVEN_MONTHS), with a
// separate annual renewal SKU sold alongside. Flow is not bought at all: Stripe
// holds the subscription, renews it, and emits `invoice.paid` each cycle. So
// the license term is not a property of the PURCHASE, it is a running total
// that each paid invoice extends. Modelling that with the renewal-SKU shape
// would mean issuing a new license every month, which is wrong for both the
// user (a new file to install) and the issuer (12x the envelopes).
//
// THE DESIGN, in one sentence: every paid invoice extends `expires_at` by the
// period it paid for, and cancellation simply stops the extensions — the
// license then lapses on its own, with no revocation step and nothing to chase.
//
// This module is pure and dependency-free so it can be unit-tested without a
// Stripe client, a database, or a network.
import {
  isSubscriptionFamily,
  licenseFamilyForLookupKey,
  subscriptionPeriodMonths,
} from "./catalog.ts";

/** UTC month arithmetic that never rolls a short month into the next one. */
export function addMonthsUTC(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const targetDay = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months, 1);
  const lastDayOfTarget = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(targetDay, lastDayOfTarget));
  return d;
}

/** True when this lookup key belongs to a family sold as a subscription. */
export function isSubscriptionLookupKey(lookupKey: string): boolean {
  const family = licenseFamilyForLookupKey(lookupKey);
  return Boolean(family && isSubscriptionFamily(family));
}

/**
 * The new `expires_at` after a paid invoice, as an ISO string.
 *
 * Extends from whichever is LATER: the current expiry, or now. Extending from
 * the current expiry is what makes early renewals additive rather than
 * lossy — a user who pays on day 20 of a 30-day period keeps the 10 days they
 * already have. Extending from `now` instead, when the license has already
 * lapsed, prevents a returning subscriber's first invoice from being consumed
 * by dead time they were not using the app for.
 *
 * Returns null when the key is not a subscription SKU, so the caller can leave
 * the perpetual path untouched.
 */
export function extendedExpiry(
  lookupKey: string,
  currentExpiresAt: string | null | undefined,
  now: Date,
): string | null {
  const months = subscriptionPeriodMonths(lookupKey);
  if (months === undefined) return null;

  const current = currentExpiresAt ? new Date(currentExpiresAt) : null;
  const valid = current && !Number.isNaN(current.getTime()) ? current : null;
  const base = valid && valid.getTime() > now.getTime() ? valid : now;
  return addMonthsUTC(base, months).toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Map a Stripe subscription status onto the `status` a license row carries.
 *
 * `trialing` counts as active: Flow's own free grant is enforced in the app and
 * needs no license at all, but a subscription that Stripe puts in trial (a
 * coupon, an operator comp) must not read as lapsed.
 *
 * Deliberately says "free grant" rather than naming a number or a unit. The
 * grant changed shape twice on 2026-08-22 (30 calendar days → 30 Pro Days → 10
 * Pro Days) and this code was correct throughout, because Stripe is never told
 * about the grant at all — see the Flow block in catalog.ts.
 *
 * Dunning is NOT flipped to inactive here. The license already carries an
 * `expires_at`, so a failed payment stops extending it and the term runs out on
 * its own. Cutting access at the first failed charge would punish an expired
 * card, which is the most common and least deliberate reason a payment fails.
 *
 * The dunning value is `past_due`, NOT a new word. `fe_entitlements.status`
 * documents a known-set of `active | past_due | canceled | revoked`, the
 * webhook's own `invoice.payment_failed` path already writes `past_due`, and
 * `relayHostDeliveryEligible` allowlists exactly `["active", "past_due"]` — a
 * novel value like "dunning" would read as ineligible there and would drift
 * from the column's documented set. Reuse the vocabulary that exists.
 */
export function subscriptionLicenseStatus(subscriptionStatus: string): string {
  if (subscriptionStatus === "active" || subscriptionStatus === "trialing") return "active";
  if (subscriptionStatus === "past_due" || subscriptionStatus === "unpaid") return "past_due";
  return subscriptionStatus;
}

/**
 * Whether a paid invoice should extend the term.
 *
 * `subscription_create` is excluded because the Checkout Session that created
 * the subscription already issued the first term — the two events race, and
 * counting both would grant a free extra period on every signup. Every later
 * cycle (and a manual invoice against the subscription) extends.
 */
export function shouldExtendSubscriptionTerm(
  billingReason: string | null | undefined,
  lookupKey: string | null | undefined,
): boolean {
  if (!lookupKey || !isSubscriptionLookupKey(lookupKey)) return false;
  return billingReason === "subscription_cycle" || billingReason === "subscription_update";
}
