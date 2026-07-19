import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const layoutUrl = new URL('../../src/layouts/Layout.astro', import.meta.url);
const googleTagUrl = 'https://www.googletagmanager.com/gtag/js?id=G-04PH843W2C';

test('Google tag keeps its queue but cannot delay document load completion', async () => {
  const source = await readFile(layoutUrl, 'utf8');
  const queueAt = source.indexOf('window.dataLayer = window.dataLayer || [];');
  const ga4ConfigAt = source.indexOf("gtag('config', 'G-04PH843W2C');");
  const adsConfigAt = source.indexOf("gtag('config', 'AW-18188052159');");
  const loaderAt = source.indexOf('function loadGoogleTag()');
  const loadGateAt = source.indexOf(
    "window.addEventListener('load', loadGoogleTag, { once: true });",
  );

  assert.ok(queueAt !== -1, 'the synchronous dataLayer queue must remain');
  assert.ok(ga4ConfigAt > queueAt, 'GA4 config must be queued after initialization');
  assert.ok(adsConfigAt > ga4ConfigAt, 'Ads config must retain its existing order');
  assert.ok(loaderAt > adsConfigAt, 'network loading must not precede queued config');
  assert.ok(loadGateAt > loaderAt, 'the external fetch must be gated by document load');

  assert.doesNotMatch(
    source,
    /<script[^>]+src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js/,
    'a parser-discovered Google tag would reintroduce the processing tail',
  );
  assert.match(source, /var loaded = false;/);
  assert.match(source, /if \(loaded\) return;/);
  assert.match(source, /tag\.async = true;/);
  assert.match(source, new RegExp(`tag\\.src = '${googleTagUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}';`));
  assert.match(source, /document\.head\.appendChild\(tag\);/);
});
