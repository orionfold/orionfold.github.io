import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  parseWorkshopTranscript,
  workshopTranscriptSources,
} from '../../src/lib/training/workshop-transcript.mjs';
import {
  DEFAULT_RELAY_RUNTIME,
  normalizeRelayRuntime,
  relayHealthTarget,
  relayWorkshopTarget,
} from '../../src/lib/training/relay-handoff.mjs';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('revised workshop promise stays aligned across catalog and product surfaces', async () => {
  const [catalog, hub, product] = await Promise.all([
    read('scripts/export-catalog.ts'),
    read('src/pages/training/index.astro'),
    read('src/pages/training/relay-operator-workshop/index.astro'),
  ]);
  const promise = 'Build and run one AI-assisted workflow';
  assert.match(catalog, new RegExp(promise));
  assert.match(hub, new RegExp(promise));
  assert.match(product, new RegExp(promise));
  assert.match(product, /human approval, visible cost controls, and a reusable blueprint/i);
  assert.match(product, /<video[^>]+crossorigin="anonymous"/);
});

test('landing page presents every real workshop screen as a theme-aware alternating story', async () => {
  const [product, shot] = await Promise.all([
    read('src/pages/training/relay-operator-workshop/index.astro'),
    read('src/components/training/WorkshopShot.astro'),
  ]);
  assert.match(product, /Inside the paid workspace/);
  assert.match(product, /actual guided-workspace screens/i);
  for (const stage of ['start', 'inspect', 'adapt', 'govern', 'run', 'retain', 'finish']) {
    assert.match(product, new RegExp(`id: '${stage}'`));
  }
  assert.match(product, /index % 2 === 1 && 'lg:order-2'/);
  assert.match(product, /index % 2 === 1 && 'lg:order-1'/);
  assert.match(product, /index % 2 === 1 \? 'lg:grid-cols-\[1\.22fr_0\.78fr\]' : 'lg:grid-cols-\[0\.78fr_1\.22fr\]'/);
  assert.match(shot, /data-shot-light-src/);
  assert.match(shot, /data-shot-dark-src/);
  assert.match(shot, /loading="lazy"/);
  assert.match(shot, /fetchpriority="low"/);
});

test('operator paid preview is dev-gated and keeps private media out of the public site bundle', async () => {
  const [product, thanks, access, refund, workspace] = await Promise.all([
    read('src/pages/training/relay-operator-workshop/index.astro'),
    read('src/pages/training/relay-operator-workshop/thanks.astro'),
    read('src/pages/training/relay-operator-workshop/access.astro'),
    read('src/pages/training/relay-operator-workshop/refund.astro'),
    read('src/pages/training/relay-operator-workshop/workspace.astro'),
  ]);
  for (const source of [product, thanks, access, refund, workspace]) {
    assert.match(source, /import\.meta\.env\.DEV/);
  }
  assert.match(workspace, /PUBLIC_WORKSHOP_REVIEW_MEDIA_BASE/);
  assert.doesNotMatch(workspace, /\/Users\/|296acd31|revision-03-review/);
  assert.match(workspace, /Workshop guidance never substitutes for Relay evidence/);
  assert.match(workspace, /does not mark the Relay checkpoint passed/);
});

test('guided workspace has start, five checkpoints, finish, and no sitemap entry', async () => {
  const [workspace, config] = await Promise.all([
    read('src/pages/training/relay-operator-workshop/workspace.astro'),
    read('astro.config.mjs'),
  ]);
  for (const stage of ['start', 'inspect', 'adapt', 'govern', 'run', 'retain', 'finish']) {
    assert.match(workspace, new RegExp(`id: '${stage}'`));
  }
  assert.match(workspace, /PrivateLayout/);
  assert.match(config, /training\/relay-operator-workshop\/workspace\//);
  assert.match(config, /training\/relay-operator-workshop\/relay\//);
  assert.match(workspace, /data-unlocked='true'\] \.workshop-shell \{ display: block; \}/);
  assert.match(workspace, /@media \(min-width: 64rem\)[\s\S]*data-unlocked='true'\] \.workshop-shell \{ display: grid; \}/);
  assert.match(workspace, /class="min-w-0 border-b/, 'mobile workshop rail must not widen the page');
});

test('Relay handoff replaces the brittle direct localhost jump', async () => {
  const [workspace, handoff] = await Promise.all([
    read('src/pages/training/relay-operator-workshop/workspace.astro'),
    read('src/pages/training/relay-operator-workshop/relay.astro'),
  ]);
  assert.doesNotMatch(workspace, /127\.0\.0\.1:3000|localhost:3000/);
  assert.match(workspace, /relayHandoff\('start'\)/);
  assert.match(workspace, /relayHandoff\(stage\.id\)/);
  assert.match(workspace, /relayHandoff\('finish'\)/);
  assert.match(handoff, /mode: 'no-cors'/);
  assert.match(handoff, /npx orionfold-relay/);
  assert.match(handoff, /localStorage\.setItem\(storageKey/);
  assert.match(handoff, /history\.back\(\)/);

  assert.equal(normalizeRelayRuntime(DEFAULT_RELAY_RUNTIME), 'http://127.0.0.1:3000');
  assert.equal(normalizeRelayRuntime('https://relay.example.com/custom?q=1'), 'https://relay.example.com');
  assert.equal(relayWorkshopTarget('http://127.0.0.1:4100'), 'http://127.0.0.1:4100/workshop');
  assert.equal(relayHealthTarget('http://127.0.0.1:4100'), 'http://127.0.0.1:4100/api/health/live');
  assert.throws(() => normalizeRelayRuntime('file:///tmp/relay'), /http or https/);
  const credentialedRuntime = ['https://user:secret', 'relay.example.com'].join('@');
  assert.throws(() => normalizeRelayRuntime(credentialedRuntime), /credentials/);
});

test('private lesson transcripts expand in place with safe navigable source links', async () => {
  const workspace = await read('src/pages/training/relay-operator-workshop/workspace.astro');
  assert.match(workspace, /data-workshop-transcript/);
  assert.match(workspace, /Read transcript \+ sources/);
  assert.match(workspace, /fetch\(url, \{ credentials: 'omit' \}\)/);
  assert.match(workspace, /replaceChildren/);
  assert.match(workspace, /seenSourceHrefs/);
  assert.doesNotMatch(workspace, /Open transcript with source links/);
  assert.doesNotMatch(workspace, /innerHTML/);

  const parsed = parseWorkshopTranscript(`# Module INSPECT\n\n## Transcript\n\n### Read the boundary\n\n00:00:14.800–00:00:54.568\n\nRead the operating boundary first.\n\nSources: source:marketing-line-memo, source:relay-workshop-api\nClaims: none\nMotion element: evidence-lens@v1\n\n## Disclosures\n\n- Synthetic demonstration.\n`);
  assert.equal(parsed.sections.length, 1);
  assert.equal(parsed.sections[0].title, 'Read the boundary');
  assert.equal(parsed.sections[0].time, '00:00:14.800–00:00:54.568');
  assert.deepEqual(parsed.sections[0].sources, ['source:marketing-line-memo', 'source:relay-workshop-api']);
  assert.deepEqual(parsed.disclosures, ['Synthetic demonstration.']);
  assert.equal(workshopTranscriptSources['source:marketing-line-memo'].href, '/relay/memos/marketing-line/');
  assert.equal(workshopTranscriptSources['source:relay-workshop-api'].href, '/relay/api/04-workflows-automation/');
  assert.equal(workshopTranscriptSources['source:relay-workflow-guide'].href, '/relay/docs/run-workflows-with-human-checkpoints/');
});

test('training refunds live on a public policy page and not the workshop finish screen', async () => {
  const [footer, refunds, access, workspace] = await Promise.all([
    read('src/components/Footer.astro'),
    read('src/pages/training/refunds.astro'),
    read('src/pages/training/relay-operator-workshop/access.astro'),
    read('src/pages/training/relay-operator-workshop/workspace.astro'),
  ]);

  assert.match(footer, /Latest · Relay Operator Workshop/);
  assert.match(footer, /Workshop catalog/);
  assert.match(footer, /\/training\/refunds\//);
  assert.match(refunds, /14 calendar days/);
  assert.match(refunds, /requestWorkshopLink\('refund'/);
  assert.match(refunds, /If that inbox owns an eligible workshop/);
  assert.match(access, /Training workshop refunds/);
  assert.doesNotMatch(access, /data-action="refund"/);
  assert.doesNotMatch(workspace, /Review refund behavior/);
  assert.doesNotMatch(workspace, /Review re-access/);
});
