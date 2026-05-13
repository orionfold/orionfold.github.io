import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
    const body = await req.json();
    const { email, website } = body;

    // Honeypot — bots fill hidden fields
    if (website) {
      return jsonResponse({ success: true }, corsHeaders);
    }

    if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return jsonResponse({ error: "Please enter a valid email address." }, corsHeaders, 400);
    }

    const cleanEmail = email.trim().toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
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
        .update({ confirm_token: newToken })
        .eq("email", cleanEmail);

      await sendConfirmationEmail(cleanEmail, newToken);

      return jsonResponse({
        success: true,
        message: "We sent another confirmation link. Check your inbox.",
      }, corsHeaders);
    }

    const confirmToken = crypto.randomUUID();
    const userAgent = req.headers.get("user-agent") || "";

    const { error: insertError } = await supabase.from("waitlist").insert({
      email: cleanEmail,
      confirmed: false,
      confirm_token: confirmToken,
      ip_address: ip,
      user_agent: userAgent,
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
      from: "orionfold studio <manav@updates.orionfold.com>",
      reply_to: "manav@orionfold.com",
      to: [email],
      subject: "confirm your orionfold subscription",
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
  return `hi,

thanks for subscribing to word from the studio.

orionfold is an ai product studio. small, deliberate, local.
this list gets occasional updates — when something ships, when
something is worth saying.

click the link below to confirm your email:

${confirmUrl}

this link expires in 7 days. if you didn't request this, you can
safely ignore this email.

--
orionfold
https://orionfold.com
a studio for the machines that will build the next machines
`;
}
