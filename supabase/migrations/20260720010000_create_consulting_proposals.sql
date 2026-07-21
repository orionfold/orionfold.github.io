-- G-051: immutable, non-binding consulting proposal requests.
create table if not exists public.consulting_proposals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  proposal_number text not null unique,
  proposal_version integer not null default 1 check (proposal_version = 1),
  created_at timestamptz not null default now(),
  full_name text not null,
  business_email text not null,
  company_name text not null,
  request_description text not null,
  snapshot jsonb not null,
  binding_status text not null default 'non_binding_request' check (binding_status = 'non_binding_request'),
  request_state text not null default 'received' check (request_state = 'received'),
  notification_status text not null default 'pending' check (notification_status in ('pending', 'sent', 'failed')),
  notification_sent_at timestamptz,
  request_fingerprint text not null,
  user_agent text not null default '',
  constraint consulting_snapshot_is_object check (jsonb_typeof(snapshot) = 'object')
);

create index if not exists consulting_proposals_rate_limit_idx
  on public.consulting_proposals (request_fingerprint, created_at desc);

alter table public.consulting_proposals enable row level security;
revoke all on public.consulting_proposals from anon, authenticated;

create or replace function public.protect_consulting_proposal_snapshot()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.request_id is distinct from old.request_id
    or new.proposal_number is distinct from old.proposal_number
    or new.proposal_version is distinct from old.proposal_version
    or new.created_at is distinct from old.created_at
    or new.full_name is distinct from old.full_name
    or new.business_email is distinct from old.business_email
    or new.company_name is distinct from old.company_name
    or new.request_description is distinct from old.request_description
    or new.snapshot is distinct from old.snapshot
    or new.binding_status is distinct from old.binding_status
    or new.request_state is distinct from old.request_state
    or new.request_fingerprint is distinct from old.request_fingerprint
    or new.user_agent is distinct from old.user_agent
  then
    raise exception 'consulting proposal request fields are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists consulting_proposal_snapshot_immutable on public.consulting_proposals;
create trigger consulting_proposal_snapshot_immutable
before update on public.consulting_proposals
for each row execute function public.protect_consulting_proposal_snapshot();
