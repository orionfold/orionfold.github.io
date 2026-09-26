-- Flow: the end of the period a subscriber has actually paid for (orionfold-flow,
-- ops 2026-09-25-2346, approved 2026-09-26 00:30). SET by each renewal, never
-- added to; read only by flow-license-refresh's licence path. Nullable: every
-- existing row and every non-Flow product leaves it null, and the refresh then
-- falls back to expires_at.
ALTER TABLE public.fe_entitlements
  ADD COLUMN IF NOT EXISTS paid_through timestamptz;
COMMENT ON COLUMN public.fe_entitlements.paid_through IS
  'Flow: end of the paid period, set (never added to) by each renewal; the refresh licence path states it.';
