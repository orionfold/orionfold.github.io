// M7 — data assembly for the health dashboard (spec
// specs/2026-06-06-live-admin-dashboard.md §4a). Shared by the static build
// (build-dashboard.mjs) and the live server (dashboard-server.mjs).
// Stateless: every assemble() re-reads audit-reports/metrics/ fresh — files
// are the truth, so there is no cache to invalidate (peer-dashboard rule).
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
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

// ── CI / deploy status via gh CLI — cached 5 min so the 15s poll path stays
// egress-free (peer rule); cache drops on server start and after admin jobs.
// ⚠ spawnSync here BLOCKS the event loop (up to 2×8s on a cache miss). The
// TTL makes that rare and it's acceptable for a loopback single-operator
// tool — but do NOT add more subprocess calls to assemble() (todos() etc.
// must stay plain file reads).
const CI_TTL_MS = 5 * 60 * 1000;
let ciCache = null; // { at, data }
export function dropCiCache() { ciCache = null; }
function ciStatus() {
  if (ciCache && Date.now() - ciCache.at < CI_TTL_MS) return ciCache.data;
  const runs = ['deploy.yml', 'lighthouse.yml'].map((wf) => {
    const r = spawnSync('gh', ['run', 'list', '--workflow', wf, '--limit', '1',
      '--json', 'status,conclusion,updatedAt,url,displayTitle'],
      { cwd: resolve(METRICS_DIR, '..', '..'), encoding: 'utf8', timeout: 8000 });
    if (r.status !== 0 || !r.stdout) {
      return { workflow: wf, available: false, reason: (r.stderr || 'gh unavailable').trim().slice(0, 200) };
    }
    try {
      const [run] = JSON.parse(r.stdout);
      return run ? { workflow: wf, available: true, ...run }
                 : { workflow: wf, available: false, reason: 'no runs yet' };
    } catch {
      return { workflow: wf, available: false, reason: 'unparseable gh output' };
    }
  });
  ciCache = { at: Date.now(), data: { asOf: new Date().toISOString(), runs } };
  return ciCache.data;
}

// ── Todos loader (agency export ∪ local echo — plain file reads, NO subprocess)
// METRICS_DIR = <root>/audit-reports/metrics  →  resolve(…,'..','..') = <root>
const ROOT = resolve(METRICS_DIR, '..', '..');

function todos() {
  const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
  const agency = readJson(resolve(ROOT, '..', 'agency', '_TODOS', '_export.json'));
  const local = readJson(resolve(ROOT, '_TODOS.json'));
  if (!agency && !local) return { available: false, reason: 'no agency _export.json or local _TODOS.json found' };
  const byId = new Map();
  for (const t of [...(agency?.todos || []), ...(local?.todos || [])]) {
    if (!t?.id || !t.updated) continue;
    const prev = byId.get(t.id);
    const wins = !prev
      || (t.updated || '') > (prev.updated || '')
      || ((t.updated || '') === (prev.updated || '') && t.status === 'done');
    if (wins) byId.set(t.id, { ...prev, ...t });
  }
  return { available: true, generated: agency?.generated ?? null, todos: [...byId.values()] };
}

export function assemble({ ci = true } = {}) {
  return {
    generatedAt: new Date().toISOString(),
    snaps: loadSnapshots(),
    ci: ci ? ciStatus() : { asOf: null, runs: [] },
    todos: todos(),
  };
}
