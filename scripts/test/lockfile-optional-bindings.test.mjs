// Every optional dependency a locked package declares must itself be locked.
//
// WHY THIS EXISTS. Found 2026-09-29: `npm install <pkg>` on this Mac rewrote
// package-lock.json and silently dropped all 16 `@rolldown/binding-*` entries,
// keeping only the darwin one it had just installed. The local build stayed
// green, but `npm ci` on the Linux runner then has no linux-x64 binding to
// install and the build dies. Native toolchains (rolldown, esbuild,
// lightningcss, sharp) all ship this way: one optional package per platform.
//
// The check is general on purpose. It walks every locked package's
// optionalDependencies and resolves each one the way npm does (nested
// node_modules first, then each parent up to the root), so it keeps working
// when rolldown's version or platform list changes. The fix when it fails:
// restore the previous lockfile, merge in only the new package's entries, and
// confirm with `npm ci`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const lock = JSON.parse(readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8'));
const packages = lock.packages;

function resolves(from, dep) {
  let base = from;
  for (;;) {
    if (packages[`${base ? `${base}/` : ''}node_modules/${dep}`]) return true;
    if (!base) return false;
    const cut = base.lastIndexOf('/node_modules/');
    base = cut < 0 ? '' : base.slice(0, cut);
  }
}

test('every optional platform dependency is present in package-lock.json', () => {
  const missing = [];
  for (const [path, meta] of Object.entries(packages)) {
    for (const dep of Object.keys(meta.optionalDependencies ?? {})) {
      if (!resolves(path, dep)) missing.push(`${path || '(root)'} -> ${dep}`);
    }
  }
  assert.deepEqual(missing, [], 'optional deps pruned from the lockfile; restore it and merge only the new entries');
});

test('rolldown keeps a Linux x64 binding for the CI runner', () => {
  assert.ok(packages['node_modules/rolldown'], 'rolldown is expected in the lockfile');
  assert.ok(packages['node_modules/@rolldown/binding-linux-x64-gnu'], 'linux-x64-gnu binding missing: CI `npm ci` will break');
});
