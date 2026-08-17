# Reply-based unsubscribe — activation runbook (B14)

Turns an opt-out sent as an email **reply** into the same `suppressions` row the
one-click footer link writes. Before this, a reply saying "unsubscribe" created no
row at all and had to be caught by a human — one such miss was honored by hand on
2026-08-16, via a one-row data-fix migration that is kept local because it names a
real subscriber.

**Order matters.** The code is deployed but inert until DNS exists, and setting the
reply-to before the MX record would send nurture replies into a black hole. Do these
steps in order; each one is verifiable before the next.

## Why a subdomain

`orionfold.com` MX points at Google Workspace (the operator's real mailbox). Resend
can only receive mail for a domain whose MX points at **Resend**, and a domain has
one MX set. Pointing the root at Resend would take over the operator's business
email, so nurture replies get their own subdomain instead. This is also Resend's own
documented recommendation when a root domain already has mail.

Scope is deliberately narrow — **only the marketing nurture pipe (`resend-send`)
moves.** Receipts, book delivery, workshop, consulting and renewal mail keep
`manav@orionfold.com`, because a human should still answer those personally. Tests
lock both sides of that split.

## Step 1 — Add the receiving domain in Resend

1. Resend dashboard → **Domains** → add `reply.orionfold.com`.
2. Copy the **MX record** it shows (host, value, priority).

The MX value is account- and infrastructure-specific, so it is deliberately not
written down here — copy it from the dashboard at setup time rather than trusting a
stale value in a doc.

## Step 2 — Add the MX record in Cloudflare

DNS for `orionfold.com` is on Cloudflare (`vicente`/`olivia.ns.cloudflare.com`).

1. Cloudflare → `orionfold.com` → **DNS**.
2. Add the MX record from step 1 on the `reply` subdomain.
3. **DNS only — do not proxy.** Mail records cannot be proxied through Cloudflare.

Verify before continuing:

```sh
dig +short MX reply.orionfold.com     # must return the Resend host
dig +short MX orionfold.com           # must STILL return smtp.google.com
```

The second check is the important one: it proves the operator's real mailbox was not
touched. If it changed, stop and revert.

## Step 3 — Register the inbound webhook

1. Resend → **Webhooks** → Add Webhook.
2. Endpoint: `https://<project>.supabase.co/functions/v1/reply-unsubscribe`
3. Event: **`email.received`** (this event only).
4. Copy the signing secret — each webhook has its **own** secret, distinct from the
   bounce/complaint webhook's.

## Step 4 — Set secrets and deploy

`RESEND_INBOUND_SECRET` is the new webhook's signing secret. `RESEND_API_KEY` is
already set — the fn needs it because Resend's `email.received` payload is
**metadata only**, so the reply body is fetched separately.

```sh
supabase secrets set RESEND_INBOUND_SECRET=<the signing secret from step 3>
supabase db push
supabase functions deploy reply-unsubscribe --no-verify-jwt
supabase functions deploy resend-send        # picks up the new reply_to
```

`--no-verify-jwt` matters: without it the Svix signature stops being the sole gate
and Resend's calls get rejected by the platform before reaching the fn.

## Step 5 — Verify end to end

Send yourself a nurture-shaped email through `resend-send`, then reply to it with the
single word `unsubscribe`.

```sh
# the reply address should now be the subdomain
# a suppressions row should appear with reason 'reply_unsubscribe'
select email, reason, suppressed_at from suppressions order by suppressed_at desc limit 5;
```

Then reply to another with `not interested` and confirm it lands in `reply_reviews`
**and does not suppress** — that is the escalation path working.

## What to watch after activation

- **`reply_reviews` needs an owner.** Ambiguous replies ("not interested", "wrong
  person", "how did you get my address") are queued for a human rather than
  auto-suppressed, because a wrongful suppression is silent and effectively
  permanent. An unattended queue is a slower version of the bug B14 fixed.

  ```sql
  select email, subject, matched_rule, created_at
  from reply_reviews where resolved_at is null order by created_at;
  ```

- **Replies stop appearing in Gmail.** That is the intended trade of this option.
  The queue above is now where a human sees the ones that need judgment.
- **Genuine conversation replies are classified `ignore`** and are neither suppressed
  nor queued. If someone replies to nurture with a real question, nobody is notified.
  If that matters, route `ignore` somewhere too — currently it is intentionally dropped.

## Rollback

Set `REPLY_TO` in `resend-send/index.ts` back to `manav@orionfold.com` and redeploy;
replies return to Gmail immediately. Leaving the MX record and fn in place is
harmless once nothing points at them. Suppression rows already written stay valid —
they record real opt-outs and must never be reverted.
