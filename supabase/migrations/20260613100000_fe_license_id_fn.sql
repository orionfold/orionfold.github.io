-- next_fe_license_id() — the one server-callable way to draw a license id.
--
-- The license id (OF-FE-2026-NNNN) must come from fe_license_seq (created in
-- 20260613000000) so it is unique + monotonic. supabase-js cannot call nextval()
-- directly (PostgREST exposes functions, not raw SQL), so fulfillLicense draws
-- its id via supabase.rpc('next_fe_license_id'). The seq is monotonic, not
-- gap-free under rollback (a webhook that draws an id then fails before INSERT
-- skips that number) — gaps are harmless for an opaque license id.
--
-- SECURITY DEFINER + a pinned search_path so it runs with the owner's rights and
-- cannot be hijacked by a caller's search_path. EXECUTE is revoked from
-- anon/authenticated (deny-all, same posture as fe_entitlements' RLS); only the
-- service-role edge functions touch it.
CREATE OR REPLACE FUNCTION public.next_fe_license_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'OF-FE-2026-' || lpad(nextval('public.fe_license_seq')::text, 4, '0');
$$;

REVOKE ALL ON FUNCTION public.next_fe_license_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_fe_license_id() TO service_role;
