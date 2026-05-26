-- Commerce schema (C3) — book purchases, sponsor subscriptions, custom enquiries.
-- Additive only: the live `waitlist` table + funnel are never touched.
--
-- Every table follows the waitlist idiom: RLS enabled with NO policies = deny-all
-- for anon/authenticated. The edge functions use the service-role key, which
-- bypasses RLS. No client ever reads or writes these tables directly.

-- ---------------------------------------------------------------------------
-- purchases — one-time book orders + delivery tracking.
-- The Stripe Checkout Session id is unique so webhook re-delivery is idempotent
-- (a replayed `checkout.session.completed` upserts to the same row, no double-send).
-- ---------------------------------------------------------------------------
CREATE TABLE public.purchases (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stripe_session_id  text NOT NULL UNIQUE,
  stripe_customer_id text,
  lookup_key         text NOT NULL,            -- e.g. book_ai_native_business
  email              text NOT NULL,
  amount_total       integer,                  -- cents, as charged
  currency           text,
  roadmap_item       text,                     -- roadmap item the buy started from, if any
  delivered          boolean NOT NULL DEFAULT false,
  delivered_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchases_email ON public.purchases (email, created_at DESC);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- sponsors — recurring subscription state.
-- The subscription id is unique so lifecycle events
-- (invoice.paid / payment_failed, customer.subscription.updated/deleted)
-- update the one row idempotently.
-- ---------------------------------------------------------------------------
CREATE TABLE public.sponsors (
  id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stripe_customer_id     text NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  email                  text,
  tier                   text,                  -- bronze | silver | gold | platinum
  lookup_key             text,                  -- e.g. sponsor_gold
  status                 text NOT NULL DEFAULT 'active', -- active | past_due | canceled
  active                 boolean NOT NULL DEFAULT true,  -- gate sponsor benefits on this
  roadmap_item           text,
  current_period_end     timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sponsors_customer ON public.sponsors (stripe_customer_id);
CREATE INDEX idx_sponsors_active ON public.sponsors (active, tier);

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- enquiries — custom project briefs from the roadmap selection drawer.
-- The table lives here (C3 owns the commerce migration); the `enquiry-submit`
-- edge function that writes to it is built in R2.
-- ---------------------------------------------------------------------------
CREATE TABLE public.enquiries (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name           text,
  company        text,
  email          text NOT NULL,
  description    text,
  selected_items jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{id,label}] picked on /roadmap
  ip_address     text,
  user_agent     text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_enquiries_created ON public.enquiries (created_at DESC);

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- book-files — PRIVATE bucket holding the paid PDF + EPUB per book.
-- Layout convention: book-files/<lookup_key>/<anything>.{pdf,epub}
--   e.g. book-files/book_ai_native_business/ai-native-business.pdf
-- The webhook lists the per-book folder and signs each file, so exact
-- filenames don't matter. Private = no public URL; downloads are time-limited
-- signed URLs generated server-side with the service role.
-- storage.objects has no policy for this bucket = deny-all for anon (service role bypasses).
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-files', 'book-files', false)
ON CONFLICT (id) DO NOTHING;
