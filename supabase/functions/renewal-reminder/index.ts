// renewal-reminder: T-30 Relay license renewal value-recap email (PLG-4a Website half,
// _RELAY later-9/later-10). Daily cron POSTs here; we select active Relay licenses ~30
// days from expiry that have not been reminded, send the recap email, and stamp
// renewal_reminded_at so each license year is reminded exactly once.
//
// Relay never sends your data to Orionfold (the canonical promise, _RELAY later-12), so
// we CANNOT see customer installs. The email recaps what the license year
// SHIPPED (public release history), never what the customer did or didn't install. That
// honesty constraint is load-bearing (_RELAY later-9). verify_jwt = false; the
// constant-time RENEWAL_REMINDER_TOKEN check is the sole gate, like the exports.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { footerForEmail } from "../_shared/email-footer.ts";

const AUTH_PREFIX = "Bearer ";
const FROM = "Orionfold <manav@updates.orionfold.com>";
const REPLY_TO = "manav@orionfold.com";
const SUBJECT = "Your Orionfold Relay license renews in 30 days";

// The 28-31 day band (a band, not a single day, so a missed cron run never skips a cohort).
const WINDOW_MIN_DAYS = 28;
const WINDOW_MAX_DAYS = 31;
const DAY_MS = 86400000;

export interface EntRow {
  license_id: string;
  email: string;
  tier: string;
  status: string;
  expires_at: string;
  renewal_reminded_at: string | null;
}

// Constant-time shared-credential compare (same posture as resend-send/purchases-export).
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

// Pure selection so the window logic is unit-tested without a DB. The SQL query below
// pre-filters status/tier/reminded for efficiency; this re-applies the full predicate as
// the authoritative gate (defense in depth against a loosened query).
export function selectDue(rows: EntRow[], now: Date): EntRow[] {
  const lo = now.getTime() + WINDOW_MIN_DAYS * DAY_MS;
  const hi = now.getTime() + WINDOW_MAX_DAYS * DAY_MS;
  return rows.filter((r) => {
    if (r.status !== "active") return false;
    if (r.tier !== "relay") return false;
    if (r.renewal_reminded_at) return false;
    const exp = new Date(r.expires_at).getTime();
    return exp >= lo && exp <= hi;
  });
}

// The year's evidence line mirrors the Relay repo's single recap source
// (src/lib/packs/templates/relay-agency-pro/pack.yaml -> changelog:). Refresh this one
// constant whenever Relay flags a new changelog line on _RELAY (standing obligation).
const YEAR_EVIDENCE =
  "Your license year included Agency Pro v0.2.0, the Nonprofit deep chapter: a grant " +
  "pipeline that takes every opportunity from a scored go or no-go, through the letter " +
  "of intent and the full application, to post-award compliance with a reporting calendar.";

export function renewalEmailText(footer: string): string {
  return `Your Orionfold Relay license renews in about 30 days.

First, the promise, so there is no worry:

Your packs are yours forever. Renewal gets you the year's new and updated packs and priority support.

Everything you installed stays yours and keeps running. Renewal buys the next year of new and updated packs.

Here is what your license year shipped:

${YEAR_EVIDENCE}

If you have not pulled that update yet, one command gets it:

relay pack update relay-agency-pro

To renew for another year, go to:

https://orionfold.com/relay/

If you have any questions, just reply to this email.

${footer}`;
}

// Guardrail: the copy must never imply packs stop working. Tested against the live copy.
const THREAT_PHRASES = ["stop working", "will be locked", "lose access", "expire and stop", "cease to function"];
export function containsThreat(text: string): boolean {
  const t = text.toLowerCase();
  return THREAT_PHRASES.some((p) => t.includes(p));
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function supabaseAdmin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
}

async function sendRenewalEmail(to: string): Promise<void> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
  const footer = await footerForEmail(supabaseAdmin(), to);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, reply_to: REPLY_TO, to: [to], subject: SUBJECT, text: renewalEmailText(footer) }),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error("Resend error:", res.status, detail);
    throw new Error(`Resend API error: ${res.status}`);
  }
}

if (import.meta.main) {
  Deno.serve(async (req) => {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const expected = Deno.env.get("RENEWAL_REMINDER_TOKEN") ?? "";
    if (!authorized(req.headers, expected)) return json({ error: "Unauthorized" }, 401);

    const now = new Date();
    const lo = new Date(now.getTime() + WINDOW_MIN_DAYS * DAY_MS).toISOString();
    const hi = new Date(now.getTime() + WINDOW_MAX_DAYS * DAY_MS).toISOString();

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("fe_entitlements")
      .select("license_id,email,tier,status,expires_at,renewal_reminded_at")
      .eq("status", "active")
      .eq("tier", "relay")
      .is("renewal_reminded_at", null)
      .gte("expires_at", lo)
      .lte("expires_at", hi);

    if (error) {
      console.error("fe_entitlements query error:", error.message);
      return json({ error: "query failed" }, 500);
    }

    const due = selectDue((data ?? []) as EntRow[], now);
    let sent = 0;
    let errors = 0;
    for (const r of due) {
      try {
        await sendRenewalEmail(r.email);
        const { error: stampError } = await supabase
          .from("fe_entitlements")
          .update({ renewal_reminded_at: new Date().toISOString() })
          .eq("license_id", r.license_id);
        if (stampError) { console.error("stamp error:", r.license_id, stampError.message); errors++; continue; }
        sent++;
      } catch (e) {
        console.error("send error:", r.license_id, (e as Error).message);
        errors++;
      }
    }

    return json({ scanned: due.length, sent, errors });
  });
}
