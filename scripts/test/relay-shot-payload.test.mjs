import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const index = JSON.parse(readFileSync(new URL('../../src/data/relay-shots.json', import.meta.url), 'utf8'));
const limits = new Map([
  [720, 64 * 1024],
  [1280, 140 * 1024],
  [1600, 180 * 1024],
]);

for (const [id, shot] of Object.entries(index)) {
  for (const theme of ['light', 'dark']) {
    const variants = shot[theme].srcset.split(', ').map((candidate) => {
      const [src, descriptor] = candidate.split(' ');
      return { src, width: Number(descriptor.replace(/w$/, '')) };
    });
    assert.deepEqual(variants.map(({ width }) => width), [...limits.keys()], `${id}/${theme}: responsive widths`);
    assert.equal(shot[theme].src, variants.find(({ width }) => width === 1280).src, `${id}/${theme}: fallback width`);
    for (const variant of variants) {
      const bytes = statSync(new URL(`../../public${variant.src}`, import.meta.url)).size;
      assert.ok(
        bytes <= limits.get(variant.width),
        `${id}/${theme}/${variant.width} is ${bytes} bytes (limit ${limits.get(variant.width)})`,
      );
    }
  }
}

console.log(`relay-shot-payload: ${Object.keys(index).length} pairs pass responsive byte ceilings`);
