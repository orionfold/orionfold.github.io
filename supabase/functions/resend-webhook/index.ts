// Resend webhook -> suppression (relay #9). The deliverability half of the compliance
// surface: on a HARD bounce or a spam complaint, write a suppressions row so the
// mailable list can't rot once beehiiv's daily pull-back is gone. Svix-verified;
// verify_jwt = false (config.toml).
//   email.bounced (hard only) -> suppressions reason bounce
//   email.complained          -> suppressions reason complaint
//   anything else             -> 200 ignored (Resend retries on non-2xx)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SIGNING_PREFIX = "wh" + "sec_";

// Verify the Svix signature Resend sends. Signed content is `${id}.${timestamp}.${rawBody}`,
// HMAC-SHA256 with the base64 credential (after the prefix), base64-encoded. The
// svix-signature header is space-separated `v1,<sig>` entries; any match passes.
export async function verifySvix(creds: string, headers: Headers, rawBody: string): Promise<boolean> {
  const id = headers.get("svix-id");
  const ts = headers.get("svix-timestamp");
  const sigHeader = headers.get("svix-signature");
  if (!id || !ts || !sigHeader || !creds) return false;

  const b64 = creds.startsWith(SIGNING_PREFIX) ? creds.slice(SIGNING_PREFIX.length) : creds;
  const keyBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const signer = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", signer, new TextEncoder().encode(`${id}.${ts}.${rawBody}`));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));

  for (const entry of sigHeader.split(" ")) {
    const [, sig] = entry.split(",");
    if (sig && sig === expected) return true;
  }
  return false;
}

type Suppression = { email: string; reason: "bounce" | "complaint" };

// Map a Resend event to a suppression, or null if it should be ignored. Only hard
// bounces suppress (soft bounces are recoverable); complaints always suppress.
export function suppressionFromEvent(event: unknown): Suppression | null {
  if (typeof event !== "object" || event === null) return null;
  const e = event as Record<string, any>;
  const to: string | undefined = Array.isArray(e.data?.to) ? e.data.to[0] : e.data?.to;
  if (!to || typeof to !== "string") return null;

  if (e.type === "email.complained") return { email: to, reason: "complaint" };
  if (e.type === "email.bounced") {
    const bounceType = String(e.data?.bounce?.type ?? "").toLowerCase();
    if (bounceType === "hard" || bounceType === "permanent") return { email: to, reason: "bounce" };
    return null;
  }
  return null;
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

if (import.meta.main) {
  Deno.serve(async (req) => {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const creds = Deno.env.get("RESEND_WEBHOOK_SECRET") ?? "";
    const rawBody = await req.text();
    if (!(await verifySvix(creds, req.headers, rawBody))) {
      return json({ error: "Invalid signature" }, 401);
    }

    let event: unknown;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const supp = suppressionFromEvent(event);
    if (!supp) return json({ ok: true, ignored: true });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error } = await supabase.from("suppressions").insert({ email: supp.email, reason: supp.reason });
    if (error) {
      console.error("resend-webhook: suppression insert failed:", error);
      return json({ error: "write failed" }, 500);
    }
    return json({ ok: true });
  });
}
