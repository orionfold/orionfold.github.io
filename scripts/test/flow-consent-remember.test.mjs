// Flow 2.2 added "Don't ask again for <destination>" to the Leaves this Mac
// sheet (ops PR #129, orionfold-flow 0251 D10). It starts unticked, so the
// first run still asks, but the site may no longer draw or describe the sheet
// as if Allow Once were the only way through. Website promised this rewording
// in ops entry 2026-10-05-1147-website-consent-sheet-answer.md.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

test('every consent mock in the path showcase names its Don\'t ask again line', () => {
  const src = read('src/data/flow-path-showcase.ts');
  const blocks = src.match(/\{ kind: 'consent', [^\n]*/g) ?? [];
  assert.ok(blocks.length >= 2, 'found the consent mocks');
  for (const b of blocks) assert.match(b, /remember: '[^']+'/, b.slice(0, 80));
  assert.match(read('src/components/flow/mocks/DocMock.astro'), /Don’t ask again for \{b\.remember\}/);
});

test('the agents-reviewed card draws the unticked Don\'t ask again line', () => {
  assert.match(read('src/components/flow/FlowAgentsReviewed.astro'), /Don’t ask again for Codex CLI · Codex subscription/);
});

for (const page of ['claude-code', 'codex']) {
  test(`compare/${page} does not present Allow Once as the only way through`, () => {
    const md = read(`src/content/compare/${page}.md`);
    if (/Allow Once/.test(md)) assert.match(md, /Don't ask again/);
  });
}
