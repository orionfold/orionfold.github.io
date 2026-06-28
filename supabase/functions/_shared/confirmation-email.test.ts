// Unit lock for the A6 follow-up offer-aware confirmation copy. Guards: each
// named offer gets its own subject + pitch, an unknown/null offer falls back to
// the story-subscription default (fail-safe), and the shared scaffold (confirm
// URL, expiry line, signature) is always present.
//
// Run: deno test supabase/functions/_shared/confirmation-email.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { confirmationEmail } from "./confirmation-email.ts";

const URL = "https://orionfold.supabase.co/functions/v1/confirm-email?token=abc";

Deno.test("null offer -> story subscription default", () => {
  const e = confirmationEmail(URL, null);
  assertEquals(e.subject, "One click to get Orionfold stories");
  assert(e.text.includes("our stories"));
  assert(e.text.includes("the real build log"));
});

Deno.test("unknown offer falls back to default (fail-safe)", () => {
  const e = confirmationEmail(URL, "some-future-offer-not-mapped-yet");
  assertEquals(e.subject, "One click to get Orionfold stories");
  assert(e.text.includes("our stories"));
});

Deno.test("proof-playbook offer gets its own copy", () => {
  const e = confirmationEmail(URL, "proof-playbook");
  assertEquals(e.subject, "One click to get the Proof playbook");
  assert(e.text.includes("the Proof playbook"));
  assert(!e.text.includes("our stories"));
});

Deno.test("founder-letter offer gets its own copy", () => {
  const e = confirmationEmail(URL, "founder-letter");
  assertEquals(e.subject, "One click to get the founder letter");
  assert(e.text.includes("founder letter"));
  assert(!e.text.includes("our stories"));
});

Deno.test("become-ai-native-business offer names the AI For Everyone list + cadence", () => {
  const e = confirmationEmail(URL, "become-ai-native-business");
  assertEquals(e.subject, "One click for your free AI Native Business book");
  assert(e.text.includes("AI Native Business"));
  assert(e.text.includes("AI For Everyone"));
  // Cadence promise — the plain-text email wraps "One email a\nweek", so assert
  // on the parts that don't cross the wrap rather than the full phrase.
  assert(e.text.includes("email a"));
  assert(e.text.includes("week, no more"));
  assert(!e.text.includes("our stories"));
});

Deno.test("every variant keeps the shared scaffold", () => {
  for (const offer of [null, "proof-playbook", "founder-letter", "become-ai-native-business", "bogus"]) {
    const e = confirmationEmail(URL, offer);
    assert(e.text.startsWith("Hi,"), `greeting missing for ${offer}`);
    assert(e.text.includes(URL), `confirm URL missing for ${offer}`);
    assert(e.text.includes("expires in 7 days"), `expiry missing for ${offer}`);
    assert(e.text.includes("https://orionfold.com"), `signature missing for ${offer}`);
    // CAN-SPAM: every commercial email carries the LLC postal address + an opt-out.
    assert(e.text.includes("Sacramento, CA 95816"), `postal address missing for ${offer}`);
    assert(e.text.includes("Prefer not to hear from me"), `opt-out missing for ${offer}`);
    // website-copy-style: no em-dashes in customer-facing copy.
    assert(!e.text.includes("—"), `em-dash leaked for ${offer}`);
    assert(!e.subject.includes("—"), `em-dash in subject for ${offer}`);
  }
});
