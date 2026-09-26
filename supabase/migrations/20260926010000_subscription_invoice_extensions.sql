-- Make subscription renewals count once per invoice.
--
-- A renewal `invoice.paid` extends a subscription licence's expires_at on top of
-- the later of the current expiry and now (stripe-webhook
-- extendSubscriptionLicense). Nothing recorded which invoice had been applied,
-- so a Stripe re-delivery of the same event (for example after the database
-- write succeeded but the 2xx was lost), or a second handler during a webhook
-- cutover, would add the period twice: one payment, two periods. Found
-- 2026-09-26 (ops ledger 0027) before any real Flow subscriber existed.
--
-- The fix records each applied invoice id with a UNIQUE key and moves the
-- licence in the SAME transaction, through one function. A repeat of an invoice
-- already applied changes nothing and returns false. The two writes cannot come
-- apart: a crash cannot leave an invoice recorded without its extension, which
-- would lose a paid period on retry, nor an extension without its record.
CREATE TABLE IF NOT EXISTS public.subscription_invoice_extensions (
  invoice_id      text PRIMARY KEY,                    -- Stripe invoice id (in_…)
  entitlement_id  bigint NOT NULL REFERENCES public.fe_entitlements (id),
  expires_at      timestamptz NOT NULL,                -- the expiry this invoice set
  applied_at      timestamptz NOT NULL DEFAULT now()
);

-- Deny-all, same posture as fe_entitlements: only the service-role edge
-- functions reach this table, and only through the function below.
ALTER TABLE public.subscription_invoice_extensions ENABLE ROW LEVEL SECURITY;

-- Returns true when this call applied the invoice, false when it was already
-- applied (the repeat is then a no-op). SECURITY DEFINER with a pinned
-- search_path, EXECUTE revoked from anon/authenticated, like the licence-id
-- functions.
CREATE OR REPLACE FUNCTION public.apply_subscription_invoice_extension(
  p_invoice_id     text,
  p_entitlement_id bigint,
  p_expires_at     timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscription_invoice_extensions (invoice_id, entitlement_id, expires_at)
  VALUES (p_invoice_id, p_entitlement_id, p_expires_at)
  ON CONFLICT (invoice_id) DO NOTHING;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE public.fe_entitlements
     SET expires_at = p_expires_at,
         status     = 'active',
         updated_at = now()
   WHERE id = p_entitlement_id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_subscription_invoice_extension(text, bigint, timestamptz)
  FROM PUBLIC, anon, authenticated;
