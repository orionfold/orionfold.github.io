export const OFFER = "flow-living-documents-v1";
export const CONSENT_TEXT =
  "Send me Flow updates, Living Documents Jobs, and the AI Native Newsletter. Up to one email a week. Unsubscribe any time.";
// Preserve this exact sentence for already-open forms, retry identity and historic consent.
export const LEGACY_CONSENT_TEXT =
  "Send me Flow updates, Living Documents methods, and the AI Native Newsletter. Up to one email a week. Unsubscribe any time.";
export type ConsentText = typeof CONSENT_TEXT | typeof LEGACY_CONSENT_TEXT;
function isConsentText(value: unknown): value is ConsentText {
  return value === CONSENT_TEXT || value === LEGACY_CONSENT_TEXT;
}
export const SOURCE = "manifesto-living-documents";
export const ACCEPTED_MESSAGE =
  "If confirmation is needed and this address can receive updates, a confirmation email will arrive shortly.";
export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "v",
] as const;
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const TOKEN = /^[0-9a-f]{64}$/;
export type SignupInput = {
  requestId: string;
  email: string;
  offer: typeof OFFER;
  consent_text: ConsentText;
  consent_accepted: true;
  source: typeof SOURCE;
  attribution: Record<string, string>;
};
export function parseSignup(body: unknown): SignupInput | "honeypot" | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>;
  if (typeof value.website === "string" && value.website.length) {
    return "honeypot";
  }
  const email = typeof value.email === "string"
    ? value.email.trim().toLowerCase()
    : "";
  const consentText = value.consent_text;
  if (
    !email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof value.requestId !== "string" || !UUID.test(value.requestId) ||
    value.offer !== OFFER || !isConsentText(consentText) ||
    value.consent_accepted !== true || value.source !== SOURCE
  ) return null;
  const attribution: Record<string, string> = {};
  if (
    value.attribution && typeof value.attribution === "object" &&
    !Array.isArray(value.attribution)
  ) {
    for (const key of ATTRIBUTION_KEYS) {
      const field = (value.attribution as Record<string, unknown>)[key];
      if (
        typeof field === "string" && field.length <= 200 &&
        !/[\x00-\x1f\x7f]/.test(field)
      ) attribution[key] = field;
    }
  }
  return {
    requestId: value.requestId.toLowerCase(),
    email,
    offer: OFFER,
    consent_text: consentText,
    consent_accepted: true,
    source: SOURCE,
    attribution,
  };
}
export function canonicalPayload(input: SignupInput): string {
  return JSON.stringify({
    email: input.email,
    offer: input.offer,
    consent: input.consent_text,
    source: input.source,
    attribution: Object.fromEntries(
      Object.entries(input.attribution).sort(([a], [b]) => a.localeCompare(b)),
    ),
  });
}
// Keep the old endpoint URL for legacy retry bodies and provider idempotency.
// New Jobs subscriptions use the site's dedicated page, where HTML can render.
export function confirmationUrl(
  environment: { site: string; functionsBase: string },
  token: string,
  consentText: ConsentText,
): string {
  if (!TOKEN.test(token)) throw new Error("invalid_confirmation_token");
  return consentText === LEGACY_CONSENT_TEXT
    ? `${environment.functionsBase}/flow-living-documents-confirm?token=${token}`
    : `${environment.site}/flow/confirm/?token=${token}`;
}

export function confirmationEmail(
  url: string,
  footer: string,
  consentText: ConsentText,
): { subject: string; text: string } {
  return {
    subject: "Confirm your Flow updates and AI Native Newsletter",
    text:
      `Confirm the email updates you requested:\n\n${consentText}\n\nOpen this link, then select Confirm subscription:\n${url}\n\nThe link expires in seven days. If you did not request this, you can ignore this email.\n\n${footer}`,
  };
}
export async function readLimitedBody(
  request: Request,
  limit = 8192,
): Promise<string> {
  if (!request.body) throw new Error("invalid_body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error("body_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, at);
    at += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
