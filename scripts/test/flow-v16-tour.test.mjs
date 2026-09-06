import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const manifest = JSON.parse(read('src/data/flow-shot-sources.json'));
const rows = manifest.shots.filter(row => row.name.startsWith('v16-'));
assert.equal(rows.length, 13, 'the curated v1.6 set retains its reviewed asset inventory');
for (const row of rows) {
  assert.equal(row.build, '1f928902 · 1899', `${row.name}: tied to the declared release`);
  assert.equal(row.output.build, row.build, `${row.name}: encoded output keeps release provenance`);
  assert.ok(row.frameCrop.left >= 540, `${row.name}: exclude the licence sidebar before publication`);
  assert.equal(row.output.width, row.frameCrop.width, `${row.name}: native width, no resampling`);
  assert.equal(row.output.height, row.frameCrop.height, `${row.name}: native height, no resampling`);
  assert.ok(row.frameCrop.top + row.frameCrop.height <= 2000, `${row.name}: exclude the app footer`);
}
const tours = read('src/data/flow-v16.ts');
for (const slug of ['night-shift', 'living-documents', 'settings']) {
  assert.match(tours, new RegExp(`slug: '${slug}'`), `${slug}: discoverable from the tour data`);
  const page = read(`src/pages/flow/${slug}.astro`);
  assert.match(page, new RegExp(`<FlowFeaturePage slug="${slug}"`), `${slug}: uses shared product navigation and metadata`);
  assert.match(page, /FlowDetail/, `${slug}: shows reviewed real product details`);
  assert.doesNotMatch(page, /Cloud prepaid|Claude Code|Codex CLI|Share all|script(?:s)? (?:refresh|runs?)/i, `${slug}: retired or dark features do not enter the tour`);
}
const living = read('src/pages/flow/living-documents.astro');
for (const folder of ['Stock Portfolio', 'Tax Advisor', 'Household Budget', 'Job Search', 'Competitor Watch', 'Team Status', 'Living Document Starter']) assert.match(living, new RegExp(`\\['${folder}'`), `${folder}: a shipped starter remains represented`);
const night = read('src/pages/flow/night-shift.astro');
assert.match(night, /These jobs run on every plan, including Base/, 'deterministic work stays Base');
assert.match(night, /Night Shift Pro[\s\S]*Overnight notes[\s\S]*Every number is checked against a source row or withheld/, 'Pro note promise keeps its evidence limit');
assert.match(night, /Overnight changes are applied and marked/, 'the Night Shift is not mislabeled as a pre-save daytime proposal');
assert.match(night, /plugged in and idle[\s\S]*even with the app quit/, 'the operating conditions stay beside the promise');
assert.match(read('src/pages/flow/tour.astro'), /FLOW_V16_TOURS\.map/, 'the tour hub renders the new routes');
assert.match(read('src/components/flow/FlowFeaturePage.astro'), /BreadcrumbList/, 'new routes keep machine-readable breadcrumbs');
console.log('Flow v1.6 tour truth and native-crop contract: pass');

// The declared 1.6 build offers only this Mac and configured cloud APIs.
// LAN is a retained receipt locality label, not a runnable product route.
for (const path of ['src/data/flow-categories.ts', 'src/data/flow-enterprise.ts', 'src/data/flow-specifications.ts', 'src/data/flow-measurements.ts', 'src/components/flow/chapters/ChapterDomains.astro']) {
  assert.doesNotMatch(read(path), /(?:your|the) network|Local or LAN|four (?:execution )?domains|3 locations/i, `${path}: no enabled LAN claim in current copy`);
}
assert.match(read('src/data/flow-enterprise.ts'), /standing Night Shift job applies the bounded changes you authorized in advance/, 'enterprise attribution includes standing permission');
assert.match(read('src/data/flow-enterprise.ts'), /Keep or Revert review/, 'enterprise review reflects Night Shift changes already applied');
