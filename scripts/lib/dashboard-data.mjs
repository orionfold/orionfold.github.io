// M7 — data assembly for the health dashboard (spec
// specs/2026-06-06-live-admin-dashboard.md §4a). Shared by the static build
// (build-dashboard.mjs) and the live server (dashboard-server.mjs).
// Stateless: every assemble() re-reads audit-reports/metrics/ fresh — files
// are the truth, so there is no cache to invalidate (peer-dashboard rule).
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { METRICS_DIR } from './metrics.mjs';

// ── load every snapshot, grouped by source, sorted oldest→newest ────────────
function loadSnapshots() {
  let names = [];
  try {
    names = readdirSync(METRICS_DIR);
  } catch {
    return {};
  }
  const bySource = {};
  for (const name of names) {
    const m = name.match(/^(.+)-(\d{4}-\d{2}-\d{2})\.json$/);
    if (!m) continue;
    const [, source, date] = m;
    let data;
    try {
      data = JSON.parse(readFileSync(resolve(METRICS_DIR, name), 'utf8'));
    } catch {
      continue;
    }
    (bySource[source] ||= []).push({ date, data });
  }
  for (const source of Object.keys(bySource)) {
    bySource[source].sort((a, b) => a.date.localeCompare(b.date));
  }
  return bySource;
}

export function assemble() {
  return {
    generatedAt: new Date().toISOString(),
    snaps: loadSnapshots(),
  };
}
