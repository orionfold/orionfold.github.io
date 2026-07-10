// Unit lock: constant-time auth, limit clamp, row shape. Mirrors waitlist-export.
// Run: deno test supabase/functions/suppressions-export/index.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { authorized, clampLimit, mapRow } from "./index.ts";

function authHeader(v: string): Headers {
  return new Headers({ Authorization: "Bearer " + v });
}

Deno.test("authorized rejects missing/wrong, accepts right, rejects empty", () => {
  const fixture = "suppressions-export-fixture-string";
  assert(!authorized(new Headers(), fixture));
  assert(!authorized(authHeader("wrong"), fixture));
  assert(!authorized(authHeader("suppressions-export-fixture-strin"), fixture));
  assert(authorized(authHeader(fixture), fixture));
  assert(!authorized(authHeader("anything"), ""));
});

Deno.test("clampLimit defaults and caps", () => {
  assertEquals(clampLimit(null), 500);
  assertEquals(clampLimit("0"), 500);
  assertEquals(clampLimit("-3"), 500);
  assertEquals(clampLimit("abc"), 500);
  assertEquals(clampLimit("50"), 50);
  assertEquals(clampLimit("5000"), 1000);
});

Deno.test("mapRow emits the contract shape", () => {
  assertEquals(
    mapRow({ email: "a@example.com", token: "tok", reason: "unsubscribe", suppressed_at: "2026-07-09T00:00:00Z" }),
    { email: "a@example.com", token: "tok", reason: "unsubscribe", suppressed_at: "2026-07-09T00:00:00Z" },
  );
});

Deno.test("mapRow tolerates a null token", () => {
  assertEquals(
    mapRow({ email: "b@example.com", token: null, reason: "bounce", suppressed_at: "2026-07-09T01:00:00Z" }),
    { email: "b@example.com", token: null, reason: "bounce", suppressed_at: "2026-07-09T01:00:00Z" },
  );
});
