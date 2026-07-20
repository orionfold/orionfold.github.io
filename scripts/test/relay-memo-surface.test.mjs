import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MEMO_SERIES } from '../../src/lib/relay/memo-series.mjs';

const dist = new URL('../../dist/', import.meta.url).pathname;
const index = readFileSync(join(dist, 'relay/memos/index.html'), 'utf8');

let cursor = -1;
for (const series of MEMO_SERIES) {
  assert.match(index, new RegExp(series.name.replace('&', '&amp;')), `${series.name} heading is rendered`);
  for (const slug of series.slugs) {
    const position = index.indexOf(`/relay/memos/${slug}/`);
    assert.ok(position > cursor, `${slug} appears in canonical series order`);
    cursor = position;

    const html = readFileSync(join(dist, `relay/memos/${slug}/index.html`), 'utf8');
    assert.doesNotMatch(html, /href=["'][^"']*article\.md/, `${slug} has no source-only article links`);
    const ctaCount = (html.match(/<a href=["'][^"']+["'] data-relay-cta-btn/g) ?? []).length;
    assert.equal(ctaCount, 2, `${slug} renders one interstitial and one footer CTA`);

    const expectedCta = series.name === 'Relay Host & Cells' ? '/relay/host/' : '/relay/';
    const ctaLinks = [...html.matchAll(/<a href=["']([^"']+)["'] data-relay-cta-btn/g)].map((match) => match[1]);
    assert.deepEqual(ctaLinks, [expectedCta, expectedCta], `${slug} uses its series CTA destination`);
  }
}

const hostPillar = readFileSync(join(dist, 'relay/memos/why-relay-host-cells/index.html'), 'utf8');
assert.doesNotMatch(hostPillar, /aria-label="Memo navigation"[\s\S]*industry-verticals/, 'Host navigation does not cross from Packs');
const cloudCapstone = readFileSync(join(dist, 'relay/memos/same-host-new-address/index.html'), 'utf8');
assert.match(cloudCapstone, /Editorial status · draft/, 'cloud capstone keeps its source draft gate');

console.log('relay-memo-surface: 11 memo routes pass series, link, status, and CTA checks');
