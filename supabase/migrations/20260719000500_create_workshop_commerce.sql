-- G-034 — account-free workshop purchase, rotating access, and refund state.
-- Additive only. Browser roles receive no table policy or function privilege;
-- all transitions run through service-role Edge Functions.

create table public.workshop_entitlements (
  id uuid primary key default gen_random_uuid(),
  purchase_id bigint not null unique references public.purchases(id) on delete restrict,
  stripe_session_id text not null unique,
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  lookup_key text not null check (lookup_key = 'workshop_relay_operator_founding'),
  offering_id text not null check (offering_id = 'relay-operator-workshop'),
  edition_id text not null check (edition_id = 'relay-operator-workshop-2026-07-founding'),
  edition_version text not null check (edition_version = '2026.07'),
  edition_hash text not null check (edition_hash = '669d04da5d429d937e7f94c46eafbd1903e3016655c6555285ef39871137a966'),
  email text not null check (email = lower(email) and length(email) <= 254),
  amount_total integer not null check (amount_total >= 0),
  currency text not null check (currency = lower(currency) and length(currency) = 3),
  paid_at timestamptz not null,
  refund_deadline timestamptz not null,
  state text not null default 'pending' check (
    state in ('pending', 'active', 'delivery_retrying', 'refund_pending', 'refunded', 'delivery_blocked')
  ),
  access_generation integer not null default 0 check (access_generation >= 0),
  delivery_attempts integer not null default 0 check (delivery_attempts >= 0),
  last_delivery_error_code text,
  next_retry_at timestamptz,
  delivered_at timestamptz,
  stripe_refund_id text unique,
  refund_status text,
  refund_requested_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (refund_deadline = paid_at + interval '14 days')
);

create index workshop_entitlements_email_idx
  on public.workshop_entitlements (email, created_at desc);
create index workshop_entitlements_payment_intent_idx
  on public.workshop_entitlements (stripe_payment_intent_id);

create table public.workshop_refund_requests (
  id uuid primary key default gen_random_uuid(),
  entitlement_id uuid not null unique references public.workshop_entitlements(id) on delete cascade,
  idempotency_key text not null unique,
  status text not null check (
    status in ('confirmation_sent', 'pending', 'succeeded', 'failed', 'canceled', 'late_review')
  ),
  stripe_refund_id text unique,
  confirmation_sent_at timestamptz,
  confirmed_at timestamptz,
  attempted_at timestamptz,
  result_at timestamptz,
  safe_failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workshop_tokens (
  id uuid primary key default gen_random_uuid(),
  entitlement_id uuid not null references public.workshop_entitlements(id) on delete cascade,
  refund_request_id uuid references public.workshop_refund_requests(id) on delete cascade,
  purpose text not null check (purpose in ('access', 'refund')),
  generation integer not null check (generation >= 1),
  token_sha256 text not null unique check (length(token_sha256) = 43),
  state text not null default 'active' check (state in ('active', 'used', 'revoked')),
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (purpose = 'access' and refund_request_id is null) or
    (purpose = 'refund' and refund_request_id is not null)
  )
);

create unique index workshop_tokens_active_access_idx
  on public.workshop_tokens (entitlement_id, generation)
  where purpose = 'access' and state = 'active';

create table public.workshop_requests (
  id uuid primary key,
  kind text not null check (kind in ('initial-delivery', 'reaccess', 'refund')),
  request_hash text not null,
  email_window_hash text not null,
  ip_window_hash text not null,
  entitlement_id uuid references public.workshop_entitlements(id) on delete set null,
  token_generation integer,
  status text not null check (
    status in ('accepted', 'rate_limited', 'not_found', 'sent', 'failed', 'ineligible')
  ),
  attempts integer not null default 1 check (attempts >= 1),
  safe_failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workshop_requests_rate_idx
  on public.workshop_requests (kind, email_window_hash, ip_window_hash, created_at desc);

alter table public.workshop_entitlements enable row level security;
alter table public.workshop_tokens enable row level security;
alter table public.workshop_requests enable row level security;
alter table public.workshop_refund_requests enable row level security;

revoke all on public.workshop_entitlements from public, anon, authenticated;
revoke all on public.workshop_tokens from public, anon, authenticated;
revoke all on public.workshop_requests from public, anon, authenticated;
revoke all on public.workshop_refund_requests from public, anon, authenticated;
grant all on public.workshop_entitlements to service_role;
grant all on public.workshop_tokens to service_role;
grant all on public.workshop_requests to service_role;
grant all on public.workshop_refund_requests to service_role;

-- Atomically rotate access. The caller derives the next generation's raw token,
-- passes only its SHA-256, and retries if another request won the row lock.
create or replace function public.rotate_workshop_access(
  p_entitlement_id uuid,
  p_expected_generation integer,
  p_token_sha256 text,
  p_expires_at timestamptz
) returns table(applied boolean, generation integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_generation integer;
  current_state text;
begin
  select access_generation, state
    into current_generation, current_state
    from public.workshop_entitlements
    where id = p_entitlement_id
    for update;

  if not found or current_state not in ('pending', 'active', 'delivery_retrying', 'refund_pending') then
    return query select false, coalesce(current_generation, 0);
    return;
  end if;
  if current_generation <> p_expected_generation then
    return query select false, current_generation;
    return;
  end if;

  update public.workshop_tokens
    set state = 'revoked', revoked_at = now()
    where entitlement_id = p_entitlement_id and purpose = 'access' and state = 'active';

  insert into public.workshop_tokens (
    entitlement_id, purpose, generation, token_sha256, expires_at
  ) values (
    p_entitlement_id, 'access', current_generation + 1, p_token_sha256, p_expires_at
  );

  update public.workshop_entitlements
    set access_generation = current_generation + 1,
        delivery_attempts = delivery_attempts + 1,
        state = case when state = 'refund_pending' then state else 'delivery_retrying' end,
        updated_at = now()
    where id = p_entitlement_id;

  return query select true, current_generation + 1;
end;
$$;

create or replace function public.apply_workshop_refund_result(
  p_payment_intent_id text,
  p_refund_id text,
  p_status text
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  entitlement_uuid uuid;
  mapped_status text;
  current_refund_status text;
begin
  mapped_status := case
    when p_status = 'succeeded' then 'succeeded'
    when p_status = 'failed' then 'failed'
    when p_status = 'canceled' then 'canceled'
    else 'pending'
  end;

  select id, refund_status into entitlement_uuid, current_refund_status
    from public.workshop_entitlements
    where stripe_payment_intent_id = p_payment_intent_id
    for update;
  if not found then return false; end if;

  -- Stripe does not promise webhook delivery order. A late `pending`, `failed`,
  -- or `canceled` event must never reopen an entitlement after success; a late
  -- pending event must not erase a terminal failure/cancellation either.
  if current_refund_status = 'succeeded' and mapped_status <> 'succeeded' then
    return true;
  end if;
  if mapped_status = 'pending' and current_refund_status in ('failed', 'canceled') then
    return true;
  end if;

  update public.workshop_entitlements
    set stripe_refund_id = p_refund_id,
        refund_status = mapped_status,
        state = case
          when mapped_status = 'succeeded' then 'refunded'
          when mapped_status in ('failed', 'canceled') then 'active'
          else 'refund_pending'
        end,
        refunded_at = case when mapped_status = 'succeeded' then now() else refunded_at end,
        updated_at = now()
    where id = entitlement_uuid;

  update public.workshop_refund_requests
    set stripe_refund_id = p_refund_id,
        status = mapped_status,
        result_at = case when mapped_status <> 'pending' then now() else result_at end,
        updated_at = now()
    where entitlement_id = entitlement_uuid;

  if mapped_status = 'succeeded' then
    update public.workshop_tokens
      set state = 'revoked', revoked_at = now()
      where entitlement_id = entitlement_uuid and state = 'active';
  end if;
  return true;
end;
$$;

-- Atomically admit or rate-limit a public inbox request. Keyed hashes are
-- already scoped to the 15-minute window; the advisory lock makes the count +
-- insert safe under concurrent requests without storing raw IP or request data.
create or replace function public.begin_workshop_request(
  p_id uuid,
  p_kind text,
  p_request_hash text,
  p_email_window_hash text,
  p_ip_window_hash text,
  p_entitlement_id uuid
) returns table(accepted boolean, duplicate boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  request_count integer;
begin
  if p_kind not in ('reaccess', 'refund') then
    raise exception 'invalid workshop request kind';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_kind || ':' || p_email_window_hash || ':' || p_ip_window_hash, 0));
  if exists (select 1 from public.workshop_requests where id = p_id) then
    return query select false, true;
    return;
  end if;
  select count(*) into request_count
    from public.workshop_requests
    where kind = p_kind
      and created_at >= now() - interval '15 minutes'
      and (email_window_hash = p_email_window_hash or ip_window_hash = p_ip_window_hash);
  insert into public.workshop_requests (
    id, kind, request_hash, email_window_hash, ip_window_hash,
    entitlement_id, status
  ) values (
    p_id, p_kind, p_request_hash, p_email_window_hash, p_ip_window_hash,
    p_entitlement_id,
    case when request_count >= 3 then 'rate_limited'
      when p_entitlement_id is null then 'not_found' else 'accepted' end
  );
  return query select request_count < 3, false;
end;
$$;

revoke all on function public.rotate_workshop_access(uuid, integer, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.rotate_workshop_access(uuid, integer, text, timestamptz)
  to service_role;
revoke all on function public.apply_workshop_refund_result(text, text, text)
  from public, anon, authenticated;
grant execute on function public.apply_workshop_refund_result(text, text, text)
  to service_role;
revoke all on function public.begin_workshop_request(uuid, text, text, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.begin_workshop_request(uuid, text, text, text, text, uuid)
  to service_role;

insert into storage.buckets (id, name, public, file_size_limit)
values ('workshop-files', 'workshop-files', false, 104857600)
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit;
