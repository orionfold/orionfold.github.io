// orionfold.license/v1 — payload construction (the issuer's "what to sign").
//
// This is the deliberate other-half of license.ts: that module is the frozen
// crypto primitive (canonicalize + Ed25519 sign/verify, conformance-locked and
// scoped to NOT build payloads); this module builds the v1 payload object that
// gets handed to it. Keeping them apart means the signing bytes stay a stable,
// independently-tested contract while the payload shape can evolve here.
//
// A-HYBRID (OPEN-1 decided 2026-06-13): the license carries CLAIMS + TERM ONLY.
// There is NO `registry` block and NO `pull_token` — the moat is the Stripe-tied
// Supabase-gated weights, not a token on the box. Revocation is a Stripe
// status-flip that makes `entitlement-fetch` mint no fresh URL; running installs
// lapse at the term. (See arena-field-edition-license-workflow-v1.md §3 + the
// 2026-06-13 _RELAY.md entry.) The conformance vector's full-license case still
// carries `registry` — that's fine: license.ts canonicalizes WHATEVER it is
// handed, and the verifier ignores absent optional fields.
//
// The on-disk license file is `{ payload, signature }` (nested) — see
// _IDEAS/field-edition-license-sample-v1.json. The signature covers the canonical
// bytes of `payload` only, so the file may be pretty-printed safely.

import { KEPT_PROVEN_MONTHS, type LicenseEdition } from "./catalog.ts";

export const LICENSE_SCHEMA = "orionfold.license/v1";
export const LICENSE_PRODUCT = "arena-field-edition";
export const LICENSE_TIER = "field-edition";
export const LICENSE_SEATS = 1;
export const LICENSE_ENTITLEMENTS = [
  "proven-matrix-images",
  "signed-update-channel",
] as const;

/** Production signing key id — pairs with the pubkey Spark embeds in TRUSTED_KEYS. */
export const LICENSE_KEY_ID = "of-license-prod-2026";

/** Who the license was issued to (from the Stripe Checkout customer details). */
export interface IssuedTo {
  email: string;
  name?: string | null;
  org?: string | null;
}

/** Stripe provenance baked into the signed claim (matches the conformance keys). */
export interface LicenseProvenance {
  stripe_purchase_id: string | null;
  stripe_price_id: string | null;
}

export interface LicensePayloadInput {
  licenseId: string; // OF-FE-2026-NNNN
  edition: LicenseEdition;
  issuedTo: IssuedTo;
  issuedAt: string; // ISO 8601, second precision, UTC "Z"
  notBefore: string;
  expiresAt: string;
  provenance: LicenseProvenance;
}

// deno-lint-ignore no-explicit-any
export type LicensePayload = Record<string, any>;

/**
 * Format a Date as second-precision UTC ISO ("2026-06-14T00:00:00Z") — the exact
 * shape Spark's sample + conformance vector use. We strip milliseconds so the
 * term strings are clean and unambiguous for the offline Python parser. (The
 * signature would cover whatever string we emit, but matching the canonical style
 * keeps issued files visually identical to the spec sample.)
 */
export function isoSecondUTC(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Add whole calendar months in UTC (year rollover handled by setUTCMonth). */
export function addMonthsUTC(d: Date, months: number): Date {
  const r = new Date(d.getTime());
  r.setUTCMonth(r.getUTCMonth() + months);
  return r;
}

/**
 * Derive the kept-proven term from the Checkout session's creation time. A fresh
 * issuance (founding/standard) sets issued_at = not_before = the sale moment and
 * expires_at = +KEPT_PROVEN_MONTHS.
 */
export function licenseTerm(createdEpochSeconds: number): {
  issuedAt: string;
  notBefore: string;
  expiresAt: string;
} {
  const start = new Date(createdEpochSeconds * 1000);
  const issuedAt = isoSecondUTC(start);
  return {
    issuedAt,
    notBefore: issuedAt,
    expiresAt: isoSecondUTC(addMonthsUTC(start, KEPT_PROVEN_MONTHS)),
  };
}

/**
 * Build the token-less `orionfold.license/v1` payload. Keys are written in the
 * spec-sample order for readability; the signer sorts every level, so order does
 * not affect the signature. Optional issued_to fields (name/org) are OMITTED when
 * absent rather than emitted as null — Checkout does not collect an org, and a
 * missing name should not bloat the signed claim.
 */
export function buildLicensePayload(input: LicensePayloadInput): LicensePayload {
  const issuedTo: Record<string, string> = { email: input.issuedTo.email };
  if (input.issuedTo.name) issuedTo.name = input.issuedTo.name;
  if (input.issuedTo.org) issuedTo.org = input.issuedTo.org;

  return {
    schema: LICENSE_SCHEMA,
    license_id: input.licenseId,
    product: LICENSE_PRODUCT,
    edition: input.edition,
    tier: LICENSE_TIER,
    issued_to: issuedTo,
    issued_at: input.issuedAt,
    not_before: input.notBefore,
    expires_at: input.expiresAt,
    seats: LICENSE_SEATS,
    entitlements: [...LICENSE_ENTITLEMENTS],
    // NO `registry` block (A-hybrid, token-less).
    provenance: {
      stripe_purchase_id: input.provenance.stripe_purchase_id,
      stripe_price_id: input.provenance.stripe_price_id,
    },
  };
}
