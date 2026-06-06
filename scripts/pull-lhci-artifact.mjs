// M7 — pull the latest completed CI lighthouse.yml artifact and re-summarize
// locally (absorbs M-polish item a: lab data freshens without a local lhci run).
//
//   node scripts/pull-lhci-artifact.mjs
//
// ⚠ The artifact's manifest.json carries jsonPath values that are ABSOLUTE
// PATHS ON THE CI RUNNER (/home/runner/…). They are rewritten to the local
// audit-reports/lhci/ copies before summarize-lighthouse.mjs reads them.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, renameSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const ROOT = process.cwd();
const LHCI_DIR = resolve(ROOT, 'audit-reports/lhci');

function gh(args) {
  const r = spawnSync('gh', args, { cwd: ROOT, encoding: 'utf8', timeout: 60000 });
  if (r.status !== 0) {
    console.error(`[lhci-pull] gh ${args[0]} failed: ${(r.stderr || '').trim().slice(0, 300)}`);
    process.exit(1);
  }
  return r.stdout;
}

const runs = JSON.parse(gh(['run', 'list', '--workflow', 'lighthouse.yml', '--status', 'completed', '--limit', '1', '--json', 'databaseId,updatedAt,conclusion']));
if (!runs.length) { console.error('[lhci-pull] no completed lighthouse.yml runs'); process.exit(1); }
const run = runs[0];
console.log(`[lhci-pull] run ${run.databaseId} (${run.conclusion}, ${run.updatedAt})`);

const tmp = resolve(tmpdir(), `lhci-pull-${run.databaseId}`);
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
gh(['run', 'download', String(run.databaseId), '--name', 'lighthouse-reports', '--dir', tmp]);

const srcManifest = resolve(tmp, 'audit-reports/lhci/manifest.json');
if (!existsSync(srcManifest)) { console.error(`[lhci-pull] artifact has no audit-reports/lhci/manifest.json`); process.exit(1); }

// install: stage → atomic rename so a cpSync failure can't destroy local state
const staging = LHCI_DIR + '.new';
rmSync(staging, { recursive: true, force: true });
cpSync(resolve(tmp, 'audit-reports/lhci'), staging, { recursive: true });
rmSync(LHCI_DIR, { recursive: true, force: true });
renameSync(staging, LHCI_DIR);
const manifest = JSON.parse(readFileSync(resolve(LHCI_DIR, 'manifest.json'), 'utf8'));
for (const entry of manifest) entry.jsonPath = resolve(LHCI_DIR, basename(entry.jsonPath));
writeFileSync(resolve(LHCI_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
rmSync(tmp, { recursive: true, force: true });

const sum = spawnSync('node', ['scripts/summarize-lighthouse.mjs'], { cwd: ROOT, stdio: 'inherit' });
process.exit(sum.status ?? 1);
