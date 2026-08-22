// The licence file AS A CREDENTIAL — the shared half of `flow-billing-portal`
// and `flow-license-refresh` (goal 0127 A2, contract entries 2026-08-22 01:05
// and 01:03).
//
// WHY A LICENCE IS AN ACCEPTABLE CREDENTIAL, since this is the load-bearing
// security claim and it deserves to be written down where the code is. The app
// POSTs the verbatim bytes of the `.license.json` file it holds. We verify that
// file against OUR OWN Ed25519 public key. Only the issuer can produce those
// bytes, so possessing a file that verifies is possession of something we
// signed for one named person — which is exactly the property an API token
// would have given us, minus a token registry to build, store, rotate and leak.
// That is why both endpoints run with `verify_jwt = false`: the signature IS
// the credential, and a platform JWT on top would add a second secret the app
// would have to ship without adding a second guarantee.
//
// WHAT THIS DELIBERATELY DOES NOT DO. It never trusts a field the caller sent
// outside the signed payload, never reads `license_id` or the email from the
// request body, and never accepts an unsigned or wrong-product envelope. Every
// value a caller downstream acts on comes out of `verified.payload`, i.e. out
// of bytes our own key signed.
//
// EXPIRY IS NOT CHECKED HERE, and that is intentional. A lapsed subscriber is
// precisely the person who most needs the billing portal to fix their card. An
// expired-but-authentic licence still proves identity; it just does not prove
// entitlement, and neither endpoint grants entitlement.
import { TRUSTED_LICENSE_PUBLIC_KEYS, verifyLicense } from "./license.ts";

/** The signature block that rides at `license.signature`. */
export interface LicenseSignatureBlock {
  alg?: string;
  key_id?: string;
  value?: string;
}

/** The subset of the signed payload these endpoints act on. */
export interface VerifiedLicense {
  licenseId: string;
  email: string;
  product: string;
  keyId: string;
  // deno-lint-ignore no-explicit-any
  payload: any;
}

export type LicenseRefusalReason =
  | "malformed" // not JSON, or not a { payload, signature } envelope
  | "untrusted-key" // key_id we never issue under
  | "bad-signature" // bytes do not verify against that key
  | "wrong-product" // authentic, but for a different Orionfold product
  | "incomplete"; // verified, but missing a claim we must have

export interface LicenseVerificationResult {
  ok: boolean;
  license?: VerifiedLicense;
  reason?: LicenseRefusalReason;
}

/**
 * Verify a licence envelope and pull the claims out of the SIGNED payload.
 *
 * `raw` is whatever arrived in the request body's `license` field: either the
 * verbatim file text, or the already-parsed object. Both are accepted because
 * the app sends bytes and a test is clearer with an object; the verification
 * path is identical either way.
 *
 * `expectedProduct` is checked against the signed `product` claim so a valid
 * Relay or Proof licence cannot open a Flow billing portal. One signing key
 * covers the whole constellation, so this check is the only thing separating
 * the products — see `licenseProductForLookupKey` in catalog.ts, which makes
 * the same point from the issuing side.
 */
export async function verifyLicenseCredential(
  raw: unknown,
  expectedProduct: string,
): Promise<LicenseVerificationResult> {
  // deno-lint-ignore no-explicit-any
  let envelope: any;
  if (typeof raw === "string") {
    try {
      envelope = JSON.parse(raw);
    } catch {
      return { ok: false, reason: "malformed" };
    }
  } else if (raw && typeof raw === "object") {
    envelope = raw;
  } else {
    return { ok: false, reason: "malformed" };
  }

  const payload = envelope?.payload;
  const signature: LicenseSignatureBlock | undefined = envelope?.signature;
  if (!payload || typeof payload !== "object" || !signature || typeof signature !== "object") {
    return { ok: false, reason: "malformed" };
  }
  if (signature.alg !== "ed25519" || typeof signature.value !== "string" || !signature.value) {
    return { ok: false, reason: "malformed" };
  }

  const keyId = typeof signature.key_id === "string" ? signature.key_id : "";
  const publicKey = TRUSTED_LICENSE_PUBLIC_KEYS[keyId];
  // An unknown key id is refused BEFORE any crypto runs. A caller could
  // otherwise name a key of their own choosing and we would be verifying a
  // signature against a key the attacker picked, which proves nothing.
  if (!publicKey) return { ok: false, reason: "untrusted-key" };

  if (!(await verifyLicense(payload, signature.value, publicKey))) {
    return { ok: false, reason: "bad-signature" };
  }

  // Everything below this line comes out of bytes our own key signed.
  if (payload.product !== expectedProduct) return { ok: false, reason: "wrong-product" };

  const licenseId = typeof payload.license_id === "string" ? payload.license_id : "";
  const email = typeof payload.issued_to?.email === "string"
    ? payload.issued_to.email.trim()
    : "";
  if (!licenseId || !email) return { ok: false, reason: "incomplete" };

  return {
    ok: true,
    license: { licenseId, email, product: payload.product, keyId, payload },
  };
}

/**
 * Read the licence out of a request body.
 *
 * The contract is `{ "license": "<verbatim .license.json bytes>" }`. `licence`
 * is accepted as a spelling alias so a British-spelled caller does not silently
 * get a 403 that reads like a signature failure — the endpoints are consumed by
 * a compiled app, and a refusal we can distinguish is worth two characters.
 */
export function licenseFromBody(body: unknown): unknown {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  return b.license ?? b.licence ?? null;
}
