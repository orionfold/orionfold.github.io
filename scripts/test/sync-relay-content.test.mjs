import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizeMemoSource, syncRelayContent, transformGuide, validateMemoSource } from '../sync-relay-content.mjs';

const source = `---
id: "01-test"
title: "Test Guide"
features: ["First","Second"]
---

# Test Guide

## What This Chapter Helps You Do

This is the public summary.

![A sharp screen](../../screenshots/light/home/home-cockpit__desktop.png)

[Technical detail](../../../docs/relay-host-access.md)
`;

const output = transformGuide(source, { order: 1, screenshotIds: new Set(['home-cockpit']) });
assert.match(output, /order: 1/);
assert.match(output, /summary: "This is the public summary\."/);
assert.match(output, /relay-shot:home-cockpit/);
assert.match(output, /https:\/\/github\.com\/orionfold\/relay\/blob\/main\/docs\/relay-host-access\.md/);
assert.doesNotMatch(output, /^# Test Guide$/m, 'source H1 is removed because the route owns it');
assert.throws(
  () => transformGuide(source, { order: 1, screenshotIds: new Set() }),
  /unknown screenshot target/,
);

const memo = '---\ntitle: "Source owned"\n---\n\nPure prose.   \n\n';
assert.equal(
  normalizeMemoSource(memo),
  memo,
  'memo sync preserves source bytes exactly',
);

const validFigure = `<figure class="fn-diagram">
  <svg viewBox="0 0 10 10">
    <defs><linearGradient id="accent"/></defs>
    <rect width="10" height="10" fill="url(#accent)"/>
  </svg>
  <figcaption>Valid.</figcaption>
</figure>`;
assert.doesNotThrow(() => validateMemoSource(validFigure, 'valid-fixture'));
assert.throws(
  () => validateMemoSource(validFigure.replace('</defs>\n    <rect', '</defs>\n\n    <rect'), 'historical-regression'),
  /historical-regression: blank line inside inline figure.*refusing a source handoff.*plaintext/i,
);

const tempRoot = mkdtempSync(join(tmpdir(), 'relay-content-sync-'));
try {
  const assetsRoot = join(tempRoot, 'assets');
  const repoRoot = join(tempRoot, 'website');
  mkdirSync(join(assetsRoot, 'screenshots/metadata'), { recursive: true });
  mkdirSync(join(assetsRoot, 'docs/guides'), { recursive: true });
  mkdirSync(join(assetsRoot, 'api/reference'), { recursive: true });
  mkdirSync(join(assetsRoot, 'memos/broken'), { recursive: true });
  mkdirSync(join(repoRoot, 'src/content/memos/broken'), { recursive: true });
  writeFileSync(join(assetsRoot, 'screenshots/metadata/manifest.json'), '{"entries":[]}\n');
  writeFileSync(join(assetsRoot, 'docs/guides/01-guide.md'), `---\ntitle: "Guide"\nfeatures: []\n---\n\n# Guide\n\n## What This Chapter Helps You Do\n\nA valid summary.\n`);
  writeFileSync(join(assetsRoot, 'api/reference/01.md'), '# API\n');
  writeFileSync(join(assetsRoot, 'memos/broken/article.md'), validFigure.replace('</defs>\n    <rect', '</defs>\n\n    <rect'));
  writeFileSync(join(assetsRoot, 'memos/broken/signature.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>\n');
  const lastKnownGood = 'last-known-good\n';
  const destination = join(repoRoot, 'src/content/memos/broken/article.md');
  writeFileSync(destination, lastKnownGood);

  assert.throws(() => syncRelayContent({ assetsRoot, repoRoot }), /broken: blank line inside inline figure/);
  assert.equal(readFileSync(destination, 'utf8'), lastKnownGood, 'failed preflight preserves the memo destination');
  assert.equal(readFileSync(join(assetsRoot, 'memos/broken/article.md'), 'utf8').includes('\n\n    <rect'), true, 'upstream source is read-only and unchanged');
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

console.log('sync-relay-content: all assertions passed');
