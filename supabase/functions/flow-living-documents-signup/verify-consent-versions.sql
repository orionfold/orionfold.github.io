-- Isolated PostgreSQL acceptance after all Living Documents migrations.
-- Every synthetic row rolls back; no provider call or email is involved.
begin;
do $$
declare
  suffix text := gen_random_uuid()::text;
  old_email text := 'consent-old-' || suffix || chr(64) || 'example.invalid';
  new_email text := 'consent-jobs-' || suffix || chr(64) || 'example.invalid';
  old_request uuid := gen_random_uuid();
  new_request uuid := gen_random_uuid();
  result_row record;
  legacy constant text := 'Send me Flow updates, Living Documents methods, and the AI Native Newsletter. Up to one email a week. Unsubscribe any time.';
  current_text constant text := 'Send me Flow updates, Living Documents Jobs, and the AI Native Newsletter. Up to one email a week. Unsubscribe any time.';
begin
  select * into result_row from public.reserve_flow_living_documents_signup(old_request,old_email,repeat('a',64),repeat('b',64),repeat('c',64),'flow-living-documents-v1',legacy,'manifesto-living-documents','{}');
  if result_row.result <> 'send' then raise exception 'legacy sentence must remain accepted'; end if;
  -- A changed consent payload cannot take over an outstanding request UUID.
  select * into result_row from public.reserve_flow_living_documents_signup(old_request,old_email,repeat('d',64),repeat('b',64),repeat('c',64),'flow-living-documents-v1',current_text,'manifesto-living-documents','{}');
  if result_row.result <> 'conflict' then raise exception 'changed consent retry must conflict'; end if;
  if not public.finish_flow_living_documents_signup(old_request,1,'legacy-test-receipt') then raise exception 'legacy delivery receipt must finish'; end if;
  if not public.confirm_flow_living_documents_subscription(repeat('c',64)) then raise exception 'legacy token must still confirm'; end if;
  select * into result_row from public.reserve_flow_living_documents_signup(gen_random_uuid(),old_email,repeat('d',64),repeat('b',64),repeat('e',64),'flow-living-documents-v1',current_text,'manifesto-living-documents','{}');
  if result_row.result <> 'accepted' then raise exception 'existing confirmed reader keeps generic acknowledgement'; end if;
  if not exists(select 1 from public.flow_living_documents_subscriptions where email=old_email and consent_text=legacy and confirmed_at is not null) then raise exception 'historical confirmed permission must remain unchanged'; end if;
  select * into result_row from public.reserve_flow_living_documents_signup(new_request,new_email,repeat('d',64),repeat('b',64),repeat('f',64),'flow-living-documents-v1',current_text,'manifesto-living-documents','{}');
  if result_row.result <> 'send' then raise exception 'current Jobs sentence must be accepted'; end if;
  if not exists(select 1 from public.flow_living_documents_subscriptions where email=new_email and consent_text=current_text) then raise exception 'current permission must be stored verbatim'; end if;
  begin
    update public.flow_living_documents_subscriptions set consent_text='Unrequested permission' where email=new_email;
    raise exception 'unknown permission must be rejected';
  exception when check_violation then null;
  end;
end;
$$;
rollback;
