// scripts/sync-flow-paths.mjs
// Publish the Flow product lane's customer-path walkthroughs as /flow/paths/.
//
// Reads two sources READ-ONLY and writes website files:
//   - the article text: ~/orionfold-flow/articles/<NN>-<slug>/ARTICLE.md
//   - the shots: ~/orionfold/ops/shared/flow-articles/<slug>/*.png. These are the
//     copies the product lane cleared for ops, downscaled to 1920 px with the
//     licensee footer masked. Never take shots from the product repo's own
//     shots/ folder: those are unmasked.
//
// For each article it writes:
//   1. src/content/paths/<slug>.md. The body is the article, verbatim, minus
//      its H1 (the title lives in front matter), its italic standfirst (becomes
//      `dek`), every "not for publication" section, and every "not yet released"
//      build update. Image links are rewritten to the encoded shots.
//   2. src/assets/flow/paths/<slug>/<shot>.webp, encoded at 1600 px wide, plus
//      card.jpg (the card shot at 1200 px) for the path's social card.
//
// Front matter has two owners. The product fields (title, path, persona,
// drafted, build, data) are refreshed from the article on every sync. The
// website fields (order, featured, chip, summary, stat, steps, cardShot,
// receipt, draft, …) are kept from the existing .md. A new article arrives
// with draft: true and must be curated before it is routed.
//
//   node scripts/sync-flow-paths.mjs                # sync every article
//   node scripts/sync-flow-paths.mjs --only investor-update
//   node scripts/sync-flow-paths.mjs --released 0249-1   # include that build's update section
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import yaml from 'js-yaml';
import sharp from 'sharp';

const HOME = process.env.HOME ?? '';
const ARTICLES = process.env.FLOW_ARTICLES ?? path.join(HOME, 'orionfold-flow', 'articles');
const SHOTS = process.env.FLOW_ARTICLE_SHOTS ?? path.join(HOME, 'orionfold', 'ops', 'shared', 'flow-articles');
const CONTENT_DIR = fileURLToPath(new URL('../src/content/paths/', import.meta.url));
const ASSET_DIR = fileURLToPath(new URL('../src/assets/flow/paths/', import.meta.url));
const SHOT_WIDTH = 1600;
const WEBP_QUALITY = 88;

const PRODUCT_FIELDS = ['title', 'path', 'persona', 'drafted', 'build', 'data'];

/** Split an ARTICLE.md into its front matter object and body text. */
export function splitArticle(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('article has no front matter');
  return { front: yaml.load(m[1]) ?? {}, body: m[2] };
}

/**
 * Turn the article body into the published body.
 * - drops the H1 and returns the first italic paragraph as `dek`
 * - drops "## … (not for publication)" sections
 * - drops "## Update: build <b> (… not yet released)" unless <b> is released
 * - rewrites shots/<name>.png to the encoded asset path
 */
export function publishBody(body, { slug, released = [] }) {
  const sections = body.split(/\n(?=## )/);
  const kept = sections.filter((section) => {
    const heading = section.startsWith('## ') ? section.split('\n', 1)[0] : '';
    if (/not for publication/i.test(heading)) return false;
    const update = heading.match(/^## Update: build ([\w.-]+)/i);
    if (update && !released.includes(update[1])) return false;
    return true;
  });
  let out = kept.join('\n');
  out = out.replace(/^\s*# .+\n+/, '');
  // The opening shot becomes the page hero, so it leaves the body.
  let hero = null;
  let dek = '';
  out = out.replace(/^\*([^*\n][^\n]*?)\*\n+/, (_, text) => {
    dek = text.trim();
    return '';
  });
  out = out.replace(/^!\[([^\]]*)\]\((?:\.\.\/shared\/flow-articles\/[^/]+\/|shots\/)([\w.-]+)\.png\)\n+/, (_, alt, name) => {
    hero = { alt, name };
    return '';
  });
  const shots = hero ? [hero.name] : [];
  out = out.replace(/\]\((?:\.\.\/shared\/flow-articles\/[^/]+\/|shots\/)([\w.-]+)\.png\)/g, (_, name) => {
    shots.push(name);
    return `](../../assets/flow/paths/${slug}/${name}.webp)`;
  });
  return { body: `${out.trim()}\n`, dek, shots, hero };
}

/** Website-owned defaults for an article the site has never curated. */
function seedSiteFields(dek, heroShot) {
  return {
    order: 99,
    featured: false,
    draft: true,
    chip: '',
    summary: dek,
    stat: { value: '', label: '' },
    steps: [],
    cardShot: heroShot,
    receipt: [],
  };
}

async function encodeShot(src, dest) {
  await sharp(src)
    .resize({ width: SHOT_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, preset: 'text' })
    .toFile(dest);
}

async function syncOne(dir, { released }) {
  const slug = dir.replace(/^\d+-/, '');
  const { front, body } = splitArticle(readFileSync(path.join(ARTICLES, dir, 'ARTICLE.md'), 'utf8'));
  const published = publishBody(body, { slug, released });

  const target = path.join(CONTENT_DIR, `${slug}.md`);
  const existing = existsSync(target) ? splitArticle(readFileSync(target, 'utf8')).front : null;
  const site = existing
    ? Object.fromEntries(Object.entries(existing).filter(([k]) => !PRODUCT_FIELDS.includes(k) && k !== 'dek' && k !== 'hero' && k !== 'heroAlt' && k !== 'source'))
    : seedSiteFields(published.dek, published.shots[0]);
  const heroShot = published.shots[0];
  const front2 = {
    ...Object.fromEntries(PRODUCT_FIELDS.filter((k) => front[k] != null).map((k) => [k, front[k] instanceof Date ? front[k].toISOString().slice(0, 10) : front[k]])),
    dek: published.dek,
    hero: `../../assets/flow/paths/${slug}/${heroShot}.webp`,
    heroAlt: published.hero?.alt ?? front.title,
    source: `orionfold-flow articles/${dir}/ARTICLE.md`,
    ...site,
  };

  const shotDir = path.join(SHOTS, slug);
  const needed = new Set([...published.shots, site.cardShot].filter(Boolean));
  mkdirSync(path.join(ASSET_DIR, slug), { recursive: true });
  for (const name of needed) {
    const src = path.join(shotDir, `${name}.png`);
    if (!existsSync(src)) throw new Error(`${slug}: shot ${name}.png is not in ${shotDir}`);
    await encodeShot(src, path.join(ASSET_DIR, slug, `${name}.webp`));
  }
  // The social card frames the card shot, and Satori cannot decode webp.
  await sharp(path.join(shotDir, `${site.cardShot}.png`))
    .resize({ width: 1200 })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(ASSET_DIR, slug, 'card.jpg'));

  mkdirSync(CONTENT_DIR, { recursive: true });
  const fm = yaml.dump(front2, { lineWidth: -1, quotingType: '"' });
  writeFileSync(target, `---\n${fm}---\n\n${published.body}`);
  return { slug, shots: needed.size, draft: front2.draft === true };
}

async function main() {
  const args = process.argv.slice(2);
  const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
  const released = args.includes('--released') ? args[args.indexOf('--released') + 1].split(',') : [];
  const dirs = readdirSync(ARTICLES).filter((d) => /^\d+-/.test(d) && existsSync(path.join(ARTICLES, d, 'ARTICLE.md')));
  for (const dir of dirs) {
    if (only && !dir.endsWith(only)) continue;
    const r = await syncOne(dir, { released });
    console.log(`${r.slug}: ${r.shots} shots${r.draft ? ' (draft, not routed)' : ''}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
