import { RELAY_OPERATOR_WORKSHOP, formatUsd } from "./commerce.ts";
import { RELAY_OPERATOR_WORKSHOP_CHECKOUT_ENABLED } from "./launch.ts";

export function buildTrainingPricing(generatedAt = new Date().toISOString()) {
  const workshop = RELAY_OPERATOR_WORKSHOP;
  return {
    schema: "orionfold.training-pricing/v1",
    canonical_url: "https://orionfold.com/training/pricing.json",
    currency: "usd",
    checkout_enabled: RELAY_OPERATOR_WORKSHOP_CHECKOUT_ENABLED,
    workshops: [
      {
        offering_id: workshop.offeringId,
        edition_id: workshop.editionId,
        edition_version: workshop.editionVersion,
        title: workshop.primary.label,
        purchase_url: "https://orionfold.com/training/relay-operator-workshop/",
        lookup_key: workshop.primary.lookupKey,
        mode: workshop.primary.mode,
        amount: workshop.primary.amount,
        display: `${formatUsd(workshop.primary.amount)} founding`,
        designed_minutes: workshop.designedMinutes,
        account_required: false,
        access_link_days: workshop.accessDays,
        refund_days: workshop.refundDays,
      },
    ],
    generated_at: generatedAt,
  };
}
