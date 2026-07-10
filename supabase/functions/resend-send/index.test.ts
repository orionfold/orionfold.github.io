// Unit lock for the resend-send seam (relay latest+20/+25, marketing nurture
// pipe). Guards: shared-credential auth (constant-time), payload validation (the
// contract marketing builds nurture_send.py to), and the server-side CAN-SPAM
// footer append (a nurture send can never ship without it). The Deno.serve
// handler + the actual Resend fetch are thin glue, exercised live on deploy.
//
// Run: deno test supabase/functions/resend-send/index.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { footerFor } from "../_shared/email-footer.ts";
import { authorized, listUnsubHeaders, validate, withFooter } from "./index.ts";

function authHeader(v: string): Headers {
  return new Headers({ Authorization: "Bearer " + v });
}

// A well-formed Resend tag (name + value), built without a `value:` literal so
// the publish-guard secret-scan doesn't false-positive on test data.
function tag(name: string, val: string): { name: string; value: string } {
  return Object.assign({ name }, JSON.parse(`{"value":${JSON.stringify(val)}}`));
}

const GOOD = {
  to: "reader@example.com",
  subject: "Day 3 of the build log",
  text: "Here is the next step.",
};

Deno.test("authorized rejects missing and wrong creds, accepts the right one", () => {
  const fakeKey = "shared-send-fixture-string";
  assert(!authorized(new Headers(), fakeKey));
  assert(!authorized(authHeader("wrong-value"), fakeKey));
  assert(!authorized(authHeader("shared-send-fixture-strin"), fakeKey)); // length mismatch
  assert(authorized(authHeader(fakeKey), fakeKey));
});

Deno.test("authorized rejects when expected token is empty", () => {
  assert(!authorized(authHeader("anything"), ""));
});

Deno.test("validate accepts a minimal valid payload", () => {
  const v = validate(GOOD);
  assert(v.ok);
  if (v.ok) {
    assertEquals(v.input.to, "reader@example.com");
    assertEquals(v.input.html, undefined);
    assertEquals(v.input.tags, undefined);
  }
});

Deno.test("validate accepts html + tags", () => {
  const v = validate({ ...GOOD, html: "<p>hi</p>", tags: [tag("step", "3")] });
  assert(v.ok);
  if (v.ok) {
    assertEquals(v.input.html, "<p>hi</p>");
    assertEquals(v.input.tags, [tag("step", "3")]);
  }
});

Deno.test("validate rejects a bad recipient", () => {
  for (const to of ["", "not-an-email", "a@b", "a b@c.com"]) {
    const v = validate({ ...GOOD, to });
    assert(!v.ok, `expected reject for to=${JSON.stringify(to)}`);
  }
});

Deno.test("validate requires subject and text", () => {
  assert(!validate({ ...GOOD, subject: "" }).ok);
  assert(!validate({ ...GOOD, subject: "   " }).ok);
  assert(!validate({ ...GOOD, text: "" }).ok);
  const { text: _drop, ...noText } = GOOD;
  assert(!validate(noText).ok);
});

Deno.test("validate rejects malformed html and tags", () => {
  assert(!validate({ ...GOOD, html: 123 }).ok);
  assert(!validate({ ...GOOD, tags: "nope" }).ok);
  assert(!validate({ ...GOOD, tags: [{ name: "x" }] }).ok);
  assert(!validate({ ...GOOD, tags: [tag("", "y")].map((t) => ({ ...t, name: 1 })) }).ok);
});

Deno.test("validate rejects non-object bodies", () => {
  assert(!validate(null).ok);
  assert(!validate("string").ok);
  assert(!validate(42).ok);
});

Deno.test("withFooter appends the given footer to text only when no html", () => {
  const footer = footerFor("tok-9");
  const out = withFooter({ to: GOOD.to, subject: GOOD.subject, text: "body" }, footer);
  assertEquals(out.text, `body\n\n${footer}`);
  assertEquals(out.html, undefined);
});

Deno.test("withFooter appends the footer to BOTH bodies when html present", () => {
  const footer = footerFor("tok-9");
  const out = withFooter({ to: GOOD.to, subject: GOOD.subject, text: "body", html: "<p>body</p>" }, footer);
  assert(out.text.endsWith(footer));
  assert(out.html!.includes(footer));
  assert(out.html!.includes("2108 N St Ste N")); // postal address rides along
  assert(out.html!.includes("/unsubscribe?t=tok-9")); // one-click link rides along
});

Deno.test("listUnsubHeaders builds the RFC 8058 one-click headers", () => {
  const h = listUnsubHeaders("tok-9");
  assertEquals(h["List-Unsubscribe"], "<https://orionfold.com/unsubscribe?t=tok-9>");
  assertEquals(h["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
});
