-- After migrations 20260906010000 and 20260906020000, run against an isolated
-- PostgreSQL/Supabase instance. Every synthetic row is rolled back; no emails.
begin;
do $$
declare
  suffix text := gen_random_uuid()::text;
  held_email text;
  pending_email text;
  allowed_email text;
  matches text[];
  result_row record;
  pending_id uuid := gen_random_uuid();
  allowed_id uuid := gen_random_uuid();
  fingerprint text := encode(sha256(gen_random_uuid()::text::bytea), 'hex');
  pending_hash text := encode(sha256(gen_random_uuid()::text::bytea), 'hex');
  allowed_hash text := encode(sha256(gen_random_uuid()::text::bytea), 'hex');
  consent constant text := 'Send me Flow updates, Living Documents methods, and the AI Native Newsletter. Up to one email a week. Unsubscribe any time.';
  invalid_rejected boolean;
begin
  held_email := 'held-' || suffix || chr(64) || 'example.invalid';
  pending_email := 'pending-' || suffix || chr(64) || 'example.invalid';
  allowed_email := 'allowed-' || suffix || chr(64) || 'example.invalid';
  insert into public.suppressions(email, reason) values
    ('  ' || upper(held_email) || '  ', 'unsubscribe'),
    (upper(held_email), 'complaint');
  matches := public.flow_living_documents_suppressions(array[held_email, allowed_email, held_email]);
  if matches is distinct from array[held_email] then raise exception 'normalized lookup must collapse mixed-case duplicate suppressions'; end if;
  if public.flow_living_documents_suppressions(array[]::text[]) is distinct from array[]::text[] then raise exception 'empty lookup must return empty array'; end if;
  invalid_rejected := false;
  begin
    perform public.flow_living_documents_suppressions(array_fill(held_email,array[501]));
  exception when invalid_parameter_value then invalid_rejected := true;
  end;
  if not invalid_rejected then raise exception 'oversized lookup must reject'; end if;
  invalid_rejected := false;
  begin
    perform public.flow_living_documents_suppressions(array[upper(held_email)]);
  exception when invalid_parameter_value then invalid_rejected := true;
  end;
  if not invalid_rejected then raise exception 'unnormalized lookup input must reject'; end if;
  select * into result_row from public.reserve_flow_living_documents_signup(gen_random_uuid(),held_email,repeat('a',64),fingerprint,repeat('b',64),'flow-living-documents-v1',consent,'manifesto-living-documents','{}');
  if result_row.result <> 'accepted' or result_row.claim_version <> 0 then raise exception 'mixed-case suppression must block reservation'; end if;
  if exists(select 1 from public.flow_living_documents_subscriptions where email=held_email) then raise exception 'suppressed reservation must not create a receipt'; end if;
  select * into result_row from public.reserve_flow_living_documents_signup(pending_id,pending_email,repeat('c',64),fingerprint,pending_hash,'flow-living-documents-v1',consent,'manifesto-living-documents','{}');
  if result_row.result <> 'send' then raise exception 'unsuppressed pending request must reserve'; end if;
  insert into public.suppressions(email, reason) values ('  ' || upper(pending_email) || '  ', 'unsubscribe');
  if public.flow_living_documents_suppressions(array[pending_email]) is distinct from array[pending_email] then raise exception 'pre-send read must see a later mixed-case suppression'; end if;
  if public.confirm_flow_living_documents_subscription(pending_hash) then raise exception 'mixed-case suppression must block confirmation'; end if;
  if exists(select 1 from public.flow_living_documents_subscriptions where email=pending_email and confirmed_at is not null) then raise exception 'blocked confirmation must remain pending'; end if;
  select * into result_row from public.reserve_flow_living_documents_signup(allowed_id,allowed_email,repeat('d',64),fingerprint,allowed_hash,'flow-living-documents-v1',consent,'manifesto-living-documents','{}');
  if result_row.result <> 'send' or not public.confirm_flow_living_documents_subscription(allowed_hash) then raise exception 'unsuppressed consent path must still work'; end if;
  if has_function_privilege('anon','public.flow_living_documents_suppressions(text[])','execute') or has_function_privilege('authenticated','public.flow_living_documents_suppressions(text[])','execute') then raise exception 'public roles must not read suppressions'; end if;
  if not has_function_privilege('service_role','public.flow_living_documents_suppressions(text[])','execute') then raise exception 'service role must be able to read suppressions'; end if;
end;
$$;
rollback;
