// The two marketing export scripts must run under plain Node type stripping.
//
// WHY THIS EXISTS. Found 2026-10-10 (ops PR #134): marketing's catalog and
// content syncs run `npm run export:catalog` and `npm run export:content`,
// which use `node --experimental-strip-types`. Node does not add `.ts` to a
// relative import, so one value import without the extension
// (`from './launch'` in src/data/software.ts, added 08-22) broke both scripts
// for seven weeks while the Astro build stayed green. Type-only imports are
// erased and do not matter; a value import must name its `.ts` file.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

for (const name of ['export-catalog', 'export-content']) {
  test(`${name} runs under node --experimental-strip-types and prints JSON`, () => {
    const out = execFileSync(
      process.execPath,
      ['--experimental-strip-types', '--no-warnings', `scripts/${name}.ts`],
      { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );
    const data = JSON.parse(out);
    assert.ok(data && typeof data === 'object', `${name} printed a JSON object`);
  });
}
