#!/usr/bin/env node
// One-way Relay _ASSETS -> Website demo sync.
//
// Relay owns the captured app and behavior. Website owns only the public mount
// and search/deploy integration, which prepare-relay-demo.mjs applies after
// this exact copy.
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_ASSETS_ROOT = '/Users/manavsehgal/orionfold/relay/_ASSETS';
const EXPECTED_BASE_PATH = '/relay/demo/';
const EXPECTED_ROUTE_COUNT = 25;

function countFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).reduce(
    (count, entry) => count + (entry.isDirectory() ? countFiles(join(dir, entry.name)) : 1),
    0,
  );
}

export function syncRelayDemo({ assetsRoot = DEFAULT_ASSETS_ROOT } = {}) {
  const sourceRoot = join(assetsRoot, 'demo/dist');
  const sourceDemo = join(sourceRoot, 'relay/demo');
  const sourceBrand = join(sourceRoot, 'brand');
  const manifest = JSON.parse(readFileSync(join(sourceDemo, 'build-manifest.json'), 'utf8'));
  if (manifest.ok !== true) throw new Error('Relay demo source manifest is not green');
  if (manifest.basePath !== EXPECTED_BASE_PATH) {
    throw new Error(`Relay demo base path must be ${EXPECTED_BASE_PATH}; got ${manifest.basePath}`);
  }
  if (!Array.isArray(manifest.routes) || manifest.routes.length !== EXPECTED_ROUTE_COUNT) {
    throw new Error(`Relay demo must expose ${EXPECTED_ROUTE_COUNT} routes; got ${manifest.routes?.length ?? 'none'}`);
  }

  const targetDemo = join(REPO_ROOT, 'public/relay/demo');
  const targetBrand = join(REPO_ROOT, 'public/brand');
  rmSync(targetDemo, { recursive: true, force: true });
  mkdirSync(dirname(targetDemo), { recursive: true });
  cpSync(sourceDemo, targetDemo, { recursive: true });
  rmSync(targetBrand, { recursive: true, force: true });
  cpSync(sourceBrand, targetBrand, { recursive: true });
  writeFileSync(join(targetDemo, '.nojekyll'), '');

  return {
    routes: manifest.routes.length,
    demoFiles: countFiles(targetDemo),
    brandFiles: countFiles(targetBrand),
  };
}

const assetsIndex = process.argv.indexOf('--assets-root');
const assetsRoot = assetsIndex >= 0 ? resolve(process.argv[assetsIndex + 1]) : DEFAULT_ASSETS_ROOT;
const result = syncRelayDemo({ assetsRoot });
console.log(`[sync-relay-demo] ${result.routes} routes, ${result.demoFiles} demo files, ${result.brandFiles} brand files`);
