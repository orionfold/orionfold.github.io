// Deployment-only URLs. Never accept a caller-provided confirmation/return URL.
export type ServiceEnvironment = { mode: "production" | "staging"; site: string; functionsBase: string; allowedOrigins: string[] };
const PRODUCTION_SITE = "https://orionfold.com";
const PRODUCTION_FUNCTIONS = "https://orionfold.supabase.co/functions/v1";
const productionHosts = new Set(["orionfold.com", "www.orionfold.com", "orionfold.supabase.co", "lgnmmcxvwdnusvfpguvf.supabase.co"]);
function origin(value: string, name: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error(`${name} must be an absolute origin.`); }
  if (url.username || url.password || url.search || url.hash || !["/", ""].includes(url.pathname) || !["http:", "https:"].includes(url.protocol)) throw new Error(`${name} must be an HTTP(S) origin.`);
  if (url.protocol === "http:" && !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) throw new Error(`${name} requires HTTPS outside loopback.`);
  return url;
}
export function resolveServiceEnvironment(env: Record<string, string | undefined>): ServiceEnvironment {
  const mode = env.SERVICE_MODE || "production";
  if (mode !== "production" && mode !== "staging") throw new Error("Invalid SERVICE_MODE.");
  if (mode === "staging" && (!env.SITE_URL || !env.SUPABASE_URL || !env.CORS_ALLOWED_ORIGINS)) throw new Error("Staging requires SITE_URL, SUPABASE_URL and CORS_ALLOWED_ORIGINS.");
  const site = origin(env.SITE_URL || PRODUCTION_SITE, "SITE_URL");
  const allowedOrigins = [...new Set((env.CORS_ALLOWED_ORIGINS || site.origin).split(",").map(value => origin(value.trim(), "CORS_ALLOWED_ORIGINS").origin))];
  const supabase = env.SUPABASE_URL ? origin(env.SUPABASE_URL, "SUPABASE_URL") : undefined;
  if (mode === "staging") {
    if ([site, supabase!, ...allowedOrigins.map(value => new URL(value))].some(url => productionHosts.has(url.hostname))) throw new Error("Staging cannot target production origins.");
    if (!allowedOrigins.includes(site.origin)) throw new Error("Staging CORS must include SITE_URL.");
    for (const name of ["STRIPE_SECRET_KEY", "STRIPE_FLOW_SECRET_KEY"]) {
      if (env[name] && !/^(sk|rk)_test_/.test(env[name]!)) throw new Error(`Staging requires test credentials for ${name}.`);
    }
  }
  return { mode, site: site.origin, allowedOrigins, functionsBase: mode === "staging" ? `${supabase!.origin}/functions/v1` : PRODUCTION_FUNCTIONS };
}
export function serviceEnvironment(): ServiceEnvironment {
  return resolveServiceEnvironment(Object.fromEntries(["SERVICE_MODE", "SITE_URL", "SUPABASE_URL", "CORS_ALLOWED_ORIGINS", "STRIPE_SECRET_KEY", "STRIPE_FLOW_SECRET_KEY"].map(name => [name, Deno.env.get(name)])));
}
