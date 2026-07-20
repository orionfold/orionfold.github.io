import { formatUsd, RELAY, RELAY_HOST } from "./commerce.ts";
import { ORIONFOLD_RELAY_LIVE, RELAY_HOST_LIVE } from "./launch.ts";

export function buildRelayPricing(generatedAt = new Date().toISOString()) {
  const price = (item: typeof RELAY.primary) => ({
    lookup_key: item.lookupKey,
    label: item.label,
    amount: item.amount,
    display: formatUsd(item.amount),
  });

  return {
    schema: "orionfold.pricing/v1",
    product: "orionfold-relay",
    canonical_url: "https://orionfold.com/relay/pricing.json",
    purchase_url: "https://orionfold.com/relay/",
    currency: "usd",
    live: ORIONFOLD_RELAY_LIVE,
    term_months: RELAY.windowMonths,
    prices: {
      founding: { ...price(RELAY.founding), per: "year" },
      list: { ...price(RELAY.primary), per: "year" },
      renewal: { ...price(RELAY.renewal), per: "year" },
    },
    founding_window: {
      state: "open",
      seats_cap: RELAY.foundingSeats,
      enforcement: "server-side at checkout",
    },
    host: {
      product: "orionfold-relay-host",
      purchase_url: "https://orionfold.com/relay/host/",
      entitlement: "product:relay-host",
      live: RELAY_HOST_LIVE,
      price: { ...price(RELAY_HOST.primary), per: "year" },
      term_months: RELAY_HOST.termMonths,
      limits: {
        hosts: RELAY_HOST.hosts,
        managed_cells: RELAY_HOST.managedCells,
      },
      packs: "separate",
      bundle_offered: false,
      founding_offered: false,
      capacity_upgrade_offered: false,
      refund_days: RELAY_HOST.refundDays,
      lapse: {
        running_cells: "continue",
        export: "continue",
        recovery: "continue",
        new_capacity: "stops",
        forward_paid_updates: "stop",
        compatible_critical_security_updates: "included",
      },
      public_cell_image: {
        reference:
          "ghcr.io/orionfold/relay-cell@sha256:b0dbee1535a2da9d963814591c8f0307d719b0d1ee43baebd2cbedf5f1d22c73",
        purchase_token_required: false,
      },
    },
    generated_at: generatedAt,
  };
}
