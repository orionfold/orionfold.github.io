import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getCorsHeaders, parseAllowedOrigins } from "./cors.ts";

Deno.test("CORS defaults to the production site", () => {
  assertEquals(parseAllowedOrigins(null), ["https://orionfold.com"]);
});

Deno.test("CORS parses a unique staging-only origin list", () => {
  assertEquals(
    parseAllowedOrigins("http://127.0.0.1:4322/, http://localhost:4322, http://127.0.0.1:4322"),
    ["http://127.0.0.1:4322", "http://localhost:4322"],
  );
});

Deno.test({
  name: "CORS reflects only an explicitly allowed local origin",
  fn() {
    const prior = Deno.env.get("CORS_ALLOWED_ORIGINS");
    try {
      Deno.env.set("CORS_ALLOWED_ORIGINS", "http://127.0.0.1:4322,https://orionfold.com");
      const allowed = getCorsHeaders(new Request("https://example.test", {
        headers: { Origin: "http://127.0.0.1:4322" },
      }));
      const rejected = getCorsHeaders(new Request("https://example.test", {
        headers: { Origin: "https://evil.example" },
      }));
      assertEquals(allowed["Access-Control-Allow-Origin"], "http://127.0.0.1:4322");
      assertEquals(rejected["Access-Control-Allow-Origin"], "http://127.0.0.1:4322");
      assertEquals(allowed.Vary, "Origin");
    } finally {
      if (prior === undefined) Deno.env.delete("CORS_ALLOWED_ORIGINS");
      else Deno.env.set("CORS_ALLOWED_ORIGINS", prior);
    }
  },
});
