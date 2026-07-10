// Unit lock for getOrMintToken: idempotent email-to-token mint. Fake in-memory client.
// Run: deno test supabase/functions/_shared/email-tokens.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getOrMintToken } from "./email-tokens.ts";

function fakeClient() {
  const rows: { email: string; token: string }[] = [];
  return {
    rows,
    from(_t: string) {
      return {
        select(_c: string) {
          return {
            eq(_col: string, email: string) {
              return {
                maybeSingle() {
                  const hit = rows.find((r) => r.email === email);
                  return Promise.resolve({ data: hit ? { token: hit.token } : null, error: null });
                },
              };
            },
          };
        },
        upsert(row: { email: string; token: string }, _o: unknown) {
          return {
            select(_c: string) {
              return {
                single() {
                  const existing = rows.find((r) => r.email === row.email);
                  if (existing) return Promise.resolve({ data: { token: existing.token }, error: null });
                  rows.push(row);
                  return Promise.resolve({ data: { token: row.token }, error: null });
                },
              };
            },
          };
        },
      };
    },
  };
}

Deno.test("getOrMintToken mints for a new email", async () => {
  const c = fakeClient();
  const t = await getOrMintToken(c, "new@example.com");
  assert(typeof t === "string" && t.length > 0);
  assertEquals(c.rows.length, 1);
});

Deno.test("getOrMintToken is idempotent", async () => {
  const c = fakeClient();
  const first = await getOrMintToken(c, "repeat@example.com");
  const second = await getOrMintToken(c, "repeat@example.com");
  assertEquals(first, second);
  assertEquals(c.rows.length, 1);
});

Deno.test("getOrMintToken gives different emails different tokens", async () => {
  const c = fakeClient();
  const a = await getOrMintToken(c, "a@example.com");
  const b = await getOrMintToken(c, "b@example.com");
  assert(a !== b);
});
