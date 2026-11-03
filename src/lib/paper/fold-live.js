// Drives a Fold's state machine on the web (Paper 0.4.0). Plain ES, no build
// step, so the package can ship it beside the live SVGs. The inputs mirror
// folds/state-machine.json: state (idle, listening, thinking, speaking),
// viseme 0..4 while speaking, and the right and wrong triggers.
//   import { liveFold } from './fold-live.js';
//   const ember = liveFold(document.querySelector('.pp-live'));
//   ember.state('listening'); ember.trigger('right'); ember.say(2600);
const SEQ = [1, 2, 0, 3, 2, 4, 0, 1, 3, 0];
export function liveFold(root) {
  const svg = root.querySelector('.pp-live-svg'), mouth = svg.querySelector('.pp-live-mouth');
  const vis = JSON.parse(svg.dataset.visemes), closed = vis[0];
  let state = 'idle', timer = null, back = null;
  const paint = (name) => {
    root.className = root.className.replace(/\bpp-live--\w+/g, '').trim() + ' pp-live--' + name;
    const held = { right: svg.dataset.mouthRight, wrong: svg.dataset.mouthWrong, thinking: svg.dataset.mouthThinking }[name];
    if (name !== 'speaking') { clearInterval(timer); timer = null; mouth.setAttribute('d', held || closed); mouth.setAttribute('fill', 'none'); }
    root.dispatchEvent(new CustomEvent('pp-live', { detail: { state: name } }));
  };
  const api = {
    get state() { return state; },
    state(name) { state = name; paint(name); if (name === 'speaking' && !timer) { let k = 0; timer = setInterval(() => api.viseme(SEQ[k++ % SEQ.length]), 110); } return api; },
    viseme(n) { if (state !== 'speaking') return api; mouth.setAttribute('d', vis[n]); mouth.setAttribute('fill', n ? 'currentColor' : 'none'); root.dispatchEvent(new CustomEvent('pp-live', { detail: { viseme: n } })); return api; },
    trigger(name) { const prev = state; paint(name); clearTimeout(back); back = setTimeout(() => api.state(prev === 'right' || prev === 'wrong' ? 'idle' : prev), 1300); return api; },
    say(ms = 2600) { api.state('speaking'); clearTimeout(back); back = setTimeout(() => api.state('idle'), ms); return api; },
  };
  api.state('idle');
  return api;
}
/** Every .pp-live under root, driven together. */
export function liveFolds(root = document) {
  const all = [...root.querySelectorAll('.pp-live')].map(liveFold);
  return { all, state: (n) => all.forEach((f) => f.state(n)), trigger: (n) => all.forEach((f) => f.trigger(n)), say: (ms) => all.forEach((f) => f.say(ms)) };
}
