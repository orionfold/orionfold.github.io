-- Make fe_entitlements product-neutral so it records issued licenses for BOTH
-- Arena Field Edition and Orionfold Proof (relay ask orionfold-proof 2026-06-24).
--
-- The table was created Arena-only (20260613000000): `edition` is NOT NULL and
-- `tier` defaults to 'field-edition'. Proof licenses have no edition concept and a
-- different tier, and the issued-license plane should record WHICH product was
-- sold (for CRM/lifecycle + a future product-aware entitlement-fetch). This:
--   1. adds a `product` column (NOT NULL, defaulting to the historical Arena value
--      so existing rows back-fill correctly), and
--   2. drops the NOT NULL on `edition` so a Proof row can leave it null.
-- The webhook writes the descriptor's product/tier/edition explicitly; the `tier`
-- default stays as a harmless fallback. Deny-all RLS posture is unchanged.

ALTER TABLE public.fe_entitlements
  ADD COLUMN IF NOT EXISTS product text NOT NULL DEFAULT 'arena-field-edition';

ALTER TABLE public.fe_entitlements
  ALTER COLUMN edition DROP NOT NULL;

-- Lifecycle/CRM queries increasingly filter by product (e.g. "all active Proof
-- entitlements"); index it alongside status.
CREATE INDEX IF NOT EXISTS idx_fe_entitlements_product
  ON public.fe_entitlements (product, status);
