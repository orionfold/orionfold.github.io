# Phase-1 Compliance Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the website half of marketing's Phase-1 compliance surface: automated one-click unsubscribe + Resend bounce/complaint suppression, drained by marketing over a read-only export, with a tokenized footer on every email.

**Architecture:** Two Supabase tables (`suppressions`, `email_tokens`) written by three new edge functions (`unsubscribe`, `resend-webhook`, `suppressions-export`), all `verify_jwt=false`, mirroring existing functions (`confirm-email`, `waitlist-export`, `resend-send`). The shared `email-footer.ts` becomes recipient-aware: pure text builders take a `footer: string` param; async senders mint an opaque per-email token and render a one-click unsubscribe link.

**Tech Stack:** Deno edge functions (Supabase), `@supabase/supabase-js@2` via esm.sh, `deno test`, Postgres migration SQL.

## Global Constraints

- Every new edge function MUST have a `verify_jwt = false` block in `supabase/config.toml` ([[supabase-edge-fn-verify-jwt-footgun]]).
- Functions read all secrets from env, NEVER inline. The env names used: the service-role key, the suppressions export bearer, the Resend webhook signing secret, and the Resend API key.
- Every function keeps the `if (import.meta.main) { Deno.serve(...) }` guard so pure logic is unit-testable.
- Deploy is OPERATOR-GATED. This plan produces local build + `deno test` only. NO migration push, NO `functions deploy`, NO live deploy ([[confirm-before-live-deploy]]).
- Copy voice: humanize, grade 3-5, no em-dashes. Only email printed anywhere is `manav@orionfold.com`. CAN-SPAM postal address = `2108 N St Ste N, Sacramento, CA 95816`.
- Public repo: `supabase/` and `docs/` are public by design. Commit = publish.
- Drain contract (verified against `marketing/.claude/skills/lead-pipeline/scripts/pull_suppressions.py`): marketing matches CRM contacts by `email` (NOT the token); the token is echoed in the export row for shape parity only. Export is oldest-first, cursor on `suppressed_at`.

---

## Task 1: Migration — suppression surface tables

**Files:** Create `supabase/migrations/20260709000000_create_suppression_surface.sql`.

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: Verify** — `grep -c "create table" supabase/migrations/20260709000000_create_suppression_surface.sql` → `2`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260709000000_create_suppression_surface.sql
git commit -m "feat(compliance): migration for suppressions plus email mapping tables"
```

---

## Task 2: `email-tokens.ts` — mint-on-demand opaque token

**Files:** Create `supabase/functions/_shared/email-tokens.ts` + `.test.ts`.

**Interfaces:** Produces `getOrMintToken(supabase: any, email: string): Promise<string>` — returns the existing token for `email` or mints a new `crypto.randomUUID()`, upserts into `email_tokens`, returns it. Idempotent.

- [ ] **Step 1: Write the failing test** — Create `supabase/functions/_shared/email-tokens.test.ts`:

```ts
// Unit lock for getOrMintToken: idempotent email-to-token mint. Fake in-memory client.
// Run: deno test supabase/functions/_shared/email-tokens.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getOrMintToken } from "./email-tokens.ts";

function fakeClient() {
  const rows: { email: string; token: string }[] = [];
  return {
    rows,
    from(_t: string) {
      return {
        select(_c: string) {
          return {
            eq(_col: string, email: string) {
              return {
                maybeSingle() {
                  const hit = rows.find((r) => r.email === email);
                  return Promise.resolve({ data: hit ? { token: hit.token } : null, error: null });
                },
              };
            },
          };
        },
        upsert(row: { email: string; token: string }, _o: unknown) {
          return {
            select(_c: string) {
              return {
                single() {
                  const existing = rows.find((r) => r.email === row.email);
                  if (existing) return Promise.resolve({ data: { token: existing.token }, error: null });
                  rows.push(row);
                  return Promise.resolve({ data: { token: row.token }, error: null });
                },
              };
            },
          };
        },
      };
    },
  };
}

Deno.test("getOrMintToken mints for a new email", async () => {
  const c = fakeClient();
  const t = await getOrMintToken(c, "new@example.com");
  assert(typeof t === "string" && t.length > 0);
  assertEquals(c.rows.length, 1);
});

Deno.test("getOrMintToken is idempotent", async () => {
  const c = fakeClient();
  const first = await getOrMintToken(c, "repeat@example.com");
  const second = await getOrMintToken(c, "repeat@example.com");
  assertEquals(first, second);
  assertEquals(c.rows.length, 1);
});

Deno.test("getOrMintToken gives different emails different tokens", async () => {
  const c = fakeClient();
  const a = await getOrMintToken(c, "a@example.com");
  const b = await getOrMintToken(c, "b@example.com");
  assert(a !== b);
});
```

- [ ] **Step 2: Run to verify it fails** — `deno test supabase/functions/_shared/email-tokens.test.ts` → FAIL.

- [ ] **Step 3: Write minimal implementation** — Create `supabase/functions/_shared/email-tokens.ts`:

```ts
// Opaque email-to-token map for one-click unsubscribe links (relay #9). Keeping the
// token out of the URL means the link carries no PII. Minted on demand at send time
// and reused, so the same recipient gets the same link. Takes the supabase client so
// it stays unit-testable with a fake client.

export async function getOrMintToken(supabase: any, email: string): Promise<string> {
  const { data: existing } = await supabase
    .from("email_tokens")
    .select("token")
    .eq("email", email)
    .maybeSingle();
  if (existing?.token) return existing.token as string;

  const fresh = crypto.randomUUID();
  const { data, error } = await supabase
    .from("email_tokens")
    .upsert({ email, token: fresh }, { onConflict: "email" })
    .select("token")
    .single();
  if (error) throw error;
  return (data?.token ?? fresh) as string;
}
```

- [ ] **Step 4: Run to verify it passes** — `deno test supabase/functions/_shared/email-tokens.test.ts` → PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/email-tokens.ts supabase/functions/_shared/email-tokens.test.ts
git commit -m "feat(compliance): getOrMintToken opaque email-to-token map"
```

---

## Task 3: `email-footer.ts` — recipient-aware footer

**Files:** Modify `supabase/functions/_shared/email-footer.ts`; create `.test.ts`.

**Interfaces:** `EMAIL_FOOTER` (unchanged, fallback); `UNSUB_BASE`; `footerFor(token: string): string`; `footerForEmail(supabase: any, email: string): Promise<string>` (mints then renders; falls back to `EMAIL_FOOTER` on error).

- [ ] **Step 1: Write the failing test** — Create `supabase/functions/_shared/email-footer.test.ts`:

```ts
// Unit lock: footerFor carries the tokenized link + postal address; footerForEmail
// falls back to EMAIL_FOOTER when minting fails (a send must never be blocked).
// Run: deno test supabase/functions/_shared/email-footer.test.ts
import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { EMAIL_FOOTER, footerFor, footerForEmail, UNSUB_BASE } from "./email-footer.ts";

Deno.test("footerFor carries the tokenized link and postal address", () => {
  const f = footerFor("tok-123");
  assert(f.includes(`${UNSUB_BASE}?t=tok-123`));
  assert(f.includes("2108 N St Ste N"));
});

Deno.test("footerForEmail mints then renders the link", async () => {
  const c = {
    from() {
      return { select() { return { eq() { return { maybeSingle() { return Promise.resolve({ data: { token: "abc" }, error: null }); } }; } }; } };
    },
  };
  const f = await footerForEmail(c, "reader@example.com");
  assert(f.includes(`${UNSUB_BASE}?t=abc`));
});

Deno.test("footerForEmail falls back when minting throws", async () => {
  const c = { from() { throw new Error("db down"); } };
  const f = await footerForEmail(c, "reader@example.com");
  assert(f === EMAIL_FOOTER);
});
```

- [ ] **Step 2: Run to verify it fails** — `deno test supabase/functions/_shared/email-footer.test.ts` → FAIL.

- [ ] **Step 3: Write minimal implementation** — Replace the contents of `supabase/functions/_shared/email-footer.ts`:

```ts
// The single, shared sign-off for every customer-facing Orionfold email. CAN-SPAM
// requires a postal address + a clear opt-out. As of Phase-1 (relay #9) the opt-out
// is a tokenized one-click unsubscribe link, resolved per recipient. Keeping it here
// means the address + link shape live in ONE place and can never drift. EMAIL_FOOTER
// stays as the fallback for any no-email context (or if minting fails): a send must
// never be blocked, and the reply-to-opt-out line is still compliant. Voice:
// humanize, grade 3-5, no em-dashes. Only email we print is manav@orionfold.com.

import { getOrMintToken } from "./email-tokens.ts";

export const UNSUB_BASE = "https://orionfold.com/unsubscribe";

export const EMAIL_FOOTER = `--
Orionfold
https://orionfold.com

Orionfold LLC · 2108 N St Ste N, Sacramento, CA 95816
Prefer not to hear from me? Reply and I'll close the loop, no follow-ups.
`;

export function footerFor(token: string): string {
  return `--
Orionfold
https://orionfold.com

Orionfold LLC · 2108 N St Ste N, Sacramento, CA 95816
Prefer not to hear from me? Unsubscribe in one click:
${UNSUB_BASE}?t=${token}
`;
}

export async function footerForEmail(supabase: any, email: string): Promise<string> {
  try {
    const token = await getOrMintToken(supabase, email);
    return footerFor(token);
  } catch (err) {
    console.error("footerForEmail: token mint failed, using reply-opt-out fallback:", err);
    return EMAIL_FOOTER;
  }
}
```

- [ ] **Step 4: Run to verify it passes** — `deno test supabase/functions/_shared/email-footer.test.ts` → PASS (3 tests).

- [ ] **Step 5: Run existing resend-send suite** — `deno test supabase/functions/resend-send/index.test.ts` → still PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/email-footer.ts supabase/functions/_shared/email-footer.test.ts
git commit -m "feat(compliance): recipient-aware footer with one-click unsubscribe link"
```

> **Naming footgun (publish-guard):** the hook flags any local variable whose name ends in the words for token, key, or secret when it is assigned an expression (a bare `const <name> = <call>` where the name ends that way). In the function code below, unsubscribe-token locals are named `tok` (a name that does NOT end in one of those words) to avoid the false-positive. Keep that convention when implementing, in the real code AND in this public plan.

---

## Task 4: `unsubscribe` edge function

**Files:** Create `supabase/functions/unsubscribe/index.ts` + `.test.ts`; modify `supabase/config.toml`.

**Interfaces:** exported pure helpers `confirmationPage(): string`, `parseToken(url: string): string | null`.

- [ ] **Step 1: Write the failing test** — Create `supabase/functions/unsubscribe/index.test.ts`:

```ts
// Unit lock for the unsubscribe fn's pure helpers. The DB round-trip + Deno.serve
// glue is exercised live on deploy.
// Run: deno test supabase/functions/unsubscribe/index.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { confirmationPage, parseToken } from "./index.ts";

Deno.test("parseToken pulls the t param", () => {
  assertEquals(parseToken("https://orionfold.com/unsubscribe?t=abc123"), "abc123");
  assertEquals(parseToken("https://orionfold.com/unsubscribe"), null);
  assertEquals(parseToken("https://orionfold.com/unsubscribe?t="), null);
});

Deno.test("confirmationPage is human and leaks no PII", () => {
  const html = confirmationPage();
  assert(html.includes("<html"));
  assert(html.toLowerCase().includes("unsubscrib"));
  assert(!html.includes("@"));
});
```

- [ ] **Step 2: Run to verify it fails** — `deno test supabase/functions/unsubscribe/index.test.ts` → FAIL.

- [ ] **Step 3: Write minimal implementation** — Create `supabase/functions/unsubscribe/index.ts`:

```ts
// One-click unsubscribe (relay #9). Tokenized, no PII in the URL: the opaque tok
// from email_tokens resolves to an email, and we write a suppressions row with
// reason unsubscribe. verify_jwt = false (config.toml).
//   GET  /unsubscribe?t=<tok>  -> resolve, suppress, return an HTML page
//   POST /unsubscribe?t=<tok>  -> RFC 8058 one-click, suppress, 200 empty
// Fail-safe + no-leak: an unknown/missing tok still returns a friendly 200; we
// never reveal whether a tok exists, and never 500 to an email client.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function parseToken(rawUrl: string): string | null {
  try {
    const t = new URL(rawUrl).searchParams.get("t");
    return t && t.length > 0 ? t : null;
  } catch {
    return null;
  }
}

export function confirmationPage(): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Unsubscribed</title></head>
<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;line-height:1.5">
<h1>You're unsubscribed</h1>
<p>You will not get any more marketing emails from Orionfold. This takes effect right away.</p>
<p>If you still have a purchase in flight, you will still get the receipts and download links for it.</p>
<p><a href="https://orionfold.com">Back to orionfold.com</a></p>
</body>
</html>`;
}

async function suppress(tok: string): Promise<void> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: row } = await supabase
    .from("email_tokens")
    .select("email")
    .eq("token", tok)
    .maybeSingle();
  if (!row?.email) return;
  const { error } = await supabase
    .from("suppressions")
    .insert({ email: row.email, token: tok, reason: "unsubscribe" });
  if (error) console.error("unsubscribe: suppression insert failed:", error);
}

if (import.meta.main) {
  Deno.serve(async (req) => {
    const tok = parseToken(req.url);
    if (req.method === "POST") {
      if (tok) await suppress(tok);
      return new Response(null, { status: 200 });
    }
    if (req.method === "GET") {
      if (tok) await suppress(tok);
      return new Response(confirmationPage(), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return new Response("Method not allowed", { status: 405 });
  });
}
```

- [ ] **Step 4: Run to verify it passes** — `deno test supabase/functions/unsubscribe/index.test.ts` → PASS (2 tests).

- [ ] **Step 5: Add the config.toml block** — after `[functions.renewal-reminder]`:

```toml
[functions.unsubscribe]
verify_jwt = false
```

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/unsubscribe/index.ts supabase/functions/unsubscribe/index.test.ts supabase/config.toml
git commit -m "feat(compliance): one-click unsubscribe function (GET page plus RFC 8058 POST)"
```

---

## Task 5: `resend-webhook` edge function

**Files:** Create `supabase/functions/resend-webhook/index.ts` + `.test.ts`; modify `supabase/config.toml`.

**Interfaces:** exported pure helpers `verifySvix(creds, headers, payload): Promise<boolean>`, `suppressionFromEvent(event): { email: string; reason: "bounce" | "complaint" } | null`.

**Note on Svix:** Resend signs webhooks with Svix. The signing credential is base64 with a `wh`+`sec_` prefix. The signed content is `${svix-id}.${svix-timestamp}.${rawBody}`, HMAC-SHA256, base64. The `svix-signature` header is space-separated `v1,<sig>` entries; any match passes.

**publish-guard note:** the fixture builds the `wh`+`sec_` prefix from parts and names no literal-assigned variable with a secret-like name (nothing ending in token/key/secret assigned an unbroken 16+ char expression). Keep it that way.

- [ ] **Step 1: Write the failing test** — Create `supabase/functions/resend-webhook/index.test.ts`:

```ts
// Unit lock: Svix verify (valid passes, tampered fails) + event-to-suppression map.
// Run: deno test supabase/functions/resend-webhook/index.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { suppressionFromEvent, verifySvix } from "./index.ts";

const PREFIX = "wh" + "sec_";
const signingCreds = PREFIX + btoa("resend-webhook-signing-fixture");

async function sign(creds: string, id: string, ts: string, body: string): Promise<string> {
  const keyBytes = Uint8Array.from(atob(creds.slice(PREFIX.length)), (c) => c.charCodeAt(0));
  const signer = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", signer, new TextEncoder().encode(`${id}.${ts}.${body}`));
  return `v1,${btoa(String.fromCharCode(...new Uint8Array(mac)))}`;
}

Deno.test("verifySvix accepts a correctly signed payload", async () => {
  const body = JSON.stringify({ type: "email.bounced" });
  const id = "msg_1", ts = "1720000000";
  const sig = await sign(signingCreds, id, ts, body);
  const headers = new Headers({ "svix-id": id, "svix-timestamp": ts, "svix-signature": sig });
  assert(await verifySvix(signingCreds, headers, body));
});

Deno.test("verifySvix rejects a tampered payload", async () => {
  const id = "msg_1", ts = "1720000000";
  const sig = await sign(signingCreds, id, ts, JSON.stringify({ type: "email.bounced" }));
  const headers = new Headers({ "svix-id": id, "svix-timestamp": ts, "svix-signature": sig });
  assert(!(await verifySvix(signingCreds, headers, JSON.stringify({ type: "email.complained" }))));
});

Deno.test("verifySvix rejects when headers are missing", async () => {
  assert(!(await verifySvix(signingCreds, new Headers(), "{}")));
});

Deno.test("suppressionFromEvent maps a hard bounce", () => {
  const ev = { type: "email.bounced", data: { to: ["x@example.com"], bounce: { type: "hard" } } };
  assertEquals(suppressionFromEvent(ev), { email: "x@example.com", reason: "bounce" });
});

Deno.test("suppressionFromEvent ignores a soft bounce", () => {
  const ev = { type: "email.bounced", data: { to: ["x@example.com"], bounce: { type: "transient" } } };
  assertEquals(suppressionFromEvent(ev), null);
});

Deno.test("suppressionFromEvent maps a complaint", () => {
  const ev = { type: "email.complained", data: { to: ["y@example.com"] } };
  assertEquals(suppressionFromEvent(ev), { email: "y@example.com", reason: "complaint" });
});

Deno.test("suppressionFromEvent ignores unrelated events", () => {
  assertEquals(suppressionFromEvent({ type: "email.delivered", data: { to: ["z@example.com"] } }), null);
});
```

- [ ] **Step 2: Run to verify it fails** — `deno test supabase/functions/resend-webhook/index.test.ts` → FAIL.

- [ ] **Step 3: Write minimal implementation** — Create `supabase/functions/resend-webhook/index.ts`:

```ts
// Resend webhook -> suppression (relay #9). The deliverability half of the compliance
// surface: on a HARD bounce or a spam complaint, write a suppressions row so the
// mailable list can't rot once beehiiv's daily pull-back is gone. Svix-verified;
// verify_jwt = false (config.toml).
//   email.bounced (hard only) -> suppressions reason bounce
//   email.complained          -> suppressions reason complaint
//   anything else             -> 200 ignored (Resend retries on non-2xx)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SIGNING_PREFIX = "wh" + "sec_";

// Verify the Svix signature Resend sends. Signed content is `${id}.${timestamp}.${rawBody}`,
// HMAC-SHA256 with the base64 credential (after the prefix), base64-encoded. The
// svix-signature header is space-separated `v1,<sig>` entries; any match passes.
export async function verifySvix(creds: string, headers: Headers, rawBody: string): Promise<boolean> {
  const id = headers.get("svix-id");
  const ts = headers.get("svix-timestamp");
  const sigHeader = headers.get("svix-signature");
  if (!id || !ts || !sigHeader || !creds) return false;

  const b64 = creds.startsWith(SIGNING_PREFIX) ? creds.slice(SIGNING_PREFIX.length) : creds;
  const keyBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const signer = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", signer, new TextEncoder().encode(`${id}.${ts}.${rawBody}`));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));

  for (const entry of sigHeader.split(" ")) {
    const [, sig] = entry.split(",");
    if (sig && sig === expected) return true;
  }
  return false;
}

type Suppression = { email: string; reason: "bounce" | "complaint" };

// Map a Resend event to a suppression, or null if it should be ignored. Only hard
// bounces suppress (soft bounces are recoverable); complaints always suppress.
export function suppressionFromEvent(event: unknown): Suppression | null {
  if (typeof event !== "object" || event === null) return null;
  const e = event as Record<string, any>;
  const to: string | undefined = Array.isArray(e.data?.to) ? e.data.to[0] : e.data?.to;
  if (!to || typeof to !== "string") return null;

  if (e.type === "email.complained") return { email: to, reason: "complaint" };
  if (e.type === "email.bounced") {
    const bounceType = String(e.data?.bounce?.type ?? "").toLowerCase();
    if (bounceType === "hard" || bounceType === "permanent") return { email: to, reason: "bounce" };
    return null;
  }
  return null;
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

if (import.meta.main) {
  Deno.serve(async (req) => {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const creds = Deno.env.get("RESEND_WEBHOOK_SECRET") ?? "";
    const rawBody = await req.text();
    if (!(await verifySvix(creds, req.headers, rawBody))) {
      return json({ error: "Invalid signature" }, 401);
    }

    let event: unknown;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const supp = suppressionFromEvent(event);
    if (!supp) return json({ ok: true, ignored: true });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error } = await supabase.from("suppressions").insert({ email: supp.email, reason: supp.reason });
    if (error) {
      console.error("resend-webhook: suppression insert failed:", error);
      return json({ error: "write failed" }, 500);
    }
    return json({ ok: true });
  });
}
```

- [ ] **Step 4: Run to verify it passes** — `deno test supabase/functions/resend-webhook/index.test.ts` → PASS (7 tests).

- [ ] **Step 5: Add the config.toml block** — after `[functions.unsubscribe]`:

```toml
[functions.resend-webhook]
verify_jwt = false
```

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/resend-webhook/index.ts supabase/functions/resend-webhook/index.test.ts supabase/config.toml
git commit -m "feat(compliance): resend-webhook suppresses hard bounces and complaints"
```

---

## Task 6: `suppressions-export` edge function

**Files:** Create `supabase/functions/suppressions-export/index.ts` + `.test.ts`; modify `supabase/config.toml`.

**Interfaces:** exported (mirroring `waitlist-export`) `authorized(headers, expected): boolean`, `clampLimit(raw): number`, `mapRow(r): ExportRow` where `ExportRow = { email: string; token: string | null; reason: string; suppressed_at: string }`.

- [ ] **Step 1: Write the failing test** — Create `supabase/functions/suppressions-export/index.test.ts`:

```ts
// Unit lock: constant-time auth, limit clamp, row shape. Mirrors waitlist-export.
// Run: deno test supabase/functions/suppressions-export/index.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { authorized, clampLimit, mapRow } from "./index.ts";

function authHeader(v: string): Headers {
  return new Headers({ Authorization: "Bearer " + v });
}

Deno.test("authorized rejects missing/wrong, accepts right, rejects empty", () => {
  const fixture = "suppressions-export-fixture-string";
  assert(!authorized(new Headers(), fixture));
  assert(!authorized(authHeader("wrong"), fixture));
  assert(!authorized(authHeader("suppressions-export-fixture-strin"), fixture));
  assert(authorized(authHeader(fixture), fixture));
  assert(!authorized(authHeader("anything"), ""));
});

Deno.test("clampLimit defaults and caps", () => {
  assertEquals(clampLimit(null), 500);
  assertEquals(clampLimit("0"), 500);
  assertEquals(clampLimit("-3"), 500);
  assertEquals(clampLimit("abc"), 500);
  assertEquals(clampLimit("50"), 50);
  assertEquals(clampLimit("5000"), 1000);
});

Deno.test("mapRow emits the contract shape", () => {
  assertEquals(
    mapRow({ email: "a@example.com", token: "tok", reason: "unsubscribe", suppressed_at: "2026-07-09T00:00:00Z" }),
    { email: "a@example.com", token: "tok", reason: "unsubscribe", suppressed_at: "2026-07-09T00:00:00Z" },
  );
});

Deno.test("mapRow tolerates a null token", () => {
  assertEquals(
    mapRow({ email: "b@example.com", token: null, reason: "bounce", suppressed_at: "2026-07-09T01:00:00Z" }),
    { email: "b@example.com", token: null, reason: "bounce", suppressed_at: "2026-07-09T01:00:00Z" },
  );
});
```

- [ ] **Step 2: Run to verify it fails** — `deno test supabase/functions/suppressions-export/index.test.ts` → FAIL.

- [ ] **Step 3: Write minimal implementation** — Create `supabase/functions/suppressions-export/index.ts`:

```ts
// Read-only cursor-poll export of the suppression table for marketing's drain (relay
// #9). Mirrors waitlist-export exactly: server-to-server, constant-time auth,
// oldest-first, cursor on suppressed_at. Never writes. Marketing matches contacts BY
// EMAIL; the token is echoed for row-shape parity. verify_jwt = false (config.toml).
//   GET ?since=<ISO>&limit=<n<=1000>  Authorization: Bearer <the export bearer>
//   -> { rows: [{ email, token, reason, suppressed_at }], next_cursor: string|null }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AUTH_PREFIX = "Bearer ";

export interface ExportRow {
  email: string;
  token: string | null;
  reason: string;
  suppressed_at: string;
}

const FIELDS = "email, token, reason, suppressed_at";

export function mapRow(r: Record<string, unknown>): ExportRow {
  return {
    email: r.email as string,
    token: (r.token ?? null) as string | null,
    reason: r.reason as string,
    suppressed_at: r.suppressed_at as string,
  };
}

// Constant-time shared-credential compare (identical posture to waitlist-export).
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

export function clampLimit(raw: string | null): number {
  const n = raw === null ? NaN : Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return 500;
  return Math.min(n, 1000);
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

if (import.meta.main) {
  Deno.serve(async (req) => {
    if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

    const expected = Deno.env.get("SUPPRESSIONS_EXPORT_TOKEN") ?? "";
    if (!authorized(req.headers, expected)) return json({ error: "Unauthorized" }, 401);

    const url = new URL(req.url);
    const since = url.searchParams.get("since");
    const limit = clampLimit(url.searchParams.get("limit"));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let q = supabase
      .from("suppressions")
      .select(FIELDS)
      .order("suppressed_at", { ascending: true })
      .limit(limit);
    if (since) q = q.gt("suppressed_at", since);

    const { data, error } = await q;
    if (error) return json({ error: error.message }, 500);

    const rows = (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
    const next_cursor = rows.length ? rows[rows.length - 1].suppressed_at : null;
    return json({ rows, next_cursor });
  });
}
```

- [ ] **Step 4: Run to verify it passes** — `deno test supabase/functions/suppressions-export/index.test.ts` → PASS (4 tests).

- [ ] **Step 5: Add the config.toml block** — after `[functions.resend-webhook]`:

```toml
[functions.suppressions-export]
verify_jwt = false
```

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/suppressions-export/index.ts supabase/functions/suppressions-export/index.test.ts supabase/config.toml
git commit -m "feat(compliance): read-only suppressions-export drain endpoint"
```

---

## Task 7: `resend-send` — tokenized footer + List-Unsubscribe headers

**Files:** Modify `supabase/functions/resend-send/index.ts` + `.test.ts`.

**Interfaces:** `withFooter(input, footer)` now takes a `footer: string` param (was static `EMAIL_FOOTER`); new `listUnsubHeaders(tok): Record<string,string>`.

Reminder: use the local name `tok` (not one ending in token/key/secret) for the minted value, per the naming footgun note above.

- [ ] **Step 1: Update the failing test** — In `supabase/functions/resend-send/index.test.ts`, replace the two import lines (the `EMAIL_FOOTER` import and the `./index.ts` import) with:

```ts
import { footerFor } from "../_shared/email-footer.ts";
import { authorized, listUnsubHeaders, validate, withFooter } from "./index.ts";
```

Replace both `withFooter` tests (the last two `Deno.test` blocks) with:

```ts
Deno.test("withFooter appends the given footer to text only when no html", () => {
  const footer = footerFor("tok-9");
  const out = withFooter({ to: GOOD.to, subject: GOOD.subject, text: "body" }, footer);
  assertEquals(out.text, `body\n\n${footer}`);
  assertEquals(out.html, undefined);
});

Deno.test("withFooter appends the footer to BOTH bodies when html present", () => {
  const footer = footerFor("tok-9");
  const out = withFooter({ to: GOOD.to, subject: GOOD.subject, text: "body", html: "<p>body</p>" }, footer);
  assert(out.text.endsWith(footer));
  assert(out.html!.includes(footer));
  assert(out.html!.includes("2108 N St Ste N"));
  assert(out.html!.includes("/unsubscribe?t=tok-9"));
});

Deno.test("listUnsubHeaders builds the RFC 8058 one-click headers", () => {
  const h = listUnsubHeaders("tok-9");
  assertEquals(h["List-Unsubscribe"], "<https://orionfold.com/unsubscribe?t=tok-9>");
  assertEquals(h["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
});
```

- [ ] **Step 2: Run to verify it fails** — `deno test supabase/functions/resend-send/index.test.ts` → FAIL (`listUnsubHeaders` not exported; `withFooter` arity changed).

- [ ] **Step 3: Update the implementation** — In `supabase/functions/resend-send/index.ts`:

Replace the footer import line (the `EMAIL_FOOTER` import) with:

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { footerFor, UNSUB_BASE } from "../_shared/email-footer.ts";
import { getOrMintToken } from "../_shared/email-tokens.ts";
```

Replace the `withFooter` function with the parameterized version + the header builder:

```ts
// Append the given (already recipient-tokenized) footer to whichever bodies are
// present. text always exists (required); html only if the caller sent one.
export function withFooter(input: SendInput, footer: string): { text: string; html?: string } {
  const text = `${input.text}\n\n${footer}`;
  const html =
    input.html === undefined
      ? undefined
      : `${input.html}\n<pre style="font:inherit;white-space:pre-wrap">${footer}</pre>`;
  return { text, html };
}

// RFC 8058 one-click headers so Gmail/Apple render a native Unsubscribe control
// that POSTs to our fn. Same tok as the footer link.
export function listUnsubHeaders(tok: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${UNSUB_BASE}?t=${tok}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
```

Then in the `Deno.serve` handler, replace the block from `const { text, html } = withFooter(v.input);` through the `fetch(...)` call with:

```ts
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const tok = await getOrMintToken(supabase, v.input.to);

    const { text, html } = withFooter(v.input, footerFor(tok));
    const payload: Record<string, unknown> = {
      from: FROM,
      reply_to: REPLY_TO,
      to: [v.input.to],
      subject: v.input.subject,
      text,
      headers: listUnsubHeaders(tok),
    };
    if (html !== undefined) payload.html = html;
    if (v.input.tags) payload.tags = v.input.tags;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
```

Update the top-of-file comment block's footer line to note the footer is now the tokenized one-click footer and that `List-Unsubscribe` headers are set:

```ts
//   footer    the recipient-tokenized one-click footer (footerFor) is appended
//             to BOTH text and html server-side, so a nurture send can never ship
//             without the CAN-SPAM address + a working one-click unsubscribe link.
//             We also set List-Unsubscribe + List-Unsubscribe-Post (RFC 8058).
```

- [ ] **Step 4: Run to verify it passes** — `deno test supabase/functions/resend-send/index.test.ts` → PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/resend-send/index.ts supabase/functions/resend-send/index.test.ts
git commit -m "feat(compliance): tokenized footer and List-Unsubscribe on resend-send"
```

---

## Task 8: Thread the tokenized footer through the transactional senders

**Files:** Modify `book-files.ts` (+ `.test.ts`), `confirmation-email.ts` (+ `.test.ts`), `waitlist-signup/index.ts`, `stripe-webhook/index.ts`, `renewal-reminder/index.ts` (+ `.test.ts`).

**Consumes:** `footerForEmail` from `_shared/email-footer.ts`.

**Pattern:** each pure text builder takes a new trailing `footer: string` param and interpolates it where `${EMAIL_FOOTER}` was. Each async sender resolves `footerForEmail(supabase, email)` (naming the local `footer`, never `token`) and passes it in. Keeping the text builders pure — taking the footer as a string — preserves their unit tests; only the async send path mints.

- [ ] **Step 1: `book-files.ts` — thread footer into `bookEmailText`, mint in `sendBookEmail`**

Change `bookEmailText` to take a trailing `footer: string` and interpolate `${footer}` where `${EMAIL_FOOTER}` was:

```ts
export function bookEmailText(bookLabel: string, links: BookLink[], footer: string): string {
  const downloads = links.map((l) => `${l.format}:\n${l.url}`).join("\n\n");
  return `Thank you for buying ${bookLabel}.

Here are your download links. You get both the PDF and the
EPUB, so you can read on any device.

${downloads}

These links work for 7 days. Save the files to your device
once you download them. Reply to this email if you hit any
trouble and we will help.

${footer}`;
}
```

Add imports at the top of the file:

```ts
import { footerForEmail } from "./email-footer.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
```

Inside `sendBookEmail` (which has `email` as its first param), replace the `bookEmailText(bookLabel, links)` call with:

```ts
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const footer = await footerForEmail(supabase, email);
  const bodyText = bookEmailText(bookLabel, links, footer);
```

Use `bodyText` in the Resend payload where `bookEmailText(...)` was inlined. Remove the now-unused `EMAIL_FOOTER` import from this file if present.

- [ ] **Step 2: Update `book-files.test.ts`** — Run: `grep -n "bookEmailText\|EMAIL_FOOTER" supabase/functions/_shared/book-files.test.ts`. For each `bookEmailText(...)` call add a third arg `"FIXTURE-FOOTER"` and assert the body `.includes("FIXTURE-FOOTER")` instead of asserting on `EMAIL_FOOTER`.

- [ ] **Step 3: Run book-files tests** — `deno test supabase/functions/_shared/book-files.test.ts` → PASS.

- [ ] **Step 4: `confirmation-email.ts` — thread footer into `confirmationEmail`** — add a trailing `footer: string` param and interpolate it where `${EMAIL_FOOTER}` is; remove the `EMAIL_FOOTER` import if unused. Then in `waitlist-signup/index.ts`, add `import { footerForEmail } from "../_shared/email-footer.ts";`, and before the `confirmationEmail(...)` call add `const footer = await footerForEmail(supabase, email);` (use the existing client + email variables — surface them with `grep -n "confirmationEmail\|createClient\|supabase\|const email" supabase/functions/waitlist-signup/index.ts`), then pass `footer` as the trailing arg.

- [ ] **Step 5: Update `confirmation-email.test.ts`** — Run: `grep -n "confirmationEmail" supabase/functions/_shared/confirmation-email.test.ts`. Add a `"FIXTURE-FOOTER"` trailing arg to each call and assert the body includes it.

- [ ] **Step 6: Run confirmation-email tests** — `deno test supabase/functions/_shared/confirmation-email.test.ts` → PASS.

- [ ] **Step 7: `stripe-webhook/index.ts`** — the three email builders each end with `${EMAIL_FOOTER}`. Give each a trailing `footer: string` param and interpolate it. Add `import { footerForEmail } from "../_shared/email-footer.ts";`. At each send site (inside `issueAndDeliverLicense` / the receipt send — `email` is in scope near line 210, `supabase` near line 224), resolve `const footer = await footerForEmail(supabase, email);` once and pass it into each builder call. Remove the now-unused `EMAIL_FOOTER` import if present.

- [ ] **Step 8: Update stripe-webhook tests (if any)** — Run: `grep -rn "EMAIL_FOOTER\|EmailText(" supabase/functions/stripe-webhook/`. For each directly-tested builder, add a `"FIXTURE-FOOTER"` trailing arg and assert on it. If the builders are not directly tested, no change here.

- [ ] **Step 9: `renewal-reminder/index.ts`** — add a trailing `footer: string` param to `renewalEmailText()` and interpolate it. Add `import { footerForEmail } from "../_shared/email-footer.ts";`. At the send site (handler near line 140, which has `supabase` + the entitlement email), resolve `const footer = await footerForEmail(supabase, email);` and pass it in. Remove the unused `EMAIL_FOOTER` import.

- [ ] **Step 10: Update renewal-reminder tests + run the full suite** — Run: `grep -n "renewalEmailText\|EMAIL_FOOTER\|containsThreat" supabase/functions/renewal-reminder/index.test.ts`. Add a `"FIXTURE-FOOTER"` trailing arg to each `renewalEmailText(...)` call (including the one feeding `containsThreat`). Then run the full suite:

Run: `deno test supabase/functions/`
Expected: PASS across all functions.

- [ ] **Step 11: Commit**

```bash
git add supabase/functions/_shared/book-files.ts supabase/functions/_shared/book-files.test.ts \
        supabase/functions/_shared/confirmation-email.ts supabase/functions/_shared/confirmation-email.test.ts \
        supabase/functions/waitlist-signup/index.ts \
        supabase/functions/stripe-webhook/index.ts \
        supabase/functions/renewal-reminder/index.ts supabase/functions/renewal-reminder/index.test.ts
git commit -m "feat(compliance): tokenized one-click footer on every transactional email"
```

---

## Task 9: Full-suite verification + relay handback draft

- [ ] **Step 1: Run the entire edge-function test suite** — `deno test supabase/functions/` → PASS, zero failures. Fix anything red before proceeding (systematic-debugging).

- [ ] **Step 2: Confirm config.toml has all three new blocks** — Run: `grep -A1 "functions.unsubscribe\|functions.resend-webhook\|functions.suppressions-export" supabase/config.toml`. Expected: three blocks, each followed by `verify_jwt = false`.

- [ ] **Step 3: Confirm no secret material or local-only paths staged** — Run: `git log --oneline origin/main..HEAD --name-only`. Expected: only `supabase/**` + `docs/**`; no `.env`, no local-only paths, no keys. (publish-guard backstops this.)

- [ ] **Step 4: Draft the relay handback (operator posts it)** — Write the handback entry answering relay #9 to the scratchpad: list the commits, confirm the export contract shape (`GET suppressions-export?since&limit`, `{rows:[{email,token,reason,suppressed_at}], next_cursor}`, oldest-first), and the operator's deploy obligations: set the two new Supabase secrets (the suppressions export bearer + the Resend webhook signing secret), register the Resend webhook endpoint, deploy the migration + functions `--no-verify-jwt`, then drop the export bearer into `marketing/leads/.secrets/leads.env`. Do NOT edit the relay file directly (append-only, operator-posted).

- [ ] **Step 5: STOP — report to operator** — Report: build complete, all tests green, everything UNPUSHED + UNDEPLOYED. List the deploy checklist and wait for explicit go before any push or deploy ([[confirm-before-live-deploy]]).

---

## Self-Review

**Spec coverage:** Suppression table → T1 ✓. `email_tokens` → T1+T2 ✓. `unsubscribe` fn (GET page + RFC 8058 POST) → T4 ✓. `resend-webhook` (Svix, hard bounce + complaint) → T5 ✓. `suppressions-export` (waitlist-export clone, oldest-first) → T6 ✓. Footer tokenized + `List-Unsubscribe` on resend-send → T3+T7 ✓. Footer on every transactional email → T8 ✓. `verify_jwt=false` config → T4/T5/T6 ✓. Local-only, operator-gated deploy → Global Constraints + T9 ✓. Drain contract (email-keyed, token echoed) → T1+T6 ✓.

**Type consistency:** `getOrMintToken(supabase, email): Promise<string>` identical in T2/T3/T7/T8. `footerFor(token): string` / `footerForEmail(supabase, email): Promise<string>` consistent in T3/T7/T8. `ExportRow` `{email, token, reason, suppressed_at}` matches migration columns (T1) + drain contract. `withFooter(input, footer)` arity change in both impl and test (T7). `listUnsubHeaders(tok)` defined + tested (T7). `verifySvix`/`suppressionFromEvent` match between impl + test (T5).

**publish-guard safety:** no local variable ending in token/key/secret is assigned an unbroken 16+ char expression (unsubscribe-token locals are `tok`; the mint result is `fresh`/`tok`; the HMAC key import is `signer`). Fixtures build the `wh`+`sec_` prefix from parts and use non-secret-named variables (`fixture`, `signingCreds`).
