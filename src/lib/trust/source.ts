// Trust signals: the build-time pull + local-manifest read + snapshot fallback
// (P3, spec §5.6). Mirrors src/lib/roadmap/signals.ts. Deliberately has NO
// project imports (only node builtins + global fetch + the enumerated maps
// below) so the refresh tool (scripts/refresh-trust-snapshot.mjs) can import it
// on plain Node — Astro/Vite resolve it at build time, but raw Node can't follow
// extensionless .ts imports.
//
// Two kinds of signal feed the "trust for an unknown studio" block (spec §4):
//   1. HuggingFace downloads-last-30-days + likes per Orionfold repo. This is the
//      genuinely LIVE signal and it works on CI (public HF API, no auth).
//   2. Book stats (chapters / parts) read from the LOCAL Quarto manifests. Those
//      absolute paths exist only on the author's machine, NOT on CI, so the book
//      figures are baked into the committed snapshot at author time and CI reads
//      them from there.
//
// loadTrust() never depends on a live call: it fetches HF live, reads the local
// manifests when present (else keeps the snapshot's book figures), and falls back
// to the whole committed snapshot if the HF pull fails. TRUST_SNAPSHOT_ONLY=1
// skips the live pull entirely (deterministic CI / instant offline dev).
import * as fs from 'node:fs';
import * as path from 'node:path';

// ─────────────────────────────────────────────────────────────────────────────
// Source maps. Enumerated here (NOT imported from src/data/models.ts) so the
// refresh script runs on plain Node — same trade-off as roadmap's FIELDKIT_MODULES.
// The model key is slugify(title), identical to the model detail-page slug, so a
// page can look up its own counts. Add a model in P4 by adding one line here.

export interface RepoRef {
  repo: string; // Orionfold/<repo>
  kind: 'model' | 'dataset'; // datasets use a different HF API path
}

export const MODEL_REPOS: Record<string, RepoRef> = {
  'patent-strategist': { repo: 'Orionfold/patent-strategist-v3-nemo-GGUF', kind: 'model' },
  'securityllm': { repo: 'Orionfold/SecurityLLM-GGUF', kind: 'model' },
  'saul-7b-instruct': { repo: 'Orionfold/Saul-7B-Instruct-v1-GGUF', kind: 'model' },
  'finance-chat': { repo: 'Orionfold/finance-chat-GGUF', kind: 'model' },
  'ii-medical-8b': { repo: 'Orionfold/II-Medical-8B-GGUF', kind: 'model' },
  'kepler': { repo: 'Orionfold/Kepler-GGUF', kind: 'model' },
  'patent-strategist-bench': { repo: 'Orionfold/patent-strategist-bench-v0.1', kind: 'dataset' },
};

// Book detail-slug -> local Quarto build manifest (a flat array of chapter
// records: {number, part, title, ...}). Author-time only; CI uses the snapshot.
export const BOOK_MANIFESTS: Record<string, string> = {
  'ai-native-business': '/Users/manavsehgal/orionfold/books/ainative/_build/manifest.json',
  'ai-research-on-nvidia-dgx-spark': '/Users/manavsehgal/orionfold/books/dgx-spark/_build/manifest.json',
};

const SNAPSHOT_PATH = path.join(process.cwd(), 'src/lib/trust/snapshot.json');

// ─────────────────────────────────────────────────────────────────────────────
// Trust types (the parsed, source-agnostic shape the site consumes)

export interface ModelTrust {
  repo: string;
  kind: 'model' | 'dataset';
  downloads: number; // last 30 days (HF `downloads`)
  downloadsAllTime: number | null; // HF `downloadsAllTime` (often null)
  likes: number;
}

export interface BookTrust {
  chapters: number;
  parts: number;
}

export interface TrustData {
  source: 'live' | 'snapshot';
  generatedAt: string; // ISO time the data was pulled
  models: Record<string, ModelTrust>;
  books: Record<string, BookTrust>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Live HuggingFace fetch

async function getJson(url: string, timeoutMs = 5000): Promise<Record<string, unknown>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return (await res.json()) as Record<string, unknown>;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchModelStats(): Promise<Record<string, ModelTrust>> {
  const slugs = Object.keys(MODEL_REPOS);
  const results = await Promise.all(
    slugs.map(async (slug): Promise<[string, ModelTrust]> => {
      const { repo, kind } = MODEL_REPOS[slug];
      const api =
        kind === 'dataset'
          ? `https://huggingface.co/api/datasets/${repo}`
          : `https://huggingface.co/api/models/${repo}`;
      const d = await getJson(api);
      const allTime = d.downloadsAllTime;
      return [
        slug,
        {
          repo,
          kind,
          downloads: Number(d.downloads ?? 0),
          downloadsAllTime: allTime != null ? Number(allTime) : null,
          likes: Number(d.likes ?? 0),
        },
      ];
    }),
  );
  return Object.fromEntries(results);
}

// ─────────────────────────────────────────────────────────────────────────────
// Local book manifest read (best-effort: the paths exist only at author time, so
// a missing file keeps the snapshot value rather than failing the build)

function readBookStats(fallback: Record<string, BookTrust>): Record<string, BookTrust> {
  const out: Record<string, BookTrust> = { ...fallback };
  for (const [slug, file] of Object.entries(BOOK_MANIFESTS)) {
    try {
      if (!fs.existsSync(file)) continue; // CI / clone without the books repo
      const arr = JSON.parse(fs.readFileSync(file, 'utf8')) as { part?: number }[];
      if (!Array.isArray(arr) || arr.length === 0) continue;
      const parts = new Set(arr.map((c) => c.part).filter((p) => p != null));
      out[slug] = { chapters: arr.length, parts: parts.size };
    } catch {
      // keep the fallback for this book
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Snapshot (offline/dev/CI fallback; never depend on a live fetch)

function readSnapshot(): TrustData {
  const raw = fs.readFileSync(SNAPSHOT_PATH, 'utf8');
  const parsed = JSON.parse(raw) as TrustData;
  return { ...parsed, source: 'snapshot' };
}

/** Pull live HF counts + read local book manifests. Throws if the HF pull fails. */
export async function fetchTrust(): Promise<TrustData> {
  let snapBooks: Record<string, BookTrust> = {};
  try {
    snapBooks = readSnapshot().books;
  } catch {
    // first run, no snapshot yet — book stats come from the local manifests below
  }
  const models = await fetchModelStats();
  const books = readBookStats(snapBooks);
  return { source: 'live', generatedAt: new Date().toISOString(), models, books };
}

/**
 * The trust entry point. Tries the live HF pull (unless TRUST_SNAPSHOT_ONLY=1)
 * and falls back to the committed snapshot on any failure, so the build resolves
 * online AND offline and never breaks on a fetch.
 */
export async function loadTrust(): Promise<TrustData> {
  if (process.env.TRUST_SNAPSHOT_ONLY === '1') return readSnapshot();
  try {
    return await fetchTrust();
  } catch (err) {
    console.warn(`[trust] live pull failed, using snapshot: ${(err as Error).message}`);
    return readSnapshot();
  }
}

/** Re-pull live and rewrite the committed snapshot. Used by the refresh script. */
export async function refreshSnapshot(): Promise<TrustData> {
  const data = await fetchTrust();
  // Persist without the runtime-only `source` flag (readSnapshot re-stamps it).
  const { source: _source, ...persisted } = data;
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(persisted, null, 2) + '\n', 'utf8');
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Consumer helper: the stat tiles a detail page's TrustBlock renders (pure, so
// the Astro routes can call it directly with the loaded TrustData).

export interface TrustStat {
  label: string;
  value: string;
}

/** "623" / "1.5k" / "12k" — compact counts for the stat tiles. */
function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k';
  return String(n);
}

/**
 * Trust stat tiles for one product. Models surface their LIVE HuggingFace counts
 * (the social proof the static hero chips can't show); a count of 0 yields no
 * tile (nothing to brag about yet → TrustBlock stays hidden, honest). Books are
 * plumbed into the snapshot but surface nothing here in P3 — the book hero chips
 * already carry chapters/parts/read-time; P5 (the DGX book) can use bookStats().
 */
export function buildTrustStats(
  trust: TrustData,
  type: 'software' | 'model' | 'book',
  slug: string,
): TrustStat[] {
  if (type !== 'model') return [];
  const m = trust.models[slug];
  if (!m || m.downloads <= 0) return [];
  const stats: TrustStat[] = [{ label: 'Downloads · last 30 days', value: formatCount(m.downloads) }];
  if (m.downloadsAllTime && m.downloadsAllTime > 0) {
    stats.push({ label: 'Downloads · all time', value: formatCount(m.downloadsAllTime) });
  }
  if (m.likes > 0) stats.push({ label: 'Likes on HuggingFace', value: formatCount(m.likes) });
  return stats;
}
