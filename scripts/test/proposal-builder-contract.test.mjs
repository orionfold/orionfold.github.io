import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import {
  buildProposalEstimate,
  buildProposalSnapshot,
  getConsultingOffers,
  PROPOSAL_TERMS_VERSION,
} from '../../supabase/functions/_shared/consulting-proposal.ts';
import { CATALOG, FLOW_ANNUAL_AMOUNT, FLOW_MONTHLY_AMOUNT } from '../../supabase/functions/_shared/catalog.ts';

const pagePath = new URL('../../src/pages/proposal.astro', import.meta.url);
const oldPagePath = new URL('../../src/pages/consulting.astro', import.meta.url);
const navPath = new URL('../../src/components/Nav.astro', import.meta.url);
const cardPath = new URL('../../src/components/proposal/ProposalOfferCard.astro', import.meta.url);
const plansPath = new URL('../../src/components/living/FlowPlans.astro', import.meta.url);
const functionPath = new URL('../../supabase/functions/consulting-request/index.ts', import.meta.url);
const deliveryPath = new URL('../../supabase/functions/consulting-request/delivery.ts', import.meta.url);
const migrationPath = new URL('../../supabase/migrations/20260720010000_create_consulting_proposals.sql', import.meta.url);
const customerConfirmationMigrationPath = new URL('../../supabase/migrations/20260721173000_add_consulting_customer_confirmation.sql', import.meta.url);
const page = readFileSync(pagePath, 'utf8');
const nav = readFileSync(navPath, 'utf8');
const card = readFileSync(cardPath, 'utf8');
const plans = readFileSync(plansPath, 'utf8');
const css = readFileSync(new URL('../../src/styles/proposal.css', import.meta.url), 'utf8');
const fn = readFileSync(functionPath, 'utf8');
const delivery = readFileSync(deliveryPath, 'utf8');
const migration = readFileSync(migrationPath, 'utf8');
const customerConfirmationMigration = readFileSync(customerConfirmationMigrationPath, 'utf8');

test('/proposal/ is canonical and the former page does not ship', () => {
  assert.equal(existsSync(pagePath), true);
  assert.match(page, /bodyClass="ls pp-page"/, 'the page sits on the Living Systems system');
  assert.match(page, /hero-flow-paper-planes/, 'the paper planes fly on the proposal hero');
  assert.doesNotMatch(page, /bg-surface-raised|text-text-muted|rounded-2xl/, 'no leftover utility styling');
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
  // 2026-08-15 Flow takeover: the nav CTA became the Flow waitlist; the
  // proposal path stays reachable from the footer's Orionfold group.
  // 2026-08-22: that CTA now switches on ORIONFOLD_FLOW_LIVE (download once
  // Flow ships, waitlist before). What THIS test cares about is only that the
  // nav CTA still belongs to Flow rather than to the proposal builder, so it
  // asserts the switch exists and leaves the wording to the Flow surface test.
  assert.match(nav, /flowLive \? 'Download Flow' : 'Join the waitlist'/);
  assert.match(
    readFileSync(new URL('../../src/components/Footer.astro', import.meta.url), 'utf8'),
    /href: '\/proposal\/', label: 'Proposal'/,
  );
  assert.match(page, /id="proposal-sticky-summary"/);
  assert.match(page, /id="sticky-selection-summary"/);
  assert.match(page, /id="sticky-savings"/);
  assert.match(page, /id="sticky-final"/);
  assert.match(page, /stickyBar\.classList\.add\('is-visible'\)/);
  assert.doesNotMatch(page, /stickyBar\.classList\.remove\('is-visible'\)/);
});

test('product cards toggle through a full-card native checkbox label while preserving the details link', () => {
  // The card is one component (G-134) shared by the Flow section and the matrix.
  // Living Systems restyle (operator 2026-10-28 11:36): pp-card, styled in src/styles/proposal.css.
  assert.match(card, /class:list=\{\["pp-card", featured && "pp-card-featured"\]\}/);
  assert.match(card, /class="pp-card-check pp-sr-only"/);
  assert.match(card, /class="pp-card-hit" aria-hidden="true"/);
  assert.match(card, /for=\{`offer-\$\{offer\.id\}`\}/);
  assert.match(card, /class="ls-text-link pp-card-link" href=\{offer\.href\}/);
  assert.match(css, /\.pp-card:has\(\.pp-card-check:checked\)/);
  assert.doesNotMatch(page, /card\.classList\.toggle\('is-selected'/);
  assert.equal((page.match(/<ProposalOfferCard offer=\{offer\} maxQuantity=\{MAX_PROPOSAL_QUANTITY\}/g) ?? []).length, 2, 'both the Flow section and the matrix render the shared card');
});

test('every product card exposes a server-bounded license or seat quantity', () => {
  assert.match(card, /data-offer-quantity=\{offer\.id\}/);
  assert.match(card, /Number of \$\{offer\.unitLabel\} for \$\{offer\.label\}/);
  assert.match(card, /min="1"/);
  assert.match(card, /max=\{maxQuantity\}/);
  assert.match(page, /Catalog price × quantity/);
  assert.match(page, /line\.quantity.*line\.unitLabel/s);
});

test('Flow seats open the proposal, priced from the catalog, with the Domains facts and a Plans button (G-134)', () => {
  const offers = getConsultingOffers();
  const flow = offers.filter((offer) => offer.family === 'Flow');
  assert.deepEqual(flow.map((offer) => offer.id), ['flow-pro-annual', 'flow-import-annual', 'flow-publish-annual']);
  assert.deepEqual(offers.slice(0, 3), flow, 'Flow is first in the catalog order');
  for (const offer of flow) {
    assert.equal(offer.unitLabel, 'seats');
    assert.equal(offer.mode, 'subscription');
    assert.equal(offer.amountCents, CATALOG[offer.lookupKey].amount, `${offer.id} price comes from the catalog`);
    assert.equal(offer.amountCents, FLOW_ANNUAL_AMOUNT, `${offer.id} is the annual seat price`);
    for (const field of ['term', 'job', 'chooseWhen', 'contributes', 'worksWith', 'notFor', 'includes', 'freeBoundary']) {
      assert.doesNotMatch(String(offer[field] ?? ''), /\$\d/, `${offer.id}.${field} types no price`);
    }
  }
  // The add-on price is pegged to the Pro seat through the same two constants.
  assert.equal(CATALOG.license_orionfold_flow_import_monthly.amount, FLOW_MONTHLY_AMOUNT);
  assert.equal(CATALOG.license_orionfold_flow_publish_annual.amount, FLOW_ANNUAL_AMOUNT);

  // Page: the Flow section precedes the capability matrix and sits inside the form.
  const formAt = page.indexOf('<form id="proposal-form"');
  const flowAt = page.indexOf('<section id="flow"');
  const matrixAt = page.indexOf('aria-labelledby="matrix-heading"');
  assert.ok(formAt > 0 && formAt < flowAt && flowAt < matrixAt, 'Flow section is the first section of the form, before the matrix');
  assert.match(page, /\{formatUsd\(FLOW\.annual\.amount\)\} a year/);
  assert.match(page, /\{formatUsd\(FLOW\.monthly\.amount\)\} a month/);
  assert.doesNotMatch(page.slice(flowAt, matrixAt), /\$\d/, 'the Flow section types no price');
  // Bento: the Pro seat leads as a full-width tile, the two add-ons share the row below (operator 2026-10-28 11:34).
  assert.match(page, /featured=\{index === 0\}/);
  assert.match(card, /featured && "pp-card-featured"/);
  assert.match(css, /\.pp-card-featured \{ grid-column: 1 \/ -1; \}/);
  assert.doesNotMatch(page, /Flow Domains on a proposal/, 'the Domains aside was removed; the facts live on the cards');
  assert.match(flow[0].freeBoundary, /Bringing a Domain in from GitHub is free on Base/);
  assert.match(flow[2].worksWith, /Publishing a Domain needs Pro and Publish together/);
  assert.match(flow[2].notFor, /no fee per Domain/);
  assert.match(page, /Flow lines are yearly subscriptions, one seat per person\./);
  assert.match(page, /Set the licenses, Flow seats or workshop seats/);

  // Plans: the Request for proposal link sits beside Enterprise contact and deep-links to the section.
  assert.match(plans, /<div class="ls-plan-buttons"><FlowEnterpriseContact \/><a class="ls-plan-rfp" href="\/proposal\/#flow"/);
  assert.match(plans, />Request for proposal<\/a>/);
  assert.match(readFileSync(new URL('../../src/styles/living-flow.css', import.meta.url), 'utf8'), /\.ls-plan-actions :is\(\.of-primary-action, \.flow-enterprise-trigger, \.ls-plan-rfp\)/);
});

test('all eligible offers and quantity fixtures build from the shared catalog', () => {
  const offers = getConsultingOffers();
  assert.deepEqual(offers.map((offer) => offer.id), [
    'flow-pro-annual',
    'flow-import-annual',
    'flow-publish-annual',
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
