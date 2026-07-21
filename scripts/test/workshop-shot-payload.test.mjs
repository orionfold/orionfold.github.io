import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const stages = ['start', 'inspect', 'adapt', 'govern', 'run', 'retain', 'finish'];

test('workshop landing screenshots are complete, responsive, and payload bounded', async () => {
  const index = JSON.parse(await readFile(new URL('src/data/training-workshop-shots.json', root), 'utf8'));
  assert.deepEqual(Object.keys(index), stages);
  for (const stage of stages) {
    assert.equal(index[stage].width, 1274);
    assert.equal(index[stage].height, 717);
    for (const theme of ['light', 'dark']) {
      const variants = index[stage][theme].variants;
      assert.deepEqual(variants.map((variant) => variant.width), [720, 1274]);
      for (const variant of variants) {
        const file = new URL(`public${variant.src}`, root);
        const bytes = (await stat(file)).size;
        assert.equal(bytes, variant.bytes);
        assert.ok(bytes <= (variant.width === 720 ? 90_000 : 160_000), `${stage}-${theme}-${variant.width} is ${bytes} bytes`);
      }
    }
  }
});
