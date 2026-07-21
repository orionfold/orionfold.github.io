import {
  createRequestRecord,
  notificationText,
  parseConsultingRequest,
  publicReceipt,
  shouldRateLimit,
  validateConsultingRequest,
} from "./contract.ts";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const validBody = {
  requestId: "b24da17e-2228-4b76-86ca-dfd35e7c98aa",
  fullName: "Ada Lovelace",
  businessEmail: "MANAV@ORIONFOLD.COM",
  companyName: "Analytical Engines",
  description: "Deploy a governed client research workflow with a clear operator handoff.",
  consultingHours: 10,
  selectedOfferIds: ["relay-founding"],
};

Deno.test("request parser accepts only trusted selection inputs and ignores invented totals", () => {
  const input = parseConsultingRequest({ ...validBody, listSubtotalCents: 1, savingsCents: 999_999 });
  const record = createRequestRecord({ input, requestFingerprint: "hash", userAgent: "test", proposalNumber: "OFP-TEST" });
  assert(input.businessEmail === "manav@orionfold.com", "email did not normalize");
  assert(record.snapshot.listSubtotalCents === 384_900, "server did not recompute catalog and consulting total");
  assert(record.snapshot.savingsCents !== 999_999, "client discount was trusted");
});

Deno.test("required fields, description, email, and UUID are validated", () => {
  assert(validateConsultingRequest(parseConsultingRequest(validBody)) === null, "valid request rejected");
  for (const patch of [
    { fullName: "" },
    { companyName: "" },
    { businessEmail: "bad" },
    { requestId: "guessable" },
    { description: "too short" },
  ]) {
    assert(validateConsultingRequest(parseConsultingRequest({ ...validBody, ...patch })) !== null, JSON.stringify(patch));
  }
});

Deno.test("honeypot is silently recognizable and rate limit is deterministic", () => {
  const bot = parseConsultingRequest({ ...validBody, website: "https://spam.invalid" });
  assert(bot.website.length > 0, "honeypot lost");
  assert(!shouldRateLimit(4) && shouldRateLimit(5), "rate limit boundary drifted");
});

Deno.test("notification and receipt preserve the non-binding pending-review state", () => {
  const record = createRequestRecord({
    input: parseConsultingRequest(validBody),
    requestFingerprint: "hash",
    userAgent: "test",
    proposalNumber: "OFP-TEST",
  });
  const email = notificationText(record);
  const receipt = publicReceipt(record);
  assert(email.includes("NON-BINDING PROPOSAL REQUEST"), "email binding status missing");
  assert(email.includes("PENDING ORIONFOLD REVIEW"), "email request state missing");
  assert(email.includes("first 5 hours invoiced in advance"), "email advance invoice term missing");
  assert(email.includes("monthly in arrears"), "email month-end billing term missing");
  assert(!/\bis accepted\b|\bapproved\b|\binvoice is due\b|\bpayment received\b/i.test(email), "email implies acceptance/payment");
  assert(receipt.bindingStatus === "non_binding_request" && receipt.requestState === "pending_review", "receipt state drifted");
});
