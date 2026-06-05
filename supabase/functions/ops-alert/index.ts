// ops-alert (M5) — generic operator-alert email relay.
//
// A server-side caller holding OPS_ALERT_TOKEN (today: the Lighthouse CI
// workflow via scripts/notify-lighthouse-alert.mjs) POSTs { subject, lines[] }
// and this sends a plain-text email to the operator via Resend. The raw
// RESEND_API_KEY stays in Supabase secrets; callers only ever hold the
// low-value shared token (it can do nothing but email the operator).
//
// No CORS handling on purpose: callers are servers, not browsers — there is
// no preflight, and a browser caller without the token just gets 401.
//
// Additive only: never touches the waitlist/confirm-email funnel or commerce.

const MAX_SUBJECT = 200;
const MAX_LINES = 100;
const MAX_BODY_BYTES = 32 * 1024;

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Constant-time-ish token check without imports: compare SHA-256 digests
// byte-by-byte with a running XOR. Hashing first means input length never
// shapes the comparison.
async function tokenMatches(provided: string, expected: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(provided)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  const ua = new Uint8Array(a);
  const ub = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < ua.length; i++) diff |= ua[i] ^ ub[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const expected = Deno.env.get("OPS_ALERT_TOKEN");
  if (!expected) {
    console.error("OPS_ALERT_TOKEN not configured");
    return json({ error: "Not configured" }, 500);
  }
  const provided = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!provided || !(await tokenMatches(provided, expected))) {
    return json({ error: "Unauthorized" }, 401);
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ error: "Payload too large" }, 400);
  }
  let body: { subject?: unknown; lines?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const subject = typeof body.subject === "string"
    ? body.subject.trim().slice(0, MAX_SUBJECT)
    : "";
  const lines = Array.isArray(body.lines)
    ? body.lines.filter((l): l is string => typeof l === "string")
    : [];
  if (!subject || lines.length === 0 || lines.length > MAX_LINES) {
    return json({ error: "Expected { subject, lines[] } with 1-100 string lines" }, 400);
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return json({ error: "Not configured" }, 500);
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Orionfold Telemetry <manav@updates.orionfold.com>",
      to: ["manav@orionfold.com"],
      subject,
      text: lines.join("\n"),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Resend error:", res.status, detail);
    return json({ error: `Resend error ${res.status}` }, 502);
  }

  return json({ sent: true }, 202);
});
