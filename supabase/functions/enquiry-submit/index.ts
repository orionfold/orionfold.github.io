// enquiry-submit (R2) — custom project briefs from the roadmap selection drawer.
//
// A visitor ticks offerings/features on /roadmap, opens the enquiry drawer, and
// sends a brief. This writes one row to the `enquiries` table (created by the C3
// commerce migration) and emails the operator a notification via Resend.
//
// Mirrors `waitlist-signup` exactly: honeypot, email validation, per-IP rate
// limit, service-role DB write, Resend send. CORS allowlist is the production
// origin only, so a real submit CORS-fails from localhost — the live-domain
// submit test is an ops step (L1), same as the waitlist funnel.
//
// Additive only: never touches the live waitlist/confirm-email funnel.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT = 5; // max enquiries per IP per hour

// Field caps — defensive bounds so a crafted payload can't bloat the row/email.
const MAX_NAME = 200;
const MAX_COMPANY = 200;
const MAX_DESCRIPTION = 4000;
const MAX_ITEMS = 60;
const MAX_LABEL = 300;
const MAX_ID = 200;

interface SelectedItem {
  id: string;
  label: string;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanItems(value: unknown): SelectedItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, MAX_ITEMS)
    .map((it) => ({
      id: cleanText((it as Record<string, unknown>)?.id, MAX_ID),
      label: cleanText((it as Record<string, unknown>)?.label, MAX_LABEL),
    }))
    .filter((it) => it.id || it.label);
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, corsHeaders, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { email, website } = body;

    // Honeypot — bots fill hidden fields. Silently accept so they don't retry.
    if (website) {
      return jsonResponse({ success: true }, corsHeaders);
    }

    if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return jsonResponse({ error: "Please enter a valid email address." }, corsHeaders, 400);
    }
    const cleanEmail = email.trim().toLowerCase();

    const name = cleanText(body.name, MAX_NAME);
    const company = cleanText(body.company, MAX_COMPANY);
    const description = cleanText(body.description, MAX_DESCRIPTION);
    const items = cleanItems(body.items);

    // A brief with no description and no picked items isn't actionable.
    if (!description && items.length === 0) {
      return jsonResponse(
        { error: "Tell us a little about what you need, or pick a few items." },
        corsHeaders,
        400,
      );
    }

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
      .from("enquiries")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", oneHourAgo);

    if (count !== null && count >= RATE_LIMIT) {
      return jsonResponse(
        { error: "Too many enquiries. Please try again later." },
        corsHeaders,
        429,
      );
    }

    const userAgent = req.headers.get("user-agent") || "";

    const { error: insertError } = await supabase.from("enquiries").insert({
      name: name || null,
      company: company || null,
      email: cleanEmail,
      description: description || null,
      selected_items: items,
      ip_address: ip,
      user_agent: userAgent,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return jsonResponse({ error: "Something went wrong. Please try again." }, corsHeaders, 500);
    }

    // Notify the operator. A failed send must not lose the brief — the row is
    // already saved, so log and still return success.
    try {
      await sendEnquiryNotification({ name, company, email: cleanEmail, description, items });
    } catch (mailErr) {
      console.error("Enquiry notification failed (row saved):", mailErr);
    }

    return jsonResponse(
      { success: true, message: "Thanks — we'll get back to you soon." },
      corsHeaders,
    );
  } catch (err) {
    console.error("Unhandled error:", err);
    return jsonResponse({ error: "Something went wrong. Please try again." }, corsHeaders, 500);
  }
});

async function sendEnquiryNotification(opts: {
  name: string;
  company: string;
  email: string;
  description: string;
  items: SelectedItem[];
}) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const itemLines = opts.items.length
    ? opts.items.map((it) => `  - ${it.label || it.id}`).join("\n")
    : "  (none)";

  const text = `New custom enquiry from the roadmap.

Name:    ${opts.name || "(not given)"}
Company: ${opts.company || "(not given)"}
Email:   ${opts.email}

What they need:
${opts.description || "(no description)"}

Selected items (${opts.items.length}):
${itemLines}

--
Reply straight to this email to reach them.
Sent from https://orionfold.com/roadmap
`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Orionfold <manav@updates.orionfold.com>",
      reply_to: opts.email,
      to: ["manav@orionfold.com"],
      subject: `New enquiry: ${opts.name || opts.email}`,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Resend error:", res.status, body);
    throw new Error(`Resend API error: ${res.status}`);
  }
}
