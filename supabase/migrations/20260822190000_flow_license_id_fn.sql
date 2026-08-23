-- next_flow_license_id() — the one server-callable way to draw an Orionfold Flow
-- license id (OF-FLOW-2026-NNNN).
--
-- Flow is the fourth licensed product, and the FIRST subscription-shaped one: a
-- Flow license is never re-issued per cycle, so this sequence is drawn once at
-- the first purchase and every renewal extends that same license's expires_at.
-- Renewals therefore do NOT burn ids, unlike a perpetual SKU's repurchase.
--
-- It gets its OWN sequence so its ids are product-distinct and customer-facing
-- clear ("OF-FLOW-…" reads as a Flow license), independent of fe_license_seq,
-- proof_license_seq and relay_license_seq. Same posture as
-- next_relay_license_id (20260630000000): supabase-js cannot call nextval()
-- directly (PostgREST exposes functions, not raw SQL), so fulfillLicense draws
-- its id via supabase.rpc('next_flow_license_id'). Monotonic, not gap-free under
-- rollback (a webhook that draws an id then fails before INSERT skips that
-- number) — gaps are harmless for an opaque license id.
--
-- WHY THIS EXISTS AT ALL, recorded because its absence was a live launch bug:
-- stripe-webhook maps product -> sequence explicitly and THROWS on an unmapped
-- product rather than silently minting Arena ids. Flow shipped with a catalog
-- descriptor and a checkout path but no sequence, so a completed Flow purchase
-- would have thrown at fulfilment, 500'd the webhook, and left the buyer polling
-- 403 forever while Stripe retried. Found 2026-08-22 before the first real
-- purchase.
CREATE SEQUENCE IF NOT EXISTS public.flow_license_seq START 1;

-- SECURITY DEFINER + a pinned search_path so it runs with the owner's rights and
-- cannot be hijacked by a caller's search_path. EXECUTE revoked from
-- anon/authenticated (deny-all, same posture as fe_entitlements' RLS); only the
-- service-role edge functions touch it.
CREATE OR REPLACE FUNCTION public.next_flow_license_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'OF-FLOW-2026-' || lpad(nextval('public.flow_license_seq')::text, 4, '0');
$$;

REVOKE ALL ON FUNCTION public.next_flow_license_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_flow_license_id() TO service_role;
