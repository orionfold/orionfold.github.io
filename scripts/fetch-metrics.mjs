// M3 orchestrator — run every metrics fetcher in turn and write a small index
// so the M4 dashboard can find the day's snapshot files. Spec §7.
//
//   node scripts/fetch-metrics.mjs        (or: npm run metrics)
//
// Each fetcher is a standalone script that writes its own dated JSON into
// audit-reports/metrics/ (git-ignored). This runner spawns them so one
// fetcher failing (e.g. an expired token) never aborts the others — it records
// the per-source outcome and keeps going. Plain Node, no deps. Run from the
// repo root.
//
// Sources:
//   - crux        (Google CrUX field CWV — 404 until traffic clears threshold)
//   - betterstack (uptime monitor roll-up)
//   - cloudflare  (edge traffic + cache; RUM CWV is dashboard-only — recorded)
//   - lighthouse  (lab scores from the latest LHCI run; skips if none yet)
//
// GA4 + GSC are NOT fetched here: the Workspace org blocks service-account keys
// and sensitive-scope OAuth, so those are captured manually via Claude-in-Chrome
// (spec §7). The M4 dashboard reads them if a human drops a hand-made
// audit-reports/metrics/ga4-<date>.json / gsc-<date>.json in place; absence is
// shown as "manual capture pending", not an error.

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { writeMetric } from './lib/metrics.mjs';

const FETCHERS = [
  { source: 'crux', script: 'fetch-crux.mjs' },
  { source: 'betterstack', script: 'fetch-betterstack.mjs' },
  { source: 'cloudflare', script: 'fetch-cloudflare.mjs' },
  { source: 'lighthouse', script: 'summarize-lighthouse.mjs' },
];

const results = [];
for (const { source, script } of FETCHERS) {
  console.log(`\n── ${source} ───────────────────────────────`);
  const r = spawnSync('node', [resolve('scripts', script)], { stdio: 'inherit' });
  results.push({ source, script, ok: r.status === 0, exitCode: r.status });
}

const index = {
  source: 'metrics-index',
  fetchedAt: new Date().toISOString(),
  results,
  // GA4/GSC are manual (see header) — flag them so the dashboard renders the
  // panel with a "capture pending" hint rather than treating them as missing.
  manual: ['ga4', 'gsc'],
};
const outPath = writeMetric('index', index);

console.log('\n══ summary ═══════════════════════════════');
for (const r of results) {
  console.log(`  ${r.ok ? '✅' : '⚠️ '} ${r.source}${r.ok ? '' : ` (exit ${r.exitCode})`}`);
}
console.log(`  manual (Claude-in-Chrome): ga4, gsc`);
console.log(`\n[metrics] wrote index ${outPath}`);

// Exit non-zero only if EVERY fetcher failed (likely a config/env problem worth
// surfacing). A partial set is normal and fine for the dashboard.
process.exit(results.every((r) => !r.ok) ? 1 : 0);
