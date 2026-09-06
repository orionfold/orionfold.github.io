-- Run against an isolated PostgreSQL/Supabase instance after applying the new
-- migration. This transaction rolls back every synthetic row. It never sends.
begin;
do $$
declare
  suffix text := gen_random_uuid()::text;
  test_email text;
  other_email text;
  request_one uuid := gen_random_uuid();
  request_two uuid := gen_random_uuid();
  result_row record;
  okay boolean;
  i integer;
  consent constant text := 'Send me Flow updates, Living Documents methods, and the AI Native Newsletter. Up to one email a week. Unsubscribe any time.';
begin
  test_email := 'flow-consent-' || suffix || chr(64) || 'example.invalid';
  other_email := 'flow-consent-other-' || suffix || chr(64) || 'example.invalid';
  select * into result_row from public.reserve_flow_living_documents_signup(request_one,test_email,repeat('a',64),repeat('b',64),repeat('c',64),'flow-living-documents-v1',consent,'manifesto-living-documents','{}');
  if result_row.result <> 'send' or result_row.claim_version <> 1 then raise exception 'first reservation must send'; end if;
  select * into result_row from public.reserve_flow_living_documents_signup(request_one,test_email,repeat('a',64),repeat('b',64),repeat('c',64),'flow-living-documents-v1',consent,'manifesto-living-documents','{}');
  if result_row.result <> 'busy' then raise exception 'concurrent reservation must be busy'; end if;
  select * into result_row from public.reserve_flow_living_documents_signup(request_one,other_email,repeat('d',64),repeat('b',64),repeat('e',64),'flow-living-documents-v1',consent,'manifesto-living-documents','{}');
  if result_row.result <> 'conflict' then raise exception 'request identity collision must reject'; end if;
  okay := public.finish_flow_living_documents_signup(request_one,9,'wrong-claim');
  if okay then raise exception 'stale delivery claim must not finish'; end if;
  okay := public.finish_flow_living_documents_signup(request_one,1,'test-provider-receipt');
  if not okay then raise exception 'matching provider receipt must finish'; end if;
  select * into result_row from public.reserve_flow_living_documents_signup(request_one,test_email,repeat('a',64),repeat('b',64),repeat('c',64),'flow-living-documents-v1',consent,'manifesto-living-documents','{}');
  if result_row.result <> 'accepted' then raise exception 'completed delivery must not resend'; end if;
  okay := public.confirm_flow_living_documents_subscription(repeat('c',64));
  if not okay then raise exception 'valid fresh token must confirm'; end if;
  okay := public.confirm_flow_living_documents_subscription(repeat('c',64));
  if okay then raise exception 'confirmation token must be single use'; end if;
  if not exists(select 1 from public.flow_living_documents_subscriptions where email=test_email and confirmed_at is not null and confirmation_token_hash is null) then raise exception 'confirmed receipt must clear token hash'; end if;
  select * into result_row from public.reserve_flow_living_documents_signup(request_two,test_email,repeat('a',64),repeat('b',64),repeat('f',64),'flow-living-documents-v1',consent,'manifesto-living-documents','{}');
  if result_row.result <> 'accepted' then raise exception 'confirmed subscriber must get non-enumerating acknowledgement'; end if;
  -- A different inbox exhausts exactly five accepted reservations per IP/hour.
  for i in 1..6 loop
    select * into result_row from public.reserve_flow_living_documents_signup(gen_random_uuid(),'rate-'||i||'-'||suffix||chr(64)||'example.invalid',repeat('a',64),repeat('d',64),lpad(i::text,64,'0'),'flow-living-documents-v1',consent,'manifesto-living-documents','{}');
    if i <= 5 and result_row.result <> 'send' then raise exception 'first five rate reservations must send'; end if;
    if i = 6 and result_row.result <> 'rate_limited' then raise exception 'sixth rate reservation must reject'; end if;
  end loop;
  if has_table_privilege('anon','public.flow_living_documents_subscriptions','select') or has_table_privilege('authenticated','public.flow_living_documents_subscriptions','insert') then raise exception 'public roles must not access private consent'; end if;
  if has_function_privilege('anon','public.confirm_flow_living_documents_subscription(text)','execute') then raise exception 'public roles must not consume consent directly'; end if;
end;
$$;
rollback;
