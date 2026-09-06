import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { resolveServiceEnvironment } from "./service-environment.ts";
const stage = { SERVICE_MODE: "staging", SITE_URL: "http://127.0.0.1:4322", SUPABASE_URL: "http://127.0.0.1:54321", CORS_ALLOWED_ORIGINS: "http://127.0.0.1:4322" };
Deno.test("service production defaults preserve old confirmation URLs", () => {
  assertEquals(resolveServiceEnvironment({}).site, "https://orionfold.com");
  assertEquals(resolveServiceEnvironment({}).functionsBase, "https://orionfold.supabase.co/functions/v1");
});
Deno.test("staging confirmation and return URLs remain isolated", () => {
  const config = resolveServiceEnvironment(stage);
  assertEquals(config.site, stage.SITE_URL);
  assertEquals(config.functionsBase, `${stage.SUPABASE_URL}/functions/v1`);
});
Deno.test("staging rejects missing, mixed production and live payment credentials", () => {
  for (const name of ["SITE_URL", "SUPABASE_URL", "CORS_ALLOWED_ORIGINS"]) assertThrows(() => resolveServiceEnvironment({ ...stage, [name]: undefined }));
  for (const [name, value] of [["SITE_URL", "https://orionfold.com"], ["SUPABASE_URL", "https://lgnmmcxvwdnusvfpguvf.supabase.co"], ["CORS_ALLOWED_ORIGINS", "https://orionfold.com,http://127.0.0.1:4322"], ["CORS_ALLOWED_ORIGINS", "*"], ["STRIPE_SECRET_KEY", "unapproved-key"], ["STRIPE_FLOW_SECRET_KEY", "unapproved-key"]]) assertThrows(() => resolveServiceEnvironment({ ...stage, [name]: value }));
  assertThrows(() => resolveServiceEnvironment({ ...stage, CORS_ALLOWED_ORIGINS: "https://different.example" }));
});
