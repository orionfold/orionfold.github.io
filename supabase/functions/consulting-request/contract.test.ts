import {
  createRequestRecord,
  customerConfirmationText,
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
  description:
    "Deploy a governed client research workflow with a clear operator handoff.",
  consultingHours: 10,
  selectedOfferIds: ["relay-founding"],
};

Deno.test("request parser accepts only trusted selection inputs and ignores invented totals", () => {
  const input = parseConsultingRequest({
    ...validBody,
    listSubtotalCents: 1,
    savingsCents: 999_999,
  });
  const record = createRequestRecord({
    input,
    requestFingerprint: "hash",
    userAgent: "test",
    proposalNumber: "OFP-TEST",
  });
  assert(
    input.businessEmail === "manav@orionfold.com",
    "email did not normalize",
  );
  assert(
    record.snapshot.listSubtotalCents === 384_900,
    "server did not recompute catalog and consulting total",
  );
  assert(
    record.snapshot.savingsCents !== 999_999,
    "client discount was trusted",
  );
});

Deno.test("required fields, description, email, and UUID are validated", () => {
  assert(
    validateConsultingRequest(parseConsultingRequest(validBody)) === null,
    "valid request rejected",
  );
  for (
    const patch of [
      { fullName: "" },
      { companyName: "" },
      { businessEmail: "bad" },
      { requestId: "guessable" },
      { description: "too short" },
    ]
  ) {
    assert(
      validateConsultingRequest(
        parseConsultingRequest({ ...validBody, ...patch }),
      ) !== null,
      JSON.stringify(patch),
    );
  }
});

Deno.test("honeypot is silently recognizable and rate limit is deterministic", () => {
  const bot = parseConsultingRequest({
    ...validBody,
    website: "https://spam.invalid",
  });
  assert(bot.website.length > 0, "honeypot lost");
  assert(
    !shouldRateLimit(4) && shouldRateLimit(5),
    "rate limit boundary drifted",
  );
});

Deno.test("operator notification, customer copy, and receipt preserve the non-binding pending-review state", () => {
  const record = createRequestRecord({
    input: parseConsultingRequest(validBody),
    requestFingerprint: "hash",
    userAgent: "test",
    proposalNumber: "OFP-TEST",
  });
  const email = notificationText(record);
  const customerEmail = customerConfirmationText(record);
  const receipt = publicReceipt(record);
  assert(
    email.includes("NON-BINDING PROPOSAL REQUEST"),
    "email binding status missing",
  );
  assert(
    email.includes("PENDING ORIONFOLD REVIEW"),
    "email request state missing",
  );
  assert(
    email.includes("first 5 hours invoiced in advance"),
    "email advance invoice term missing",
  );
  assert(
    email.includes("monthly in arrears"),
    "email month-end billing term missing",
  );
  assert(
    !/status:\s*accepted|\bapproved\b|\binvoice is due\b|\bpayment received\b/i
      .test(email) && email.includes("This request is not accepted"),
    "email implies acceptance/payment",
  );
  assert(
    customerEmail.includes("This email is your copy of the proposal request"),
    "customer copy purpose missing",
  );
  assert(
    customerEmail.includes("Proposal: OFP-TEST · version 1"),
    "customer proposal identity missing",
  );
  assert(
    customerEmail.includes("Orionfold Relay"),
    "customer itemization missing",
  );
  assert(
    customerEmail.includes("Estimated bank-transfer savings"),
    "customer savings missing",
  );
  assert(
    customerEmail.includes("Estimated final subtotal"),
    "customer final estimate missing",
  );
  assert(
    customerEmail.includes("respond within 24 hours"),
    "customer response promise missing",
  );
  assert(
    customerEmail.includes("2108 N St Ste N"),
    "customer legal identity missing",
  );
  assert(
    !/pre-tax|status:\s*accepted|\bapproved\b|\binvoice is due\b|\bpayment received\b/i
      .test(customerEmail) &&
      customerEmail.includes(
        "Submission does not mean the request is accepted",
      ),
    "customer copy implies tax/acceptance/payment state",
  );
  assert(
    record.notification_status === "pending" &&
      record.customer_confirmation_status === "pending",
    "delivery state defaults drifted",
  );
  assert(
    receipt.bindingStatus === "non_binding_request" &&
      receipt.requestState === "pending_review",
    "receipt state drifted",
  );
});
