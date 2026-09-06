import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { readLivingDocumentSuppressions } from "./suppression.ts";
const email = ["reader", "example.invalid"].join("@");
const other = ["other", "example.invalid"].join("@");
Deno.test("normalized RPC suppression snapshot is shared by new-offer consumers", async () => {
  let requested: string[] = [];
  const result = await readLivingDocumentSuppressions(
    [email, email, other],
    async (values) => {
      requested = values;
      return { data: [email], error: null };
    },
  );
  assertEquals(requested, [email, other]);
  assertEquals([...result], [email]);
});
Deno.test("empty input performs no lookup and oversized or unnormalized input fails before IO", async () => {
  let calls = 0;
  const rpc = async () => {
    calls++;
    return { data: [], error: null };
  };
  assertEquals([...await readLivingDocumentSuppressions([], rpc)], []);
  for (
    const values of [
      [email.toUpperCase()],
      [" " + email],
      Array(501).fill(email),
    ]
  ) {
    await assertRejects(() => readLivingDocumentSuppressions(values, rpc));
  }
  assertEquals(calls, 0);
});
Deno.test("RPC errors or an invalid suppression result cannot clear eligibility", async () => {
  for (
    const response of [
      { data: [], error: { message: "unavailable" } },
      { data: null, error: null },
      { data: [email.toUpperCase()], error: null },
      { data: [other], error: null },
      { data: [email, email], error: null },
      { data: [42], error: null },
    ]
  ) {
    await assertRejects(() =>
      readLivingDocumentSuppressions([email], async () => response)
    );
  }
});
Deno.test("maximum snapshot uses one scalar RPC result without row pagination", async () => {
  const emails = Array.from(
    { length: 500 },
    (_, n) => `reader-${n}` + String.fromCharCode(64) + "example.invalid",
  );
  let calls = 0;
  const result = await readLivingDocumentSuppressions(
    emails,
    async (values) => {
      calls++;
      return { data: values, error: null };
    },
  );
  assertEquals(result.size, 500);
  assertEquals(calls, 1);
});
