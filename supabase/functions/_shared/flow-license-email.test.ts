import { assert, assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getCatalogItem } from "./catalog.ts";
import { flowLicenseEmailText, flowRenewalPeriod } from "./flow-license-email.ts";

const MONTHLY = getCatalogItem("license_orionfold_flow_monthly")!.label;
const ANNUAL = getCatalogItem("license_orionfold_flow_annual")!.label;
const LINK = "https://example.test/signed/license.json?token=abc";

const email = (label: string) => flowLicenseEmailText(label, "OF-FLOW-000123", LINK, "FOOTER");

Deno.test("each Flow plan renews on its own period", () => {
  assertEquals(flowRenewalPeriod(MONTHLY), "month");
  assertEquals(flowRenewalPeriod(ANNUAL), "year");
  assertStringIncludes(email(MONTHLY), "Flow Pro renews every month until you cancel.");
  assertStringIncludes(email(ANNUAL), "Flow Pro renews every year until you cancel.");
});

Deno.test("the Flow email carries the approved terms verbatim", () => {
  const text = email(MONTHLY).replace(/\s+/g, " ");
  assertStringIncludes(
    text,
    "Cancel anytime; Flow Pro stays on until the end of the period you've paid for. " +
      "Subscription payments are not refunded, except where the law requires it.",
  );
});

Deno.test("the Flow email carries the licence and says how Flow gets it", () => {
  const text = email(MONTHLY);
  assertStringIncludes(text, "OF-FLOW-000123");
  assertStringIncludes(text, LINK);
  assertStringIncludes(text, '"Add Licence…"');
  assertStringIncludes(text, "FOOTER");
});

Deno.test("the Flow email is not Arena's and promises nothing unapproved", () => {
  const text = email(ANNUAL);
  for (const banned of ["DGX Spark", "getarena", "Arena", "12 months", "Settings", "Billing", "Manage Plan", "—"]) {
    assert(!text.includes(banned), `Flow email must not contain "${banned}"`);
  }
});

Deno.test("the webhook maps Flow to its own email, not the Arena fallback", async () => {
  const webhook = await Deno.readTextFile(new URL("../stripe-webhook/index.ts", import.meta.url));
  assert(/"orionfold-flow": flowLicenseEmailText,/.test(webhook), "LICENSE_EMAIL_TEXT must map orionfold-flow");
});
