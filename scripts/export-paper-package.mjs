#!/usr/bin/env node
// Exports the Paper design system as a versioned package for the Flow app
// (D1: the website owns Paper; D8, operator 2026-10-30: the website and app
// redesigns run in parallel, and the app's first Paper goal needs these
// assets). The package is generated, never hand-edited: Fold SVGs and their
// colors from src/lib/paper/folds.ts, the folded star from star.ts, tokens
// parsed from src/styles/paper/tokens.css, and the trimmed Fraunces.
//
//   node scripts/export-paper-package.mjs            → output/paper-package/<version>/
//   FONTTOOLS_PYTHON=/path/to/python node scripts/…  → also writes a .ttf
//
// output/ is git-ignored; the product lane copies a version into its own repo.
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const VERSION = '0.3.3';
const root = new URL('../', import.meta.url).pathname;
const out = path.join(root, 'output/paper-package', VERSION);
const rel = (p) => path.join(root, p);
const { FOLDS, foldSvg, foldShapes, FOLD_BOUNDS } = await import(rel('src/lib/paper/folds.ts'));
const { foldedStarSvg } = await import(rel('src/lib/paper/star.ts'));
const { NIGHT, NIGHT_TEXT_PAIRS, NIGHT_DETAIL, contrast, nightFold, nightFoldShapes, nightColors } = await import(rel('src/lib/paper/night.ts'));
const { PERSONAL_FOLDS, COLORWAYS, colorwayById, personalFoldSvg } = await import(rel('src/lib/paper/personal-folds.ts'));

rmSync(out, { recursive: true, force: true });
for (const d of ['folds', 'personal', 'marks', 'fonts', 'tokens']) mkdirSync(path.join(out, d), { recursive: true });
const standalone = (svg) => svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');

// Fitted variants (0.3.1, product-lane ask 2026-10-31): a square viewBox around
// each drawing, without the ground shadow, so a Fold fills a circle avatar edge
// to edge. Extents are measured in Chromium (getBBox), rounded outward, never
// typed by hand. The website's FOLD_BOUNDS must agree within 1 unit or the
// export stops. Night variants reuse the light box: night only removes detail.
const { chromium } = await import('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const measure = (shapes) => page.evaluate((inner) => {
  document.body.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 214" width="200" height="214"><g>${inner}</g></svg>`;
  const b = document.querySelector('g').getBBox();
  const x = Math.floor(b.x), y = Math.floor(b.y);
  return [x, y, Math.ceil(b.x + b.width) - x, Math.ceil(b.y + b.height) - y];
}, shapes);
const fitBox = ([x, y, w, h]) => { const side = Math.max(w, h); return `${x - (side - w) / 2} ${y - (side - h) / 2} ${side} ${side}`; };
const fitSvg = (viewBox, label, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${label}">${inner}</svg>\n`;
const foldBox = {};
for (const f of FOLDS) {
  const m = await measure(foldShapes(f));
  const site = FOLD_BOUNDS[f.id];
  if (!site || m.some((v, i) => Math.abs(v - site[i]) > 1)) throw new Error(`FOLD_BOUNDS.${f.id} ${JSON.stringify(site)} drifted from the art ${JSON.stringify(m)}; update src/lib/paper/folds.ts`);
  foldBox[f.id] = fitBox(m);
}
const personalBox = {};
for (const f of PERSONAL_FOLDS) { const cw = colorwayById[f.defaultColorway]; personalBox[f.id] = fitBox(await measure(f.draw(cw.a, cw.b, cw.c))); }
await browser.close();

// Folds: one SVG each (with and without the ground shadow), plus a manifest.
const folds = FOLDS.map((f) => {
  writeFileSync(path.join(out, 'folds', `${f.id}.svg`), standalone(foldSvg(f, { label: `${f.name} the ${f.kind}` })) + '\n');
  writeFileSync(path.join(out, 'folds', `${f.id}-no-shadow.svg`), standalone(foldSvg(f, { label: `${f.name} the ${f.kind}`, shadow: false })) + '\n');
  writeFileSync(path.join(out, 'folds', `${f.id}-night.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 214" role="img" aria-label="${f.name} the ${f.kind}">${nightFoldShapes(f)}</svg>\n`);
  writeFileSync(path.join(out, 'folds', `${f.id}-fit.svg`), fitSvg(foldBox[f.id], `${f.name} the ${f.kind}`, foldShapes(f)));
  writeFileSync(path.join(out, 'folds', `${f.id}-fit-night.svg`), fitSvg(foldBox[f.id], `${f.name} the ${f.kind}`, nightFoldShapes(f)));
  return { id: f.id, name: f.name, kind: f.kind, flowPlaybook: f.domain, flowPlaybookSlug: f.domainSlug, colors: { a: f.a, b: f.b, c: f.c, ink: f.ink }, nightColors: nightFold(f), files: { svg: `folds/${f.id}.svg`, svgNoShadow: `folds/${f.id}-no-shadow.svg`, night: `folds/${f.id}-night.svg`, fit: `folds/${f.id}-fit.svg`, fitNight: `folds/${f.id}-fit-night.svg` }, viewBox: '0 0 200 214', fitViewBox: foldBox[f.id] };
});
writeFileSync(path.join(out, 'marks', 'orionfold-star.svg'), foldedStarSvg('Orionfold') + '\n');

// Personal Folds (website and product lanes, operator delegation 18:51): a
// default colorway, no name until the person gives one, a night variant each.
const personal = PERSONAL_FOLDS.map((f) => {
  const label = `A paper ${f.shape}`;
  writeFileSync(path.join(out, 'personal', `${f.id}.svg`), personalFoldSvg(f, { label }) + '\n');
  writeFileSync(path.join(out, 'personal', `${f.id}-no-shadow.svg`), personalFoldSvg(f, { label, shadow: false }) + '\n');
  const n = nightColors(colorwayById[f.defaultColorway]);
  writeFileSync(path.join(out, 'personal', `${f.id}-night.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 214" role="img" aria-label="${label}">${f.draw(n.a, n.b, n.c, NIGHT_DETAIL)}</svg>\n`);
  const dc = colorwayById[f.defaultColorway];
  writeFileSync(path.join(out, 'personal', `${f.id}-fit.svg`), fitSvg(personalBox[f.id], label, f.draw(dc.a, dc.b, dc.c)));
  writeFileSync(path.join(out, 'personal', `${f.id}-fit-night.svg`), fitSvg(personalBox[f.id], label, f.draw(n.a, n.b, n.c, NIGHT_DETAIL)));
  // Every colorway as its own file, light (no shadow) and night, so the app swaps files to recolor.
  mkdirSync(path.join(out, 'personal', f.id), { recursive: true });
  const byColorway = Object.fromEntries(COLORWAYS.map((cw) => {
    const nc = nightColors(cw);
    writeFileSync(path.join(out, 'personal', f.id, `${cw.id}.svg`), personalFoldSvg(f, { label, colorway: cw, shadow: false }) + '\n');
    writeFileSync(path.join(out, 'personal', f.id, `${cw.id}-night.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 214" role="img" aria-label="${label}">${f.draw(nc.a, nc.b, nc.c, NIGHT_DETAIL)}</svg>\n`);
    writeFileSync(path.join(out, 'personal', f.id, `${cw.id}-fit.svg`), fitSvg(personalBox[f.id], label, f.draw(cw.a, cw.b, cw.c)));
    writeFileSync(path.join(out, 'personal', f.id, `${cw.id}-fit-night.svg`), fitSvg(personalBox[f.id], label, f.draw(nc.a, nc.b, nc.c, NIGHT_DETAIL)));
    return [cw.id, { svg: `personal/${f.id}/${cw.id}.svg`, night: `personal/${f.id}/${cw.id}-night.svg`, fit: `personal/${f.id}/${cw.id}-fit.svg`, fitNight: `personal/${f.id}/${cw.id}-fit-night.svg` }];
  }));
  return { id: f.id, defaultName: '', shape: f.shape, line: f.line, behaviour: f.behaviour, defaultColorway: f.defaultColorway, colorways: COLORWAYS.map((c) => c.id), files: { svg: `personal/${f.id}.svg`, svgNoShadow: `personal/${f.id}-no-shadow.svg`, night: `personal/${f.id}-night.svg`, fit: `personal/${f.id}-fit.svg`, fitNight: `personal/${f.id}-fit-night.svg`, byColorway }, viewBox: '0 0 200 214', fitViewBox: personalBox[f.id] };
});
const colorways = COLORWAYS.map((c) => ({ ...c, night: nightColors(c) }));

// Night: every promised text pair must clear AA, or the export stops.
const weak = NIGHT_TEXT_PAIRS.map(([fg, bg]) => [fg, bg, contrast(NIGHT[fg], NIGHT[bg])]).filter(([, , r]) => r < 4.5);
if (weak.length) throw new Error(`night text pairs below AA: ${JSON.stringify(weak)}`);

// Tokens: every --pp-* custom property in the .paper block, grouped by kind.
const css = readFileSync(rel('src/styles/paper/tokens.css'), 'utf8');
const vars = Object.fromEntries([...css.matchAll(/--pp-([a-z0-9-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]));
const group = (test) => Object.fromEntries(Object.entries(vars).filter(([k]) => test(k)));
// Long-form frame (website R8, operator 2026-10-31): set per breakpoint in
// components.css, not in tokens.css, so read each @media block's values.
const components = readFileSync(rel('src/styles/paper/components.css'), 'utf8');
const longform = {};
for (const [, min, body] of components.matchAll(/@media \(min-width: (\d+)px\) \{([\s\S]*?)\n\}/g)) {
  const page = body.match(/\.paper \.pp-page \{([^}]*)\}/);
  if (!page) continue;
  const v = Object.fromEntries([...page[1].matchAll(/--pp-(wide|measure):\s*([^;]+);/g)].map(([, k, x]) => [k, x.trim()]));
  if (Object.keys(v).length) longform[`min${min}`] = v;
}
if (!longform.min1180?.wide || !longform.min1180?.measure) throw new Error('long-form frame values not found in components.css');
const tokens = {
  version: VERSION,
  color: group((k) => !/^(serif|sans|mono|r-\d|shadow|ease|fold-|lg-)/.test(k)),
  // Liquid Glass, regular variant (nav pills and the mobile menu button).
  liquidGlass: group((k) => /^lg-/.test(k)),
  font: group((k) => /^(serif|sans|mono)$/.test(k)),
  radius: group((k) => /^r-\d$/.test(k)),
  shadow: group((k) => /^shadow/.test(k)),
  motion: group((k) => /^ease/.test(k)),
  foldDefaults: group((k) => /^fold-/.test(k)),
  // Below 1180px long-form keeps a 620px column; from 1180px the article takes
  // the landing frame (wide) and text keeps a reading measure.
  layout: { longform: { below1180: { column: '620px' }, ...longform } },
  // The app's dark appearance (Paper owns it, operator 2026-10-30): same keys as color.
  night: NIGHT,
  nightTextPairs: NIGHT_TEXT_PAIRS.map(([fg, bg]) => ({ fg, bg, ratio: Number(contrast(NIGHT[fg], NIGHT[bg]).toFixed(2)) })),
};
writeFileSync(path.join(out, 'tokens', 'paper-tokens.json'), JSON.stringify(tokens, null, 2) + '\n');
copyFileSync(rel('src/styles/paper/tokens.css'), path.join(out, 'tokens', 'paper-tokens.css'));

// Fonts: the trimmed Fraunces (woff2) and its licence; a .ttf when fontTools is at hand.
copyFileSync(rel('public/fonts/fraunces-paper-latin.woff2'), path.join(out, 'fonts', 'fraunces-paper-latin.woff2'));
copyFileSync(rel('public/fonts/Fraunces-OFL.txt'), path.join(out, 'fonts', 'Fraunces-OFL.txt'));
let ttf = false;
const py = process.env.FONTTOOLS_PYTHON;
if (py && existsSync(py)) {
  execFileSync(py, ['-I', '-c', `from fontTools.ttLib import TTFont\nf=TTFont(${JSON.stringify(path.join(out, 'fonts', 'fraunces-paper-latin.woff2'))})\nf.flavor=None\nf.save(${JSON.stringify(path.join(out, 'fonts', 'fraunces-paper-latin.ttf'))})`]);
  ttf = true;
}

let commit = 'unknown';
try { commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root }).toString().trim(); } catch {}
const dirty = (() => { try { return execFileSync('git', ['status', '--porcelain', 'src/lib/paper', 'src/styles/paper', 'public/fonts'], { cwd: root }).toString().trim() !== ''; } catch { return false; } })();
writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({
  name: 'orionfold-paper', version: VERSION, stage: 'final design system (website R8)', source: { repo: 'orionfold/website', commit, uncommittedChanges: dirty },
  folds, personal, colorways, marks: { orionfoldStar: 'marks/orionfold-star.svg' },
  tokens: { json: 'tokens/paper-tokens.json', css: 'tokens/paper-tokens.css' },
  fonts: { fraunces: { woff2: 'fonts/fraunces-paper-latin.woff2', ttf: ttf ? 'fonts/fraunces-paper-latin.ttf' : null, licence: 'fonts/Fraunces-OFL.txt', axes: { wght: [300, 500], opsz: [9, 144] }, pinned: { SOFT: 100, WONK: 1 } } },
}, null, 2) + '\n');

writeFileSync(path.join(out, 'README.md'), `# Orionfold Paper ${VERSION}

The Paper design system, exported by the website (it owns Paper, decision D1) for the Flow app's Paper goals. Generated by \`scripts/export-paper-package.mjs\` from website commit \`${commit}\`${dirty ? ' plus uncommitted Paper changes' : ''}. Copy a version into the app; never edit it in place, ask the website lane for a new version.

## What is here
- \`folds/\`: the eight Flow Playbook Folds as standalone SVGs (viewBox 0 0 200 214): with and without the ground shadow, and a night variant (colors lifted to 3:1 on the night paper, Tally's legs and Orri's trail removed). \`<id>-fit.svg\` and \`<id>-fit-night.svg\` crop a square around the drawing (no shadow) so the Fold fills a circle avatar edge to edge; \`fitViewBox\` in the manifest gives the box. Colors and night colors per Fold are in \`manifest.json\`.
- \`personal/\`: the eight personal Folds a person folds in the app (elephant, paper boat, bear, butterfly, lotus, penguin, cat, hummingbird), drawn for 16 pt, each in its default colorway (with and without shadow, and night), plus \`personal/<id>/<colorway>.svg\` and \`-night.svg\` for every colorway, so recoloring is a file swap. Every one of those also has \`-fit\` and \`-fit-night\` files for circle avatars. Each has a temperament line, never a capability, and \`behaviour\`: two or three short rules for how that Fold works (the first one shows on the Fold step's sheet). \`colorways\` in the manifest lists the eight colorways (named by color, taken from the cast's palettes) with their night values.
- \`marks/orionfold-star.svg\`: the Orionfold star, folded in the Folds' polygon style.
- \`tokens/\`: every Paper token as JSON (grouped: color, liquidGlass, font, radius, shadow, motion, foldDefaults, layout) and the source CSS, plus \`night\`: the app's dark appearance, same keys as \`color\`, with every promised text pair and its contrast ratio (all at least 4.5:1; the export stops if one drops).
- \`fonts/\`: Fraunces cut for Paper (Latin, weight 300 to 500, optical size kept, SOFT pinned 100, WONK pinned 1), woff2${ttf ? ' and ttf' : ''}, under the SIL Open Font License (no reserved font name).

## Rules that travel with it
- In a circle, use the \`-fit\` file at 100% of the circle with no padding, clip the circle (overflow hidden), and fill it with the Fold's color (night color in the dark appearance). The Fold's longer side touches the edge; the shorter side is centred.
- The eight Folds are the characters of the Flow Playbooks (each maps to one in \`manifest.json\`). A person's own Fold is folded from a blank sheet and uses shapes outside these eight (cross-lane, 2026-10-30).
- The Flow feature is a Playbook (Flow Playbook in full). A Blueprint is a free starter you use to create your own Playbook.
- The faces on the website are AI-generated models and are not part of this package.
- Text colors meet WCAG AA on paper and white (ink-3 is #666d69 since 2026-10-30).
- The design system is final (operator 2026-10-31). Changes after this come as new versions, never as edits in place.
- Liquid Glass (regular variant) for floating controls: fill \`var(--pp-lg-sheen), var(--pp-lg-tint)\`, \`backdrop-filter: var(--pp-lg-filter)\`, a 1px \`--pp-lg-rim\` border all round and \`--pp-lg-shadow\`. Once the page scrolls the tint becomes \`--pp-lg-tint-scrolled\` and a band in \`--pp-lg-edge\` blurs what passes under the bar. The highlight is an even sheen and rim, never a brighter top edge (Orionfold rule: no single-edge accents).
- Long-form reading: below 1180px the article is one 620px column. From 1180px the head, figures and body take the wide frame (\`layout.longform.min1180.wide\`), text keeps the reading measure (760px, 800px from 1600px), and pictures, tables and code run the full body width.

## Versions
- 0.1.0 (2026-10-30): first early export, before website R8.
- 0.1.1 (2026-10-30): same files, cut from a committed source (product lane ask).
- 0.2.0 (2026-10-30): night (dark appearance) tokens and Fold variants; personal Folds with colorways.
- 0.2.1 (2026-10-30): night beak and butterfly body in light ink; a rounder bear, now coral by default (penguin ochre), apart from the cat at 16 pt.
- 0.3.0 (2026-10-31): the final design system. Liquid Glass tokens in their own group, the long-form frame in \`layout\`, and their rules above.\n- 0.3.1 (2026-10-31): fitted Fold SVGs (\`-fit\`, \`-fit-night\`) for circle avatars, for the Playbook Folds and every personal Fold colorway; \`fitViewBox\` per Fold in the manifest. No art or token changes.\n- 0.3.2 (2026-10-31): \`behaviour\` for each personal Fold (character = behaviour, product lane ask). No art or token changes.\n- 0.3.3 (2026-10-31): operator review of \`behaviour\`; hummingbird gets to the point instead of promising speed, butterfly stays inside this document. New token \`--pp-teal-ink\` (#1f7176, night #5cc0bf) for small teal text; brand teal is unchanged.
`);

console.log(`Paper ${VERSION} → ${path.relative(root, out)} (${folds.length} Folds, ${Object.keys(vars).length} tokens${ttf ? ', ttf' : ''})`);
