// scripts/sync-flow-elements.mjs
// Publish the Flow product lane's Elements set (articles 19–23) as
// /flow/elements/, the twin of /flow/paths/.
//
// Reads READ-ONLY, like sync-flow-paths.mjs:
//   - the article text: ~/orionfold-flow/articles/<NN>-elements-<slug>/ARTICLE.md
//   - the cleared shots: ~/orionfold/ops/shared/flow-articles/elements-<slug>/
//     (cards/ and gallery/ included); FLOW_ARTICLE_SHOTS overrides the root,
//     e.g. a checkout of an unmerged ops PR
//   - the full-resolution originals in the article's shots/ folder, used only
//     after the same mask-parity check as the paths
//   - each card's drawing as the app ships it: an SVG template in
//     ~/orionfold-flow/App/Assets.xcassets/Elements/element-<card>.imageset/
//
// Writes:
//   1. src/content/elements/<slug>.md: the article's framing sections (what
//      Flow does, the answer first, the job, the numbers, …) in the Flow 3.0
//      voice the site uses for the Oct 2026 feature walks: "The press release
//      we would want to write" becomes "What Flow does", the illustrative
//      quote goes, and links between the set's articles point at their pages.
//      The opening shot leaves the page (it repeated the standfirst) and
//      becomes the social card.
//   2. src/content/element-items/<slug>/<anchor>.md: one file per element,
//      its own section of the article, which the page's element viewer shows
//      one at a time (/flow/elements/<slug>/#<anchor>).
//   3. src/assets/flow/elements/<slug>/<shot>.webp (cards/x → cards-x,
//      gallery/x → gallery-x) and card.jpg for the social card.
//   4. src/assets/flow/elements/icons/<card>.svg: the app's drawing with its
//      ink as currentColor; the tint the app gives it is read from the card.
//   5. src/data/flow-elements.json: every element by category, for the
//      landing page and the nav.
//
// Front matter has two owners, as for paths: product fields are refreshed,
// website fields (order, category, summary, release, …) are kept.
//
//   node scripts/sync-flow-elements.mjs
//   FLOW_ARTICLE_SHOTS=/tmp/ops-pr/shared/flow-articles node scripts/sync-flow-elements.mjs
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import yaml from 'js-yaml';
import sharp from 'sharp';
import GithubSlugger from 'github-slugger';
import { splitArticle, shotSource, encodeShot } from './sync-flow-paths.mjs';

const HOME = process.env.HOME ?? '';
const ARTICLES = process.env.FLOW_ARTICLES ?? path.join(HOME, 'orionfold-flow', 'articles');
const SHOTS = process.env.FLOW_ARTICLE_SHOTS ?? path.join(HOME, 'orionfold', 'ops', 'shared', 'flow-articles');
const DRAWINGS = process.env.FLOW_ELEMENT_DRAWINGS ?? path.join(HOME, 'orionfold-flow', 'App', 'Assets.xcassets', 'Elements');
const CONTENT_DIR = fileURLToPath(new URL('../src/content/elements/', import.meta.url));
const ITEMS_DIR = fileURLToPath(new URL('../src/content/element-items/', import.meta.url));
const ASSET_DIR = fileURLToPath(new URL('../src/assets/flow/elements/', import.meta.url));
const INDEX_FILE = fileURLToPath(new URL('../src/data/flow-elements.json', import.meta.url));

const PRODUCT_FIELDS = ['title', 'feature', 'persona', 'drafted', 'build', 'data'];

// The set, in reading order. `cards` is the card file prefix of a category;
// `container` is the section that lists its elements and `end` the first
// section after them; elements are headings of `depth` in between (a deeper
// or equal heading that names no card is a group, as the chart kinds have).
export const SET = [
  { dir: '19-elements-tour', slug: 'tour', label: 'Tour', cards: null },
  { dir: '20-elements-components', slug: 'components', label: 'Components', cards: 'component', container: 'Every component, its input and what it draws', end: 'From the card to the page', depth: 3 },
  { dir: '21-elements-agency', slug: 'agency', label: 'Agency', cards: 'agency', container: 'Each action, what it takes and what came back', end: 'The numbers', depth: 2 },
  { dir: '22-elements-skills', slug: 'skills', label: 'Skills', cards: 'skill', container: 'All nineteen, as the sidebar lists them', end: 'The numbers', depth: 3 },
  { dir: '23-elements-chart-kinds', slug: 'chart-kinds', label: 'Chart and diagram kinds', cards: 'kind', container: 'Every kind, what it takes and what it draws', end: 'The numbers', depth: 3 },
];

// A card whose drawing the app shares with another card.
const DRAWING_FOR = { 'component-job-form': 'component-form' };

/** The published file name for an article shot path: cards/x → cards-x. */
export const shotName = (rel) => rel.replace(/\//g, '-');

/** Rewrite one article body into the page body (before splitting out the elements). */
export function publishElementsBody(body, { slug }) {
  let out = body.replace(/^\s*# .+\n+/, '');
  let dek = '';
  out = out.replace(/^\*([^*\n][^\n]*?)\*\n+/, (_, text) => {
    dek = text.trim();
    return '';
  });
  let hero = null;
  out = out.replace(/^!\[([^\]]*)\]\(shots\/([\w./-]+)\.(?:png|jpe?g)\)\n+/, (_, alt, rel) => {
    hero = { alt, name: shotName(rel) };
    return '';
  });
  out = out.replace(/^## The press release we would want to write$/m, '## What Flow does');
  out = out.replace(/\n> "[^\n]*\n> — \*The feature['’]s promise[^\n]*\n/g, '\n');
  out = out.replace(/\]\(\.\.\/\d+-elements-([\w-]+)\/ARTICLE\.md\)/g, (_, s) => `](/flow/elements/${s}/)`);
  const shots = [];
  out = out.replace(/\]\(shots\/([\w./-]+)\.(?:png|jpe?g)\)/g, (_, rel) => {
    const name = shotName(rel);
    shots.push(name);
    return `](../../assets/flow/elements/${slug}/${name}.webp)`;
  });
  // The opening shot is published for the social card, not the page.
  if (hero) shots.unshift(hero.name);
  out = out.replace(/\n{3,}/g, '\n\n');
  return { body: `${out.trim()}\n`, dek, shots, hero };
}

/** The first sentence of a paragraph, without its Markdown emphasis. */
const firstSentence = (text) => text.replace(/\*\*/g, '').replace(/\*/g, '').match(/^(.+?[.!?])(\s|$)/)?.[1] ?? text.trim();

/** Headings outside code fences, with their offsets. */
function headingsOf(body) {
  const out = [];
  let fence = null;
  let offset = 0;
  for (const line of body.split('\n')) {
    const f = line.match(/^(`{3,}|~{3,})/);
    if (f) {
      if (!fence) fence = f[1];
      else if (line.startsWith(fence) && line.trim() === fence) fence = null;
    } else if (!fence) {
      const h = line.match(/^(#{2,3}) (.+)$/);
      if (h) out.push({ depth: h[1].length, text: h[2].trim(), start: offset, bodyStart: offset + line.length + 1 });
    }
    offset += line.length + 1;
  }
  return out;
}

const CARD_IMG = /!\[The ([^\]]+?) card in Elements\]\([^)]*?cards-([\w-]+)\.webp\)/g;
const slugify = (name) => new GithubSlugger().slug(name);

/**
 * Split a published category body into its framing (everything outside the
 * element list) and one entry per sidebar card: its name, its one line, the
 * section that covers it (a section several cards share is given to each),
 * and, for Agency, the facts its table row carries.
 */
export function splitElements(body, cfg) {
  const hs = headingsOf(body);
  const ci = hs.findIndex((h) => h.depth === 2 && h.text === cfg.container);
  const ei = hs.findIndex((h, i) => i > ci && h.depth === 2 && h.text === cfg.end);
  if (ci < 0 || ei < 0) throw new Error(`${cfg.slug}: sections "${cfg.container}" … "${cfg.end}" not found`);
  const region = hs.slice(ci + 1, ei);
  const regionEnd = hs[ei].start;
  const framing = `${body.slice(0, hs[ci].start).trimEnd()}\n\n${body.slice(regionEnd)}`;
  const sectionText = (h) => {
    const next = hs.find((x) => x.start > h.start && x.depth <= h.depth);
    return body.slice(h.bodyStart, Math.min(next ? next.start : regionEnd, regionEnd));
  };
  const intro = body.slice(hs[ci].bodyStart, region[0]?.start ?? regionEnd);

  // Agency's table: | card | what it does | what it needs | in this walk |
  const rows = {};
  for (const m of intro.matchAll(/^\| !\[The ([^\]]+?) card in Elements\][^|]*\| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)) {
    rows[m[1]] = { does: m[2].trim(), needs: m[3].trim(), walk: m[4].trim() };
  }

  const items = [];
  const seen = new Set();
  let group = null;
  const scan = (text, at, h) => {
    for (const m of text.matchAll(CARD_IMG)) {
      const [, name, card] = m;
      if (!card.startsWith(`${cfg.cards}-`) || seen.has(card)) continue;
      seen.add(card);
      items.push({ name, card, heading: h, group, at: at + m.index });
    }
  };
  scan(intro, hs[ci].bodyStart, null);
  for (const h of region) {
    const own = sectionText(h);
    if (h.depth < cfg.depth || (cfg.depth === 3 && h.depth === 2)) {
      group = h.text;
      continue;
    }
    // Only the text before a deeper heading belongs to this one.
    scan(own, h.bodyStart, h);
  }

  return {
    framing: framing.replace(/\n{3,}/g, '\n\n'),
    items: items.map((it, order) => {
      // A card listed only in the table finds the section that names it.
      const h = it.heading
        ?? region.find((x) => x.depth === cfg.depth && x.text.toLowerCase() === it.name.toLowerCase())
        ?? (/ Picture$/.test(it.name) ? region.find((x) => /picture actions/i.test(x.text)) : null);
      let text = h ? sectionText(h) : '';
      text = text.replace(/^!\[The [^\]]+? card in Elements\]\([^)]*\)\s*\n/gm, '').replace(/\n{3,}/g, '\n\n').trim();
      const shared = h ? items.filter((o) => o.heading === h).length > 1 || h.text.toLowerCase() !== it.name.toLowerCase() : false;
      const row = rows[it.name];
      let line = row?.does;
      if (!line) {
        const para = text.split(/\n\s*\n/)[0] ?? '';
        const mine = para.indexOf(`**${it.name}**`);
        line = firstSentence(mine > 0 ? para.slice(mine) : para);
        // The viewer shows the line as the element's summary; its own section
        // does not repeat it.
        if (!shared && mine < 0) {
          const lead = para.match(/^(\*\*[^*]+\*\*|[^.!?]+[.!?])\s*/);
          if (lead && firstSentence(lead[1]) === line) text = text.slice(lead[0].length).trim();
        }
      }
      const facts = row ? [{ label: 'What it needs', value: row.needs }, { label: 'In this walk', value: row.walk }] : [];
      return { name: it.name, anchor: slugify(it.name), card: it.card, line, group: it.group, order, facts, section: h?.text ?? null, shared, body: text };
    }),
  };
}

/** The app's drawing with its ink as currentColor, so the page can tint it. */
export function drawingSvg(svg) {
  return svg.replace(/"#000(?:000)?"/g, '"currentColor"').replace(/<svg /, '<svg aria-hidden="true" focusable="false" ').trim();
}

/** The tint the app gives a card: the saturated ink of its drawing. */
async function cardTint(cardFile) {
  const { height } = await sharp(cardFile).metadata();
  const { data, info } = await sharp(cardFile).extract({ left: 0, top: 0, width: 92, height }).raw().toBuffer({ resolveWithObject: true });
  const px = [];
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    if (mx > 60 && (mx - mn) / mx > 0.35) px.push([r, g, b, mx]);
  }
  if (!px.length) return '#1d1d1f';
  px.sort((a, b) => a[3] - b[3]);
  const top = px.slice(0, Math.max(1, Math.floor(px.length * 0.4)));
  return `#${[0, 1, 2].map((k) => Math.round(top.reduce((s, p) => s + p[k], 0) / top.length).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Where a gallery capture's figure sits. The Guide's gallery pages put each
 * figure in a bordered box between its own text (which the article already
 * quotes) and the next entry's, so the page shows the box alone: a border
 * line with its side border running down to a matching bottom line (or to
 * the capture's edge, for a figure the capture cut off). A skill's figure
 * without a box starts below the quoted passage. Null keeps the whole shot.
 */
export async function figureCrop(file, { minHeight = 200 } = {}) {
  const { data, info } = await sharp(file).grayscale().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const border = (v) => v >= 195 && v <= 240;
  const lines = [];
  for (let y = 4; y < H; y++) {
    let best = 0, run = 0, start = 0, bestStart = 0;
    for (let x = 0; x < W; x++) {
      if (border(data[y * W + x])) { if (!run) start = x; run += 1; if (run > best) { best = run; bestStart = start; } } else run = 0;
    }
    if (best > W * 0.6) lines.push({ y, x0: bestStart, x1: bestStart + best });
  }
  // Rounded corners put the side a few pixels left of where the top line starts.
  const side = (x, y0, y1) => {
    let best = 0;
    for (let sx = Math.max(0, x - 16); sx <= x + 2; sx++) {
      let n = 0;
      for (let y = y0 + 14; y < y1 - 14; y++) if (border(data[y * W + sx])) n += 1;
      best = Math.max(best, n / Math.max(1, y1 - y0 - 28));
    }
    return best;
  };
  const box = (t, bottom) => {
    const left = Math.max(0, t.x0 - 14);
    const right = Math.min(W, t.x1 + 14);
    return { left, top: Math.max(0, t.y - 2), width: right - left, height: Math.min(H, bottom + 3) - Math.max(0, t.y - 2) };
  };
  for (const t of lines) {
    const b = lines.find((l) => l.y > t.y + minHeight && Math.abs(l.x0 - t.x0) < 6 && Math.abs(l.x1 - t.x1) < 6 && side(t.x0, t.y, l.y) > 0.92);
    if (b) return box(t, b.y);
  }
  for (const t of lines) if (t.y < H - minHeight && side(t.x0, t.y, H) > 0.92) return box(t, H - 3);
  return null;
}

/** A skill capture without a box: everything below the quoted passage's bar. */
async function belowQuote(file) {
  const { data, info } = await sharp(file).grayscale().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  for (let x = 4; x < 160; x++) {
    let y = 30;
    while (y < H && data[y * W + x] >= 150 && data[y * W + x] <= 225 && data[y * W + x + 3] > 240) y += 1;
    if (y > 60) return { left: 0, top: y + 24, width: W, height: H - y - 24 };
  }
  return null;
}

/** Website-owned defaults for an article the site has never curated. */
const seedSiteFields = (entry, dek, heroShot, order) => ({
  order,
  category: entry.label,
  summary: dek,
  cardShot: heroShot,
  release: '3.0',
  draft: false,
});

async function syncOne(entry, order) {
  const { slug, dir } = entry;
  const { front, body } = splitArticle(readFileSync(path.join(ARTICLES, dir, 'ARTICLE.md'), 'utf8'));
  const published = publishElementsBody(body, { slug });

  const target = path.join(CONTENT_DIR, `${slug}.md`);
  const existing = existsSync(target) ? splitArticle(readFileSync(target, 'utf8')).front : null;
  const site = existing
    ? Object.fromEntries(Object.entries(existing).filter(([k]) => !PRODUCT_FIELDS.includes(k) && !['dek', 'hero', 'heroAlt', 'source'].includes(k)))
    : seedSiteFields(entry, published.dek, published.shots[0], order);
  const product = Object.fromEntries(PRODUCT_FIELDS.filter((k) => front[k] != null).map((k) => [k, front[k] instanceof Date ? front[k].toISOString().slice(0, 10) : front[k]]));
  // Written as Flow 3.0 (operator 2026-10-26): the build line keeps the
  // review build it was walked on, without the "not in a release" aside.
  product.build = String(product.build).replace(/; not in a release yet, [\d.]+ is the latest/, '');
  const front2 = {
    ...product,
    dek: published.dek,
    hero: `../../assets/flow/elements/${slug}/${published.shots[0]}.webp`,
    heroAlt: published.hero?.alt ?? front.title,
    source: `orionfold-flow articles/${dir}/ARTICLE.md`,
    ...site,
  };
  if (existing?.titleLocked) front2.title = existing.title;

  const shotDir = path.join(SHOTS, `elements-${slug}`);
  rmSync(path.join(ASSET_DIR, slug), { recursive: true, force: true });
  mkdirSync(path.join(ASSET_DIR, slug), { recursive: true });
  const lowRes = [];
  const uncropped = [];
  // Sidebar-card captures are not published: the page draws the app's own
  // vector drawing instead.
  const pageShots = new Set(published.shots.filter((n) => !n.startsWith('cards-')));
  for (const name of pageShots) {
    const rel = name.replace(/^(cards|gallery)-/, '$1/');
    const src = path.join(shotDir, `${rel}.png`);
    if (!existsSync(src)) throw new Error(`${slug}: shot ${rel}.png is not in ${shotDir}`);
    const best = await shotSource(src, path.join(ARTICLES, dir, 'shots', `${rel}.png`));
    if (best === src) lowRes.push(name);
    const dest = path.join(ASSET_DIR, slug, `${name}.webp`);
    if (name.startsWith('gallery-')) {
      // Crop on the cleared ops copy, then scale the box to the source used.
      let crop = await figureCrop(src, { minHeight: slug === 'skills' ? 300 : 120 });
      if (slug === 'skills') {
        // A skill that draws a table or a form above its boxed figure keeps both.
        const quote = await belowQuote(src);
        if (quote && (!crop || crop.top - quote.top > 260)) crop = crop ? { ...quote, height: crop.top + crop.height - quote.top } : quote;
      }
      if (crop) {
        const [o, b] = await Promise.all([sharp(src).metadata(), sharp(best).metadata()]);
        const k = b.width / o.width;
        const scaled = { left: Math.round(crop.left * k), top: Math.round(crop.top * k), width: Math.min(b.width - Math.round(crop.left * k), Math.round(crop.width * k)), height: Math.min(b.height - Math.round(crop.top * k), Math.round(crop.height * k)) };
        await sharp(best).extract(scaled).webp({ quality: 90, preset: 'text' }).toFile(dest);
        continue;
      }
      uncropped.push(name);
    }
    await encodeShot(best, dest);
  }
  await sharp(path.join(shotDir, `${front2.cardShot.replace(/^(cards|gallery)-/, '$1/')}.png`))
    .resize({ width: 1200 })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(ASSET_DIR, slug, 'card.jpg'));

  let items = [];
  let pageBody = published.body;
  if (entry.cards) {
    const split = splitElements(published.body, entry);
    pageBody = split.framing;
    items = split.items;
    const cardCount = readdirSync(path.join(shotDir, 'cards')).filter((f) => f.endsWith('.png')).length;
    if (items.length !== cardCount) throw new Error(`${slug}: found ${items.length} elements but ops holds ${cardCount} cards`);
    mkdirSync(path.join(ASSET_DIR, 'icons'), { recursive: true });
    rmSync(path.join(ITEMS_DIR, slug), { recursive: true, force: true });
    mkdirSync(path.join(ITEMS_DIR, slug), { recursive: true });
    for (const item of items) {
      // The opening shot left the page; an element that pointed at it gets it back.
      if (published.hero && item.body.includes('(first shot above)')) {
        item.body = `${item.body.replace(/ ?\(first shot above\)/, '')}\n\n![${published.hero.alt}](../../assets/flow/elements/${slug}/${published.hero.name}.webp)`;
      }
      const drawing = DRAWING_FOR[item.card] ?? item.card;
      const svgFile = path.join(DRAWINGS, `element-${drawing}.imageset`, `element-${drawing}.svg`);
      if (!existsSync(svgFile)) throw new Error(`${slug}: no app drawing for ${item.card} (${svgFile})`);
      writeFileSync(path.join(ASSET_DIR, 'icons', `${item.card}.svg`), `${drawingSvg(readFileSync(svgFile, 'utf8'))}\n`);
      item.tint = await cardTint(path.join(shotDir, 'cards', `${item.card}.png`));
      const { body: itemBody, ...meta } = item;
      writeFileSync(path.join(ITEMS_DIR, slug, `${item.anchor}.md`), `---\n${yaml.dump({ category: slug, ...meta }, { lineWidth: -1, quotingType: '"' })}---\n\n${itemBody}\n`);
    }
  }
  const missing = [...pageBody.matchAll(/\]\((\.\.\/\.\.\/assets\/flow\/elements\/[^)]+)\)/g)].map((m) => m[1]).filter((p) => !existsSync(path.join(CONTENT_DIR, p)));
  for (const item of items) for (const m of item.body.matchAll(/\]\(\.\.\/\.\.\/assets\/flow\/elements\/([^)]+)\)/g)) if (!existsSync(path.join(ASSET_DIR, m[1]))) missing.push(m[1]);
  if (missing.length) throw new Error(`${slug}: missing assets ${missing.join(', ')}`);

  mkdirSync(CONTENT_DIR, { recursive: true });
  writeFileSync(target, `---\n${yaml.dump(front2, { lineWidth: -1, quotingType: '"' })}---\n\n${pageBody.trim()}\n`);
  return { slug, shots: pageShots.size, lowRes, uncropped, items };
}

async function main() {
  // Element item files sit two folders below src/content/element-items, so
  // item bodies reach the shots one level further up.
  const categories = [];
  for (const [i, entry] of SET.entries()) {
    const r = await syncOne(entry, i);
    for (const item of r.items) {
      const file = path.join(ITEMS_DIR, r.slug, `${item.anchor}.md`);
      writeFileSync(file, readFileSync(file, 'utf8').replaceAll('](../../assets/', '](../../../assets/'));
    }
    console.log(`${r.slug}: ${r.shots} shots${r.items.length ? `, ${r.items.length} elements` : ''}${r.lowRes.length ? `; ops copy used for ${r.lowRes.length}` : ''}${r.uncropped.length ? `; whole capture kept for ${r.uncropped.join(', ')}` : ''}`);
    if (r.items.length) {
      categories.push({
        slug: entry.slug,
        label: entry.label,
        items: r.items.map(({ name, anchor, card, line, group, tint }) => ({ name, anchor, card, line, group, tint })),
      });
    }
  }
  for (const f of readdirSync(path.join(ASSET_DIR, 'icons'))) if (f.endsWith('.png')) rmSync(path.join(ASSET_DIR, 'icons', f));
  writeFileSync(INDEX_FILE, `${JSON.stringify({ categories }, null, 2)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
