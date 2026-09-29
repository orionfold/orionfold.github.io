// The Flow library numbers ("28 Living Documents", "12 paths") come from one
// file, src/data/flow-counts.json, refreshed by scripts/sync-flow-counts.mjs.
//
// WHY THIS EXISTS. On 2026-09-29 the site said 26 Living Documents in some
// places and 24 in others while the app offered 28: each page had typed its own
// number. Pages now read the JSON; this test stops a typed number coming back
// and keeps the static llms.txt summary in step with the JSON.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const counts = JSON.parse(read('src/data/flow-counts.json'));

function files(dir) {
  return readdirSync(new URL(dir, root)).flatMap((name) => {
    const path = `${dir}/${name}`;
    if (statSync(new URL(path, root)).isDirectory()) return files(path);
    return /\.(astro|ts|mjs|js|json)$/.test(name) ? [path] : [];
  });
}

test('the counts file holds whole, positive numbers', () => {
  for (const key of ['livingDocuments', 'categories', 'paths']) {
    assert.ok(Number.isInteger(counts[key]) && counts[key] > 0, `${key} is a positive integer`);
  }
  assert.ok(counts.source?.contentVersion, 'records which Flow Guide manifest it came from');
});

test('no page, component or data file types a library count', () => {
  const typed = /\b\d+\s+(?:Living Documents|LIVING\b|documents in Flow|starting (?:documents|points)|paths to start)|\b\d+ OF \d+ DOCUMENTS|\bPATHS\.\s*$|\b\d+ PATHS\b/;
  const offenders = [];
  for (const dir of ['src/components', 'src/pages', 'src/data', 'src/lib']) {
    for (const path of files(dir)) {
      if (path.endsWith('flow-counts.json') || path.endsWith('flow-starting-documents.json')) continue;
      read(path).split('\n').forEach((line, i) => { if (typed.test(line)) offenders.push(`${path}:${i + 1}`); });
    }
  }
  assert.deepEqual(offenders, [], 'read the number from src/lib/flow/flow-counts.ts instead');
});

test('llms.txt states the same counts as the JSON', () => {
  const llms = read('public/llms.txt');
  assert.match(llms, new RegExp(`Home opens on ${counts.paths} paths \\(ready folders for real jobs\\) and ${counts.livingDocuments} Living Documents;`));
  assert.match(llms, new RegExp(`Start with useful work offers ${counts.livingDocuments} documents`));
  for (const [, n] of llms.matchAll(/(?<![\d.])(\d+) Living Documents\b/g)) assert.equal(Number(n), counts.livingDocuments, 'every Living Documents count in llms.txt matches');
});

test('paths say "walked on Flow", not a release number', () => {
  const page = read('src/pages/flow/paths/[slug].astro');
  assert.match(page, /<span>Walked on Flow<\/span>/);
  assert.doesNotMatch(page, /Walked on Flow \{/);
  assert.match(read('public/llms.txt'), /walked on Flow\)/);
});
