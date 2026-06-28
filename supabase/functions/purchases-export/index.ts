// Offer-ladder Leg 1: read-only cursor-poll export of completed purchases for
// the marketing CRM poller (the buyer twin of A16's waitlist-export opt-in leg).
// Server-to-server, shared-credential auth, NOT browser CORS. Returns rows since
// a created_at cursor. NEVER writes. PII (email) leaves only to the authenticated
// poller.
//
// Why this shape (relay latest+12/+13): the deployed stripe-webhook records every
// purchase into the Supabase `purchases` table, but the marketing `leads/` tree is
// a local-only file tree on the marketing box that a cloud edge fn can never touch.
// So the webhook EXPOSES the signal here and marketing's box-local poller DRAINS it
// into leads/ — applying the consent rules on its side. Marketing has no raw DB key,
// only this scoped export token (identical posture to waitlist-export).
//
// leads/ field mapping (the poller builds its ingestion leg to this):
//   email             -> contact id (email-slug) | join key to an existing contact
//   lookup_key        -> ## Pipeline SKU (e.g. book_bundle_founding)
//   amount_total      -> ## Pipeline amount (cents, as charged) + currency
//   currency          -> ## Pipeline currency
//   stripe_session_id -> the poller's dedupe key (UNIQUE per purchase)
//   created_at        -> relative-time in the ## Pipeline entry (house rule) + cursor
//   delivered/_at     -> fulfilment-completed signal (informational)
//   fixed on drain: stage: customer, consent.basis: stripe-purchase
//     - existing mailable:true contact -> promote stage ONLY, never downgrade mailable
//     - no-prior-contact buyer -> CREATE at stage: customer, mailable: false
//       (a purchase is NOT a newsletter opt-in)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AUTH_PREFIX = "Bearer ";

export interface ExportRow {
  email: string;
  lookup_key: string;
  amount_total: number | null;
  currency: string | null;
  stripe_session_id: string;
  created_at: string;
  delivered: boolean;
  delivered_at: string | null;
}

const FIELDS =
  "email, lookup_key, amount_total, currency, stripe_session_id, created_at, delivered, delivered_at";

export function mapRow(r: Record<string, unknown>): ExportRow {
  return {
    email: r.email as string,
    lookup_key: r.lookup_key as string,
    amount_total: (r.amount_total ?? null) as number | null,
    currency: (r.currency ?? null) as string | null,
    stripe_session_id: r.stripe_session_id as string,
    created_at: r.created_at as string,
    delivered: Boolean(r.delivered),
    delivered_at: (r.delivered_at ?? null) as string | null,
  };
}

// Constant-time shared-credential compare. Both sides encoded to bytes; a
// length mismatch fails fast, otherwise every byte is XOR-accumulated (no
// early exit). `expected` is read from env by the caller, never inlined.
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

export function clampLimit(raw: string | null): number {
  const n = raw === null ? NaN : Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return 500;
  return Math.min(n, 1000);
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

if (import.meta.main) {
  Deno.serve(async (req) => {
    if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

    const expected = Deno.env.get("PURCHASES_EXPORT_TOKEN") ?? "";
    if (!authorized(req.headers, expected)) return json({ error: "Unauthorized" }, 401);

    const url = new URL(req.url);
    const since = url.searchParams.get("since");
    const limit = clampLimit(url.searchParams.get("limit"));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let q = supabase
      .from("purchases")
      .select(FIELDS)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (since) q = q.gt("created_at", since);

    const { data, error } = await q;
    if (error) return json({ error: error.message }, 500);

    const rows = (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
    const next_cursor = rows.length ? rows[rows.length - 1].created_at : null;
    return json({ rows, next_cursor });
  });
}
