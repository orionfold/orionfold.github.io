-- Flow enterprise pricing enquiries. The browser receives only a request ID and
-- alert status; structured contact details remain service-role-only.
create table if not exists public.flow_enterprise_enquiries (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 1 and 254),
  company text not null check (char_length(company) between 1 and 200),
  requirements text not null check (char_length(requirements) between 1 and 6000),
  licenses integer not null check (licenses between 1 and 100000),
  heard_about text check (heard_about is null or char_length(heard_about) between 1 and 240),
  source text not null default 'flow_pricing' check (source = 'flow_pricing'),
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  alert_status text not null default 'pending' check (alert_status in ('pending', 'sent', 'failed')),
  alert_attempted_at timestamptz,
  alert_sent_at timestamptz,
  alert_error_code text check (alert_error_code is null or char_length(alert_error_code) between 1 and 80),
  alert_provider_id text check (alert_provider_id is null or char_length(alert_provider_id) between 1 and 200),
  alert_requires_manual_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint flow_enterprise_alert_sent_consistent check (
    (alert_status = 'sent' and alert_sent_at is not null and alert_error_code is null and alert_provider_id is not null)
    or (alert_status <> 'sent' and alert_sent_at is null)
  ),
  constraint flow_enterprise_manual_review_consistent check (
    not alert_requires_manual_review
    or (alert_status = 'failed' and alert_error_code = 'manual_review_required')
  )
);

create index if not exists flow_enterprise_enquiries_rate_limit_idx
  on public.flow_enterprise_enquiries (request_fingerprint, created_at desc);

alter table public.flow_enterprise_enquiries enable row level security;
alter table public.flow_enterprise_enquiries force row level security;
revoke all on public.flow_enterprise_enquiries from public, anon, authenticated;
grant select on public.flow_enterprise_enquiries to service_role;
grant update (
  alert_status,
  alert_attempted_at,
  alert_sent_at,
  alert_error_code,
  alert_provider_id,
  alert_requires_manual_review,
  updated_at
) on public.flow_enterprise_enquiries to service_role;

create or replace function public.protect_flow_enterprise_enquiry()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.request_id is distinct from old.request_id
    or new.name is distinct from old.name
    or new.email is distinct from old.email
    or new.company is distinct from old.company
    or new.requirements is distinct from old.requirements
    or new.licenses is distinct from old.licenses
    or new.heard_about is distinct from old.heard_about
    or new.source is distinct from old.source
    or new.request_fingerprint is distinct from old.request_fingerprint
    or new.payload_hash is distinct from old.payload_hash
    or new.created_at is distinct from old.created_at
    or (
      old.alert_attempted_at is not null
      and new.alert_attempted_at is distinct from old.alert_attempted_at
    )
  then
    raise exception 'flow enterprise enquiry request fields are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists flow_enterprise_enquiry_immutable
  on public.flow_enterprise_enquiries;
create trigger flow_enterprise_enquiry_immutable
before update on public.flow_enterprise_enquiries
for each row execute function public.protect_flow_enterprise_enquiry();

create or replace function public.save_flow_enterprise_enquiry(
  p_request_id uuid,
  p_name text,
  p_email text,
  p_company text,
  p_requirements text,
  p_licenses integer,
  p_heard_about text,
  p_request_fingerprint text,
  p_payload_hash text
)
returns table (
  result text,
  id uuid,
  request_id uuid,
  payload_hash text,
  alert_status text,
  alert_attempted_at timestamptz,
  alert_requires_manual_review boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  existing public.flow_enterprise_enquiries%rowtype;
  inserted public.flow_enterprise_enquiries%rowtype;
begin
  -- One request UUID and one fingerprint are each serialized. This makes both
  -- idempotency and the five-per-hour threshold hold under concurrent calls.
  perform pg_advisory_xact_lock(hashtextextended('flow-enterprise-request:' || p_request_id::text, 0));
  select * into existing
    from public.flow_enterprise_enquiries as enquiry
    where enquiry.request_id = p_request_id;
  if found then
    return query select 'existing', existing.id, existing.request_id,
      existing.payload_hash, existing.alert_status, existing.alert_attempted_at,
      existing.alert_requires_manual_review;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('flow-enterprise-fingerprint:' || p_request_fingerprint, 0));
  if (
    select count(*) >= 5
    from public.flow_enterprise_enquiries as enquiry
    where enquiry.request_fingerprint = p_request_fingerprint
      and enquiry.created_at >= now() - interval '1 hour'
  ) then
    return query select 'rate_limited', null::uuid, null::uuid, null::text,
      null::text, null::timestamptz, null::boolean;
    return;
  end if;

  insert into public.flow_enterprise_enquiries (
    request_id,
    name,
    email,
    company,
    requirements,
    licenses,
    heard_about,
    request_fingerprint,
    payload_hash
  ) values (
    p_request_id,
    p_name,
    p_email,
    p_company,
    p_requirements,
    p_licenses,
    p_heard_about,
    p_request_fingerprint,
    p_payload_hash
  ) returning * into inserted;

  return query select 'created', inserted.id, inserted.request_id,
    inserted.payload_hash, inserted.alert_status, inserted.alert_attempted_at,
    inserted.alert_requires_manual_review;
end;
$$;

revoke all on function public.protect_flow_enterprise_enquiry() from public, anon, authenticated;
revoke all on function public.save_flow_enterprise_enquiry(uuid, text, text, text, text, integer, text, text, text)
  from public, anon, authenticated;
grant execute on function public.save_flow_enterprise_enquiry(uuid, text, text, text, text, integer, text, text, text)
  to service_role;
