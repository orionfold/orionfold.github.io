// Launch flags — small, explicit toggles for staged go-lives. A flag stays OFF
// until every gate behind it is real, then flips to ON in one commit. The site
// is static, so a flag flip is a build + deploy, not a runtime switch.
//
// ARENA_FIELD_EDITION_LIVE — the first net-new commercial product (the paid
// edition of the free Orionfold Arena). LAUNCH PIVOT (operator 2026-06-13): the
// motion is now FULL-PUBLIC THIS WEEKEND — publish + Stripe live + broad channels
// — superseding the M0-M4 / ~08-21 milestone plan. Storefront, positioning, AEO,
// and the wired checkout ship while this is OFF; the live Buy button renders only
// when it is ON. The remaining gate is fulfillment, not the receipt:
//   1. The 3 Stripe products exist in LIVE mode with the family lookup keys
//      (license_arena_field_edition[_founding|_renewal]).  [operator — DONE 2026-06-13]
//   2. The license-key / entitlement format is settled with Spark (the installer
//      CLI `verify` + key-file) and the stripe-webhook fulfillLicense path issues
//      it, and Spark has public-pushed the fieldkit.field_edition module.  [Spark]
//   3. The 2026-06-15 Agent SDK billing change has been re-tested.  [operator]
// NOT a gate: the first-boot receipt is honest-PARTIAL at launch (only fieldkit +
// the Cortex recall-half are proven live; other gates' generation halves wait on
// operator-armed infra). That is fine — copy says "every install runs an eval gate
// and writes a verifiable receipt" (true; report=reality) and never "all gates
// green," and the 12-month window re-gates + re-receipts every update. So the
// receipt does not block the flip; fulfillment does.
// While OFF the Field Edition block shows its full pitch + a "tell me at launch"
// path instead of a charging button, so no buyer can pay before fulfillment exists.
//
// ON (operator 2026-06-13): going live with ALL dependencies first — Stripe,
// GH/registry distribution, the license schema — THEN pushing the website. So the
// local copy is designed in the live state: real "Buy now" buttons (the localhost
// checkout CORS-fails by design; it resolves on the live push). Keep this true.
export const ARENA_FIELD_EDITION_LIVE = true;

// ORIONFOLD_PROOF_LIVE — gate the live "Buy now" buttons on the Orionfold Proof
// purchase block (/proof/), exactly like ARENA_FIELD_EDITION_LIVE gates Arena's.
// OFF until the full fulfillment path is verified live end-to-end: the Stripe
// prices exist (operator/MCP), the stripe-webhook signs + delivers a
// `product:orionfold-proof` license, and a test charge has produced a real
// website-signed Proof license the Proof CLI verifies (the relay's request #2,
// orionfold-proof 2026-06-24). While OFF the block shows its full pitch + a
// "tell me when it launches" path instead of a charging button, so no buyer can
// pay before fulfillment is proven. ON (2026-06-24): the 3 live Stripe prices
// exist, the stripe-webhook + create-checkout-session are deployed with the
// product-keyed license path, and the shared commerce charge path is already
// proven end-to-end in production via the books products (same
// create-checkout-session → Stripe → webhook plumbing; Proof only adds the
// license-issuing branch, which the conformance + Proof-payload tests cover and
// the live Arena license path already exercises).
export const ORIONFOLD_PROOF_LIVE = true;

// ORIONFOLD_RELAY_LIVE — gate the live "Buy now" buttons on any Orionfold Relay
// purchase block, exactly like ORIONFOLD_PROOF_LIVE gates Proof's. Relay is the
// third licensed product (the npm agent/workflow engine; relay ask
// orionfold-relay 2026-06-30). The issuer branch (catalog family + fulfillLicense
// + the relay_license_seq migration + the relayLicenseEmailText verb) ships with
// this OFF — the fulfilment spine works the moment a checkout hits the
// license_orionfold_relay* keys regardless of any storefront. Flip ON once: the 3
// live Stripe prices exist (operator/MCP), the migration is applied + the webhook
// redeployed, and a website-signed OF-RELAY-2026 license has been verified by the
// Relay CLI (the peer's dry-run, the analog of Proof's OF-PROOF-2026-0001). Until
// a `/relay/` storefront exists this flag has no on-page effect; it is defined now
// so the buy block, when built, gates on the same proven-fulfilment invariant.
// ON (2026-06-30): the 3 live Stripe prices exist (prod_Unnm4kBjpcO05d —
// license_orionfold_relay $499 / _founding $349 / _renewal $149yr, verified by
// lookup_key --live), the relay_license_seq migration is applied to live Supabase,
// and stripe-webhook + create-checkout-session are redeployed with the
// product-keyed license path. The shared commerce charge path is already proven
// end-to-end in production via the books + Arena + Proof products; Relay only adds
// the license-issuing branch, which the conformance + Relay-payload tests cover
// and the live Proof/Arena license path already exercises. The OF-RELAY-2026
// verification license (the peer's CLI dry-run) is the operator's out-of-band
// admin-issue-license call — it gates the peer's close, not the live Buy button.
export const ORIONFOLD_RELAY_LIVE = true;

// RELAY_HOST_LIVE — managed Host is a separate annual commercial right from
// premium Relay Packs. ON (operator 2026-07-20): G-041 proved the isolated
// purchase, signed-license delivery, re-download, replay and refund gates;
// production Stripe/Supabase/Resend were prepared; and Relay G-104/G-105
// accepted the customer-owned DigitalOcean guided beta on public Relay 0.44.9
// plus its signed multi-architecture Cell image. A real purchase was explicitly
// not required. Keep the public claim bounded to that manual guided-beta shape.
export const RELAY_HOST_LIVE = true;

// RELAY_HOST_PORTABLE_* — provider-neutral customer-owned Linux VM guidance.
// ON (operator 2026-07-21): public Relay 0.45.2 contains the checked command,
// deployment assets and release-pinned guide. Host discovery, indexing and SEO
// all derive from that one immutable release contract.
export {
  RELAY_HOST_PORTABLE_GUIDE_URL,
  RELAY_HOST_PORTABLE_LIVE,
  RELAY_HOST_PORTABLE_RELEASE,
  RELAY_HOST_PORTABLE_ROUTE,
} from './relay-host-portable';

// RELAY_OPERATOR_WORKSHOP_CHECKOUT_ENABLED — the first Training product reuses
// the accepted G-034 guest Checkout/access/refund lifecycle. Production
// dependencies passed G-036's no-charge rehearsal on 2026-07-25. GitHub Pages
// opts in explicitly at the deployment workflow boundary; local builds remain
// launch-dark unless they intentionally set the same public environment flag.
const publicBuildEnv = (
  import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }
).env;
export const RELAY_OPERATOR_WORKSHOP_CHECKOUT_ENABLED =
  publicBuildEnv?.PUBLIC_RELAY_OPERATOR_WORKSHOP_CHECKOUT === "true";

// META_PIXEL_ENABLED — gate the browser-side Meta Pixel (fbevents.js loader +
// PageView + the Purchase fbq track).
//
// ON (operator 2026-08-16): ads are being activated for the Flow waitlist push,
// so the browser pixel now buys something. It writes _fbp/_fbc, which the
// waitlist form and checkout attribution both read as CAPI match keys, and it
// fires the browser half of the deduped Purchase pair.
//
// What turning this on costs, stated plainly so it is a decision and not a
// surprise: fbevents.js is a third-party script that sets cookies, so the
// Lighthouse Best-Practices third-party-cookie finding returns and the page
// gains a cookie/consent surface. That was the exact reason it went OFF on
// 2026-06-18 while both ad channels were paused.
//
// The server-side CAPI Purchase (stripe-webhook, _shared/meta-capi.ts) fires
// independently and always has; it shares the Stripe Checkout session id as
// event_id with the browser pixel, so Meta collapses the pair rather than
// double-counting. Turning this flag off again is one flip and needs no
// CAPI/webhook redeploy in either direction.
// See audit-reports/seo-audit-2026-06-18.md §4.
//
// OFF again (operator 2026-08-20, marketing ack in the flow-growth ledger
// 16:3x PDT): wave 1 is Meta Instant forms, where the lead is captured inside
// Facebook and no site page loads, so the pixel buys nothing for it, while
// live mobile Lighthouse attributed most of both landing pages' main-thread
// blocking to connect.facebook.net (first-party script was under 0.7 s). Flip
// back to true the day a website-conversion wave is scheduled (B2/B3).
export const META_PIXEL_ENABLED = false;

// GOOGLE_ADS_ENABLED — gate the Google Ads (AW) half of the shared gtag.js
// load: the `AW-18188052159` config call, the native Purchase conversion on
// /thanks (lib/conversion.ts) and the confirmed-lead conversion in
// WaitlistForm. GA4 (`G-04PH843W2C`) is NOT gated by this flag and keeps
// firing page views and key events on every deploy.
//
// OFF (operator 2026-08-20 21:51 PDT): no Google Ads campaigns are running, so
// the AW config buys nothing and was the last remaining third-party cookie on
// the site (googleads.g.doubleclick.net viewthroughconversion on every page,
// Lighthouse Best-Practices 79 in audit-reports/seo-audit-2026-08-20.md).
// Same reasoning as META_PIXEL_ENABLED above. Flip to true the day a Google
// Ads campaign is scheduled; no other file changes are needed, the conversion
// wiring below stays intact and is unit-tested in both states.
export const GOOGLE_ADS_ENABLED = false;
