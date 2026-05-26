// Shared CORS + JSON helpers for the commerce edge functions (C2/C3/C4).
// Mirrors the proven idiom in `waitlist-signup` (kept separate so the live
// funnel is never touched). The allowlist is the production origin only —
// checkout is started from orionfold.com; localhost will CORS-fail by design
// (test the deployed function server-to-server, as with the waitlist funnel).

const ALLOWED_ORIGINS = [
  "https://orionfold.com",
];

export function getCorsHeaders(req: Request): Record<string, string> {
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
