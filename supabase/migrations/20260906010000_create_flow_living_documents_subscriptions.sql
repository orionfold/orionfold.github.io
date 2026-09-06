-- Separate affirmative consent. No legacy waitlist rows, offers or tokens change.
create table if not exists public.flow_living_documents_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(btrim(email)) and char_length(email) between 3 and 254),
  offer text not null check (offer = 'flow-living-documents-v1'),
  consent_text text not null check (consent_text = 'Send me Flow updates, Living Documents methods, and the AI Native Newsletter. Up to one email a week. Unsubscribe any time.'),
  source text not null check (source = 'manifesto-living-documents'),
  attribution jsonb not null default '{}' check (jsonb_typeof(attribution) = 'object'),
  request_id uuid not null,
  confirmation_token_hash text unique check (confirmation_token_hash is null or confirmation_token_hash ~ '^[0-9a-f]{64}$'),
  requested_at timestamptz not null default now(),
  confirmed_at timestamptz,
  updated_at timestamptz not null default now(),
  check ((confirmed_at is null and confirmation_token_hash is not null) or (confirmed_at is not null and confirmation_token_hash is null))
);
create index if not exists flow_living_documents_export_idx on public.flow_living_documents_subscriptions(updated_at, id) where confirmed_at is not null;

-- Delivery attempts retain idempotency and rate counters, never the raw token/IP.
create table if not exists public.flow_living_documents_signup_attempts (
  request_id uuid primary key,
  email text not null,
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  claimed_at timestamptz not null default now(),
  claim_version integer not null default 1,
  status text not null default 'sending' check (status in ('sending', 'sent', 'failed')),
  provider_id text,
  check (status <> 'sent' or provider_id is not null)
);
create index if not exists flow_living_documents_rate_idx on public.flow_living_documents_signup_attempts(request_fingerprint, created_at desc);
create index if not exists flow_living_documents_email_rate_idx on public.flow_living_documents_signup_attempts(email, created_at desc);

alter table public.flow_living_documents_subscriptions enable row level security;
alter table public.flow_living_documents_subscriptions force row level security;
alter table public.flow_living_documents_signup_attempts enable row level security;
alter table public.flow_living_documents_signup_attempts force row level security;
revoke all on public.flow_living_documents_subscriptions, public.flow_living_documents_signup_attempts from public, anon, authenticated;
grant select on public.flow_living_documents_subscriptions, public.flow_living_documents_signup_attempts to service_role;

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
  if exists(select 1 from public.suppressions where email = p_email) then
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

create or replace function public.finish_flow_living_documents_signup(p_request_id uuid,p_claim_version integer,p_provider_id text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.flow_living_documents_signup_attempts set status=case when p_provider_id is null then 'failed' else 'sent' end,provider_id=p_provider_id
    where request_id=p_request_id and claim_version=p_claim_version and status='sending';
  return found;
end;
$$;

create or replace function public.confirm_flow_living_documents_subscription(p_token_hash text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare subscription public.flow_living_documents_subscriptions%rowtype;
begin
  select * into subscription from public.flow_living_documents_subscriptions where confirmation_token_hash=p_token_hash for update;
  if not found or subscription.confirmed_at is not null or subscription.requested_at < now()-interval '7 days'
    or exists(select 1 from public.suppressions where email=subscription.email) then return false; end if;
  update public.flow_living_documents_subscriptions set confirmed_at=now(),confirmation_token_hash=null,updated_at=now() where id=subscription.id;
  return true;
end;
$$;

revoke all on function public.reserve_flow_living_documents_signup(uuid,text,text,text,text,text,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.finish_flow_living_documents_signup(uuid,integer,text) from public,anon,authenticated;
revoke all on function public.confirm_flow_living_documents_subscription(text) from public,anon,authenticated;
grant execute on function public.reserve_flow_living_documents_signup(uuid,text,text,text,text,text,text,text,jsonb) to service_role;
grant execute on function public.finish_flow_living_documents_signup(uuid,integer,text) to service_role;
grant execute on function public.confirm_flow_living_documents_subscription(text) to service_role;
