-- Reply-based unsubscribe (B14): make an opt-out sent as a REPLY write the same
-- suppression row as an opt-out sent through the one-click footer link.
--
-- Context: 20260816164500_suppress_reply_unsubscribe.sql honored one such reply
-- by hand and called out the durable fix as "automate reply-based unsubscribes".
-- This is that fix's schema half.
--
-- Two changes:
--
-- 1. Widen the `reason` CHECK to admit 'reply_unsubscribe'.
--    We deliberately do NOT reuse the existing 'unsubscribe' reason. Both revoke
--    consent identically and both must gate sends identically, but they carry
--    different evidence: 'unsubscribe' means a tokenized link we minted was
--    clicked, which is proof the request came from the address holder.
--    'reply_unsubscribe' means we READ a request out of free text, which is a
--    weaker claim and one a classifier can get wrong. Keeping them distinct
--    means the audit trail never overstates its evidence, and a future
--    classifier bug is auditable (and reversible) as a bounded set of rows
--    instead of being indistinguishable from real link clicks.
--    Consumers that gate sends must treat every reason as suppressed - marketing's
--    drain already selects the whole table rather than filtering by reason.

alter table public.suppressions
  drop constraint if exists suppressions_reason_check;

alter table public.suppressions
  add constraint suppressions_reason_check
  check (reason in ('unsubscribe', 'bounce', 'complaint', 'reply_unsubscribe'));

-- 2. A queue for replies the classifier will not decide on its own.
--    The classifier escalates ambiguous phrasing ("not interested", "wrong
--    person") instead of guessing, because a false-positive suppression is
--    silent and effectively permanent. Those land here for a human, and are NOT
--    suppressions - nothing reads this table to gate a send.
--
--    We store the sender address and the classifier's matched rule, never the
--    reply body: the body is the person's own words and has no reason to leave
--    the mail system. `email_id` is Resend's handle, so an operator can open the
--    original in Resend when they need the full context to make the call.

create table if not exists public.reply_reviews (
  id           bigint generated always as identity primary key,
  email        text not null,
  email_id     text,
  subject      text,
  matched_rule text,
  resolved_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists reply_reviews_unresolved_idx
  on public.reply_reviews (created_at)
  where resolved_at is null;

-- Service-role only, same posture as suppressions / email_tokens: RLS on, no
-- policy granted, so nothing but the service role can read it.
alter table public.reply_reviews enable row level security;
