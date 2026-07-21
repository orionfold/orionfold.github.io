import { createRequestRecord, parseConsultingRequest } from "./contract.ts";
import {
  deliverProposalEmails,
  type DeliveryDependencies,
  type ProposalDeliveryRecord,
  type ProposalEmail,
} from "./delivery.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function record(
  statuses: Partial<
    Pick<
      ProposalDeliveryRecord,
      "notification_status" | "customer_confirmation_status"
    >
  > = {},
): ProposalDeliveryRecord {
  return {
    ...createRequestRecord({
      input: parseConsultingRequest({
        requestId: "c0a80121-1111-4111-8111-111111111111",
        fullName: "Website Test",
        businessEmail: "manav@orionfold.com",
        companyName: "Orionfold LLC",
        description:
          "Verify independent proposal email delivery and recovery behavior.",
        consultingHours: 10,
        selectedOfferIds: [],
      }),
      requestFingerprint: "test",
      userAgent: "test",
      proposalNumber: "OFP-TEST",
    }),
    id: "proposal-row",
    ...statuses,
  };
}

function dependencies(failingKeys: string[] = []) {
  const emails: ProposalEmail[] = [];
  const updates: Array<{ id: string; values: Record<string, string> }> = [];
  const errors: string[] = [];
  const value: DeliveryDependencies = {
    now: () => "2026-07-21T17:30:00.000Z",
    sendEmail: async (email) => {
      emails.push(email);
      if (failingKeys.includes(email.idempotencyKey)) {
        throw new Error("mail failed");
      }
    },
    updateProposal: async (id, values) => {
      updates.push({ id, values });
    },
    logError: (message) => errors.push(message),
  };
  return { value, emails, updates, errors };
}

Deno.test("operator and customer deliveries use distinct recipients, replies, keys, and states", async () => {
  const deps = dependencies();
  const result = await deliverProposalEmails(record(), deps.value);

  assert(
    result.notificationStatus === "sent",
    "operator delivery did not send",
  );
  assert(
    result.customerConfirmationStatus === "sent",
    "customer delivery did not send",
  );
  assert(deps.emails.length === 2, "expected exactly two emails");
  const operator = deps.emails.find((email) =>
    email.idempotencyKey.startsWith("consulting-operator-")
  );
  const customer = deps.emails.find((email) =>
    email.idempotencyKey.startsWith("consulting-customer-")
  );
  assert(operator?.to === "manav@orionfold.com", "operator recipient drifted");
  assert(
    operator.replyTo === "manav@orionfold.com",
    "operator reply-to drifted",
  );
  assert(customer?.to === "manav@orionfold.com", "customer recipient drifted");
  assert(
    customer.replyTo === "manav@orionfold.com",
    "customer reply-to drifted",
  );
  assert(
    deps.updates.some(({ values }) => values.notification_status === "sent"),
    "operator sent state missing",
  );
  assert(
    deps.updates.some(({ values }) =>
      values.customer_confirmation_status === "sent"
    ),
    "customer sent state missing",
  );
});

Deno.test("replay skips an already-sent operator email and retries only the customer copy", async () => {
  const deps = dependencies();
  const result = await deliverProposalEmails(
    record({
      notification_status: "sent",
      customer_confirmation_status: "failed",
    }),
    deps.value,
  );

  assert(result.notificationStatus === "sent", "sent operator state changed");
  assert(
    result.customerConfirmationStatus === "sent",
    "customer retry did not recover",
  );
  assert(deps.emails.length === 1, "replay duplicated an already-sent email");
  assert(
    deps.emails[0].idempotencyKey.startsWith("consulting-customer-"),
    "wrong delivery retried",
  );
});

Deno.test("one failed delivery does not roll back or mislabel the successful delivery", async () => {
  const failedKey = "consulting-customer-c0a80121-1111-4111-8111-111111111111";
  const deps = dependencies([failedKey]);
  const result = await deliverProposalEmails(record(), deps.value);

  assert(
    result.notificationStatus === "sent",
    "operator delivery should remain sent",
  );
  assert(
    result.customerConfirmationStatus === "delayed",
    "customer failure should be delayed",
  );
  assert(
    deps.updates.some(({ values }) => values.notification_status === "sent"),
    "operator state missing",
  );
  assert(
    deps.updates.some(({ values }) =>
      values.customer_confirmation_status === "failed"
    ),
    "customer failure state missing",
  );
  assert(
    deps.errors.some((message) => message.includes("customer email delayed")),
    "customer failure was not logged",
  );
});
