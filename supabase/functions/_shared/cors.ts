// Shared CORS + JSON helpers for the commerce edge functions (C2/C3/C4).
// Mirrors the proven idiom in `waitlist-signup` (kept separate so the live
// funnel is never touched). Production defaults to orionfold.com only. An
// isolated staging deployment may set CORS_ALLOWED_ORIGINS to an explicit,
// comma-separated local/staging list; no wildcard is accepted.

const DEFAULT_ALLOWED_ORIGINS = ["https://orionfold.com"];

export function parseAllowedOrigins(value?: string | null): string[] {
  const configured = (value ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return configured.length ? [...new Set(configured)] : DEFAULT_ALLOWED_ORIGINS;
}

function allowedOrigins(): string[] {
  return parseAllowedOrigins(Deno.env.get("CORS_ALLOWED_ORIGINS"));
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const origins = allowedOrigins();
  const allowedOrigin = origins.includes(origin)
    ? origin
    : origins[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

export function jsonResponse(
  body: Record<string, unknown>,
  corsHeaders: Record<string, string>,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
