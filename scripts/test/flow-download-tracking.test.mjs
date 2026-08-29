import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

// The Flow download listener is the ONLY measurement of the download step. It
// is delegated on `document` so it survives astro:after-swap, which means a
// string-match test would pass while the handler silently did nothing. These
// tests EXECUTE the handler against a fake DOM and assert on the event payload.

const layoutUrl = new URL('../../src/layouts/Layout.astro', import.meta.url);

async function downloadListenerSource() {
  const source = await readFile(layoutUrl, 'utf8');
  const marker = "document.addEventListener('click', function (e) {\n        var link = e.target";
  const start = source.indexOf(marker);
  assert.ok(start !== -1, 'the download click listener must remain a delegated document listener');
  const end = source.indexOf('</script>', start);
  assert.ok(end > start, 'the listener must stay inside its own inline script');
  return source.slice(start, end);
}

/** Run the listener against one fake clicked element, return the gtag calls. */
function fireClick(script, element) {
  const calls = [];
  let handler = null;
  const context = {
    document: {
      addEventListener(type, fn) {
        if (type === 'click') handler = fn;
      },
    },
    window: {
      location: { href: 'https://orionfold.com/flow/' },
      gtag: (...args) => calls.push(args),
    },
    URL,
    decodeURIComponent,
  };
  context.window.window = context.window;
  vm.createContext(context);
  vm.runInContext(script, context);
  assert.ok(handler, 'the script must register a click handler');
  handler({ target: { closest: (sel) => (sel === '[data-flow-download]' ? element : null) } });
  return calls;
}

const anchor = (surface, href, text) => ({
  tagName: 'A',
  textContent: text,
  getAttribute: (name) =>
    name === 'data-flow-download' ? surface : name === 'href' ? href : null,
});

test('a download click reports GA4 file_download with the surface that produced it', async () => {
  const script = await downloadListenerSource();
  const calls = fireClick(script, anchor('home-hero', 'https://dl.example.com/flow/Flow.dmg'));

  assert.equal(calls.length, 1, 'exactly one analytics event per click');
  const [event, name, params] = [calls[0][0], calls[0][1], calls[0][2]];
  assert.equal(event, 'event');
  // `file_download` is a GA4 RECOMMENDED name. Renaming it demotes the event to
  // a custom one that must be registered by hand before it reports.
  assert.equal(name, 'file_download', 'the GA4 recommended event name is required');
  assert.equal(params.link_source, 'home-hero', 'the clicked surface must be attributable');
  assert.equal(params.file_name, 'Flow.dmg');
  // GA4's BUILT-IN Link dimensions. `link_source` is a custom parameter and only
  // reports once someone registers a custom dimension; `link_id` / `link_url`
  // are standard, so the per-placement split is readable in a plain report.
  assert.equal(params.link_id, 'home-hero', 'Link ID carries the placement for the standard GA4 report');
  assert.equal(params.link_url, 'https://dl.example.com/flow/Flow.dmg', 'Link URL carries the href');
});

test('the visible label rides along as GA4 Link text, and an empty label is omitted rather than sent blank', async () => {
  const script = await downloadListenerSource();
  const labelled = fireClick(script, anchor('story-top-x', 'https://d.example/Flow.dmg', '\n  Download Flow Now\n'));
  assert.equal(labelled[0][2].link_text, 'Download Flow Now', 'whitespace-trimmed visible label');
  const unlabelled = fireClick(script, anchor('nav-desktop', 'https://d.example/Flow.dmg'));
  assert.ok(!('link_text' in unlabelled[0][2]), 'no label, no parameter');
});

test('the file name is derived from the href, so it survives the real DMG URL landing', async () => {
  const script = await downloadListenerSource();
  const calls = fireClick(script, anchor('flow-hero', 'https://cdn.example.com/builds/Flow-1.5.dmg'));
  assert.equal(calls[0][2].file_name, 'Flow-1.5.dmg', 'the name comes from the href, never a literal');
});

// GA4 TRAFFIC-SOURCE TRAP. An event parameter literally named source, medium or
// campaign is treated as a session traffic-source override: marketing found on
// 2026-08-20 that `{ source }` rewrote the converting session and dropped it
// into Unassigned. The parameter must stay `link_source`.
test('the event never sends a parameter named source, medium or campaign', async () => {
  const script = await downloadListenerSource();
  const calls = fireClick(script, anchor('nav-desktop', 'https://dl.example.com/Flow.dmg'));
  for (const banned of ['source', 'medium', 'campaign']) {
    assert.ok(
      !(banned in calls[0][2]),
      `"${banned}" as an event parameter silently rewrites the session's traffic source`,
    );
  }
});

// The pre-launch unavailable state renders as a <span>, not an anchor. It must
// never report a download that could not have happened.
test('the disabled non-anchor control reports nothing', async () => {
  const script = await downloadListenerSource();
  const calls = fireClick(script, {
    tagName: 'SPAN',
    getAttribute: (name) => (name === 'data-flow-download' ? 'flow-hero' : null),
  });
  assert.equal(calls.length, 0, 'a disabled span is not a download');
});

test('a click outside any download control reports nothing', async () => {
  const script = await downloadListenerSource();
  const calls = fireClick(script, null);
  assert.equal(calls.length, 0);
});

// Analytics must never break the download. gtag can be absent (blocked, or the
// consent gate kept it off) and the handler must swallow that.
test('a missing gtag does not throw', async () => {
  const script = await downloadListenerSource();
  let handler = null;
  const context = {
    document: { addEventListener: (t, fn) => { if (t === 'click') handler = fn; } },
    window: { location: { href: 'https://orionfold.com/' } },
    URL,
    decodeURIComponent,
  };
  context.window.window = context.window;
  vm.createContext(context);
  vm.runInContext(script, context);
  assert.doesNotThrow(() =>
    handler({ target: { closest: () => anchor('home-hero', 'https://d.example/Flow.dmg') } }),
  );
});

// Every Download button on the site must carry the attribute the listener reads,
// or that surface becomes invisible in reporting.
test('every download control is tagged for attribution', async () => {
  const cta = await readFile(new URL('../../src/components/flow/FlowDownloadCta.astro', import.meta.url), 'utf8');
  const nav = await readFile(new URL('../../src/components/Nav.astro', import.meta.url), 'utf8');
  assert.match(cta, /data-flow-download=\{source\}/, 'the shared CTA passes its placement through');
  for (const surface of ['nav-desktop', 'nav-mobile', 'nav-sticky-bar']) {
    assert.ok(nav.includes(surface), `${surface} must stay attributable`);
  }
});
