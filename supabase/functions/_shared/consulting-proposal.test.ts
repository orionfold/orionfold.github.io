import {
  buildLegacyConsultingProposalSnapshot,
  buildProposalEstimate,
  buildProposalSnapshot,
  calculateBankTransferSavings,
  CONSULTING_HOUR_CAPS,
  getConsultingOffers,
  MAX_PROPOSAL_QUANTITY,
} from "./consulting-proposal.ts";
import { FLOW_ANNUAL_AMOUNT } from "./catalog.ts";

Deno.test("a product-only browser estimate multiplies catalog price by quantity", () => {
  const offer = getConsultingOffers()[0];
  const estimate = buildProposalEstimate({ selectedOffers: [{ id: offer.id, quantity: 3 }] });
  assert(estimate.lines.length === 1 && estimate.lines[0].id === offer.id, "draft estimate should include the selected product");
  assert(estimate.lines[0].quantity === 3, "requested quantity was lost");
  assert(estimate.lines[0].unitAmountCents === offer.amountCents, "catalog unit price drifted");
  assert(estimate.listSubtotalCents === offer.amountCents * 3, "quantity was not applied");
});

Deno.test("Flow seats are the first proposal lines and price from the catalog's annual SKUs (G-134)", () => {
  const offers = getConsultingOffers();
  const flow = offers.filter((offer) => offer.family === "Flow");
  assert(flow.length === 3, "Flow Pro, Import and Publish are the three Flow lines");
  assert(offers.slice(0, 3).every((offer) => offer.family === "Flow"), "Flow is listed first");
  for (const offer of flow) {
    assert(offer.unitLabel === "seats", `${offer.id} is priced per seat`);
    assert(offer.mode === "subscription", `${offer.id} is a subscription`);
    assert(offer.amountCents === FLOW_ANNUAL_AMOUNT, `${offer.id} price is the catalog annual amount`);
  }
  const estimate = buildProposalSnapshot({
    selectedOffers: [{ id: "flow-pro-annual", quantity: 12 }, { id: "flow-publish-annual", quantity: 12 }],
  });
  assert(estimate.listSubtotalCents === FLOW_ANNUAL_AMOUNT * 24, "twelve Pro seats plus twelve Publish seats");
  assert(estimate.lines.every((line) => line.unitLabel === "seats"), "seat lines keep their unit");
});

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

Deno.test("legacy consulting requests remain valid during a backend-first rollout", () => {
  assert(JSON.stringify(CONSULTING_HOUR_CAPS) === JSON.stringify([10, 15, 20]), "consulting cap set drifted");
  for (const hours of CONSULTING_HOUR_CAPS) {
    const proposal = buildLegacyConsultingProposalSnapshot({ consultingHours: hours, selectedOfferIds: [] });
    const subtotal = hours * 35_000;
    assert(proposal.listSubtotalCents === subtotal, `${hours} hour subtotal drifted`);
    assert(proposal.savingsCents === Math.round(subtotal * 0.029 + 30), `${hours} hour savings drifted`);
    assert(proposal.estimatedFinalSubtotalCents === subtotal - proposal.savingsCents, "final subtotal drifted");
  }
});

Deno.test("legacy five-hour consulting requests remain rejected", () => {
  let rejected = false;
  try {
    buildLegacyConsultingProposalSnapshot({ consultingHours: 5 as never, selectedOfferIds: [] });
  } catch {
    rejected = true;
  }
  assert(rejected, "five-hour cap should be rejected");
  const proposal = buildLegacyConsultingProposalSnapshot({ consultingHours: 10, selectedOfferIds: [] });
  const consulting = proposal.lines.find((line) => line.kind === "consulting")!;
  assert(consulting.term.includes("first 5 hours invoiced in advance"), "advance invoice term missing");
  assert(consulting.term.includes("monthly in arrears"), "month-end billing term missing");
  assert(proposal.termsVersion === "consulting-request-2026-07-20-r2", "terms version drifted");
});

Deno.test("every product amount is catalog-derived, quantity-aware, and preserves recurring terms", () => {
  const offers = getConsultingOffers();
  for (const offer of offers) {
    const proposal = buildProposalSnapshot({ selectedOffers: [{ id: offer.id, quantity: 2 }] });
    const line = proposal.lines.find((item) => item.id === offer.id)!;
    assert(line.unitAmountCents === offer.amountCents, `${offer.id} unit amount drifted`);
    assert(line.amountCents === offer.amountCents * 2, `${offer.id} quantity total drifted`);
    assert(line.unitLabel === offer.unitLabel, `${offer.id} unit label drifted`);
    assert(line.term === offer.term, `${offer.id} term drifted`);
  }
  const host = offers.find((offer) => offer.id === "relay-host-annual")!;
  assert(host.mode === "subscription" && host.term.includes("Annual"), "Host annual boundary missing");
});

Deno.test("launch-dark workshop is excluded unless its exact key is enabled", () => {
  assert(!getConsultingOffers().some((offer) => offer.workshop), "dark workshop leaked");
  const enabled = getConsultingOffers(["workshop_relay_operator_founding"]);
  assert(enabled.some((offer) => offer.id === "workshop-relay-operator-founding"), "published workshop missing");
});

Deno.test("stale, duplicate, or client-invented offers fail closed", () => {
  for (
    const selectedOffers of [
      [{ id: "missing", quantity: 1 }],
      [{ id: "relay-founding", quantity: 1 }, { id: "relay-founding", quantity: 2 }],
    ]
  ) {
    let failed = false;
    try {
      buildProposalSnapshot({ selectedOffers });
    } catch {
      failed = true;
    }
    assert(failed, `selection should fail: ${JSON.stringify(selectedOffers)}`);
  }
});

Deno.test("empty, fractional, zero, negative, or abusive quantities fail closed", () => {
  const id = getConsultingOffers()[0].id;
  for (const quantity of [0, -1, 1.5, MAX_PROPOSAL_QUANTITY + 1]) {
    let failed = false;
    try {
      buildProposalSnapshot({ selectedOffers: [{ id, quantity }] });
    } catch {
      failed = true;
    }
    assert(failed, `quantity should fail: ${quantity}`);
  }
  let emptyFailed = false;
  try {
    buildProposalSnapshot({ selectedOffers: [] });
  } catch {
    emptyFailed = true;
  }
  assert(emptyFailed, "submitted proposal must contain a product");
});

Deno.test("savings never exceeds the eligible subtotal", () => {
  assert(calculateBankTransferSavings(1) === 1, "one cent subtotal must not go negative");
});
