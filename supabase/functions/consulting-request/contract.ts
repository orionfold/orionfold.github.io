import {
  buildProposalSnapshot,
  formatEffectiveSavings,
  formatUsd,
  type ProposalSnapshot,
} from "../_shared/consulting-proposal.ts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ConsultingRequestInput {
  requestId: string;
  fullName: string;
  businessEmail: string;
  companyName: string;
  description: string;
  consultingHours: number;
  selectedOfferIds: string[];
  website: string;
}

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
  notification_status: "pending";
  request_fingerprint: string;
  user_agent: string;
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function parseConsultingRequest(body: unknown): ConsultingRequestInput {
  const source = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const selectedOfferIds = Array.isArray(source.selectedOfferIds)
    ? source.selectedOfferIds.slice(0, 20).map((value) => clean(value, 120)).filter(Boolean)
    : [];
  return {
    requestId: clean(source.requestId, 36),
    fullName: clean(source.fullName, 160),
    businessEmail: clean(source.businessEmail, 320).toLowerCase(),
    companyName: clean(source.companyName, 200),
    description: clean(source.description, 4_000),
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
  if (!EMAIL_RE.test(input.businessEmail)) return "Enter a valid business email.";
  if (!input.companyName) return "Enter your company name.";
  if (input.description.length < 20) return "Describe the outcome you want in at least 20 characters.";
  try {
    buildProposalSnapshot({
      consultingHours: input.consultingHours,
      selectedOfferIds: input.selectedOfferIds,
    }, publishedWorkshopKeys);
  } catch (error) {
    return error instanceof Error ? error.message : "Review your proposal selections.";
  }
  return null;
}

export function publishedWorkshopKeysFromEnv(value?: string | null): string[] {
  return (value ?? "").split(",").map((key) => key.trim()).filter(Boolean);
}

export function createProposalNumber(now = new Date(), random = crypto.randomUUID()): string {
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
  const snapshot = buildProposalSnapshot({
    consultingHours: options.input.consultingHours,
    selectedOfferIds: options.input.selectedOfferIds,
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
    request_fingerprint: options.requestFingerprint,
    user_agent: options.userAgent.slice(0, 500),
  };
}

export function notificationText(record: ConsultingRequestRecord): string {
  const { snapshot } = record;
  const lines = snapshot.lines.map((line) =>
    `- ${line.label}\n  ${line.term}\n  ${formatUsd(line.amountCents)}\n  ${line.includes}`
  ).join("\n\n");
  return `NON-BINDING PROPOSAL REQUEST
SUBMITTED · PENDING ORIONFOLD REVIEW

Proposal: ${record.proposal_number} · version ${record.proposal_version}
Name: ${record.full_name}
Company: ${record.company_name}
Business email: ${record.business_email}

Requested outcome:
${record.request_description}

Itemized request:
${lines}

List subtotal: ${formatUsd(snapshot.listSubtotalCents)}
Estimated bank-transfer savings (${formatEffectiveSavings(snapshot.effectiveSavingsBasisPoints)}): -${formatUsd(snapshot.savingsCents)}
Estimated final pre-tax subtotal: ${formatUsd(snapshot.estimatedFinalSubtotalCents)}

Terms: ${snapshot.termsVersion}
Savings formula: ${snapshot.savingsFormulaVersion}

This request is not accepted, scheduled, invoiced, due, or paid. Review scope and founder availability before responding. Orionfold promises a response within 24 hours, not acceptance or delivery.
`;
}

export function publicReceipt(record: Pick<ConsultingRequestRecord, "proposal_number" | "proposal_version" | "snapshot">) {
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
