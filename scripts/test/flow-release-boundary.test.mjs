import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { evaluateFlowReleaseBoundary } from '../check-flow-release-boundary.mjs';

const read = (relativePath) => readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');
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

test('the current local launch rehearsal is mechanically blocked from deployment', () => {
  const result = evaluateFlowReleaseBoundary({
    launchSource: read('src/data/launch.ts'),
    pricingSource: read('src/data/flow-pricing.ts'),
    appcastSource: read('public/flow/appcast.xml'),
    releaseDeclared: undefined,
  });
  assert.equal(result.state, 'blocked');
  assert.match(result.problems.join('\n'), /operator release declaration/);
  assert.match(result.problems.join('\n'), /rehearsal placeholder/);
  assert.match(result.problems.join('\n'), /no published release item/);
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

test('the public CTA and the signed feed must identify the same current DMG', () => {
  const result = evaluateFlowReleaseBoundary({
    launchSource: launch(true),
    pricingSource: pricing(realDmg),
    appcastSource: appcast('https://downloads.orionfold.com/flow/another.dmg', { feedSigned: false }),
    releaseDeclared: 'true',
  });
  assert.equal(result.state, 'blocked');
  assert.match(result.problems.join('\n'), /does not match FLOW_DMG_URL/);
  assert.match(result.problems.join('\n'), /no appended signed-feed block/);
});
