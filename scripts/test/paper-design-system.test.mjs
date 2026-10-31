// Paper design system guards (G-139, operator 2026-10-30).
// Paper is built beside Living Systems and must not leak into it: its classes
// are pp- prefixed, its colors are tokens, and only PaperLayout loads it.
// The cast stays truthful: every Fold belongs to a published Domain, every
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
  assert.deepEqual(importers('components.css'), ['src/layouts/PaperLayout.astro']);
  for (const sheet of ['tokens.css', 'shell.css']) assert.deepEqual(importers(sheet), ['src/components/Footer.astro', 'src/components/Nav.astro', 'src/layouts/PaperLayout.astro'], sheet);
});

test('every Paper rule sits under .paper, so it outranks Living element rules', () => {
  const selectors = [...paperCss().matchAll(/([^{}]+)\{[^{}]*\}/g)].map((m) => m[1]).filter((sel) => !/^\s*(@|from|to|\d)/.test(sel));
  const loose = selectors.flatMap((sel) => sel.split(/,(?![^()]*\))/)).map((sel) => sel.trim()).filter((sel) => !/^\.paper(?![\w-])/.test(sel));
  assert.deepEqual(loose, []);
});

test('no stylesheet outside Paper defines a pp- class', () => {
  const sheets = [...walk(path.join(root, 'src/styles'))].filter((f) => f.endsWith('.css') && !f.includes(`${path.sep}paper${path.sep}`));
  const hits = sheets.filter((f) => /\.pp-[a-z]/.test(readFileSync(f, 'utf8'))).map((f) => path.relative(root, f));
  assert.deepEqual(hits, [], 'the proposal page moved to prop- (G-140); keep pp- for Paper alone');
});

test('the R1 shell: announce bar, Paper nav and footer on every page with a nav', () => {
  const nav = read('src/components/Nav.astro');
  assert.match(nav, /<AnnounceBar href="\/domains\/"[^>]*>Flow \{FLOW_VERSION\} is out\./, 'the announce bar (D6) reads the version from flow-release.json');
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
  assert.match(notFound, /<Layout [^>]*noindex>/);
  assert.match(notFound, /<Nav \/>[\s\S]*<Footer showDownload=\{false\} \/>/);
});

test('Layout keeps Living Systems as the default design', () => {
  const src = read('src/layouts/Layout.astro');
  assert.match(src, /design = 'living'/);
  assert.match(src, /'living-site bg-surface text-text min-h-screen'/);
});

test('each Fold belongs to a published Domain, and sample clients come from its blueprint', () => {
  const folds = read('src/lib/paper/folds.ts');
  const cast = read('src/lib/paper/cast.ts');
  const slugs = [...folds.matchAll(/domainSlug: '([a-z0-9-]+)'/g)].map((m) => m[1]);
  assert.equal(slugs.length, 8);
  for (const slug of slugs) assert.ok(existsSync(path.join(root, `src/content/domains/${slug}.md`)), `${slug} is not a published Domain`);
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
  assert.match(src, /const domainTop = top\(domains\);/, 'Domains list five in all, like the old menu');
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
