import assert from 'node:assert/strict';
import { normalizeMemoSource, transformGuide } from '../sync-relay-content.mjs';

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

console.log('sync-relay-content: all assertions passed');
