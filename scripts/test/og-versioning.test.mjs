import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = readFileSync(path.join(root, 'src/data/og.ts'), 'utf8');
async function loadOg(contents) {
  const result = await build({
    stdin: { contents, resolveDir: path.join(root, 'src/data'), sourcefile: 'og.ts', loader: 'ts' },
    bundle: true, write: false, platform: 'node', format: 'esm',
    define: { 'import.meta.env.DEV': 'false' },
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

const livingRoutes = ['/', '/essay/', '/flow/', '/flow/living-documents/', '/flow/night-shift/', '/flow/settings/', '/manifesto/'];

test('Living renderer revisions refresh all seven card URLs without changing other cards', async () => {
  const revision = /const LIVING_OG_RENDERER_VERSION = '([^']+)';/;
  assert.match(source, revision);
  const current = await loadOg(source);
  const revised = await loadOg(source.replace(revision, (_, version) => `const LIVING_OG_RENDERER_VERSION = '${version}-test';`));
  const changed = [];
  for (const [route, page] of Object.entries(current.OG_PAGES)) {
    const before = current.ogMeta(route);
    const after = revised.ogMeta(route);
    assert.equal(after.alt, before.alt, route);
    assert.equal(after.image.split('?')[0], before.image.split('?')[0], route);
    if (page.living) {
      assert.notEqual(after.image, before.image, route);
      changed.push(route);
    } else {
      assert.deepEqual(after, before, route);
    }
  }
  assert.deepEqual(changed.sort(), livingRoutes);
});
