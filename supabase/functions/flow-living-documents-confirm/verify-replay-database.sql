-- Run after the Living Documents migrations in an isolated PostgreSQL/Supabase
-- instance. All fixtures roll back. No provider call or email is involved.
begin;
do $$
declare
  suffix text := gen_random_uuid()::text;
  permission text;
  test_email text;
  token_hash text;
  row_id uuid;
  before_row jsonb;
  after_row jsonb;
  result_value text;
  test_request uuid := gen_random_uuid();
  email_version smallint;
  legacy constant text := 'Send me Flow updates, Living Documents methods, and the AI Native Newsletter. Up to one email a week. Unsubscribe any time.';
  current_text constant text := 'Send me Flow updates, Living Documents Jobs, and the AI Native Newsletter. Up to one email a week. Unsubscribe any time.';
begin
  -- Default 1 preserves bodies for deployments that do not know this column.
  insert into public.flow_living_documents_signup_attempts(request_id, email, payload_hash, request_fingerprint)
    values(test_request, 'version-' || suffix || chr(64) || 'example.invalid',
      encode(sha256(gen_random_uuid()::text::bytea), 'hex'), encode(sha256(gen_random_uuid()::text::bytea), 'hex'))
    returning confirmation_email_version into email_version;
  if email_version is distinct from 1 then raise exception 'old sender attempts must default to email version 1'; end if;
  if public.flow_living_documents_confirmation_email_version(test_request, 1) is distinct from 2 then
    raise exception 'fresh sending claim must select version 2';
  end if;
  select to_jsonb(a) into before_row from public.flow_living_documents_signup_attempts a where request_id = test_request;
  begin
    perform public.flow_living_documents_confirmation_email_version(test_request, 2);
    raise exception 'mismatched claim version must be rejected';
  exception when invalid_parameter_value then null;
  end;
  select to_jsonb(a) into after_row from public.flow_living_documents_signup_attempts a where request_id = test_request;
  if before_row is distinct from after_row then raise exception 'mismatched claim must not alter the attempt'; end if;
  -- A retry keeps its previously selected version and every timestamp.
  update public.flow_living_documents_signup_attempts set claim_version = 2 where request_id = test_request;
  select to_jsonb(a) into before_row from public.flow_living_documents_signup_attempts a where request_id = test_request;
  if public.flow_living_documents_confirmation_email_version(test_request, 2) is distinct from 2 then
    raise exception 'new-body retry must retain version 2';
  end if;
  select to_jsonb(a) into after_row from public.flow_living_documents_signup_attempts a where request_id = test_request;
  if before_row is distinct from after_row then raise exception 'retry version lookup must not update the attempt'; end if;
  -- Simulate an old deployed sender's uncertain first delivery: default 1
  -- survives when the new adapter takes its second delivery claim.
  update public.flow_living_documents_signup_attempts set confirmation_email_version = 1 where request_id = test_request;
  select to_jsonb(a) into before_row from public.flow_living_documents_signup_attempts a where request_id = test_request;
  if public.flow_living_documents_confirmation_email_version(test_request, 2) is distinct from 1 then
    raise exception 'old-body retry must retain version 1';
  end if;
  select to_jsonb(a) into after_row from public.flow_living_documents_signup_attempts a where request_id = test_request;
  if before_row is distinct from after_row then raise exception 'old-body retry must not alter the attempt'; end if;
  begin
    perform public.flow_living_documents_confirmation_email_version(test_request, 1);
    raise exception 'stale first claim must not upgrade a retry body';
  exception when invalid_parameter_value then null;
  end;
  update public.flow_living_documents_signup_attempts set status = 'sent', provider_id = 'local-test-receipt' where request_id = test_request;
  begin
    perform public.flow_living_documents_confirmation_email_version(test_request, 2);
    raise exception 'finished claim must not select an email version';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.flow_living_documents_confirmation_email_version(gen_random_uuid(), 1);
    raise exception 'missing claim must not select an email version';
  exception when invalid_parameter_value then null;
  end;
  update public.flow_living_documents_signup_attempts set confirmation_email_version = 2 where request_id = test_request;
  begin
    update public.flow_living_documents_signup_attempts set confirmation_email_version = 0 where request_id = test_request;
    raise exception 'unsupported email version 0 must be rejected';
  exception when check_violation then null;
  end;
  begin
    update public.flow_living_documents_signup_attempts set confirmation_email_version = 3 where request_id = test_request;
    raise exception 'unsupported email version 3 must be rejected';
  exception when check_violation then null;
  end;
  begin
    update public.flow_living_documents_signup_attempts set confirmation_email_version = null where request_id = test_request;
    raise exception 'email version must remain non-null';
  exception when not_null_violation then null;
  end;
  if not exists(select 1 from public.flow_living_documents_signup_attempts where request_id = test_request and confirmation_email_version = 2) then
    raise exception 'rejected versions must not change the accepted version';
  end if;

  foreach permission in array array[legacy, current_text] loop
    test_email := 'replay-' || gen_random_uuid()::text || chr(64) || 'example.invalid';
    token_hash := encode(sha256(gen_random_uuid()::text::bytea), 'hex');
    insert into public.flow_living_documents_subscriptions
      (email, offer, consent_text, source, attribution, request_id, confirmation_token_hash)
      values (test_email, 'flow-living-documents-v1', permission, 'manifesto-living-documents',
        jsonb_build_object('utm_campaign', 'replay-test-' || suffix), gen_random_uuid(), token_hash)
      returning id into row_id;
    result_value := public.confirm_flow_living_documents_subscription_result(token_hash);
    if result_value is distinct from 'confirmed' then raise exception 'first valid click must confirm'; end if;
    if not exists(select 1 from public.flow_living_documents_subscriptions where id = row_id
      and confirmed_at is not null and confirmation_token_hash is null
      and confirmation_receipt_hash = token_hash and consent_text = permission) then
      raise exception 'first confirmation must preserve consent and save only a consumed hash';
    end if;
    -- now() is transaction-stable. Sentinel timestamps make an accidental
    -- replay UPDATE detectable even within this single rollback transaction.
    update public.flow_living_documents_subscriptions
      set confirmed_at = now() - interval '2 minutes', updated_at = now() - interval '1 minute'
      where id = row_id;
    select to_jsonb(s) into before_row from public.flow_living_documents_subscriptions s where id = row_id;
    if public.confirm_flow_living_documents_subscription_result(token_hash) is distinct from 'already' then
      raise exception 'valid repeat click must acknowledge prior confirmation';
    end if;
    if public.confirm_flow_living_documents_subscription(token_hash) then
      raise exception 'legacy boolean RPC must retain its single-use true result';
    end if;
    select to_jsonb(s) into after_row from public.flow_living_documents_subscriptions s where id = row_id;
    if before_row is distinct from after_row then raise exception 'replay must not change any subscription field or timestamp'; end if;

    -- Opting out after confirmation blocks success/already without clearing
    -- the suppression or altering the historic consent receipt.
    insert into public.suppressions(email, reason) values ('  ' || upper(test_email) || '  ', 'unsubscribe');
    if public.confirm_flow_living_documents_subscription_result(token_hash) is distinct from 'invalid'
      or public.confirm_flow_living_documents_subscription(token_hash) then
      raise exception 'suppression must block a previously confirmed link';
    end if;
    select to_jsonb(s) into after_row from public.flow_living_documents_subscriptions s where id = row_id;
    if before_row is distinct from after_row then raise exception 'suppressed replay must not resubscribe or change the receipt'; end if;
    if not exists(select 1 from public.suppressions where lower(btrim(email)) = test_email) then
      raise exception 'suppression must remain intact';
    end if;
  end loop;

  -- Pending suppression also blocks the initial click, with no row mutation.
  test_email := 'pending-' || suffix || chr(64) || 'example.invalid';
  token_hash := encode(sha256(gen_random_uuid()::text::bytea), 'hex');
  insert into public.flow_living_documents_subscriptions(email, offer, consent_text, source, request_id, confirmation_token_hash)
    values(test_email, 'flow-living-documents-v1', current_text, 'manifesto-living-documents', gen_random_uuid(), token_hash)
    returning id into row_id;
  insert into public.suppressions(email, reason) values (upper(test_email), 'complaint');
  select to_jsonb(s) into before_row from public.flow_living_documents_subscriptions s where id = row_id;
  if public.confirm_flow_living_documents_subscription_result(token_hash) is distinct from 'invalid' then
    raise exception 'suppression must block pending confirmation';
  end if;
  select to_jsonb(s) into after_row from public.flow_living_documents_subscriptions s where id = row_id;
  if before_row is distinct from after_row then raise exception 'suppressed pending row must remain unchanged'; end if;

  -- The exact seven-day boundary is expired; just inside it remains valid.
  test_email := 'expiry-' || suffix || chr(64) || 'example.invalid';
  token_hash := encode(sha256(gen_random_uuid()::text::bytea), 'hex');
  insert into public.flow_living_documents_subscriptions(email, offer, consent_text, source, request_id, confirmation_token_hash, requested_at)
    values(test_email, 'flow-living-documents-v1', current_text, 'manifesto-living-documents', gen_random_uuid(), token_hash, now() - interval '7 days')
    returning id into row_id;
  select to_jsonb(s) into before_row from public.flow_living_documents_subscriptions s where id = row_id;
  if public.confirm_flow_living_documents_subscription_result(token_hash) is distinct from 'invalid' then
    raise exception 'exactly seven-day-old pending token must be expired';
  end if;
  select to_jsonb(s) into after_row from public.flow_living_documents_subscriptions s where id = row_id;
  if before_row is distinct from after_row then raise exception 'expired pending row must remain unchanged'; end if;
  update public.flow_living_documents_subscriptions set requested_at = now() - interval '7 days' + interval '1 second' where id = row_id;
  if not public.confirm_flow_living_documents_subscription(token_hash) then
    raise exception 'deployed boolean RPC must still confirm a fresh token';
  end if;
  if public.confirm_flow_living_documents_subscription_result(token_hash) is distinct from 'already' then
    raise exception 'boolean-path confirmation must create a replay receipt';
  end if;
  update public.flow_living_documents_subscriptions set requested_at = now() - interval '7 days' where id = row_id;
  select to_jsonb(s) into before_row from public.flow_living_documents_subscriptions s where id = row_id;
  if public.confirm_flow_living_documents_subscription_result(token_hash) is distinct from 'invalid' then
    raise exception 'expired confirmed token must not return already';
  end if;
  select to_jsonb(s) into after_row from public.flow_living_documents_subscriptions s where id = row_id;
  if before_row is distinct from after_row then raise exception 'expired replay must not change timestamps'; end if;

  -- Old confirmed rows with an already-erased hash remain valid history; the
  -- migration must not invent a recoverable token or a replay receipt for them.
  insert into public.flow_living_documents_subscriptions(email, offer, consent_text, source, request_id, confirmation_token_hash, confirmed_at)
    values('historical-' || suffix || chr(64) || 'example.invalid', 'flow-living-documents-v1', legacy,
      'manifesto-living-documents', gen_random_uuid(), null, now() - interval '1 day')
    returning id into row_id;
  if not exists(select 1 from public.flow_living_documents_subscriptions where id = row_id and confirmation_receipt_hash is null) then
    raise exception 'historical confirmation must permit an absent replay receipt';
  end if;
  if public.confirm_flow_living_documents_subscription_result(null) is distinct from 'invalid'
    or public.confirm_flow_living_documents_subscription_result('bad') is distinct from 'invalid'
    or public.confirm_flow_living_documents_subscription_result(repeat('A', 64)) is distinct from 'invalid'
    or public.confirm_flow_living_documents_subscription_result(encode(sha256(gen_random_uuid()::text::bytea), 'hex')) is distinct from 'invalid' then
    raise exception 'invalid or unknown hashes must fail closed';
  end if;
  if has_function_privilege('anon', 'public.flow_living_documents_confirmation_email_version(uuid,integer)', 'execute')
    or has_function_privilege('authenticated', 'public.flow_living_documents_confirmation_email_version(uuid,integer)', 'execute')
    or not has_function_privilege('service_role', 'public.flow_living_documents_confirmation_email_version(uuid,integer)', 'execute') then
    raise exception 'email-version RPC must preserve service-role-only execution';
  end if;
  if has_function_privilege('anon', 'public.confirm_flow_living_documents_subscription_result(text)', 'execute')
    or has_function_privilege('authenticated', 'public.confirm_flow_living_documents_subscription_result(text)', 'execute')
    or not has_function_privilege('service_role', 'public.confirm_flow_living_documents_subscription_result(text)', 'execute') then
    raise exception 'new result RPC must preserve service-role-only execution';
  end if;
  if has_table_privilege('anon', 'public.flow_living_documents_subscriptions', 'select')
    or has_table_privilege('authenticated', 'public.flow_living_documents_subscriptions', 'select') then
    raise exception 'receipt hash must remain inaccessible to public roles';
  end if;
end;
$$;
rollback;
