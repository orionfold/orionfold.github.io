import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { evaluateFlowReleaseBoundary, evaluateLiveRedirect } from '../check-flow-release-boundary.mjs';
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const stable = 'https://orionfold.supabase.co/storage/v1/object/public/flow-downloads/Orionfold-Flow.dmg';
const contract = JSON.parse(read('src/data/flow-release-contract.json'));
const evaluate = (overrides = {}) => evaluateFlowReleaseBoundary({
  launchSource: 'export const ORIONFOLD_FLOW_LIVE = true;',
  pricingSource: `export const FLOW_DMG_URL = "${stable}";`,
  releaseDeclared: 'true', redirectContract: contract, ...overrides,
});

test('Website release needs operator declaration, exact permanent DMG and redirect contract', () => {
  assert.equal(evaluate().state, 'release-ready');
  assert.equal(evaluate({ releaseDeclared: undefined }).state, 'blocked');
  assert.equal(evaluate({ redirectContract: undefined }).state, 'blocked');
  assert.equal(evaluate({ redirectContract: { ...contract, appcastTarget: 'https://example.com/appcast.xml' } }).state, 'blocked');
  assert.equal(evaluate({ redirectContract: { ...contract, appcastRedirectStatus: 302 } }).state, 'blocked');
  assert.equal(evaluate({ launchSource: read('src/data/launch.ts'), pricingSource: read('src/data/flow-pricing.ts') }).state, 'release-ready');
});

test('unsafe, foreign, versioned and decorated download URLs remain blocked', () => {
  for (const url of ['https://PLACEHOLDER.invalid/Flow.dmg', stable.replace('https:', 'http:'), stable.replace('orionfold.supabase.co', 'example.com'), stable.replace('/Orionfold-Flow.dmg', '/2.0/Flow.dmg'), `${stable}?key=anything`, `${stable}#fragment`, stable.replace('https://', 'https://user@'), stable.replace('.co/', '.co:444/'), 'https://orionfold.com/Flow.dmg']) {
    assert.equal(evaluate({ pricingSource: `export const FLOW_DMG_URL = "${url}";` }).state, 'blocked', url);
  }
});

test('launch-dark builds do not require release materials', () => {
  assert.equal(evaluate({ launchSource: 'export const ORIONFOLD_FLOW_LIVE = false;', releaseDeclared: undefined, redirectContract: undefined }).state, 'launch-dark');
});

test('live redirect check refuses HTML, a missing location and the wrong feed', () => {
  const response = (status, location) => new Response(null, { status, headers: location ? { location } : {} });
  assert.deepEqual(evaluateLiveRedirect(response(301, contract.appcastTarget), contract), []);
  for (const result of [response(200), response(301), response(301, 'https://example.com/appcast.xml'), response(302, contract.appcastTarget)]) {
    assert.ok(evaluateLiveRedirect(result, contract).length > 0);
  }
});

test('Website cannot regenerate or deploy a competing static feed', () => {
  for (const p of ['public/flow/appcast.xml', 'scripts/build-flow-appcast.mjs']) assert.equal(existsSync(new URL(`../../${p}`, import.meta.url)), false);
  assert.equal(JSON.parse(read('package.json')).scripts['build:appcast'], undefined);
});
