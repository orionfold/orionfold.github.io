// Plays the native Flow mocks (DocMock, the hero brief) in stages once they
// scroll into view: is-s1 … is-s4 accumulate, then the mock rests on the saved
// state and starts over. Reduced motion shows the saved state and never loops.
// A click on the review bar steps by hand and stops the loop for that mock.
const STAGE_MS = [1500, 1500, 2300, 1300, 3600];
const LAST = 4;

function setStage(el, n) {
  el.dataset.stage = String(n);
  for (let i = 1; i <= LAST; i++) el.classList.toggle(`is-s${i}`, i <= n);
}

function play(el) {
  if (el._mockTimer) return;
  const tick = () => {
    const next = (Number(el.dataset.stage || 0) + 1) % (LAST + 1);
    setStage(el, next);
    el._mockTimer = setTimeout(tick, STAGE_MS[next]);
  };
  el._mockTimer = setTimeout(tick, STAGE_MS[Number(el.dataset.stage || 0)]);
}

function pause(el) {
  clearTimeout(el._mockTimer);
  el._mockTimer = null;
}

export function initFlowMocks(root = document) {
  const mocks = [...root.querySelectorAll('[data-flow-mock]:not([data-mock-ready])')];
  if (!mocks.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = reduced || !('IntersectionObserver' in window) ? null : new IntersectionObserver((entries) => {
    for (const e of entries) {
      const el = e.target;
      if (el.dataset.manual) continue;
      if (e.isIntersecting) { el.classList.add('is-live'); play(el); } else pause(el);
    }
  }, { threshold: 0.35 });
  for (const el of mocks) {
    el.dataset.mockReady = '';
    setStage(el, reduced || !io ? LAST : 0);
    if (reduced || !io) el.classList.add('is-live');
    el.querySelector('[data-mock-step]')?.addEventListener('click', () => {
      el.dataset.manual = '1';
      pause(el);
      el.classList.add('is-live');
      setStage(el, (Number(el.dataset.stage || 0) + 1) % (LAST + 1));
    });
    io?.observe(el);
  }
}
