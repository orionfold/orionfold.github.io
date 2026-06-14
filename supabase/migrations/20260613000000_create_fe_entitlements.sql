-- Arena Field Edition license entitlements (license-fulfillment Phase 2, task 1c).
-- The lifecycle-truth CRM record for an issued orionfold.license/v1 file:
-- license_id <-> stripe subscription <-> status <-> term <-> token_ref. This is
-- the ENTITLEMENT plane of arena-field-edition-license-workflow-v1.md §2 —
-- Supabase owns commerce/revocation, the signed license file is the offline
-- bridge, GHCR/weights are never in this table.
--
-- Complementary to `purchases`, not a replacement: `purchases` is the raw Stripe
-- sale (what fulfillLicense already records today, delivered=false);
-- `fe_entitlements` is the ISSUED license — the row `fulfillLicense`'s sign+store
-- body (task 1d, gated on OPEN-1) will upsert and `entitlement-fetch` will read
-- to mint revocable signed URLs.
--
-- Same security idiom as the commerce schema: RLS enabled with NO policies =
-- deny-all for anon/authenticated. Only the service-role edge functions touch it.

-- Gap-free, monotonic license ids — OF-FE-2026-NNNN is sourced from this so the
-- id is stable + unique (it rides in the SIGNED payload and in the GHCR
-- username `of-license-<license_id>`). Schema-stable regardless of OPEN-1.
CREATE SEQUENCE IF NOT EXISTS public.fe_license_seq START 1;

CREATE TABLE public.fe_entitlements (
  id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- The license identity (signed claim + GHCR username root).
  license_id             text NOT NULL UNIQUE,             -- OF-FE-2026-NNNN
  key_id                 text NOT NULL,                    -- signing key, e.g. of-license-prod-2026 (rotation-aware)
  edition                text NOT NULL,                    -- founding-25 | standard (soft known-set)
  tier                   text NOT NULL DEFAULT 'field-edition',
  seats                  integer NOT NULL DEFAULT 1,
  -- Who it was issued to (from the Checkout customer details).
  email                  text NOT NULL,
  issued_to_name         text,
  issued_to_org          text,
  -- Stripe provenance. The issuing Checkout session is unique so webhook
  -- re-delivery is idempotent (one license per checkout, never double-issued);
  -- subscription id is set only for the renewal SKU.
  stripe_session_id      text UNIQUE,
  stripe_customer_id     text,
  stripe_subscription_id text,
  stripe_price_id        text,
  -- Lifecycle. status drives revocation: active -> past_due/canceled/revoked
  -- flips here (billing-driven) and entitlement-fetch then mints no fresh URL.
  status                 text NOT NULL DEFAULT 'active',   -- active | past_due | canceled | revoked
  -- Term — the 12-month kept-proven window enforced offline by load_license().
  issued_at              timestamptz,
  not_before             timestamptz,
  expires_at             timestamptz,
  -- OPEN-1-DEPENDENT (the only column that hinges on the operator's call):
  -- under the v1-shipped private-images + GHCR-token DRM this references the
  -- bound pull token (a reference/ref, never the secret itself); under the
  -- public-images + weights-as-moat path it stays NULL. Nullable so the table
  -- ships before OPEN-1 lands.
  token_ref              text,
  -- Delivery tracking (mirrors purchases): the signed file + setup email.
  delivered              boolean NOT NULL DEFAULT false,
  delivered_at           timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fe_entitlements_email ON public.fe_entitlements (email, created_at DESC);
CREATE INDEX idx_fe_entitlements_status ON public.fe_entitlements (status, expires_at);
CREATE INDEX idx_fe_entitlements_customer ON public.fe_entitlements (stripe_customer_id);
CREATE INDEX idx_fe_entitlements_subscription ON public.fe_entitlements (stripe_subscription_id);

ALTER TABLE public.fe_entitlements ENABLE ROW LEVEL SECURITY;
