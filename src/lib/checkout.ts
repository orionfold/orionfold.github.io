// Client-side checkout helpers (C4). The site stays fully static: the browser
// holds NO Stripe key. To buy a book or start a sponsorship, we POST a
// server-trusted lookup key to the `create-checkout-session` edge function and
// redirect to the hosted Stripe Checkout URL it returns. The same pattern opens
// the Billing Portal and reads order status.
//
// These are imported into Astro `<script>` blocks (bundled to the client).
//
// Dev gotcha: the edge functions' CORS allowlist is https://orionfold.com only
// (same as the live waitlist). So every call here CORS-FAILS on localhost — the
// UI + wiring verify locally, but the real checkout/portal test is a live-domain
// step (L1, in Stripe TEST mode). A localhost network error is expected, not a bug.

import { getAttribution } from "./attribution";

const FUNCTIONS_BASE = "https://orionfold.supabase.co/functions/v1";

interface PostResult {
  ok: boolean;
  status: number;
  data: Record<string, unknown>;
}

async function postJson(fn: string, payload: Record<string, unknown>): Promise<PostResult> {
  try {
    const res = await fetch(`${FUNCTIONS_BASE}/${fn}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, data };
  } catch {
    // Network/CORS rejection (e.g. on localhost) — surface a friendly message
    // rather than the raw "Failed to fetch".
    return { ok: false, status: 0, data: { error: "Could not connect. Please try again." } };
  }
}

/**
 * Start a hosted Checkout for a book (one-time) or sponsor tier (subscription).
 * On success the browser is redirected to Stripe and this never returns; on
 * failure it throws with a friendly message for the caller to surface.
 */
export async function startCheckout(
  lookupKey: string,
  itemId?: string,
  itemIds?: string[],
): Promise<void> {
  const payload: Record<string, unknown> = { lookupKey };
  if (itemId) payload.itemId = itemId;
  if (itemIds && itemIds.length) payload.itemIds = itemIds;
  // Carry any captured ad attribution (utm_* / gclid / v) into the Stripe
  // session metadata — the durable ad→purchase join key (Task 4).
  const attribution = getAttribution();
  if (Object.keys(attribution).length) payload.attribution = attribution;
  const { ok, data } = await postJson("create-checkout-session", payload);
  if (ok && typeof data.url === "string") {
    window.location.assign(data.url);
    return;
  }
  throw new Error((data.error as string) || "Could not start checkout. Please try again.");
}

/** Open the Billing Portal for a just-paid sponsor (proof = the Checkout session id). */
export async function openPortalBySession(sessionId: string): Promise<void> {
  const { ok, data } = await postJson("customer-portal", { sessionId });
  if (ok && typeof data.url === "string") {
    window.location.assign(data.url);
    return;
  }
  throw new Error((data.error as string) || "Could not open the portal. Please try again.");
}

/**
 * Ask for a Billing Portal link by email (returning sponsors). The link is
 * EMAILED, never returned, so this resolves to a generic confirmation message
 * whether or not the email is a customer (no enumeration).
 */
export async function requestPortalByEmail(email: string): Promise<string> {
  const { ok, data } = await postJson("customer-portal", { email });
  if (!ok) throw new Error((data.error as string) || "Could not send the link. Please try again.");
  return (data.message as string) || "If that email has a sponsorship, we just sent a link to manage it.";
}

export interface OrderStatus {
  ok: boolean;
  paid: boolean;
  mode: "payment" | "subscription";
  kind: "book" | "sponsor";
  label: string | null;
  tier: string | null;
  email: string | null;
  /** Catalog lookup key (GA4 item_id). */
  lookupKey: string | null;
  /** Order total in cents from the real Stripe session (null if unavailable). */
  amount: number | null;
  /** ISO currency, e.g. "usd" (null if unavailable). */
  currency: string | null;
}

/** Read-only confirmation for the /thanks pages. Returns null if the session is unknown. */
export async function fetchOrderStatus(sessionId: string): Promise<OrderStatus | null> {
  const { ok, data } = await postJson("order-status", { sessionId });
  if (!ok || !data.ok) return null;
  return data as unknown as OrderStatus;
}

/**
 * Wire every <button data-checkout="<lookupKey>"> in `root` to startCheckout.
 * Optional attributes: data-item="<roadmap item id>" (single) and/or
 * data-items="<id,id,id>" (a comma-joined selection) carried into Stripe
 * metadata, plus data-error-target="<element id>" (where to show a failure).
 * Idempotent — safe to call again after astro:after-swap.
 */
export function wireCheckoutButtons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLButtonElement>("[data-checkout]").forEach((btn) => {
    if (btn.dataset.checkoutWired) return;
    btn.dataset.checkoutWired = "1";

    btn.addEventListener("click", async () => {
      const lookupKey = btn.dataset.checkout!;
      const itemId = btn.dataset.item || undefined;
      const itemIds = btn.dataset.items
        ? btn.dataset.items.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;
      const errEl = btn.dataset.errorTarget ? document.getElementById(btn.dataset.errorTarget) : null;
      if (errEl) {
        errEl.textContent = "";
        errEl.hidden = true;
      }
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");

      try {
        await startCheckout(lookupKey, itemId, itemIds);
        // Success → the browser is redirecting; leave the button disabled.
      } catch (err) {
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
        const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        if (errEl) {
          errEl.textContent = msg;
          errEl.hidden = false;
        }
      }
    });
  });
}
