import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import {
  buildProposalEstimate,
  buildProposalSnapshot,
  getConsultingOffers,
  PROPOSAL_TERMS_VERSION,
} from '../../supabase/functions/_shared/consulting-proposal.ts';

const pagePath = new URL('../../src/pages/proposal.astro', import.meta.url);
const oldPagePath = new URL('../../src/pages/consulting.astro', import.meta.url);
const navPath = new URL('../../src/components/Nav.astro', import.meta.url);
const functionPath = new URL('../../supabase/functions/consulting-request/index.ts', import.meta.url);
const deliveryPath = new URL('../../supabase/functions/consulting-request/delivery.ts', import.meta.url);
const migrationPath = new URL('../../supabase/migrations/20260720010000_create_consulting_proposals.sql', import.meta.url);
const customerConfirmationMigrationPath = new URL('../../supabase/migrations/20260721173000_add_consulting_customer_confirmation.sql', import.meta.url);
const page = readFileSync(pagePath, 'utf8');
const nav = readFileSync(navPath, 'utf8');
const fn = readFileSync(functionPath, 'utf8');
const delivery = readFileSync(deliveryPath, 'utf8');
const migration = readFileSync(migrationPath, 'utf8');
const customerConfirmationMigration = readFileSync(customerConfirmationMigrationPath, 'utf8');

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
  assert.match(page, /Choose at least one Orionfold product/);
  assert.match(page, /Catalog price × quantity/);
  assert.match(page, /Purchase note or PO reference/);
  assert.match(page, /name="purchaseNote"[\s\S]*maxlength="500"/);
  assert.doesNotMatch(page, /name="purchaseNote"[^>]*required/);
  assert.doesNotMatch(page, /consulting cap|consultingHours|\$350|hourly rate|founder-led/i);
  assert.doesNotMatch(page, /routing number|account number|sign here|pay now/i);
});

test('navigation and sticky summary keep the proposal action visible', () => {
  assert.match(nav, /href="\/proposal\/"[\s\S]*?>Get Proposal<\/a>/);
  assert.match(page, /id="proposal-sticky-summary"/);
  assert.match(page, /id="sticky-selection-summary"/);
  assert.match(page, /id="sticky-savings"/);
  assert.match(page, /id="sticky-final"/);
  assert.match(page, /stickyBar\.classList\.add\('is-visible'\)/);
  assert.doesNotMatch(page, /stickyBar\.classList\.remove\('is-visible'\)/);
});

test('product cards toggle through a full-card native checkbox label while preserving the details link', () => {
  assert.match(page, /class="offer-card relative/);
  assert.match(page, /class="offer-checkbox peer sr-only"/);
  assert.match(page, /class="offer-hit-area absolute inset-0 z-10 cursor-pointer rounded-2xl"/);
  assert.match(page, /for=\{`offer-\$\{offer\.id\}`\}/);
  assert.match(page, /class="relative z-20 text-sm text-primary hover:underline" href=\{offer\.href\}/);
  assert.match(page, /\.offer-card:has\(\.offer-checkbox:checked\)/);
  assert.doesNotMatch(page, /card\.classList\.toggle\('is-selected'/);
});

test('every product card exposes a server-bounded license or seat quantity', () => {
  assert.match(page, /data-offer-quantity=\{offer\.id\}/);
  assert.match(page, /Number of \$\{offer\.unitLabel\} for \$\{offer\.label\}/);
  assert.match(page, /min="1"/);
  assert.match(page, /max=\{MAX_PROPOSAL_QUANTITY\}/);
  assert.match(page, /Catalog price × quantity/);
  assert.match(page, /line\.quantity.*line\.unitLabel/s);
});

test('all eligible offers and quantity fixtures build from the shared catalog', () => {
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
  const selectedOffers = offers.map((offer, index) => ({ id: offer.id, quantity: index + 1 }));
  const snapshot = buildProposalSnapshot({ selectedOffers });
  assert.equal(snapshot.lines.length, offers.length);
  assert.equal(snapshot.termsVersion, PROPOSAL_TERMS_VERSION);
  assert.equal(
    snapshot.listSubtotalCents,
    offers.reduce((sum, offer, index) => sum + offer.amountCents * (index + 1), 0),
  );
  assert.ok(snapshot.estimatedFinalSubtotalCents < snapshot.listSubtotalCents);
});

test('product-only draft estimates update from quantities', () => {
  const offer = getConsultingOffers()[0];
  const estimate = buildProposalEstimate({ selectedOffers: [{ id: offer.id, quantity: 4 }] });
  assert.deepEqual(estimate.lines.map((line) => line.id), [offer.id]);
  assert.equal(estimate.listSubtotalCents, offer.amountCents * 4);
  assert.ok(estimate.estimatedFinalSubtotalCents < estimate.listSubtotalCents);
  assert.match(page, /buildProposalEstimate\(\{ selectedOffers: selections \}/);
});

test('server stores before independent idempotent emails and migration protects the immutable snapshot', () => {
  const insertAt = fn.indexOf('.from("consulting_proposals").insert(record)');
  const storedRecordAt = fn.indexOf('const storedRecord');
  const deliveryAt = fn.indexOf('deliverProposalEmails(', storedRecordAt);
  assert.ok(insertAt >= 0 && insertAt < storedRecordAt && storedRecordAt < deliveryAt);
  assert.match(delivery, /consulting-operator-\$\{record\.request_id\}/);
  assert.match(delivery, /consulting-customer-\$\{record\.request_id\}/);
  assert.match(delivery, /customerConfirmationStatus/);
  assert.match(delivery, /status === "sent"/);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all .* from anon, authenticated/i);
  assert.match(migration, /protect_consulting_proposal_snapshot/);
  assert.match(migration, /request_id uuid not null unique/);
  assert.match(customerConfirmationMigration, /customer_confirmation_status/);
  assert.match(customerConfirmationMigration, /customer_confirmation_sent_at/);
  assert.match(page, /Retry confirmation email/);
  assert.match(page, /confirmation copy was emailed to/);
});
