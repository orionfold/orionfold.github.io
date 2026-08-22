// flow-checkout contract guards.
//
// The product lane is baking `LicenseEndpoints.checkout` against this contract
// into a SIGNED BINARY. Once shipped, the name and the response shape cannot be
// changed without a new notarized release, so these are not style assertions:
// each one pins something another lane compiled against.
//
// Contract published 2026-08-22 11:00, built 11:0x.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

const fn = read('supabase/functions/flow-checkout/index.ts');
const config = read('supabase/config.toml');
const claim = read('supabase/functions/_shared/license-claim.ts');

// THE AUTH FOOTGUN. This endpoint takes no auth header by design: the caller is
// an unlicensed Base user with nothing to sign with. Both halves are required —
// the config entry AND --no-verify-jwt at deploy — and the failure only shows up
// on a live deploy, which is the most expensive place to find it.
assert.match(
  config,
  /\[functions\.flow-checkout\]\s*\nverify_jwt = false/,
  'flow-checkout must set verify_jwt = false, or callers need an apikey the app does not carry',
);

// THE RESPONSE SHAPE the app decodes. `url` matches what flow-billing-portal
// already returns, so their existing decoder works unchanged; `session_id` is
// the floor of the licence handoff.
assert.match(fn, /jsonResponse\(\{ url: session\.url, session_id: session\.id \}/, 'the 200 shape is { url, session_id }');

// THE REFUSAL VOCABULARY. 403 refused, default badResponse, and explicitly NO
// 404 — the product lane asked for that, since noCustomer is meaningless when
// the caller has no customer by definition.
assert.match(fn, /corsHeaders,\s*403/, 'refusals use 403');
assert.doesNotMatch(fn, /corsHeaders,\s*404/, 'never send 404 from flow-checkout');

// THE PLAN ALLOWLIST. An unauthenticated endpoint must not accept a lookup key
// or a price id from the caller, or it becomes a way to start a checkout for
// any SKU in the catalog.
assert.match(fn, /monthly: "license_orionfold_flow_monthly"/);
assert.match(fn, /annual: "license_orionfold_flow_annual"/);
assert.doesNotMatch(fn, /lookupKey = body|body\.lookup_key/, 'the caller never supplies a lookup key');

// PRICE RESOLUTION stays server-side by lookup_key, never a hardcoded id, so
// Stripe remains the source of truth for what is charged.
assert.match(fn, /lookup_keys: \[lookupKey\]/, 'the price resolves by lookup key');

// SUCCESS URL is a real page, not a deep link. A browser cannot be relied on to
// hand off to an app, so the page always renders and the page offers the link.
assert.match(fn, /success_url: `\$\{SITE_URL\}\/flow\/welcome\/\?session_id=\{CHECKOUT_SESSION_ID\}`/);
assert.doesNotMatch(fn, /success_url:[^\n]*orionfold-flow:\/\//, 'never send a browser straight to a URL scheme');

// THE CLAIM IS STORED AS A DIGEST, never raw. A stolen dump must yield nothing
// redeemable.
assert.match(fn, /claim_digest: digest/, 'only the digest reaches the database');
assert.doesNotMatch(fn, /claim_digest: claim\b/, 'the raw claim is never stored');
assert.match(claim, /createHash\("sha256"\)/, 'claims are digested with SHA-256');

// THE EXPIRY WINDOW must outlast a Stripe webhook retry. If this drops to a
// minute, a recoverable webhook delay becomes a buyer with a receipt and no
// licence.
const ttl = claim.match(/CLAIM_TTL_SECONDS = (\d+) \* 60/);
assert.ok(ttl, 'the claim window is declared in minutes');
assert.ok(Number(ttl[1]) >= 10, `claim window too short for a webhook retry: ${ttl[1]} minutes`);

// THE POST-CHECKOUT PAGE must exist and must not be indexed: it has nothing to
// offer search and its URL carries a checkout session id.
const welcome = read('src/pages/flow/welcome.astro');
assert.match(welcome, /noindex=\{true\}/, 'the welcome page is noindex');
assert.match(
  read('astro.config.mjs'),
  /!page\.endsWith\('\/flow\/welcome\/'\)/,
  'the welcome page stays out of the sitemap',
);
// The deep link is offered only when the page was reached from a real checkout,
// so the button can never appear on a bare visit to the URL.
assert.match(welcome, /indexOf\('cs_'\) !== 0\) return;/, 'the fast path requires a real session id');

// ── flow-license-refresh: the buyer's way in ───────────────────────────────
// Contract requested 2026-08-22 12:36 (orionfold-flow), built 12:4x. The poll
// on the other side is being written against this shape RIGHT NOW and lands in
// a notarized binary, so these pin what another lane compiled against.
const refresh = read('supabase/functions/flow-license-refresh/index.ts');
const reissue = read('supabase/functions/_shared/license-reissue.ts');

// Same auth footgun as flow-checkout: the buyer path carries no auth header,
// because a buyer mid-purchase has nothing to sign with.
assert.match(
  config,
  /\[functions\.flow-license-refresh\]\s*\nverify_jwt = false/,
  'flow-license-refresh must set verify_jwt = false, or callers need an apikey the app does not carry',
);

// THE PARAMETER ITSELF, both spellings, resolved in one place.
assert.match(reissue, /export function sessionIdFromBody/, 'the session id has one resolver');
assert.match(reissue, /b\.session_id \?\? b\.stripe_session_id/, 'both key spellings are accepted');
assert.match(reissue, /startsWith\("cs_"\)/, 'only a Stripe session id is a valid lookup key');
assert.match(refresh, /sessionIdFromBody/, 'the endpoint reads the session id through the shared resolver');

// THE CORRECTION THAT MATTERS MOST, and the one the poll would otherwise hit in
// production: 304 is decided by comparing against the caller's HELD payload. A
// session-id caller holds nothing, so that branch must be excluded for them --
// a 304 there hands an empty body to the one caller with no licence at all.
assert.match(
  refresh,
  /if \(heldPayload !== null && licenseIsCurrent\(heldPayload, payload\)\)/,
  'the 304 branch must be licence-path only; a buyer has no held payload to compare',
);

// The licence path must be BYTE-FOR-BYTE unchanged in behaviour: a request
// carrying a licence is verified first, so adding this parameter cannot alter
// what an existing subscriber's app already does.
assert.match(
  refresh,
  /const sessionId = rawLicense === null \? sessionIdFromBody\(body\) : null;/,
  'a licence in the body always wins, so the established path is untouched',
);

// ONE ROW, BY A UNIQUE COLUMN. `stripe_session_id` is UNIQUE on fe_entitlements
// (20260613000000), which is what makes it a sound lookup key rather than a
// filter that could match several rows.
assert.match(
  read('supabase/migrations/20260613000000_create_fe_entitlements.sql'),
  /stripe_session_id\s+text UNIQUE/,
  'the buyer lookup key must be unique, or one id could resolve several licences',
);
assert.match(
  refresh,
  /query\.eq\("stripe_session_id", sessionId\)\.eq\("product", FLOW_PRODUCT\)/,
  'the buyer lookup is scoped to Flow, so an id cannot reach another product',
);

// 403 DOING DOUBLE DUTY is agreed by both lanes: on the buyer path it means
// "the webhook has not written the row yet", never "you did not buy this". The
// log line has to say which, or a later grep reads every poll as a failure.
assert.match(refresh, /flow-license-refresh not yet: no row for session/, 'a pre-webhook 403 logs as "not yet", not as a failure');

// ── MULTI-SEAT (contract 2026-08-22 13:05) ────────────────────────────────────
//
// The product lane ships a seat picker that sends `{plan, seats}` and does NOT
// clamp, deliberately: this lane owns the range so a bound baked into a
// notarized binary cannot go stale. Every guard below pins one half of a
// charge/licence pairing that fails SILENTLY when it breaks.

// THE FAILURE THIS WHOLE BLOCK EXISTS FOR: charging for N and licensing 1.
// `stripe-webhook` reads the count off the SESSION metadata, so a quantity
// without matching metadata takes the buyer's money and under-serves them
// without erroring anywhere.
assert.match(fn, /quantity: seats/, 'the line item is charged for the requested seats');
assert.match(
  fn,
  /metadata: \{ lookup_key: lookupKey, flow_claim_digest: digest, seats: String\(seats\) \}/,
  'seats MUST reach session metadata, or the webhook licenses 1 while Stripe charges N',
);
assert.doesNotMatch(fn, /line_items: \[\{ price: price\.id, quantity: 1 \}\]/, 'the quantity is never hardcoded');

// RENEWAL. A subscription renewal arrives as invoice.paid with no Checkout
// Session, so the subscription's own metadata is the only place the count
// survives. (The re-sign path reads fe_entitlements.seats, but mirroring keeps
// the Stripe object self-describing for the lifecycle webhooks.)
assert.match(
  fn,
  /subscription_data: \{ metadata: \{ lookup_key: lookupKey, seats: String\(seats\) \} \}/,
  'seats mirror onto the subscription so a renewal is not a single-seat licence',
);

// ONE DEFINITION OF THE RANGE. Reusing clampSeats keeps this endpoint and
// create-checkout-session from drifting into two different ceilings.
assert.match(fn, /clampSeats/, 'the seat range is the shared one, never a second local clamp');
assert.doesNotMatch(fn, /Math\.min\(\s*50|const MAX_SEATS = /, 'no second seat bound in this file');

// NEVER REJECT ON THE COUNT. An out-of-range or junk seat count clamps to a
// safe value; a buyer who mistypes a quantity meets a working checkout.
assert.doesNotMatch(fn, /seats[^\n]*corsHeaders,\s*4\d\d/, 'a bad seat count clamps, it does not refuse');

// BACKWARD COMPATIBLE. Flow builds that predate the picker send no `seats` at
// all, and must keep buying exactly one seat.
assert.match(fn, /raw === undefined \|\| raw === null\) return MIN_SEATS/, 'an absent seats field means one seat');

// THE FAMILY GATE. Only a subscription licence is seat-shaped. A perpetual
// licence's founding cap counts one purchases row per sale, so a quantity there
// would let a 5-seat order consume one of 25 founding seats.
assert.match(fn, /supportsMultipleSeats\(lookupKey\)/, 'seats are gated on the licence family');
assert.match(fn, /seatsAreSold \? seatsFromBody\(body\) : MIN_SEATS/, 'a non-seat plan can never carry a quantity');
