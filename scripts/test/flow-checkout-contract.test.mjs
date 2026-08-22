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
