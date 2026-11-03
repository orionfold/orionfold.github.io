// Paper design system guards (G-139, operator 2026-10-30).
// Paper is built beside Living Systems and must not leak into it: its classes
// are pp- prefixed, its colors are tokens, and only PaperLayout loads it.
// The cast stays truthful: every Fold belongs to a published Playbook, every
// sample client comes from that blueprint's own mock, and faces are labeled.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { signals, compare } from '../head-diff.mjs';

const root = new URL('../../', import.meta.url).pathname;
const read = (p) => readFileSync(path.join(root, p), 'utf8');
const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = path.join(d, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

const PAPER_CSS = ['src/styles/paper/shell.css', 'src/styles/paper/components.css'];
const paperCss = () => PAPER_CSS.map(read).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');

test('Paper components use tokens only, never raw colors', () => {
  const css = paperCss();
  assert.deepEqual(css.match(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/gi) ?? [], [], 'move the color into tokens.css as a --pp-* token');
});

test('every Paper class is pp- prefixed, so nothing collides with Living Systems', () => {
  const css = paperCss();
  const selectors = [...css.matchAll(/([^{}]+)\{[^{}]*\}/g)].map((m) => m[1]).filter((s) => !/^\s*(@|from|to|\d)/.test(s));
  const bad = new Set();
  for (const sel of selectors) for (const [, cls] of sel.matchAll(/\.([a-zA-Z][\w-]*)/g)) if (cls !== 'paper' && !cls.startsWith('pp-')) bad.add(cls);
  assert.deepEqual([...bad], []);
});

test('the shell styles load with the shell; page components only on Paper pages', () => {
  const importers = (sheet) => [...walk(path.join(root, 'src'))]
    .filter((f) => /\.(astro|ts|css|mjs)$/.test(f) && new RegExp(`import\\s+['"][^'"]*styles/paper/${sheet.replace('.', '\\.')}['"]`).test(readFileSync(f, 'utf8')))
    .map((f) => path.relative(root, f)).sort();
  // R7e (G-146): PrivateLayout (the customer-only workshop pages) is the one
  // other Paper layout; it keeps its own head (no analytics, noindex).
  assert.deepEqual(importers('components.css'), ['src/layouts/PaperLayout.astro', 'src/layouts/PrivateLayout.astro']);
  for (const sheet of ['tokens.css', 'shell.css']) assert.deepEqual(importers(sheet), ['src/components/Footer.astro', 'src/components/Nav.astro', 'src/layouts/PaperLayout.astro', 'src/layouts/PrivateLayout.astro'], sheet);
});

test('every Paper rule sits under .paper, so it outranks Living element rules', () => {
  const selectors = [...paperCss().matchAll(/([^{}]+)\{[^{}]*\}/g)].map((m) => m[1]).filter((sel) => !/^\s*(@|from|to|\d)/.test(sel));
  const loose = selectors.flatMap((sel) => sel.split(/,(?![^()]*\))/)).map((sel) => sel.trim()).filter((sel) => !/^\.paper(?![\w-])/.test(sel))
    // The one root rule (operator 2026-10-31): a Paper page owns its root background and scrollbar track.
    .filter((sel) => !/^:root:has\(> body\.paper\)(::-webkit-scrollbar-(track|thumb))?$/.test(sel));
  assert.deepEqual(loose, []);
});

test('no stylesheet outside Paper defines a pp- class', () => {
  const sheets = [...walk(path.join(root, 'src/styles'))].filter((f) => f.endsWith('.css') && !f.includes(`${path.sep}paper${path.sep}`));
  const hits = sheets.filter((f) => /\.pp-[a-z]/.test(readFileSync(f, 'utf8'))).map((f) => path.relative(root, f));
  assert.deepEqual(hits, [], 'the proposal page moved to prop- (G-140); keep pp- for Paper alone');
});

test('the R1 shell: announce bar, Paper nav and footer on every page with a nav', () => {
  const nav = read('src/components/Nav.astro');
  assert.match(nav, /<AnnounceBar href="\/playbooks\/"[^>]*>Flow \{FLOW_VERSION\} is out\./, 'the announce bar (D6) reads the version from flow-release.json');
  assert.match(nav, /<div id="nav-wrapper" class="paper pp-shell">[\s\S]*id="nav-notice-slot"[\s\S]*<PaperNav \/>/);
  assert.match(nav, /--of-nav-height/);
  const paperNav = read('src/components/paper/PaperNav.astro');
  assert.match(paperNav, /id="main-nav"/);
  for (const surface of ['nav-desktop', 'nav-mobile', 'nav-menu']) assert.ok(paperNav.includes(surface), `${surface} stays attributable`);
  assert.match(read('src/components/Footer.astro'), /<div class="paper pp-shell-foot"><PaperFooter \/><\/div>/);
  assert.match(read('src/styles/living-system.css'), /:root \{ --of-nav-height:102px; \}/, 'first paint reserves the measured shell');
  // Every page with the shell fetches Fraunces, so it stays the trimmed cut.
  assert.match(read('src/styles/paper/tokens.css'), /url\('\/fonts\/fraunces-paper-latin\.woff2'\)/);
  assert.ok(statSync(path.join(root, 'public/fonts/fraunces-paper-latin.woff2')).size <= 60_000, 'Fraunces stays under 60 KB');
  const notFound = read('src/pages/404.astro');
  assert.match(notFound, /<PaperLayout [^>]*noindex>/);
  assert.match(notFound, /<Nav \/>[\s\S]*<Footer showDownload=\{false\} \/>/);
});

test('Layout keeps Living Systems as the default design', () => {
  const src = read('src/layouts/Layout.astro');
  assert.match(src, /design = 'living'/);
  assert.match(src, /'living-site bg-surface text-text min-h-screen'/);
});

test('each Fold belongs to a published Playbook, and sample clients come from its blueprint', () => {
  const folds = read('src/lib/paper/folds.ts');
  const cast = read('src/lib/paper/cast.ts');
  const slugs = [...folds.matchAll(/domainSlug: '([a-z0-9-]+)'/g)].map((m) => m[1]);
  assert.equal(slugs.length, 8);
  for (const slug of slugs) assert.ok(existsSync(path.join(root, `src/content/domains/${slug}.md`)), `${slug} is not a published Playbook`);
  for (const [, id, client] of cast.matchAll(/^\s+(\w+): \{ area: '[^']*', who: '[^']*', client: '([^']*)'/gm)) {
    if (!client) continue;
    const slug = folds.match(new RegExp(`id: '${id}'[^}]*domainSlug: '([a-z0-9-]+)'`))[1];
    const mock = read(`src/content/domains/${slug}.md`).match(/^\s*client: "([^"]+)"/m)?.[1] ?? '';
    assert.ok(mock.startsWith(client), `${id}: "${client}" is not ${slug}'s sample client ("${mock}")`);
  }
});

test('faces always ship with the AI-generated label', () => {
  assert.match(read('src/lib/paper/cast.ts'), /FACES_LABEL = 'People shown are AI-generated models, not customers\.'/);
  assert.match(read('src/components/paper/Roster.astro'), /anyFace && <p[^>]*>\{FACES_LABEL\}/);
});

test('the component gallery is dev-only', () => {
  assert.match(read('src/pages/design/[...slug].astro'), /return import\.meta\.env\.DEV \? \[\{ params: \{ slug: undefined \} \}\] : \[\];/);
  if (existsSync(path.join(root, 'dist/index.html'))) assert.ok(!existsSync(path.join(root, 'dist/design')), 'the gallery was built for production');
});

test('Paper nav groups list at most five, then "All"', () => {
  const src = read('src/components/paper/PaperNav.astro');
  assert.match(src, /const PAPER_NAV_GROUP_MAX = 5;/);
  const flow = src.match(/\{ title: 'Flow', items: \[([\s\S]*?)\] \}/)[1];
  assert.ok((flow.match(/href:/g) ?? []).length <= 5);
  assert.ok(!/items: (?!top\(|\[|domainTop\.)\w+\./.test(src), 'every data-driven group must go through top()');
  assert.match(src, /const domainTop = top\(domains\);/, 'Playbooks list five in all, like the old menu');
});

test('head-diff catches a dropped JSON-LD block, canonical or internal link', () => {
  const page = '<html><head><title>T</title><meta name="description" content="D"><link rel="canonical" href="https://x/a/"><script type="application/ld+json">{"@type":"FAQPage"}</script></head><body><a href="/b/">b</a></body></html>';
  const before = { '/a/index.html': signals(page) };
  assert.deepEqual(compare(before, before), []);
  const stripped = { '/a/index.html': signals(page.replace(/<script[\s\S]*?<\/script>/, '').replace('<a href="/b/">b</a>', '')) };
  assert.equal(compare(before, stripped).length, 2);
  assert.deepEqual(compare(before, {}), ['/a/index.html: page no longer built']);
});

test('night (the app’s dark appearance) keeps every promised text pair at AA and every Fold at 3:1', async () => {
  const night = await import(path.join(root, 'src/lib/paper/night.ts'));
  const { FOLDS } = await import(path.join(root, 'src/lib/paper/folds.ts'));
  for (const [fg, bg] of night.NIGHT_TEXT_PAIRS) assert.ok(night.contrast(night.NIGHT[fg], night.NIGHT[bg]) >= 4.5, `${fg} on ${bg}`);
  for (const f of FOLDS) {
    const n = night.nightFold(f);
    for (const k of ['a', 'b']) assert.ok(night.contrast(n[k], night.NIGHT.paper) >= 3, `${f.id}.${k} on night`);
    assert.ok(night.contrast(n.ink, night.NIGHT.paper) >= 4.5, `${f.id} ink on night`);
  }
  // Fine detail the app measured as noise on a dark sidebar stays out of night.
  const byId = Object.fromEntries(FOLDS.map((f) => [f.id, f]));
  assert.doesNotMatch(night.nightFoldShapes(byId.orri), /stroke-dasharray/);
  assert.doesNotMatch(night.nightFoldShapes(byId.tally), /points="92,146/);
  // The website itself stays light-only: night never reaches a site stylesheet.
  const siteCss = read('src/styles/paper/tokens.css') + read('src/styles/paper/shell.css') + read('src/styles/paper/components.css');
  assert.equal((siteCss.match(/--pp-paper:/g) ?? []).length, 1, 'one (light) paper value on the site');
  assert.doesNotMatch(siteCss, new RegExp(`--pp-paper:\\s*${night.NIGHT.paper}`));
});

test('personal Folds: eight shapes outside the cast, temperament lines, colorways from the cast palettes', async () => {
  const { PERSONAL_FOLDS, COLORWAYS, colorwayById } = await import(path.join(root, 'src/lib/paper/personal-folds.ts'));
  const { FOLDS } = await import(path.join(root, 'src/lib/paper/folds.ts'));
  assert.equal(PERSONAL_FOLDS.length, 8);
  const castKinds = new Set(FOLDS.map((f) => f.kind));
  for (const f of PERSONAL_FOLDS) {
    assert.ok(!castKinds.has(f.shape), `${f.shape} is a cast shape`);
    assert.ok(colorwayById[f.defaultColorway], `${f.id} default colorway`);
    // A line names a temperament, never a capability (memory is Pro; nothing proactive ships).
    assert.doesNotMatch(f.line, /remember|memory|every day|speaks up|reminds|learns|knows you/i, f.id);
    assert.doesNotMatch(f.line, /[—:]/, `${f.id}: house style`);
    // Character = behaviour (operator 2026-10-31): 2 or 3 short rules Flow seeds
    // into SOUL.md. Same limits as the line: conduct, never a capability.
    assert.ok(Array.isArray(f.behaviour) && f.behaviour.length >= 2 && f.behaviour.length <= 3, `${f.id}: 2 or 3 behaviour rules`);
    for (const r of f.behaviour) {
      assert.match(r, /^[A-Z][^.]*\.$/, `${f.id}: one short sentence, ends with a period: ${r}`);
      assert.ok(r.split(' ').length <= 12, `${f.id}: short rule: ${r}`);
      assert.doesNotMatch(r, /remember|memory|every day|speaks up|reminds|learns|knows you/i, `${f.id}: ${r}`);
      assert.doesNotMatch(r, /[—:;]/, `${f.id}: house style: ${r}`);
    }
  }
  assert.equal(new Set(PERSONAL_FOLDS.map((f) => f.defaultColorway)).size, 8, 'each shape has its own default colorway');
  const castPalettes = new Set(FOLDS.map((f) => `${f.a}${f.b}${f.c}`));
  for (const c of COLORWAYS) assert.ok(castPalettes.has(`${c.a}${c.b}${c.c}`), `${c.id} comes from a cast palette`);
});

test('Paper pages never render the Living footer download card (it is unstyled there and overflows phones)', () => {
  const pages = [...walk(path.join(root, 'src'))].filter((f) => f.endsWith('.astro')).map((f) => [path.relative(root, f), readFileSync(f, 'utf8')])
    .filter(([, src]) => /<PaperLayout\b/.test(src) && /<Footer\b/.test(src));
  assert.ok(pages.length >= 5, 'Paper pages with a footer exist');
  for (const [file, src] of pages) assert.match(src, /<Footer showDownload=\{false\}/, `${file}: pass showDownload={false}`);
});

test('R6 long-form: one article template, BlogPosting kept, receipts cite their sources on the page', () => {
  for (const page of ['src/pages/story/[slug]/index.astro', 'src/pages/receipts/[slug]/index.astro', 'src/pages/relay/memos/[slug]/index.astro', 'src/components/letters/LetterArticle.astro', 'src/pages/promise.astro']) {
    assert.match(read(page), /<PaperLongform\b/, `${page} uses the long-form template`);
  }
  for (const page of ['src/pages/story/[slug]/index.astro', 'src/pages/receipts/[slug]/index.astro', 'src/pages/letter/[slug]/index.astro', 'src/pages/relay/memos/[slug]/index.astro']) {
    assert.match(read(page), /'@type': 'BlogPosting'/, `${page} keeps its BlogPosting`);
  }
  const longform = read('src/components/paper/PaperLongform.astro');
  assert.match(longform, /Written by/);
  assert.doesNotMatch(longform, /Reviewed by/i, 'no reviewer exists, so the byline never claims one (operator 2026-10-30)');
  assert.match(read('src/pages/receipts/[slug]/index.astro'), /class="pp-sources"[\s\S]*<h2 id="receipt-sources">Sources<\/h2>/);
  // Every long-form subscribe keeps the live double-opt-in form and its attribution.
  for (const [page, source] of [['src/pages/story/[slug]/index.astro', 'story'], ['src/pages/receipts/[slug]/index.astro', 'receipt-page'], ['src/pages/letter/[slug]/index.astro', 'letter-page']]) {
    assert.match(read(page), new RegExp(`<PaperSubscribe [^>]*source="${source}"`), `${page} keeps source=${source}`);
  }
  assert.match(read('src/components/paper/PaperSubscribe.astro'), /<WaitlistForm /);
});

// ---------- Paper 0.4.0 (operator 2026-11-03 "cut it") ----------
test('0.4.0 ramps: tokens.css equals ramps.ts, every step clears its contrast promise, Folds wear the ramp', async () => {
  const { RAMP, NIGHT_RAMP, VIZ, NIGHT_VIZ, HUES, STEPS, DATA, FOLD_HUE } = await import(path.join(root, 'src/lib/paper/ramps.ts'));
  const { NIGHT, contrast, NIGHT_GRAPHIC_PAIRS, NIGHT_TEXT_PAIRS } = await import(path.join(root, 'src/lib/paper/night.ts'));
  const { FOLDS } = await import(path.join(root, 'src/lib/paper/folds.ts'));
  const css = read('src/styles/paper/tokens.css');
  const tok = (k) => css.match(new RegExp(`--pp-${k}:\\s*([^;]+);`))?.[1].trim();
  const paper = tok('paper'), paper2 = tok('paper-2');
  for (const h of HUES) for (const s of STEPS) assert.equal(tok(`${h}-${s}`), RAMP[h][s], `--pp-${h}-${s}`);
  for (const k of Object.keys(VIZ)) assert.equal(tok(k), VIZ[k], k);
  for (const h of HUES) {
    assert.ok(contrast(RAMP[h].deep, paper) >= 3, `${h}-deep 3:1 on paper`);
    assert.ok(contrast(RAMP[h].ink, paper2) >= 4.5, `${h}-ink 4.5:1 on paper-2`);
    assert.ok(contrast(NIGHT_RAMP[h].deep, NIGHT.paper) >= 3, `night ${h}-deep 3:1`);
    assert.ok(contrast(NIGHT_RAMP[h].ink, NIGHT['paper-2']) >= 4.5, `night ${h}-ink 4.5:1`);
    for (const s of STEPS) assert.equal(NIGHT[`${h}-${s}`], NIGHT_RAMP[h][s], `night.ts carries ${h}-${s}`);
  }
  for (const k of Object.keys(NIGHT_VIZ)) assert.equal(NIGHT[k], NIGHT_VIZ[k]);
  for (const [fg, bg] of NIGHT_GRAPHIC_PAIRS) assert.ok(contrast(NIGHT[fg], NIGHT[bg]) >= 3, `${fg} on night ${bg}`);
  for (const [fg, bg] of NIGHT_TEXT_PAIRS) assert.ok(contrast(NIGHT[fg], NIGHT[bg]) >= 4.5, `${fg} on night ${bg}`);
  // the data ramp: eight steps, each 3:1 on paper, gold-base never a series, each with its own shape
  assert.equal(DATA.length, 8);
  assert.equal(new Set(DATA.map(([, shape]) => shape)).size, 8);
  for (const [k] of DATA) { assert.notEqual(k, 'gold-base'); const [h, s] = k.split('-'); const v = k === 'ink-2' ? tok('ink-2') : RAMP[h][s]; assert.ok(contrast(v, paper) >= 3, `${k} 3:1 on paper`); assert.equal(tok(`data-${DATA.findIndex(([x]) => x === k) + 1}`), `var(--pp-${k})`); }
  // the Folds wear their hue's ramp
  for (const f of FOLDS) { const r = RAMP[FOLD_HUE[f.id]]; assert.deepEqual({ a: f.a, b: f.b, c: f.c, ink: f.ink }, { a: r.base, b: r.deep, c: r.soft, ink: r.ink }, f.id); }
});

test('0.4.0 roles and rules: type roles, motion tokens, controls, Increase Contrast, no overlay left', () => {
  const css = read('src/styles/paper/tokens.css');
  for (const r of ['display', 'title', 'section', 'subtitle', 'heading', 'copy', 'copy-lg', 'label', 'kicker', 'button', 'button-small', 'tabular']) assert.match(css, new RegExp(`--pp-t-${r}:`), `type role ${r}`);
  for (const m of ['dur-fast: 160ms', 'dur-base: 240ms', 'dur-slow: 380ms', 'ease-out:', 'ease-in-out:', 'press: .97', 'enter: .93', 'input-h: 36px', 'ring:']) assert.ok(css.includes(`--pp-${m}`), m);
  assert.match(css, /@media \(prefers-contrast: more\)/);
  const comp = paperCss();
  // no sub-second literal duration is left in the Paper sheets; motion reads the tokens
  assert.deepEqual(comp.match(/(?<![0-9.\w])\.[0-9]+s(?=[ ;,)])/g)?.filter((d) => parseFloat(d) <= 0.4) ?? [], []);
  // teal in text means a link or an action: these four read ink now
  assert.match(comp, /\.pp-play-formats small \{[^}]*color: var\(--pp-ink-2\)/);
  assert.match(comp, /\.pp-training-ticks li::before \{[^}]*color: var\(--pp-ink-2\)/);
  assert.match(comp, /\.pp-relay-paid li::marker \{[^}]*color: var\(--pp-ink-2\)/);
  assert.match(comp, /\.pp-price-more li::before \{[^}]*background: var\(--pp-ink-3\)/);
  // the chart kit never fills a line path (a class fill beats an inline fill="none")
  assert.match(comp, /\.pp-chart path\[class\^="pp-s"\] \{ fill: none; \}/);
  for (const c of ['pp-input', 'pp-check', 'pp-radio', 'pp-seg', 'pp-stepper', 'pp-modal', 'pp-prov', 'pp-el', 'pp-chart', 'pp-media', 'pp-voice', 'pp-display', 'pp-title', 'pp-tabular']) assert.ok(comp.includes(`.paper .${c}`), c);
  assert.ok(!existsSync(path.join(root, 'src/styles/paper/next.css')), 'the 0.4.0 overlay folded into tokens.css and components.css');
  assert.doesNotMatch(comp, /\.pp-next(?![\w-])/);
  assert.doesNotMatch(read('src/layouts/PaperLayout.astro'), /paper=next/);
});

test('0.4.0 applied across the pages (G-150): live Folds, chart kit, media frames, sheet, control states, role tokens', () => {
  const src = walk(path.join(root, 'src')).filter((f) => /\.(astro|ts|js|css|mjs)$/.test(f));
  const grep = (re) => src.filter((f) => re.test(readFileSync(f, 'utf8'))).map((f) => path.relative(root, f)).sort();
  // the bob retired: every placed Fold is live (breath, blink, the state machine) and rests off screen
  assert.deepEqual(grep(/pp-bob(?!-soft)/), [], 'no .pp-bob left (the live Fold replaced it)');
  assert.deepEqual(grep(/<Fold [^>]*\bbob\b/), []);
  const fold = read('src/components/paper/Fold.astro');
  assert.match(fold, /live\?: boolean/); assert.match(fold, /liveFoldSvg\(f, \{ label, fit \}\)/); assert.match(fold, /sleepFolds\(\)/);
  const hero = read('src/components/paper/TalkPageHero.astro');
  for (const call of ["chat.state('listening')", "chat.state('thinking')", 'chat.say(', "sheet.trigger('right')", 'folds.forEach((f) => f.rest())']) assert.ok(hero.includes(call), `the hero Fold listens, thinks, speaks, bounces once at the sign-off note and rests on clear: ${call}`);
  assert.match(read('src/components/paper/Roster.astro'), /<Fold id=\{f\.id\} live class="pp-r-fold" \/>[\s\S]*pointerenter[\s\S]*focusin/);
  const comp = read('src/styles/paper/components.css');
  assert.match(comp, /\.paper \.pp-live\[data-pp-asleep\] :is\(\.pp-live-body, \.pp-live-face, \.pp-live-lid\) \{ animation-play-state: paused; \}/);
  assert.match(read('src/lib/paper/fold-live.js'), /export function sleepFolds[\s\S]*IntersectionObserver/);
  // the chart kit is one module; the gallery and the window draw from it
  assert.match(read('src/lib/paper/next-review.ts'), /import \{ marker, monotonePath \} from '\.\/chart'/);
  assert.match(read('src/components/paper/FlowWindow.astro'), /import \{ barChart, chartFigure, type BarSpec \} from '\.\.\/\.\.\/lib\/paper\/chart'/);
  assert.doesNotMatch(comp, /\.pp-bars(?![\w-])/, 'the window draws a kit chart, not tinted bars');
  // provenance on the sign-off
  assert.match(read('src/components/paper/FlowWindow.astro'), /class="pp-prov" data-pp-prov[\s\S]*Signed by you at/);
  // media frames replaced the window shot everywhere, and generated pictures carry the chip
  assert.deepEqual(grep(/pp-window-shot/), []);
  assert.match(read('src/pages/about.astro'), /<Media ai ratio="auto" class="pp-letter-figure">/);
  assert.match(read('src/pages/dgx-spark.astro'), /<Media ratio="wide" ai class="pp-spark-art">/);
  // the enterprise dialog is a sheet with the control states and the one teal primary
  const ent = read('src/components/flow/FlowEnterpriseContact.astro');
  assert.match(ent, /class="flow-enterprise-dialog pp-modal"/); assert.match(ent, /class="flow-enterprise-intro pp-modal-lead"/);
  assert.equal((ent.match(/class="pp-input"/g) ?? []).length, 6, 'every field is a .pp-input');
  assert.match(ent, /pp-btn pp-btn--primary/); assert.doesNotMatch(ent, /clamp\(/);
  // the Living bridges carry the states through tokens, never pp- classes
  const bridge = read('src/styles/living-in-paper.css');
  for (const sel of ['.ls-form-in-paper input[type="email"]:focus-visible', '.ls-form-in-paper input[type="email"]:is([aria-invalid="true"], :user-invalid)', '#enquiry-form :is(input, textarea):focus-visible']) assert.ok(bridge.includes(sel), sel);
  assert.ok(bridge.includes('box-shadow: var(--pp-ring)'));
  // role tokens: heads that match a role read it; the bespoke clamp count only goes down
  for (const sel of ['.pp-form h2', '.pp-done-next h2', '.pp-relay-split h3', '.pp-index-head h2', '.pp-play-founders h3']) assert.match(comp, new RegExp(`\\.paper ${sel.replace(/[.]/g, '\\.')} \\{[^}]*font: var\\(--pp-t-(title|section)\\)`), sel);
  assert.ok((comp.match(/font: \d+ clamp\(/g) ?? []).length <= 25, 'no new ad hoc clamp sizes in components.css (25 bespoke home and long-form sizes remain)');
  assert.match(read('src/pages/404.astro'), /font: var\(--pp-t-display\)/);
  // section 7: teal is for links, rings and the primary; small text reads ink
  assert.match(comp, /\.pp-price-more summary \{[^}]*color: var\(--pp-ink-2\)/);
  assert.match(comp, /\.pp-signoff button\[aria-pressed="true"\] \{[^}]*color: var\(--pp-teal-ink\)/);
});
