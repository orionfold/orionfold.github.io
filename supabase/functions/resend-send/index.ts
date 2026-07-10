// Resend send seam for the marketing CRM nurture leg (relay latest+20/+25).
// Server-to-server, shared-credential auth, NOT browser CORS. Marketing's
// box-local poller (`nurture_send.py`) composes a ready-to-send email in-repo
// and POSTs it here; this fn relays it to Resend server-side. NEVER reads or
// writes the DB. The Resend key stays single-homed on the website box (the same
// posture as purchases-export / waitlist-export: marketing holds only a scoped
// send token, never the Resend credential).
//
// Why this shape (relay latest+20): marketing demoted beehiiv to the bulk weekly
// digest and moved triggered nurture repo-side. They own who/when/what (selection,
// scheduling, the approved copy, the consent scope); Resend is ONLY the send pipe.
// Of the two seams they offered (token endpoint vs scoped key) the website lane
// picked the endpoint so the Resend credential never leaves this box and there is
// one chokepoint over what the shared sending domain emits.
//
// Contract (marketing builds nurture_send.py to this):
//   POST  Authorization: Bearer <RESEND_SEND_TOKEN>
//   body: { to, subject, html?, text, tags? }
//     to       string  - single recipient (one nurture send = one contact)
//     subject  string  - rendered subject line
//     text     string  - REQUIRED plain-text body (Apple-MPP-proof; deliverability)
//     html     string  - optional html body
//     tags     {name,value}[] - optional Resend tags (e.g. campaign/step)
//   -> 200 { id }       the Resend message id (marketing logs it to ## Touches)
//   -> 4xx/5xx { error }
//
// Send identity is OWNED HERE, not by the caller:
//   from      "Orionfold <manav@updates.orionfold.com>" (the one verified domain)
//   reply_to  manav@orionfold.com
//   footer    the recipient-tokenized one-click footer (footerFor) is appended to
//             BOTH text and html server-side, so a nurture send can never ship
//             without the CAN-SPAM address + a working one-click unsubscribe link,
//             and neither can drift from the other customer emails. We also set
//             List-Unsubscribe + List-Unsubscribe-Post (RFC 8058) with the same tok.
//
// Welcome ownership: the magnet confirm + book-delivery email stays the website's
// (confirm-email / book-files). Marketing nurture starts AFTER that, so there is
// no double-welcome. This fn sends only what marketing hands it.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { footerFor, UNSUB_BASE } from "../_shared/email-footer.ts";
import { getOrMintToken } from "../_shared/email-tokens.ts";

const AUTH_PREFIX = "Bearer ";
const FROM = "Orionfold <manav@updates.orionfold.com>";
const REPLY_TO = "manav@orionfold.com";

export interface SendInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  tags?: { name: string; value: string }[];
}

// Constant-time shared-credential compare (identical posture to purchases-export):
// length mismatch fails fast, otherwise every byte is XOR-accumulated, no early
// exit. `expected` is read from env by the caller, never inlined.
export function authorized(headers: Headers, expected: string): boolean {
  if (!expected) return false;
  const auth = headers.get("Authorization") || "";
  if (!auth.startsWith(AUTH_PREFIX)) return false;
  const provided = auth.slice(AUTH_PREFIX.length);
  const enc = new TextEncoder();
  const a = enc.encode(provided);
  const b = enc.encode(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validate the caller's payload into a SendInput, or return a reason string.
// Keep this pure + exported so the contract is unit-tested without a live send.
export function validate(body: unknown): { ok: true; input: SendInput } | { ok: false; reason: string } {
  if (typeof body !== "object" || body === null) return { ok: false, reason: "body must be an object" };
  const b = body as Record<string, unknown>;
  const to = b.to;
  if (typeof to !== "string" || !EMAIL_RE.test(to)) return { ok: false, reason: "to must be a valid email" };
  if (typeof b.subject !== "string" || b.subject.trim() === "") return { ok: false, reason: "subject is required" };
  if (typeof b.text !== "string" || b.text.trim() === "") return { ok: false, reason: "text is required" };
  if (b.html !== undefined && typeof b.html !== "string") return { ok: false, reason: "html must be a string" };
  let tags: { name: string; value: string }[] | undefined;
  if (b.tags !== undefined) {
    if (!Array.isArray(b.tags)) return { ok: false, reason: "tags must be an array" };
    for (const t of b.tags) {
      if (typeof t !== "object" || t === null) return { ok: false, reason: "each tag must be an object" };
      const tt = t as Record<string, unknown>;
      if (typeof tt.name !== "string" || typeof tt.value !== "string") {
        return { ok: false, reason: "each tag needs string name + value" };
      }
    }
    tags = b.tags as { name: string; value: string }[];
  }
  return {
    ok: true,
    input: { to, subject: b.subject, text: b.text, html: b.html as string | undefined, tags },
  };
}

// Append the given (already recipient-tokenized) footer to whichever bodies are
// present. text always exists (required); html only if the caller sent one.
export function withFooter(input: SendInput, footer: string): { text: string; html?: string } {
  const text = `${input.text}\n\n${footer}`;
  const html =
    input.html === undefined
      ? undefined
      : `${input.html}\n<pre style="font:inherit;white-space:pre-wrap">${footer}</pre>`;
  return { text, html };
}

// RFC 8058 one-click headers so Gmail/Apple render a native Unsubscribe control
// that POSTs to our fn. Same tok as the footer link.
export function listUnsubHeaders(tok: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${UNSUB_BASE}?t=${tok}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

if (import.meta.main) {
  Deno.serve(async (req) => {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const expected = Deno.env.get("RESEND_SEND_TOKEN") ?? "";
    if (!authorized(req.headers, expected)) return json({ error: "Unauthorized" }, 401);

    let parsed: unknown;
    try {
      parsed = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const v = validate(parsed);
    if (!v.ok) return json({ error: v.reason }, 400);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) return json({ error: "RESEND_API_KEY not configured" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const tok = await getOrMintToken(supabase, v.input.to);

    const { text, html } = withFooter(v.input, footerFor(tok));
    const payload: Record<string, unknown> = {
      from: FROM,
      reply_to: REPLY_TO,
      to: [v.input.to],
      subject: v.input.subject,
      text,
      headers: listUnsubHeaders(tok),
    };
    if (html !== undefined) payload.html = html;
    if (v.input.tags) payload.tags = v.input.tags;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Resend error:", res.status, detail);
      return json({ error: `Resend API error: ${res.status}` }, 502);
    }

    const data = (await res.json()) as { id?: string };
    return json({ id: data.id ?? null });
  });
}
