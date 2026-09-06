import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { type ConfirmDependencies, createConfirmHandler } from "./handler.ts";
const token = "a".repeat(64);
const url = "https://service.test/functions/v1/flow-living-documents-confirm";
function setup(overrides: Partial<ConfirmDependencies> = {}) {
  const calls: string[] = [];
  const handler = createConfirmHandler({
    enabled: () => true,
    site: () => "https://orionfold.com",
    functionsBase: () => "https://service.test/functions/v1",
    hash: async (raw) => {
      calls.push("hash");
      assertEquals(raw, token);
      return "b".repeat(64);
    },
    confirm: async (hash) => {
      calls.push("confirm");
      assertEquals(hash, "b".repeat(64));
      return true;
    },
    ...overrides,
  });
  return { handler, calls };
}
function post(raw = token, origin = "https://service.test") {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: origin,
    },
    body: new URLSearchParams({ token: raw }),
  });
}
Deno.test("email-link GET is scanner-safe and cannot consume consent", async () => {
  const { handler, calls } = setup();
  const response = await handler(new Request(`${url}?token=${token}`));
  assertEquals(response.status, 200);
  assertEquals(calls, []);
  const html = await response.text();
  assert(html.includes('method="post"'));
  assert(
    html.includes(
      'action="https://service.test/functions/v1/flow-living-documents-confirm"',
    ),
  );
  assert(html.includes("Confirm subscription"));
  assert(response.headers.get("Referrer-Policy") === "no-referrer");
  assert(response.headers.get("X-Robots-Tag")?.includes("noindex"));
});
Deno.test("explicit confirmation hashes token and redirects only to dedicated return namespace", async () => {
  const { handler, calls } = setup();
  const response = await handler(post());
  assertEquals(response.status, 303);
  assertEquals(calls, ["hash", "confirm"]);
  assertEquals(
    response.headers.get("Location"),
    "https://orionfold.com/manifesto/?living-documents-confirmed=1#email-updates",
  );
  assert(!response.headers.get("Location")?.includes(token));
});
Deno.test("expired, replayed and suppressed token returns the same unavailable state", async () => {
  const { handler } = setup({ confirm: async () => false });
  const response = await handler(post());
  assert(
    response.headers.get("Location")?.includes(
      "living-documents-confirmed=error",
    ),
  );
});
Deno.test("malformed token and foreign POST origin cannot query the receipt store", async () => {
  const { handler, calls } = setup();
  assertEquals((await handler(post("bad"))).status, 303);
  assertEquals((await handler(post(token, "https://evil.test"))).status, 403);
  assertEquals(calls, []);
});
Deno.test("confirmation database failure remains an error rather than claiming consent", async () => {
  const { handler } = setup({
    confirm: async () => {
      throw new Error("db");
    },
  });
  assertEquals((await handler(post())).status, 503);
});
Deno.test("disabled confirmation does not access tokens", async () => {
  const { handler, calls } = setup({ enabled: () => false });
  assertEquals((await handler(post())).status, 503);
  assertEquals(calls, []);
});
