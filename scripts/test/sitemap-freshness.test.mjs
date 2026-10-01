// Sitemap freshness + GSC 404 successors (2026-10-01 indexing pass).
// lastmod is the sitemap field Google uses to schedule crawls, so every dated
// content collection must feed the map from its own frontmatter. Receipts and
// letters sat undated until this pass; a regression drops them back silently.
// The two redirects give GSC-reported 404s with real successors a landing.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const config = read('astro.config.mjs');

test('receipts and letters feed sitemap lastmod from their date: frontmatter', () => {
  assert.match(config, /\['receipts', '\/receipts\/'\]/);
  assert.match(config, /\['letters', '\/letter\/'\]/);
  for (const hub of ["'/receipts/'", "'/letter/'"]) {
    const hubList = config.match(/for \(const hub of \[([^\]]+)\]\)/)?.[1] ?? '';
    assert.ok(hubList.includes(hub), `${hub} hub inherits its freshest child date`);
  }
});

test('GSC 404s with real successors redirect', () => {
  assert.match(config, /'\/books\/field-notes\/': '\/books\/ai-research-on-nvidia-dgx-spark\/'/);
  assert.match(config, /'\/book\/ai-native-business\/': '\/books\/ai-native-business\/'/);
  assert.ok(existsSync(new URL('../../src/content/products/books/ai-research-on-nvidia-dgx-spark.md', import.meta.url)));
  assert.ok(existsSync(new URL('../../src/content/products/books/ai-native-business.md', import.meta.url)));
});

test('built sitemap dates receipts and letters (when dist exists)', { skip: !existsSync(new URL('../../dist/sitemap-0.xml', import.meta.url)) }, () => {
  const xml = read('dist/sitemap-0.xml');
  for (const loc of ['https://orionfold.com/receipts/', 'https://orionfold.com/letter/the-cheaper-tokens-get/']) {
    const entry = xml.match(new RegExp(`<url><loc>${loc.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}</loc>(.*?)</url>`))?.[1];
    assert.ok(entry, `${loc} is in the sitemap`);
    assert.match(entry, /<lastmod>\d{4}-\d{2}-\d{2}/, `${loc} carries a real lastmod`);
  }
});
