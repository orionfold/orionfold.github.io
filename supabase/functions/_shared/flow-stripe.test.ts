// Flow's Stripe credential seam. The property that matters is the FALLBACK:
// deploying this ahead of the credential must change nothing, and setting the
// Flow key must move ONLY Flow — never a live rail.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  flowStripeSecretKey,
  flowUsesDedicatedCredential,
  flowWebhookSecret,
} from "./flow-stripe.ts";

const KEYS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_FLOW_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_FLOW_WEBHOOK_SECRET",
] as const;

/** Run `fn` with exactly `env` set, restoring whatever was there before. */
function withEnv(env: Partial<Record<typeof KEYS[number], string>>, fn: () => void) {
  const saved = new Map(KEYS.map((k) => [k, Deno.env.get(k)]));
  try {
    for (const k of KEYS) Deno.env.delete(k);
    for (const [k, v] of Object.entries(env)) Deno.env.set(k, v);
    fn();
  } finally {
    for (const k of KEYS) {
      const prior = saved.get(k);
      if (prior === undefined) Deno.env.delete(k);
      else Deno.env.set(k, prior);
    }
  }
}

Deno.test("with no Flow key, Flow reads the shared credential (deploy is a no-op)", () => {
  withEnv({ STRIPE_SECRET_KEY: "FAKE-shared-live-key", STRIPE_WEBHOOK_SECRET: "FAKE-shared-whsec" }, () => {
    assertEquals(flowStripeSecretKey(), "FAKE-shared-live-key");
    assertEquals(flowWebhookSecret(), "FAKE-shared-whsec");
    assertEquals(flowUsesDedicatedCredential(), false);
  });
});

Deno.test("the Flow key overrides ONLY Flow; the shared name is untouched", () => {
  withEnv({
    STRIPE_SECRET_KEY: "FAKE-shared-live-key",
    STRIPE_FLOW_SECRET_KEY: "FAKE-flow-test-key",
    STRIPE_WEBHOOK_SECRET: "FAKE-shared-whsec",
    STRIPE_FLOW_WEBHOOK_SECRET: "FAKE-flow-whsec",
  }, () => {
    assertEquals(flowStripeSecretKey(), "FAKE-flow-test-key");
    assertEquals(flowWebhookSecret(), "FAKE-flow-whsec");
    assertEquals(flowUsesDedicatedCredential(), true);
    // The live rails read STRIPE_SECRET_KEY directly and must still see it.
    assertEquals(Deno.env.get("STRIPE_SECRET_KEY"), "FAKE-shared-live-key");
    assertEquals(Deno.env.get("STRIPE_WEBHOOK_SECRET"), "FAKE-shared-whsec");
  });
});

Deno.test("an empty or whitespace Flow key falls back rather than sending an empty key", () => {
  for (const blank of ["", "   "]) {
    withEnv({
      STRIPE_SECRET_KEY: "FAKE-shared-live-key",
      STRIPE_FLOW_SECRET_KEY: blank,
      STRIPE_WEBHOOK_SECRET: "FAKE-shared-whsec",
      STRIPE_FLOW_WEBHOOK_SECRET: blank,
    }, () => {
      assertEquals(flowStripeSecretKey(), "FAKE-shared-live-key");
      assertEquals(flowWebhookSecret(), "FAKE-shared-whsec");
      assertEquals(flowUsesDedicatedCredential(), false);
    });
  }
});

Deno.test("the two secrets are independent: one may be set without the other", () => {
  withEnv({
    STRIPE_SECRET_KEY: "FAKE-shared-live-key",
    STRIPE_FLOW_SECRET_KEY: "FAKE-flow-test-key",
    STRIPE_WEBHOOK_SECRET: "FAKE-shared-whsec",
  }, () => {
    assertEquals(flowStripeSecretKey(), "FAKE-flow-test-key");
    assertEquals(flowWebhookSecret(), "FAKE-shared-whsec");
  });
});
