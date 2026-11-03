// Drives a Fold's state machine on the web (Paper 0.4.0). Plain ES, no build
// step, so the package can ship it beside the live SVGs. The inputs mirror
// folds/state-machine.json: state (idle, listening, thinking, speaking),
// viseme 0..4 while speaking, and the right and wrong triggers.
//   import { liveFold } from './fold-live.js';
//   const ember = liveFold(document.querySelector('.pp-live'));
//   ember.state('listening'); ember.trigger('right'); ember.say(2600);
// The driver reads the SVG on every call, so a page may swap the .pp-live-svg
// inside the root (the home hero turns one Fold into the next) and keep the api.
const SEQ = [1, 2, 0, 3, 2, 4, 0, 1, 3, 0];
// Reduce Motion: the pose changes, nothing moves between poses. Speaking holds one open viseme.
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export function liveFold(root) {
  if (root.__ppLive) return root.__ppLive;
  const svg = () => root.querySelector('.pp-live-svg');
  const mouth = () => svg().querySelector('.pp-live-mouth');
  const vis = () => JSON.parse(svg().dataset.visemes);
  let state = 'idle', timer = null, back = null;
  const paint = (name) => {
    root.className = root.className.replace(/\bpp-live--\w+/g, '').replace(/\s+/g, ' ').trim() + ' pp-live--' + name;
    const s = svg(), m = mouth();
    const held = { right: s.dataset.mouthRight, wrong: s.dataset.mouthWrong, thinking: s.dataset.mouthThinking }[name];
    if (name !== 'speaking') { clearInterval(timer); timer = null; m.setAttribute('d', held || vis()[0]); m.setAttribute('fill', 'none'); }
    root.dispatchEvent(new CustomEvent('pp-live', { detail: { state: name } }));
  };
  const api = {
    get state() { return state; },
    state(name) { state = name; paint(name); if (name === 'speaking' && !timer) { if (still()) { api.viseme(1); timer = -1; } else { let k = 0; timer = setInterval(() => api.viseme(SEQ[k++ % SEQ.length]), 110); } } return api; },
    viseme(n) { if (state !== 'speaking') return api; const m = mouth(); m.setAttribute('d', vis()[n]); m.setAttribute('fill', n ? 'currentColor' : 'none'); root.dispatchEvent(new CustomEvent('pp-live', { detail: { viseme: n } })); return api; },
    trigger(name) { const prev = state; paint(name); clearTimeout(back); back = setTimeout(() => api.state(prev === 'right' || prev === 'wrong' ? 'idle' : prev), 1300); return api; },
    say(ms = 2600) { api.state('speaking'); clearTimeout(back); back = setTimeout(() => api.state('idle'), ms); return api; },
    /** Back to idle now, and forget any timed return. */
    rest() { clearTimeout(back); back = null; api.state('idle'); return api; },
  };
  api.state('idle');
  root.__ppLive = api;
  return api;
}
/** Every .pp-live under root, driven together. */
export function liveFolds(root = document) {
  const all = [...root.querySelectorAll('.pp-live')].map(liveFold);
  return { all, state: (n) => all.forEach((f) => f.state(n)), trigger: (n) => all.forEach((f) => f.trigger(n)), say: (ms) => all.forEach((f) => f.say(ms)) };
}
/** Live Folds rest while off screen: data-pp-asleep pauses their CSS animations. One observer per page. */
export function sleepFolds(root = document) {
  if (typeof IntersectionObserver !== 'function') return;
  const io = root.__ppSleep || (root.__ppSleep = new IntersectionObserver((es) => es.forEach((e) => e.target.toggleAttribute('data-pp-asleep', !e.isIntersecting)), { rootMargin: '80px' }));
  root.querySelectorAll('.pp-live').forEach((el) => io.observe(el));
  return io;
}
