import {
  buildProposalEstimate,
  buildProposalSnapshot,
  calculateBankTransferSavings,
  CONSULTING_HOUR_CAPS,
  getConsultingOffers,
} from "./consulting-proposal.ts";

Deno.test("a product-only browser estimate works before consulting is selected", () => {
  const offer = getConsultingOffers()[0];
  const estimate = buildProposalEstimate({ consultingHours: 0, selectedOfferIds: [offer.id] });
  assert(estimate.consultingHours === 0, "draft estimate should not invent consulting hours");
  assert(estimate.lines.length === 1 && estimate.lines[0].id === offer.id, "draft estimate should include the selected product");
  assert(estimate.listSubtotalCents === offer.amountCents, "draft estimate should use the catalog price");
});

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

Deno.test("consulting caps and avoided-card-cost fixtures are exact integer cents", () => {
  assert(JSON.stringify(CONSULTING_HOUR_CAPS) === JSON.stringify([10, 15, 20]), "consulting cap set drifted");
  for (const hours of CONSULTING_HOUR_CAPS) {
    const proposal = buildProposalSnapshot({ consultingHours: hours, selectedOfferIds: [] });
    const subtotal = hours * 35_000;
    assert(proposal.listSubtotalCents === subtotal, `${hours} hour subtotal drifted`);
    assert(proposal.savingsCents === Math.round(subtotal * 0.029 + 30), `${hours} hour savings drifted`);
    assert(proposal.estimatedFinalSubtotalCents === subtotal - proposal.savingsCents, "final subtotal drifted");
  }
});

Deno.test("five hours is an advance billing term, not a selectable cap", () => {
  let rejected = false;
  try {
    buildProposalSnapshot({ consultingHours: 5 as never, selectedOfferIds: [] });
  } catch {
    rejected = true;
  }
  assert(rejected, "five-hour cap should be rejected");
  const proposal = buildProposalSnapshot({ consultingHours: 10, selectedOfferIds: [] });
  const consulting = proposal.lines.find((line) => line.kind === "consulting")!;
  assert(consulting.term.includes("first 5 hours invoiced in advance"), "advance invoice term missing");
  assert(consulting.term.includes("monthly in arrears"), "month-end billing term missing");
  assert(proposal.termsVersion === "consulting-request-2026-07-20-r2", "terms version drifted");
});

Deno.test("every product amount is derived from the shared catalog and recurring terms survive", () => {
  const offers = getConsultingOffers();
  for (const offer of offers) {
    const proposal = buildProposalSnapshot({ consultingHours: 10, selectedOfferIds: [offer.id] });
    const line = proposal.lines.find((item) => item.id === offer.id)!;
    assert(line.amountCents === offer.amountCents, `${offer.id} amount drifted`);
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
  for (const selectedOfferIds of [["missing"], ["relay-founding", "relay-founding"]]) {
    let failed = false;
    try {
      buildProposalSnapshot({ consultingHours: 10, selectedOfferIds });
    } catch {
      failed = true;
    }
    assert(failed, `selection should fail: ${selectedOfferIds.join(",")}`);
  }
});

Deno.test("savings never exceeds the eligible subtotal", () => {
  assert(calculateBankTransferSavings(1) === 1, "one cent subtotal must not go negative");
});
