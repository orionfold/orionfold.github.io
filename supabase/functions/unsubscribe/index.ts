// One-click unsubscribe (relay #9). Tokenized, no PII in the URL: the opaque tok
// from email_tokens resolves to an email, and we write a suppressions row with
// reason unsubscribe. verify_jwt = false (config.toml).
//   GET  /unsubscribe?t=<tok>  -> resolve, suppress, return an HTML page
//   POST /unsubscribe?t=<tok>  -> RFC 8058 one-click, suppress, 200 empty
// Fail-safe + no-leak: an unknown/missing tok still returns a friendly 200; we
// never reveal whether a tok exists, and never 500 to an email client.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function parseToken(rawUrl: string): string | null {
  try {
    const t = new URL(rawUrl).searchParams.get("t");
    return t && t.length > 0 ? t : null;
  } catch {
    return null;
  }
}

export function confirmationPage(): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Unsubscribed</title></head>
<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;line-height:1.5">
<h1>You're unsubscribed</h1>
<p>You will not get any more marketing emails from Orionfold. This takes effect right away.</p>
<p>If you still have a purchase in flight, you will still get the receipts and download links for it.</p>
<p><a href="https://orionfold.com">Back to orionfold.com</a></p>
</body>
</html>`;
}

async function suppress(tok: string): Promise<void> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: row } = await supabase
    .from("email_tokens")
    .select("email")
    .eq("token", tok)
    .maybeSingle();
  if (!row?.email) return;
  const { error } = await supabase
    .from("suppressions")
    .insert({ email: row.email, token: tok, reason: "unsubscribe" });
  if (error) console.error("unsubscribe: suppression insert failed:", error);
}

if (import.meta.main) {
  Deno.serve(async (req) => {
    const tok = parseToken(req.url);
    if (req.method === "POST") {
      if (tok) await suppress(tok);
      return new Response(null, { status: 200 });
    }
    if (req.method === "GET") {
      if (tok) await suppress(tok);
      return new Response(confirmationPage(), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return new Response("Method not allowed", { status: 405 });
  });
}
