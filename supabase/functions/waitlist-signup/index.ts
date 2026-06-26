import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isHoneypotTripped, parseLeadInput } from "../_shared/lead-input.ts";

const ALLOWED_ORIGINS = [
  "https://orionfold.com",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(
  body: Record<string, unknown>,
  corsHeaders: Record<string, string>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const RATE_LIMIT = 5; // max signups per IP per hour

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, corsHeaders, 405);
  }

  try {
    const body = await req.json().catch(() => null);

    // Honeypot — bots fill hidden fields. Pretend success.
    if (isHoneypotTripped(body)) {
      return jsonResponse({ success: true }, corsHeaders);
    }

    const parsed = parseLeadInput(body, req.headers);
    if (!parsed.ok) {
      return jsonResponse({ error: parsed.error }, corsHeaders, 400);
    }
    const { columns, metadata } = parsed;
    const cleanEmail = columns.email;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", columns.ip_address)
      .gte("created_at", oneHourAgo);

    if (count !== null && count >= RATE_LIMIT) {
      return jsonResponse(
        { error: "Too many requests. Please try again later." },
        corsHeaders,
        429,
      );
    }

    const { data: existing } = await supabase
      .from("waitlist")
      .select("email, confirmed")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existing) {
      if (existing.confirmed) {
        return jsonResponse({
          success: true,
          message: "You're already on the list.",
          already_confirmed: true,
        }, corsHeaders);
      }
      const newToken = crypto.randomUUID();
      await supabase
        .from("waitlist")
        .update({
          confirm_token: newToken,
          offer: columns.offer,
          utm_source: columns.utm_source,
          utm_medium: columns.utm_medium,
          utm_campaign: columns.utm_campaign,
          utm_term: columns.utm_term,
          utm_content: columns.utm_content,
          referrer: columns.referrer,
          consent_text: columns.consent_text,
          metadata,
        })
        .eq("email", cleanEmail);

      await sendConfirmationEmail(cleanEmail, newToken);

      return jsonResponse({
        success: true,
        message: "We sent another confirmation link. Check your inbox.",
      }, corsHeaders);
    }

    const confirmToken = crypto.randomUUID();
    const { error: insertError } = await supabase.from("waitlist").insert({
      email: cleanEmail,
      confirmed: false,
      confirm_token: confirmToken,
      ip_address: columns.ip_address,
      user_agent: columns.user_agent,
      offer: columns.offer,
      utm_source: columns.utm_source,
      utm_medium: columns.utm_medium,
      utm_campaign: columns.utm_campaign,
      utm_term: columns.utm_term,
      utm_content: columns.utm_content,
      referrer: columns.referrer,
      consent_text: columns.consent_text,
      metadata,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return jsonResponse({ error: "Something went wrong. Please try again." }, corsHeaders, 500);
    }

    await sendConfirmationEmail(cleanEmail, confirmToken);

    return jsonResponse({ success: true }, corsHeaders);
  } catch (err) {
    console.error("Unhandled error:", err);
    return jsonResponse({ error: "Something went wrong. Please try again." }, corsHeaders, 500);
  }
});

async function sendConfirmationEmail(email: string, token: string) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const confirmUrl = `https://orionfold.supabase.co/functions/v1/confirm-email?token=${token}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Orionfold <manav@updates.orionfold.com>",
      reply_to: "manav@orionfold.com",
      to: [email],
      subject: "One click to get Orionfold stories",
      text: confirmationEmailText(confirmUrl),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend error:", res.status, text);
    throw new Error(`Resend API error: ${res.status}`);
  }
}

function confirmationEmailText(confirmUrl: string): string {
  return `Hi,

You're almost in. Confirm your email and we'll send you
our stories.

Each one is a short, honest note from building Orionfold
in public. What we shipped, what broke, and what we
learned along the way. No spam, just the real build log.

Confirm your email:

${confirmUrl}

This link expires in 7 days. If you didn't sign up, ignore
this email.

--
Orionfold
https://orionfold.com
`;
}
