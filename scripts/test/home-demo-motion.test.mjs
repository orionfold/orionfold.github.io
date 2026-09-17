import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../../src/scripts/living-documents.js', import.meta.url), 'utf8')
  .replace(/^import \{ initFlowLibrary \} from '\.\/flow-library\.js';\n/, '');

function element() {
  const listeners = new Map();
  const attributes = new Map();
  const classes = new Set();
  return {
    dataset: {}, textContent: '', disabled: false,
    classList: { toggle(name, active) { if (active) classes.add(name); else classes.delete(name); } },
    setAttribute(name, value) { attributes.set(name, value); },
    getAttribute(name) { return attributes.get(name); },
    addEventListener(name, handler) {
      const handlers = listeners.get(name) || [];
      handlers.push(handler); listeners.set(name, handlers);
    },
    emit(name, detail = {}) {
      if (name === 'click' && this.disabled) return;
      for (const handler of listeners.get(name) || []) handler({ target: this, ...detail });
    },
  };
}

/** Execute the shipped initializer; timers and visibility are controlled by the test. */
function fixture({ reducedMotion = false, narrative = 'knowledge' } = {}) {
  const nodes = new Map();
  const demo = element();
  demo.dataset.demoNarrative = narrative;
  demo.querySelector = selector => {
    if (!nodes.has(selector)) nodes.set(selector, element());
    return nodes.get(selector);
  };
  const stages = Array.from({ length: 4 }, element);
  const events = Array.from({ length: 3 }, element);
  demo.querySelectorAll = selector => selector === '[data-demo-stage]' ? stages : selector === '[data-knowledge-event-copy]' ? events : [];
  const root = element();
  root.querySelectorAll = selector => selector === '[data-demo]' ? [demo] : [];
  const document = { ...element(), readyState: 'complete', hidden: false, querySelector: selector => selector === '.ls' ? root : null };
  const media = { ...element(), matches: reducedMotion };
  const timers = [];
  const observers = [];
  let libraryInitializations = 0;
  const context = {
    document,
    window: {
      matchMedia(query) { assert.equal(query, '(prefers-reduced-motion: reduce)'); return media; },
      setInterval(callback, delay) { assert.equal(delay, 500); timers.push(callback); return timers.length; },
    },
    IntersectionObserver: class {
      constructor(callback) { this.callback = callback; this.targets = []; observers.push(this); }
      observe(target) { this.targets.push(target); }
    },
    initFlowLibrary(received) { assert.strictEqual(received, root); libraryInitializations++; },
  };
  runInNewContext(source, context, { filename: 'living-documents.js' });
  return {
    demo, root, document,
    get step() { return Number(demo.dataset.step); },
    get libraryInitializations() { return libraryInitializations; },
    node(selector) { return demo.querySelector(selector); },
    click(selector) { demo.querySelector(selector).emit('click'); },
    ticks(count) { for (let i = 0; i < count; i++) for (const callback of timers) callback(); },
    visible(visible = true) {
      const observer = observers.find(item => item.targets.includes(demo));
      assert.ok(observer, 'the actual initializer observes the demo');
      observer.callback([{ target: demo, isIntersecting: visible }]);
    },
    reduce(value) { media.matches = value; media.emit('change', { matches: value }); },
  };
}

test('autoplay reaches the decision and cannot approve, decline, or restart it', () => {
  for (const narrative of ['knowledge', 'product']) {
    const view = fixture({ narrative });
    view.visible();
    view.ticks(18);
    assert.equal(view.step, 3);
    assert.equal(view.node('[data-demo-next]').disabled, true);
    assert.equal(view.node('[data-demo-keep]').disabled, false);
    assert.equal(view.node('[data-demo-revert]').disabled, false);
    assert.equal(view.node('[data-demo-decision]').textContent, '');
    view.ticks(240);
    assert.equal(view.step, 3, 'two minutes of further timers must leave the choice open');
    assert.equal(view.node('[data-demo-decision]').textContent, '');
    assert.equal(view.libraryInitializations, 1);
  }
});

test('only explicit approval or decline completes the proposal, and the decision persists', () => {
  const view = fixture();
  view.visible();
  view.click('[data-demo-keep]');
  assert.equal(view.step, 0, 'a disabled approval cannot act before review');
  view.ticks(18);
  assert.equal(view.node('[data-demo-keep]').textContent, 'Approve');
  view.click('[data-demo-keep]');
  assert.equal(view.step, 4);
  assert.match(view.node('[data-demo-decision]').textContent, /approved and added/);
  view.ticks(240);
  assert.equal(view.step, 4);
  view.click('[data-demo-replay]');
  assert.equal(view.step, 0);
  view.ticks(18);
  view.click('[data-demo-revert]');
  assert.equal(view.step, 5);
  assert.match(view.node('[data-demo-decision]').textContent, /original Jobs remain unchanged/);
  view.ticks(240);
  assert.equal(view.step, 5);
});

test('pointer or keyboard focus pauses the illustration until explicit replay', () => {
  for (const input of ['pointerdown', 'focusin']) {
    const view = fixture();
    view.visible();
    view.ticks(6);
    assert.equal(view.step, 1);
    view.demo.emit(input);
    view.ticks(100);
    assert.equal(view.step, 1, `${input} must stop automatic movement`);
    view.click('[data-demo-next]');
    assert.equal(view.step, 2);
    view.ticks(100);
    assert.equal(view.step, 2);
    view.click('[data-demo-next]');
    view.click('[data-demo-next]');
    assert.equal(view.step, 3, 'Next cannot take the human decision');
    view.click('[data-demo-replay]');
    view.ticks(6);
    assert.equal(view.step, 1, 'Replay explicitly resumes the guided illustration');
  }
});

test('offscreen and background demos stop; reentry gets its full reading interval', () => {
  const view = fixture();
  view.ticks(100);
  assert.equal(view.step, 0);
  view.visible();
  view.ticks(5);
  assert.equal(view.step, 0);
  view.ticks(1);
  assert.equal(view.step, 1);
  view.visible(false);
  view.ticks(100);
  assert.equal(view.step, 1);
  view.visible();
  view.ticks(5);
  assert.equal(view.step, 1);
  view.ticks(1);
  assert.equal(view.step, 2);
  view.document.hidden = true;
  view.ticks(100);
  assert.equal(view.step, 2);
  view.document.hidden = false;
  view.ticks(6);
  assert.equal(view.step, 3);
});

test('reduced motion prevents autoplay, including replay, while manual controls remain usable', () => {
  const view = fixture({ reducedMotion: true });
  view.visible();
  assert.equal(view.root.dataset.motion, 'off');
  view.ticks(100);
  assert.equal(view.step, 0);
  view.click('[data-demo-next]');
  assert.equal(view.step, 1);
  view.click('[data-demo-replay]');
  view.ticks(100);
  assert.equal(view.step, 0);
  const changing = fixture();
  changing.visible();
  changing.ticks(6);
  changing.reduce(true);
  changing.ticks(100);
  assert.equal(changing.step, 1, 'a preference change stops an already running illustration');
});
