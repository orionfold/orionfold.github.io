-- A consumed confirmation can acknowledge a later click without confirming
-- again. Store only its hash; preserve the original active-token invariant.
begin;
alter table public.flow_living_documents_subscriptions
  add column confirmation_receipt_hash text unique
    check (confirmation_receipt_hash is null or confirmation_receipt_hash ~ '^[0-9a-f]{64}$'),
  add constraint flow_living_documents_confirmation_receipt_state_check
    check (confirmation_receipt_hash is null or
      (confirmed_at is not null and confirmation_token_hash is null));

-- Existing/in-flight email bodies remain version 1. The new sender explicitly
-- marks only its fresh claim as version 2 before delivery; retries reuse it.
alter table public.flow_living_documents_signup_attempts
  add column confirmation_email_version smallint not null default 1
    check (confirmation_email_version in (1, 2));

-- Version choice is part of the current delivery claim. Do not grant callers
-- table UPDATE just to select the email body used by this one operation.
create function public.flow_living_documents_confirmation_email_version(
  p_request_id uuid, p_claim_version integer
) returns smallint language plpgsql security definer set search_path = public, pg_temp as $$
declare
  selected_version smallint;
begin
  select confirmation_email_version into selected_version
    from public.flow_living_documents_signup_attempts
    where request_id = p_request_id and status = 'sending' and claim_version = p_claim_version
    for update;
  if not found then
    raise exception 'Invalid confirmation email claim' using errcode = '22023';
  end if;
  if p_claim_version = 1 then
    update public.flow_living_documents_signup_attempts
      set confirmation_email_version = 2
      where request_id = p_request_id and status = 'sending' and claim_version = 1;
    selected_version := 2;
  end if;
  return selected_version;
end;
$$;
revoke all on function public.flow_living_documents_confirmation_email_version(uuid, integer) from public, anon, authenticated;
grant execute on function public.flow_living_documents_confirmation_email_version(uuid, integer) to service_role;

comment on column public.flow_living_documents_subscriptions.confirmation_receipt_hash is
  'Consumed confirmation hash for read-only replay acknowledgement within the original seven-day window. Never a raw token.';

create function public.confirm_flow_living_documents_subscription_result(p_token_hash text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  subscription public.flow_living_documents_subscriptions%rowtype;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    return 'invalid';
  end if;
  begin
    select * into strict subscription
      from public.flow_living_documents_subscriptions
      where confirmation_token_hash = p_token_hash or confirmation_receipt_hash = p_token_hash
      for update;
  exception
    when no_data_found or too_many_rows then return 'invalid';
  end;
  -- Expiry is anchored to the original request, including for repeat clicks.
  -- Suppression is checked before any successful response, including replay.
  if subscription.requested_at <= now() - interval '7 days'
    or exists(select 1 from public.suppressions s
      where lower(btrim(s.email)) = subscription.email) then
    return 'invalid';
  end if;
  if subscription.confirmed_at is not null then
    if subscription.confirmation_receipt_hash = p_token_hash then
      return 'already';
    end if;
    return 'invalid';
  end if;
  update public.flow_living_documents_subscriptions
    set confirmed_at = now(), confirmation_receipt_hash = confirmation_token_hash,
      confirmation_token_hash = null, updated_at = now()
    where id = subscription.id;
  return 'confirmed';
end;
$$;

-- Preserve the deployed boolean API: true still means a first confirmation.
-- Old callers now also record a replay receipt for the new result-aware API.
create or replace function public.confirm_flow_living_documents_subscription(p_token_hash text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return public.confirm_flow_living_documents_subscription_result(p_token_hash) = 'confirmed';
end;
$$;

revoke all on function public.confirm_flow_living_documents_subscription_result(text) from public, anon, authenticated;
grant execute on function public.confirm_flow_living_documents_subscription_result(text) to service_role;
revoke all on function public.confirm_flow_living_documents_subscription(text) from public, anon, authenticated;
grant execute on function public.confirm_flow_living_documents_subscription(text) to service_role;
commit;
