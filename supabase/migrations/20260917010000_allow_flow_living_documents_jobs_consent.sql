-- Vocabulary update only: retain historical permission and accept the current
-- Jobs sentence. No subscriber rows, grants, offer IDs or retry keys change.
begin;
alter table public.flow_living_documents_subscriptions
  drop constraint flow_living_documents_subscriptions_consent_text_check;
alter table public.flow_living_documents_subscriptions
  add constraint flow_living_documents_subscriptions_consent_text_check
  check (consent_text in (
    'Send me Flow updates, Living Documents methods, and the AI Native Newsletter. Up to one email a week. Unsubscribe any time.',
    'Send me Flow updates, Living Documents Jobs, and the AI Native Newsletter. Up to one email a week. Unsubscribe any time.'
  ));
commit;
