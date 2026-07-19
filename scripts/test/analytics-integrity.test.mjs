import assert from 'node:assert/strict';
import test from 'node:test';

import { renderBody } from '../lib/dashboard-render.mjs';

function payload(data) {
  return {
    generatedAt: '2026-07-19T18:00:00Z',
    snaps: {
      ga4: [{ date: '2026-07-19', site: 'orionfold', data }],
    },
    ci: { asOf: null, runs: [] },
    todos: { available: false, todos: [] },
  };
}

test('dashboard labels an exact production-host GA4 capture and its historical contamination', () => {
  const body = renderBody(payload({
    sessions: 533,
    engagementRate: 0.54,
    productionHostScope: {
      status: 'filtered',
      dimension: 'Hostname',
      matchType: 'exactly matches',
      value: 'orionfold.com',
    },
    historicalContamination: {
      window: '2026-06-21 → 2026-07-18',
      syntheticSessions: 1049,
      cohort: 'localhost Lighthouse / Moto G Power (2022)',
      disposition: 'annotated, not rewritten',
    },
  }));

  assert.match(body.mainHtml, /production host only/);
  assert.match(body.mainHtml, /Hostname exactly matches orionfold\.com/);
  assert.match(body.mainHtml, /1,049 synthetic sessions/);
  assert.match(body.mainHtml, /annotated, not rewritten/);
  assert.doesNotMatch(body.mainHtml, /production-host scope missing/);
});

test('dashboard refuses to present an unscoped Orionfold GA4 capture as clean', () => {
  const body = renderBody(payload({
    sessions: 1582,
    engagementRate: 0.1833,
  }));

  assert.match(body.mainHtml, /production-host scope missing/);
  assert.match(body.mainHtml, /Do not use its total, Direct share or aggregate engagement as real-user KPIs/);
  assert.match(body.mainHtml, /2026-06-21 → 2026-07-18/);
  assert.match(body.mainHtml, /1,049 synthetic sessions/);
});
