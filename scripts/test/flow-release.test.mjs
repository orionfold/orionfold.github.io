// The released Flow version lives in one place: src/data/flow-release.json,
// refreshed from the live update feed by scripts/sync-flow-release.mjs.
// These checks keep every other surface reading it instead of typing it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { LLMS_VERSION_PHRASES, readNewestRelease } from '../sync-flow-release.mjs';

const read = (file) => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
const release = JSON.parse(read('src/data/flow-release.json'));

test('flow-release.json names a marketing version, the exact release and its build', () => {
  assert.match(release.version, /^\d+\.\d+$/);
  assert.match(release.release, /^\d+\.\d+(\.\d+)?$/);
  assert.ok(release.release.startsWith(release.version), 'the marketing version is the release line');
  assert.match(release.build, /^\d+$/);
});

test('the sync reads the newest feed item as the release', () => {
  const xml = `<rss><channel><item><title>2.1.1</title><sparkle:version>3101</sparkle:version><sparkle:shortVersionString>2.1.1</sparkle:shortVersionString></item>
    <item><sparkle:version>3020</sparkle:version><sparkle:shortVersionString>2.1</sparkle:shortVersionString></item></channel></rss>`;
  assert.deepEqual(readNewestRelease(xml), { release: '2.1.1', build: '3101', version: '2.1' });
});

test('llms.txt states the same version as the JSON', () => {
  const llms = read('public/llms.txt');
  for (const phrase of LLMS_VERSION_PHRASES) {
    const found = [...llms.matchAll(new RegExp(phrase.source, 'g'))];
    assert.ok(found.length, `llms.txt keeps the phrase ${phrase}`);
    for (const [m] of found) assert.ok(m.includes(`Flow ${release.version}`), `${m} names Flow ${release.version}`);
  }
});

// Site code never types the current Flow version into copy. Allowed: a
// picture's provenance (a caption, alt text or a build number saying which
// release a screenshot shows) and history that names a past release on
// purpose. Path articles (src/content) record the exact build each walk ran
// on and are not scanned.
const PROVENANCE = /\(\d{3,5}\)|caption|\balt[=:]|captured|Earlier|Historical|shipped in|alongside|not new Flow/i;
const HISTORY = [
  ['src/pages/terms.astro', 'Why we use mocks'],
  ['src/pages/privacy.astro', 'For Flow 1.8, the connections are listed below'],
  ['src/components/flow/chapters/ChapterExpand.astro', 'In Flow 1.6, lookups run on this Mac'],
  ['src/components/living/EssayJobsMap.astro', 'ej-version'],
];
function* files(dir) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (/\.(astro|ts|mjs)$/.test(name)) yield p;
  }
}

test('no page, component or data file hardcodes a current Flow version', () => {
  const root = new URL('../../', import.meta.url).pathname;
  const hits = [];
  for (const dir of ['src/pages', 'src/components', 'src/data', 'src/lib', 'src/layouts']) {
    for (const abs of files(path.join(root, dir))) {
      const rel = path.relative(root, abs);
      read(rel).split('\n').forEach((line, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        if (!/\bFlow\s+\d+\.\d+/i.test(line) || PROVENANCE.test(line)) return;
        if (HISTORY.some(([file, text]) => file === rel && line.includes(text))) return;
        hits.push(`${rel}:${i + 1}`);
      });
    }
  }
  assert.deepEqual(hits, [], 'use FLOW_VERSION from src/lib/flow/flow-release.ts');
});

test('the Flow front doors read the version from the JSON', () => {
  for (const file of ['src/components/living/FlowHero.astro', 'src/pages/flow.astro', 'src/data/og.ts', 'src/pages/og/[slug].jpg.ts', 'src/pages/flow/paths/index.astro', 'src/pages/flow/paths/[slug].astro']) {
    assert.match(read(file), /FLOW_VERSION/, `${file} uses FLOW_VERSION`);
  }
});

test('the version phrases never rewrite a three-part build a caveat names', () => {
  const line = 'Approved before it changed. On Flow 2.0.3, links between Notion pages do not open yet.';
  const out = LLMS_VERSION_PHRASES.reduce((t, re) => t.replace(re, '$19.9$2'), line);
  assert.equal(out, line, 'a patch version like 2.0.3 is a fact about that build');
  assert.doesNotMatch(readFileSync(new URL('../../public/llms.txt', import.meta.url), 'utf8'), /On Flow 2\.[12]\.3,/, 'no invented 2.1.3 or 2.2.3');
});
