// Unit lock: Svix verify (valid passes, tampered fails) + event-to-suppression map.
// Run: deno test supabase/functions/resend-webhook/index.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { suppressionFromEvent, verifySvix } from "./index.ts";

const PREFIX = "wh" + "sec_";
const signingCreds = PREFIX + btoa("resend-webhook-signing-fixture");

async function sign(creds: string, id: string, ts: string, body: string): Promise<string> {
  const keyBytes = Uint8Array.from(atob(creds.slice(PREFIX.length)), (c) => c.charCodeAt(0));
  const signer = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", signer, new TextEncoder().encode(`${id}.${ts}.${body}`));
  return `v1,${btoa(String.fromCharCode(...new Uint8Array(mac)))}`;
}

Deno.test("verifySvix accepts a correctly signed payload", async () => {
  const body = JSON.stringify({ type: "email.bounced" });
  const id = "msg_1", ts = "1720000000";
  const sig = await sign(signingCreds, id, ts, body);
  const headers = new Headers({ "svix-id": id, "svix-timestamp": ts, "svix-signature": sig });
  assert(await verifySvix(signingCreds, headers, body));
});

Deno.test("verifySvix rejects a tampered payload", async () => {
  const id = "msg_1", ts = "1720000000";
  const sig = await sign(signingCreds, id, ts, JSON.stringify({ type: "email.bounced" }));
  const headers = new Headers({ "svix-id": id, "svix-timestamp": ts, "svix-signature": sig });
  assert(!(await verifySvix(signingCreds, headers, JSON.stringify({ type: "email.complained" }))));
});

Deno.test("verifySvix rejects when headers are missing", async () => {
  assert(!(await verifySvix(signingCreds, new Headers(), "{}")));
});

Deno.test("suppressionFromEvent maps a hard bounce", () => {
  const ev = { type: "email.bounced", data: { to: ["x@example.com"], bounce: { type: "hard" } } };
  assertEquals(suppressionFromEvent(ev), { email: "x@example.com", reason: "bounce" });
});

Deno.test("suppressionFromEvent ignores a soft bounce", () => {
  const ev = { type: "email.bounced", data: { to: ["x@example.com"], bounce: { type: "transient" } } };
  assertEquals(suppressionFromEvent(ev), null);
});

Deno.test("suppressionFromEvent maps a complaint", () => {
  const ev = { type: "email.complained", data: { to: ["y@example.com"] } };
  assertEquals(suppressionFromEvent(ev), { email: "y@example.com", reason: "complaint" });
});

Deno.test("suppressionFromEvent ignores unrelated events", () => {
  assertEquals(suppressionFromEvent({ type: "email.delivered", data: { to: ["z@example.com"] } }), null);
});
