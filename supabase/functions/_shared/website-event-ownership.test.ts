import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type CommerceEvent,
  dispatchWebsiteCommerceEvent,
  type OwnershipLookup,
} from "./website-event-ownership.ts";

const noLookup: OwnershipLookup = {
  checkoutPrices: () => {
    throw new Error("unexpected checkout lookup");
  },
  priceLookupKey: () => {
    throw new Error("unexpected price lookup");
  },
};
const event = (type: string, object: unknown): CommerceEvent => ({
  type,
  data: { object },
});

Deno.test("all six Flow keys skip every handled commerce event without side effects", async () => {
  for (
    const stem of [
      "license_orionfold_flow",
      "license_orionfold_flow_import",
      "license_orionfold_flow_publish",
    ]
  ) {
    for (const period of ["monthly", "annual"]) {
      for (
        const type of [
          "checkout.session.completed",
          "checkout.session.async_payment_succeeded",
          "invoice.paid",
          "invoice.payment_failed",
          "customer.subscription.updated",
          "customer.subscription.deleted",
        ]
      ) {
        let writes = 0;
        assertEquals(
          await dispatchWebsiteCommerceEvent(
            event(type, { metadata: { lookup_key: `${stem}_${period}` } }),
            noLookup,
            async () => {
              writes++;
            },
          ),
          true,
        );
        assertEquals(writes, 0);
      }
    }
  }
});

Deno.test("Website purchases, lookalike keys and refund dispatch remain intact", async () => {
  for (
    const lookup_key of [
      "book_dgx_spark",
      "sponsor_gold",
      "license_orionfold_proof",
      "license_orionfold_relay",
      "license_orionfold_flow_training_monthly",
    ]
  ) {
    let calls = 0;
    assertEquals(
      await dispatchWebsiteCommerceEvent(
        event("checkout.session.completed", { metadata: { lookup_key } }),
        noLookup,
        async () => {
          calls++;
        },
      ),
      false,
    );
    assertEquals(calls, 1);
  }
  let refunds = 0;
  await dispatchWebsiteCommerceEvent(
    event("refund.updated", {}),
    noLookup,
    async () => {
      refunds++;
    },
  );
  assertEquals(refunds, 1);
});

Deno.test("Flow is detected in checkout lines, modern invoice prices and non-first subscription items", async () => {
  const lookup: OwnershipLookup = {
    checkoutPrices: async (id) => {
      assertEquals(id, "cs_fixture");
      return [{ lookup_key: "license_orionfold_flow_publish_annual" }];
    },
    priceLookupKey: async (id) => {
      assertEquals(id, "price_fixture");
      return "license_orionfold_flow_monthly";
    },
  };
  const fixtures = [
    event("checkout.session.completed", { id: "cs_fixture" }),
    event("invoice.paid", {
      lines: {
        data: [{ pricing: { price_details: { price: "price_fixture" } } }],
      },
    }),
    event("invoice.payment_failed", {
      lines: { data: [{ price: { id: "price_fixture" } }] },
    }),
    event("customer.subscription.updated", {
      items: {
        data: [{ price: { lookup_key: "unrelated" } }, {
          price: { lookup_key: "license_orionfold_flow_import_monthly" },
        }],
      },
    }),
    event("customer.subscription.deleted", {
      items: { data: [{ price: "price_fixture" }] },
    }),
    event("invoice.paid", {
      parent: {
        subscription_details: {
          metadata: { lookup_key: "license_orionfold_flow_annual" },
        },
      },
    }),
  ];
  for (const fixture of fixtures) {
    assertEquals(
      await dispatchWebsiteCommerceEvent(fixture, lookup, async () => {
        throw new Error("Flow must never reach Website fulfilment");
      }),
      true,
    );
  }
});

Deno.test("non-Flow invoice/subscription still dispatches and lookup failures never fulfil", async () => {
  let calls = 0;
  for (
    const fixture of [
      event("invoice.paid", {
        lines: {
          data: [{ price: { lookup_key: "license_orionfold_relay_host" } }],
        },
      }),
      event("customer.subscription.updated", {
        items: { data: [{ price: { lookup_key: "sponsor_gold" } }] },
      }),
    ]
  ) {
    await dispatchWebsiteCommerceEvent(fixture, noLookup, async () => {
      calls++;
    });
  }
  assertEquals(calls, 2);
  await assertRejects(
    () =>
      dispatchWebsiteCommerceEvent(
        event("checkout.session.completed", { id: "cs_fixture" }),
        noLookup,
        async () => {
          calls++;
        },
      ),
    Error,
    "unexpected checkout lookup",
  );
  assertEquals(calls, 2);
});
