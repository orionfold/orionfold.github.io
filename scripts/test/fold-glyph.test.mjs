// Guards the one-colour Fold glyph contract the Flow app's toolbar relies on
// (Paper 0.3.4, product lane ask 2026-10-31): one path, one fill, no strokes,
// gradients or shadow, a square 0 0 100 100 box with 8% padding on the longer
// side, deterministic output, and eyes kept as a pair or dropped as a pair.
import test from 'node:test';
import assert from 'node:assert/strict';
import { foldGlyph } from '../lib/fold-glyph.mjs';
import { FOLDS, foldShapes } from '../../src/lib/paper/folds.ts';
import { PERSONAL_FOLDS, colorwayById } from '../../src/lib/paper/personal-folds.ts';

const ALL = [
  ...FOLDS.map((f) => [f.id, foldShapes(f)]),
  ...PERSONAL_FOLDS.map((f) => { const c = colorwayById[f.defaultColorway]; return [f.id, f.draw(c.a, c.b, c.c)]; }),
];

test('every Fold has a glyph', () => assert.equal(ALL.length, 16));

for (const [id, inner] of ALL) {
  test(`${id}: one path, one fill, nothing else`, () => {
    const { svg } = foldGlyph(inner, { label: id });
    assert.match(svg, /viewBox="0 0 100 100"/);
    assert.equal((svg.match(/<path\b/g) || []).length, 1);
    assert.doesNotMatch(svg, /stroke|gradient|filter|opacity|<(circle|polygon|ellipse|rect|g)\b/);
    assert.deepEqual([...new Set([...svg.matchAll(/fill="([^"]+)"/g)].map((m) => m[1]))], ['#000']);
  });

  test(`${id}: centred in the box with 8% padding on the longer side`, () => {
    const { d } = foldGlyph(inner);
    const n = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map(Number);
    const xs = n.filter((_, i) => i % 2 === 0), ys = n.filter((_, i) => i % 2 === 1);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    assert.ok(Math.abs(Math.max(x1 - x0, y1 - y0) - 84) < 0.1, `longer side ${Math.max(x1 - x0, y1 - y0)}`);
    assert.ok(Math.abs((x0 + x1) / 2 - 50) < 0.1 && Math.abs((y0 + y1) / 2 - 50) < 0.1, 'centred');
  });

  test(`${id}: same drawing, same glyph`, () => assert.equal(foldGlyph(inner).d, foldGlyph(inner).d));
}

test('eyes too close for the body are dropped as a pair, never one', () => {
  const body = '<polygon points="90,60 110,60 110,160 90,160" fill="#333"/>';
  const eye = (x) => `<circle cx="${x}" cy="80" r="2.6" fill="#171c1a"/>`;
  const plain = foldGlyph(body).parts;
  assert.equal(foldGlyph(body + eye(96) + eye(104)).parts, plain);
});
