import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { transform } from "esbuild";
const source = readFileSync(
  new URL(
    "../../src/scripts/living-documents-confirmation.ts",
    import.meta.url,
  ),
  "utf8",
).replace(/import[^;]+;/, "");
const { code } = await transform(source, { loader: "ts" });
function fixture(query) {
  const copy = { textContent: "" };
  const panel = {
    querySelector: () => copy,
    classList: { remove() {} },
    focus() {},
  };
  const events = [];
  const location = {
    pathname: "/manifesto/",
    search: query,
    hash: "#email-updates",
  };
  const context = vm.createContext({
    FLOW_LIVING_DOCUMENTS_OFFER: "flow-living-documents-v1",
    URLSearchParams,
    location,
    document: { querySelector: () => panel, addEventListener() {} },
    history: {
      replaceState(_state, _title, url) {
        const u = new URL(url, "https://orionfold.com");
        location.search = u.search;
        location.hash = u.hash;
      },
    },
    window: { gtag: (...args) => events.push(args) },
  });
  return { run: () => vm.runInContext(code, context), copy, events, location };
}
test("dedicated success return counts once and preserves unrelated query and fragment", () => {
  const f = fixture("?living-documents-confirmed=1&utm_source=email");
  f.run();
  assert.equal(f.events.length, 1);
  assert.equal(f.events[0][1], "confirmed_lead");
  assert.equal(f.events[0][2].offer, "flow-living-documents-v1");
  assert.equal(f.events[0][2].form_source, "manifesto-living-documents");
  assert.equal(f.location.search, "?utm_source=email");
  assert.equal(f.location.hash, "#email-updates");
  assert.match(f.copy.textContent, /AI Native Newsletter/);
  f.run();
  assert.equal(f.events.length, 1);
});
test("unavailable confirmation acknowledges without counting a lead", () => {
  const f = fixture("?living-documents-confirmed=error");
  f.run();
  assert.equal(f.events.length, 0);
  assert.match(f.copy.textContent, /unavailable/);
  assert.equal(f.location.search, "");
});
test("legacy confirmation queries and banner state are untouched", () => {
  for (
    const query of ["?confirmed=1", "?confirmed=already", "?confirmed=error"]
  ) {
    const f = fixture(query);
    f.run();
    assert.equal(f.events.length, 0);
    assert.equal(f.copy.textContent, "");
    assert.equal(f.location.search, query);
  }
});

// Passive homepage adapter: the existing panel controller and tests above remain unchanged.
const bannerSource = readFileSync(new URL('../../src/scripts/living-documents-confirmation-banner.ts', import.meta.url), 'utf8');
const { code: bannerCode } = await transform(bannerSource.replace(/import[^;]+;/, '').replace('export function', 'function'), { loader: 'ts' });
function bannerFixture(query, { stored = {}, storageFails = false, pathname = '/' } = {}) {
  function element() {
    const classes = new Set(['hidden']);
    const listeners = new Map();
    return {
      textContent: '', hidden: false, inert: false, dataset: {}, attributes: new Map(),
      setAttribute(name, value) { this.attributes.set(name, value); },
      removeAttribute(name) { this.attributes.delete(name); },
      classList: { remove: value => classes.delete(value), add: value => classes.add(value), contains: value => classes.has(value) },
      addEventListener: (event, callback) => listeners.set(event, callback),
      click: () => listeners.get('click')?.(),
    };
  }
  const nodes = Object.fromEntries(['confirm-bar', 'confirm-bar-text', 'confirm-bar-detail', 'confirm-bar-close', 'confirm-bar-cta', 'magnet-bar'].map(id => [id, element()]));
  const events = [], pixelEvents = [], redirects = [], timers = new Map();
  const storage = new Map(Object.entries(stored));
  const local = new Map([['of-flow-bar-dismissed', '1']]);
  const sessionStorage = {
    getItem(key) { if (storageFails) throw Error('blocked'); return storage.get(key) ?? null; },
    setItem(key, value) { if (storageFails) throw Error('blocked'); storage.set(key, value); },
  };
  const location = { pathname, search: query, hash: '#welcome', replace: url => redirects.push(url) };
  let timerId = 0;
  const context = vm.createContext({
    FLOW_LIVING_DOCUMENTS_OFFER: 'flow-living-documents-v1', URL, URLSearchParams, location,
    document: { getElementById: id => nodes[id] }, sessionStorage,
    localStorage: { removeItem(key) { if (storageFails) throw Error('blocked'); local.delete(key); } },
    history: { replaceState(_state, _title, url) { const u = new URL(url, 'https://orionfold.com'); location.search = u.search; location.hash = u.hash; } },
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id),
    window: { gtag: (...args) => events.push(JSON.parse(JSON.stringify(args))), fbq: (...args) => pixelEvents.push(JSON.parse(JSON.stringify(args))) },
  });
  return {
    run: () => vm.runInContext(bannerCode + '\nacknowledgeLivingDocumentsConfirmation();', context),
    nodes, events, pixelEvents, location, storage, local, timers, redirects,
  };
}
test('Flow success uses the existing bar, counts once, and preserves attribution and legacy query fields', () => {
  const f = bannerFixture('?living-documents-confirmed=1&utm_source=email&confirmed=already');
  assert.equal(f.run(), true);
  assert.equal(f.nodes['confirm-bar'].classList.contains('hidden'), false);
  assert.equal(f.nodes['confirm-bar-text'].textContent, 'Thanks for subscribing to the Flow email newsletter.');
  assert.equal(f.nodes['confirm-bar-detail'].hidden, true);
  assert.equal(f.nodes['confirm-bar-cta'].hidden, true, 'the acknowledgement adds no third action');
  assert.equal(f.nodes['magnet-bar'].classList.contains('hidden'), false, 'download retains its layout box');
  assert.equal(f.nodes['magnet-bar'].dataset.confirmationCovered, 'true');
  assert.equal(f.nodes['magnet-bar'].inert, true);
  assert.equal(f.nodes['magnet-bar'].attributes.get('aria-hidden'), 'true');
  assert.equal(f.local.has('of-flow-bar-dismissed'), false, 'past dismissal cannot suppress the returning download');
  assert.equal(f.location.search, '?utm_source=email&confirmed=already');
  assert.equal(f.location.hash, '#welcome');
  assert.deepEqual(f.events, [['event', 'confirmed_lead', { offer: 'flow-living-documents-v1', form_source: 'manifesto-living-documents' }]]);
  assert.equal(f.pixelEvents.length, 1);
  assert.equal(f.storage.has('of-living-documents-confirmed'), false, 'no persistent conversion state hides the download');
  assert.equal(f.storage.has('of-confirm-welcome'), false);
  assert.equal(f.storage.has('of-confirm-welcome-dismissed'), false);
  assert.equal(f.run(), false);
  assert.equal(f.events.length, 1);
});
test('the Flow acknowledgement auto-dismisses after eight seconds or closes immediately', () => {
  for (const state of ['1', 'already', 'error']) {
    const f = bannerFixture(`?living-documents-confirmed=${state}`);
    f.run();
    const [timer] = [...f.timers.values()];
    assert.equal(timer.delay, 8000);
    timer.callback();
    assert.equal(f.nodes['confirm-bar'].classList.contains('hidden'), true);
    assert.equal(f.timers.size, 0);
    assert.equal(f.nodes['magnet-bar'].classList.contains('hidden'), false);
    assert.equal(f.nodes['magnet-bar'].inert, false);
    assert.equal(f.nodes['magnet-bar'].attributes.has('aria-hidden'), false);
    assert.equal(f.nodes['magnet-bar'].dataset.confirmationCovered, undefined);
    const manual = bannerFixture(`?living-documents-confirmed=${state}`);
    manual.run();
    manual.nodes['confirm-bar-close'].click();
    assert.equal(manual.nodes['confirm-bar'].classList.contains('hidden'), true);
    assert.equal(manual.timers.size, 0);
    assert.equal(manual.nodes['magnet-bar'].classList.contains('hidden'), false);
    assert.equal(manual.nodes['magnet-bar'].inert, false);
    assert.equal(manual.nodes['magnet-bar'].dataset.confirmationCovered, undefined);
  }
});
test('already and error acknowledge without confirmed-lead or ad conversion events', () => {
  for (const state of ['already', 'error']) {
    const f = bannerFixture(`?living-documents-confirmed=${state}`);
    assert.equal(f.run(), true);
    assert.equal(f.nodes['confirm-bar'].dataset.confirmationState, state);
    assert.equal(f.events.length, 0);
    assert.equal(f.pixelEvents.length, 0);
    assert.equal(f.location.search, '');
    assert.equal(f.nodes['confirm-bar-cta'].hidden, true);
  }
});
test('legacy confirmations and invalid or ambiguous namespaced states are untouched', () => {
  for (const query of ['?confirmed=1', '?confirmed=already', '?confirmed=error&error=expired', '?living-documents-confirmed=unknown', '?living-documents-confirmed=1&living-documents-confirmed=error']) {
    const f = bannerFixture(query, { stored: { 'of-confirm-welcome': '1', 'of-confirm-welcome-dismissed': '1' } });
    assert.equal(f.run(), false);
    assert.equal(f.location.search, query);
    assert.equal(f.events.length, 0);
    assert.equal(f.nodes['confirm-bar'].classList.contains('hidden'), true);
    assert.deepEqual([...f.storage], [['of-confirm-welcome', '1'], ['of-confirm-welcome-dismissed', '1']]);
  }
});
test('storage restrictions do not suppress the thank-you or its dismissal', () => {
  const f = bannerFixture('?living-documents-confirmed=1', { storageFails: true });
  assert.equal(f.run(), true);
  assert.equal(f.nodes['confirm-bar'].classList.contains('hidden'), false);
  f.nodes['confirm-bar-close'].click();
  assert.equal(f.nodes['confirm-bar'].classList.contains('hidden'), true);
});
