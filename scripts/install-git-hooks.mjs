#!/usr/bin/env node
// Install the tracked git hooks into this checkout.
//
// Runs from `npm run hooks:install` and from the package `prepare` script, so
// every `npm install` in a clone wires the pre-push gate. It is a silent no-op
// in CI and in any directory that is not a git checkout (a tarball, a
// worktree-less export), so `npm ci` in the deploy workflow is unaffected.
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HOOKS = ['pre-push'];

function main() {
  if (process.env.CI || process.env.GITHUB_ACTIONS) return 0;
  const gitDir = spawnSync('git', ['rev-parse', '--git-dir'], { cwd: ROOT, encoding: 'utf8' });
  if (gitDir.status !== 0) return 0;
  const hooksPath = spawnSync('git', ['config', '--get', 'core.hooksPath'], { cwd: ROOT, encoding: 'utf8' });
  const target = hooksPath.status === 0 && hooksPath.stdout.trim()
    ? resolve(ROOT, hooksPath.stdout.trim())
    : resolve(ROOT, gitDir.stdout.trim(), 'hooks');
  mkdirSync(target, { recursive: true });

  for (const hook of HOOKS) {
    const source = resolve(ROOT, 'scripts/git-hooks', hook);
    const destination = resolve(target, hook);
    if (existsSync(destination) && readFileSync(destination, 'utf8') === readFileSync(source, 'utf8')) {
      continue;
    }
    if (existsSync(destination) && !readFileSync(destination, 'utf8').includes('orionfold-website')) {
      copyFileSync(destination, `${destination}.before-orionfold`);
      console.log(`[git-hooks] kept your previous ${hook} as ${hook}.before-orionfold`);
    }
    copyFileSync(source, destination);
    chmodSync(destination, 0o755);
    console.log(`[git-hooks] installed ${hook} -> ${destination}`);
  }
  return 0;
}

process.exit(main());
