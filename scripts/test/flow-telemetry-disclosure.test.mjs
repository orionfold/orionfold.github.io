import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

// Flow 1.8 (build 2257, flow-growth ledger 2026-09-21 00:55) is the first
// release whose telemetry transport actually runs in a downloaded copy: after a
// night run it sends anonymized per-day counts to Orionfold, and BOTH switches
// ship on. Until that release the public copy said the opposite — /privacy/
// promised "Flow 1.6 keeps no usage statistics", and /promise/ pledged under
// "What we will never do" that any future sharing "will be a switch that starts
// off". Both sentences were false the moment 1.8 shipped, and nothing on this
// side caught it; the product lane had to name it in the ledger.
//
// This test is that missing guard. It does not check prose style — it holds the
// four public surfaces to the two facts a reader is entitled to (something IS
// shared, and it excludes their content), and it fails if a retired promise
// comes back. Facts here are the product lane's; if the app's behaviour changes
// again, this test is meant to go red before the claim ships.
const read = (relativePath) => readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

const privacy = () => read('src/pages/privacy.astro');
const promise = () => read('src/pages/promise.astro');
const faq = () => read('src/data/living-faq.json');
const specs = () => read('src/data/flow-specifications.ts');

// Sentences that were true before 1.8 and are false after it. A revert, a bad
// merge or a copy refresh that reinstates one of these is a published false
// claim about what leaves a customer's Mac, so it fails loudly.
const RETIRED_CLAIMS = [
  'keeps no usage statistics',
  'no usage statistics',
  'switch that starts off',
  'does not send product-use telemetry',
  'not upload usage analytics',
  'does not upload usage analytics',
];

// Strip the source comments before scanning: this file and the pages themselves
// quote the retired sentences on purpose to explain why they are gone.
const prose = (source) =>
  source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('//'))
    .join('\n');

test('no public Flow surface reinstates a claim that Flow 1.8 falsified', () => {
  for (const [name, source] of [
    ['privacy.astro', privacy()],
    ['promise.astro', promise()],
    ['living-faq.json', faq()],
    ['flow-specifications.ts', specs()],
  ]) {
    const body = prose(source).toLowerCase();
    for (const claim of RETIRED_CLAIMS) {
      assert.ok(
        !body.includes(claim),
        `${name} states "${claim}", which Flow 1.8 made false. Flow shares anonymized ` +
          `per-day counts by default since build 2257. Describe what actually leaves.`,
      );
    }
  }
});

test('the three reader-facing surfaces disclose that Flow shares something', () => {
  // The disclosure has to be findable, not merely not-false. Each surface names
  // the Settings location so a reader can act on it in the app.
  for (const [name, source] of [
    ['privacy.astro', privacy()],
    ['promise.astro', promise()],
    ['living-faq.json', faq()],
    ['flow-specifications.ts', specs()],
  ]) {
    const body = prose(source);
    assert.match(
      body,
      /Observations/,
      `${name} must name Settings ▸ Observations, the switch a reader needs to find.`,
    );
    assert.match(
      body,
      /anonymi[sz]ed|anonymous/i,
      `${name} must say the shared counts are anonymized.`,
    );
  }
});

test('every disclosure states the exclusion that makes the sharing acceptable', () => {
  // The single fact that decides whether a reader is alarmed: their documents
  // are not in it. If a rewrite keeps the disclosure but drops this, the copy
  // is technically true and practically misleading.
  const surfaces = [
    ['privacy.astro', privacy()],
    ['promise.astro', promise()],
    ['living-faq.json', faq()],
    ['flow-specifications.ts', specs()],
  ];
  for (const [name, source] of surfaces) {
    const body = prose(source).toLowerCase();
    assert.ok(
      body.includes('document text') ||
        body.includes('words in your documents') ||
        body.includes('your document text'),
      `${name} must say the shared counts never include the reader's document text.`,
    );
    assert.ok(
      body.includes('identifies your copy') || body.includes('identifies a copy'),
      `${name} must say nothing shared identifies the reader's copy of Flow.`,
    );
  }
});

test('privacy lists the night-run share in the what-leaves-your-Mac table', () => {
  // The table is the canonical list, and the product lane's Guide carries the
  // same row. A disclosure that lives only in a paragraph under the table is
  // easy to miss and easy to drop in a later edit.
  const source = privacy();
  const tableStart = source.indexOf("head: ['When', 'Where', 'What is sent', 'Your switch']");
  assert.ok(tableStart > 0, 'the what-leaves-your-Mac table should still exist');
  const tableEnd = source.indexOf('after:', tableStart);
  assert.ok(tableEnd > tableStart, 'the table should still be followed by its after: prose');

  const table = source.slice(tableStart, tableEnd);
  assert.match(
    table,
    /Orionfold’s measurement service/,
    'the table needs a row whose destination is Orionfold’s measurement service.',
  );
  assert.match(
    table,
    /Observations/,
    'that row must name the Settings ▸ Observations switch in its "Your switch" column.',
  );
});

test('privacy states the one-finished-day bound and the default-on switches', () => {
  // Two facts that bound the claim and were verified by the product lane:
  // nothing is sent on install day, and the switches start on rather than off.
  // Saying "you can turn it off" without "it starts on" reads as opt-in.
  const body = prose(privacy());
  assert.match(
    body,
    /one finished day/i,
    'privacy must state that a share covers one finished day, so install day sends nothing.',
  );
  assert.match(
    body,
    /both on to begin with|both start on|start on/i,
    'privacy must state that the two switches start on, not off.',
  );
});

test('no surface claims a telemetry dashboard or an observed production night run', () => {
  // The product lane was explicit: reading these aggregates is goal 0226 and is
  // not started, and no production night run has been observed end to end. Both
  // are exactly the kind of thing marketing copy invents, so it is blocked here.
  for (const [name, source] of [
    ['privacy.astro', privacy()],
    ['promise.astro', promise()],
    ['living-faq.json', faq()],
    ['flow-specifications.ts', specs()],
  ]) {
    const body = prose(source).toLowerCase();
    for (const overclaim of ['telemetry dashboard', 'usage dashboard', 'we analyze every night']) {
      assert.ok(
        !body.includes(overclaim),
        `${name} claims "${overclaim}", which the product lane has not shipped (goal 0226).`,
      );
    }
  }
});

test('the historical 1.5.5 release note is left intact', () => {
  // flow-releases.ts records what each release said at the time. Its 1.5.5 note
  // says "No usage statistics", which was TRUE for 1.5.5 and must not be
  // rewritten to match 1.8 — that would falsify the archive to fix the present.
  // This test exists so a future claim sweep does not "helpfully" clean it up.
  const releases = read('src/data/flow-releases.ts');
  assert.match(
    releases,
    /It also says what Flow never does\. No usage statistics\./,
    'the 1.5.5 release note is history and must keep its original wording.',
  );
});
