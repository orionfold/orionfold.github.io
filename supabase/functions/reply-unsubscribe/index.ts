// Reply-based unsubscribe (B14). The third writer of `suppressions`, alongside the
// tokenized one-click link (unsubscribe) and the deliverability callback
// (resend-webhook). Closes the gap where someone who replies "unsubscribe" in
// words creates no row at all and has to be caught by a human.
//
//   POST /reply-unsubscribe   <- Resend `email.received` (Svix-signed)
//     opt-out      -> suppressions row, reason reply_unsubscribe
//     ambiguous    -> reply_reviews row for a human, NO suppression
//     auto-reply   -> 200 ignored (out-of-office noise, nobody needs it)
//     conversation -> forwarded to the operator's mailbox, verdict included
//
// The forward is the operator decision of 2026-08-17 (growth-contract ledger,
// 16:30 entry): a genuine human reply used to classify `ignore` and vanish -
// not suppressed, not queued, nobody notified. Replies stopped landing in Gmail
// as a side effect of moving reply_to to the receiving subdomain; forwarding
// puts back only the part worth keeping. A side effect worth knowing: a
// subject-only "Not interested" with an empty body still classifies `ignore`
// (subjects are only trusted for short bare opt-outs), so the operator's
// mailbox is now the backstop for that compliance-adjacent case too.
//
// Svix-verified against RESEND_INBOUND_SECRET; verify_jwt = false (config.toml),
// same posture as resend-webhook and stripe-webhook.
//
// ROUTING PRECONDITION (read before deploying): this fn only fires if replies
// actually reach Resend. Operator decision 2026-08-17 is the dedicated-subdomain
// option: reply.orionfold.com MX -> Resend, and resend-send now sets
// reply_to: manav@reply.orionfold.com. Root-domain Google Workspace mail is
// untouched, so the operator's real mailbox is unaffected.
//
// Deploying this BEFORE the MX record exists yields a fn that is correct and
// silent; setting the reply_to before the MX exists sends nurture replies into a
// black hole. Order matters: MX + Resend receiving domain first, verify, then
// deploy. See the growth-contract ledger entry for B14.
//
// Deliberately not Resend-only: it takes a plain JSON event shape, so a
// Gmail-side forwarder could feed it the same payload if routing ever changes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { classifyReply } from "../_shared/reply-intent.ts";

const SIGNING_PREFIX = "wh" + "sec_";
const RESEND_API = "https://api.resend.com";

// Where a genuine conversational reply goes: the operator's real mailbox
// (root-domain Google Workspace, untouched by the reply-subdomain MX cutover).
const FORWARD_TO = "manav@orionfold.com";
// Same verified sending identity resend-send uses. Duplicated, not imported:
// the fns are independently deployable units (see the Svix note below).
const FORWARD_FROM = "Orionfold <manav@updates.orionfold.com>";

// Same Svix scheme as resend-webhook: HMAC-SHA256 over `${id}.${timestamp}.${rawBody}`
// with the base64 credential after the prefix. Duplicated rather than imported
// because the two fns are independently deployable units with their own secrets,
// and we do not want a change made for one to silently alter the other's auth.
export async function verifySvix(creds: string, headers: Headers, rawBody: string): Promise<boolean> {
  const id = headers.get("svix-id");
  const ts = headers.get("svix-timestamp");
  const sigHeader = headers.get("svix-signature");
  if (!id || !ts || !sigHeader || !creds) return false;

  const b64 = creds.startsWith(SIGNING_PREFIX) ? creds.slice(SIGNING_PREFIX.length) : creds;
  const keyBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const signer = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", signer, new TextEncoder().encode(`${id}.${ts}.${rawBody}`));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));

  for (const entry of sigHeader.split(" ")) {
    const [, sig] = entry.split(",");
    if (sig && sig === expected) return true;
  }
  return false;
}

export interface InboundReply {
  email: string;      // the human who replied - the address we may suppress
  emailId: string | null;
  subject: string;
  headers: Record<string, string>;
}

// A `from` can be "Name <addr@x.com>" or a bare address. We suppress on the
// address only. Returns null when there is nothing usable, which the caller
// treats as ignore - we never guess at an address we might suppress.
export function parseAddress(from: unknown): string | null {
  if (typeof from !== "string" || !from.trim()) return null;
  const angled = from.match(/<([^>]+)>/);
  const raw = (angled ? angled[1] : from).trim().toLowerCase();
  // Minimal shape check; the address came from our own mail provider, so this
  // guards against malformed input rather than adversarial input.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : null;
}

// Pull the sender/subject/headers out of a Resend `email.received` event.
export function inboundFromEvent(event: unknown): InboundReply | null {
  if (typeof event !== "object" || event === null) return null;
  const e = event as Record<string, any>;
  if (e.type !== "email.received") return null;

  const email = parseAddress(e.data?.from);
  if (!email) return null;

  const headers: Record<string, string> = {};
  // Resend may present headers as a list of {name,value} or as an object.
  const rawHeaders = e.data?.headers;
  if (Array.isArray(rawHeaders)) {
    for (const h of rawHeaders) {
      if (h?.name) headers[String(h.name)] = String(h?.value ?? "");
    }
  } else if (rawHeaders && typeof rawHeaders === "object") {
    for (const [k, v] of Object.entries(rawHeaders)) headers[k] = String(v);
  }

  return {
    email,
    emailId: typeof e.data?.email_id === "string" ? e.data.email_id : null,
    subject: typeof e.data?.subject === "string" ? e.data.subject : "",
    headers,
  };
}

// Resend's inbound webhook carries METADATA ONLY - no body, by design. The text
// has to be fetched from the Receiving API with the email_id. A bare-subject
// opt-out ("Unsubscribe" with an empty body) is still classifiable without this,
// so a fetch failure degrades to subject-only classification rather than
// dropping the event.
export async function fetchBody(emailId: string, apiKey: string): Promise<string> {
  if (!emailId || !apiKey) return "";
  try {
    const res = await fetch(`${RESEND_API}/emails/receiving/${emailId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      console.error("reply-unsubscribe: body fetch failed:", res.status);
      return "";
    }
    const data = await res.json();
    return String(data?.text ?? data?.html ?? "");
  } catch (err) {
    console.error("reply-unsubscribe: body fetch threw:", err);
    return "";
  }
}

// Only a real human conversation forwards: `ignore` with no rule matched.
// Auto-replies (matched: "auto-reply") stay silent, and opt-outs / ambiguous
// replies already have their own automated paths above this one.
export function shouldForward(intent: string, matched: string | null): boolean {
  return intent === "ignore" && matched === null;
}

// The payload for the operator forward. The verdict travels with the reply so a
// misclassification is visible instead of invisible, and reply_to is the human
// who wrote in, so answering from Gmail reaches them directly.
export function buildForward(inbound: InboundReply, body: string): Record<string, unknown> {
  const text = [
    "A reply to a nurture email reached reply.orionfold.com and did not",
    "classify as an opt-out. Classifier verdict: ignore, no rule matched.",
    "This reads as a real conversation for a human.",
    "",
    `From: ${inbound.email}`,
    `Subject: ${inbound.subject || "(no subject)"}`,
    `Resend email id: ${inbound.emailId ?? "(none)"}`,
    "",
    "--- reply text ---",
    body || "(body could not be fetched; look the email id up in the Resend dashboard)",
  ].join("\n");

  return {
    from: FORWARD_FROM,
    to: FORWARD_TO,
    reply_to: inbound.email,
    subject: `Flow reply from ${inbound.email}: ${inbound.subject || "(no subject)"}`,
    text,
  };
}

export async function sendForward(payload: Record<string, unknown>, apiKey: string): Promise<boolean> {
  if (!apiKey) {
    console.error("reply-unsubscribe: forward skipped, no RESEND_API_KEY");
    return false;
  }
  try {
    const res = await fetch(`${RESEND_API}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.error("reply-unsubscribe: forward send failed:", res.status);
    return res.ok;
  } catch (err) {
    console.error("reply-unsubscribe: forward send threw:", err);
    return false;
  }
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

if (import.meta.main) {
  Deno.serve(async (req) => {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const creds = Deno.env.get("RESEND_INBOUND_SECRET") ?? "";
    const rawBody = await req.text();
    if (!(await verifySvix(creds, req.headers, rawBody))) {
      return json({ error: "Invalid signature" }, 401);
    }

    let event: unknown;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const inbound = inboundFromEvent(event);
    if (!inbound) return json({ ok: true, ignored: true });

    const body = inbound.emailId
      ? await fetchBody(inbound.emailId, Deno.env.get("RESEND_API_KEY") ?? "")
      : "";

    const { intent, matched } = classifyReply(inbound.subject, body, inbound.headers);
    if (intent === "ignore") {
      if (!shouldForward(intent, matched)) return json({ ok: true, ignored: true });
      // Non-2xx makes Resend retry. A duplicate forward is a minor nuisance; a
      // silently dropped question from a live human is the gap this closes.
      const sent = await sendForward(
        buildForward(inbound, body),
        Deno.env.get("RESEND_API_KEY") ?? "",
      );
      if (!sent) return json({ error: "forward failed" }, 500);
      return json({ ok: true, forwarded: true });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (intent === "review") {
      const { error } = await supabase.from("reply_reviews").insert({
        email: inbound.email,
        email_id: inbound.emailId,
        subject: inbound.subject,
        matched_rule: matched,
      });
      if (error) {
        console.error("reply-unsubscribe: review insert failed:", error);
        return json({ error: "write failed" }, 500);
      }
      return json({ ok: true, queued: "review" });
    }

    // token is NULL and that is truthful: no link was clicked, so no token was
    // presented. The column is nullable for exactly this case, and marketing's
    // drain matches BY EMAIL, so a null token does not break it.
    const { error } = await supabase.from("suppressions").insert({
      email: inbound.email,
      token: null,
      reason: "reply_unsubscribe",
    });
    if (error) {
      // Non-2xx makes Resend retry, which is what we want: a dropped opt-out is
      // the failure this whole fn exists to prevent.
      console.error("reply-unsubscribe: suppression insert failed:", error);
      return json({ error: "write failed" }, 500);
    }
    return json({ ok: true, suppressed: true });
  });
}
