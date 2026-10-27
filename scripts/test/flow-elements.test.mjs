// Flow Elements (/flow/elements/): the landing, the five articles of the
// Elements set, and the nav's five picks (operator 2026-10-26).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { publishElementsBody, splitElements, drawingSvg, SET } from '../sync-flow-elements.mjs';

const root = new URL('../../', import.meta.url);
const read = (rel) => readFileSync(new URL(rel, root), 'utf8');
const built = (route) => read(`dist${route}index.html`);
const index = JSON.parse(read('src/data/flow-elements.json'));

test('the element index covers every sidebar card, each with the app’s drawing, a tint and a line', () => {
  const counts = Object.fromEntries(index.categories.map((c) => [c.slug, c.items.length]));
  assert.deepEqual(counts, { components: 15, agency: 12, skills: 19, 'chart-kinds': 54 });
  for (const c of index.categories) {
    for (const item of c.items) {
      const svg = read(`src/assets/flow/elements/icons/${item.card}.svg`);
      assert.match(svg, /^<svg [^>]*viewBox=/, `${item.card} is the app's vector drawing`);
      assert.doesNotMatch(svg, /#000/, `${item.card} draws in currentColor`);
      assert.match(item.tint, /^#[0-9a-f]{6}$/, `${item.card} has a tint`);
      assert.ok(existsSync(new URL(`src/content/element-items/${c.slug}/${item.anchor}.md`, root)), `${item.name} has its own section`);
      assert.ok(item.line.length > 10 && !item.line.includes('!['), `${item.name}: a plain one-line description`);
    }
  }
});

test('every element opens its own panel on its category page', { skip: !existsSync(new URL('dist/flow/elements/index.html', root)) }, () => {
  const landing = built('/flow/elements/');
  for (const c of index.categories) {
    const html = built(`/flow/elements/${c.slug}/`);
    for (const item of c.items) {
      assert.match(html, new RegExp(`<article class="fe-v-panel" id="${item.anchor}"`), `${c.slug}#${item.anchor} (${item.name}) is a panel`);
      assert.match(html, new RegExp(`href="#${item.anchor}" data-fe-tab="${item.anchor}"`), `${item.name} is in the viewer's list`);
      assert.ok(landing.includes(`href="/flow/elements/${c.slug}/#${item.anchor}"`), `the landing links ${item.name}`);
    }
  }
});

test('the nav shows five Elements with their drawings, and the footer links the landing', { skip: !existsSync(new URL('dist/flow/elements/index.html', root)) }, () => {
  const lib = read('src/lib/flow/elements.ts');
  const picks = [...lib.match(/const NAV_PICKS = \[([^\]]+)\]/)[1].matchAll(/'([\w-]+)'/g)].map((m) => m[1]);
  assert.equal(picks.length, 5);
  const all = index.categories.flatMap((c) => c.items.map((i) => i.card));
  for (const p of picks) assert.ok(all.includes(p), `${p} is a real element`);
  const home = built('/');
  assert.equal((home.match(/class="living-nav-dd-thumb"/g) ?? []).length, 5, 'five thumbnails in the Elements dropdown');
  assert.match(home, /href="\/flow\/elements\/"[^>]*>\s*Elements/);
  assert.match(read('src/components/Footer.astro'), /href: '\/flow\/elements\/', label: 'Elements'/);
});

test('the published bodies use the Flow 3.0 voice and link the set together', () => {
  for (const { slug } of SET) {
    const body = read(`src/content/elements/${slug}.md`);
    assert.match(body, /^release: "3\.0"$/m, `${slug} is written for Flow 3.0`);
    assert.doesNotMatch(body, /press release we would want|feature['’]s promise|not in a release|next release|ARTICLE\.md\)/i, `${slug}: no draft framing or repo links`);
    assert.match(body, /^## What Flow does$/m);
    assert.doesNotMatch(body, /card in Elements\]/, `${slug}: card captures are drawn as vectors, not shown as shots`);
    for (const m of body.matchAll(/\]\((\.\.\/\.\.\/assets\/flow\/elements\/[^)]+)\)/g)) {
      assert.ok(existsSync(new URL(`src/content/elements/${m[1]}`, root)), `${slug}: ${m[1]} exists`);
    }
  }
  assert.ok(read('src/content/elements/tour.md').includes('](/flow/elements/components/)'), 'the tour links its groups');
});

test('the sync rewrites a draft article and gives each card its own section', () => {
  const draft = [
    '# Title', '', '*The standfirst.*', '', '![Hero](shots/01-hero.png)', '',
    '## The press release we would want to write', '', 'Body.', '',
    '> "A quote."', '> — *The feature\'s promise, in our words.*', '',
    'See [Skills](../22-elements-skills/ARTICLE.md).', '',
    '## Every component', '', 'Each one below.', '',
    '### Callout', '', '![The Callout card in Elements](shots/cards/component-callout.png)', '', 'A note in the Reader. It has a bar.', '', '![Drawn](shots/04-callout.png)', '',
    '### Section, Hero and Bento', '', '![The Section card in Elements](shots/cards/component-section.png)', '![The Hero card in Elements](shots/cards/component-hero.png)', '',
    '**Section** groups things. **Hero** holds two.', '',
    '## The numbers', '', '| a | b |',
  ].join('\n');
  const out = publishElementsBody(draft, { slug: 'components' });
  assert.equal(out.dek, 'The standfirst.');
  assert.equal(out.hero.name, '01-hero');
  assert.match(out.body, /^## What Flow does$/m);
  assert.doesNotMatch(out.body, /A quote|feature's promise|01-hero/);
  assert.match(out.body, /\]\(\/flow\/elements\/skills\/\)/);
  const split = splitElements(out.body, { slug: 'components', cards: 'component', container: 'Every component', end: 'The numbers', depth: 3 });
  assert.doesNotMatch(split.framing, /Callout|Every component/);
  assert.match(split.framing, /^## The numbers$/m);
  assert.deepEqual(split.items.map((i) => [i.name, i.anchor, i.line, i.shared]), [
    ['Callout', 'callout', 'A note in the Reader.', false],
    ['Section', 'section', 'Section groups things.', true],
    ['Hero', 'hero', 'Hero holds two.', true],
  ]);
  assert.match(split.items[0].body, /^It has a bar\.\n\n!\[Drawn\]\(\.\.\/\.\.\/assets\/flow\/elements\/components\/04-callout\.webp\)$/);
  assert.equal(drawingSvg('<svg viewBox="0 0 64 64" stroke="#000"><path fill="#000"/></svg>'), '<svg aria-hidden="true" focusable="false" viewBox="0 0 64 64" stroke="currentColor"><path fill="currentColor"/></svg>');
});

test('component snippets are coloured as YAML, and prose inline-code styling stays out of code blocks', { skip: !existsSync(new URL('dist/flow/elements/index.html', root)) }, async () => {
  const { isFlowuiBlock } = await import('../../src/lib/prose/flowui-grammar.mjs');
  assert.ok(isFlowuiBlock('markdown', '```flowui\ncomponent: Callout\n```'));
  assert.ok(!isFlowuiBlock('markdown', '# Title\n\n```flowui\na: b\n```'), 'only a block that is one fence');
  const html = built('/flow/elements/components/');
  const blocks = html.match(/<pre class="astro-code[^"]*"[^>]*data-language="flowui-block"/g) ?? [];
  assert.equal(blocks.length, 16, 'every component snippet is highlighted');
  assert.match(html, /<span style="color:#85E89D">component<\/span>/, 'YAML keys take their own colour');
  assert.match(read('src/styles/essays.css'), /\.ed-prose :not\(pre\) > code \{/, 'the inline-code box only styles inline code');
  assert.doesNotMatch(read('src/styles/flow-elements.css'), /inset 3px 0 0/, 'no left-edge bar on the chosen element');
});

test('Elements is shown on the homepage right under the hero, with the walk’s own plan', { skip: !existsSync(new URL('dist/index.html', root)) }, () => {
  // Operator 2026-10-27: "move flow elements section ... to home, below hero". No
  // section is on both pages, so /flow/ keeps only its Elements hero and links out.
  const page = read('src/pages/index.astro');
  const order = ['<HomeHero', '<FlowElementsShowcase', '<FlowDomainsBand'].map((m) => page.indexOf(m));
  assert.ok(order.every((i) => i > 0) && order[0] < order[1] && order[1] < order[2], 'Elements sits between the hero and Domains');
  assert.doesNotMatch(read('src/pages/flow.astro'), /<FlowElementsShowcase/);
  const src = read('src/components/flow/FlowElementsShowcase.astro');
  // The Ideas suggestions, the figure's hours and the table are the walk's; the caption says what is drawn here.
  for (const fact of ['about 18 s', '140 hours', '96 hours', '48 hours', '28 hours', 'Step</th><th>Who</th><th>Action</th><th>When', 'the chart is drawn here from the plan']) assert.ok(src.includes(fact), fact);
  assert.doesNotMatch(src, /54 chart types|AI-generated/i);
  const home = built('/');
  assert.equal((home.match(/data-fx-go=/g) ?? []).length, 5, 'five steps');
  for (const slug of ['components', 'agency', 'skills', 'chart-kinds', 'tour']) assert.ok(home.includes(`href="/flow/elements/${slug}/"`), `links ${slug}`);
});
