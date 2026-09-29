// scripts/sync-flow-counts.mjs
// Refresh src/data/flow-counts.json, the one place the site's Flow library
// numbers come from ("28 Living Documents", "12 paths", ...).
//
// Reads the Flow Guide manifest READ-ONLY from the product lane:
//   ~/orionfold-flow/Resources/FlowGuide/manifest.json
// (or the path given as the first argument). `workspaces` are the Living
// Documents the app offers, `paths` the ready folders on Home.
//
// Every page, the llms.txt summary and the tests read the JSON, so after a
// Flow release that changes the library, run this once and rebuild:
//   node scripts/sync-flow-counts.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const manifestPath = process.argv[2] ?? join(homedir(), 'orionfold-flow/Resources/FlowGuide/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const { workspaces, paths } = manifest;
if (!Array.isArray(workspaces) || !Array.isArray(paths)) throw new Error(`${manifestPath} has no workspaces/paths arrays`);

const counts = {
  source: {
    file: 'orionfold-flow Resources/FlowGuide/manifest.json',
    contentVersion: manifest.contentVersion,
    generated: manifest.generated,
  },
  livingDocuments: workspaces.length,
  categories: new Set(workspaces.map(workspace => workspace.category)).size,
  paths: paths.length,
};

const out = new URL('../src/data/flow-counts.json', import.meta.url);
writeFileSync(out, `${JSON.stringify(counts, null, 2)}\n`);
console.log(`flow-counts: ${counts.livingDocuments} Living Documents in ${counts.categories} categories, ${counts.paths} paths, content ${counts.source.contentVersion}`);
