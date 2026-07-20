export interface RelayHostDeliveryState {
  status: string;
  expires_at: string | null;
  refunded_at: string | null;
}

export interface RelayHostPriceShape {
  unit_amount: number | null;
  currency: string;
  type: string;
  recurring?: { interval: string; interval_count: number } | null;
}

export function relayHostPriceMatches(
  price: RelayHostPriceShape,
  expectedAmount: number,
): boolean {
  return price.unit_amount === expectedAmount &&
    price.currency === "usd" &&
    price.type === "recurring" &&
    price.recurring?.interval === "year" &&
    price.recurring.interval_count === 1;
}

export function relayHostDeliveryEligible(
  entitlement: RelayHostDeliveryState | null | undefined,
  now: Date,
): boolean {
  if (!entitlement || entitlement.refunded_at || !entitlement.expires_at) {
    return false;
  }
  if (!["active", "past_due"].includes(entitlement.status)) return false;
  return new Date(entitlement.expires_at).getTime() > now.getTime();
}

export function relayHostRequestResponse() {
  return {
    ok: true,
    state: "accepted",
    message:
      "If an eligible Relay Host license exists, a fresh link is on its way.",
  } as const;
}

export function shouldIssueRelayHostRenewal(
  billingReason: string | null | undefined,
  lookupKey: string | null | undefined,
  hostLookupKey: string,
): boolean {
  return billingReason === "subscription_cycle" && lookupKey === hostLookupKey;
}

export function relayHostLifecycleStatus(
  subscriptionStatus: string,
): string {
  return subscriptionStatus === "active" || subscriptionStatus === "trialing"
    ? "active"
    : subscriptionStatus;
}
