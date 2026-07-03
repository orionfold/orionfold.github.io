# Homepage CRO rebuild — Proof-landing → Relay-led suite router

Date: 2026-07-03
Source brief: `strategy/orionfold-website/_RELAY.md` 2026-07-03 (later) — Mac→Website, "HOMEPAGE CRO REBUILD"
Reference build: the shipped `/relay/` CRO pass (`aefdd9d`); pattern kit = `strategy/orionfold-marketing/_IDEAS/landing-page-learnings.md` Part D.
Loop: page-craft draft the operator hand-tunes after build (same as `/relay/`). Pricing/offer unchanged. Deploy operator-gated.

## Problem

`orionfold.com/` is a Proof landing page wearing the company URL. Its `<title>`, meta description, and OG all carry Proof's spear ("Prove which AI you can trust"), and Relay — the consolidated flagship + sole target of the $10K WS#16 paid test — sits 6th, below the founder letter, Arena, and the thesis diagram. A cold visitor who would convert on Relay or Arena is told "we make an AI benchmarking tool" and bounces. Under the Relay consolidation the homepage's job is to **route** each visitor to the product that matches their question, not to sell Proof.

Two operator decisions frame the rebuild (locked in the brief): (1) homepage = **suite router, Relay-led**; (2) **lean Relay for the test window** (top product slot + a homepage CTA now; rebalance to neutral after WS#16).

## Approach

Reorder + retone the existing homepage sections; add one new component (company trust trio) and one new hero asset; retarget SEO surfaces. No commerce, funnel, or secrets touched. The current sections are reused in a new order rather than rebuilt from scratch — the components already exist and are on-brand.

### Section order

Current (`src/pages/index.astro`):
`Hero(Proof) → FromTheFounder → FieldEditionBand(Arena) → CapabilitySystemMap → RelayBand → Highlights → CatalogShelf → StoriesCarousel`

New:

| # | Section | Change |
|---|---------|--------|
| 1 | Hero (rebuilt) | Company-router hero: new H1, company paragraph, Relay-led CTA row, new Gemini hero art |
| 2 | CapabilitySystemMap (promoted + de-Proofed) | The suite thesis right after the hero; terminus re-framed from "PROOF · open it yourself" to company scope |
| 3 | CompanyTrustTrio (NEW) | own it forever · runs on your own machine · verify every call yourself |
| 4 | RelayBand (lead product) | Relay first, its per-client-margin angle + buy CTA |
| 5 | FieldEditionBand (Arena) | Second product; fix `15 tools, 7 open models` → `14 tools, 6 models`; keep the DGX-Spark hardware gate |
| 6 | FromTheFounder | Demoted below product routing |
| 7 | Highlights (book) + CatalogShelf + StoriesCarousel | Credibility/breadth tail, unchanged |

**Sequencer decision (operator-approved):** the homepage's Proof product band was removed long ago (the hero *was* the Proof pitch), so the product bands read **Relay → Arena**, not Relay → Proof → Arena. Proof is carried by the hero's secondary CTA + the thesis diagram + the trust trio. No new Proof band is invented.

## Component-by-component

### 1. Hero.astro (rebuild the pitch column + swap the art)

- **H1** → "Get an AI team without hiring one." (the live brand promise; `llc/ABOUT-ORIONFOLD.md`). Replaces "Prove which AI you can trust."
- **Eyebrow** → a company line (e.g. "Private AI you own, on your own machine") instead of "Prove it yourself, on your own machine."
- **Company paragraph** (plain, grade 5–7): Orionfold takes the AI scattered across your work and runs it through one path you own, see, test, and approve — agents that do the work (Relay), models that know your field, tests that prove it.
- **CTA row, Relay-led:** primary → Relay ("Run real client work" → `/relay/`), secondary → Proof ("See the receipts" → `/proof/`), tertiary → free book (magnet, `hero-secondary` UTM, unchanged mechanism).
- **Hero art** → new Gemini asset (see §Hero asset). The Proof laptop poster stays on `/proof/`. The in-art chip + its `/proof/#get-proof` link move to the Relay buy action to match the new primary CTA. LCP invariant preserved: new image stays `loading="eager"` + `fetchpriority="high"`, no `data-animate` on the LCP element (memory `mobile-perf-hygiene`, `homepage-hero-constellation`).

### 2. CapabilitySystemMap.astro (promote + de-Proof)

- Moves to section 2 (right after hero) via the `index.astro` reorder — no structural change needed inside the component for the move.
- **De-Proof the terminus:** the "Proof · open it yourself" zone label + the Advisor/Arena/Cortex/fieldkit tiles currently narrow a company story to one product. Reframe the zone label to company scope (e.g. "Open it yourself" / "Yours to inspect") and keep the four tiles as the capability proof (they already span the suite). The terminus CTA stays `/cockpit/` (its SEO equity is retained; brief doesn't ask to move it).

### 3. CompanyTrustTrio.astro (NEW)

Adapted from the `/relay/` `trustTrio` (relay.astro:133–152), lifted from product scope to company scope:
- **You own it forever** — open engines + offline licenses; if Orionfold vanished tomorrow, your setup keeps running.
- **Runs on your own machine** — nothing leaves it; no tracking, no check-ins home.
- **Verify every call yourself** — anything that could leave is listed in full with an off switch.

Each tile links its canonical `docs/trust/` page (same hrefs as the Relay trio, since those docs are the company's trust source). The standalone homepage "Receipts" block is already gone from `index.astro` (the receipts wall lives on `/proof/`), so no block is retired — the trio carries the ethos.

### 4. RelayBand.astro (lead product)

- Structural move to lead product position via `index.astro` reorder.
- Copy already grade 3–5 and margin-aware ("watch each client's cost add up on its own"); keep as-is unless the operator retunes on review. CTA already deep-links `/relay/#get-relay` (SSOT price).

### 5. FieldEditionBand.astro (Arena, second product)

- **Factual fix (P1-9):** line 48 `shipped 15 tools, 7 open models, 3 books, and 2 production sites` → `shipped 14 tools, 6 models, 3 books, and 2 production sites`. This is the only hardcoded occurrence of the wrong counts on the homepage.
- Keep the DGX-Spark hardware gate (it correctly disqualifies non-owners; do not soften).

### 6. Nav.astro (Relay leads)

Reorder the flagship trio from `Proof · Arena · Relay` to **`Relay · Proof · Arena`** (the `links` array, both desktop + mobile render from it). Divider group (Models · Books · Story) unchanged. Low priority — must not block P0.

### SEO re-alignment (P0-2) — isolated change

`index.astro` passes NO `title`/`description` today, so it inherits `Layout.astro`'s Proof-spear defaults. Fix: `index.astro` passes explicit props:
- `title="Orionfold · Get an AI team without hiring one"`
- `description=` a company-promise sentence (plain, grade 5–7; the umbrella positioning, not the Proof spear).

`SITE.description` (the global fallback in `src/data/seo.ts`) is **NOT edited** — other pages that rely on the default must not shift. The homepage OG *card* (`src/data/og.ts` `'/'`) is already company-framed ("Private AI capability for small teams"); align its `title` to the new promise for consistency. `/proof/` keeps its exact spear + meta, so no Proof SEO is lost — the two pages stop fighting for one string.

### Hero asset (P0-4)

Generate a new hero image via the `featured-imagery` / Gemini pipeline matching "Get an AI team without hiring one" (AI-team / one-controlled-path concept, house style, dark theme, DS canon). Operator drives Gemini in their Chrome; human curation gate picks the winner. Placed into `src/assets/` and wired into `Hero.astro`. The Satori OG derivation for `/` is separate (the OG card uses the brand banner, not this hero art) — no OG regen needed unless the operator wants the new art as the social background too.

## Known discrepancy to reconcile (NOT fixed here)

The brief's P1-9 also says "the catalog '7 models' line → 6 distinct." But `CatalogShelf.astro` computes that count from the models SSOT (`modelSlugs.length` = distinct non-dataset slugs), which yields **7** today (the component comment says so explicitly). Forcing it to 6 would contradict the `/models/` listing a visitor can literally count (same SSOT). **Decision (operator-approved): fix only the hardcoded `15/7` line in FieldEditionBand; flag the 6-vs-7 canon-vs-SSOT gap to the operator + marketing to reconcile at the data layer**, rather than hardcode a number that fights the model catalog.

## Testing / verification

- `npm run build` green (81+ pages).
- In-browser verification on `http://localhost:4321/` in BOTH light and dark themes (Chrome MCP, not curl): new hero, section order, trust trio, Relay lead, 14/6 copy, nav order.
- Confirm the LCP is the new hero image and it still paints eager (perf invariants).
- Grep sweep: no remaining `15 tools` / `7 open models` on the homepage; `<title>`/meta no longer read the Proof spear on `/`.

## Boundaries

Page-craft brief, not final copy — operator hand-tunes on the draft. Pricing/offer/ladder unchanged. Deploy operator-gated. Hand back the commit + a note when build-green via the `Website→Mac` entry in `strategy/orionfold-website/_RELAY.md` (disk-only), then the suite moves to `/proof/` (page 2 of 3).
