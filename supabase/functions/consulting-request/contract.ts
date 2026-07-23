import {
  buildLegacyConsultingProposalSnapshot,
  buildProposalSnapshot,
  formatEffectiveSavings,
  formatUsd,
  type ProposalSelection,
  type ProposalSnapshot,
} from "../_shared/consulting-proposal.ts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ConsultingRequestInput {
  requestId: string;
  fullName: string;
  businessEmail: string;
  companyName: string;
  description: string;
  proposalSchema: "product_quantity" | "legacy_consulting";
  selectedOffers: ProposalSelection[];
  consultingHours: number;
  selectedOfferIds: string[];
  website: string;
}

export type ConsultingDeliveryStatus = "pending" | "sent" | "failed";

export interface ConsultingRequestRecord {
  request_id: string;
  proposal_number: string;
  proposal_version: number;
  full_name: string;
  business_email: string;
  company_name: string;
  request_description: string;
  snapshot: ProposalSnapshot;
  binding_status: "non_binding_request";
  request_state: "received";
  notification_status: ConsultingDeliveryStatus;
  customer_confirmation_status: ConsultingDeliveryStatus;
  request_fingerprint: string;
  user_agent: string;
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function parseConsultingRequest(body: unknown): ConsultingRequestInput {
  const source = body && typeof body === "object"
    ? body as Record<string, unknown>
    : {};
  const productQuantityProposal = Array.isArray(source.selectedOffers);
  const selectedOfferIds = Array.isArray(source.selectedOfferIds)
    ? source.selectedOfferIds.slice(0, 20).map((value) => clean(value, 120))
      .filter(Boolean)
    : [];
  const selectedOffers = Array.isArray(source.selectedOffers)
    ? source.selectedOffers.slice(0, 20).map((value) => {
      const selection = value && typeof value === "object"
        ? value as Record<string, unknown>
        : {};
      return {
        id: clean(selection.id, 120),
        quantity: Number(selection.quantity),
      };
    }).filter((selection) => selection.id)
    : [];
  return {
    requestId: clean(source.requestId, 36),
    fullName: clean(source.fullName, 160),
    businessEmail: clean(source.businessEmail, 320).toLowerCase(),
    companyName: clean(source.companyName, 200),
    description: clean(
      productQuantityProposal ? source.purchaseNote : source.description,
      productQuantityProposal ? 500 : 4_000,
    ),
    proposalSchema: productQuantityProposal
      ? "product_quantity"
      : "legacy_consulting",
    selectedOffers,
    consultingHours: Number(source.consultingHours),
    selectedOfferIds,
    website: clean(source.website, 200),
  };
}

export function validateConsultingRequest(
  input: ConsultingRequestInput,
  publishedWorkshopKeys: readonly string[] = [],
): string | null {
  if (input.website) return null;
  if (!UUID_RE.test(input.requestId)) return "Refresh the page and try again.";
  if (!input.fullName) return "Enter your full name.";
  if (!EMAIL_RE.test(input.businessEmail)) {
    return "Enter a valid business email.";
  }
  if (!input.companyName) return "Enter your company name.";
  if (
    input.proposalSchema === "legacy_consulting" &&
    input.description.length < 20
  ) {
    return "Describe the outcome you want in at least 20 characters.";
  }
  try {
    if (input.proposalSchema === "legacy_consulting") {
      buildLegacyConsultingProposalSnapshot({
        consultingHours: input.consultingHours,
        selectedOfferIds: input.selectedOfferIds,
      }, publishedWorkshopKeys);
    } else {
      buildProposalSnapshot({ selectedOffers: input.selectedOffers }, publishedWorkshopKeys);
    }
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Review your proposal selections.";
  }
  return null;
}

export function publishedWorkshopKeysFromEnv(value?: string | null): string[] {
  return (value ?? "").split(",").map((key) => key.trim()).filter(Boolean);
}

export function createProposalNumber(
  now = new Date(),
  random = crypto.randomUUID(),
): string {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `OFP-${date}-${random.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

export function createRequestRecord(options: {
  input: ConsultingRequestInput;
  requestFingerprint: string;
  userAgent: string;
  publishedWorkshopKeys?: readonly string[];
  proposalNumber?: string;
}): ConsultingRequestRecord {
  const snapshot = options.input.proposalSchema === "legacy_consulting"
    ? buildLegacyConsultingProposalSnapshot({
      consultingHours: options.input.consultingHours,
      selectedOfferIds: options.input.selectedOfferIds,
    }, options.publishedWorkshopKeys)
    : buildProposalSnapshot({
      selectedOffers: options.input.selectedOffers,
    }, options.publishedWorkshopKeys);
  return {
    request_id: options.input.requestId,
    proposal_number: options.proposalNumber ?? createProposalNumber(),
    proposal_version: 1,
    full_name: options.input.fullName,
    business_email: options.input.businessEmail,
    company_name: options.input.companyName,
    request_description: options.input.description,
    snapshot,
    binding_status: "non_binding_request",
    request_state: "received",
    notification_status: "pending",
    customer_confirmation_status: "pending",
    request_fingerprint: options.requestFingerprint,
    user_agent: options.userAgent.slice(0, 500),
  };
}

export function notificationText(record: ConsultingRequestRecord): string {
  const { snapshot } = record;
  const lines = snapshot.lines.map(formatProposalLine).join("\n\n");
  const purchaseNote = record.request_description
    ? `Purchase note or PO reference:\n${record.request_description}\n\n`
    : "";
  return `NON-BINDING PROPOSAL REQUEST
SUBMITTED · PENDING ORIONFOLD REVIEW

Proposal: ${record.proposal_number} · version ${record.proposal_version}
Name: ${record.full_name}
Company: ${record.company_name}
Business email: ${record.business_email}

${purchaseNote}Itemized request:
${lines}

List subtotal: ${formatUsd(snapshot.listSubtotalCents)}
Estimated bank-transfer savings (${
    formatEffectiveSavings(snapshot.effectiveSavingsBasisPoints)
  }): -${formatUsd(snapshot.savingsCents)}
Estimated final subtotal: ${formatUsd(snapshot.estimatedFinalSubtotalCents)}

Terms: ${snapshot.termsVersion}
Savings formula: ${snapshot.savingsFormulaVersion}

This request is not accepted, invoiced, due, or paid. Review product fit, quantities, availability, and fulfillment terms before responding. Orionfold promises a response within 24 hours, not acceptance or delivery.
`;
}

export function customerConfirmationText(
  record: ConsultingRequestRecord,
): string {
  const { snapshot } = record;
  const lines = snapshot.lines.map(formatProposalLine).join("\n\n");
  const purchaseNote = record.request_description
    ? `Purchase note or PO reference:\n${record.request_description}\n\n`
    : "";
  return `ORIONFOLD
WE RECEIVED YOUR NON-BINDING PROPOSAL REQUEST

Hello ${record.full_name},

This email is your copy of the proposal request submitted to Orionfold.

Proposal: ${record.proposal_number} · version ${record.proposal_version}
Company: ${record.company_name}
Status: Submitted · pending Orionfold review

${purchaseNote}Itemized request:
${lines}

List subtotal: ${formatUsd(snapshot.listSubtotalCents)}
Estimated bank-transfer savings (${
    formatEffectiveSavings(snapshot.effectiveSavingsBasisPoints)
  }): -${formatUsd(snapshot.savingsCents)}
Estimated final subtotal: ${formatUsd(snapshot.estimatedFinalSubtotalCents)}

What happens next:
- Orionfold will review the request and respond within 24 hours.
- Submission does not mean the request is accepted, invoiced, due, or paid.
- Product availability, final quantities, fulfillment terms, and any invoice require separate written acceptance.
- Reply to this email if you need to correct or clarify the request.

Terms version: ${snapshot.termsVersion}
Savings formula: ${snapshot.savingsFormulaVersion}

${snapshot.legalIdentity.name}
${snapshot.legalIdentity.postalAddress}
${snapshot.legalIdentity.email}
`;
}

function formatProposalLine(line: ProposalSnapshot["lines"][number]): string {
  const quantity = Number.isSafeInteger(line.quantity) && line.quantity > 0
    ? line.quantity
    : 1;
  const unitAmount = Number.isSafeInteger(line.unitAmountCents)
    ? line.unitAmountCents
    : line.amountCents;
  const unitLabel = line.unitLabel || "license";
  return `- ${line.label}\n  Quantity: ${quantity} ${unitLabel}\n  Unit price: ${
    formatUsd(unitAmount)
  }\n  Line total: ${formatUsd(line.amountCents)}\n  ${line.term}\n  ${line.includes}`;
}

export function publicReceipt(
  record: Pick<
    ConsultingRequestRecord,
    "proposal_number" | "proposal_version" | "snapshot"
  >,
) {
  return {
    proposalNumber: record.proposal_number,
    proposalVersion: record.proposal_version,
    requestState: "pending_review",
    bindingStatus: "non_binding_request",
    snapshot: record.snapshot,
  } as const;
}

export function shouldRateLimit(count: number | null, limit = 5): boolean {
  return count !== null && count >= limit;
}
