-- A12 consent backfill: legacy waitlist rows captured BEFORE the 2026-06-26
-- consent wiring (20260626000000_waitlist_attribution.sql added the column) have
-- consent_text = NULL, which marketing's CRM ingests as "scope not recorded" — a
-- CAN-SPAM record gap that holds an otherwise-mailable confirmed contact
-- do-not-broadcast. Operator + marketing authorized backfilling these with the
-- canonical funnel scope (relay orionfold-marketing/_RELAY.md, 2026-06-28).
--
-- HONESTY: this is a retroactive backfill, NOT a record that this exact copy was
-- shown live. We stamp metadata.consent_backfill so the provenance stays auditable
-- (the act of consent is real — double_optin/confirmed — only the verbatim scope
-- text was missing). Idempotent: only touches rows still NULL; re-running is a
-- no-op. Going forward every form sends the canonical scope, so no new NULLs.
UPDATE public.waitlist
SET
  consent_text = 'By subscribing you agree to receive the AI For Everyone digest, one email a week, no more. You can unsubscribe any time. See our privacy policy.',
  metadata = metadata || jsonb_build_object(
    'consent_backfill', jsonb_build_object(
      'applied', '2026-06-28',
      'reason', 'A12 legacy null consent_text; canonical funnel scope',
      'note', 'retroactive backfill, not a live-capture record'
    )
  )
WHERE consent_text IS NULL;
