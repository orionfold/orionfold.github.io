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

const VERSION = '0.4.2';
const root = new URL('../', import.meta.url).pathname;
const out = path.join(root, 'output/paper-package', VERSION);
const rel = (p) => path.join(root, p);
const { FOLDS, foldSvg, foldShapes, FOLD_BOUNDS } = await import(rel('src/lib/paper/folds.ts'));
const { foldedStarSvg } = await import(rel('src/lib/paper/star.ts'));
const { NIGHT, NIGHT_TEXT_PAIRS, NIGHT_GRAPHIC_PAIRS, NIGHT_DETAIL, CONTRAST, NIGHT_CONTRAST, contrast, nightFold, nightFoldShapes, nightColors } = await import(rel('src/lib/paper/night.ts'));
const { RAMP, NIGHT_RAMP, VIZ, NIGHT_VIZ, HUES, STEPS, DATA, FOLD_HUE } = await import(rel('src/lib/paper/ramps.ts'));
const { FOLD_STATE_MACHINE } = await import(rel('src/lib/paper/state-machine.ts'));
const { liveFoldSvg, FOLD_FACES } = await import(rel('src/lib/paper/fold-motion.ts'));
const { PERSONAL_FOLDS, COLORWAYS, colorwayById, personalFoldSvg } = await import(rel('src/lib/paper/personal-folds.ts'));
const { foldGlyph } = await import(rel('scripts/lib/fold-glyph.mjs'));

rmSync(out, { recursive: true, force: true });
for (const d of ['folds', 'folds/live', 'personal', 'glyphs', 'marks', 'fonts', 'tokens', 'agents']) mkdirSync(path.join(out, d), { recursive: true });
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
  // One-colour template glyph (0.3.4, product lane ask 2026-10-31 21:01).
  writeFileSync(path.join(out, 'glyphs', `${f.id}.svg`), foldGlyph(foldShapes(f), { label: `${f.name} the ${f.kind}` }).svg);
  return { id: f.id, name: f.name, kind: f.kind, flowPlaybook: f.domain, flowPlaybookSlug: f.domainSlug, colors: { a: f.a, b: f.b, c: f.c, ink: f.ink }, nightColors: nightFold(f), files: { svg: `folds/${f.id}.svg`, svgNoShadow: `folds/${f.id}-no-shadow.svg`, night: `folds/${f.id}-night.svg`, fit: `folds/${f.id}-fit.svg`, fitNight: `folds/${f.id}-fit-night.svg`, glyph: `glyphs/${f.id}.svg` }, viewBox: '0 0 200 214', fitViewBox: foldBox[f.id] };
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
  // The glyph is the shape alone, so one file serves every colorway.
  writeFileSync(path.join(out, 'glyphs', `${f.id}.svg`), foldGlyph(f.draw(dc.a, dc.b, dc.c), { label }).svg);
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
  return { id: f.id, defaultName: '', shape: f.shape, line: f.line, behaviour: f.behaviour, defaultColorway: f.defaultColorway, colorways: COLORWAYS.map((c) => c.id), files: { svg: `personal/${f.id}.svg`, svgNoShadow: `personal/${f.id}-no-shadow.svg`, night: `personal/${f.id}-night.svg`, fit: `personal/${f.id}-fit.svg`, fitNight: `personal/${f.id}-fit-night.svg`, glyph: `glyphs/${f.id}.svg`, byColorway }, viewBox: '0 0 200 214', fitViewBox: personalBox[f.id] };
});
const colorways = COLORWAYS.map((c) => ({ ...c, night: nightColors(c) }));

// Night: every promised text pair must clear AA, or the export stops.
const weak = NIGHT_TEXT_PAIRS.map(([fg, bg]) => [fg, bg, contrast(NIGHT[fg], NIGHT[bg])]).filter(([, , r]) => r < 4.5);
if (weak.length) throw new Error(`night text pairs below AA: ${JSON.stringify(weak)}`);
// 0.4.0 ramps: deep clears 3:1 on its ground, ink 4.5:1 on paper-2, light and night, or the export stops.
const paperL = '#fbfaf6', paper2L = '#f4f1e8';
for (const h of HUES) {
  if (contrast(RAMP[h].deep, paperL) < 3 || contrast(RAMP[h].ink, paper2L) < 4.5) throw new Error(`light ramp ${h} below its promise`);
  if (contrast(NIGHT_RAMP[h].deep, NIGHT.paper) < 3 || contrast(NIGHT_RAMP[h].ink, NIGHT['paper-2']) < 4.5) throw new Error(`night ramp ${h} below its promise`);
}
const weakG = NIGHT_GRAPHIC_PAIRS.map(([fg, bg]) => [fg, bg, contrast(NIGHT[fg], NIGHT[bg])]).filter(([, , r]) => r < 3);
if (weakG.length) throw new Error(`night graphics pairs below 3:1: ${JSON.stringify(weakG)}`);

// Tokens: every --pp-* custom property in the .paper block, grouped by kind.
const css = readFileSync(rel('src/styles/paper/tokens.css'), 'utf8');
// Only the main light block: the later `@media (prefers-contrast: more)`, `.pp-ic` and
// coarse-pointer blocks re-declare a few variables and must not leak into the defaults
// (0.4.1, product lane 2026-11-03 13:07: 0.4.0 exported the Increase Contrast teal, ink-3
// and line and the 40px touch height as the light defaults).
const mainStart = css.indexOf('.paper, :root:has(> body.paper) {');
const mainBlock = css.slice(mainStart, css.indexOf('\n}\n', mainStart));
const vars = Object.fromEntries([...mainBlock.matchAll(/--pp-([a-z0-9-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]));
for (const k of ['teal', 'ink-3', 'line', 'input-h']) if (!vars[k]) throw new Error(`token ${k} not found in the main block`);
if (vars.teal !== '#247b80' || vars['input-h'] !== '36px') throw new Error('the main block parse picked up an override');
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
// The 0.3.x colour keys that happen to read like ramp steps stay in `color` (Flow reads them there).
const LEGACY = new Set(['teal', 'teal-ink', 'teal-pale', 'gold', 'gold-pale', 'red', 'red-deep']);
const isRamp = (k) => !LEGACY.has(k) && new RegExp(`^(${HUES.join('|')})-(${STEPS.join('|')})$`).test(k);
const tokens = {
  version: VERSION,
  color: group((k) => !/^(serif|sans|mono|r-\d|shadow|ease|fold-|lg-|t-|dur-|press|enter|input-|ring|viz-|data-|fig-)/.test(k) && !isRamp(k)),
  // 0.4.0: tonal ramps per hue (pale, soft, base, deep, ink), the data ramp with its marker shapes, the viz greys, the figure contract
  ramps: RAMP,
  data: DATA.map(([token, shape], i) => ({ token: `data-${i + 1}`, from: token, value: token === 'ink-2' ? vars['ink-2'] : RAMP[token.split('-')[0]][token.split('-')[1]], shape })),
  viz: VIZ,
  figure: group((k) => /^fig-/.test(k)),
  // 0.4.0: a fourth value per colour for Increase Contrast (HIG Color), light and night
  contrast: { light: CONTRAST, night: NIGHT_CONTRAST },
  // 0.4.0: type roles (font shorthand: weight size/line-height family)
  type: group((k) => /^t-/.test(k)),
  // 0.4.0: form control tokens
  control: group((k) => /^(input-|ring)/.test(k)),
  // Liquid Glass, regular variant (nav pills and the mobile menu button).
  liquidGlass: group((k) => /^lg-/.test(k)),
  font: group((k) => /^(serif|sans|mono)$/.test(k)),
  radius: group((k) => /^r-\d$/.test(k)),
  shadow: group((k) => /^shadow/.test(k)),
  // 0.4.0: durations, curves, press and enter scales; springs (duration, bounce) are for the app, after SwiftUI's model
  motion: { ...group((k) => /^(ease|dur-|press|enter)/.test(k)), springs: FOLD_STATE_MACHINE.springs, rules: ['under 300 ms, ease-out, press 0.97, enter from 0.93 with a fade', 'keyboard-initiated actions never animate', 'Reduce Motion means opacity only', 'delight by frequency: daily actions subtle, rare moments may bounce'] },
  foldDefaults: group((k) => /^fold-/.test(k)),
  // Below 1180px long-form keeps a 620px column; from 1180px the article takes
  // the landing frame (wide) and text keeps a reading measure.
  layout: { longform: { below1180: { column: '620px' }, ...longform } },
  // The app's dark appearance (Paper owns it, operator 2026-10-30): same keys as color.
  night: { ...NIGHT, ...NIGHT_VIZ },
  nightRamps: NIGHT_RAMP,
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
  // Byte-stable across exports of the same source (0.4.1, product lane 13:13: Flow's C8040 proves
  // "verbatim" by bytes): fontTools stamps head.modified from SOURCE_DATE_EPOCH when it is set.
  execFileSync(py, ['-I', '-c', `from fontTools.ttLib import TTFont\nf=TTFont(${JSON.stringify(path.join(out, 'fonts', 'fraunces-paper-latin.woff2'))})\nf.flavor=None\nf.save(${JSON.stringify(path.join(out, 'fonts', 'fraunces-paper-latin.ttf'))})`], { env: { ...process.env, SOURCE_DATE_EPOCH: '1761868800' } });
  ttf = true;
}

// 0.4.0 (operator 2026-11-03 "Rive and type roles now"): the Fold state-machine contract and Ember's reference.
writeFileSync(path.join(out, 'folds', 'state-machine.json'), JSON.stringify({ ...FOLD_STATE_MACHINE, faces: FOLD_FACES }, null, 2) + '\n');
// The web build of the state machine for every Fold: layered SVG (body, eyes, mouth, blush), the CSS and the driver.
for (const f of FOLDS) writeFileSync(path.join(out, 'folds', 'live', `${f.id}.svg`), standalone(liveFoldSvg(f, { label: `${f.name} the ${f.kind}` })) + '\n');
const liveCss = components.slice(components.indexOf('/* ----- 0.4.0 a Fold that moves'));
writeFileSync(path.join(out, 'folds', 'live', 'fold-live.css'), `/* Paper ${VERSION}: a Fold that moves. Needs the Paper tokens (tokens/paper-tokens.css) and a .paper ancestor. */\n` + liveCss);
copyFileSync(rel('src/lib/paper/fold-live.js'), path.join(out, 'folds', 'live', 'fold-live.js'));

// 0.4.0 agent-facing deliverables: a closed component catalog, a plain-English rules fragment,
// DTCG 2025.10 tokens with agent flags, llms.txt, and the map to MCP Apps style keys.
const catalog = {
  version: VERSION,
  rule: 'An agent composes only from this catalog and colours only with the figure contract; anything else is rejected and the error list returned to the model.',
  components: [
    { name: 'Button', classes: ['pp-btn', 'pp-btn--ghost', 'pp-btn--primary', 'pp-btn--small'], props: { label: 'string', kind: ['ink', 'ghost', 'primary'], disabled: 'boolean' }, rule: 'one primary per surface; ink on the site, teal inside a sheet or the app' },
    { name: 'Link', classes: ['pp-link'], props: { label: 'string', href: 'string' }, rule: 'teal text means a link or an action and nothing else' },
    { name: 'Input', classes: ['pp-field', 'pp-input', 'pp-msg', 'pp-msg--bad', 'pp-select-wrap'], props: { label: 'string', type: ['text', 'email', 'select', 'textarea'], invalid: 'boolean', message: 'string', disabled: 'boolean' } },
    { name: 'Checkbox', classes: ['pp-check'], props: { label: 'string', checked: 'boolean', disabled: 'boolean' } },
    { name: 'Radio', classes: ['pp-radio'], props: { label: 'string', name: 'string', checked: 'boolean', disabled: 'boolean' } },
    { name: 'Segmented', classes: ['pp-seg'], props: { options: 'string[]', selected: 'number', disabled: 'number[]' } },
    { name: 'Stepper', classes: ['pp-stepper', 'pp-seg', 'pp-tabular'], props: { step: 'number', of: 'number' }, rule: 'Previous · Play · Next and "Step n of m"' },
    { name: 'Sheet', classes: ['pp-modal', 'pp-modal-lead', 'pp-explain', 'pp-modal-rows', 'pp-modal-check', 'pp-modal-foot', 'pp-modal-acts'], props: { title: 'string', lead: 'string', explainer: '{icon,title,line}[]', rows: '{title,line,checked}[]', disclosure: 'string', secondary: 'string', primary: 'string' }, rule: 'max 820 wide; one teal primary; Not Now as a ghost' },
    { name: 'Alert', classes: ['pp-modal', 'pp-modal--alert'], props: { title: 'string', lead: 'string', secondary: 'string', primary: 'string' }, rule: 'max 420 wide' },
    { name: 'Provenance', classes: ['pp-prov', 'pp-prov--signed'], props: { fold: 'FoldId', state: ['drawn', 'edited', 'signed'], time: 'string', revert: 'boolean' }, rule: 'the Fold glyph plus text; no glow, gradient or colour wash' },
    { name: 'Element', classes: ['pp-el', 'pp-el--drafting', 'pp-el--declined', 'pp-el--error', 'pp-el-slot', 'pp-el-bar', 'pp-el-msg', 'pp-el-acts'], props: { title: 'string', state: ['drafting', 'awaiting', 'signed', 'declined', 'error'], message: 'string' }, rule: 'nothing shows under one second; "Drawing a chart", no ellipsis' },
    { name: 'Chart', classes: ['pp-chart', 'pp-chart-title', 'pp-chart-sub', 'pp-chart-src', 'pp-chart-note', 'pp-legend'], props: { takeaway: 'string', subtitle: 'string', source: 'string', series: '{name,values,highlight}[]', note: 'string' }, rule: 'context series in viz greys, one teal highlight, direct labels, thin smooth curves with no fill, markers by shape, stacked gaps, bars start at zero, gold never a series' },
    { name: 'Figure', classes: [], props: { svg: 'string' }, rule: 'colours only from the figure contract (fig-paper, fig-ink, fig-ink-2, fig-line, fig-accent-{pale,soft,base,deep}, fig-warm-{pale,soft,base,deep}, fig-mark, data-1..8); never a button inside a figure' },
    { name: 'Media', classes: ['pp-media', 'pp-media-frame', 'pp-media-frame--square', 'pp-ai-chip', 'pp-media-play', 'pp-media-acts'], props: { kind: ['image', 'video', '3d'], caption: 'string', madeWithAI: 'boolean' }, rule: 'keep the aspect ratio; a poster never looks like a control; Edit, Undo, Retry beside generated output' },
    { name: 'Voice', classes: ['pp-voice', 'pp-voice-glyph', 'pp-voice-state', 'pp-voice-text'], props: { state: ['idle', 'connecting', 'listening', 'thinking', 'speaking', 'error'], transcript: 'string' }, rule: 'the person\'s Fold glyph, the state as a word, a transcript and Stop; no orb, no glow' },
    { name: 'Text', classes: ['pp-display', 'pp-title', 'pp-section', 'pp-subtitle', 'pp-heading', 'pp-copy', 'pp-copy-lg', 'pp-label', 'pp-kicker', 'pp-tabular'], props: { role: 'one of the classes', text: 'string' } },
    { name: 'Highlighter', classes: ['pp-hl'], props: { text: 'string' }, rule: 'once per screen; gold is reserved for it' },
  ],
  agentTheme: { fields: ['fold', 'displayName', 'hue'], rule: 'an agent may set these three and nothing else (after A2UI\'s three-field theme); hue is one of ' + HUES.join(', ') },
};
writeFileSync(path.join(out, 'agents', 'paper-catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
writeFileSync(path.join(out, 'agents', 'paper-rules.txt'), `Paper ${VERSION} rules for an agent that draws or composes in Flow or on orionfold.com.

- Use only the components in paper-catalog.json and only the classes they list. Do not invent a component.
- Colour only with tokens. A figure may use only the figure contract: fig-paper, fig-ink, fig-ink-2, fig-line, fig-accent-pale/soft/base/deep, fig-warm-pale/soft/base/deep, fig-mark, data-1 to data-8. A raw hex value is an error; the checker snaps it to the nearest token and returns the list.
- Teal in text means a link or an action. Captions, markers and ticks are ink. Never put a button inside a figure.
- Gold is the highlighter. Use it once per screen and never as a data series.
- A chart: the takeaway is the title, in sentence case with no end punctuation; a source line under it; context series in the viz greys and one teal highlight; direct labels at line ends; thin smooth curves, never filled, never polylines; markers by shape, never colour alone; a paper gap between stacked segments; bars start at zero. Give the real values in the accessible summary.
- A multi-tone picture uses one hue's ramp: soft for the lit face, base for the side, deep for the shade, pale for a wash.
- Say who drew a thing with the provenance chip (the Fold glyph and words), never a glow, gradient or colour wash. Element states carry their own copy: "Drawing a chart" while drafting (no ellipsis, nothing under one second), "Waits for your yes", signed, declined, error with Retry.
- Motion is under 300 ms and eases out; press is 0.97; things enter from 0.93 with a fade; keyboard actions never animate; Reduce Motion means opacity only.
- Copy reads at grade 3 to 5, no em dashes, no colon-joined sentences, no emoji.
- An agent's theme is three fields: fold, displayName, hue. Nothing else.
`);
// DTCG 2025.10 tokens: colour, dimension and duration types with agent flags under $extensions.
const ext = (agentUse, role, extra = {}) => ({ 'org.orionfold.paper': { agentUse, role, ...extra } });
const colorTok = (value, agentUse, role, night, contrastL, contrastN) => ({ $type: 'color', $value: value, $extensions: ext(agentUse, role, { night, contrast: contrastL, nightContrast: contrastN }) });
const dtcg = { $schema: 'https://www.designtokens.org/schemas/2025.10/format.json', $description: `Orionfold Paper ${VERSION}. Modes live under $extensions["org.orionfold.paper"]: night (the app's dark appearance), contrast and nightContrast (Increase Contrast).`, color: {}, ramp: {}, data: {}, viz: {}, figure: {}, type: {}, motion: {}, control: {}, radius: {}, shadow: {} };
for (const [k, v] of Object.entries(tokens.color)) if (/^#|^rgba?\(/.test(v)) dtcg.color[k] = colorTok(v, /^(fig-|data-)/.test(k), k, NIGHT[k] ?? null, CONTRAST[k] ?? null, NIGHT_CONTRAST[k] ?? null);
for (const h of HUES) { dtcg.ramp[h] = {}; for (const s of STEPS) dtcg.ramp[h][s] = colorTok(RAMP[h][s], false, `${h} ${s}`, NIGHT_RAMP[h][s], null, null); }
tokens.data.forEach((d, i) => { dtcg.data[`data-${i + 1}`] = { $type: 'color', $value: `{${d.from === 'ink-2' ? 'color.ink-2' : 'ramp.' + d.from.replace('-', '.')}}`, $extensions: ext(true, 'data series', { shape: d.shape }) }; });
for (const [k, v] of Object.entries(VIZ)) dtcg.viz[k] = colorTok(v, true, k, NIGHT_VIZ[k], null, null);
for (const [k, v] of Object.entries(tokens.figure)) dtcg.figure[k] = { $type: 'color', $value: `{color.${v.match(/--pp-([a-z0-9-]+)/)[1]}}`, $extensions: ext(true, 'figure contract') };
for (const [k, v] of Object.entries(tokens.type)) { const [, w, size, lh] = v.match(/^(\d+) (.+?)\/(\S+) /) ?? []; dtcg.type[k.slice(2)] = { $type: 'typography', $value: { fontFamily: v.includes('serif') ? 'Fraunces' : v.includes('mono') ? 'Geist Mono' : 'Geist Sans', fontWeight: Number(w), fontSize: size, lineHeight: Number(lh) }, $extensions: ext(true, 'type role') }; }
for (const [k, v] of Object.entries(tokens.motion)) if (/^dur-/.test(k)) dtcg.motion[k] = { $type: 'duration', $value: v, $extensions: ext(true, 'duration') }; else if (/^ease/.test(k)) dtcg.motion[k] = { $type: 'cubicBezier', $value: v.match(/[-\d.]+/g).map(Number), $extensions: ext(true, 'curve') }; else if (/^(press|enter)$/.test(k)) dtcg.motion[k] = { $type: 'number', $value: Number(v), $extensions: ext(true, 'scale') };
for (const [k, v] of Object.entries(FOLD_STATE_MACHINE.springs)) dtcg.motion[`spring-${k}`] = { $type: 'number', $value: v.duration, $extensions: ext(false, 'spring (app)', { bounce: v.bounce, model: 'SwiftUI spring(duration:bounce:)' }) };
for (const [k, v] of Object.entries(tokens.control)) dtcg.control[k] = /px$/.test(v) ? { $type: 'dimension', $value: { value: Number(v.replace('px', '')), unit: 'px' }, $extensions: ext(true, 'control') } : { $type: 'shadow', $value: v, $extensions: ext(true, 'focus ring') };
for (const [k, v] of Object.entries(tokens.radius)) dtcg.radius[k] = { $type: 'dimension', $value: { value: Number(v.replace('px', '')), unit: 'px' }, $extensions: ext(true, 'radius') };
for (const [k, v] of Object.entries(tokens.shadow)) dtcg.shadow[k] = { $type: 'shadow', $value: v, $extensions: ext(false, 'shadow') };
writeFileSync(path.join(out, 'tokens', 'paper.tokens.json'), JSON.stringify(dtcg, null, 2) + '\n');
// MCP Apps (SEP-1865) host style keys the app can hand a sandboxed view, mapped to Paper tokens.
const mcp = { 'background-color-primary': 'paper', 'background-color-secondary': 'paper-2', 'background-color-tertiary': 'white', 'background-color-danger': 'red-pale', 'background-color-success': 'green-pale', 'background-color-warning': 'gold-pale', 'background-color-info': 'teal-pale', 'background-color-disabled': 'paper-2', 'text-color-primary': 'ink', 'text-color-secondary': 'ink-2', 'text-color-tertiary': 'ink-3', 'text-color-inverse': 'night-ink', 'text-color-danger': 'red-ink', 'text-color-success': 'green-ink', 'text-color-warning': 'gold-ink', 'text-color-info': 'teal-ink', 'text-color-disabled': 'ink-3', 'border-color-primary': 'line', 'border-color-secondary': 'line', 'border-color-danger': 'red-deep', 'border-color-success': 'green-deep', 'border-color-warning': 'gold-deep', 'border-color-info': 'teal-base', 'ring-color-primary': 'teal-pale', 'font-sans': 'sans', 'font-mono': 'mono', 'font-weight-normal': 400, 'font-weight-medium': 500, 'font-weight-semibold': 500, 'font-weight-bold': 500, 'font-size-sm': '13px', 'font-size-md': '15px', 'font-size-lg': '17px', 'border-radius-sm': 'r-1', 'border-radius-md': 'r-2', 'border-radius-lg': 'r-3', 'border-radius-xl': 'r-4', 'border-width-default': '1px', 'shadow-sm': 'shadow-small', 'shadow-md': 'shadow-paper', 'shadow-lg': 'shadow-sheet' };
writeFileSync(path.join(out, 'agents', 'mcp-apps-style-map.json'), JSON.stringify({ note: 'MCP Apps McpUiStyleVariableKey → Paper token (prefix --pp-). Keys not listed take the view\'s own fallback.', map: mcp }, null, 2) + '\n');
writeFileSync(path.join(out, 'agents', 'llms.txt'), `# Orionfold Paper ${VERSION}

> The design system for orionfold.com and the Flow app: paper and ink, Fraunces display type, one teal for actions, eight origami Folds. Everything an agent needs to draw or compose in it is in this package.

## Read first
- README.md: what is here and the rules that travel with it
- agents/paper-rules.txt: the rules an agent follows when it draws or composes
- agents/paper-catalog.json: the closed component catalog with props and classes
- tokens/paper.tokens.json: every token in DTCG 2025.10 with night, contrast and agent flags under $extensions
- tokens/paper-tokens.json: the same tokens grouped (color, ramps, data, viz, figure, contrast, type, motion, control, night)
- folds/state-machine.json: how a Fold moves (inputs, layers, visemes, springs)
- agents/mcp-apps-style-map.json: MCP Apps style keys mapped to Paper tokens
- manifest.json: every file, every Fold with its colours and night colours
`);

let commit = 'unknown';
try { commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root }).toString().trim(); } catch {}
const dirty = (() => { try { return execFileSync('git', ['status', '--porcelain', 'src/lib/paper', 'src/styles/paper', 'public/fonts', 'scripts/lib/fold-glyph.mjs', 'scripts/export-paper-package.mjs', 'package-lock.json'], { cwd: root }).toString().trim() !== ''; } catch { return false; } })();
writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({
  name: 'orionfold-paper', version: VERSION, stage: '0.4.x (operator-approved 2026-11-03)', stateMachine: 'folds/state-machine.json', live: { css: 'folds/live/fold-live.css', js: 'folds/live/fold-live.js', svgs: Object.fromEntries(FOLDS.map((f) => [f.id, `folds/live/${f.id}.svg`])) }, agents: { catalog: 'agents/paper-catalog.json', rules: 'agents/paper-rules.txt', llms: 'agents/llms.txt', mcpAppsStyleMap: 'agents/mcp-apps-style-map.json' }, source: { repo: 'orionfold/website', commit, uncommittedChanges: dirty },
  folds, personal, colorways, marks: { orionfoldStar: 'marks/orionfold-star.svg' },
  tokens: { json: 'tokens/paper-tokens.json', css: 'tokens/paper-tokens.css', dtcg: 'tokens/paper.tokens.json' },
  fonts: { fraunces: { woff2: 'fonts/fraunces-paper-latin.woff2', ttf: ttf ? 'fonts/fraunces-paper-latin.ttf' : null, licence: 'fonts/Fraunces-OFL.txt', axes: { wght: [300, 500], opsz: [9, 144] }, pinned: { SOFT: 100, WONK: 1 } } },
}, null, 2) + '\n');

writeFileSync(path.join(out, 'README.md'), `# Orionfold Paper ${VERSION}

The Paper design system, exported by the website (it owns Paper, decision D1) for the Flow app's Paper goals. Generated by \`scripts/export-paper-package.mjs\` from website commit \`${commit}\`${dirty ? ' plus uncommitted Paper changes' : ''}. Copy a version into the app; never edit it in place, ask the website lane for a new version.

## What is here
- \`folds/\`: the eight Flow Playbook Folds as standalone SVGs (viewBox 0 0 200 214): with and without the ground shadow, and a night variant (colors lifted to 3:1 on the night paper, Tally's legs and Orri's trail removed). \`<id>-fit.svg\` and \`<id>-fit-night.svg\` crop a square around the drawing (no shadow) so the Fold fills a circle avatar edge to edge; \`fitViewBox\` in the manifest gives the box. Colors and night colors per Fold are in \`manifest.json\`.
- \`personal/\`: the eight personal Folds a person folds in the app (elephant, paper boat, bear, butterfly, lotus, penguin, cat, hummingbird), drawn for 16 pt, each in its default colorway (with and without shadow, and night), plus \`personal/<id>/<colorway>.svg\` and \`-night.svg\` for every colorway, so recoloring is a file swap. Every one of those also has \`-fit\` and \`-fit-night\` files for circle avatars. Each has a temperament line, never a capability, and \`behaviour\`: two or three short rules for how that Fold works (the first one shows on the Fold step's sheet). \`colorways\` in the manifest lists the eight colorways (named by color, taken from the cast's palettes) with their night values.
- \`glyphs/\`: one-colour template glyphs for a Mac toolbar, one per Fold (the eight Playbook Folds and the eight personal Folds; \`files.glyph\` in the manifest). Each is one compound path filled #000, no strokes, gradients or shadow, in a square viewBox 0 0 100 100 with 8% padding on the longer side. They are generated from the coloured drawings (the mass is every facet; the holes are pale patches and the eyes, sized to read at 16 pt or dropped as a pair), so they never drift from the art. Built for 16 and 18 pt and checked at 12 pt, where they still hold, so there is no separate small variant.
- \`marks/orionfold-star.svg\`: the Orionfold star, folded in the Folds' polygon style.
- \`tokens/\`: every Paper token as JSON (grouped: color, ramps, data, viz, figure, contrast, type, control, liquidGlass, font, radius, shadow, motion, foldDefaults, layout) and the source CSS, plus DTCG 2025.10 \`paper.tokens.json\` (night, contrast and agent flags under \`$extensions["org.orionfold.paper"]\`), plus \`night\`: the app's dark appearance, same keys as \`color\`, with every promised text pair and its contrast ratio (all at least 4.5:1; the export stops if one drops).
- \`fonts/\`: Fraunces cut for Paper (Latin, weight 300 to 500, optical size kept, SOFT pinned 100, WONK pinned 1), woff2${ttf ? ' and ttf' : ''}, under the SIL Open Font License (no reserved font name).

## Rules that travel with it
- In a circle, use the \`-fit\` file at 100% of the circle with no padding, clip the circle (overflow hidden), and fill it with the Fold's color (night color in the dark appearance). The Fold's longer side touches the edge; the shorter side is centred.
- The eight Folds are the characters of the Flow Playbooks (each maps to one in \`manifest.json\`). A person's own Fold is folded from a blank sheet and uses shapes outside these eight (cross-lane, 2026-10-30).
- The Flow feature is a Playbook (Flow Playbook in full). A Blueprint is a free starter you use to create your own Playbook.
- The faces on the website are AI-generated models and are not part of this package.
- Text colors meet WCAG AA on paper and white (ink-3 is #666d69 since 2026-10-30).
- Changes come as new versions, never as edits in place (operator 2026-10-31).
- The active Fold on a surface sets \`--pp-fold-a\` (its a), \`--pp-fold-c\` (its c, the soft step) and \`--pp-fold-ink\` from the manifest; the token defaults (gold, gold-pale, red-deep) are the ground for a surface with no active Fold, so the highlighter sits on the gold wash there. Read a Fold's colours from the manifest, never from the defaults.
- 0.4.0 ramps: each hue has pale, soft, base, deep and ink (\`ramps\` in the tokens, light and night). pale is a wash, soft a lit face or fill, base the brand or Fold colour, deep the shade face (3:1 on its ground), ink the hue as text (4.5:1 on paper-2). A Fold wears its hue's ramp: a = base, b = deep, c = soft, ink = ink. A multi-tone picture uses one ramp (soft, base, deep).
- 0.4.0 data ramp: \`data-1\` to \`data-8\`, each paired with a marker shape (circle, square, diamond, triangle up, triangle down, cross, plus, hexagon), never colour alone; gold base is never a series; context series use the viz greys; one teal highlight; a paper gap between stacked segments.
- 0.4.0 Increase Contrast: \`contrast.light\` and \`contrast.night\` give the fourth value per colour (HIG Color); ghost buttons and controls draw a 1px ink-2 outline under it. The website answers \`prefers-contrast: more\`; the app adds a High Contrast appearance.
- 0.4.0 type roles (\`type\`): display, title, section, subtitle, heading, copy, copy-lg, label, kicker, button, button-small, tabular. One role per job; the app maps them to its text styles.
- 0.4.0 motion (\`motion\`): 160 / 240 / 380 ms, ease-out and ease-in-out, press 0.97, enter from 0.93 with a fade; springs smooth (0.32, 0), snappy (0.28, 0.15), bouncy (0.5, 0.3, Fold moments only); keyboard-initiated actions never animate; Reduce Motion means opacity only; delight by frequency.
- 0.4.0 teal: teal in text means a link or an action, plus the one chart highlight. Captions, markers and ticks are ink. One accent on every Paper surface, documents included; the system accent only in system-styled chrome (sidebar selection, toolbar).
- 0.4.0 document ground: paper (light) and night paper (dark); Increase Contrast through the contrast values, never a different ground.
- 0.4.0 app surfaces: inside the window r-2 plus a line and no shadow; anything floating (sheet, popover, menu) r-4 plus shadow-sheet or shadow-small; Liquid Glass only on functional chrome, regular variant, never on content; clear only over media with a 35 percent dim.
- 0.4.0 controls: height \`input-h\` (36, 40 on touch), white, a line border, hover ink-3, focus ring \`ring\` plus a teal border, invalid red-deep with a message in red-ink, disabled paper-2 with ink-3 text (no opacity); checkbox and radio 18 px, checked fills teal with a white mark.
- 0.4.0 sheet and alert: title, one lead line in ink-2, a paper-2 explainer strip, teal-pale check rows, one disclosure link, Not Now as a ghost and one teal primary; 820 wide for a sheet, 420 for an alert; r-4 and the sheet shadow.
- 0.4.0 provenance and Element states: the Fold's one-colour glyph in a chip (Drawn by, You edited with Revert, Signed by you at a time); states drafting ("Drawing a chart", nothing under one second, no ellipsis), awaiting ("Waits for your yes"), signed, declined, error with Retry. No glow, gradient or colour wash for AI.
- 0.4.0 highlighter: once per screen; gold is reserved for it.
- 0.4.0 voice: six states (idle, connecting, listening, thinking, speaking, error) as the person's Fold glyph, the state as a word, a transcript and Stop; listening pulses a soft teal ring (opacity only), speaking breathes the glyph; no orb, no glow.
- 0.4.0 media: keep the aspect ratio in a line frame, caption in ink-3 at 13, a poster never looks like a control, captions the viewer can override, 3D as glTF on the web and USDZ on Apple from one source, a "Made with AI" chip plus the C2PA pin where a manifest exists, Edit, Undo and Retry beside generated output.
- 0.4.0 figure contract: a model-drawn figure uses only fig-paper, fig-ink, fig-ink-2, fig-line, fig-accent-{pale,soft,base,deep} (the teal ramp), fig-warm-{pale,soft,base,deep} (the gold ramp), fig-mark and data-1 to 8; a checker snaps raw hex to the nearest token and returns the errors to the model; never a button inside a figure.
- 0.4.0 Folds move: \`folds/state-machine.json\` is the contract for each Fold's Rive file (inputs state, viseme, right, wrong; layers body, eyes, mouth, blink, reaction; the springs; Reduce Motion). The \`.riv\` files are authored in the Rive editor from the same layers (no authoring API); Ember's reference mouth paths are in the file.
- 0.4.0 for agents: \`agents/\` holds the closed catalog, the rules fragment, llms.txt and the MCP Apps style map; an agent's theme is three fields (fold, displayName, hue).
- Liquid Glass (regular variant) for floating controls: fill \`var(--pp-lg-sheen), var(--pp-lg-tint)\`, \`backdrop-filter: var(--pp-lg-filter)\`, a 1px \`--pp-lg-rim\` border all round and \`--pp-lg-shadow\`. Once the page scrolls the tint becomes \`--pp-lg-tint-scrolled\` and a band in \`--pp-lg-edge\` blurs what passes under the bar. The highlight is an even sheen and rim, never a brighter top edge (Orionfold rule: no single-edge accents).
- Long-form reading: below 1180px the article is one 620px column. From 1180px the head, figures and body take the wide frame (\`layout.longform.min1180.wide\`), text keeps the reading measure (760px, 800px from 1600px), and pictures, tables and code run the full body width.

## Versions
- 0.1.0 (2026-10-30): first early export, before website R8.
- 0.1.1 (2026-10-30): same files, cut from a committed source (product lane ask).
- 0.2.0 (2026-10-30): night (dark appearance) tokens and Fold variants; personal Folds with colorways.
- 0.2.1 (2026-10-30): night beak and butterfly body in light ink; a rounder bear, now coral by default (penguin ochre), apart from the cat at 16 pt.
- 0.3.0 (2026-10-31): the final design system. Liquid Glass tokens in their own group, the long-form frame in \`layout\`, and their rules above.\n- 0.3.1 (2026-10-31): fitted Fold SVGs (\`-fit\`, \`-fit-night\`) for circle avatars, for the Playbook Folds and every personal Fold colorway; \`fitViewBox\` per Fold in the manifest. No art or token changes.\n- 0.3.2 (2026-10-31): \`behaviour\` for each personal Fold (character = behaviour, product lane ask). No art or token changes.\n- 0.3.3 (2026-10-31): operator review of \`behaviour\`; hummingbird gets to the point instead of promising speed, butterfly stays inside this document. New token \`--pp-teal-ink\` (#1f7176, night #5cc0bf) for small teal text; brand teal is unchanged.\n- 0.3.4 (2026-10-31): one-colour template glyphs (\`glyphs/\`, \`files.glyph\` per Fold) for the Flow toolbar's Ideas button and the "<Fold> suggests" badge (product lane ask). No art or token changes.
- 0.4.0 (2026-11-03): the operator-approved next version (five vectors: one system for site and app, AI-first, multimodal, dual use by people and agents, taste). Tonal ramps per hue (light and night), the data ramp with marker shapes, viz greys, Increase Contrast values, type roles, motion tokens and springs, form controls and states, segmented control and stepper, sheet and alert, provenance chip and Element states, the chart kit, media and voice rules, the figure palette contract, the Fold state-machine contract, and the agent-facing files. Folds now wear their hue's ramp (Tally is brand teal). Spec: website \`_SPECS/2026-11-03-130558_paper-0-4-0.md\`.
- 0.4.2 (2026-11-03): the live Fold as applied on orionfold.com (G-150). \`fold-live.js\`: the driver reads the SVG on every call so a page may swap the \`.pp-live-svg\` inside a root and keep the api, caches one driver per root, adds \`rest()\` (idle now, timed returns forgotten) and \`sleepFolds()\` (an IntersectionObserver that sets \`data-pp-asleep\` off screen; the CSS pauses the breath and blink), and under Reduce Motion speaking holds one open viseme instead of cycling. \`liveFoldSvg()\` takes \`fit\` and \`shadow\` like \`foldSvg()\`, keeps the ground shadow outside the body layer so it holds still, and sets \`--pp-blink-delay\` per Fold so a roster never blinks in unison. \`fold-live.css\`: the listening ring is inset 14/13/18 percent of the box, \`position: relative\` on \`.pp-live\` is \`:where()\` so a placed (absolute) Fold keeps its own position, and \`[data-pp-asleep]\` pauses the animations. No token, ramp or art changes.
- 0.4.1 (2026-11-03): token export fix (product lane, 13:07). The JSON tokens read only the main light block, so \`color.teal\`, \`color.ink-3\`, \`color.line\` and \`control.input-h\` are the defaults again (the Increase Contrast values stay in \`contrast\`, the touch height is a note); \`teal-pale\`, \`teal-ink\`, \`gold-pale\` and \`red-deep\` are back in \`color\` (and in the DTCG file) beside their ramp twins. No art, token or rule changes.
`);

console.log(`Paper ${VERSION} → ${path.relative(root, out)} (${folds.length} Folds, ${Object.keys(vars).length} tokens${ttf ? ', ttf' : ''})`);
