export const FLOW_ENTERPRISE_SOURCE = "flow_pricing" as const;
export const FLOW_ENTERPRISE_RATE_LIMIT = 5;
export const FLOW_ENTERPRISE_BODY_LIMIT_BYTES = 32_768;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AlertStatus = "pending" | "sent" | "failed";

export interface FlowEnterpriseInput {
  requestId: string;
  name: string;
  email: string;
  company: string;
  requirements: string;
  licenses: number;
  heardAbout: string;
  website: string;
}

export interface FlowEnterpriseInsert {
  requestId: string;
  name: string;
  email: string;
  company: string;
  requirements: string;
  licenses: number;
  heardAbout: string | null;
  source: typeof FLOW_ENTERPRISE_SOURCE;
  requestFingerprint: string;
  payloadHash: string;
}

export interface FlowEnterpriseStored {
  id: string;
  requestId: string;
  payloadHash: string;
  alertStatus: AlertStatus;
  alertAttemptedAt: string | null;
  alertRequiresManualReview: boolean;
}

export type SaveResult =
  | { kind: "created" | "existing"; record: FlowEnterpriseStored }
  | { kind: "rate_limited" };

type ValidationResult =
  | { ok: true; input: FlowEnterpriseInput }
  | { ok: false; error: string };

function textField(
  source: Record<string, unknown>,
  key: string,
  max: number,
  required: boolean,
): { value?: string; error?: string } {
  const raw = source[key];
  if (raw === undefined && !required) return { value: "" };
  if (typeof raw !== "string") return { error: `Invalid ${key}.` };
  const value = raw.trim();
  if (required && !value) return { error: `Enter ${key}.` };
  if ([...value].length > max) return { error: `${key} is too long.` };
  return { value };
}

export function validateFlowEnterpriseBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Invalid request body." };
  }
  const source = body as Record<string, unknown>;
  const requestId = textField(source, "requestId", 36, true);
  if (requestId.error || !UUID_RE.test(requestId.value ?? "")) {
    return { ok: false, error: "Refresh the page and try again." };
  }
  const name = textField(source, "name", 120, true);
  if (name.error) return { ok: false, error: name.error };
  const email = textField(source, "email", 254, true);
  if (email.error || !EMAIL_RE.test(email.value ?? "")) {
    return { ok: false, error: "Enter a valid email." };
  }
  const company = textField(source, "company", 200, true);
  if (company.error) return { ok: false, error: company.error };
  const requirements = textField(source, "requirements", 6_000, true);
  if (requirements.error) return { ok: false, error: requirements.error };
  const heardAbout = textField(source, "heardAbout", 240, false);
  if (heardAbout.error) return { ok: false, error: heardAbout.error };
  const website = textField(source, "website", 500, false);
  if (website.error) return { ok: false, error: website.error };

  if (
    typeof source.licenses !== "number" ||
    !Number.isSafeInteger(source.licenses) ||
    source.licenses < 1 ||
    source.licenses > 100_000
  ) {
    return { ok: false, error: "Enter a license count from 1 to 100000." };
  }

  return {
    ok: true,
    input: {
      requestId: requestId.value!.toLowerCase(),
      name: name.value!,
      email: email.value!.toLowerCase(),
      company: company.value!,
      requirements: requirements.value!,
      licenses: source.licenses,
      heardAbout: heardAbout.value!,
      website: website.value!,
    },
  };
}

export function canonicalPayload(input: FlowEnterpriseInput): string {
  return JSON.stringify({
    requestId: input.requestId,
    name: input.name,
    email: input.email,
    company: input.company,
    requirements: input.requirements,
    licenses: input.licenses,
    heardAbout: input.heardAbout,
    source: FLOW_ENTERPRISE_SOURCE,
  });
}

export function createInsert(
  input: FlowEnterpriseInput,
  requestFingerprint: string,
  payloadHash: string,
): FlowEnterpriseInsert {
  return {
    requestId: input.requestId,
    name: input.name,
    email: input.email,
    company: input.company,
    requirements: input.requirements,
    licenses: input.licenses,
    heardAbout: input.heardAbout || null,
    source: FLOW_ENTERPRISE_SOURCE,
    requestFingerprint,
    payloadHash,
  };
}

export function alertText(input: FlowEnterpriseInput): string {
  return `FLOW ENTERPRISE ENQUIRY

Request ID: ${input.requestId}
Source: Flow pricing
Name: ${input.name}
Email: ${input.email}
Company: ${input.company}
Licenses: ${input.licenses}
Where they heard about Flow: ${input.heardAbout || "Not provided"}

Requirements:
${input.requirements}
`;
}

export function safeErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code?: unknown }).code ?? "");
    if (/^[a-z0-9_-]{1,80}$/i.test(code)) return code;
  }
  return error instanceof Error && /^[A-Za-z][A-Za-z0-9]*$/.test(error.name)
    ? error.name
    : "unknown";
}
