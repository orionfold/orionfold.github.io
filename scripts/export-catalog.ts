// Canonical catalog export — the contract between this website repo and the
// Orionfold marketing repo's local catalog (consumed by the /catalog-sync skill).
//
// It imports the real product data (the same modules the site builds from) plus
// the Stripe commerce catalog, normalizes every offering into one flat shape, and
// prints catalog.json to STDOUT. Nothing is written to disk here; the consumer
// captures stdout. Each entry also carries a `raw` block (the untouched source
// object) so a future control-plane could regenerate these .ts files losslessly.
//
// Run:  npm run export:catalog --silent      (or: node --experimental-strip-types scripts/export-catalog.ts)
// Requires Node >= 22.6 for type stripping; only type-only imports are used in the
// data modules, so no transpiler/tsconfig is needed.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import { software } from '../src/data/software.ts';
import { models } from '../src/data/models.ts';
import { books } from '../src/data/books.ts';
import { CATALOG } from '../supabase/functions/_shared/catalog.ts';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');

type ProductType = 'software' | 'model' | 'dataset' | 'book' | 'sponsor' | 'license' | 'workshop';

interface Commerce {
  lookupKey: string;
  kind: string; // "book" | "sponsor" | "license"
  mode: string; // "payment" | "subscription"
  amount_cents: number;
  tier: string | null;
}

interface Product {
  id: string; // "<type>/<slug>"  — stable key
  type: ProductType;
  slug: string;
  group: string | null;
  title: string;
  summary: string;
  href: string | null;
  status: string; // released | active | planned
  monetized: boolean;
  commerce: Commerce | null;
  detail_page: string | null; // repo-relative path, or null
  raw: unknown;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[·]/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Detail page lives at src/content/products/<folder>/<slug>.md when present.
function detailPage(folder: string, slug: string): string | null {
  const rel = join('src/content/products', folder, `${slug}.md`);
  return existsSync(join(REPO_ROOT, rel)) ? rel : null;
}

const products: Product[] = [];

// ── Software (12) ──
for (const p of software) {
  products.push({
    id: `software/${p.slug}`,
    type: 'software',
    slug: p.slug,
    group: p.group ?? null,
    title: p.title,
    summary: p.body,
    href: p.href ?? null,
    status: p.status ?? 'released',
    monetized: false,
    commerce: null,
    detail_page: detailPage('software', p.slug),
    raw: p,
  });
}

// ── Models + dataset (7) ──
for (const m of models) {
  const type: ProductType = m.group === 'dataset' ? 'dataset' : 'model';
  const slug = slugify(m.title);
  // Two builds can share a title/slug (e.g. Patent Strategist GGUF vs adapter);
  // disambiguate the stable id by variant so every entry is unique.
  const id = m.variant ? `${type}/${slug}--${slugify(m.variant)}` : `${type}/${slug}`;
  products.push({
    id,
    type,
    slug,
    group: m.group ?? null,
    title: m.variant ? `${m.title} (${m.variant})` : m.title,
    summary: m.tagline,
    href: m.href ?? null,
    status: m.status ?? 'released',
    monetized: false,
    commerce: null,
    detail_page: detailPage('models', slug),
    raw: m,
  });
}

// ── Books (2) ──
for (const b of books) {
  const item = CATALOG[b.lookupKey];
  products.push({
    id: `book/${b.slug}`,
    type: 'book',
    slug: b.slug,
    group: null,
    title: b.title,
    summary: b.body,
    href: b.href ?? null,
    status: b.status ?? 'released',
    monetized: Boolean(item),
    commerce: item
      ? { lookupKey: item.lookupKey, kind: item.kind, mode: item.mode, amount_cents: item.amount, tier: item.tier ?? null }
      : null,
    detail_page: detailPage('books', b.slug),
    raw: b,
  });
}

// ── Sponsor tiers (4) — synthetic products straight from the commerce catalog ──
for (const item of Object.values(CATALOG)) {
  if (item.kind !== 'sponsor') continue;
  const tier = item.tier ?? 'tier';
  products.push({
    id: `sponsor/${tier}`,
    type: 'sponsor',
    slug: `sponsor-${tier}`,
    group: 'sponsor',
    title: item.label,
    summary: `${item.label}: recurring sponsorship at $${(item.amount / 100).toFixed(0)}/month.`,
    href: 'https://orionfold.com/adoption/',
    status: 'released',
    monetized: true,
    commerce: { lookupKey: item.lookupKey, kind: item.kind, mode: item.mode, amount_cents: item.amount, tier: item.tier ?? null },
    detail_page: null,
    raw: item,
  });
}

// Training workshops — one catalog row per independently purchasable edition.
for (const item of Object.values(CATALOG)) {
  if (item.kind !== 'workshop') continue;
  products.push({
    id: 'workshop/relay-operator-workshop',
    type: 'workshop',
    slug: 'relay-operator-workshop',
    group: 'training',
    title: item.label,
    summary: 'Build one governed Relay workflow with a human checkpoint and retained completion evidence.',
    href: 'https://orionfold.com/training/relay-operator-workshop/',
    status: 'planned',
    monetized: true,
    commerce: { lookupKey: item.lookupKey, kind: item.kind, mode: item.mode, amount_cents: item.amount, tier: null },
    detail_page: 'src/pages/training/relay-operator-workshop/index.astro',
    raw: item,
  });
}

// ── Licensed products (6) — the paid, per-box key-file SKUs straight from the
// commerce catalog: Orionfold Proof (the flagship) + Arena Field Edition, each a
// three-SKU family (base / founding / renewal). These are LIVE on Stripe and the
// site checkout resolves them by lookup_key; the marketing /catalog-sync roster
// needs them so the flagship is visible to demand-gen. (Relay ask A2, 2026-06-25.)
// Each license SKU maps to the on-site product surface that sells it.
const LICENSE_SURFACE: Record<string, { id: string; slug: string; href: string; detail: string | null }> = {
  license_orionfold_proof: { id: 'license/orionfold-proof', slug: 'orionfold-proof', href: 'https://orionfold.com/proof/', detail: null },
  license_arena_field_edition: { id: 'license/arena-field-edition', slug: 'arena-field-edition', href: 'https://orionfold.com/software/arena/', detail: detailPage('software', 'arena') },
};
// Strip the family suffix so founding/renewal SKUs resolve to the same surface.
function licenseSurface(lookupKey: string) {
  const base = lookupKey.replace(/_(founding|renewal)$/, '');
  return LICENSE_SURFACE[base];
}

for (const item of Object.values(CATALOG)) {
  if (item.kind !== 'license') continue;
  const surface = licenseSurface(item.lookupKey);
  if (!surface) continue; // unknown license family — skip rather than mis-link
  const founding = item.lookupKey.endsWith('_founding');
  const renewal = item.lookupKey.endsWith('_renewal');
  const variant = founding ? 'founding' : renewal ? 'renewal' : 'standard';
  products.push({
    id: variant === 'standard' ? surface.id : `${surface.id}--${variant}`,
    type: 'license',
    slug: variant === 'standard' ? surface.slug : `${surface.slug}-${variant}`,
    group: 'license',
    title: item.label,
    summary: renewal
      ? `${item.label}: $${(item.amount / 100).toFixed(0)}/year to keep the proof current.`
      : `${item.label}: $${(item.amount / 100).toFixed(0)} one-time, per-box license.`,
    href: surface.href,
    status: 'released',
    monetized: true,
    commerce: { lookupKey: item.lookupKey, kind: item.kind, mode: item.mode, amount_cents: item.amount, tier: item.tier ?? null },
    detail_page: surface.detail,
    raw: item,
  });
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
    data_files: [
      'src/data/software.ts',
      'src/data/models.ts',
      'src/data/books.ts',
      'supabase/functions/_shared/catalog.ts',
    ],
  },
  counts: {
    total: products.length,
    by_type: products.reduce<Record<string, number>>((acc, p) => {
      acc[p.type] = (acc[p.type] ?? 0) + 1;
      return acc;
    }, {}),
    monetized: products.filter((p) => p.monetized).length,
  },
  products,
};

process.stdout.write(JSON.stringify(output, null, 2) + '\n');
