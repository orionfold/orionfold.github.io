// Read-only cursor-poll export of the suppression table for marketing's drain (relay
// #9). Mirrors waitlist-export exactly: server-to-server, constant-time auth,
// oldest-first, cursor on suppressed_at. Never writes. Marketing matches contacts BY
// EMAIL; the token is echoed for row-shape parity. verify_jwt = false (config.toml).
//   GET ?since=<ISO>&limit=<n<=1000>  Authorization: Bearer <the export bearer>
//   -> { rows: [{ email, token, reason, suppressed_at }], next_cursor: string|null }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AUTH_PREFIX = "Bearer ";

export interface ExportRow {
  email: string;
  token: string | null;
  reason: string;
  suppressed_at: string;
}

const FIELDS = "email, token, reason, suppressed_at";

export function mapRow(r: Record<string, unknown>): ExportRow {
  return {
    email: r.email as string,
    token: (r.token ?? null) as string | null,
    reason: r.reason as string,
    suppressed_at: r.suppressed_at as string,
  };
}

// Constant-time shared-credential compare (identical posture to waitlist-export).
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
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

if (import.meta.main) {
  Deno.serve(async (req) => {
    if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

    const expected = Deno.env.get("SUPPRESSIONS_EXPORT_TOKEN") ?? "";
    if (!authorized(req.headers, expected)) return json({ error: "Unauthorized" }, 401);

    const url = new URL(req.url);
    const since = url.searchParams.get("since");
    const limit = clampLimit(url.searchParams.get("limit"));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let q = supabase
      .from("suppressions")
      .select(FIELDS)
      .order("suppressed_at", { ascending: true })
      .limit(limit);
    if (since) q = q.gt("suppressed_at", since);

    const { data, error } = await q;
    if (error) return json({ error: error.message }, 500);

    const rows = (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
    const next_cursor = rows.length ? rows[rows.length - 1].suppressed_at : null;
    return json({ rows, next_cursor });
  });
}
