// Ad-attribution capture (Task 4 of MARKETING-HANDOFF.md). The ad URLs land on
// orionfold.com carrying utm_* + a `v=` cache-buster (and Google's `gclid`).
// Those query params DIE the moment the buyer is redirected to hosted Stripe
// Checkout — so we capture them on the landing page and carry them, via
// startCheckout, into the Stripe Checkout Session `metadata` server-side. That
// makes a purchase round-trip to the exact ad initiative even if the pixel /
// GA4 tagging is incomplete, and seeds the future Stripe revenue reader in the
// marketing/ repo. The site stays static; this is the only client-side state.

const STORAGE_KEY = 'of_attribution';

// The allowlist of params we persist. Stripe metadata keys are ≤40 chars and
// values ≤500 chars; these are well within that. `v` is stored under `ad_v` so
// it reads clearly in the Stripe dashboard alongside the utm_* keys.
const FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'v'] as const;

/**
 * Capture any attribution params present in the current URL into sessionStorage
 * (per-tab, survives the Stripe redirect round-trip). Last-touch per field: a
 * fresh ad click updates the relevant keys, while navigating to a param-free
 * page leaves the prior capture intact. Safe to call on every page load.
 */
export function captureAttribution(): void {
  try {
    const params = new URLSearchParams(location.search);
    const found: Record<string, string> = {};
    for (const field of FIELDS) {
      const raw = params.get(field);
      if (raw) found[field] = raw.slice(0, 200);
    }
    if (Object.keys(found).length === 0) return;
    const merged = { ...getAttribution(), ...found };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // sessionStorage can throw in private/blocked contexts — attribution is a
    // best-effort signal, never a hard dependency of checkout.
  }
}

/** Read the captured attribution (empty object if none / unavailable). */
export function getAttribution(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
}
