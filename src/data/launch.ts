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
