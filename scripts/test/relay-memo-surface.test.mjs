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
    assert.doesNotMatch(html, /Editorial status ·/i, `${slug} does not expose source workflow status`);
    assert.doesNotMatch(html, /<pre\b[^>]*class=["'][^"']*astro-code/i, `${slug} has no reader-facing code block leaked from inline SVG`);
    const ctaCount = (html.match(/<a href=["'][^"']+["'] data-relay-cta-btn/g) ?? []).length;
    assert.equal(ctaCount, 2, `${slug} renders one interstitial and one footer CTA`);

    const expectedCta = series.name === 'Relay Host & Cells' ? '/relay/host/' : '/relay/';
    const ctaLinks = [...html.matchAll(/<a href=["']([^"']+)["'] data-relay-cta-btn/g)].map((match) => match[1]);
    assert.deepEqual(ctaLinks, [expectedCta, expectedCta], `${slug} uses its series CTA destination`);
  }
}

const hostPillar = readFileSync(join(dist, 'relay/memos/why-relay-host-cells/index.html'), 'utf8');
assert.doesNotMatch(hostPillar, /aria-label="Memo navigation"[\s\S]*industry-verticals/, 'Host navigation does not cross from Packs');
const diagramMemo = readFileSync(join(dist, 'relay/memos/why-relay-packs/index.html'), 'utf8');
assert.match(diagramMemo, /<figure class="fn-diagram"[\s\S]*?<svg\b[\s\S]*?<ellipse\b[\s\S]*?<\/svg>[\s\S]*?<figcaption>/, 'diagram-bearing memo retains complete SVG geometry and caption');

console.log('relay-memo-surface: 11 memo routes pass series, render fidelity, link, status, and CTA checks');
