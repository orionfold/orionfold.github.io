-- Relay T-30 renewal reminder (PLG-4a Website half). One nullable timestamp marks
-- that the T-30 renewal-value-recap email was sent for this license year, so the
-- daily renewal-reminder edge fn sends exactly once. Distinct from delivered_at
-- (which tracks the FULFILMENT email); reusing that would either break fulfilment
-- tracking or re-send the reminder daily. Additive, no backfill: existing rows are
-- NULL = not yet reminded, which is correct (they enter the window on their own dates).
ALTER TABLE public.fe_entitlements
  ADD COLUMN IF NOT EXISTS renewal_reminded_at timestamptz;
