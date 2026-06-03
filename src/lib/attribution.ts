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
// it reads clearly in the Stripe dashboard alongside the utm_* keys. `fbclid`
// is Meta's click id (the Meta Ads analogue of `gclid`).
const FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'v'] as const;

// Meta Pixel browser cookies — the CAPI match keys. `_fbp` identifies the
// browser; `_fbc` encodes the last fbclid. Captured alongside the URL params so
// the stripe-webhook's server-side CAPI Purchase can match the buyer even
// though the webhook never sees the buyer's browser. Best-effort: absent until
// the pixel has loaded at least once (or with cookies blocked), and CAPI then
// falls back to hashed-email matching.
function readMetaCookies(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (const part of document.cookie.split(';')) {
      const [name, ...rest] = part.trim().split('=');
      if (name === '_fbp' || name === '_fbc') out[name.slice(1)] = rest.join('=').slice(0, 200);
    }
  } catch {
    // cookie access can throw in exotic embeds — attribution stays best-effort.
  }
  return out;
}

/**
 * Capture any attribution params present in the current URL into sessionStorage
 * (per-tab, survives the Stripe redirect round-trip). Last-touch per field: a
 * fresh ad click updates the relevant keys, while navigating to a param-free
 * page leaves the prior capture intact. Safe to call on every page load.
 */
export function captureAttribution(): void {
  try {
    const params = new URLSearchParams(location.search);
    const found: Record<string, string> = readMetaCookies();
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

/**
 * Read the captured attribution (empty object if none / unavailable). The Meta
 * cookies are re-read fresh on every call: the pixel writes `_fbp`/`_fbc`
 * asynchronously AFTER page load, so a buyer who lands on a book page and buys
 * without another navigation would otherwise snapshot them before they exist.
 * By checkout-click time the pixel has settled, so the live read wins.
 */
export function getAttribution(): Record<string, string> {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}') as Record<string, string>;
    return { ...stored, ...readMetaCookies() };
  } catch {
    return readMetaCookies();
  }
}
