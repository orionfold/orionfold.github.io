// Unit lock for the A6 evolvable lead payload. Guards: email validation,
// known-fields-to-columns, unknown-extras-to-metadata (the future-proof seam),
// honeypot detection, server-side IP/UA derivation, and backward-compat with
// the legacy {email, website, source} payload (source must land in metadata).
//
// Run: deno test supabase/functions/_shared/lead-input.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isHoneypotTripped, parseLeadInput } from "./lead-input.ts";

function hdrs(ip = "203.0.113.7", ua = "test-agent") {
  return new Headers({ "x-forwarded-for": ip, "user-agent": ua });
}

Deno.test("rejects a missing/invalid email", () => {
  const r = parseLeadInput({ email: "not-an-email" }, hdrs());
  assert(!r.ok);
});

Deno.test("known fields land in columns", () => {
  const r = parseLeadInput(
    { email: "A@Example.com ", offer: "proof-playbook", utm_source: "x", consent_text: "I agree" },
    hdrs(),
  );
  assert(r.ok);
  assertEquals(r.columns.email, "a@example.com");
  assertEquals(r.columns.offer, "proof-playbook");
  assertEquals(r.columns.utm_source, "x");
  assertEquals(r.columns.consent_text, "I agree");
});

Deno.test("unknown extras land in metadata, not columns", () => {
  const r = parseLeadInput(
    { email: "a@b.com", offer: "o", experiment_arm: "B", deep_page: "/proof/" },
    hdrs(),
  );
  assert(r.ok);
  assertEquals(r.metadata, { experiment_arm: "B", deep_page: "/proof/" });
});

Deno.test("legacy {source} payload stays backward-compatible (source to metadata)", () => {
  const r = parseLeadInput({ email: "a@b.com", website: "", source: "home" }, hdrs());
  assert(r.ok);
  assertEquals(r.metadata, { source: "home" });
  // website is the honeypot field and must NOT leak into metadata
  assertEquals("website" in r.metadata, false);
});

Deno.test("ip + ua are derived server-side from headers, never the body", () => {
  const r = parseLeadInput(
    { email: "a@b.com", ip_address: "1.1.1.1", user_agent: "evil" },
    hdrs("203.0.113.7", "real-agent"),
  );
  assert(r.ok);
  assertEquals(r.columns.ip_address, "203.0.113.7");
  assertEquals(r.columns.user_agent, "real-agent");
  // forged body ip/ua must not survive as columns; they fall to metadata harmlessly
  assert(r.metadata.ip_address === "1.1.1.1");
});

Deno.test("missing optional fields are null, not undefined", () => {
  const r = parseLeadInput({ email: "a@b.com" }, hdrs());
  assert(r.ok);
  assertEquals(r.columns.offer, null);
  assertEquals(r.columns.utm_campaign, null);
  assertEquals(r.columns.referrer, null);
});

Deno.test("honeypot detection is independent of parse", () => {
  assert(isHoneypotTripped({ email: "a@b.com", website: "bot" }));
  assert(!isHoneypotTripped({ email: "a@b.com", website: "" }));
  assert(!isHoneypotTripped({ email: "a@b.com" }));
});
