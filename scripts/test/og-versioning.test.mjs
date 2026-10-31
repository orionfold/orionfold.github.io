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

test('a renderer revision refreshes every card URL without changing paths or alts', async () => {
  const revision = /const OG_RENDERER_VERSION = '([^']+)';/;
  assert.match(source, revision);
  const current = await loadOg(source);
  const revised = await loadOg(source.replace(revision, (_, version) => `const OG_RENDERER_VERSION = '${version}-test';`));
  for (const route of Object.keys(current.OG_PAGES)) {
    const before = current.ogMeta(route);
    const after = revised.ogMeta(route);
    assert.equal(after.alt, before.alt, route);
    assert.equal(after.image.split('?')[0], before.image.split('?')[0], route);
    assert.notEqual(after.image, before.image, route);
  }
});
