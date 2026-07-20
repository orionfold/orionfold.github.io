// orionfold.license/v1 — the Website (issuer) half of the signing contract.
//
// Spark's installer (fieldkit.field_edition.license) is the source of truth for
// the format and the OFFLINE verifier; this module produces the signed license
// file that installer validates. The two halves MUST produce byte-identical
// signing input — that invariant is locked by license.test.ts against the
// Spark-owned conformance vector (license-conformance-v1.json), per
// arena-field-edition-license-workflow-v1.md §6.
//
// Scope of THIS module (OPEN-1-independent): canonicalization + Ed25519 sign +
// verify. It does NOT build the full license payload or talk to Stripe/Storage
// — that is fulfillLicense's body (license-fulfillment Phase-2 task d), which is
// gated on the operator's OPEN-1 schema decision and is intentionally not here.
//
// Production signing uses the prod seed from the LICENSE_SIGNING_SEED_B64
// Supabase secret (key_id "of-license-prod-2026"). The dev key in the vector is
// a published throwaway used only by isolated staging and conformance receipts.
import * as ed from "https://esm.sh/@noble/ed25519@2?target=deno";

// Canonical signing input — a verbatim port of Spark's recipe. Rules that keep
// it byte-identical to the Python `json.dumps(payload, sort_keys=True,
// separators=(",", ":"), ensure_ascii=False)`: sort object keys at EVERY level,
// no inter-token whitespace, UTF-8 with non-ASCII emitted raw, and NO floats
// anywhere in the payload (seats is an int; dates are strings). The signature
// covers these compact bytes of `payload` only — pretty-printing the on-disk
// file is therefore safe.
// deno-lint-ignore no-explicit-any
export function canonicalize(v: any): string {
  if (Array.isArray(v)) return "[" + v.map(canonicalize).join(",") + "]";
  if (v && typeof v === "object") {
    return "{" +
      Object.keys(v).sort().map((k) =>
        JSON.stringify(k) + ":" + canonicalize(v[k])
      ).join(",") + "}";
  }
  return JSON.stringify(v); // string / number / bool / null
}

// deno-lint-ignore no-explicit-any
export function canonicalBytes(payload: any): Uint8Array {
  return new TextEncoder().encode(canonicalize(payload));
}

// First 12 hex chars of SHA-256 over the canonical bytes — the cheap drift
// check the conformance vector ships alongside each case.
// deno-lint-ignore no-explicit-any
export async function canonicalSha256_12(payload: any): Promise<string> {
  // Copy into a fresh ArrayBuffer-backed view so the type satisfies BufferSource
  // (TextEncoder yields Uint8Array<ArrayBufferLike>, which the strict lib rejects).
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new Uint8Array(canonicalBytes(payload)),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}

function b64encode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export interface LicenseSignature {
  alg: "ed25519";
  key_id: string;
  value: string; // standard base64 (padded) of the 64-byte signature
}

/**
 * Public keys accepted by the shipped Relay verifier. The production key stays
 * the default issuer identity; the committed throwaway dev key exists only for
 * isolated conformance/staging receipts. Keeping both public halves here lets
 * the issuer reject a seed/key-id mismatch before it labels and delivers a
 * license that Relay would refuse.
 */
export const TRUSTED_LICENSE_PUBLIC_KEYS: Readonly<Record<string, string>> = {
  "of-license-prod-2026": "LQVkEw+cetZGkstWJSdKoxOF/kuCrCgmGADaFi/yyDc=",
  "of-license-dev-2026-06": "A6EHv/POEL4dcN0Y50vAmWfk1jCbpQ1fHdyGZBJVMbg=",
};

// Sign a payload with a 32-byte Ed25519 seed (base64). Returns the signature
// block that rides at license.signature. Async path uses Deno's WebCrypto
// SHA-512 — no extra hashing wiring needed.
// deno-lint-ignore no-explicit-any
export async function signLicense(
  payload: any,
  seedB64: string,
  keyId: string,
): Promise<LicenseSignature> {
  const sig = await ed.signAsync(canonicalBytes(payload), b64decode(seedB64));
  return { alg: "ed25519", key_id: keyId, value: b64encode(sig) };
}

// Derive the raw 32-byte Ed25519 public key (base64) from a 32-byte seed (base64).
// Used for a belt-and-suspenders self-verify right after signing — it proves the
// LICENSE_SIGNING_SEED_B64 secret produced a signature that validates against its
// OWN public half, catching a corrupted/misconfigured seed before a bad license
// is ever delivered. (The conformance test already proves the seed→sig path for
// the dev key; this guards the prod-secret wiring at runtime.)
export async function publicKeyFromSeed(seedB64: string): Promise<string> {
  const pub = await ed.getPublicKeyAsync(b64decode(seedB64));
  return b64encode(pub);
}

export async function assertLicenseSigningIdentity(
  seedB64: string,
  keyId: string,
): Promise<string> {
  const expected = TRUSTED_LICENSE_PUBLIC_KEYS[keyId];
  if (!expected) throw new Error(`Untrusted license signing key id: ${keyId}`);
  const actual = await publicKeyFromSeed(seedB64);
  if (actual !== expected) {
    throw new Error(`License signing seed does not match trusted key id: ${keyId}`);
  }
  return actual;
}

// Verify a signature (base64) against a 32-byte raw Ed25519 public key (base64).
// deno-lint-ignore no-explicit-any
export async function verifyLicense(
  payload: any,
  signatureB64: string,
  publicKeyB64: string,
): Promise<boolean> {
  try {
    return await ed.verifyAsync(
      b64decode(signatureB64),
      canonicalBytes(payload),
      b64decode(publicKeyB64),
    );
  } catch {
    return false;
  }
}
