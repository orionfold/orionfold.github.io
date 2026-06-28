-- A12 consent backfill — helper queries (NOT a migration; run by hand).
-- Run §1 BEFORE the backfill, §2 AFTER, to confirm the change. Read-only.

-- ── §1. BEFORE: how many rows will the backfill touch, and is the held
--        mailable contact among them? ──────────────────────────────────────
SELECT
  count(*)                                                    AS total_rows,
  count(*) FILTER (WHERE consent_text IS NULL)                AS null_consent,
  count(*) FILTER (WHERE consent_text IS NULL AND confirmed)  AS null_confirmed_mailable,
  count(*) FILTER (WHERE consent_text IS NOT NULL)            AS has_consent
FROM public.waitlist;

-- ── §2. AFTER: expect null_consent = 0 and every backfilled row stamped.
--        (Re-run §1 too: null_consent should now be 0.) ───────────────────
SELECT
  count(*) FILTER (WHERE consent_text IS NULL)                          AS still_null,
  count(*) FILTER (WHERE metadata ? 'consent_backfill')                 AS stamped_backfill,
  count(*) FILTER (WHERE confirmed AND metadata ? 'consent_backfill')   AS confirmed_backfilled
FROM public.waitlist;
