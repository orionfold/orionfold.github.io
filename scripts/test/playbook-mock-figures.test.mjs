// Playbook mocks draw real charts and diagrams, never the Element's icon
// (operator 2026-10-31: "it feels lazy; animate draw the chart/diagram").
// Every chart, diagram or skill block a Playbook names must have a drawn
// figure, and each figure must carry the motion classes DomainMock animates.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { MOCK_FIGURE_CARDS, mockFigure } from '../../src/lib/flow/mock-figures.ts';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const INDEX = JSON.parse(read('src/data/flow-elements.json'));
const ALL = INDEX.categories.flatMap((c) => c.items);
const mock = read('src/components/flow/domains/DomainMock.astro');
// The non-drawing families, read from DomainMock itself so the two never drift.
const FAMILY_CARDS = new Set([...mock.match(/const FAMILY[\s\S]*?\n\};/)[0].matchAll(/'([a-z0-9-]+)':/g)].map((m) => m[1]));

function cardFor(block) {
  const [name, rest] = block.split(' · ').map((s) => s.trim());
  if (name === 'Publish' || name === 'Update') return null;
  if ((name === 'Chart' || name === 'Diagram') && rest) {
    const n = rest.toLowerCase();
    return ALL.find((e) => e.card.startsWith('kind-') && (e.name.toLowerCase() === n || e.name.toLowerCase() === `${n} chart` || e.name.toLowerCase() === `${n} diagram` || e.name.toLowerCase().startsWith(n)))?.card;
  }
  return ALL.find((e) => e.name.toLowerCase() === name.toLowerCase())?.card;
}

test('every chart, diagram or skill a Playbook mock names has a drawn figure', () => {
  const dir = new URL('../../src/content/domains/', import.meta.url);
  const missing = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    for (const m of readFileSync(new URL(f, dir), 'utf8').matchAll(/block:\s*["']?([^"'\n]+)/g)) {
      const card = cardFor(m[1].trim());
      if (card && !FAMILY_CARDS.has(card) && !MOCK_FIGURE_CARDS.includes(card)) missing.push(`${f}: ${m[1].trim()} (${card})`);
    }
  }
  assert.deepEqual(missing, []);
});

test('each figure draws with the motion classes, and DomainMock animates them', () => {
  for (const card of MOCK_FIGURE_CARDS) {
    const svg = mockFigure(card);
    assert.match(svg, /^<svg class="mf" viewBox="0 0 320 112"/, card);
    assert.match(svg, /class="mf-(g|gx|s|p)"/, `${card} has parts that animate`);
    assert.doesNotMatch(svg, /<text/, `${card} shows no words; only the page's names are on screen`);
  }
  assert.match(mock, /mockFigure\(el\.card\)/);
  assert.match(mock, /has no drawn figure/, 'a drawing block without a figure fails the build');
  for (const kf of ['dmk-grow', 'dmk-grow-x', 'dmk-stroke', 'dmk-pop']) assert.match(mock, new RegExp(`@keyframes ${kf}`));
});

test('Chat proposes after existing content, as Review Changes does, never into a blank', () => {
  // App behavior (first-time onboarding §11–12): the document keeps its text; the
  // change shows "Proposed" in place after the selected text, then lands there.
  const scene = mock.slice(mock.indexOf('<div class="dmk-doc">'), mock.indexOf('<aside class="dmk-chat">'));
  const ins = scene.indexOf("class:list={['dmk-ins'");
  assert.ok(ins > 0 && scene.lastIndexOf('dmk-lines', ins) > 0, 'existing text sits before the insert');
  assert.ok(scene.indexOf('dmk-after', ins) > ins, 'existing text continues after the insert');
  assert.match(scene, /<p class="dmk-prop">Proposed<\/p>/);
  assert.match(mock, /\.dmk-ins \{ display: grid; grid-template-rows: 0fr; \}/, 'the insert takes no room until it opens');
  assert.match(mock, /@keyframes dmk-open \{ to \{ grid-template-rows: 1fr; \} \}/);
  assert.match(mock, /@keyframes dmk-scroll/, 'the document scrolls to the change when it would end out of view');
});
