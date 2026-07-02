# Decisions

Durable architectural + product decisions for the Orionfold website. Newest first.
Each entry: date · decision · why · reversal note. Full narrative stays in git; this
is the "why we did it this way" index a fresh session (or peer) reads before changing course.

---

## 2026-07-02 — Machine-readable pricing canon lives on orionfold.com (`/relay/pricing.json`); "phone home" retired for "never sends your data to Orionfold"

**Decision.** Two halves, both from the Relay peer's `later-12` relay entry (operator ruling 2026-07-02).
(1) The canonical promise wording is now the direction-explicit **"Relay never sends your data to Orionfold"** — "phone home" is retired as ambiguous (it doesn't say which way data flows). The promise forbids the product *sending* user data (telemetry, pings, license re-validation); it does *not* forbid read-only pulls of public Orionfold sources. Adopted on `/relay/` (trust Q&A card), `/promise/` (product-neutral form: "your software never sends your data to Orionfold"), and the `renewal-reminder` edge-fn header comment. The Proof surfaces (`Hero.astro`, `ProofProduct.astro`, one story post) still say "nothing phones home" — deliberately untouched, that's Proof's canon to rule on.
(2) The machine-readable pricing source the ruling newly permits Relay to read is published at **`https://orionfold.com/relay/pricing.json`** — canon on the website, not the relay repo (operator's call: the website is already the pricing SSOT via `catalog.ts`, so canon-follows-checkout). It is an Astro static endpoint (`src/pages/relay/pricing.json.ts`, schema `orionfold.pricing/v1`) that imports the SAME `RELAY` object the buy buttons render from, so page and JSON are emitted from one source in one build — the price-drift class Relay hit ($349-vs-$499, their F3/#20) cannot recur between site and feed. Carries lookup_keys, cents amounts, founding-window state, the `ORIONFOLD_RELAY_LIVE` flag, and a build timestamp.

**Why.** "Phoning home" reads as both "sends data out" and "checks in at all"; the explicit sentence keeps the promise strong while permitting the read-only pricing pull that kills price drift. Publishing the JSON from the same import graph as the page (not a hand-written `public/` file) means there is no fourth copy of the price to maintain.

**Reversal.** Delete `src/pages/relay/pricing.json.ts` (but tell the Relay peer first — a future release may read it as a release gate); the copy change is a plain revert, but the wording is the operator's recorded canon in the Relay repo's `_SPECS/plg-refine.md` §7, so don't revert copy unilaterally.

## 2026-07-01 — Three flagships get ONE canonical landing each; legacy detail pages retired via 301

**Decision.** Proof, Arena, and Relay each have exactly one canonical, buyable surface: the hand-built landing pages `/proof/`, `/arena/`, `/relay/`. The legacy product-detail pages `/software/arena/` and `/software/ai-native-platform/` were retired (their `.md` deleted from the `productDetail` collection) and 301-redirected to `/arena/` and `/relay/` respectively — both as Astro meta-refresh redirects (`astro.config.mjs`) AND as true Cloudflare edge 301 Redirect Rules on the zone. `/arena-field-edition/` also repoints to `/arena/`. The `/software/` catalog now leads with Proof/Arena/Relay cards linking to those landings (same-tab); the former "AI Native Platform" software card was relabeled Orionfold Relay; Advisor + Cortex moved from the flagship group to the platform group. A shared `LandingStickyCta` (SSOT-priced, launch-flag-gated) sits on all three landings.

**Why.**
- The `/software/arena/` detail page showed stale pre-design-system "Spark Arena" screenshots; `/software/ai-native-platform/` used the pre-Relay product name. Rather than re-screenshot / rename two drifting pages, collapse each into its already-canonical DS-era landing — one surface to keep current, not two.
- Both legacy URLs carry GSC history, so a 301 (not a delete/404) preserves the earned ranking signal and consolidates it onto the live product. Edge 301 > meta-refresh for SEO, and fires before the Pages deploy propagates since Cloudflare is in front.
- `/software/ai-native-platform/` (the *software*) was the pre-rename Relay engine (`pip install ainative` = the former open ainative-business engine, now `orionfold-relay`), so `/relay/` is its true successor. The *book* `/books/ai-native-platform/` is a different product and was left untouched.
- Arena's detail page was load-bearing for the Field Edition buy flow (FieldEditionBand, /cockpit/, flagship-offers all linked it), so it could not simply be deleted — the redirect + repointing every inbound link to `/arena/#get-arena` keeps the buy path intact.

**Reversal.** Restore the two `.md` files from git (`a00be00^`), remove the three redirect entries from `astro.config.mjs`, and delete/disable the matching Cloudflare Redirect Rules (`software-arena-to-arena-301`, `platform-to-relay-301`, `arena-field-edition-to-arena-301`). The catalog SSOT changes (card relabel, group moves) are in `src/data/software.ts`.

**Trade-off accepted.** The Arena landing lost the deep 23-shot gallery the detail page carried; `/arena/` keeps 5 fresh DS-branded shots. Recapture more if depth is wanted (needs the live cockpit).

See memory [[cloudflare-edge-and-monitoring]] for the CF Redirect-Rule recipe (drivable via Claude-in-Chrome; the dashboard is NOT blocked).
