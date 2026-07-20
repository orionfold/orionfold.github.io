import {
  assertEquals,
  assertNotEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  deriveWorkshopToken,
  hashWorkshopToken,
  isRequestId,
  normalizeWorkshopEmail,
  requestHash,
} from "./workshop-token.ts";

Deno.test("workshop tokens are deterministic, purpose- and generation-scoped", async () => {
  const a = await deriveWorkshopToken("secret", "entitlement", "access", 1);
  assertEquals(a.length, 43);
  assertEquals(a, await deriveWorkshopToken("secret", "entitlement", "access", 1));
  assertNotEquals(a, await deriveWorkshopToken("secret", "entitlement", "access", 2));
  assertNotEquals(a, await deriveWorkshopToken("secret", "entitlement", "refund", 1));
  assertNotEquals(a, await deriveWorkshopToken("secret", "different", "access", 1));
  assertNotEquals(a, await hashWorkshopToken(a));
});

Deno.test("workshop token helpers fail closed", async () => {
  await assertRejects(() => deriveWorkshopToken("", "entitlement", "access", 1));
  await assertRejects(() => deriveWorkshopToken("secret", "", "access", 1));
  await assertRejects(() => hashWorkshopToken("raw-token"));
});

Deno.test("request hashes hide raw dimensions and emails normalize", async () => {
  const buyerEmail = ["buyer", "example.com"].join("@");
  const mixedCaseBuyerEmail = `  ${["Buyer", "Example.COM"].join("@")} `;
  const hash = await requestHash("request-secret", "email", buyerEmail);
  assertEquals(hash.length, 43);
  assertNotEquals(hash, buyerEmail);
  assertEquals(normalizeWorkshopEmail(mixedCaseBuyerEmail), buyerEmail);
  assertEquals(normalizeWorkshopEmail("not-an-email"), null);
  assertEquals(isRequestId("123e4567-e89b-42d3-a456-426614174000"), true);
  assertEquals(isRequestId("not-a-uuid"), false);
});
