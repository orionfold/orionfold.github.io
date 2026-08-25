// Text tokens must stay readable. Added 2026-08-16.
//
// The pre-2026-08-16 palette failed this outright: --color-text-dim measured
// 2.49:1 on the light canvas (it carries the mono fine print under every stat
// and caption) and the cyan --color-primary measured 3.16:1 as small type (it
// carried every section kicker). The page read "faded" because it literally
// was, and the fine print was below the accessibility floor.
//
// The fix that this test protects has two halves:
//   1. muted/dim were darkened on the light surface;
//   2. an --color-accent-ink token was added, because the brand cyan is fine
//      as a BUTTON FILL (measured against white button text) and not fine as
//      TYPE on the page canvas. Small accent text uses the ink; fills keep the
//      accent. Never "fix" a contrast failure by swapping the fill colour.
//
// Ratios are computed against BOTH surface levels, because a card sits on
// --color-surface-raised while the section around it sits on --color-surface.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../../src/styles/global.css', import.meta.url), 'utf8');

/** Pull a hex-valued token out of a CSS block. */
const tokenIn = (block, name) => {
  const match = block.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `${name} must be a plain hex value so contrast is checkable here`);
  return match[1];
};

const relativeLuminance = (hex) =>
  hex
    .slice(1)
    .match(/\w\w/g)
    .map((pair) => {
      const channel = parseInt(pair, 16) / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, channel, i) => sum + channel * [0.2126, 0.7152, 0.0722][i], 0);

const contrast = (a, b) => {
  const [x, y] = [relativeLuminance(a), relativeLuminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

// The public site has one light palette in the @theme block.
const lightBlock = css.slice(css.indexOf('@theme {'));

const AA = 4.5;

for (const [themeName, block] of [['light', lightBlock]]) {
  test(`${themeName} theme text tokens meet WCAG AA on both surface levels`, () => {
    const canvas = tokenIn(block, '--color-surface');
    const raised = tokenIn(block, '--color-surface-raised');

    for (const token of ['--color-text', '--color-text-muted', '--color-text-dim', '--color-accent-ink']) {
      const value = tokenIn(block, token);
      for (const [surfaceName, surface] of [['surface', canvas], ['surface-raised', raised]]) {
        const ratio = contrast(value, surface);
        assert.ok(
          ratio >= AA,
          `${token} (${value}) on ${surfaceName} (${surface}) in ${themeName} is ${ratio.toFixed(2)}:1, below the ${AA}:1 floor`,
        );
      }
    }
  });
}

test('the accent ink is a distinct token from the accent fill', () => {
  // If these ever collapse to one value on light, small accent text silently
  // drops back to the 3.16:1 that motivated the split.
  // Anchored so "--color-accent" cannot match "--color-accent-hover" etc.
  const lightAccent = lightBlock.match(/--color-accent:\s*(#[0-9a-fA-F]{6})/)?.[1];
  assert.ok(lightAccent, 'the light accent fill must be a plain hex value');
  const lightInk = tokenIn(lightBlock, '--color-accent-ink');
  assert.notEqual(
    lightInk,
    lightAccent,
    'on light, accent ink must stay darker than the accent fill or small accent text fails AA',
  );
});

test('small accent text uses the ink token, never the raw fill', () => {
  // .of-text-action is the shared inline-link primitive; it is the one most
  // likely to be "simplified" back to var(--color-accent) by a later edit.
  // `.of-text-action` is declared more than once (one block carries the shared
  // action layout, another the colour), so check that SOME block sets the ink
  // and that no block sets the raw fill.
  const blocks = [...css.matchAll(/\n\.of-text-action \{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(blocks.length, '.of-text-action must keep its own rule');
  assert.ok(
    blocks.some((b) => /color:\s*var\(--color-accent-ink\)/.test(b)),
    '.of-text-action must use the accent ink so inline links clear AA',
  );
  assert.ok(
    !blocks.some((b) => /(?<!-)color:\s*var\(--color-accent\)\s*;/.test(b)),
    '.of-text-action must not fall back to the accent fill (3.16:1 as small type)',
  );
});
