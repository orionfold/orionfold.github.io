import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const lighthouseConfig = require('../../.lighthouserc.cjs');
const layoutUrl = new URL('../../src/layouts/Layout.astro', import.meta.url);
const googleTagUrl = 'https://www.googletagmanager.com/gtag/js?id=G-04PH843W2C';
const gateStart = '/* G-042 canonical analytics gate. */';
const gateEnd = '/* G-042 canonical analytics gate end. */';

async function loaderSource() {
  const source = await readFile(layoutUrl, 'utf8');
  const start = source.indexOf(gateStart);
  const end = source.indexOf(gateEnd);
  assert.ok(start !== -1, 'the canonical analytics gate must have a stable start marker');
  assert.ok(end > start, 'the canonical analytics gate must have a stable end marker');
  return { source, script: source.slice(start, end + gateEnd.length) };
}

function runLoader(script, hostname, readyState = 'loading') {
  const listeners = new Map();
  const appended = [];
  const window = {
    location: { hostname },
    addEventListener(type, handler, options) {
      listeners.set(type, { handler, options });
    },
  };
  const document = {
    readyState,
    createElement(name) {
      return { nodeName: name.toUpperCase(), async: false, src: '' };
    },
    head: {
      appendChild(node) {
        appended.push(node);
      },
    },
  };

  vm.runInNewContext(script, { window, document, Date });

  return {
    window,
    listeners,
    appended,
    fire(type) {
      const listener = listeners.get(type);
      if (!listener) return;
      listener.handler();
      if (listener.options?.once) listeners.delete(type);
    },
  };
}

test('Google tag keeps its queue but cannot delay document load completion', async () => {
  const { source } = await loaderSource();
  const queueAt = source.indexOf('window.dataLayer = window.dataLayer || [];');
  const hostGateAt = source.indexOf("window.location.hostname === 'orionfold.com'");
  const ga4ConfigAt = source.indexOf("window.gtag('config', 'G-04PH843W2C');");
  const adsConfigAt = source.indexOf("window.gtag('config', 'AW-18188052159');");
  const loaderAt = source.indexOf('function loadGoogleTag()');
  const loadGateAt = source.indexOf(
    "window.addEventListener('load', loadGoogleTag, { once: true });",
  );

  assert.ok(hostGateAt !== -1, 'analytics must be restricted to the canonical host');
  assert.ok(queueAt > hostGateAt, 'the synchronous dataLayer queue must stay inside the host gate');
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

test('canonical production queues GA4 and Ads and loads gtag exactly once after load', async () => {
  const { script } = await loaderSource();
  const run = runLoader(script, 'orionfold.com');

  assert.equal(typeof run.window.gtag, 'function');
  assert.equal(run.window.dataLayer.length, 3);
  assert.deepEqual(
    Array.from(run.window.dataLayer, (entry) => [entry[0], entry[1]]),
    [
      ['js', run.window.dataLayer[0][1]],
      ['config', 'G-04PH843W2C'],
      ['config', 'AW-18188052159'],
    ],
  );
  assert.ok(run.window.dataLayer[0][1] instanceof Date);
  assert.equal(run.appended.length, 0, 'gtag.js must wait for document load');
  assert.equal(run.listeners.get('load')?.options?.once, true);

  run.fire('load');
  run.fire('load');
  assert.equal(run.appended.length, 1, 'load and repeat callbacks cannot duplicate gtag.js');
  assert.equal(run.appended[0].nodeName, 'SCRIPT');
  assert.equal(run.appended[0].async, true);
  assert.equal(run.appended[0].src, googleTagUrl);
});

test('canonical production loaded after document completion still appends exactly once', async () => {
  const { script } = await loaderSource();
  const run = runLoader(script, 'orionfold.com', 'complete');

  assert.equal(run.listeners.size, 0);
  assert.equal(run.appended.length, 1);
  assert.equal(run.appended[0].src, googleTagUrl);
});

for (const hostname of ['localhost', '127.0.0.1', 'orionfold.github.io', 'preview.orionfold.com']) {
  test(`noncanonical host ${hostname} creates no analytics state or network loader`, async () => {
    const { script } = await loaderSource();
    const run = runLoader(script, hostname);

    assert.equal(run.window.dataLayer, undefined);
    assert.equal(run.window.gtag, undefined);
    assert.equal(run.listeners.size, 0);
    assert.equal(run.appended.length, 0);
    run.fire('load');
    assert.equal(run.appended.length, 0);
  });
}

test('Lighthouse blocks analytics endpoints as defense in depth', () => {
  const collect = lighthouseConfig.ci.collect;
  assert.equal(collect.url.length, 6);
  assert.equal(collect.numberOfRuns, 3);
  assert.deepEqual(collect.settings.blockedUrlPatterns, [
    '*googletagmanager.com/*',
    '*google-analytics.com/*',
    '*googleadservices.com/*',
    '*doubleclick.net/*',
  ]);
});
