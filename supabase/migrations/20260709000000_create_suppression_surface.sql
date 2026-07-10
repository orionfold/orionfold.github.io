-- Phase-1 compliance surface (relay orionfold-website/_RELAY.md #9, 2026-07-09).
-- Two tables backing automated one-click unsubscribe + Resend bounce/complaint
-- suppression. Replaces beehiiv's daily pull-back once beehiiv is retired.
-- suppressions: written by the unsubscribe fn and the resend-webhook fn.
--   Marketing drains it read-only and matches CRM contacts BY EMAIL (the token
--   is echoed for row-shape parity, not a join key). Append-only + idempotent.
-- email_tokens: opaque email-to-token map so the unsubscribe URL carries no PII.
-- Both tables are service_role-only: RLS enabled, NO policy granted.

create table if not exists public.suppressions (
  id            bigint generated always as identity primary key,
  email         text not null,
  token         text,
  reason        text not null check (reason in ('unsubscribe', 'bounce', 'complaint')),
  suppressed_at timestamptz not null default now()
);

create index if not exists suppressions_suppressed_at_idx
  on public.suppressions (suppressed_at);

alter table public.suppressions enable row level security;

create table if not exists public.email_tokens (
  id         bigint generated always as identity primary key,
  email      text not null unique,
  token      text not null unique,
  created_at timestamptz not null default now()
);

alter table public.email_tokens enable row level security;
