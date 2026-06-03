// Snapshot Better Stack uptime monitor status into audit-reports/metrics/
// (git-ignored) for the M4 dashboard "Uptime" + "Commerce health" panels.
// M3 task, spec §7. Better Stack does the real-time alerting (email on 2
// consecutive fails); this fetcher just captures the current roll-up so the
// dashboard can show it alongside the other health signals.
//
//   node scripts/fetch-betterstack.mjs
//
// Reads BETTER_STACK_API_TOKEN from the environment or .env.local. Plain Node,
// no deps. Run from the repo root. Exits 1 only if the token is missing or the
// API is unreachable — a monitor being "down" is data, not a script error.

import { loadEnvLocal, writeMetric } from './lib/metrics.mjs';

loadEnvLocal();
const TOKEN = process.env.BETTER_STACK_API_TOKEN;
if (!TOKEN) {
  console.error('[betterstack] BETTER_STACK_API_TOKEN not set (env or .env.local) — aborting.');
  process.exit(1);
}

const API = 'https://uptime.betterstack.com/api/v2/monitors';

// Better Stack paginates monitors; follow `pagination.next` until exhausted so
// the roll-up reflects every monitor even past the first page.
async function fetchAllMonitors() {
  const monitors = [];
  let url = `${API}?per_page=50`;
  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    const json = await res.json();
    monitors.push(...(json.data ?? []));
    url = json.pagination?.next ?? null;
  }
  return monitors;
}

const monitors = await fetchAllMonitors();

// Better Stack statuses: "up", "down", "paused", "pending", "validating",
// "maintenance". Treat anything not "up"/"paused" as needing attention so the
// dashboard's red count is honest, but keep the raw status per monitor too.
const items = monitors.map((m) => {
  const a = m.attributes ?? {};
  return {
    id: m.id,
    name: a.pronounceable_name ?? a.url,
    url: a.url,
    status: a.status,
    monitorType: a.monitor_type,
    expectedKeyword: a.required_keyword ?? null,
    checkFrequencySec: a.check_frequency,
    lastCheckedAt: a.last_checked_at,
  };
});

const counts = items.reduce((acc, m) => {
  acc[m.status] = (acc[m.status] ?? 0) + 1;
  return acc;
}, {});

const result = {
  source: 'betterstack',
  fetchedAt: new Date().toISOString(),
  total: items.length,
  counts,
  allUp: items.every((m) => m.status === 'up' || m.status === 'paused'),
  monitors: items.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
};

const outPath = writeMetric('betterstack', result);
const summary = Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(', ');
console.log(`[betterstack] ${items.length} monitors (${summary || 'none'}) — allUp=${result.allUp}`);
console.log(`[betterstack] wrote ${outPath}`);
