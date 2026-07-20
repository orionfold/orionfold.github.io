-- Relay Host issuer state. This is additive to the shared signed-license plane:
-- one private opaque licensee identity can receive renewal/replacement envelopes
-- without putting an email address into the signed ownership reference.

CREATE TABLE public.relay_licensees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  licensee_ref text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('organization', 'individual')),
  display_name text NOT NULL,
  email text NOT NULL UNIQUE CHECK (email = lower(btrim(email))),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.relay_licensees ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.relay_host_delivery_requests (
  id uuid PRIMARY KEY,
  request_hash text NOT NULL UNIQUE,
  email_window_hash text NOT NULL UNIQUE,
  ip_window_hash text NOT NULL UNIQUE,
  entitlement_id bigint REFERENCES public.fe_entitlements(id),
  status text NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'sent', 'suppressed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.relay_host_delivery_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fe_entitlements
  ADD COLUMN IF NOT EXISTS licensee_ref text REFERENCES public.relay_licensees(licensee_ref),
  ADD COLUMN IF NOT EXISTS licensee_kind text CHECK (licensee_kind IN ('organization', 'individual')),
  ADD COLUMN IF NOT EXISTS host_grant jsonb,
  ADD COLUMN IF NOT EXISTS updates_until timestamptz,
  ADD COLUMN IF NOT EXISTS replaces_license_id text REFERENCES public.fe_entitlements(license_id),
  ADD COLUMN IF NOT EXISTS stripe_invoice_id text,
  ADD COLUMN IF NOT EXISTS refund_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_fe_entitlements_stripe_invoice_id
  ON public.fe_entitlements (stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fe_entitlements_licensee_ref
  ON public.fe_entitlements (licensee_ref, created_at DESC);

CREATE SEQUENCE IF NOT EXISTS public.relay_host_license_seq START 1;

CREATE OR REPLACE FUNCTION public.next_relay_host_license_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'OF-RELAY-HOST-2026-' || lpad(nextval('public.relay_host_license_seq')::text, 4, '0');
$$;

REVOKE ALL ON FUNCTION public.next_relay_host_license_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_relay_host_license_id() TO service_role;

CREATE OR REPLACE FUNCTION public.resolve_relay_host_licensee(
  p_email text,
  p_kind text,
  p_display_name text
)
RETURNS TABLE (licensee_ref text, kind text, display_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(btrim(p_email));
BEGIN
  IF v_email = '' OR p_kind NOT IN ('organization', 'individual') OR btrim(p_display_name) = '' THEN
    RAISE EXCEPTION 'invalid Relay Host licensee';
  END IF;

  INSERT INTO public.relay_licensees (licensee_ref, kind, display_name, email)
  VALUES (
    'ofl_' || replace(gen_random_uuid()::text, '-', ''),
    p_kind,
    left(btrim(p_display_name), 100),
    v_email
  )
  ON CONFLICT (email) DO UPDATE
    SET updated_at = now()
  RETURNING relay_licensees.licensee_ref, relay_licensees.kind, relay_licensees.display_name
  INTO licensee_ref, kind, display_name;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_relay_host_licensee(text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_relay_host_licensee(text, text, text)
  TO service_role;
