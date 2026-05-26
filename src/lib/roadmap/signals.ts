// Roadmap signals: the build-time pull + parse + cache layer (F2, spec §5).
// Deliberately has NO project imports (only node builtins + global fetch) so the
// refresh script (scripts/refresh-roadmap-snapshot.mjs, also used by R3's
// roadmap-manage skill) can import it on plain Node — Astro/Vite resolve the
// merge layer (source.ts) at build time, but the standalone refresh tool can't.
//
// Two signals are pulled from the public donor repo
// (manavsehgal/ainative-business.github.io):
//   1. fieldkit `docs/api/*.md` frontmatter (11 modules) + `_version.py` version.
//   2. field-notes `project-stats.json` (publishing stages + upcoming notes).
//
// resolves online AND offline (DoD): loadSignals() tries a timeout-bounded live
// fetch, then falls back to the committed snapshot.json on ANY failure, so
// `astro build` never depends on a live fetch. ROADMAP_SNAPSHOT_ONLY=1 skips the
// live pull (deterministic CI / instant offline dev).
import * as fs from 'node:fs';
import * as path from 'node:path';

const RAW = 'https://raw.githubusercontent.com/manavsehgal/ainative-business.github.io/main';
const PROJECT_STATS_URL = `${RAW}/src/data/field-notes/project-stats.json`;
const FIELDKIT_VERSION_URL = `${RAW}/fieldkit/_version.py`;
const FIELDKIT_API_DIR = `${RAW}/fieldkit/docs/api`;

// raw.githubusercontent can't list a directory, so the known fieldkit module
// surface is enumerated here; each file is fetched and its frontmatter parsed.
// A module added upstream is picked up by adding its id here (or via the R3 skill).
export const FIELDKIT_MODULES = [
  'capabilities', 'cli', 'eval', 'lineage', 'nim', 'notebook',
  'publish', 'quant', 'rag', 'training', 'viz',
] as const;

const SNAPSHOT_PATH = path.join(process.cwd(), 'src/lib/roadmap/snapshot.json');

// ─────────────────────────────────────────────────────────────────────────────
// Signal types (the parsed, source-agnostic shape that the merge layer consumes)

export interface FieldkitModule {
  id: string; // 'rag'
  title: string; // 'fieldkit.rag' (raw, kept for reference)
  summary: string; // raw upstream summary (technical; not shown as site copy)
  order: number;
}

export interface FieldStage {
  id: string; // 'fine-tuning'
  published: number;
  upcoming: number;
}

export interface RoadmapSignals {
  source: 'live' | 'snapshot';
  generatedAt: string; // ISO time the signals were pulled
  fieldkit: { version: string; modules: FieldkitModule[] };
  fieldNotes: { articlesPublished: number; articlesUpcoming: number; stages: FieldStage[] };
}

// ─────────────────────────────────────────────────────────────────────────────
// Live fetch + parse

async function getText(url: string, timeoutMs = 5000): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// Minimal YAML frontmatter reader: the block between the leading `---` fences,
// one `key: value` per line (value split on the FIRST `: ` so colons/backticks
// in summaries survive).
function parseFrontmatter(md: string): Record<string, string> {
  const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const out: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(': ');
    if (idx === -1) continue;
    out[line.slice(0, idx).trim()] = line.slice(idx + 2).trim();
  }
  return out;
}

function parseVersion(py: string): string {
  const m = py.match(/__version__\s*=\s*["']([^"']+)["']/);
  if (!m) throw new Error('could not parse fieldkit __version__');
  return m[1];
}

interface ProjectStats {
  articles?: { published?: number; upcoming?: number };
  stages?: Record<string, number>;
  stages_upcoming?: Record<string, number>;
}

function parseStages(stats: ProjectStats): FieldStage[] {
  const published = stats.stages ?? {};
  const upcoming = stats.stages_upcoming ?? {};
  return Object.keys(published).map((id) => ({
    id,
    published: published[id] ?? 0,
    upcoming: upcoming[id] ?? 0,
  }));
}

/** Pull the live signals from GitHub. Throws on any failure (loadSignals catches). */
export async function fetchSignals(): Promise<RoadmapSignals> {
  const [statsRaw, versionRaw, ...moduleRaws] = await Promise.all([
    getText(PROJECT_STATS_URL),
    getText(FIELDKIT_VERSION_URL),
    ...FIELDKIT_MODULES.map((id) => getText(`${FIELDKIT_API_DIR}/${id}.md`)),
  ]);

  const stats = JSON.parse(statsRaw) as ProjectStats;
  const modules: FieldkitModule[] = moduleRaws
    .map((md, i): FieldkitModule => {
      const fm = parseFrontmatter(md);
      return {
        id: fm.module ?? FIELDKIT_MODULES[i],
        title: fm.title ?? `fieldkit.${FIELDKIT_MODULES[i]}`,
        summary: fm.summary ?? '',
        order: Number(fm.order ?? i + 1),
      };
    })
    .sort((a, b) => a.order - b.order);

  return {
    source: 'live',
    generatedAt: new Date().toISOString(),
    fieldkit: { version: parseVersion(versionRaw), modules },
    fieldNotes: {
      articlesPublished: stats.articles?.published ?? 0,
      articlesUpcoming: stats.articles?.upcoming ?? 0,
      stages: parseStages(stats),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Snapshot (offline/dev/CI-blip fallback; never depend on a live fetch)

function readSnapshot(): RoadmapSignals {
  const raw = fs.readFileSync(SNAPSHOT_PATH, 'utf8');
  const parsed = JSON.parse(raw) as RoadmapSignals;
  return { ...parsed, source: 'snapshot' };
}

/**
 * The signals entry point. Tries the live pull (unless ROADMAP_SNAPSHOT_ONLY=1)
 * and falls back to the committed snapshot on any failure, so the build resolves
 * online AND offline and never breaks on a fetch.
 */
export async function loadSignals(): Promise<RoadmapSignals> {
  if (process.env.ROADMAP_SNAPSHOT_ONLY === '1') return readSnapshot();
  try {
    return await fetchSignals();
  } catch (err) {
    console.warn(`[roadmap] live pull failed, using snapshot: ${(err as Error).message}`);
    return readSnapshot();
  }
}

/** Re-pull live and rewrite the committed snapshot. Used by the refresh script / R3 skill. */
export async function refreshSnapshot(): Promise<RoadmapSignals> {
  const signals = await fetchSignals();
  // Persist without the runtime-only `source` flag (readSnapshot re-stamps it).
  const { source: _source, ...persisted } = signals;
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(persisted, null, 2) + '\n', 'utf8');
  return signals;
}
