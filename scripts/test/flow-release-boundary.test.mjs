import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { evaluateFlowReleaseBoundary } from '../check-flow-release-boundary.mjs';

const read = (relativePath) => readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');
// The stable CTA object (what FLOW_DMG_URL must be) and a versioned enclosure
// (what the feed names). Since 2026-08-29 these are deliberately DIFFERENT URLs
// — see the header of check-flow-release-boundary.mjs.
const stableDmg = 'https://orionfold.supabase.co/storage/v1/object/public/flow-downloads/Orionfold-Flow.dmg';
const realDmg = 'https://downloads.orionfold.com/flow/Orionfold-Flow-1.0.0.dmg';
const launch = (live) => `export const ORIONFOLD_FLOW_LIVE = ${live};`;
const pricing = (url) => `export const FLOW_DMG_URL = "${url}";`;
const appcast = (url = realDmg, { feedSigned = true } = {}) => `
<rss xmlns:sparkle="http://www.andymatuschak.org/xml-namespaces/sparkle">
  <channel><item>
    <sparkle:version>1048</sparkle:version>
    <enclosure url="${url}" length="48231004" type="application/octet-stream" sparkle:edSignature="Zm9vYmFy" />
  </item></channel>
</rss>
${feedSigned ? '<!-- sparkle-signatures:\nedSignature: ZmVlZA==\nlength: 512\n-->' : ''}`;

test('the real checkout can never deploy a live Flow without the operator declaration', () => {
  // Reads the committed sources, not fixtures. Whatever rehearsal state the
  // checkout is in, the one invariant is that no combination of local files
  // reaches release-ready on its own: only the operator-owned repository
  // variable FLOW_RELEASE_DECLARED can do that.
  const result = evaluateFlowReleaseBoundary({
    launchSource: read('src/data/launch.ts'),
    pricingSource: read('src/data/flow-pricing.ts'),
    appcastSource: read('public/flow/appcast.xml'),
    releasesSource: read('src/data/flow-releases.ts'),
    releaseDeclared: undefined,
  });
  assert.notEqual(result.state, 'release-ready');
  if (result.live) {
    assert.equal(result.state, 'blocked');
    assert.match(result.problems.join('\n'), /operator release declaration/);
  } else {
    assert.equal(result.state, 'launch-dark');
  }
});

test('the public CTA in the real checkout is the permanent download object', () => {
  // Until 2026-08-29 this asserted the CTA equalled the newest appcast
  // enclosure, because both were hand-edited on every release. The CTA is now
  // a stable object the product lane overwrites in place, so the assertion that
  // actually protects users is that it never drifts back to a versioned path
  // (which would mean the per-release edit had returned) and never leaves the
  // download host for this public repo.
  const pricingUrl = read('src/data/flow-pricing.ts').match(/export const FLOW_DMG_URL = "([^"]+)";/)[1];
  assert.equal(pricingUrl, stableDmg, 'FLOW_DMG_URL must be the one permanent download URL');
  assert.equal(new URL(pricingUrl).hostname, 'orionfold.supabase.co', 'DMG URLs go through the vanity host, never the project ref');
});

test('a launch-dark build remains deployable without release materials', () => {
  const result = evaluateFlowReleaseBoundary({
    launchSource: launch(false),
    pricingSource: pricing('https://PLACEHOLDER.invalid/flow/Flow.dmg'),
    appcastSource: '<rss><channel></channel></rss>',
    releaseDeclared: undefined,
  });
  assert.deepEqual(result.problems, []);
  assert.equal(result.state, 'launch-dark');
});

test('an operator-declared release needs one matching signed package and feed', () => {
  const result = evaluateFlowReleaseBoundary({
    launchSource: launch(true),
    pricingSource: pricing(realDmg),
    appcastSource: appcast(),
    releaseDeclared: 'true',
  });
  assert.deepEqual(result.problems, []);
  assert.equal(result.state, 'release-ready');
});

test('a real package cannot substitute for the operator release declaration', () => {
  const result = evaluateFlowReleaseBoundary({
    launchSource: launch(true),
    pricingSource: pricing(realDmg),
    appcastSource: appcast(),
    releaseDeclared: 'false',
  });
  assert.equal(result.state, 'blocked');
  assert.match(result.problems.join('\n'), /operator release declaration/);
});

test('a non-empty feed with no signed block is blocked', () => {
  const result = evaluateFlowReleaseBoundary({
    launchSource: launch(true),
    pricingSource: pricing(realDmg),
    appcastSource: appcast('https://downloads.orionfold.com/flow/another.dmg', { feedSigned: false }),
    releaseDeclared: 'true',
  });
  assert.equal(result.state, 'blocked');
  assert.match(result.problems.join('\n'), /no appended signed-feed block/);
});

test('the feed naming a different DMG than the CTA is no longer a failure', () => {
  // This is the migration's whole point and is worth a test of its own, because
  // it is the one assertion that was deliberately REMOVED. The stable CTA and a
  // versioned enclosure differ by design; a future edit that reinstates the
  // comparison would block every deploy, so pin the intended behaviour.
  const result = evaluateFlowReleaseBoundary({
    launchSource: launch(true),
    pricingSource: pricing(stableDmg),
    appcastSource: signedAppcast('https://orionfold.supabase.co/storage/v1/object/public/flow-downloads/1.5.6/1563/Orionfold-Flow-1.5.6-1563.dmg'),
    releaseDeclared: 'true',
    releasesSource: releases(throwawayPublic),
  });
  assert.deepEqual(result.problems, []);
  assert.equal(result.state, 'release-ready');
});

test('a CTA that drifts back to a versioned path is blocked', () => {
  // The failure this replaces the enclosure check with: if someone resumes
  // hand-editing the CTA per release, the deploy stops.
  const result = evaluateFlowReleaseBoundary({
    launchSource: launch(true),
    pricingSource: pricing('https://orionfold.supabase.co/storage/v1/object/public/flow-downloads/1.5.6/1563/Orionfold-Flow-1.5.6-1563.dmg'),
    appcastSource: signedAppcast(),
    releaseDeclared: 'true',
    releasesSource: releases(throwawayPublic),
  });
  assert.equal(result.state, 'blocked');
  assert.match(result.problems.join('\n'), /must be the stable download object/);
});

// ---------------------------------------------------------------------------
// When the app's public key is supplied, the signed-feed block is VERIFIED,
// not merely detected. A block signed by another key, or over different bytes,
// is the same failure to a user as no block at all.
// ---------------------------------------------------------------------------

import { generateKeyPairSync, sign as cryptoSign } from 'node:crypto';
import { appendSignatureBlock } from '../lib/sparkle-feed.mjs';

const throwaway = generateKeyPairSync('ed25519');
const throwawayPublic = throwaway.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64');
const releases = (publicBase64) => `export const FEED_PUBLIC_ED_KEY_BASE64 = "${publicBase64}";`;
const signedAppcast = (url = realDmg) => {
  const content = Buffer.from(appcast(url, { feedSigned: false }), 'utf8');
  const signature = cryptoSign(null, content, throwaway.privateKey).toString('base64');
  return appendSignatureBlock(content, signature).toString('utf8');
};

test('a declared release with a feed signed by the app\'s key is release-ready', () => {
  const result = evaluateFlowReleaseBoundary({
    launchSource: launch(true),
    pricingSource: pricing(realDmg),
    appcastSource: signedAppcast(),
    releaseDeclared: 'true',
    releasesSource: releases(throwawayPublic),
  });
  assert.deepEqual(result.problems, []);
  assert.equal(result.state, 'release-ready');
});

test('a feed block that does not verify against the app\'s key is blocked', () => {
  const other = generateKeyPairSync('ed25519').publicKey
    .export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64');
  const result = evaluateFlowReleaseBoundary({
    launchSource: launch(true),
    pricingSource: pricing(realDmg),
    appcastSource: signedAppcast(),
    releaseDeclared: 'true',
    releasesSource: releases(other),
  });
  assert.equal(result.state, 'blocked');
  assert.match(result.problems.join('\n'), /does not verify against the app's EdDSA public key/);
});

test('a feed edited after signing is blocked even though its block is intact', () => {
  const edited = signedAppcast().replace('length="48231004"', 'length="48231005"');
  const result = evaluateFlowReleaseBoundary({
    launchSource: launch(true),
    pricingSource: pricing(realDmg),
    appcastSource: edited,
    releaseDeclared: 'true',
    releasesSource: releases(throwawayPublic),
  });
  assert.equal(result.state, 'blocked');
  assert.match(result.problems.join('\n'), /does not verify/);
});
