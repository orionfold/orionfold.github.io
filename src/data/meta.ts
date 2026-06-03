// Meta (Facebook) Pixel config — companion to the Google tag config in
// src/data/ads.ts. Created for the 2026-Q2 Meta Ads book test
// (marketing/ads/2026-Q2-meta-books-coldstart.md).
//
// This is a PUBLIC client-side identifier (same trust level as the GA4
// measurement id) — safe to ship in the static bundle. While it is empty the
// Layout.astro snippet renders nothing and the fbq() calls in lib/conversion.ts
// are no-ops, so this file can deploy ahead of the Events Manager setup.

/**
 * The Meta Pixel ID (Events Manager → Data Sources → your pixel). Leave empty
 * until the pixel is created; set it once and both the base PageView snippet
 * and the Purchase event light up.
 */
export const META_PIXEL_ID = '1537752861027449';
