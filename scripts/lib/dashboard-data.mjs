// M7 — data assembly for the health dashboard (spec
// _SPECS/2026-06-06-144656-01_live-admin-dashboard.md §4a). Shared by the static build
// (build-dashboard.mjs) and the live server (dashboard-server.mjs).
// Stateless: every assemble() re-reads audit-reports/metrics/ fresh — files
// are the truth, so there is no cache to invalidate (peer-dashboard rule).
import { readdirSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { METRICS_DIR } from './metrics.mjs';
import { SITES, DEFAULT_SITE } from './sites.mjs';

// All known site keys — used to split an optional `-<site>` segment off the
// filename. Our own tooling writes bare names for the default site (a bare file
// resolves to the default site below), but the default key is included here too
// so a hand-dropped `<source>-orionfold-<date>.json` still parses correctly.
const SITE_KEYS = SITES.map((s) => s.key);

// ── load every snapshot, grouped by source, tagged with site, oldest→newest ──
function loadSnapshots() {
  let names = [];
  try {
    names = readdirSync(METRICS_DIR);
  } catch {
    return {};
  }
  // Optional middle segment: only a KNOWN non-default site key splits off, so a
  // hyphenated source name (e.g. `metrics-index`) is never mis-split.
  const siteAlt = SITE_KEYS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const re = new RegExp(`^(.+?)(?:-(${siteAlt}))?-(\\d{4}-\\d{2}-\\d{2})\\.json$`);
  const bySource = {};
  for (const name of names) {
    const m = name.match(re);
    if (!m) continue;
    const [, source, siteSeg, date] = m;
    const site = siteSeg || DEFAULT_SITE.key;
    let data;
    try {
      data = JSON.parse(readFileSync(resolve(METRICS_DIR, name), 'utf8'));
    } catch {
      continue;
    }
    (bySource[source] ||= []).push({ date, site, data });
  }
  for (const source of Object.keys(bySource)) {
    bySource[source].sort((a, b) => a.date.localeCompare(b.date));
  }
  return bySource;
}

// Test seam: lets the data self-check exercise the real loader.
export function loadSnapshotsForTest() {
  return loadSnapshots();
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
// This project's todo-sync key = repo dir name ('website' — local ids are
// `website-<n>` per the sync contract). Only todos tagged to it belong here.
const PROJECT = basename(ROOT);

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
  // Merge first (last-writer-wins must see both copies), THEN keep only todos
  // tagged to this project — by project or ref_project, per the sync contract.
  const mine = [...byId.values()].filter((t) => t.project === PROJECT || t.ref_project === PROJECT);
  return { available: true, generated: agency?.generated ?? null, todos: mine };
}

export function assemble({ ci = true } = {}) {
  return {
    generatedAt: new Date().toISOString(),
    snaps: loadSnapshots(),
    ci: ci ? ciStatus() : { asOf: null, runs: [] },
    todos: todos(),
  };
}
