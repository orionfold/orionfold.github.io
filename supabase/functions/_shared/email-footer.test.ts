// Unit lock: footerFor carries the tokenized link + postal address; footerForEmail
// falls back to EMAIL_FOOTER when minting fails (a send must never be blocked).
// Run: deno test supabase/functions/_shared/email-footer.test.ts
import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { EMAIL_FOOTER, footerFor, footerForEmail, UNSUB_BASE } from "./email-footer.ts";

Deno.test("footerFor carries the tokenized link and postal address", () => {
  const f = footerFor("tok-123");
  assert(f.includes(`${UNSUB_BASE}?t=tok-123`));
  assert(f.includes("2108 N St Ste N"));
});

Deno.test("footerForEmail mints then renders the link", async () => {
  const c = {
    from() {
      return { select() { return { eq() { return { maybeSingle() { return Promise.resolve({ data: { token: "abc" }, error: null }); } }; } }; } };
    },
  };
  const f = await footerForEmail(c, "reader@example.com");
  assert(f.includes(`${UNSUB_BASE}?t=abc`));
});

Deno.test("footerForEmail falls back when minting throws", async () => {
  const c = { from() { throw new Error("db down"); } };
  const f = await footerForEmail(c, "reader@example.com");
  assert(f === EMAIL_FOOTER);
});
