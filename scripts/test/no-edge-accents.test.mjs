// No one-edge accents (operator 2026-10-27): a box never gets one edge drawn
// thicker or in another colour than its other edges, whether a stripe down the
// left of a rounded card or a bar along its top or bottom. It is a stock
// "AI slop" tell. Emphasis comes from the box's fill, its whole border, type
// or an icon instead.
//
// The scan finds single-side borders of 2px or more and single-side inset
// shadows in every stylesheet and component <style>. TYPOGRAPHIC entries are
// conventions, not cards. PENDING entries are card-like accents that predate
// the rule and wait for the operator's call (none left as of 2026-10-27).
// Nothing new may join either list without the operator.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = new URL('../../', import.meta.url).pathname;
const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = path.join(d, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

const TYPOGRAPHIC = {
  'src/components/flow/FlowChatShowcase.astro .fc-quote': 'quotation rule',
  'src/components/flow/FlowChatShowcase.astro .fc-cover': 'the spine of a drawn book cover',
  'src/styles/flow-paths.css .fp-prose blockquote': 'quotation rule',
  'src/styles/global.css .story-prose blockquote': 'quotation rule',
  'src/styles/living-essay.css .ls-essay-reading blockquote': 'quotation rule',
  'src/styles/living-system.css .living-site .story-prose blockquote': 'quotation rule',
  'src/styles/flow-starting-documents.css .ls-starting-excerpt': 'quoted excerpt rule',
  'src/styles/flow-mocks.css .dm-flowchart i::after': 'an arrowhead drawn with borders',
  'src/pages/proposal.astro .document-totals div:last-child': 'the rule above a total',
  'src/components/sections/HeroMissionPanel.astro .hero-mission-panel': 'a 1px light sheen, not a colour',
};
// The seven older card accents were fixed 2026-10-27 (operator); keep this empty.
const PENDING = {};

const SIDE = /border-(top|right|bottom|left|inline-start|inline-end|block-start|block-end)(?:-width)?\s*:\s*([0-9.]+)px/g;
const INSET = /inset\s+(-?[0-9.]+)(?:px)?\s+(-?[0-9.]+)(?:px)?\s+0(?:px)?\s+(?:0(?:px)?\s+)?(?!0)[^,;]+/g;

function edgeAccents() {
  const found = [];
  for (const abs of [...walk(path.join(root, 'src/styles')), ...walk(path.join(root, 'src/components')), ...walk(path.join(root, 'src/pages')), ...walk(path.join(root, 'src/layouts'))]) {
    if (!/\.(css|astro)$/.test(abs)) continue;
    const rel = path.relative(root, abs);
    let css = readFileSync(abs, 'utf8');
    if (rel.endsWith('.astro')) css = [...css.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n') + [...css.matchAll(/style="([^"]*)"/g)].map((m) => `[inline]{${m[1]}}`).join('\n');
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const side = [...body.matchAll(SIDE)].some((s) => Number(s[2]) >= 2);
      const inset = [...body.matchAll(INSET)].some((s) => (Number(s[1]) === 0) !== (Number(s[2]) === 0));
      if (side || inset) found.push(`${rel} ${sel.trim().replace(/\s+/g, ' ')}`);
    }
  }
  return found;
}

test('no box gets one edge accented unless it is a listed convention or a pending fix', () => {
  const found = edgeAccents();
  const unlisted = found.filter((k) => !(k in TYPOGRAPHIC) && !(k in PENDING));
  assert.deepEqual(unlisted, [], 'one-edge accent: give the box an even border, a fill, type or an icon instead');
  for (const k of [...Object.keys(TYPOGRAPHIC), ...Object.keys(PENDING)]) assert.ok(found.includes(k), `${k} is gone: take it off the list`);
});

// The scan cannot see a bar positioned along an edge, so the two stepped
// product mocks are checked by name: their step time runs as a ring.
test('the stepped product mocks keep step time as a ring, not an edge bar', () => {
  for (const [file, prefix] of [['FlowElementsShowcase', 'fx'], ['FlowChatShowcase', 'fc']]) {
    const src = readFileSync(path.join(root, `src/components/flow/${file}.astro`), 'utf8');
    assert.doesNotMatch(src, new RegExp(`${prefix}-tab-bar|inset 3px 0 0`), file);
    assert.match(src, new RegExp(`${prefix}-tab-ring`), file);
  }
});
