import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import {
  buildProposalSnapshot,
  CONSULTING_HOUR_CAPS,
  getConsultingOffers,
} from '../../supabase/functions/_shared/consulting-proposal.ts';

const pagePath = new URL('../../src/pages/proposal.astro', import.meta.url);
const oldPagePath = new URL('../../src/pages/consulting.astro', import.meta.url);
const navPath = new URL('../../src/components/Nav.astro', import.meta.url);
const functionPath = new URL('../../supabase/functions/consulting-request/index.ts', import.meta.url);
const migrationPath = new URL('../../supabase/migrations/20260720010000_create_consulting_proposals.sql', import.meta.url);
const page = readFileSync(pagePath, 'utf8');
const nav = readFileSync(navPath, 'utf8');
const fn = readFileSync(functionPath, 'utf8');
const migration = readFileSync(migrationPath, 'utf8');

test('/proposal/ is canonical and the former page does not ship', () => {
  assert.equal(existsSync(pagePath), true);
  assert.equal(existsSync(oldPagePath), false);
  assert.match(page, /ogMeta\('\/proposal\/'\)/);
  assert.doesNotMatch(page, /\/consulting\//);
});

test('page keeps non-binding status and omits payment instructions', () => {
  assert.ok((page.match(/Non-binding proposal request/gi) ?? []).length >= 4);
  assert.match(page, /Draft · not submitted/);
  assert.match(page, /Submitted · pending Orionfold review/);
  assert.match(page, /Select one consulting block\./);
  assert.match(page, /first five hours are invoiced in advance/i);
  assert.match(page, /invoiced monthly in arrears/i);
  assert.doesNotMatch(page, />5 hours</);
  assert.match(page, /class="cap-check/);
  assert.match(page, /type="radio" name="consultingHours"/);
  assert.doesNotMatch(page, /routing number|account number|sign here|pay now/i);
});

test('navigation and sticky summary keep the proposal action visible', () => {
  assert.match(nav, /href="\/proposal\/"[\s\S]*?>Get Proposal<\/a>/);
  assert.match(page, /id="proposal-sticky-summary"/);
  assert.match(page, /id="sticky-selection-summary"/);
  assert.match(page, /id="sticky-savings"/);
  assert.match(page, /id="sticky-final"/);
  assert.match(page, /stickyBar\.classList\.add\('is-visible'\)/);
});

test('all eligible offers and cap fixtures build from the shared catalog', () => {
  const offers = getConsultingOffers();
  assert.deepEqual(offers.map((offer) => offer.id), [
    'proof-founding',
    'arena-founding',
    'relay-founding',
    'relay-host-annual',
    'book-ai-native-business',
    'book-ai-native-platform',
    'book-ai-research-dgx-spark',
  ]);
  for (const consultingHours of CONSULTING_HOUR_CAPS) {
    const snapshot = buildProposalSnapshot({ consultingHours, selectedOfferIds: offers.map((offer) => offer.id) });
    assert.equal(snapshot.lines.length, offers.length + 1);
    assert.ok(snapshot.estimatedFinalSubtotalCents < snapshot.listSubtotalCents);
  }
});

test('server stores before Resend and migration protects the immutable snapshot', () => {
  assert.ok(fn.indexOf('.from("consulting_proposals").insert(record)') < fn.indexOf('fetch("https://api.resend.com/emails"'));
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all .* from anon, authenticated/i);
  assert.match(migration, /protect_consulting_proposal_snapshot/);
  assert.match(migration, /request_id uuid not null unique/);
});
