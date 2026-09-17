import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import { footerForEmail } from "../_shared/email-footer.ts";
import { serviceEnvironment } from "../_shared/service-environment.ts";
import {
  canonicalPayload,
  confirmationEmail,
  type SignupInput,
} from "./contract.ts";
import { createSignupHandler } from "./handler.ts";
import { readLivingDocumentSuppressions } from "./suppression.ts";
function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error("missing_configuration");
  return value;
}
const hex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0"))
    .join("");
export async function hash(value: string): Promise<string> {
  return hex(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}
async function sign(value: string): Promise<string> {
  const secret = env("FLOW_LIVING_DOCUMENTS_SIGNUP_SECRET");
  if (secret.length < 32) throw new Error("invalid_configuration");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)),
  );
}
let client: SupabaseClient | undefined;
function db() {
  return client ??= createClient(
    env("SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
async function prepare(input: SignupInput, request: Request) {
  const token = await sign(`confirmation:${input.requestId}:${input.email}`);
  const ip = request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ||
    "unknown";
  const { data, error } = await db().rpc(
    "reserve_flow_living_documents_signup",
    {
      p_request_id: input.requestId,
      p_email: input.email,
      p_payload_hash: await hash(canonicalPayload(input)),
      p_request_fingerprint: await sign(`fingerprint:${ip}`),
      p_token_hash: await hash(token),
      p_offer: input.offer,
      p_consent_text: input.consent_text,
      p_source: input.source,
      p_attribution: input.attribution,
    },
  ).single();
  if (error || !data || typeof data !== "object") {
    throw new Error("invalid_reservation");
  }
  const row = data as Record<string, unknown>;
  if (typeof row.result !== "string" || !Number.isInteger(row.claim_version)) {
    throw new Error("invalid_reservation");
  }
  return { result: row.result, claimVersion: Number(row.claim_version), token };
}
async function suppressed(email: string) {
  const matches = await readLivingDocumentSuppressions(
    [email],
    async (emails) =>
      await db().rpc("flow_living_documents_suppressions", {
        p_emails: emails,
      }),
  );
  return matches.has(email);
}
async function deliver(input: SignupInput, token: string): Promise<string> {
  const footer = await footerForEmail(db(), input.email);
  const { subject, text } = confirmationEmail(
    `${serviceEnvironment().functionsBase}/flow-living-documents-confirm?token=${token}`,
    footer,
  );
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `flow-living-documents:${input.requestId}`,
    },
    body: JSON.stringify({
      from: env("RESEND_FROM"),
      to: [input.email],
      subject,
      text,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("confirmation_delivery_unverified");
  const receipt = await response.json().catch(() => null);
  if (!receipt || typeof receipt.id !== "string" || !receipt.id) {
    throw new Error("invalid_delivery_receipt");
  }
  return receipt.id;
}
async function finish(
  requestId: string,
  claimVersion: number,
  providerId: string | null,
): Promise<boolean> {
  const { data, error } = await db().rpc(
    "finish_flow_living_documents_signup",
    {
      p_request_id: requestId,
      p_claim_version: claimVersion,
      p_provider_id: providerId,
    },
  );
  if (error) throw new Error("delivery_record_unavailable");
  return data === true;
}
export const handler = createSignupHandler({
  enabled: () => Deno.env.get("LIVING_DOCUMENTS_SIGNUP_ENABLED") === "true",
  allowedOrigins: () => serviceEnvironment().allowedOrigins,
  prepare,
  suppressed,
  deliver,
  finish,
});
if (import.meta.main) Deno.serve(handler);
