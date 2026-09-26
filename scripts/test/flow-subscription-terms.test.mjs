// Flow's subscription terms, decided by the operator 2026-09-25 (ops ledger
// 2326, cancel location 2338): cancel only, no refunds, Pro stays on through the
// paid period. The same sentences must appear on every surface a buyer reads
// before paying, so these guards pin each placement to the shared wording.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const flat = (text) => text.replace(/\\u00a0/g, " ").replace(/\s+/g, " ");

const CANCEL = "Cancel anytime in Flow, Settings ▸ Billing ▸ Manage Plan…; Flow Pro stays on until the end of the period you've paid for.";
const REFUND = "Subscription payments are not refunded, except where the law requires it.";

test("the shared site wording carries the approved terms", () => {
  const pricing = flat(read("src/data/flow-pricing.ts"));
  assert.ok(pricing.includes("Try every Pro feature free for 10 Pro Days. Subscribe when you're ready."));
  assert.ok(pricing.includes("until you cancel."), "renewal is disclosed");
  assert.ok(pricing.includes(CANCEL));
  assert.ok(pricing.includes(REFUND));
});

test("/flow/ pricing states the trial and the terms", () => {
  const plans = read("src/components/living/FlowPlans.astro");
  assert.match(plans, /Try every Pro feature free for 10 Pro Days\./);
  assert.match(plans, /Subscribe when you're ready\./);
  assert.match(plans, /\{FLOW_CANCEL_TERMS\}/, "the plans footnote renders the shared terms");
});

test("the specifications 'If Pro ends' box renders the terms", () => {
  assert.match(read("src/pages/flow/specifications.astro"), /\{FLOW_CANCEL_TERMS\}/);
});

test("the terms page has a Flow Pro subscriptions section with the approved sentences", () => {
  const terms = flat(read("src/pages/terms.astro")).replace(/\\u2019/g, "'");
  assert.ok(terms.includes("17. Flow Pro Subscriptions"));
  assert.ok(terms.includes("renews at the end of each billing period until you cancel"));
  assert.ok(terms.includes(CANCEL));
  assert.ok(terms.includes(REFUND));
});

// The Flow checkout message above the Pay button moved with flow-checkout to the
// orionfold-flow repo (2026-09-26, Step A); its guard lives there now.
