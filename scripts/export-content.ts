// Canonical content export — the contract between this website repo and the
// Orionfold marketing repo's local content studio (consumed by /content-studio).
//
// Where export-catalog.ts mirrors *what we sell*, this mirrors *the content we've
// produced*: the building-in-public Story posts and the product detail pages, plus
// the images each one carries. The marketing repo turns these into channel-specific
// creatives. The content files themselves are the source of truth here — we iterate
// the .md on disk and enrich product entries from the typed src/data/*.ts (the same
// modules the site builds from) for canonical title/href/status + the cover art key.
//
// Each asset carries `body`, `raw_frontmatter`, and resolved `media` so a consumer
// has everything it needs to repurpose without re-reading the repo. Nothing is
// written to disk; we print content.json to STDOUT and the consumer captures it.
//
// Run:  npm run export:content --silent   (or: node --experimental-strip-types scripts/export-content.ts)
// Requires Node >= 22.6 for type stripping; data modules use type-only imports, so
// no transpiler/tsconfig is needed.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

import { software } from '../src/data/software.ts';
import { models } from '../src/data/models.ts';
import { books } from '../src/data/books.ts';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const SITE = 'https://orionfold.com';

type Collection = 'story' | 'product';
type AssetType = 'story' | 'software' | 'model' | 'book';

interface Media {
  role: string; // hero | poster | cover | gallery
  path: string; // repo-relative
  alt: string | null;
  exists: boolean;
}

interface Asset {
  id: string; // "story/<slug>" or "<type>/<slug>" (product == catalog id)
  collection: Collection;
  type: AssetType;
  slug: string;
  title: string;
  date: string | null; // story publish date; null for product pages
  summary: string; // story.summary, or the product's SSOT one-liner
  value_prop: string | null; // product hero one-liner from the .md
  tags: string[];
  url: string | null;
  source_path: string; // repo-relative .md
  word_count: number;
  excerpt: string;
  media: Media[];
  promotes: string[]; // product => [self]; story => [] (curated in the marketing overlay)
  body: string;
  raw_frontmatter: string;
}

// Match export-catalog.ts so model slugs line up across the two exports.
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[·]/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Split a Markdown file into [frontmatter, body]. Frontmatter is the text between
// the leading `---` fence and the next `---`; body is everything after.
function splitFrontmatter(text: string): { fm: string; body: string } {
  if (!text.startsWith('---\n')) return { fm: '', body: text };
  const rest = text.slice(4);
  const end = rest.indexOf('\n---');
  if (end === -1) return { fm: '', body: text };
  const fm = rest.slice(0, end);
  const after = rest.slice(end + 1); // starts at the closing '---' line
  const body = after.includes('\n') ? after.slice(after.indexOf('\n') + 1) : '';
  return { fm, body };
}

function stripQuotes(v: string): string {
  const t = v.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

// Read a flat top-level scalar (`key: value`) from a frontmatter block. We only
// need a handful of well-known fields, so a targeted read beats a YAML dependency;
// the full block also rides along as raw_frontmatter for fidelity.
function fmScalar(fm: string, key: string): string | null {
  const re = new RegExp(`^${key}:[ \\t]*(.*)$`, 'm');
  const m = fm.match(re);
  if (!m) return null;
  const v = m[1].trim();
  return v === '' ? null : stripQuotes(v);
}

// Read a top-level block sequence (`tags:` followed by `  - item` lines).
function fmList(fm: string, key: string): string[] {
  const lines = fm.split('\n');
  const start = lines.findIndex((l) => l.match(new RegExp(`^${key}:[ \\t]*$`)));
  if (start === -1) return [];
  const out: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^\s+-\s+(.*)$/);
    if (!m) break;
    out.push(stripQuotes(m[1]));
  }
  return out;
}

// In these schemas only `gallery` entries carry a `src:`; pull them as media.
function gallerySrcs(fm: string): string[] {
  return [...fm.matchAll(/^\s+src:[ \t]*(.*)$/gm)].map((m) => stripQuotes(m[1]));
}

function wordCount(body: string): number {
  const words = body.replace(/[#>*_`\-]/g, ' ').trim().split(/\s+/).filter(Boolean);
  return words.length;
}

// First real paragraph, trimmed to ~200 chars — a teaser, not the whole body.
function excerpt(body: string): string {
  for (const para of body.split(/\n\s*\n/)) {
    const p = para.trim();
    if (!p || p.startsWith('#') || p.startsWith('---')) continue;
    const flat = p.replace(/\s+/g, ' ');
    return flat.length > 200 ? flat.slice(0, 197).trimEnd() + '…' : flat;
  }
  return '';
}

// Resolve an asset reference to a repo-relative path. Frontmatter image refs are
// relative to the content file (e.g. ../../assets/...); data-module covers are bare
// keys we join onto their known asset dir.
function mediaEntry(role: string, ref: string, baseDir: string, alt: string | null): Media {
  const abs = ref.startsWith('.') ? resolve(baseDir, ref) : join(REPO_ROOT, ref);
  return { role, path: relative(REPO_ROOT, abs), alt, exists: existsSync(abs) };
}

const assets: Asset[] = [];

// ── Stories (the building-in-public blog) ──
const storyDir = join(REPO_ROOT, 'src/content/story');
for (const name of readdirSync(storyDir).filter((n) => n.endsWith('.md')).sort()) {
  const path = join(storyDir, name);
  const slug = name.replace(/\.md$/, '');
  const text = readFileSync(path, 'utf8');
  const { fm, body } = splitFrontmatter(text);
  const media: Media[] = [];
  const hero = fmScalar(fm, 'hero');
  if (hero) media.push(mediaEntry('hero', hero, storyDir, fmScalar(fm, 'heroAlt')));
  assets.push({
    id: `story/${slug}`,
    collection: 'story',
    type: 'story',
    slug,
    title: fmScalar(fm, 'title') ?? slug,
    date: fmScalar(fm, 'date'),
    summary: fmScalar(fm, 'summary') ?? '',
    value_prop: null,
    tags: fmList(fm, 'tags'),
    url: `${SITE}/story/${slug}/`,
    source_path: relative(REPO_ROOT, path),
    word_count: wordCount(body),
    excerpt: excerpt(body),
    media,
    promotes: [],
    body: body.trimEnd() + '\n',
    raw_frontmatter: fm,
  });
}

// ── Product detail pages (companions to the typed SSOT) ──
// Iterate the .md that exist (incremental rollout), enrich from the data modules.
const PRODUCT_FOLDERS: { folder: string; type: AssetType }[] = [
  { folder: 'software', type: 'software' },
  { folder: 'models', type: 'model' },
  { folder: 'books', type: 'book' },
];

for (const { folder, type } of PRODUCT_FOLDERS) {
  const dir = join(REPO_ROOT, 'src/content/products', folder);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.md')).sort()) {
    const path = join(dir, name);
    const slug = name.replace(/\.md$/, '');
    const text = readFileSync(path, 'utf8');
    const { fm, body } = splitFrontmatter(text);

    // Enrich from the SSOT: canonical title/href + the cover art key.
    let title = slug;
    let summary = '';
    let href: string | null = null;
    const media: Media[] = [];
    if (type === 'software') {
      const s = software.find((x) => x.slug === slug);
      if (s) {
        title = s.title;
        summary = s.body;
        href = s.href ?? null;
        if (s.cover) media.push(mediaEntry('poster', join('src/assets/projects', s.cover), dir, s.title));
      }
    } else if (type === 'model') {
      const m = models.find((x) => slugify(x.title) === slug);
      if (m) {
        title = m.title;
        summary = m.tagline;
        href = m.href ?? null;
        if (m.cover) media.push(mediaEntry('cover', join('src/assets/models', m.cover), dir, m.coverAlt ?? null));
      }
    } else {
      const b = books.find((x) => x.slug === slug);
      if (b) {
        title = b.title;
        summary = b.body;
        href = b.href ?? null;
      }
    }

    // Hero override + gallery images from the .md itself.
    const hero = fmScalar(fm, 'hero');
    if (hero) media.push(mediaEntry('hero', hero, dir, fmScalar(fm, 'heroAlt')));
    for (const src of gallerySrcs(fm)) media.push(mediaEntry('gallery', src, dir, null));

    const id = `${type}/${slug}`;
    assets.push({
      id,
      collection: 'product',
      type,
      slug,
      title,
      date: null,
      summary,
      value_prop: fmScalar(fm, 'valueProp'),
      tags: [],
      url: href,
      source_path: relative(REPO_ROOT, path),
      word_count: wordCount(body),
      excerpt: excerpt(body),
      media,
      promotes: [id], // a product page promotes its own catalog offering 1:1
      body: body.trimEnd() + '\n',
      raw_frontmatter: fm,
    });
  }
}

function gitCommit(): string | null {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

const output = {
  generated_at: new Date().toISOString(),
  source: {
    repo: REPO_ROOT,
    commit: gitCommit(),
    content_dirs: ['src/content/story', 'src/content/products'],
    data_files: ['src/data/software.ts', 'src/data/models.ts', 'src/data/books.ts'],
  },
  counts: {
    total: assets.length,
    by_collection: assets.reduce<Record<string, number>>((acc, a) => {
      acc[a.collection] = (acc[a.collection] ?? 0) + 1;
      return acc;
    }, {}),
    by_type: assets.reduce<Record<string, number>>((acc, a) => {
      acc[a.type] = (acc[a.type] ?? 0) + 1;
      return acc;
    }, {}),
    media: assets.reduce((n, a) => n + a.media.length, 0),
  },
  assets,
};

process.stdout.write(JSON.stringify(output, null, 2) + '\n');
