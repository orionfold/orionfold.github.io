# `stripe-webhook` — purchase fulfillment

This edge function is the single fulfillment touchpoint for every Orionfold
purchase. Stripe calls it on `checkout.session.completed` (plus the
subscription/invoice events); the function verifies the Stripe **signature**
against the raw body (its auth is the signature, not a JWT), then fulfills by
product kind: books, sponsor tiers, and the two licensed products — **Arena
Field Edition** and **Orionfold Proof**.

This README documents the buyer-email mechanism and the design choices behind
it. The price catalog itself is the SSOT in `_shared/catalog.ts` (resolved by
`lookup_key`, never hardcoded ids).

## Two licensed products, two different install front doors

Arena and Proof both mint an Ed25519-signed license and email it to the buyer
with a **per-customer signed URL** (a short-TTL, 7-day Supabase Storage URL on
the branded host `orionfold.supabase.co`). What differs is *how the buyer
installs*, and the emails reflect that:

| | **Arena Field Edition** | **Orionfold Proof** |
|---|---|---|
| Target machine | DGX Spark (bare appliance) | any dev machine |
| Install command | `curl -fsSL https://getarena.orionfold.com \| OF_LICENSE_URL='…' sh` | `uv tool install orionfold-proof` then `orionfold up` |
| Distribution | a hosted `#!/bin/sh` **bootstrap** served from the vanity host | the **PyPI** package |
| Signed URL consumed by | the bootstrap (`OF_LICENSE_URL`) | `orionfold unlock <pack> --license-url=…` |

### Why there is a `getarena.orionfold.com` but no `getproof`

`getarena.orionfold.com` is a real, Cloudflare-hosted host that **serves a shell
bootstrap script** — because Arena's documented install *is* a
`curl … | sh` one-liner pasted into a root shell on the Spark. The short,
memorable, trustworthy URL is load-bearing in that command.

Proof has no equivalent because **Proof does not install that way**. It comes
from PyPI (`uv tool install orionfold-proof`); there is no script to host, so a
`getproof` vanity host would have nothing to serve. A `curl | sh` bootstrap is
only justified for a bare appliance with no package manager in the loop. A
`getproof.orionfold.com` redirect to the Proof page would be a pure
marketing/brand convenience — not part of the buyer flow.

## The Proof email: instant gratification, unlock-later

The Proof buyer email (`proofLicenseEmailText`) **leads with the payoff** rather
than a gated next step, because the headline content already ships in the wheel:

- The **Advisor governance pack** (its `advisor-curveball-v0.2` dataset, ~107 KB)
  is **bundled inside the `orionfold-proof` PyPI wheel**, not fetched separately.
- The package seeds it at cockpit startup (`seed_bench_datasets`, run from the
  server's startup path) as a first-class, non-sample row, and backfills its
  governance `system_prompt` so a Run scores the headline result out of the box
  — **no license check, no `orionfold unlock`** to see or run it.

So the moment a buyer runs `uv tool install orionfold-proof && orionfold up`,
the Advisor dataset and a reference receipt are already there to run. The email
says exactly that ("start right away… pick it and press Run").

`orionfold unlock <pack> --license-url=…` is therefore **not** the primary step.
It installs *separately-distributed* packs — a `.zip`/dir with its own manifest
and model pointer, gated by the license's `unlocks_pack(pack_id)` check. The
email demotes it to a "later, when we ship a new pack you own" note. That
future-pack delivery (sending the buyer a download link + the `<pack>` name)
is still a manual operator step today; the copy is framed so the buyer never
perceives it as a wait for value they already have.

History: until 2026-06-28 the email led with the `unlock` step, which made the
buyer feel they were waiting on a second email even though Advisor was already
runnable. The rewrite fixes that perception without any commerce-logic change —
the signed URL is still wired for future packs.

## One Supabase function, two Stripe modes

Supabase has a single project, so the **same** deployed function URL
(`…/functions/v1/stripe-webhook`) is the endpoint for both the Stripe **live**
account and the Stripe **sandbox**. The function verifies against one
`WEBHOOK_SECRET` env var — the live signing secret — so a *sandbox* webhook's
signature will not verify against this deployment. Practical consequence: you
cannot smoke-test fulfillment by firing a sandbox checkout at the live function;
a real render of the buyer email requires either a live purchase or a
render-only script that imports `proofLicenseEmailText()` and sends it via
Resend directly. The Proof prices also only exist in the live catalog, not in
the sandbox.

## Deploying a change to this function

```sh
supabase functions deploy stripe-webhook --project-ref <orionfold-project-ref>
```

Deploy **only** this function by name (never a bare `functions deploy`). This is
a live, working webhook whose JWT/signature config is already correct on the
server — a code-only redeploy preserves it. Do **not** add `--no-verify-jwt` on
a redeploy; that flag is for a *first* deploy of a token-gated function, and
flipping it here could break the live config. Validate locally first with
`deno check index.ts`.

Secrets (`RESEND_API_KEY`, the license signing seed, the webhook secret) live as
Supabase secrets and in local-only env files — never in this repo (it is public;
committing is publishing).
