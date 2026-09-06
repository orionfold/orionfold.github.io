// Pure environment resolver, shared by the build and client config tests.
// Origins are deployment configuration, never taken from a form or URL query.
export const PRODUCTION_FUNCTIONS_BASE = "https://orionfold.supabase.co/functions/v1";
export const PRODUCTION_WORKSHOP_MEDIA_BASE = "https://orionfold.supabase.co/storage/v1/object/public/workshop-public";
const productionHosts = new Set(["orionfold.com", "www.orionfold.com", "orionfold.supabase.co", "lgnmmcxvwdnusvfpguvf.supabase.co"]);

function safeUrl(value, name) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`${name} must be an absolute URL.`); }
  if (url.username || url.password || url.search || url.hash || !["http:", "https:"].includes(url.protocol)) {
    throw new Error(`${name} must be an HTTP(S) URL without credentials, query or fragment.`);
  }
  if (url.protocol === "http:" && !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
    throw new Error(`${name} requires HTTPS outside loopback.`);
  }
  return url;
}

export function resolveServiceEnvironment(env = {}) {
  const mode = env.PUBLIC_SERVICE_MODE || "production";
  if (!["preview", "staging", "production"].includes(mode)) throw new Error("Invalid PUBLIC_SERVICE_MODE.");
  if (mode === "preview") {
    return Object.freeze({ mode, actionsEnabled: false, functionsBase: "/__service-unavailable/functions/v1", mediaBase: PRODUCTION_WORKSHOP_MEDIA_BASE });
  }
  const functionsValue = env.PUBLIC_SUPABASE_FUNCTIONS_BASE;
  const mediaValue = env.PUBLIC_WORKSHOP_MEDIA_BASE;
  if (mode === "staging" && (!functionsValue || !mediaValue)) {
    throw new Error("Staging requires explicit PUBLIC_SUPABASE_FUNCTIONS_BASE and PUBLIC_WORKSHOP_MEDIA_BASE.");
  }
  const functions = safeUrl(functionsValue || PRODUCTION_FUNCTIONS_BASE, "PUBLIC_SUPABASE_FUNCTIONS_BASE");
  const media = safeUrl(mediaValue || PRODUCTION_WORKSHOP_MEDIA_BASE, "PUBLIC_WORKSHOP_MEDIA_BASE");
  if (functions.pathname.replace(/\/$/, "") !== "/functions/v1") throw new Error("Functions base must end at /functions/v1.");
  if (!media.pathname.startsWith("/storage/v1/object/public/")) throw new Error("Workshop media must use a public storage path.");
  if (mode === "staging") {
    if ([functions, media].some(url => productionHosts.has(url.hostname))) throw new Error("Staging cannot target production services.");
    if (functions.origin !== media.origin) throw new Error("Staging functions and media must belong to the same isolated origin.");
  }
  return Object.freeze({ mode, actionsEnabled: true, functionsBase: functions.href.replace(/\/$/, ""), mediaBase: media.href.replace(/\/$/, "") });
}
