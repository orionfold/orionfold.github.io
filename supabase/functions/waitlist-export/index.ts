// A16: read-only cursor-poll export of website opt-in captures for the
// marketing CRM poller (mirrors the beehiiv read leg). Server-to-server,
// shared-credential auth, NOT browser CORS. Returns rows since a created_at
// cursor. Never writes. PII (email) leaves only to the authenticated poller.
//
// leads/ field mapping (poller builds its ingestion leg to this):
//   email -> contact id | offer -> source.campaign (+ stage)
//   consent_text -> consent.scope | captured_at -> consent.captured_at
//   utm_* -> source.campaign round-trip | double_optin -> consent.double_optin
//   fixed: source.origin: website, consent.basis: website-optin
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AUTH_PREFIX = "Bearer ";

export interface ExportRow {
  email: string;
  offer: string | null;
  consent_text: string | null;
  captured_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  double_optin: "pending" | "confirmed";
}

const FIELDS =
  "email, offer, consent_text, created_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term, confirmed";

export function mapRow(r: Record<string, unknown>): ExportRow {
  return {
    email: r.email as string,
    offer: (r.offer ?? null) as string | null,
    consent_text: (r.consent_text ?? null) as string | null,
    captured_at: r.created_at as string,
    utm_source: (r.utm_source ?? null) as string | null,
    utm_medium: (r.utm_medium ?? null) as string | null,
    utm_campaign: (r.utm_campaign ?? null) as string | null,
    utm_content: (r.utm_content ?? null) as string | null,
    utm_term: (r.utm_term ?? null) as string | null,
    double_optin: r.confirmed ? "confirmed" : "pending",
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

    const expected = Deno.env.get("WAITLIST_EXPORT_TOKEN") ?? "";
    if (!authorized(req.headers, expected)) return json({ error: "Unauthorized" }, 401);

    const url = new URL(req.url);
    const since = url.searchParams.get("since");
    const limit = clampLimit(url.searchParams.get("limit"));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let q = supabase
      .from("waitlist")
      .select(FIELDS)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (since) q = q.gt("created_at", since);

    const { data, error } = await q;
    if (error) return json({ error: error.message }, 500);

    const rows = (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
    const next_cursor = rows.length ? rows[rows.length - 1].captured_at : null;
    return json({ rows, next_cursor });
  });
}
