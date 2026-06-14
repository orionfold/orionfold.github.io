// Conversion reporting for the post-checkout /thanks pages (Tasks 1–3 of
// MARKETING-HANDOFF.md). The site holds no Stripe key, so the ONLY moment the
// browser learns a purchase happened is the thanks page, after order-status
// confirms it. Everything fires here, keyed by the Stripe session id.
//
//   • GA4 `purchase` event (Task 3) — ALL paid kinds (books, sponsors, licenses);
//     drives ecommerce revenue + audiences
//   • Native Google Ads "Purchase" conversion (Task 1) — books AND Arena licenses
//     (value-based); skipped for sponsors. NOTE: both currently use the one
//     GOOGLE_ADS_PURCHASE_SEND_TO action — if Arena gets its own ad campaign, give
//     it a dedicated conversion action so license value never skews book bidding.
//   • Enhanced Conversions (Task 2) — hashed (SHA-256) buyer email set before
//     the Ads conversion fires, recovering cookie-lost conversions. Takes effect
//     once the operator enables Enhanced Conversions in the Google Ads UI;
//     sending user_data while it's off is harmless.
//
// Values arrive from order-status as the real Stripe amount (cents) → converted
// to major units here, as Google expects (e.g. 50.0, not 5000).

import { GOOGLE_ADS_PURCHASE_SEND_TO } from '../data/ads';

// Delegate to the global gtag shim installed in Layout.astro (it pushes the raw
// `arguments` object to dataLayer, which gtag.js requires — do NOT reimplement
// it with a plain array push, which gtag.js will not process).
function gtag(...args: unknown[]): void {
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  if (typeof w.gtag === 'function') w.gtag(...args);
}

// Delegate to the Meta Pixel installed in Layout.astro (renders only when
// META_PIXEL_ID is set in src/data/meta.ts) — a no-op until then.
function fbq(...args: unknown[]): void {
  const w = window as unknown as { fbq?: (...a: unknown[]) => void };
  if (typeof w.fbq === 'function') w.fbq(...args);
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Per-tab dedup so a refresh of /thanks?session_id=… doesn't double-count.
function claimOnce(transactionId: string): boolean {
  try {
    const KEY = 'of_conv_fired';
    const seen = JSON.parse(sessionStorage.getItem(KEY) || '[]') as string[];
    if (seen.includes(transactionId)) return false;
    seen.push(transactionId);
    sessionStorage.setItem(KEY, JSON.stringify(seen.slice(-20)));
    return true;
  } catch {
    return true; // storage blocked → fire (better a rare double than silence)
  }
}

export interface PurchaseConversion {
  /** Stripe Checkout session id — the dedup `transaction_id`. */
  transactionId: string;
  /** Order total in MAJOR units (e.g. 50.0). null if unknown. */
  value: number | null;
  /** ISO currency, uppercased (e.g. "USD"). */
  currency: string | null;
  /** Catalog lookup key (GA4 item_id). */
  itemId: string | null;
  /** Human label (GA4 item_name). */
  itemName: string | null;
  /** Buyer email for Enhanced Conversions (hashed before send; never sent raw). */
  email: string | null;
  /** Catalog kind — gates which ad-platform conversions fire (see reportPurchase). */
  kind: 'book' | 'sponsor' | 'license';
}

/**
 * Fire the GA4 purchase event and, for value-based kinds (books + Arena licenses),
 * the native Google Ads conversion (with hashed-email Enhanced Conversions) and the
 * Meta Pixel Purchase. Sponsors fire GA4 only. Idempotent per transaction id.
 */
export async function reportPurchase(c: PurchaseConversion): Promise<void> {
  if (!claimOnce(c.transactionId)) return;

  const value = typeof c.value === 'number' ? c.value : undefined;
  const currency = c.currency || 'USD';

  // Books and licenses are value-based purchases that feed the ad platforms;
  // sponsors are recurring support and stay GA4-only.
  const fireAdConversions = c.kind === 'book' || c.kind === 'license';

  // Task 3 — GA4 purchase (marked as a key event in GA4; powers audiences and
  // the GA4↔Ads assisted-conversion link the operator wires).
  gtag('event', 'purchase', {
    transaction_id: c.transactionId,
    value,
    currency,
    items: c.itemId ? [{ item_id: c.itemId, item_name: c.itemName || undefined }] : undefined,
  });

  // Tasks 1 + 2 — native Google Ads conversion + Enhanced Conversions (books + licenses).
  if (fireAdConversions && GOOGLE_ADS_PURCHASE_SEND_TO) {
    if (c.email) {
      try {
        const hashed = await sha256Hex(c.email.trim().toLowerCase());
        gtag('set', 'user_data', { sha256_email_address: hashed });
      } catch {
        // Web Crypto unavailable (non-HTTPS) → skip EC, still fire the conversion.
      }
    }
    gtag('event', 'conversion', {
      send_to: GOOGLE_ADS_PURCHASE_SEND_TO,
      value,
      currency,
      transaction_id: c.transactionId,
    });
  }

  // Meta Pixel Purchase (books + licenses) — the browser half of the Meta
  // conversion. The eventID is the Stripe session id, the SAME id the stripe-webhook
  // sends server-side via CAPI, so Meta dedupes the pair into one conversion
  // (browser event wins when both arrive; CAPI recovers the iOS/blocked cases).
  if (fireAdConversions) {
    // The pixel is loaded lazily for perf (see Layout.astro). Force it now so the
    // browser Purchase + its eventID actually fire on the conversion page, even
    // if the visitor never triggered the idle/interaction load. The fbq stub
    // queues this track call and flushes it once fbevents.js arrives.
    (window as unknown as { __ofLoadMetaPixel?: () => void }).__ofLoadMetaPixel?.();
    fbq('track', 'Purchase', {
      value,
      currency,
      content_ids: c.itemId ? [c.itemId] : undefined,
      content_type: 'product',
    }, { eventID: c.transactionId });
  }
}
