// Sparkle signed-feed helpers for the Orionfold Flow appcast.
//
// MEASURED 2026-08-27 from Sparkle 2.9.6 sources (the version the app builds
// against), not from its docs. The app sets `SURequireSignedFeed`, and with that
// key `SUAppcastDriver.m downloadDriverDidDownloadData:` verifies the DOWNLOADED
// BYTES before it parses a single item. There is no "empty channel is exempt"
// path: a feed with zero releases and no signature block fails with
// `SUSparkleErrorDomain code 1000` on every check, which is exactly what the
// product lane measured on 2026-08-27 01:21 PDT against the live feed.
//
// The signature block, appended AFTER the XML (`SPUExtractSignedFeed.m`):
//
//     <!-- sparkle-signatures:
//     edSignature: <base64 Ed25519 signature over the bytes BEFORE this block>
//     length: <count of those bytes>
//     -->
//
// Extraction searches BACKWARDS for the prefix and forwards from there for
// `-->`, and reads the two `key:` lines with whitespace trimmed. This module
// mirrors that byte for byte so a locally verified feed is one Sparkle accepts.
//
// This module verifies and formats. It never holds a private key: the operator
// signs with Sparkle's own `sign_update`, which strips any existing block, signs
// the content and appends a fresh block (`common_cli/Signing.swift signAppcast`).
import { createPublicKey, verify as cryptoVerify } from "node:crypto";

export const SIGNING_BLOCK_PREFIX = "<!-- sparkle-signatures:\n";
export const SIGNING_BLOCK_SUFFIX = "-->";

/**
 * The operator's one command. `--disable-signing-warning` matters: without it
 * `sign_update` parses the feed through Foundation's XMLDocument to insert a
 * warning comment and re-serialises the whole file, so the bytes before the
 * block stop matching the generator and the drift guard reads it as hand-edited.
 * The generator's own header already carries the "do not hand-edit" warning.
 * Any Sparkle 2.9.x `sign_update` works; this is the one the app build pulls.
 * With no `--ed-key-file` it reads the private key from the login Keychain,
 * where `generate_keys` put it on 2026-08-22.
 */
export const SIGN_FEED_COMMAND =
  "~/orionfold-flow/.build/xcode-release/SourcePackages/artifacts/sparkle/Sparkle/bin/sign_update " +
  "--disable-signing-warning public/flow/appcast.xml";

/** DER prefix that turns a raw 32-byte Ed25519 public key into SPKI. */
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/** NSString enumerateLinesUsingBlock: line breaks, including the Unicode ones. */
const LINE_BREAK = /\r\n|\r|\n|\u2028|\u2029|\u0085/;

/** Node KeyObject for a Sparkle-style base64 raw Ed25519 public key. */
export function ed25519PublicKey(base64) {
  const raw = Buffer.from(String(base64 ?? ""), "base64");
  if (raw.length !== 32) {
    throw new Error(`an Ed25519 public key is 32 bytes, got ${raw.length}`);
  }
  return createPublicKey({
    key: Buffer.concat([ED25519_SPKI_PREFIX, raw]),
    format: "der",
    type: "spki",
  });
}

/**
 * Split a feed into the signed content and the signature block, the way
 * `SPUExtractAppcastContent` does. Never throws: an unsigned or malformed
 * block yields the whole input as content with `edSignature: null`, which is
 * what Sparkle does too (and then fails verification).
 */
export function extractSignedFeed(feed) {
  const bytes = Buffer.isBuffer(feed) ? feed : Buffer.from(String(feed), "utf8");
  const prefix = Buffer.from(SIGNING_BLOCK_PREFIX, "utf8");
  const suffix = Buffer.from(SIGNING_BLOCK_SUFFIX, "utf8");

  const prefixAt = bytes.lastIndexOf(prefix);
  if (prefixAt === -1) {
    return { content: bytes, edSignature: null, length: null, block: null };
  }
  const afterPrefix = prefixAt + prefix.length;
  const suffixAt = bytes.indexOf(suffix, afterPrefix);
  if (suffixAt === -1) {
    return { content: bytes, edSignature: null, length: null, block: null };
  }

  const block = bytes.subarray(afterPrefix, suffixAt).toString("utf8");
  let edSignature = null;
  let length = null;
  for (const line of block.split(LINE_BREAK)) {
    if (line.startsWith("edSignature:")) {
      edSignature = line.slice("edSignature:".length).trim();
    } else if (line.startsWith("length:")) {
      // Sparkle reads this with longLongValue: leading integer, else 0.
      const parsed = Number.parseInt(line.slice("length:".length).trim(), 10);
      length = Number.isFinite(parsed) ? parsed : 0;
    }
  }
  return { content: bytes.subarray(0, prefixAt), edSignature, length, block };
}

/**
 * Verify a feed against the app's baked public key. Returns a verdict rather
 * than throwing so callers can print all the reasons at once.
 *
 *   signed  — a well-formed block with a signature line was found
 *   valid   — the signature verifies over the content AND the length matches
 */
export function verifyFeedSignature(feed, publicKeyBase64) {
  const extracted = extractSignedFeed(feed);
  const { content, edSignature, length } = extracted;
  if (!edSignature) {
    return { ...extracted, signed: false, valid: false, reason: "no sparkle-signatures block" };
  }
  const signature = Buffer.from(edSignature, "base64");
  if (signature.length !== 64) {
    return {
      ...extracted,
      signed: true,
      valid: false,
      reason: `edSignature decodes to ${signature.length} bytes, an Ed25519 signature is 64`,
    };
  }
  if (length !== content.length) {
    return {
      ...extracted,
      signed: true,
      valid: false,
      reason: `block says length ${length} but ${content.length} bytes precede it`,
    };
  }
  let publicKey;
  try {
    publicKey = ed25519PublicKey(publicKeyBase64);
  } catch (error) {
    return { ...extracted, signed: true, valid: false, reason: `bad public key: ${error.message}` };
  }
  const ok = cryptoVerify(null, content, publicKey, signature);
  return {
    ...extracted,
    signed: true,
    valid: ok,
    reason: ok ? "signature verifies" : "signature does not verify against the app's public key",
  };
}

/** Format content + signature the way `signAppcast` in Sparkle does. */
export function appendSignatureBlock(content, edSignatureBase64) {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(String(content), "utf8");
  const block = `${SIGNING_BLOCK_PREFIX}edSignature: ${edSignatureBase64}\nlength: ${bytes.length}\n${SIGNING_BLOCK_SUFFIX}\n`;
  return Buffer.concat([bytes, Buffer.from(block, "utf8")]);
}
