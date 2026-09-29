// Guards the one-icon-system rule for Flow mocks and diagrams (2026-09-29):
// glyphs come from Lucide via src/lib/flow-icons.ts, file marks keep a
// transparent fold, captions stay one line, and no card uses a colored
// left-edge strip as its accent.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

test('path diagram draws every glyph from the Lucide icon map', () => {
  const src = read('src/components/flow/mocks/PathDiagram.astro');
  assert.match(src, /from '..\/..\/..\/lib\/flow-icons'/);
  assert.doesNotMatch(src, /<path d=/, 'no hand-drawn icon paths');
  const map = read('src/lib/flow-icons.ts');
  assert.match(map, /@lucide\/astro\/icons\//);
});

test('file marks have no opaque fold square and captions stay on one line', () => {
  const css = read('src/styles/flow-mocks.css');
  assert.doesNotMatch(css, /\.pd-file::before/);
  assert.match(css, /\.pd-caption span \{[^}]*white-space: nowrap/);
});

test('mock cards never use a colored left-edge strip', () => {
  for (const p of ['src/styles/flow-mocks.css', 'src/components/flow/mocks/FlowHeroMock.astro', 'src/styles/living-flow.css', 'src/styles/living-manifesto.css']) {
    assert.doesNotMatch(read(p), /inset \d+px 0 /, `${p}: inset left strip`);
  }
});
