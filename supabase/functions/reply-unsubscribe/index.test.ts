// Unit lock: inbound reply adapter (B14). Svix verify + event parsing. The
// classification rules themselves are locked in _shared/reply-intent.test.ts.
// Run: deno test supabase/functions/reply-unsubscribe/index.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { inboundFromEvent, parseAddress, verifySvix } from "./index.ts";

const PREFIX = "wh" + "sec_";
const signingCreds = PREFIX + btoa("reply-inbound-signing-fixture");

async function sign(creds: string, id: string, ts: string, body: string): Promise<string> {
  const keyBytes = Uint8Array.from(atob(creds.slice(PREFIX.length)), (c) => c.charCodeAt(0));
  const signer = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", signer, new TextEncoder().encode(`${id}.${ts}.${body}`));
  return `v1,${btoa(String.fromCharCode(...new Uint8Array(mac)))}`;
}

Deno.test("verifySvix accepts a correctly signed inbound payload", async () => {
  const body = JSON.stringify({ type: "email.received" });
  const id = "msg_1", ts = "1755400000";
  const headers = new Headers({
    "svix-id": id,
    "svix-timestamp": ts,
    "svix-signature": await sign(signingCreds, id, ts, body),
  });
  assert(await verifySvix(signingCreds, headers, body));
});

Deno.test("verifySvix rejects a tampered inbound payload", async () => {
  const id = "msg_1", ts = "1755400000";
  const sig = await sign(signingCreds, id, ts, JSON.stringify({ type: "email.received" }));
  const headers = new Headers({ "svix-id": id, "svix-timestamp": ts, "svix-signature": sig });
  assert(!(await verifySvix(signingCreds, headers, JSON.stringify({ type: "email.received", data: { from: "x@y.com" } }))));
});

Deno.test("verifySvix rejects an unsigned request", async () => {
  assert(!(await verifySvix(signingCreds, new Headers(), "{}")));
});

Deno.test("parseAddress handles both display-name and bare forms", () => {
  assertEquals(parseAddress("Jane Doe <jane@example.com>"), "jane@example.com");
  assertEquals(parseAddress("jane@example.com"), "jane@example.com");
  assertEquals(parseAddress("Jane <JANE@Example.COM>"), "jane@example.com");
});

Deno.test("parseAddress refuses anything unusable rather than guessing", () => {
  // We may suppress on this value, so a bad parse must fail closed.
  for (const bad of ["", "   ", "not an address", null, undefined, 42, {}]) {
    assertEquals(parseAddress(bad as unknown), null, String(bad));
  }
});

Deno.test("inboundFromEvent extracts sender, id and subject", () => {
  const ev = {
    type: "email.received",
    data: {
      email_id: "e_123",
      from: "Jane Doe <jane@example.com>",
      subject: "Re: Your Flow rollout",
    },
  };
  assertEquals(inboundFromEvent(ev), {
    email: "jane@example.com",
    emailId: "e_123",
    subject: "Re: Your Flow rollout",
    headers: {},
  });
});

Deno.test("inboundFromEvent reads headers in list form", () => {
  const ev = {
    type: "email.received",
    data: { from: "j@e.com", headers: [{ name: "Auto-Submitted", value: "auto-replied" }] },
  };
  assertEquals(inboundFromEvent(ev)?.headers, { "Auto-Submitted": "auto-replied" });
});

Deno.test("inboundFromEvent reads headers in object form", () => {
  const ev = {
    type: "email.received",
    data: { from: "j@e.com", headers: { "Precedence": "bulk" } },
  };
  assertEquals(inboundFromEvent(ev)?.headers, { "Precedence": "bulk" });
});

Deno.test("inboundFromEvent ignores non-received events", () => {
  assertEquals(inboundFromEvent({ type: "email.delivered", data: { from: "j@e.com" } }), null);
});

Deno.test("inboundFromEvent ignores an event with no usable sender", () => {
  assertEquals(inboundFromEvent({ type: "email.received", data: {} }), null);
  assertEquals(inboundFromEvent(null), null);
});
