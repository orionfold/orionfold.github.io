import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const globalCssUrl = new URL('../../src/styles/global.css', import.meta.url);

test('reduced motion overrides the homepage book float after its normal rule', async () => {
  const css = await readFile(globalCssUrl, 'utf8');
  const normalRuleAt = css.indexOf('animation: bookFloat 6s ease-in-out infinite;');
  const reducedRuleAt = css.lastIndexOf('animation: none;');

  assert.ok(normalRuleAt !== -1, 'the normal cinematic book float must remain');
  assert.ok(
    reducedRuleAt > normalRuleAt,
    'the reduced-motion override must win source order over the normal animation',
  );
});
