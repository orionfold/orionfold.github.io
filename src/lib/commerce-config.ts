const PRODUCTION_FUNCTIONS_BASE = "https://orionfold.supabase.co/functions/v1";

export const COMMERCE_FUNCTIONS_BASE = (
  import.meta.env.PUBLIC_SUPABASE_FUNCTIONS_BASE || PRODUCTION_FUNCTIONS_BASE
).replace(/\/$/, "");

export const WORKSHOP_MEDIA_BASE = (
  import.meta.env.PUBLIC_WORKSHOP_MEDIA_BASE || ""
).replace(/\/$/, "");
