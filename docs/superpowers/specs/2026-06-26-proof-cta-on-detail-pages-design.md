# A4 — Proof CTA band on software + model detail pages

Date: 2026-06-26
Relay ask: A4 (single-product pivot set A3–A11, `strategy/orionfold-website/_RELAY.md`, Mac→Website 2026-06-25)

## Problem

The proof matrix on `/proof/` already deep-links **out** to the product pages that earned its stars (`src/data/proof.ts` → `cols[].href` and the `★` cells' `href`). The reverse link does not exist: a visitor on a model or software detail page has no path back to the flagship Proof surface. A4 closes that loop so every software/model detail page becomes an on-ramp to `/proof/` — the tightest product → flagship link in the A-series set.

## Goal

Add one small, templated CTA band to every software and model detail page that points to `/proof/`. Honesty gradient preserved: products that actually earned a proof star get confident "rerun it" copy; the rest get a softer "see how the models we trust earn it" line. Books are out of scope (not part of the proof story).

## Design

### New component: `src/components/product/ProofCta.astro`

A slim, single-line band matching the existing quiet-band visual language already used on the page (e.g. the `border-y border-border bg-surface-raised` section style). Structure:

- A mono uppercase eyebrow (proven: `Proved on a locked test` / unproven: `Every claim has a receipt`).
- A one-line headline + an arrow link to `/proof/`.
- Theme-aware tokens only (no hardcoded colors); uses the accent/primary tokens already in the design system.

Props:

```
interface Props {
  type: 'software' | 'model' | 'book';
  slug: string;
}
```

The component decides proven vs. unproven internally from the proof SSOT, so the layout passes only `view.type` + `view.slug` and the markdown frontmatter needs no new fields.

### Proven detection helper

Add a small pure helper that reads the proof matrix SSOT:

```
// in src/data/proof.ts (or a thin sibling), exported:
export function isProvenProduct(type: 'software' | 'model' | 'book', slug: string): boolean
```

Logic: build the page's own path (`/software/<slug>/` or `/models/<slug>/`) and return `true` if it matches the `href` of any `cols` entry where `ours === true`. Today that resolves to:

- `/software/advisor/` (Advisor)
- `/models/kepler/` (Kepler)
- `/models/patent-strategist/` (Patent-Strategist)

Books always return `false` (and the band does not render for books anyway). Driving this off `proof.ts` means the set stays correct automatically if a future house model earns a star and gets a column.

Note the path shape: software detail routes are `/software/<slug>/` and model routes are `/models/<slug>/` (the listing base for models is `models`, matching the existing `cols[].href` values like `/models/kepler/`).

### Copy

Proven branch:
- Eyebrow: `Proved on a locked test`
- Line: `We proved this on a test anyone can rerun. See the receipt and run it yourself.`
- Link text: `See it on Proof →`

Unproven branch:
- Eyebrow: `Every claim has a receipt`
- Line: `See how the models we trust earn it. Every claim on Proof comes with a test you can rerun.`
- Link text: `See the receipts →`

Both link to `/proof/` (top of page). No per-product anchor plumbing in this iteration (A11 will later give receipts their own URLs; this CTA can be re-pointed then). Voice: grade 3–5, no em-dashes, no jargon, no invented per-product claims (website-copy-style).

### Placement in `src/layouts/ProductDetail.astro`

Render the band **after** the conversion block (`FieldEditionBox` / `BuyBox` / `SponsorBlock`) and **before** `<RelatedRail>`. Guard so it only renders for software and model pages:

```
{(view.type === 'software' || view.type === 'model') && (
  <ProofCta type={view.type} slug={view.slug} />
)}
```

This keeps it below the page's own pitch (never competing with Buy/Sponsor) and above "Keep exploring."

## Files touched

- `src/components/product/ProofCta.astro` — new component.
- `src/data/proof.ts` — add exported `isProvenProduct()` helper (reuses existing `cols`).
- `src/layouts/ProductDetail.astro` — import + render the guarded band.

No commerce, secrets, funnel, or markdown-frontmatter changes.

## Verification

- `npm run build` clean (all pp).
- In-browser on `:4321`, both themes:
  - proven page `/software/advisor/` shows the confident band linking to `/proof/`,
  - proven model `/models/kepler/` shows the confident band,
  - unproven software `/software/cortex/` shows the softer band,
  - a `/books/<slug>/` detail page shows **no** band.
- Band sits below the buy/sponsor block and above "Keep exploring" on each.

## Out of scope

- Per-receipt anchors / deep-linking to a specific proof row (deferred; A11 gives receipts their own URLs first).
- Books detail pages.
- Any change to `/proof/` itself, the matrix, or the buy flow.
