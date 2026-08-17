// Unit lock: reply opt-out classification (B14). The regression bar for this path
// is precision - a false positive silently and permanently suppresses someone who
// never asked, so the false-positive cases below are the load-bearing ones.
// Run: deno test supabase/functions/_shared/reply-intent.test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { classifyReply, isAutoReply, stripQuotedReply } from "./reply-intent.ts";

// The exact footer resend-send appends to every nurture email. Every reply we
// receive quotes this, so it is the single most dangerous string in the system:
// a naive "body contains unsubscribe" check matches EVERY reply because of it.
const QUOTED_FOOTER = `
On Sat, Aug 16, 2026 at 9:02 AM Orionfold <manav@updates.orionfold.com> wrote:
> Here is the next step in your Flow rollout.
>
> Orionfold LLC, 2108 N St Ste N, Sacramento, CA 95816
> Unsubscribe: https://orionfold.com/unsubscribe?t=abc123
`;

Deno.test("a plain thank-you quoting our unsubscribe footer is NOT an opt-out", () => {
  const body = `Thanks, this was genuinely useful. Will try it this week.\n${QUOTED_FOOTER}`;
  assertEquals(classifyReply("Re: Your Flow rollout", body).intent, "ignore");
});

Deno.test("a question quoting the footer is NOT an opt-out", () => {
  const body = `Does this work on a Spark I already own?\n${QUOTED_FOOTER}`;
  assertEquals(classifyReply("Re: Your Flow rollout", body).intent, "ignore");
});

Deno.test("a one-word reply opt-out is caught", () => {
  const body = `Unsubscribe\n${QUOTED_FOOTER}`;
  assertEquals(classifyReply("Re: Your Flow rollout", body).intent, "unsubscribe");
});

Deno.test("a polite sentence opt-out is caught", () => {
  const body = `Hi - please remove me from this list, thanks.\n${QUOTED_FOOTER}`;
  assertEquals(classifyReply("Re: Your Flow rollout", body).intent, "unsubscribe");
});

Deno.test("'stop emailing me' is caught", () => {
  assertEquals(classifyReply("Re: hello", "stop emailing me").intent, "unsubscribe");
});

Deno.test("a bare STOP is caught", () => {
  assertEquals(classifyReply("Re: hello", "STOP").intent, "unsubscribe");
});

Deno.test("a bare 'Unsubscribe' subject with an empty body is caught", () => {
  assertEquals(classifyReply("Unsubscribe", "").intent, "unsubscribe");
});

Deno.test("our own subject line containing the word does not self-trigger", () => {
  // A long subject is never treated as a bare opt-out, so a campaign subject that
  // happens to say "unsubscribe" cannot suppress a reply on its own.
  const subject = "Re: How to unsubscribe from tools you no longer use";
  assertEquals(classifyReply(subject, "Great piece, thanks!").intent, "ignore");
});

Deno.test("ambiguous phrasing escalates to review, never to suppression", () => {
  for (const body of ["Not interested.", "I think you have the wrong person.", "How did you get my address?"]) {
    assertEquals(classifyReply("Re: hello", body).intent, "review", body);
  }
});

Deno.test("an out-of-office auto-reply is ignored even when it quotes the footer", () => {
  const body = `I am out of the office until Monday.\n${QUOTED_FOOTER}`;
  const headers = { "Auto-Submitted": "auto-replied" };
  assertEquals(classifyReply("Automatic reply: Your Flow rollout", body, headers).intent, "ignore");
});

Deno.test("isAutoReply reads the common auto-responder headers", () => {
  assertEquals(isAutoReply({ "Auto-Submitted": "auto-generated" }), true);
  assertEquals(isAutoReply({ "Precedence": "bulk" }), true);
  assertEquals(isAutoReply({ "X-Autoreply": "yes" }), true);
  assertEquals(isAutoReply({ "Auto-Submitted": "no" }), false);
  assertEquals(isAutoReply({}), false);
});

Deno.test("stripQuotedReply keeps only the human-typed text", () => {
  assertEquals(stripQuotedReply(`Yes please.\n${QUOTED_FOOTER}`), "Yes please.");
  assertEquals(stripQuotedReply("No thanks.\n-- \nSent from my iPhone"), "No thanks.");
  assertEquals(stripQuotedReply("Sure.\n-----Original Message-----\n> unsubscribe"), "Sure.");
  assertEquals(stripQuotedReply("Ok.\nFrom: Orionfold\nUnsubscribe here"), "Ok.");
});

Deno.test("an opt-out below a signature delimiter is not read from quoted text", () => {
  // The word only appears in quoted history, so this must NOT suppress.
  const body = `Looks good.\n--\nJane\n> Unsubscribe: https://orionfold.com/unsubscribe?t=x`;
  assertEquals(classifyReply("Re: hello", body).intent, "ignore");
});

Deno.test("classification never returns the reply text in `matched`", () => {
  const { matched } = classifyReply("Re: hello", "please remove me, my name is Jane Doe");
  assertEquals(matched?.includes("Jane"), false);
});
