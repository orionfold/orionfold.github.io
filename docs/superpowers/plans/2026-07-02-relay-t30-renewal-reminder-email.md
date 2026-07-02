# Relay T-30 Renewal Reminder Email — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a service-role edge function `renewal-reminder` that, once a day, emails each active Relay license holder ~30 days before expiry a value-recap renewal reminder, exactly once per license year.

**Architecture:** New Supabase edge function (`verify_jwt = false`, guarded by a `RENEWAL_REMINDER_TOKEN` constant-time bearer check — same idiom as `admin-issue-license`/`purchases-export`/`resend-send`). It queries `fe_entitlements` with the service-role key, selects Relay licenses in a 28–31 day window not yet reminded, sends via the same direct-Resend POST `stripe-webhook` uses, and stamps a new `renewal_reminded_at` column. A GitHub Actions cron POSTs to it daily.

**Tech Stack:** Deno (Supabase Edge Functions), `@supabase/supabase-js@2` via esm.sh, Resend HTTP API, GitHub Actions cron.

## Global Constraints

- **No phone-home / no install-state:** the email is built ONLY from `fe_entitlements` data + public release history. It must NEVER imply what the customer did/didn't install ("you haven't installed X" is forbidden).
- **D4 promise verbatim:** `Your packs are yours forever. Renewal gets you the year's new and updated packs and priority support.`
- **Never a threat:** no "stop working" / "locked" / "lose access" framing anywhere.
- **House copy rule:** grade 3–5 English, no em-dashes, explain jargon.
- **CAN-SPAM:** `EMAIL_FOOTER` (Orionfold LLC postal address + opt-out) auto-appended to every send; from `Orionfold <manav@updates.orionfold.com>`, reply-to `manav@orionfold.com`.
- **Only email allowed in tracked files:** `manav@orionfold.com`.
- **verify_jwt = false** for this fn; the constant-time token check is the sole gate.
- **Supabase client idiom:** `createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } })`.
- **Deploy is operator-gated:** all work in this plan is local/reversible. STOP before `supabase db push`, `supabase functions deploy`, setting the secret, or enabling the cron.

## File Structure

- `supabase/migrations/20260702000000_add_renewal_reminded_at.sql` — new; adds `renewal_reminded_at timestamptz` to `fe_entitlements`.
- `supabase/functions/renewal-reminder/index.ts` — new; the function + pure helpers (`authorized`, `selectDue`, `renewalEmailText`, `containsThreat`).
- `supabase/functions/renewal-reminder/index.test.ts` — new; Deno unit tests (no live send).
- `supabase/config.toml` — modify; add `[functions.renewal-reminder] verify_jwt = false` block.
- `.github/workflows/renewal-reminder.yml` — new; daily cron that POSTs to the deployed fn.

---

### Task 1: Migration — `renewal_reminded_at` column

**Files:**
- Create: `supabase/migrations/20260702000000_add_renewal_reminded_at.sql`

**Interfaces:**
- Produces: column `fe_entitlements.renewal_reminded_at timestamptz` (nullable), read/written by Task 2.

- [ ] **Step 1: Write the migration**

```sql
-- Relay T-30 renewal reminder (PLG-4a Website half). One nullable timestamp marks
-- that the T-30 renewal-value-recap email was sent for this license year, so the
-- daily renewal-reminder edge fn sends exactly once. Distinct from delivered_at
-- (which tracks the FULFILMENT email); reusing that would either break fulfilment
-- tracking or re-send the reminder daily. Additive, no backfill: existing rows are
-- NULL = not yet reminded, which is correct (they enter the window on their own dates).
ALTER TABLE public.fe_entitlements
  ADD COLUMN IF NOT EXISTS renewal_reminded_at timestamptz;
```

- [ ] **Step 2: Validate SQL parses locally (no live push)**

Run: `test -f supabase/migrations/20260702000000_add_renewal_reminded_at.sql && grep -q renewal_reminded_at supabase/migrations/20260702000000_add_renewal_reminded_at.sql && echo OK`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260702000000_add_renewal_reminded_at.sql
git commit -m "feat(relay): fe_entitlements.renewal_reminded_at for T-30 reminder idempotency"
```

---

### Task 2: The `renewal-reminder` edge function + tests

**Files:**
- Create: `supabase/functions/renewal-reminder/index.ts`
- Test: `supabase/functions/renewal-reminder/index.test.ts`

**Interfaces:**
- Consumes: `fe_entitlements` columns `email, tier, status, expires_at, renewal_reminded_at, license_id` (Task 1 added the last one's write target).
- Produces (exported pure helpers, for tests):
  - `authorized(headers: Headers, expected: string): boolean`
  - `selectDue(rows: EntRow[], now: Date): EntRow[]` where `EntRow = { license_id: string; email: string; tier: string; status: string; expires_at: string; renewal_reminded_at: string | null }`
  - `renewalEmailText(): string`
  - `containsThreat(text: string): boolean`

- [ ] **Step 1: Write the failing tests**

```ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { authorized, selectDue, renewalEmailText, containsThreat, type EntRow } from "./index.ts";

const NOW = new Date("2026-07-02T00:00:00Z");
function row(p: Partial<EntRow>): EntRow {
  return { license_id: "OF-FE-2026-0001", email: "buyer@example.com", tier: "relay", status: "active", expires_at: "2027-01-01T00:00:00Z", renewal_reminded_at: null, ...p };
}
function daysOut(n: number): string { return new Date(NOW.getTime() + n * 86400000).toISOString(); }

Deno.test("authorized: exact bearer token passes, others fail", () => {
  const h = (v: string) => new Headers({ Authorization: v });
  assert(authorized(h("Bearer secret"), "secret"));
  assert(!authorized(h("Bearer wrong"), "secret"));
  assert(!authorized(h("secret"), "secret"));
  assert(!authorized(h("Bearer secret"), ""));
});

Deno.test("selectDue: 30-days-out relay license is selected", () => {
  const due = selectDue([row({ expires_at: daysOut(30) })], NOW);
  assertEquals(due.length, 1);
});

Deno.test("selectDue: excludes outside the 28-31 day band", () => {
  const rows = [row({ expires_at: daysOut(60) }), row({ expires_at: daysOut(10) }), row({ expires_at: daysOut(27) }), row({ expires_at: daysOut(32) })];
  assertEquals(selectDue(rows, NOW).length, 0);
});

Deno.test("selectDue: excludes already-reminded, non-active, non-relay", () => {
  const rows = [
    row({ expires_at: daysOut(30), renewal_reminded_at: "2026-06-01T00:00:00Z" }),
    row({ expires_at: daysOut(30), status: "canceled" }),
    row({ expires_at: daysOut(30), tier: "field-edition" }),
  ];
  assertEquals(selectDue(rows, NOW).length, 0);
});

Deno.test("renewalEmailText: carries the D4 sentence verbatim and the renewal CTA", () => {
  const t = renewalEmailText();
  assert(t.includes("Your packs are yours forever. Renewal gets you the year's new and updated packs and priority support."));
  assert(t.includes("https://orionfold.com/relay/"));
  assert(t.includes("relay pack update relay-agency-pro"));
});

Deno.test("renewalEmailText: contains NO threat language", () => {
  assert(!containsThreat(renewalEmailText()));
});

Deno.test("containsThreat: catches forbidden phrases", () => {
  assert(containsThreat("your packs will stop working"));
  assert(containsThreat("you will lose access"));
  assert(!containsThreat("your packs are yours forever"));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `deno test supabase/functions/renewal-reminder/index.test.ts --allow-env --no-lock`
Expected: FAIL (module `./index.ts` not found / exports missing).

- [ ] **Step 3: Write the implementation**

```ts
// renewal-reminder: T-30 Relay license renewal value-recap email (PLG-4a Website half,
// _RELAY later-9/later-10). Daily cron POSTs here; we select active Relay licenses ~30
// days from expiry that have not been reminded, send the recap email, and stamp
// renewal_reminded_at so each license year is reminded exactly once.
//
// No phone-home: we CANNOT see customer installs. The email recaps what the license year
// SHIPPED (public release history), never what the customer did or didn't install. That
// honesty constraint is load-bearing (_RELAY later-9). verify_jwt = false; the
// constant-time RENEWAL_REMINDER_TOKEN check is the sole gate, like the exports.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EMAIL_FOOTER } from "../_shared/email-footer.ts";

const AUTH_PREFIX = "Bearer ";
const FROM = "Orionfold <manav@updates.orionfold.com>";
const REPLY_TO = "manav@orionfold.com";
const SUBJECT = "Your Orionfold Relay license renews in 30 days";

// The 28-31 day band (a band, not a single day, so a missed cron run never skips a cohort).
const WINDOW_MIN_DAYS = 28;
const WINDOW_MAX_DAYS = 31;
const DAY_MS = 86400000;

export interface EntRow {
  license_id: string;
  email: string;
  tier: string;
  status: string;
  expires_at: string;
  renewal_reminded_at: string | null;
}

// Constant-time shared-credential compare (same posture as resend-send/purchases-export).
export function authorized(headers: Headers, expected: string): boolean {
  if (!expected) return false;
  const auth = headers.get("Authorization") || "";
  if (!auth.startsWith(AUTH_PREFIX)) return false;
  const provided = auth.slice(AUTH_PREFIX.length);
  const enc = new TextEncoder();
  const a = enc.encode(provided);
  const b = enc.encode(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// Pure selection so the window logic is unit-tested without a DB. The SQL query below
// pre-filters status/tier/reminded for efficiency; this re-applies the full predicate as
// the authoritative gate (defense in depth against a loosened query).
export function selectDue(rows: EntRow[], now: Date): EntRow[] {
  const lo = now.getTime() + WINDOW_MIN_DAYS * DAY_MS;
  const hi = now.getTime() + WINDOW_MAX_DAYS * DAY_MS;
  return rows.filter((r) => {
    if (r.status !== "active") return false;
    if (r.tier !== "relay") return false;
    if (r.renewal_reminded_at) return false;
    const exp = new Date(r.expires_at).getTime();
    return exp >= lo && exp <= hi;
  });
}

// The year's evidence line mirrors the Relay repo's single recap source
// (src/lib/packs/templates/relay-agency-pro/pack.yaml -> changelog:). Refresh this one
// constant whenever Relay flags a new changelog line on _RELAY (standing obligation).
const YEAR_EVIDENCE =
  "Your license year included Agency Pro v0.2.0, the Nonprofit deep chapter: a grant " +
  "pipeline that takes every opportunity from a scored go or no-go, through the letter " +
  "of intent and the full application, to post-award compliance with a reporting calendar.";

export function renewalEmailText(): string {
  return `Your Orionfold Relay license renews in about 30 days.

First, the promise, so there is no worry:

Your packs are yours forever. Renewal gets you the year's new and updated packs and priority support.

Nothing you installed will stop working. Renewal buys the next year of new and updated packs.

Here is what your license year shipped:

${YEAR_EVIDENCE}

If you have not pulled that update yet, one command gets it:

relay pack update relay-agency-pro

To renew for another year, go to:

https://orionfold.com/relay/

If you have any questions, just reply to this email.

${EMAIL_FOOTER}`;
}

// Guardrail: the copy must never imply packs stop working. Tested against the live copy.
const THREAT_PHRASES = ["stop working", "will be locked", "lose access", "expire and stop", "cease to function"];
export function containsThreat(text: string): boolean {
  const t = text.toLowerCase();
  return THREAT_PHRASES.some((p) => t.includes(p));
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function supabaseAdmin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
}

async function sendRenewalEmail(to: string): Promise<void> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, reply_to: REPLY_TO, to: [to], subject: SUBJECT, text: renewalEmailText() }),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error("Resend error:", res.status, detail);
    throw new Error(`Resend API error: ${res.status}`);
  }
}

if (import.meta.main) {
  Deno.serve(async (req) => {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const expected = Deno.env.get("RENEWAL_REMINDER_TOKEN") ?? "";
    if (!authorized(req.headers, expected)) return json({ error: "Unauthorized" }, 401);

    const now = new Date();
    const lo = new Date(now.getTime() + WINDOW_MIN_DAYS * DAY_MS).toISOString();
    const hi = new Date(now.getTime() + WINDOW_MAX_DAYS * DAY_MS).toISOString();

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("fe_entitlements")
      .select("license_id,email,tier,status,expires_at,renewal_reminded_at")
      .eq("status", "active")
      .eq("tier", "relay")
      .is("renewal_reminded_at", null)
      .gte("expires_at", lo)
      .lte("expires_at", hi);

    if (error) {
      console.error("fe_entitlements query error:", error.message);
      return json({ error: "query failed" }, 500);
    }

    const due = selectDue((data ?? []) as EntRow[], now);
    let sent = 0;
    let errors = 0;
    for (const r of due) {
      try {
        await sendRenewalEmail(r.email);
        const { error: stampError } = await supabase
          .from("fe_entitlements")
          .update({ renewal_reminded_at: new Date().toISOString() })
          .eq("license_id", r.license_id);
        if (stampError) { console.error("stamp error:", r.license_id, stampError.message); errors++; continue; }
        sent++;
      } catch (e) {
        console.error("send error:", r.license_id, (e as Error).message);
        errors++;
      }
    }

    return json({ scanned: due.length, sent, errors });
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `deno test supabase/functions/renewal-reminder/index.test.ts --allow-env --no-lock`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/renewal-reminder/index.ts supabase/functions/renewal-reminder/index.test.ts
git commit -m "feat(relay): renewal-reminder edge fn — T-30 value-recap email (PLG-4a)"
```

---

### Task 3: Register the function in config.toml

**Files:**
- Modify: `supabase/config.toml` (append after the `[functions.resend-send]` block near line 431)

**Interfaces:**
- Consumes: nothing. Produces: the `verify_jwt = false` registration the deploy reads.

- [ ] **Step 1: Add the block**

Append after the `[functions.resend-send]` block:

```toml
# renewal-reminder (PLG-4a): daily T-30 Relay renewal value-recap email, gated by its own
# RENEWAL_REMINDER_TOKEN shared credential (server-to-server, no browser caller). verify_jwt
# off so our constant-time token check is the sole gate, like the exports.
[functions.renewal-reminder]
verify_jwt = false
```

- [ ] **Step 2: Verify it parses (grep)**

Run: `grep -A1 "functions.renewal-reminder" supabase/config.toml`
Expected: shows the block with `verify_jwt = false`.

- [ ] **Step 3: Commit**

```bash
git add supabase/config.toml
git commit -m "chore(relay): register renewal-reminder fn (verify_jwt=false)"
```

---

### Task 4: GitHub Actions daily cron

**Files:**
- Create: `.github/workflows/renewal-reminder.yml`

**Interfaces:**
- Consumes: repo secrets `RENEWAL_REMINDER_URL` (the deployed fn URL) + `RENEWAL_REMINDER_TOKEN`. Produces: a daily authenticated POST.

- [ ] **Step 1: Write the workflow**

```yaml
# Daily T-30 Relay renewal reminder. POSTs to the token-guarded renewal-reminder edge fn;
# the fn itself selects due licenses and sends. Manual dispatch allowed for a smoke run.
# Secrets: RENEWAL_REMINDER_URL (deployed fn endpoint), RENEWAL_REMINDER_TOKEN (bearer).
name: renewal-reminder
on:
  schedule:
    - cron: "0 15 * * *" # 15:00 UTC daily (mid-morning US)
  workflow_dispatch: {}
jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - name: POST to renewal-reminder edge function
        run: |
          set -euo pipefail
          code=$(curl -sS -o /tmp/body.json -w "%{http_code}" -X POST \
            -H "Authorization: Bearer ${{ secrets.RENEWAL_REMINDER_TOKEN }}" \
            "${{ secrets.RENEWAL_REMINDER_URL }}")
          echo "HTTP $code"; cat /tmp/body.json
          test "$code" = "200"
```

- [ ] **Step 2: Validate YAML**

Run: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/renewal-reminder.yml'))" && echo OK`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/renewal-reminder.yml
git commit -m "ci(relay): daily cron for the T-30 renewal reminder"
```

---

### Task 5: Verify + STOP for operator deploy

**Files:** none (verification only).

- [ ] **Step 1: Full test run**

Run: `deno test supabase/functions/renewal-reminder/index.test.ts --allow-env --no-lock`
Expected: PASS.

- [ ] **Step 2: Site build sanity (edge fns are excluded, but confirm nothing else broke)**

Run: `npm run build`
Expected: build succeeds (page count unchanged from prior builds; edge fns are not part of the Astro build).

- [ ] **Step 3: Draft the `_RELAY` handback** (on disk only — never commit/push the strategy repo)

Append a newest-first `Website→Relay` entry to `strategy/relay/_RELAY.md` noting later-9/later-10 is BUILT (fn + migration + cron), copy aligned verbatim to the canonical pieces, pending operator deploy; restate the standing obligation to refresh `YEAR_EVIDENCE` when Relay flags a new changelog line.

- [ ] **Step 4: STOP — present the deploy checklist to the operator**

Do NOT run these. Present them for explicit go:
- `supabase db push` (applies Task 1 migration)
- `supabase functions deploy renewal-reminder --no-verify-jwt` (project `lgnmmcxvwdnusvfpguvf`)
- set `RENEWAL_REMINDER_TOKEN` secret (`supabase secrets set …`; secret-only, never on disk)
- add GitHub repo secrets `RENEWAL_REMINDER_URL` + `RENEWAL_REMINDER_TOKEN`, then enable/dispatch the workflow
- smoke: `workflow_dispatch` once, confirm `{scanned,sent,errors}` and (if any due) a real send.
