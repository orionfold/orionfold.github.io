// Contracts for the licence claim values that carry a buyer from checkout into
// a licensed app. Each test below pins a property the design depends on, not an
// implementation detail.
import { assert, assertEquals, assertNotEquals } from "jsr:@std/assert@1";
import {
  CLAIM_QUERY_PARAM,
  CLAIM_TTL_SECONDS,
  claimDeepLink,
  claimFromBody,
  claimIsExpired,
  digestClaim,
  FLOW_URL_SCHEME,
  mintClaim,
  sessionIdFromBody,
} from "./license-claim.ts";

Deno.test("a claim is unpredictable", () => {
  // The whole security argument rests on this. If two mints could collide, one
  // buyer could redeem another's licence.
  const seen = new Set<string>();
  for (let i = 0; i < 200; i++) seen.add(mintClaim().claim);
  assertEquals(seen.size, 200, "every mint is distinct");
});

Deno.test("a claim carries enough entropy to be unguessable", () => {
  // 32 random bytes in base64url is 43 characters. A shorter value would be
  // brute-forceable against an endpoint that cannot rate limit an unknown
  // caller, which is exactly our situation.
  const { claim } = mintClaim();
  assert(claim.length >= 43, `expected at least 43 chars, got ${claim.length}`);
  // base64url only, so it survives a URL without percent-encoding.
  assert(/^[A-Za-z0-9_-]+$/.test(claim), `not base64url: ${claim}`);
});

Deno.test("only the digest is storable, and it is stable", () => {
  const { claim, digest } = mintClaim();
  assertNotEquals(digest, claim, "the digest is never the claim itself");
  assertEquals(digest, digestClaim(claim), "digesting is deterministic");
  assertEquals(digest.length, 64, "SHA-256 hex is 64 chars");
  // The point of storing a digest: the stored value must not reveal the claim.
  assert(!digest.includes(claim), "the digest does not contain the claim");
});

Deno.test("a different claim digests differently", () => {
  assertNotEquals(digestClaim("alpha"), digestClaim("beta"));
});

Deno.test("the deep link names the app scheme and carries the claim", () => {
  const { claim } = mintClaim();
  const link = claimDeepLink(claim);
  assert(link.startsWith(`${FLOW_URL_SCHEME}://licence?`), `unexpected link: ${link}`);
  assert(link.includes(`${CLAIM_QUERY_PARAM}=`), "the claim rides on the query");
  // A claim containing base64url characters needs no escaping, but a caller
  // must still be able to round-trip it out of the URL.
  const parsed = new URL(link);
  assertEquals(parsed.searchParams.get(CLAIM_QUERY_PARAM), claim);
});

Deno.test("expiry is measured from the mint time", () => {
  const now = Date.now();
  const fresh = new Date(now - 60 * 1000).toISOString();
  const stale = new Date(now - (CLAIM_TTL_SECONDS + 60) * 1000).toISOString();
  assertEquals(claimIsExpired(fresh, now), false, "a minute old claim is live");
  assertEquals(claimIsExpired(stale, now), true, "past the window it is dead");
});

Deno.test("the expiry window survives a Stripe webhook retry", () => {
  // The window exists to outlast a webhook retry after a transient failure. If
  // this ever drops to a minute, a recoverable delay becomes a buyer holding a
  // receipt and no licence.
  assert(
    CLAIM_TTL_SECONDS >= 10 * 60,
    `window too short for a webhook retry: ${CLAIM_TTL_SECONDS}s`,
  );
});

Deno.test("an unparseable timestamp is treated as expired", () => {
  // Failing closed: a row we cannot read the age of must not be redeemable.
  assertEquals(claimIsExpired("not a date"), true);
});

Deno.test("a missing timestamp is not expired", () => {
  // Null means "never stamped", which the caller handles separately; it must
  // not silently read as expired.
  assertEquals(claimIsExpired(null), false);
});

Deno.test("claimFromBody accepts either spelling and refuses junk", () => {
  assertEquals(claimFromBody({ claim_token: "abc" }), "abc");
  assertEquals(claimFromBody({ claim: "abc" }), "abc");
  assertEquals(claimFromBody({}), null);
  assertEquals(claimFromBody(null), null);
  assertEquals(claimFromBody("abc"), null, "a bare string is not a body");
  assertEquals(claimFromBody({ claim: "" }), null, "empty is not a claim");
  assertEquals(claimFromBody({ claim: 42 }), null, "a number is not a claim");
});

Deno.test("sessionIdFromBody accepts only Stripe checkout session ids", () => {
  assertEquals(sessionIdFromBody({ session_id: "cs_test_123" }), "cs_test_123");
  assertEquals(sessionIdFromBody({ sessionId: "cs_live_abc" }), "cs_live_abc");
  // Refusing anything without the cs_ prefix keeps this parameter from being
  // pointed at customer ids, subscription ids or licence ids.
  assertEquals(sessionIdFromBody({ session_id: "cus_123" }), null);
  assertEquals(sessionIdFromBody({ session_id: "sub_123" }), null);
  assertEquals(sessionIdFromBody({ session_id: "" }), null);
  assertEquals(sessionIdFromBody({}), null);
  assertEquals(sessionIdFromBody(null), null);
});
