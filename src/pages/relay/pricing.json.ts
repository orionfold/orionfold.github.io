// /relay/pricing.json — the machine-readable pricing source for Orionfold Relay
// (relay ask _RELAY later-12, operator decision 2026-07-02: canon lives on
// orionfold.com). The 2026-07-02 ruling permits Relay to do a READ-ONLY pull of
// canonical Orionfold sources (bare GET, no identifying payload, fail-open
// offline), so a Relay release can use this — at minimum as a release-gate drift
// check against its pack.yaml price — and the $349-vs-$499 contradiction class
// (Relay F3/#20) can never recur.
//
// Drift-proof by construction: this endpoint imports the SAME catalog objects
// the /relay/ buy buttons render from (RELAY in commerce.ts, which reads the
// server catalog SSOT), so the page and this JSON are emitted from one source
// in one build. Amounts are display-only (Stripe resolves the real charge
// server-side by lookup_key); the lookup keys here name the exact SKUs.
import type { APIRoute } from 'astro';
import { RELAY, formatUsd } from '../../data/commerce';
import { ORIONFOLD_RELAY_LIVE } from '../../data/launch';

export const prerender = true;

export const GET: APIRoute = () => {
  const price = (item: typeof RELAY.primary) => ({
    lookup_key: item.lookupKey,
    label: item.label,
    /** USD cents, matching the Stripe display convention. */
    amount: item.amount,
    display: formatUsd(item.amount),
  });

  const pricing = {
    schema: 'orionfold.pricing/v1',
    product: 'orionfold-relay',
    canonical_url: 'https://orionfold.com/relay/pricing.json',
    purchase_url: 'https://orionfold.com/relay/',
    currency: 'usd',
    /** Mirrors the ORIONFOLD_RELAY_LIVE launch flag: live Buy buttons are on. */
    live: ORIONFOLD_RELAY_LIVE,
    /** The kept-proven window a license covers, in months. */
    term_months: RELAY.windowMonths,
    prices: {
      /** Founding intro price, count-boxed to the first N licenses. */
      founding: { ...price(RELAY.founding), per: 'year' },
      /** Standard list price after the founding seats are gone. */
      list: { ...price(RELAY.primary), per: 'year' },
      /** Optional renewal after the first year. */
      renewal: { ...price(RELAY.renewal), per: 'year' },
    },
    founding_window: {
      /** 'open' = the storefront is still selling the founding price. */
      state: 'open',
      seats_cap: RELAY.foundingSeats,
      /**
       * The cap is enforced server-side at checkout (the N+1th founding request
       * falls back to the list price), so 'open' here describes the storefront,
       * not a live seat count.
       */
      enforcement: 'server-side at checkout',
    },
    /** Build timestamp — lets a consumer judge staleness. */
    generated_at: new Date().toISOString(),
  };

  return new Response(JSON.stringify(pricing, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
