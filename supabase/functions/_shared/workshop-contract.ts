import type { CatalogItem } from "./catalog.ts";
import { getCatalogItem } from "./catalog.ts";

export const WORKSHOP_LOOKUP_KEY = "workshop_relay_operator_founding";
export const WORKSHOP_OFFERING_ID = "relay-operator-workshop";
export const WORKSHOP_EDITION_ID = "relay-operator-workshop-2026-07-founding";
export const WORKSHOP_EDITION_VERSION = "2026.07";
export const WORKSHOP_EDITION_HASH =
  "669d04da5d429d937e7f94c46eafbd1903e3016655c6555285ef39871137a966";
export const WORKSHOP_ACCESS_TTL_SECONDS = 60 * 60 * 24 * 7;
export const WORKSHOP_MANIFEST_TTL_SECONDS = 60 * 15;
export const WORKSHOP_REFUND_TOKEN_TTL_SECONDS = 60 * 60;
export const WORKSHOP_REFUND_DAYS = 14;
export const WORKSHOP_RATE_LIMIT = 3;
export const WORKSHOP_RATE_WINDOW_SECONDS = 60 * 15;
export const WORKSHOP_BUCKET = "workshop-files";
export const WORKSHOP_MANIFEST_PATH =
  `${WORKSHOP_EDITION_ID}/delivery-manifest.json`;

export function workshopCatalogItem(key: string): CatalogItem | undefined {
  const item = getCatalogItem(key);
  return item?.kind === "workshop" ? item : undefined;
}

export function workshopCheckoutMetadata(): Record<string, string> {
  return {
    lookup_key: WORKSHOP_LOOKUP_KEY,
    kind: "workshop",
    offering_id: WORKSHOP_OFFERING_ID,
    edition_id: WORKSHOP_EDITION_ID,
    edition_version: WORKSHOP_EDITION_VERSION,
    edition_hash: WORKSHOP_EDITION_HASH,
  };
}

export function workshopCheckoutRoutes(siteUrl: string) {
  const base = siteUrl.replace(/\/$/, "");
  return {
    successUrl:
      `${base}/training/relay-operator-workshop/thanks/?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}/training/relay-operator-workshop/`,
  };
}

export function refundDeadline(paidAt: Date): Date {
  return new Date(paidAt.getTime() + WORKSHOP_REFUND_DAYS * 24 * 60 * 60 * 1000);
}
