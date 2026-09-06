-- New Living Documents offer only. Preserve the original migration and all
-- legacy handlers/schema. Normalize suppression identity when reading it.
create or replace function public.flow_living_documents_suppressions(p_emails text[])
returns text[]
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  matches text[];
begin
  if p_emails is null or cardinality(p_emails) > 500
    or coalesce(array_ndims(p_emails), 1) <> 1
    or exists (select 1 from unnest(p_emails) as requested(email)
      where email is null or email is distinct from lower(btrim(email))
        or char_length(email) not between 3 and 254 or position(chr(64) in email) < 2) then
    raise exception 'Invalid suppression lookup' using errcode = '22023';
  end if;
  -- Return one scalar array, not a rowset that an API row cap could truncate.
  -- At most 500 distinct requested identities can be returned, irrespective
  -- of duplicate historical suppression rows or their original case/spacing.
  select coalesce(array_agg(distinct lower(btrim(s.email))), array[]::text[])
    into matches
    from public.suppressions s
    where lower(btrim(s.email)) = any(p_emails);
  return matches;
end;
$$;
revoke all on function public.flow_living_documents_suppressions(text[]) from public, anon, authenticated;
grant execute on function public.flow_living_documents_suppressions(text[]) to service_role;

create or replace function public.reserve_flow_living_documents_signup(
  p_request_id uuid, p_email text, p_payload_hash text, p_request_fingerprint text,
  p_token_hash text, p_offer text, p_consent_text text, p_source text, p_attribution jsonb
) returns table(result text, claim_version integer)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  attempt public.flow_living_documents_signup_attempts%rowtype;
  subscription public.flow_living_documents_subscriptions%rowtype;
  next_claim integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('flow-documents-request:' || p_request_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended('flow-documents-ip:' || p_request_fingerprint, 0));
  perform pg_advisory_xact_lock(hashtextextended('flow-documents-email:' || p_email, 0));
  if exists(select 1 from public.suppressions s where lower(btrim(s.email)) = lower(btrim(p_email))) then
    return query select 'accepted', 0; return;
  end if;
  select * into subscription from public.flow_living_documents_subscriptions where email = p_email;
  if subscription.confirmed_at is not null then
    return query select 'accepted', 0; return;
  end if;
  select * into attempt from public.flow_living_documents_signup_attempts where request_id = p_request_id;
  if found then
    if attempt.payload_hash <> p_payload_hash or attempt.email <> p_email then
      return query select 'conflict', 0; return;
    end if;
    if attempt.status = 'sent' or subscription.request_id is distinct from p_request_id then
      return query select 'accepted', 0; return;
    end if;
    -- Resend retries retain the same body/token/key and stay within one hour.
    if attempt.created_at < now() - interval '1 hour' or attempt.claim_version >= 3 then
      return query select 'expired', 0; return;
    end if;
    if attempt.claimed_at > now() - interval '1 minute' then
      return query select 'busy', 0; return;
    end if;
    next_claim := attempt.claim_version + 1;
    update public.flow_living_documents_signup_attempts set status='sending', claimed_at=now(), claim_version=next_claim where request_id=p_request_id;
    return query select 'send', next_claim; return;
  end if;
  if (select count(*) from public.flow_living_documents_signup_attempts where request_fingerprint=p_request_fingerprint and created_at >= now()-interval '1 hour') >= 5
    or (select count(*) from public.flow_living_documents_signup_attempts where email=p_email and created_at >= now()-interval '1 hour') >= 5 then
    return query select 'rate_limited', 0; return;
  end if;
  insert into public.flow_living_documents_subscriptions(email,offer,consent_text,source,attribution,request_id,confirmation_token_hash)
    values(p_email,p_offer,p_consent_text,p_source,p_attribution,p_request_id,p_token_hash)
    on conflict(email) do update set offer=excluded.offer,consent_text=excluded.consent_text,source=excluded.source,attribution=excluded.attribution,
      request_id=excluded.request_id,confirmation_token_hash=excluded.confirmation_token_hash,requested_at=now(),updated_at=now();
  insert into public.flow_living_documents_signup_attempts(request_id,email,payload_hash,request_fingerprint)
    values(p_request_id,p_email,p_payload_hash,p_request_fingerprint);
  return query select 'send', 1;
end;
$$;

create or replace function public.confirm_flow_living_documents_subscription(p_token_hash text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare subscription public.flow_living_documents_subscriptions%rowtype;
begin
  select * into subscription from public.flow_living_documents_subscriptions where confirmation_token_hash=p_token_hash for update;
  if not found or subscription.confirmed_at is not null or subscription.requested_at < now()-interval '7 days'
    or exists(select 1 from public.suppressions s where lower(btrim(s.email))=subscription.email) then return false; end if;
  update public.flow_living_documents_subscriptions set confirmed_at=now(),confirmation_token_hash=null,updated_at=now() where id=subscription.id;
  return true;
end;
$$;

-- Reassert the existing new-offer privilege boundary; no legacy function changes.
revoke all on function public.reserve_flow_living_documents_signup(uuid,text,text,text,text,text,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.confirm_flow_living_documents_subscription(text) from public,anon,authenticated;
grant execute on function public.reserve_flow_living_documents_signup(uuid,text,text,text,text,text,text,text,jsonb) to service_role;
grant execute on function public.confirm_flow_living_documents_subscription(text) to service_role;
