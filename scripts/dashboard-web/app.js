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
