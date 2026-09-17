import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import { serviceEnvironment } from "../_shared/service-environment.ts";
import { createConfirmHandler } from "./handler.ts";
let client: SupabaseClient | undefined;
function db() {
  return client ??= createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
const handler = createConfirmHandler({
  enabled: () => Deno.env.get("LIVING_DOCUMENTS_SIGNUP_ENABLED") === "true",
  site: () => serviceEnvironment().site,
  functionsBase: () => serviceEnvironment().functionsBase,
  hash: async (token) =>
    Array.from(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)),
      ),
      (b) => b.toString(16).padStart(2, "0"),
    ).join(""),
  confirm: async (tokenHash) => {
    const { data, error } = await db().rpc(
      "confirm_flow_living_documents_subscription",
      { p_token_hash: tokenHash },
    );
    if (error) throw new Error("confirmation_unavailable");
    return data === true;
  },
});
if (import.meta.main) Deno.serve(handler);
