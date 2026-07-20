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

// RELAY_OPERATOR_WORKSHOP_CHECKOUT_ENABLED — the first Training product reuses
// the accepted G-034 guest Checkout/access/refund lifecycle. Production stays
// launch-dark until G-036. An isolated local/staging build opts in explicitly;
// there is no source edit or accidental live default to flip.
const publicBuildEnv = (
  import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }
).env;
export const RELAY_OPERATOR_WORKSHOP_CHECKOUT_ENABLED =
  publicBuildEnv?.PUBLIC_RELAY_OPERATOR_WORKSHOP_CHECKOUT === "true";

// META_PIXEL_ENABLED — gate the browser-side Meta Pixel (fbevents.js loader +
// PageView + the Purchase fbq track). OFF (operator 2026-06-18): BOTH Meta Ads
// and Google Ads are paused, so the browser pixel buys nothing and is pure cost
// — it is the cause of the Lighthouse Best-Practices third-party-cookie hit and a
// cookie/consent surface. While OFF, fbevents.js never loads and no _fbp/_fbc
// cookies are set (Layout.astro gates the loader on this flag; the
// window.__ofLoadMetaPixel hook stays undefined and lib/conversion.ts already
// no-ops safely via ?.()). The server-side CAPI Purchase (stripe-webhook) is
// untouched and still fires its eventID, so the browser↔CAPI dedup pair is
// preserved — re-enabling is ONE flip back to true when a Meta campaign resumes.
// (No CAPI/webhook redeploy needed either way.) See audit-reports/seo-audit-2026-06-18.md §4.
export const META_PIXEL_ENABLED = false;
