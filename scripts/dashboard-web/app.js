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
// (admin buttons get wired in Task 5; inert until then)

// ── tooltip singleton (design-system §5.5) — textContent ONLY, never innerHTML
const tip = document.getElementById('tip');
addEventListener('mousemove', (e) => {
  const el = e.target.closest?.('[data-tip-head]');
  if (!el) { tip.style.display = 'none'; return; }
  const head = document.createElement('div');
  head.className = 'tip-head';
  head.textContent = el.getAttribute('data-tip-head');
  let lines = [];
  try { lines = JSON.parse(el.getAttribute('data-tip-lines') || '[]'); } catch {}
  const lineDivs = lines.map((t) => {
    const d = document.createElement('div');
    d.className = 'tip-line';
    d.textContent = String(t);
    return d;
  });
  tip.replaceChildren(head, ...lineDivs);
  tip.style.display = 'block';
  const r = tip.getBoundingClientRect();
  tip.style.left = `${Math.min(e.clientX + 14, innerWidth - r.width - 8)}px`;
  tip.style.top = `${Math.min(e.clientY + 14, innerHeight - r.height - 8)}px`;
});

// ── bento packer (design-system §5.6): measure → span; no structural whitespace
function bentoize() {
  const grid = document.querySelector('.grid');
  if (!grid) return;
  if (innerWidth <= 1100) { grid.classList.remove('packed'); return; }
  grid.classList.add('packed');
  for (const p of grid.querySelectorAll('.panel')) {
    p.style.gridRowEnd = 'auto';
    const h = p.scrollHeight;
    p.style.gridRowEnd = `span ${Math.ceil((h + 14) / (10 + 14))}`; // 10px rows + 14px gap
  }
}
addEventListener('resize', bentoize);
