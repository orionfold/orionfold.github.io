// Unit lock for the unsubscribe fn's pure helpers. The DB round-trip + Deno.serve
// glue is exercised live on deploy.
// Run: deno test supabase/functions/unsubscribe/index.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { confirmationPage, parseToken } from "./index.ts";

Deno.test("parseToken pulls the t param", () => {
  assertEquals(parseToken("https://orionfold.com/unsubscribe?t=abc123"), "abc123");
  assertEquals(parseToken("https://orionfold.com/unsubscribe"), null);
  assertEquals(parseToken("https://orionfold.com/unsubscribe?t="), null);
});

Deno.test("confirmationPage is human and leaks no PII", () => {
  const html = confirmationPage();
  assert(html.includes("<html"));
  assert(html.toLowerCase().includes("unsubscrib"));
  assert(!html.includes("@"));
});
