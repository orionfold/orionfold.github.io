// Rebuild a licence payload from the entitlement row that is now true.
//
// WHY THIS EXISTS AT ALL, because the answer is not obvious and the wrong
// answer is a silent one. A Flow subscription is never re-issued per cycle: the
// SAME signed envelope stays valid and each paid invoice pushes `expires_at`
// out (see `_shared/subscription-license.ts`). But that extension is written to
// the DATABASE ROW ONLY — `stripe-webhook` calls `signLicense` exactly once, at
// issuance, and never re-signs on renewal. So after the first renewal the file
// the subscriber holds says one thing and the row says another, and the file is
// the one the app reads offline.
//
// `flow-license-refresh` is what closes that gap: it re-signs the payload from
// the row, so a subscriber who renews gets their real term. This module is the
// pure half — the row-to-payload mapping, with no Stripe client, no database
// and no network — so the mapping can be tested exhaustively and the endpoint
// only has to do the round trip.
//
// THE INVARIANT WORTH STATING: everything except the term is copied from the
// row unchanged, and the row is written by the issuing path. A refresh must
// never be able to GRANT something — not a product, not an entitlement, not a
// seat count. It re-states an existing licence with a current expiry, and any
// field it invented would be a field an attacker with a stale licence could ask
// for.
import { buildLicensePayload, type LicensePayload } from "./license-payload.ts";
import { type LicenseEdition, licenseProductForLookupKey } from "./catalog.ts";

/** The `fe_entitlements` columns a re-issue reads. */
export interface EntitlementRow {
  license_id: string;
  product: string;
  tier: string | null;
  edition: string | null;
  seats: number | null;
  email: string;
  issued_to_name: string | null;
  issued_to_org: string | null;
  issued_at: string | null;
  not_before: string | null;
  expires_at: string | null;
  status: string | null;
  stripe_session_id: string | null;
  stripe_price_id: string | null;
}

/**
 * The entitlements claim for a product, from the same descriptor table the
 * issuing path uses.
 *
 * Read from the catalog rather than stored on the row, because the row has no
 * entitlements column — and re-deriving it from the product is what keeps a
 * refreshed licence byte-identical in shape to an issued one. The lookup is by
 * the product's own monthly SKU, since `licenseProductForLookupKey` is keyed by
 * lookup key rather than product id.
 */
export function entitlementsForProduct(
  product: string,
  lookupKeyHint: string,
): string[] | null {
  const descriptor = licenseProductForLookupKey(lookupKeyHint);
  if (!descriptor || descriptor.product !== product) return null;
  return descriptor.entitlements;
}

/**
 * Rebuild the signed payload for an existing licence, with the row's CURRENT
 * term.
 *
 * Returns null when the row cannot produce a complete payload — a missing term
 * or email means the row was never fully issued, and re-signing a partial
 * licence would hand the subscriber a file their app refuses for reasons they
 * cannot see.
 */
export function reissuePayload(
  row: EntitlementRow,
  entitlements: string[],
): LicensePayload | null {
  if (!row.license_id || !row.email) return null;
  if (!row.issued_at || !row.not_before || !row.expires_at) return null;

  return buildLicensePayload({
    licenseId: row.license_id,
    product: row.product,
    tier: row.tier ?? undefined,
    entitlements,
    // Flow carries no edition and the column is null for it; Arena's badge is
    // copied through unchanged for any product that does have one.
    edition: (row.edition as LicenseEdition | null) ?? undefined,
    // Copied, never recomputed. The seat count was SIGNED at purchase and a
    // refresh has no business changing it — see the multi-seat note in
    // stripe-webhook: a signed claim is the one thing that cannot be corrected
    // after delivery, so a refresh must reproduce it exactly.
    seats: row.seats ?? undefined,
    issuedTo: {
      email: row.email,
      name: row.issued_to_name ?? undefined,
      org: row.issued_to_org ?? undefined,
    },
    issuedAt: row.issued_at,
    notBefore: row.not_before,
    // The ONLY field a renewal moves.
    expiresAt: row.expires_at,
    provenance: {
      stripe_purchase_id: row.stripe_session_id ?? "",
      stripe_price_id: row.stripe_price_id ?? "",
    },
  });
}

/**
 * Whether the licence the caller already holds is current.
 *
 * Compares the term and status-bearing claims rather than the whole payload,
 * because the payload the caller sent may be pretty-printed differently or
 * carry a key order of its own — a byte comparison would report "changed" on
 * every call and turn a 304 into a pointless re-download every launch.
 *
 * `expires_at` is the field that actually moves on renewal; the others are
 * compared so a corrected name or a re-issued seat count also propagates.
 */
export function licenseIsCurrent(
  // deno-lint-ignore no-explicit-any
  held: any,
  fresh: LicensePayload,
): boolean {
  if (!held || typeof held !== "object") return false;
  return held.expires_at === fresh.expires_at &&
    held.not_before === fresh.not_before &&
    held.issued_at === fresh.issued_at &&
    held.seats === fresh.seats &&
    held.tier === fresh.tier &&
    held.edition === fresh.edition &&
    JSON.stringify(held.entitlements ?? null) === JSON.stringify(fresh.entitlements ?? null);
}

/**
 * Statuses whose holder may still refresh.
 *
 * `past_due` is included on purpose and it is the same call the webhook makes:
 * a failed payment stops EXTENDING the term, it does not cut it short, so a
 * dunning subscriber still owns the days they paid for and must be able to
 * re-fetch them. `canceled` is included for the same reason — cancellation
 * stops renewals, and the paid-for period runs out on its own.
 *
 * `revoked` is the one status that refuses: it is the operator's deliberate
 * "this licence should not work", the only case where refusing is the point.
 */
export function mayRefresh(status: string | null | undefined): boolean {
  return status !== "revoked";
}
