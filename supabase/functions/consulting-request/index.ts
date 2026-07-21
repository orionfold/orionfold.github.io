import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  createRequestRecord,
  parseConsultingRequest,
  publicReceipt,
  publishedWorkshopKeysFromEnv,
  shouldRateLimit,
  validateConsultingRequest,
} from "./contract.ts";
import {
  deliverProposalEmails,
  type DeliveryDependencies,
  type ProposalDeliveryRecord,
  type ProposalEmail,
} from "./delivery.ts";

const RATE_LIMIT = 5;
const PROPOSAL_ROW_COLUMNS =
  "id, request_id, proposal_number, proposal_version, full_name, business_email, company_name, request_description, snapshot, binding_status, request_state, notification_status, customer_confirmation_status, request_fingerprint, user_agent";

async function sendEmail(args: ProposalEmail): Promise<void> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const resendFrom = Deno.env.get("RESEND_FROM");
  if (!resendKey || !resendFrom) {
    throw new Error("Resend configuration is missing");
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": args.idempotencyKey,
    },
    body: JSON.stringify({
      from: resendFrom,
      reply_to: args.replyTo,
      to: [args.to],
      subject: args.subject,
      text: args.text,
    }),
  });
  if (!response.ok) throw new Error(`Resend returned ${response.status}`);
}

function deliveryDependencies(
  supabase: SupabaseClient,
): DeliveryDependencies {
  return {
    now: () => new Date().toISOString(),
    sendEmail,
    updateProposal: async (id, values) => {
      const updated = await supabase.from("consulting_proposals").update(values)
        .eq("id", id);
      if (updated.error) throw updated.error;
    },
    logError: (message, error) => console.error(message, error),
  };
}

async function requestFingerprint(
  req: Request,
  secret: string,
): Promise<string> {
  const ip = req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(ip),
  );
  return Array.from(new Uint8Array(signed)).map((byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, cors, 405);
  }

  try {
    const input = parseConsultingRequest(await req.json().catch(() => ({})));
    if (input.website) return jsonResponse({ success: true }, cors);
    const publishedWorkshopKeys = publishedWorkshopKeysFromEnv(
      Deno.env.get("PUBLISHED_WORKSHOP_LOOKUP_KEYS"),
    );
    const error = validateConsultingRequest(input, publishedWorkshopKeys);
    if (error) return jsonResponse({ error }, cors, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      throw new Error("Supabase service configuration is missing");
    }
    const supabase = createClient(supabaseUrl, serviceKey);

    // The browser supplies an opaque UUID only for retry safety. A replay gets
    // the already-computed public receipt and retries only a missing delivery;
    // Resend idempotency keys prevent duplicate operator/customer messages.
    const existing = await supabase
      .from("consulting_proposals")
      .select(PROPOSAL_ROW_COLUMNS)
      .eq("request_id", input.requestId)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) {
      const record = existing.data as ProposalDeliveryRecord;
      const delivery = await deliverProposalEmails(
        record,
        deliveryDependencies(supabase),
      );
      return jsonResponse({
        success: true,
        replay: true,
        ...delivery,
        ...publicReceipt(record),
      }, cors);
    }

    const fingerprint = await requestFingerprint(req, serviceKey);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1_000).toISOString();
    const rate = await supabase
      .from("consulting_proposals")
      .select("*", { count: "exact", head: true })
      .eq("request_fingerprint", fingerprint)
      .gte("created_at", oneHourAgo);
    if (rate.error) throw rate.error;
    if (shouldRateLimit(rate.count, RATE_LIMIT)) {
      return jsonResponse(
        { error: "Too many proposal requests. Try again later." },
        cors,
        429,
      );
    }

    const record = createRequestRecord({
      input,
      requestFingerprint: fingerprint,
      userAgent: req.headers.get("user-agent") || "",
      publishedWorkshopKeys,
    });
    const inserted = await supabase.from("consulting_proposals").insert(record)
      .select("id").single();
    if (inserted.error) {
      // A same-request race is idempotent. Re-read the winning immutable row.
      if (inserted.error.code === "23505") {
        const replay = await supabase
          .from("consulting_proposals")
          .select(PROPOSAL_ROW_COLUMNS)
          .eq("request_id", input.requestId)
          .single();
        if (!replay.error) {
          const winningRecord = replay.data as ProposalDeliveryRecord;
          const delivery = await deliverProposalEmails(
            winningRecord,
            deliveryDependencies(supabase),
          );
          return jsonResponse({
            success: true,
            replay: true,
            ...delivery,
            ...publicReceipt(winningRecord),
          }, cors);
        }
      }
      throw inserted.error;
    }

    const storedRecord: ProposalDeliveryRecord = {
      ...record,
      id: inserted.data.id,
    };
    const delivery = await deliverProposalEmails(
      storedRecord,
      deliveryDependencies(supabase),
    );

    return jsonResponse(
      {
        success: true,
        ...delivery,
        ...publicReceipt(record),
      },
      cors,
      201,
    );
  } catch (error) {
    console.error(
      "Consulting request failed",
      error instanceof Error ? error.message : "unknown error",
    );
    return jsonResponse(
      { error: "We could not save the proposal request. Try again." },
      cors,
      500,
    );
  }
});
