// meta-capi — server-side Meta Conversions API "Purchase" sender.
//
// The browser Pixel under-reports ~30-40% on iOS (ATT) and with blockers; CAPI
// recovers those by sending the same conversion server-side from the
// stripe-webhook, where payment is already verified. Dedup contract: the
// event_id here is the Stripe Checkout session id, the SAME id the browser
// Pixel sends as eventID from /thanks (src/lib/conversion.ts) — Meta collapses
// the pair into one conversion.
//
// Match keys, best-effort in this order: hashed email (always present on a
// fulfilled book), fbp/fbc browser cookies round-tripped through the Checkout
// Session metadata (src/lib/attribution.ts → create-checkout-session).
//
// Config via Supabase secrets (function env):
//   META_PIXEL_ID          — same id as src/data/meta.ts (public)
//   META_CAPI_ACCESS_TOKEN — Events Manager → Settings → Conversions API token (SECRET)
// Both unset → sendMetaPurchase is a silent no-op, so this ships safely ahead
// of the Events Manager setup. Failures are logged, never thrown: ad
// attribution must never break fulfillment.

const GRAPH_VERSION = "v21.0";

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface MetaPurchase {
  /** Stripe Checkout session id — dedup event_id shared with the browser Pixel. */
  eventId: string;
  /** Buyer email (hashed before send; never sent raw). */
  email: string | null;
  /** Order total in cents (Stripe's amount_total). */
  amountCents: number | null;
  /** ISO currency (e.g. "usd"). */
  currency: string | null;
  /** Catalog lookup key (content_ids entry). */
  lookupKey: string | null;
  /** Meta browser-id cookie, from session metadata (may be absent). */
  fbp?: string | null;
  /** Meta click-id cookie, from session metadata (may be absent). */
  fbc?: string | null;
  /** Raw fbclid URL param, from session metadata — fbc fallback when the cookie was blocked. */
  fbclid?: string | null;
  /** Page that started checkout, for event_source_url. */
  sourceUrl?: string;
}

/** Fire-and-forget CAPI Purchase. Never throws; logs and returns on any issue. */
export async function sendMetaPurchase(p: MetaPurchase): Promise<void> {
  const pixelId = Deno.env.get("META_PIXEL_ID") ?? "";
  const token = Deno.env.get("META_CAPI_ACCESS_TOKEN") ?? "";
  if (!pixelId || !token) return; // not configured yet — silent no-op

  try {
    const userData: Record<string, unknown> = {};
    if (p.email) userData.em = [await sha256Hex(p.email.trim().toLowerCase())];
    if (p.fbp) userData.fbp = p.fbp;
    // fbc, or Meta's documented fallback when the cookie was blocked but the
    // landing URL carried an fbclid: fb.1.<observed-ms>.<fbclid>. This is what
    // preserves click-level ad attribution for the cookie-blocked buyers CAPI
    // exists to recover.
    const fbc = p.fbc || (p.fbclid ? `fb.1.${Date.now()}.${p.fbclid}` : null);
    if (fbc) userData.fbc = fbc;
    if (Object.keys(userData).length === 0) {
      console.log("meta-capi: no match keys for", p.eventId, "— skipped");
      return;
    }

    const body = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: p.eventId,
          action_source: "website",
          event_source_url: p.sourceUrl ?? "https://orionfold.com/thanks",
          user_data: userData,
          custom_data: {
            value: typeof p.amountCents === "number" ? p.amountCents / 100 : undefined,
            currency: (p.currency ?? "USD").toUpperCase(),
            content_ids: p.lookupKey ? [p.lookupKey] : undefined,
            content_type: "product",
          },
        },
      ],
    };

    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      console.error("meta-capi: Graph API", res.status, await res.text());
    }
  } catch (err) {
    console.error("meta-capi: send failed for", p.eventId, err);
  }
}
