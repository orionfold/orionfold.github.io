// The Flow sandbox credential seam, guarded at the source level.
//
// Flow is tested end to end against the Stripe SANDBOX while books, sponsors,
// Relay and Proof keep running against the LIVE account. Supabase secrets are
// project-wide, so the naive approach — repoint STRIPE_SECRET_KEY at test mode —
// would stop live fulfilment for every other product: a real book buyer would
// pay and receive nothing. These assertions protect the properties that make the
// alternative safe.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

const webhook = read('supabase/functions/stripe-webhook/index.ts');
const checkout = read('supabase/functions/flow-checkout/index.ts');
const portal = read('supabase/functions/flow-billing-portal/index.ts');
const seam = read('supabase/functions/_shared/flow-stripe.ts');

// ── The seam falls back, so deploying ahead of the credential is a no-op ────
for (const [fn, shared] of [
  ['flowStripeSecretKey', 'STRIPE_SECRET_KEY'],
  ['flowWebhookSecret', 'STRIPE_WEBHOOK_SECRET'],
]) {
  const body = seam.slice(seam.indexOf(`export function ${fn}`));
  assert.match(
    body.slice(0, 400),
    new RegExp(`STRIPE_FLOW_[A-Z_]+[\\s\\S]{0,120}\\|\\|[\\s\\S]{0,80}${shared}`),
    `${fn} must prefer the Flow name and FALL BACK to ${shared}, so an unset Flow key changes nothing`,
  );
}

// ── The Flow endpoints read the seam, not the shared key directly ───────────
for (const [label, src] of [['flow-checkout', checkout], ['flow-billing-portal', portal]]) {
  assert.match(src, /flowStripeSecretKey\(\)/, `${label} builds its Stripe client from the Flow seam`);
  assert.doesNotMatch(
    src,
    /new Stripe\(\s*Deno\.env\.get\("STRIPE_SECRET_KEY"\)/,
    `${label} must not bind the shared live key directly — that is what pins Flow to live mode`,
  );
}

// ── The webhook accepts EITHER signing secret ───────────────────────────────
// A signature is not a claim: Stripe's HMAC is derived from the secret, so a
// live-account event cannot verify against the Flow secret or the reverse.
// Trying both widens which ACCOUNTS we accept; it never weakens what a verified
// signature proves.
assert.match(
  webhook,
  /const signingSecrets = \[\.\.\.new Set\(\[WEBHOOK_SECRET, FLOW_WEBHOOK_SECRET\]\.filter\(Boolean\)\)\]/,
  'the webhook tries both signing secrets, deduped, skipping unset ones',
);
assert.match(
  webhook,
  /if \(signingSecrets\.length === 0\)[\s\S]{0,160}status: 400/,
  'no configured secret must REFUSE, never fall through to an unverified event',
);
assert.match(
  webhook,
  /if \(!event\) \{[\s\S]{0,200}status: 400/,
  'an event that verified against NO secret is rejected',
);

// ── The API client follows the event's account ─────────────────────────────
// A test event answered with the live key 404s on every retrieve.
assert.match(
  webhook,
  /event\.livemode === false && flowStripe \? flowStripe : stripe/,
  'client selection keys off event.livemode, which Stripe signs into the event',
);
// The client is THREADED, never swapped on a module binding: two concurrent
// requests share one isolate, so a mutable module client could let a live event
// be handled with the test key. `const stripe` is what makes that impossible.
assert.match(webhook, /^const stripe = stripeClientFor\(/m, 'the live client binding is const, not let');
assert.doesNotMatch(webhook, /^let stripe\b/m, 'a reassignable module client would race across concurrent requests');
for (const handler of ['onCheckoutCompleted', 'onRefundChanged', 'onInvoicePaid', 'fulfillLicense']) {
  assert.match(
    webhook,
    new RegExp(`async function ${handler}\\([^)]*api: Stripe = stripe`),
    `${handler} takes the event's client explicitly`,
  );
}
// Every Stripe API call inside the handler chain must go through the threaded
// client. A stray `stripe.` call would silently use live credentials for a
// sandbox event.
const strayApiCalls = webhook
  .split('\n')
  .map((line, i) => [i + 1, line])
  .filter(([, line]) => /\bawait stripe\.(charges|subscriptions|checkout|prices|invoicePayments)\b/.test(line));
assert.deepEqual(
  strayApiCalls,
  [],
  `these lines call the live client inside a handler; use the threaded api: ${JSON.stringify(strayApiCalls)}`,
);

console.log('[flow-stripe-credential] Flow can run against the sandbox without moving any live rail');
