-- A6: attribution + consent provenance on the lead-capture table.
-- Additive + nullable (metadata defaults '{}') so existing rows and the still-live
-- old waitlist-signup function keep working during deploy. RLS stays deny-all;
-- only the service-role edge fn writes. Hybrid schema: typed columns for the
-- fields marketing reports on constantly (offer + 5 UTM + referrer); a JSONB
-- metadata overflow for the volatile long tail (new field = zero migration).
ALTER TABLE public.waitlist
  ADD COLUMN offer        text,
  ADD COLUMN utm_source   text,
  ADD COLUMN utm_medium   text,
  ADD COLUMN utm_campaign text,
  ADD COLUMN utm_term     text,
  ADD COLUMN utm_content  text,
  ADD COLUMN referrer     text,
  ADD COLUMN consent_text text,
  ADD COLUMN metadata     jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX idx_waitlist_offer    ON public.waitlist (offer)        WHERE offer IS NOT NULL;
CREATE INDEX idx_waitlist_campaign ON public.waitlist (utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX idx_waitlist_metadata ON public.waitlist USING gin (metadata jsonb_path_ops);
