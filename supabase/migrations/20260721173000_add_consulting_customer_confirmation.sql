-- Track the customer's proposal-copy email independently from the operator alert.
-- Existing immutable proposal/request fields remain protected by the original
-- trigger; only the two delivery lifecycles may change after insertion.
alter table public.consulting_proposals
  add column customer_confirmation_status text not null default 'pending'
    check (customer_confirmation_status in ('pending', 'sent', 'failed')),
  add column customer_confirmation_sent_at timestamptz;
