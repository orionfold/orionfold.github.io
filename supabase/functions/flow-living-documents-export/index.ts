import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import {
  CONSENT_TEXT,
  OFFER,
  SOURCE,
} from "../flow-living-documents-signup/contract.ts";
import { type Cursor, cursorFilter, RECEIPT_FIELDS } from "./contract.ts";
import { createExportHandler } from "./handler.ts";
import { readLivingDocumentSuppressions } from "../flow-living-documents-signup/suppression.ts";
let client: SupabaseClient | undefined;
function db() {
  return client ??= createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
async function readReceipts(
  cursor: Cursor | null,
  limit: number,
): Promise<unknown[]> {
  let query = db().from("flow_living_documents_subscriptions").select(
    RECEIPT_FIELDS,
  )
    .eq("offer", OFFER).eq("consent_text", CONSENT_TEXT).eq("source", SOURCE)
    .not("confirmed_at", "is", null)
    .order("updated_at", { ascending: true }).order("id", { ascending: true })
    .limit(limit);
  if (cursor) query = query.or(cursorFilter(cursor));
  const { data, error } = await query;
  if (error || !Array.isArray(data)) throw new Error("receipt_read_failed");
  return data;
}
async function readSuppressions(emails: string[]): Promise<Set<string>> {
  return await readLivingDocumentSuppressions(
    emails,
    async (requested) =>
      await db().rpc("flow_living_documents_suppressions", {
        p_emails: requested,
      }),
  );
}

export const handler = createExportHandler({
  expectedCredential: () => Deno.env.get("WAITLIST_EXPORT_TOKEN") || "",
  readReceipts,
  readSuppressions,
});
if (import.meta.main) Deno.serve(handler);
