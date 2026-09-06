import { resolveServiceEnvironment } from "./service-environment.mjs";

// Existing production URLs stay unchanged. The migration review explicitly builds
// with PUBLIC_SERVICE_MODE=preview; staging has no production fallback.
const services = resolveServiceEnvironment({
  PUBLIC_SERVICE_MODE: import.meta.env.PUBLIC_SERVICE_MODE,
  PUBLIC_SUPABASE_FUNCTIONS_BASE: import.meta.env.PUBLIC_SUPABASE_FUNCTIONS_BASE,
  PUBLIC_WORKSHOP_MEDIA_BASE: import.meta.env.PUBLIC_WORKSHOP_MEDIA_BASE,
});
export const SERVICE_MODE = services.mode;
export const SERVICE_ACTIONS_ENABLED = services.actionsEnabled;
const COMMERCE_FUNCTIONS_BASE = services.functionsBase;
// Production media stays https://orionfold.supabase.co/storage/v1/object/public/workshop-public.
export const WORKSHOP_MEDIA_BASE = services.mediaBase;
export const SERVICE_UNAVAILABLE_MESSAGE = "This action is unavailable on this site.";
export const LIVING_DOCUMENTS_SIGNUP_ENABLED = SERVICE_ACTIONS_ENABLED &&
  import.meta.env.PUBLIC_LIVING_DOCUMENTS_SIGNUP_ENABLED === "true";

export const FLOW_ENTERPRISE_CONTACT_ENABLED = SERVICE_ACTIONS_ENABLED &&
  import.meta.env.PUBLIC_FLOW_ENTERPRISE_CONTACT_ENABLED === "true";

export function serviceEndpoint(name: string): string {
  if (!/^[a-z][a-z0-9-]+$/.test(name)) throw new Error("Invalid service action.");
  return `${COMMERCE_FUNCTIONS_BASE}/${name}`;
}
