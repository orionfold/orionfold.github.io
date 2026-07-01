-- next_relay_license_id() — the one server-callable way to draw an Orionfold Relay
-- license id (OF-RELAY-2026-NNNN).
--
-- Relay is the third licensed product (relay ask orionfold-relay 2026-06-30). It
-- gets its OWN sequence so its ids are product-distinct and customer-facing-clear
-- ("OF-RELAY-…" reads as a Relay license), independent of the Arena fe_license_seq
-- and the Proof proof_license_seq. The CLI treats license_id as opaque, so the
-- prefix is cosmetic — but a separate sequence keeps the products' numbering from
-- interleaving. Same posture as next_proof_license_id (20260624000000) and
-- next_fe_license_id (20260613100000): supabase-js cannot call nextval() directly
-- (PostgREST exposes functions, not raw SQL), so fulfillLicense draws its id via
-- supabase.rpc('next_relay_license_id'). Monotonic, not gap-free under rollback
-- (a webhook that draws an id then fails before INSERT skips that number) — gaps
-- are harmless for an opaque license id.
CREATE SEQUENCE IF NOT EXISTS public.relay_license_seq START 1;

-- SECURITY DEFINER + a pinned search_path so it runs with the owner's rights and
-- cannot be hijacked by a caller's search_path. EXECUTE revoked from
-- anon/authenticated (deny-all, same posture as fe_entitlements' RLS); only the
-- service-role edge functions touch it.
CREATE OR REPLACE FUNCTION public.next_relay_license_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'OF-RELAY-2026-' || lpad(nextval('public.relay_license_seq')::text, 4, '0');
$$;

REVOKE ALL ON FUNCTION public.next_relay_license_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_relay_license_id() TO service_role;
