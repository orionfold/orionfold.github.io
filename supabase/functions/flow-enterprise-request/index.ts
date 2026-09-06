import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import {
  type AlertEmail,
  createFlowEnterpriseHandler,
  defaultEnvironmentDependencies,
} from "./handler.ts";
import type {
  AlertStatus,
  FlowEnterpriseInsert,
  SaveResult,
} from "./contract.ts";

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw Object.assign(new Error("Missing server configuration"), {
      code: "missing_config",
    });
  }
  return value;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest)).map((byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

async function requestFingerprint(request: Request): Promise<string> {
  const address = request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ||
    "unknown";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env("FLOW_ENTERPRISE_FINGERPRINT_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(address),
  );
  return Array.from(new Uint8Array(signature)).map((byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

let supabase: SupabaseClient | undefined;
function database(): SupabaseClient {
  supabase ??= createClient(
    env("SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  return supabase;
}

async function saveEnquiry(record: FlowEnterpriseInsert): Promise<SaveResult> {
  const result = await database().rpc("save_flow_enterprise_enquiry", {
    p_request_id: record.requestId,
    p_name: record.name,
    p_email: record.email,
    p_company: record.company,
    p_requirements: record.requirements,
    p_licenses: record.licenses,
    p_heard_about: record.heardAbout,
    p_request_fingerprint: record.requestFingerprint,
    p_payload_hash: record.payloadHash,
  }).single();
  if (result.error) throw result.error;
  if (!result.data || typeof result.data !== "object") {
    throw Object.assign(new Error("Invalid database receipt"), {
      code: "invalid_receipt",
    });
  }
  const row = result.data as Record<string, unknown>;
  if (row.result === "rate_limited") return { kind: "rate_limited" };
  if (
    (row.result !== "created" && row.result !== "existing") ||
    typeof row.id !== "string" || !row.id ||
    row.request_id !== record.requestId ||
    typeof row.payload_hash !== "string" || !row.payload_hash ||
    !["pending", "sent", "failed"].includes(String(row.alert_status)) ||
    (row.alert_attempted_at !== null &&
      typeof row.alert_attempted_at !== "string") ||
    typeof row.alert_requires_manual_review !== "boolean"
  ) {
    throw Object.assign(new Error("Invalid database receipt"), {
      code: "invalid_receipt",
    });
  }
  return {
    kind: row.result,
    record: {
      id: row.id,
      requestId: record.requestId,
      payloadHash: row.payload_hash,
      alertStatus: row.alert_status as AlertStatus,
      alertAttemptedAt: row.alert_attempted_at,
      alertRequiresManualReview: row.alert_requires_manual_review,
    },
  };
}

async function updateAlert(
  id: string,
  values: {
    alertStatus: "pending" | "sent" | "failed";
    alertAttemptedAt: string;
    alertSentAt: string | null;
    alertErrorCode: string | null;
    alertProviderId: string | null;
    alertRequiresManualReview: boolean;
  },
): Promise<boolean> {
  let query = database().from("flow_enterprise_enquiries").update({
    alert_status: values.alertStatus,
    alert_attempted_at: values.alertAttemptedAt,
    alert_sent_at: values.alertSentAt,
    alert_error_code: values.alertErrorCode,
    alert_provider_id: values.alertProviderId,
    alert_requires_manual_review: values.alertRequiresManualReview,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (values.alertStatus !== "sent") query = query.neq("alert_status", "sent");
  const result = await query.select("id").maybeSingle();
  if (result.error) throw result.error;
  if (result.data === null) return false;
  if (
    !result.data || typeof result.data !== "object" ||
    (result.data as { id?: unknown }).id !== id
  ) {
    throw Object.assign(new Error("Invalid alert update receipt"), {
      code: "invalid_alert_receipt",
    });
  }
  return true;
}

async function sendAlert(email: AlertEmail): Promise<string> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
      "Idempotency-Key": email.idempotencyKey,
    },
    body: JSON.stringify({
      from: env("RESEND_FROM"),
      reply_to: email.replyTo,
      to: [email.to],
      subject: email.subject,
      text: email.text,
    }),
  });
  if (!response.ok) {
    throw Object.assign(new Error("Alert provider rejected request"), {
      code: `resend_${response.status}`,
    });
  }
  const receipt = await response.json().catch(() => null) as
    | { id?: unknown }
    | null;
  if (!receipt || typeof receipt.id !== "string" || !receipt.id) {
    throw Object.assign(new Error("Alert provider receipt was invalid"), {
      code: "resend_invalid_receipt",
    });
  }
  return receipt.id;
}

const handler = createFlowEnterpriseHandler({
  enabled: () => Deno.env.get("FLOW_ENTERPRISE_CONTACT_ENABLED") === "true",
  ...defaultEnvironmentDependencies,
  requestFingerprint,
  hashPayload: sha256,
  saveEnquiry,
  updateAlert,
  sendAlert,
  now: () => new Date().toISOString(),
  logError: (event, code) => console.error(event, code),
});

if (import.meta.main) Deno.serve(handler);
