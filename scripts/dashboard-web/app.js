// M7 — poll loop (spec §4c): fetch /api/data every 15s + on tab focus,
// re-render only when the payload hash changes (scroll preserved).
// Renderers are the SAME module the static build uses (/lib/dashboard-render.mjs).
import { renderBody } from '/lib/dashboard-render.mjs';

const TOKEN = document.querySelector('meta[name="db-token"]').content;
const POLL_MS = 15000;
let lastSig = '';

function setDot(state, title) {
  const dot = document.getElementById('live-dot');
  dot.className = `dot ${state}`;
  dot.title = title;
}

function render(payload) {
  const body = renderBody(payload);
  document.getElementById('meta').innerHTML = body.metaHtml;
  document.getElementById('freshness').innerHTML = body.freshnessHtml;
  document.getElementById('col-main').innerHTML = body.mainHtml;
  document.getElementById('col-side').innerHTML = body.sideHtml;
  bentoize();
}

async function tick() {
  try {
    const res = await fetch('/api/data', { headers: TOKEN ? { 'X-DB-Token': TOKEN } : {} });
    if (!res.ok) { setDot('red', `api ${res.status}`); return; }
    const payload = await res.json();
    setDot('green', `live · last poll ${new Date().toLocaleTimeString()}`);
    syncButtons(payload);
    // hash-skip: identical payload (minus volatile keys) → no re-render
    const { generatedAt, ...rest } = payload;
    const sig = JSON.stringify(rest);
    if (sig !== lastSig) { lastSig = sig; render(payload); }
  } catch {
    setDot('red', 'server unreachable');
  }
}

tick();
setInterval(tick, POLL_MS);
addEventListener('focus', tick);
// ── admin actions: token-gated POSTs; job state rides /api/data
async function post(jobName, btn) {
  btn.disabled = true;
  try {
    await fetch(`/api/${jobName}`, { method: 'POST', headers: TOKEN ? { 'X-DB-Token': TOKEN } : {} });
  } catch { /* next tick shows the state */ }
  await tick(); // pick up the running state immediately
}
const btnRefresh = document.getElementById('btn-refresh');
const btnLhci = document.getElementById('btn-lhci');
btnRefresh.addEventListener('click', () => post('refresh', btnRefresh));
btnLhci.addEventListener('click', () => post('lhci', btnLhci));
function syncButtons(payload) {
  btnRefresh.disabled = payload.jobs?.refresh?.state === 'running';
  btnLhci.disabled = payload.jobs?.lhci?.state === 'running';
}

// ── tooltip singleton (design-system §5.5) — textContent ONLY, never innerHTML
const tip = document.getElementById('tip');
let _tipEl = null;
addEventListener('mousemove', (e) => {
  const el = e.target.closest?.('[data-tip-head]');
  if (!el) { _tipEl = null; tip.style.display = 'none'; return; }
  if (el !== _tipEl) {
    _tipEl = el;
    const head = document.createElement('div');
    head.className = 'tip-head';
    head.textContent = el.getAttribute('data-tip-head');
    let lines = [];
    try { lines = JSON.parse(el.getAttribute('data-tip-lines') || '[]'); } catch {}
    tip.replaceChildren(head, ...lines.map((t) => {
      const d = document.createElement('div');
      d.className = 'tip-line';
      d.textContent = String(t);
      return d;
    }));
  }
  tip.style.display = 'block';
  const r = tip.getBoundingClientRect();
  tip.style.left = `${Math.min(e.clientX + 14, innerWidth - r.width - 8)}px`;
  tip.style.top = `${Math.min(e.clientY + 14, innerHeight - r.height - 8)}px`;
});

// ── bento packer (design-system §5.6): measure → span; no structural whitespace
function bentoize() {
  const grid = document.querySelector('.grid');
  if (!grid || innerWidth <= 1100) { grid?.classList.remove('packed'); return; }
  const panels = [...grid.querySelectorAll('.panel')];
  grid.classList.add('packed');
  for (const p of panels) p.style.gridRowEnd = 'auto';
  const heights = panels.map((p) => p.scrollHeight);          // batched reads
  panels.forEach((p, i) => {
    p.style.gridRowEnd = `span ${Math.ceil((heights[i] + 14) / (10 + 14))}`; // 10px rows + 14px gap
  });
}
let _resizeTimer;
addEventListener('resize', () => { clearTimeout(_resizeTimer); _resizeTimer = setTimeout(bentoize, 100); });
