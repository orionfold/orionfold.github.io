import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';
import { transform } from 'esbuild';
const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const source = read('src/scripts/living-documents-confirmation.ts');
const { code } = await transform(source.replace(/import[^;]+;/, '').replace('export function', 'function'), { loader: 'ts' });
const redirectSource = read('src/scripts/living-documents-confirmation-redirect.ts');
const { code: redirectCode } = await transform(redirectSource.replace('export function', 'function'), { loader: 'ts' });
const endpoint = 'https://orionfold.supabase.co/functions/v1/flow-living-documents-confirm';
function fixture(query, { stored = {}, storageFails = false, pathname = '/' } = {}) {
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
    run: () => vm.runInContext(code + '\nacknowledgeLivingDocumentsConfirmation();', context),
    redirect: (enabled = true) => vm.runInContext(redirectCode + `\nredirectLegacyLivingConfirmation(${JSON.stringify(endpoint)}, ${enabled});`, context),
    nodes, events, pixelEvents, location, storage, local, timers, redirects,
  };
}
test('Flow success uses the existing bar, counts once, and preserves attribution and legacy query fields', () => {
  const f = fixture('?living-documents-confirmed=1&utm_source=email&confirmed=already');
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
    const f = fixture(`?living-documents-confirmed=${state}`);
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
    const manual = fixture(`?living-documents-confirmed=${state}`);
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
    const f = fixture(`?living-documents-confirmed=${state}`);
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
    const f = fixture(query, { stored: { 'of-confirm-welcome': '1', 'of-confirm-welcome-dismissed': '1' } });
    assert.equal(f.run(), false);
    assert.equal(f.location.search, query);
    assert.equal(f.events.length, 0);
    assert.equal(f.nodes['confirm-bar'].classList.contains('hidden'), true);
    assert.deepEqual([...f.storage], [['of-confirm-welcome', '1'], ['of-confirm-welcome-dismissed', '1']]);
  }
});
test('storage restrictions do not suppress the thank-you or its dismissal', () => {
  const f = fixture('?living-documents-confirmed=1', { storageFails: true });
  assert.equal(f.run(), true);
  assert.equal(f.nodes['confirm-bar'].classList.contains('hidden'), false);
  f.nodes['confirm-bar-close'].click();
  assert.equal(f.nodes['confirm-bar'].classList.contains('hidden'), true);
});
test('old site email links silently continue to the GET confirmation endpoint', () => {
  const token = 'a'.repeat(64);
  const f = fixture(`?token=${token}&utm_source=email`, { pathname: '/flow/confirm/' });
  f.redirect();
  assert.deepEqual(f.redirects, [`${endpoint}?token=${token}`]);
  assert.equal(f.location.search, '');
  assert.equal(f.location.hash, '');
  assert.equal(f.events.length, 0);
});
test('invalid, ambiguous, and preview tokens never reach a confirmation endpoint', () => {
  for (const query of ['', '?token=bad', `?token=${'A'.repeat(64)}`, `?token=${'a'.repeat(64)}&token=${'b'.repeat(64)}`]) {
    const f = fixture(query, { pathname: '/flow/confirm/' });
    f.redirect();
    assert.deepEqual(f.redirects, ['/?living-documents-confirmed=error']);
  }
  const f = fixture(`?token=${'a'.repeat(64)}`, { pathname: '/flow/confirm/' });
  f.redirect(false);
  assert.deepEqual(f.redirects, ['/?living-documents-confirmed=error']);
});
test('the old site route has no authored confirmation screen, form, or analytics shell', () => {
  const page = read('src/pages/flow/confirm.astro');
  assert.match(page, /name="robots" content="noindex, nofollow"/);
  assert.match(page, /name="referrer" content="no-referrer"/);
  assert.doesNotMatch(page, /import Layout|<form|<button|<h1|gtag|fbq|googletagmanager|google-analytics|Return to email updates/);
  assert.match(page, /redirectLegacyLivingConfirmation\(serviceEndpoint\('flow-living-documents-confirm'\), SERVICE_ACTIONS_ENABLED\)/);
  assert.doesNotMatch(source + redirectSource, /fetch\(|requestSubmit\(|\.submit\(/);
  assert.equal(existsSync(new URL('../../src/components/living/LivingDocumentsConfirmation.astro', import.meta.url)), false);
  assert.doesNotMatch(read('src/components/living/EmailInvitation.astro'), /LivingDocumentsConfirmation/);
  assert.match(read('src/components/ui/ConfirmBanner.astro'), /if \(acknowledgeLivingDocumentsConfirmation\(\)\) return;/);
});
