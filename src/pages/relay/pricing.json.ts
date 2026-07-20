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
import { buildRelayPricing } from '../../data/relay-pricing';

export const prerender = true;

export const GET: APIRoute = () => {
  const pricing = buildRelayPricing();

  return new Response(JSON.stringify(pricing, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
