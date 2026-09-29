/** Flow commerce is fulfilled by the product-owned endpoint. Match exact keys:
 * a prefix would silently swallow a future, unrelated website product. */
const FLOW_KEYS = new Set([
  "license_orionfold_flow_monthly",
  "license_orionfold_flow_annual",
  "license_orionfold_flow_import_monthly",
  "license_orionfold_flow_import_annual",
  "license_orionfold_flow_publish_monthly",
  "license_orionfold_flow_publish_annual",
]);

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue =>
  value && typeof value === "object" ? value as RecordValue : {};
const keyFrom = (value: unknown) => record(record(value).metadata).lookup_key;
const isFlow = (key: unknown) => typeof key === "string" && FLOW_KEYS.has(key);
const data = (value: unknown): unknown[] => {
  const rows = record(value).data;
  return Array.isArray(rows) ? rows : [];
};

export interface OwnershipLookup {
  checkoutPrices(sessionId: string): Promise<unknown[]>;
  priceLookupKey(priceId: string): Promise<string | null>;
}

export interface CommerceEvent {
  type: string;
  data: { object: unknown };
}

async function flowPrice(
  price: unknown,
  lookup: OwnershipLookup,
): Promise<boolean> {
  const expanded = record(price);
  if (isFlow(expanded.lookup_key)) return true;
  if (typeof expanded.lookup_key === "string") return false;
  const id = typeof price === "string" ? price : expanded.id;
  return typeof id === "string" && isFlow(await lookup.priceLookupKey(id));
}

export async function isProductOwnedFlowEvent(
  event: CommerceEvent,
  lookup: OwnershipLookup,
): Promise<boolean> {
  const object = record(event.data.object);
  const checkout = [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
  ].includes(event.type);
  const invoice = ["invoice.paid", "invoice.payment_failed"].includes(
    event.type,
  );
  const subscription = [
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ].includes(event.type);
  if (!checkout && !invoice && !subscription) return false;
  const key = keyFrom(object);
  if (isFlow(key)) return true;
  // Existing Website checkout paths dispatch by their signed metadata. Preserve
  // their behaviour without introducing an extra Stripe call on every purchase.
  if (checkout && typeof key === "string" && key.length > 0) return false;
  if (
    invoice &&
    [object.subscription_details, record(object.parent).subscription_details]
      .some((v) => isFlow(keyFrom(v)))
  ) return true;

  let prices: unknown[];
  if (checkout) {
    if (typeof object.id !== "string") {
      throw new Error("Checkout event has no session id");
    }
    prices = await lookup.checkoutPrices(object.id);
  } else if (invoice) {
    prices = data(object.lines).map((line) => {
      const row = record(line);
      return record(record(row.pricing).price_details).price ?? row.price;
    });
  } else {
    prices = data(object.items).map((item) => record(item).price);
  }
  for (const price of prices) {
    if (await flowPrice(price, lookup)) return true;
  }
  return false;
}

/** The dispatch seam ensures a Flow event has no Website side effects. Lookup
 * errors propagate to the webhook's 500/retry path rather than guessing. */
export async function dispatchWebsiteCommerceEvent(
  event: CommerceEvent,
  lookup: OwnershipLookup,
  handle: () => Promise<void>,
): Promise<boolean> {
  if (await isProductOwnedFlowEvent(event, lookup)) return true;
  await handle();
  return false;
}
