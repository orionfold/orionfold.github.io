import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const documentNames = [
  'Living Document Starter', 'Competitor Watch', 'Team Status', 'Job Search',
  'Household Budget', 'Stock Portfolio', 'Tax Advisor',
];

function eventTarget() {
  const events = new Map();
  return {
    addEventListener(name, handler) {
      const handlers = events.get(name) ?? new Set();
      handlers.add(handler);
      events.set(name, handlers);
    },
    removeEventListener(name, handler) { events.get(name)?.delete(handler); },
    emit(name, detail = {}) {
      const event = {
        target: this, currentTarget: this, defaultPrevented: false, ...detail,
        preventDefault() { this.defaultPrevented = true; },
      };
      for (const handler of [...(events.get(name) ?? [])]) handler(event);
      return event;
    },
    listenerCount() { return [...events.values()].reduce((sum, handlers) => sum + handlers.size, 0); },
  };
}

function animationView({ reducedMotion = false, intersectionObserver = false } = {}) {
  let now = 0, nextId = 1;
  const frames = new Map();
  const media = { ...eventTarget(), matches: reducedMotion };
  const document = { ...eventTarget(), visibilityState: 'visible' };
  const view = {
    ...eventTarget(),
    document,
    performance: { now: () => now },
    matchMedia(query) {
      assert.equal(query, '(prefers-reduced-motion: reduce)');
      return media;
    },
    requestAnimationFrame(callback) { const id = nextId++; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
  };
  document.defaultView = view;
  const observers = [];
  if (intersectionObserver) {
    view.IntersectionObserver = class {
      constructor(callback, options) {
        this.callback = callback;
        this.options = options;
        this.targets = new Set();
        observers.push(this);
      }
      observe(target) { this.targets.add(target); }
      unobserve(target) { this.targets.delete(target); }
      disconnect() { this.targets.clear(); }
    };
  }
  return {
    view, media, document, observers,
    get pendingFrames() { return frames.size; },
    frameAt(time) {
      assert.ok(time >= now, 'fake animation clock advances monotonically');
      now = time;
      const callbacks = [...frames.values()];
      frames.clear();
      for (const callback of callbacks) callback(now);
    },
    frameAfter(elapsed) { this.frameAt(now + elapsed); },
    reduceMotion(matches) { media.matches = matches; media.emit('change', { matches }); },
    setVisibility(value) { document.visibilityState = value; document.emit('visibilitychange'); },
    intersect(target, ratio) {
      for (const observer of observers) {
        if (observer.targets.has(target)) {
          observer.callback([{ target, intersectionRatio: ratio, isIntersecting: ratio > 0 }], observer);
        }
      }
    },
  };
}

// Small event/DOM double: the controller runs unchanged, without a browser or timers.
function navigationHarness(options) {
  let focused = null;
  const clock = animationView(options);
  function element(dataset = {}, attrs = {}) {
    return {
      ...eventTarget(),
      dataset, attrs, hidden: false, tabIndex: -1, value: '', textContent: '', scrolls: [],
      setAttribute(name, value) { this.attrs[name] = String(value); },
      getAttribute(name) { return this.attrs[name] ?? null; },
      focus(options) { focused = this; this.focusOptions = options; },
      scrollIntoView(options) { this.scrolls.push(options); },
    };
  }
  const tabs = documentNames.map((_, index) => {
    const tab = element({ exampleTab: String(index) }, { 'aria-selected': String(index === 0) });
    tab.tabIndex = index === 0 ? 0 : -1;
    return tab;
  });
  const panels = documentNames.map((_, index) => {
    const panel = element({ examplePanel: String(index) });
    panel.hidden = index !== 0;
    return panel;
  });
  const readers = panels.map(() => Object.assign(element(), {
    scrollTop: 0, scrollHeight: 2800, clientHeight: 448, querySelector: () => null,
  }));
  const scrollButtons = panels.map(() => element({}, { 'aria-pressed': 'false' }));
  panels.forEach((panel, index) => {
    panel.querySelector = selector => selector === '.ls-library-document' ? readers[index]
      : selector === '[data-example-scroll]' ? scrollButtons[index] : null;
  });
  const select = element(), prev = element(), next = element(), count = element();
  select.value = '0';
  count.textContent = '01 / 07';
  const groups = new Map([
    ['[data-example-tab]', tabs], ['[data-example-panel]', panels],
    ['[data-example-select]', [select]], ['[data-example-prev]', [prev]],
    ['[data-example-next]', [next]], ['[data-example-count]', [count]],
    ['.ls-library-document', readers], ['[data-example-scroll]', scrollButtons],
  ]);
  const root = {
    dataset: {}, ownerDocument: clock.document,
    querySelectorAll(selector) { return groups.get(selector) ?? []; },
    querySelector(selector) { return groups.get(selector)?.[0] ?? null; },
  };
  return {
    root, tabs, panels, select, prev, next, count, readers, scrollButtons, clock,
    get focused() { return focused; },
    assertSelected(index) {
      assert.deepEqual(tabs.map(tab => tab.getAttribute('aria-selected')), documentNames.map((_, i) => String(i === index)));
      assert.deepEqual(tabs.map(tab => tab.tabIndex), documentNames.map((_, i) => i === index ? 0 : -1));
      assert.deepEqual(panels.map(panel => panel.hidden), documentNames.map((_, i) => i !== index));
      assert.equal(select.value, String(index), 'native select stays synchronized');
      assert.equal(count.textContent, `${String(index + 1).padStart(2, '0')} / 07`, 'visible position stays synchronized');
    },
    assertRevealed(index) {
      assert.equal(panels[index].scrolls.at(-1)?.block, 'start', 'the selected document title returns to the viewport');
      assert.equal(panels[index].scrolls.at(-1)?.behavior, 'instant', 'selection does not animate through the page');
      assert.equal(clock.pendingFrames, 1, 'every selection method starts one document reading pass');
      assert.equal(scrollButtons[index].attrs['aria-pressed'], 'true', 'the selected document exposes its pause state');
    },
    assertPanelFocused(index) {
      assert.equal(focused, panels[index], 'paging moves focus to the new document');
      assert.equal(panels[index].focusOptions?.preventScroll, true, 'focus preserves the selected document scroll position');
    },
  };
}

async function setup(options) {
  const { initFlowLibrary } = await import('../../src/scripts/flow-library.js');
  const harness = navigationHarness(options);
  harness.destroy = initFlowLibrary(harness.root);
  return harness;
}

test('library navigation selects every released document without automatic rotation', async () => {
  const harness = await setup();
  harness.assertSelected(0);
  assert.ok(harness.panels.every(panel => panel.scrolls.length === 0), 'initialization does not scroll the page');
  assert.equal(harness.focused, null, 'initialization does not steal focus');
  for (let index = 0; index < documentNames.length; index++) {
    harness.tabs[index].emit('click');
    harness.assertSelected(index);
    harness.assertRevealed(index);
  }
  harness.clock.frameAt(0);
  harness.clock.frameAt(120000);
  harness.assertSelected(6);
  assert.equal(harness.clock.pendingFrames, 0, 'the scroll finishes without rotating documents or looping');
});

test('library navigation supports arrow keys, Home, End, wrapping and roving focus', async () => {
  const harness = await setup();
  const steps = [
    [0, 'ArrowRight', 1], [1, 'ArrowDown', 2], [2, 'ArrowLeft', 1],
    [1, 'ArrowUp', 0], [0, 'ArrowLeft', 6], [6, 'ArrowRight', 0],
    [0, 'End', 6], [6, 'ArrowDown', 0], [0, 'ArrowUp', 6], [6, 'Home', 0],
  ];
  for (const [from, key, to] of steps) {
    assert.equal(harness.tabs[from].emit('keydown', { key }).defaultPrevented, true, key);
    harness.assertSelected(to);
    harness.assertRevealed(to);
    assert.equal(harness.focused, harness.tabs[to], 'focus follows keyboard selection');
    assert.equal(harness.tabs[to].focusOptions?.preventScroll, true, 'focus does not jump the document canvas');
  }
  const scrollCount = harness.panels.reduce((sum, panel) => sum + panel.scrolls.length, 0);
  for (const key of ['Tab', 'Escape', 'a']) {
    assert.equal(harness.tabs[0].emit('keydown', { key }).defaultPrevented, false, key);
    harness.assertSelected(0);
  }
  assert.equal(harness.panels.reduce((sum, panel) => sum + panel.scrolls.length, 0), scrollCount, 'unhandled keys do not scroll');
});

test('library previous and next controls wrap, reveal and focus all seven documents', async () => {
  const harness = await setup();
  harness.prev.emit('click');
  harness.assertSelected(6);
  harness.assertRevealed(6);
  harness.assertPanelFocused(6);
  harness.next.emit('click');
  harness.assertSelected(0);
  harness.assertRevealed(0);
  harness.assertPanelFocused(0);
  for (let index = 1; index <= 7; index++) {
    harness.next.emit('click');
    harness.assertSelected(index % 7);
    harness.assertRevealed(index % 7);
    harness.assertPanelFocused(index % 7);
  }
});

test('library native select synchronizes tabs, panels, arrows and count', async () => {
  const harness = await setup();
  for (let index = 6; index >= 0; index--) {
    harness.select.value = String(index);
    harness.select.emit('change');
    harness.assertSelected(index);
    harness.assertRevealed(index);
  }
  harness.select.value = '4';
  harness.select.emit('change');
  harness.next.emit('click');
  harness.assertSelected(5);
  harness.prev.emit('click');
  harness.assertSelected(4);
});

async function scrollerHarness(distance = 280, options) {
  const { createDocumentScroller } = await import('../../src/scripts/flow-library.js');
  const clock = animationView(options);
  const reader = { scrollTop: 150, clientHeight: 448, scrollHeight: distance + 448 };
  const states = [];
  const scroller = createDocumentScroller(clock.view, playing => states.push(playing));
  return { clock, reader, states, scroller };
}

test('document scroll dwells, eases in and out slowly, and stops once at the bottom', async () => {
  const { clock, reader, states, scroller } = await scrollerHarness();
  assert.equal(scroller.start(reader), true);
  assert.equal(reader.scrollTop, 0, 'selection begins at the top of the document');
  assert.equal(states.at(-1), true);
  clock.frameAt(0);
  clock.frameAt(1199);
  assert.equal(reader.scrollTop, 0, 'the opening remains still for the initial reading dwell');
  clock.frameAt(4700);
  const quarter = reader.scrollTop;
  assert.ok(quarter > 0 && quarter < 70, 'the first quarter accelerates gently');
  clock.frameAt(8200);
  assert.ok(Math.abs(reader.scrollTop - 140) < 1, 'a short document uses the faster 14-second minimum pass');
  clock.frameAt(11700);
  assert.ok(reader.scrollTop > 210 && reader.scrollTop < 280, 'the final quarter decelerates gently');
  assert.ok(Math.abs((280 - reader.scrollTop) - quarter) < 1, 'entry and exit easing are symmetric');
  clock.frameAt(15200);
  assert.equal(reader.scrollTop, 280);
  assert.equal(states.at(-1), false);
  assert.equal(clock.pendingFrames, 0, 'the completed scroll releases its animation frame');
  clock.frameAt(120000);
  assert.equal(reader.scrollTop, 280, 'a finished preview does not loop');
  scroller.destroy();
});

test('longer document scroll uses a slow reading pace with a bounded completion time', async () => {
  const { clock, reader, scroller } = await scrollerHarness(5600);
  scroller.start(reader);
  clock.frameAt(0);
  clock.frameAt(15200);
  assert.ok(reader.scrollTop < 2800, 'long content does not rush through in the minimum duration');
  clock.frameAt(23700);
  assert.ok(Math.abs(reader.scrollTop - 2800) < 1, 'longest pass reaches its midpoint at 22.5 seconds after dwell');
  clock.frameAt(46200);
  assert.equal(reader.scrollTop, 5600, 'the longest pass completes within 45 seconds after dwell');
  assert.equal(clock.pendingFrames, 0);
  scroller.destroy();
});

test('document scroll uses the doubled pace between its minimum and maximum durations', async () => {
  const { clock, reader, scroller } = await scrollerHarness(1568);
  scroller.start(reader);
  clock.frameAt(0);
  clock.frameAt(15200);
  assert.ok(Math.abs(reader.scrollTop - 784) < 1, 'a 1568-pixel document reaches its midpoint in 14 seconds after dwell');
  clock.frameAt(29200);
  assert.equal(reader.scrollTop, 1568, 'the nominal 56-pixel-per-second pace completes the pass');
  scroller.destroy();
});

test('document scroll pauses in place, resumes, and resets when a new document is selected', async () => {
  const { clock, reader, scroller } = await scrollerHarness();
  scroller.start(reader);
  clock.frameAt(0);
  clock.frameAt(10000);
  const pausedAt = reader.scrollTop;
  assert.ok(pausedAt > 0);
  assert.equal(scroller.toggle(reader), false);
  assert.equal(clock.pendingFrames, 0);
  clock.frameAt(20000);
  assert.equal(reader.scrollTop, pausedAt, 'pause freezes at the current reading position');
  assert.equal(scroller.toggle(reader), true);
  assert.equal(reader.scrollTop, pausedAt, 'play resumes without returning to the start');
  clock.frameAt(20000);
  clock.frameAt(30000);
  assert.ok(reader.scrollTop > pausedAt);
  const previousTop = reader.scrollTop;
  const other = { scrollTop: 90, clientHeight: 448, scrollHeight: 728 };
  scroller.start(other);
  assert.equal(other.scrollTop, 0);
  assert.equal(clock.pendingFrames, 1, 'switching cancels the previous document frame');
  clock.frameAt(30000);
  clock.frameAt(60000);
  assert.equal(reader.scrollTop, previousTop, 'a cancelled document never receives a stale scroll update');
  assert.equal(other.scrollTop, 280);
  assert.equal(scroller.toggle(other), true);
  assert.equal(other.scrollTop, 0, 'playing at the bottom replays the document from its start');
  scroller.destroy();
  assert.equal(clock.pendingFrames, 0);
});

test('document scroll respects reduced motion, hidden pages and lifecycle cleanup', async () => {
  const { clock, reader, states, scroller } = await scrollerHarness(280, { reducedMotion: true });
  assert.equal(scroller.start(reader), false, 'reduced motion skips automatic playback');
  assert.equal(clock.pendingFrames, 0);
  assert.equal(scroller.toggle(reader), true, 'an explicit play action can opt into motion');
  clock.frameAt(0);
  clock.frameAt(10000);
  const stoppedAt = reader.scrollTop;
  clock.reduceMotion(true);
  assert.equal(clock.pendingFrames, 0, 'a changed reduced-motion preference cancels playback');
  clock.frameAt(20000);
  assert.equal(reader.scrollTop, stoppedAt);
  clock.reduceMotion(false);
  scroller.start(reader);
  clock.frameAt(20000);
  clock.frameAt(30000);
  const hiddenAt = reader.scrollTop;
  clock.setVisibility('hidden');
  assert.equal(clock.pendingFrames, 0);
  assert.equal(states.at(-1), false);
  clock.frameAt(40000);
  assert.equal(reader.scrollTop, hiddenAt, 'a background document stops moving');
  assert.equal(scroller.start(reader), false, 'hidden pages cannot begin playback');
  clock.setVisibility('visible');
  assert.equal(clock.pendingFrames, 0, 'returning to the page does not silently resume');
  scroller.start(reader);
  scroller.destroy();
  assert.equal(clock.pendingFrames, 0);
  assert.equal(clock.document.listenerCount(), 0);
  assert.equal(clock.media.listenerCount(), 0);
});

test('library without viewport observation scrolls after selection and stops for manual reading', async () => {
  const harness = await setup();
  assert.equal(harness.clock.pendingFrames, 0, 'the initially visible document remains still');
  for (const event of ['wheel', 'pointerdown', 'touchstart', 'keydown']) {
    harness.tabs[2].emit('click');
    assert.equal(harness.clock.pendingFrames, 1, 'selection starts one reading pass');
    assert.equal(harness.scrollButtons[2].attrs['aria-pressed'], 'true');
    assert.match(harness.scrollButtons[2].textContent, /pause/i);
    harness.clock.frameAfter(0);
    harness.clock.frameAfter(10000);
    const stoppedAt = harness.readers[2].scrollTop;
    harness.readers[2].emit(event, { key: 'ArrowDown' });
    assert.equal(harness.clock.pendingFrames, 0, `${event} gives control back to the reader`);
    assert.equal(harness.scrollButtons[2].attrs['aria-pressed'], 'false');
    assert.match(harness.scrollButtons[2].textContent, /play/i);
    harness.clock.frameAfter(10000);
    assert.equal(harness.readers[2].scrollTop, stoppedAt);
    harness.assertSelected(2);
  }
  harness.scrollButtons[2].emit('click');
  assert.equal(harness.clock.pendingFrames, 1, 'play control restarts a paused pass');
  harness.scrollButtons[2].emit('click');
  assert.equal(harness.clock.pendingFrames, 0, 'pause control cancels the pass');
  harness.tabs[3].emit('click');
  harness.clock.view.emit('resize');
  assert.equal(harness.clock.pendingFrames, 0, 'resizing stops motion before recalculating the document');
  harness.destroy();
  assert.equal(harness.clock.view.listenerCount(), 0);
  assert.equal(harness.clock.document.listenerCount(), 0);
  assert.equal(harness.clock.media.listenerCount(), 0);
});

test('library auto-scroll starts when the selected document is at least half in view', async () => {
  const harness = await setup({ intersectionObserver: true });
  assert.equal(new Set(harness.clock.observers.flatMap(observer => [...observer.targets])).size, 7);
  assert.equal(harness.clock.pendingFrames, 0, 'initialization waits for actual viewport evidence');
  harness.clock.intersect(harness.readers[0], 0.49);
  assert.equal(harness.clock.pendingFrames, 0, 'a mostly offscreen document stays still');
  harness.clock.intersect(harness.readers[1], 1);
  assert.equal(harness.clock.pendingFrames, 0, 'an inactive document cannot begin playback');
  harness.clock.intersect(harness.readers[0], 0.5);
  assert.equal(harness.clock.pendingFrames, 1, 'the selected visible document begins without a click');
  harness.clock.frameAt(0);
  harness.clock.frameAt(5000);
  const firstPosition = harness.readers[0].scrollTop;
  assert.ok(firstPosition > 0);
  harness.clock.intersect(harness.readers[0], 0.9);
  assert.equal(harness.readers[0].scrollTop, firstPosition, 'repeated visible entries do not restart an active pass');
  assert.equal(harness.clock.pendingFrames, 1);
  harness.clock.intersect(harness.readers[1], 0);
  assert.equal(harness.clock.pendingFrames, 1, 'an inactive document leaving view does not stop the selected pass');
  harness.clock.frameAt(10000);
  assert.ok(harness.readers[0].scrollTop > firstPosition);
  harness.assertSelected(0);
  harness.destroy();
  assert.ok(harness.clock.observers.every(observer => observer.targets.size === 0), 'cleanup disconnects viewport observation');
  assert.equal(harness.clock.pendingFrames, 0);
});

test('library viewport reentry resumes a pass and preserves deliberate pauses until another selection', async () => {
  const harness = await setup({ intersectionObserver: true });
  const reader = harness.readers[0];
  harness.clock.intersect(reader, 1);
  harness.clock.frameAt(0);
  harness.clock.frameAt(5000);
  const offscreenAt = reader.scrollTop;
  harness.clock.intersect(reader, 0);
  assert.equal(harness.clock.pendingFrames, 0, 'leaving the viewport stops the reading pass');
  harness.clock.frameAt(10000);
  assert.equal(reader.scrollTop, offscreenAt);
  harness.clock.intersect(reader, 1);
  assert.equal(harness.clock.pendingFrames, 1);
  assert.equal(reader.scrollTop, offscreenAt, 'viewport reentry resumes the saved reading position');
  harness.clock.frameAt(10000);
  harness.clock.frameAt(15000);
  assert.ok(reader.scrollTop > offscreenAt);
  reader.emit('wheel');
  harness.clock.intersect(reader, 0);
  harness.clock.intersect(reader, 1);
  assert.equal(harness.clock.pendingFrames, 0, 'viewport reentry respects manual reading');
  harness.clock.view.emit('focus');
  assert.equal(harness.clock.pendingFrames, 0, 'window focus also respects the manual pause');
  harness.tabs[1].emit('click');
  assert.equal(harness.clock.pendingFrames, 1, 'a new document selection clears the previous manual pause');
  harness.clock.intersect(harness.readers[1], 1);
  harness.scrollButtons[1].emit('click');
  assert.equal(harness.clock.pendingFrames, 0);
  harness.clock.intersect(harness.readers[1], 0);
  harness.clock.intersect(harness.readers[1], 1);
  assert.equal(harness.clock.pendingFrames, 0, 'viewport reentry respects the Pause button');
  harness.scrollButtons[1].emit('click');
  assert.equal(harness.clock.pendingFrames, 1, 'explicit Play resumes a deliberately paused pass');
  harness.destroy();
});

test('library returning to a visible window resumes only the eligible selected document', async () => {
  const harness = await setup({ intersectionObserver: true });
  harness.clock.intersect(harness.readers[0], 1);
  harness.clock.frameAt(0);
  harness.clock.frameAt(5000);
  const saved = harness.readers[0].scrollTop;
  harness.clock.setVisibility('hidden');
  assert.equal(harness.clock.pendingFrames, 0);
  harness.clock.frameAt(10000);
  harness.clock.setVisibility('visible');
  assert.equal(harness.clock.pendingFrames, 1, 'returning to the visible page resumes its selected screen');
  assert.equal(harness.readers[0].scrollTop, saved);
  harness.clock.view.emit('resize');
  assert.equal(harness.clock.pendingFrames, 0);
  harness.clock.view.emit('focus');
  assert.equal(harness.clock.pendingFrames, 1, 'focus resumes an eligible visible document');
  harness.clock.intersect(harness.readers[0], 0);
  harness.clock.view.emit('focus');
  assert.equal(harness.clock.pendingFrames, 0, 'window focus does not animate an offscreen document');
  harness.clock.reduceMotion(true);
  harness.clock.intersect(harness.readers[0], 1);
  assert.equal(harness.clock.pendingFrames, 0, 'viewport entry still respects reduced motion');
  harness.scrollButtons[0].emit('click');
  assert.equal(harness.clock.pendingFrames, 1, 'explicit Play remains available with reduced motion');
  harness.destroy();
  assert.equal(harness.clock.view.listenerCount(), 0);
  assert.equal(harness.clock.document.listenerCount(), 0);
  assert.equal(harness.clock.media.listenerCount(), 0);
});

function libraryData() {
  const source = read('src/data/flow-library.ts');
  const exports = {};
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  runInNewContext(output, { exports });
  return JSON.parse(JSON.stringify(exports.livingLibrary));
}

test('library content mixes individual narratives, tables and visuals for seven source documents', () => {
  const library = libraryData();
  assert.deepEqual(library.map(document => document.name), documentNames);
  assert.equal(new Set(library.map(document => document.key)).size, 7);
  for (const document of library) {
    for (const field of ['source', 'period', 'title', 'description']) {
      assert.ok(document[field]?.trim(), `${document.name}: ${field}`);
    }
    assert.match(document.period, /sample|example|illustrative/i, `${document.name} identifies example data`);
    assert.ok(document.narrative?.heading?.trim(), `${document.name} has its own narrative heading`);
    assert.ok(document.narrative.paragraphs.length > 0, `${document.name} has narrative prose`);
    assert.ok(Array.isArray(document.narrative.points), `${document.name} declares its optional reading or action points`);
    for (const text of [...document.narrative.paragraphs, ...document.narrative.points]) {
      assert.ok(typeof text === 'string' && text.trim(), `${document.name} has readable narrative content`);
    }
    assert.ok(document.table?.headings.length > 0 && document.table.rows.length > 0, `${document.name} has an individual table`);
    assert.ok(document.charts.length > 0, `${document.name} keeps its source visuals`);
    assert.equal(Object.hasOwn(document, 'stats'), false, 'document context is prose instead of a KPI strip');
    assert.equal(document.continuation.length, 2, `${document.name} adds two complete reading pages`);
    for (const page of document.continuation) {
      assert.ok(page.heading?.trim(), `${document.name} continuation has a heading`);
      assert.ok(page.paragraphs.length > 0, `${page.heading} contains narrative prose`);
      assert.ok(Array.isArray(page.points), `${page.heading} declares its optional action points`);
      for (const text of [...page.paragraphs, ...page.points]) assert.ok(typeof text === 'string' && text.trim(), page.heading);
      if (page.table) {
        assert.ok(page.table.title?.trim() && page.table.headings.length > 0 && page.table.rows.length > 0, `${page.heading} has a complete table`);
        for (const row of page.table.rows) assert.equal(row.length, page.table.headings.length, `${page.heading} has consistent table columns`);
      }
    }
  }
  assert.equal(new Set(library.map(document => document.narrative.heading)).size, 7, 'each document has a distinct narrative');
  assert.equal(new Set(library.map(document => document.narrative.paragraphs.join(' '))).size, 7, 'each document explains its own subject');
  const tax = library.find(document => document.name === 'Tax Advisor');
  assert.match(tax.period, /2025/, 'the sample W-2 belongs to the 2025 tax year');
  const competitor = library.find(document => document.name === 'Competitor Watch');
  assert.match(JSON.stringify(competitor), /snapshot|capture|recorded/i, 'captured competitor prices must not read as current quotes');
  assert.match(JSON.stringify(competitor), /(?:2026-09-02|Sep(?:tember)?\.? 2,? 2026)/, 'the price capture keeps its source date');
  const component = read('src/components/living/FlowLibrary.astro');
  assert.match(component, /\{doc\.period\}/, 'sample periods are presented with the preview');
  assert.doesNotMatch(component, /ls-library-stats|doc\.stats/, 'the preview does not render the removed KPI strip');
});

test('library visual previews have nine distinct local charts and complete image descriptions', () => {
  const library = libraryData();
  const charts = library.flatMap(document => document.charts);
  const provenance = JSON.parse(read('src/data/flow-library-charts.json'));
  const expectedCharts = [
    'starter-items', 'starter-groups', 'competitor-pricing', 'team-confidence',
    'job-timeline', 'budget-categories', 'portfolio-allocation', 'portfolio-history', 'tax-waterfall',
  ];
  assert.equal(charts.length, 9);
  assert.equal(new Set(charts.map(chart => chart.src)).size, 9, 'each visual is authored for its source document');
  assert.deepEqual(charts.map(chart => chart.src).sort(), expectedCharts.map(key => key + '.svg').sort());
  assert.equal(provenance.snapshot, '2026-09-02', 'chart provenance retains the shipped capture date');
  for (const document of library) {
    assert.ok(document.charts.length > 0, `${document.name} includes a source-native visual`);
    for (const chart of document.charts) {
      assert.equal(provenance.charts[chart.src.replace(/\.svg$/, '')]?.document, document.source, 'chart is linked to its own document');
    }
  }
  for (const chart of charts) {
    assert.match(chart.src, /^[a-z][a-z-]+\.svg$/, 'chart is a local vector asset');
    for (const field of ['title', 'caption', 'alt']) assert.ok(chart[field]?.trim(), `${chart.src}: ${field}`);
    const svg = read('public/flow/library/' + chart.src);
    assert.match(svg, /<svg\b/);
    assert.match(svg, /viewBox=/, 'chart scales with the responsive document canvas');
    assert.doesNotMatch(svg, /DejaVu/i, 'chart typography does not depend on the generator host font');
    const labels = elements(svg).filter(element => element.tag === 'text');
    assert.ok(labels.length > 0, 'chart has readable vector labels');
    for (const label of labels) {
      assert.match(label.attrs.style, /font-family:\s*Arial,\s*sans-serif(?:;|$)/, 'every chart label declares its browser font fallback');
    }
  }
});

function elements(html) {
  return [...html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)]
    .map(([, tag, attributes]) => ({
      tag,
      attrs: Object.fromEntries([...attributes.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)]
        .map(([, name, doubleQuoted, singleQuoted, unquoted]) => [name, doubleQuoted ?? singleQuoted ?? unquoted ?? ''])),
    }));
}

test('built library exposes seven individually labelled tabpanels and a native mobile selector', () => {
  const html = read('dist/flow/index.html');
  const all = elements(html);
  const withAttr = attr => all.filter(element => Object.hasOwn(element.attrs, attr));
  const withClass = name => all.filter(element => element.attrs.class?.split(/\s+/).includes(name));
  const [stage] = withClass('ls-library-stage');
  assert.ok(stage?.attrs.class.split(/\s+/).includes('ls-container'), 'mock screen follows the shared page container');
  assert.equal(withClass('ls-library-stats').length, 0, 'the built previews do not show a KPI strip');
  const documents = withClass('ls-library-document');
  assert.equal(documents.length, 7);
  for (let index = 0; index < 7; index++) {
    assert.equal(documents[index].attrs.role, 'region');
    assert.equal(documents[index].attrs.id, `example-document-${index}`);
    assert.equal(documents[index].attrs['aria-label'], `${documentNames[index]} document preview`);
    assert.equal(documents[index].attrs.tabindex, '0', 'the internal document viewport is reachable with a keyboard');
  }
  const narratives = withClass('ls-library-prose');
  assert.equal(narratives.length, 7, 'every mock screen includes document prose');
  const library = libraryData();
  const continuations = withClass('ls-library-continuation');
  const pages = library.flatMap(document => document.continuation);
  assert.equal(continuations.length, 14, 'all seven documents include both additional reading pages');
  assert.equal(withAttr('data-example-page').length, 21, 'each document contains the opening and two continuations');
  for (let index = 0; index < pages.length; index++) {
    assert.equal(continuations[index].attrs['aria-label'], pages[index].heading);
  }
  const continuationCopy = [...html.matchAll(/<div\b[^>]*class="[^"]*\bls-library-continuation-copy\b[^"]*"[^>]*>([\s\S]*?)<\/div>/g)];
  assert.equal(continuationCopy.length, 14);
  for (let index = 0; index < pages.length; index++) {
    assert.equal(elements(continuationCopy[index][1]).filter(element => element.tag === 'p').length, pages[index].paragraphs.length, 'continuation prose reaches the preview');
  }
  assert.equal(withClass('ls-library-continuation-table').length, pages.filter(page => page.table).length, 'all authored continuation tables reach the preview');
  for (let index = 0; index < 7; index++) {
    assert.equal(narratives[index].tag, 'section');
    assert.equal(narratives[index].attrs['aria-label'], library[index].narrative.heading);
  }
  const proseBlocks = [...html.matchAll(/<section\b[^>]*class="[^"]*\bls-library-prose\b[^"]*"[^>]*>([\s\S]*?)<\/section>/g)];
  assert.equal(proseBlocks.length, 7);
  for (let index = 0; index < 7; index++) {
    const content = elements(proseBlocks[index][1]);
    assert.equal(content.filter(element => element.tag === 'p').length, library[index].narrative.paragraphs.length, 'authored narrative paragraphs reach the preview');
    assert.equal(content.filter(element => element.tag === 'li').length, library[index].narrative.points.length, 'authored action points reach the preview');
  }
  assert.equal(withClass('ls-library-detail').length, 7, 'each document retains its accompanying table');
  const tabs = withAttr('data-example-tab');
  const panels = withAttr('data-example-panel');
  assert.equal(tabs.length, 7);
  assert.equal(panels.length, 7);
  for (let index = 0; index < 7; index++) {
    const tab = tabs.find(element => element.attrs['data-example-tab'] === String(index));
    const panel = panels.find(element => element.attrs['data-example-panel'] === String(index));
    assert.ok(tab, `tab ${index}`);
    assert.ok(panel, `panel ${index}`);
    assert.equal(tab.attrs.id, `example-tab-${index}`);
    assert.equal(tab.attrs.role, 'tab');
    assert.equal(tab.attrs['aria-controls'], `example-panel-${index}`);
    assert.equal(tab.attrs['aria-selected'], String(index === 0));
    assert.equal(tab.attrs.tabindex, index === 0 ? '0' : '-1');
    assert.equal(panel.attrs.id, `example-panel-${index}`);
    assert.equal(panel.attrs.role, 'tabpanel');
    assert.equal(panel.attrs.tabindex, '0', 'paging can focus the new document');
    assert.equal(panel.attrs['aria-labelledby'], tab.attrs.id);
    assert.equal(Object.hasOwn(panel.attrs, 'hidden'), index !== 0);
  }
  const ids = all.map(element => element.attrs.id).filter(Boolean);
  for (const element of [...tabs, ...panels, ...documents]) assert.equal(ids.filter(id => id === element.attrs.id).length, 1);
  const scrollButtons = withAttr('data-example-scroll');
  assert.equal(scrollButtons.length, 7, 'each document has its own playback control');
  for (let index = 0; index < 7; index++) {
    assert.equal(scrollButtons[index].tag, 'button');
    assert.equal(scrollButtons[index].attrs['aria-controls'], documents[index].attrs.id);
    assert.equal(scrollButtons[index].attrs['aria-pressed'], 'false', 'automatic playback is initially off');
  }
  const [select] = withAttr('data-example-select');
  assert.equal(select?.tag, 'select');
  assert.ok(select.attrs['aria-label'] || all.some(element => element.tag === 'label' && element.attrs.for === select.attrs.id), 'native selection has an accessible label');
  const selectHTML = html.match(/<select\b[^>]*data-example-select[^>]*>([\s\S]*?)<\/select>/)?.[1];
  assert.ok(selectHTML);
  assert.deepEqual(elements(selectHTML).filter(element => element.tag === 'option').map(element => element.attrs.value), ['0', '1', '2', '3', '4', '5', '6']);
  for (const control of ['data-example-prev', 'data-example-next']) {
    const [button] = withAttr(control);
    assert.equal(button?.tag, 'button');
    assert.ok(button.attrs['aria-label'], `${control} has a readable purpose`);
  }
  const [count] = withAttr('data-example-count');
  assert.equal(count?.attrs['aria-live'], 'polite', 'assistive technology receives selection position updates');
  const images = all.filter(element => element.tag === 'img' && element.attrs.src?.startsWith('/flow/library/'));
  assert.equal(images.length, 9);
  for (const image of images) {
    assert.ok(image.attrs.alt?.trim(), image.attrs.src);
    assert.ok(Number(image.attrs.width) > 0 && Number(image.attrs.height) > 0, 'chart geometry reserves its layout space');
    assert.equal(image.attrs.loading, 'lazy', 'offscreen documents do not compete with the hero');
  }
});
