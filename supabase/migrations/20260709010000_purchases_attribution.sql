-- WS#16-P1: ad attribution on the purchases table so a paid SALE round-trips to
-- the exact ad tranche that drove it (marketing relay #13, 2026-07-09).
--
-- The UTMs are already captured on the landing page (src/lib/attribution.ts),
-- forwarded into the Checkout Session metadata by create-checkout-session, and
-- delivered to the webhook on `session.metadata`. What was missing: the webhook
-- dropped them, and the purchases table had nowhere to hold them. This adds the
-- typed columns marketing reports on (5 UTM + gclid), matching the waitlist
-- attribution shape (20260626000000). purchases-export then surfaces them.
--
-- Additive + nullable so existing rows and an in-flight deploy keep working; RLS
-- stays deny-all (only the service-role stripe-webhook writes). Meta cookies
-- (fbp/fbc/fbclid) already flow to CAPI off session.metadata and are NOT
-- persisted here — this table is the marketing attribution join, not an ad-cookie
-- store.
ALTER TABLE public.purchases
  ADD COLUMN utm_source   text,
  ADD COLUMN utm_medium   text,
  ADD COLUMN utm_campaign text,
  ADD COLUMN utm_term     text,
  ADD COLUMN utm_content  text,
  ADD COLUMN gclid        text;

CREATE INDEX idx_purchases_campaign ON public.purchases (utm_campaign) WHERE utm_campaign IS NOT NULL;
