# A11 — Per-receipt indexable gallery (design)

_Date: 2026-06-26 · Relay ask A11 (single-product pivot, `strategy/orionfold-website/_RELAY.md`, Mac→Website 2026-06-25). Last of the A3–A11 set; the others are shipped._

## 1. Goal & contract

Today `/proof/` ("Receipts") renders four denormalized arrays from `src/data/proof.ts`: the capability `matrix`, `speedRows`, four headline `receipts`, and five `myths`. None is a stable, addressable entity, so every piece of evidence shares the single `/proof/` URL.

A11 turns the evidence into a **first-class, individually-addressable content type**: a flat `/receipts/` hub plus `/receipts/<slug>/` permalinks, each a rich explainer of one piece of evidence — the test we locked, the run, and how anyone reruns it.

One-line contract:

- `/proof/` stays the curated pillar and keeps its exact current visuals and data wiring.
- Each piece of evidence that earns a page gets `/receipts/<slug>/`, individually crawlable and OG-shareable.
- `/proof/` `★` cells, headline cards, and the A4/A10 Proof bands **deep-link to the specific receipt when one exists**, with graceful fallback to today's target otherwise.

This delivers the A11 payoff ("deep-link to the specific receipt instead of `/proof/` top") and unblocks A4/A10 from pointing at the pillar's top anchor.

## 2. Decisions (locked during brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| Content model | One unified **evidence-item** entity | Headline numbers and `★` frozen tests are the same shape of thing — a checkable claim with a source. One model, one route family. |
| Content store | New **`receipts` markdown content collection** | Each receipt page is an article-length explainer (the test, the run, the rerun recipe), not a one-line card. Markdown body + typed frontmatter, mirroring `letters`. |
| SSOT relationship | **`proof.ts` arrays stay authoritative**; receipts add links only | The live conversion page keeps its exact visuals and data wiring; no re-derivation, no `CapabilityMatrix` refactor, minimal regression surface. |
| URL shape | **Flat `/receipts/` + `/receipts/<slug>/`** | First-class content type alongside `/story/` and `/letter/`; reuses their proven machinery; short, durable URLs. |
| Deep-link target | Receipt page **when one exists**, else current target | The literal A11 payoff with a graceful fallback while the collection fills in. No existing link breaks. |
| Initial content | **4 headline receipts + one page per distinct `★` proven test** (~8–10 pages) | Proves the model end-to-end with real content and fills the gallery at launch. |

## 3. Architecture — mirror the `letters` collection

`/receipts/` is built as a sibling of `/story/` and `/letter/`, reusing established extension points. No new infrastructure.

| Piece | What it is | Mirrors |
|---|---|---|
| `src/content/receipts/*.md` | New glob-loader collection (defined in `src/content.config.ts`). | `letters` collection |
| `src/pages/receipts/index.astro` | The crawlable gallery hub: every receipt as a card, newest first. `CollectionPage` + `BreadcrumbList` JSON-LD. Uses a static `/receipts/` OG entry in `OG_PAGES` (like the `/letter/` index), via `ogMeta('/receipts/')`. | `letter/index.astro` |
| `src/pages/receipts/[slug]/index.astro` | Permalink. `getStaticPaths` over the collection; `render()` the body; `BlogPosting` + `BreadcrumbList` (`Home › Receipts › <title>`); OfferSlot (`offer="proof-playbook"`, `source="receipt-page"`) at the bottom. | `letter/[slug]/index.astro` |
| `src/components/receipts/ReceiptArticle.astro` | Shared render shell: metric eyebrow, claim line, dek, body slot, "the receipt" source list, "rerun it" recipe block. | `LetterArticle.astro` |
| `receiptOgSlug(id)` in `src/data/og.ts` + a branch in `src/pages/og/[slug].jpg.ts` `getStaticPaths` | Per-receipt 1200×630 OG card, namespaced `receipt-<id>` (collision-free). | `letterOgSlug` + the letter OG branch |
| `astro.config.mjs` `serialize()` | One branch: `/receipts/` → `priority 0.8 / weekly`; `/receipts/<slug>/` → `priority 0.7 / weekly`. | the existing `/proof/` 0.9 branch |

### Collection schema (`receipts`)

```
title: string            // page + card title, e.g. "A 4B model out-trusts a 30B"
metric: string           // the number that pops, e.g. "4B beats 30B"
claim: string            // one-line claim this receipt proves
dek: string              // standfirst / meta description
date: coerce.date        // for sorting + BlogPosting dates
tags: string[]  = []     // optional faceting (e.g. "Trust", "Speed", "Cost")
hero: image().optional() // curated art; absent -> constellation OG fallback
relatedTo: string[]      // proof.ts back-references it backs (see §4 keying)
source: { label, href }[]// where the work lives (field-note story, model page, /dgx-spark/)
verify: string.optional()// the rerun recipe (how a reader reproduces it)
```

Body (markdown) = the full explainer: what we locked, how we ran it, what we found, the honest caveat. Voice: grade 3–5, jargon explained, no em-dashes, caveats kept (website-copy-style + receipt-honesty).

## 4. Link wiring & SSOT relationship

`proof.ts` arrays stay the source of truth for the `/proof/` overview. The only change is additive and backward-compatible: an **optional `receipt?: string` (slug)** on the proof entities that can point at a page.

- `MatrixCell` (the `★` ones), `Receipt` (headlines), and optionally `Myth` gain `receipt?: string`.
- A single helper resolves it: `receiptHref(slug?) => '/receipts/' + slug + '/'` when set, otherwise `undefined`.
- `CapabilityMatrix.astro` and the `/proof/` headline-cards block call `receiptHref()`: when it returns a URL the cell/card links there; when it returns `undefined` the element keeps **exactly today's `href`** (model page, `/dgx-spark/`). No existing link breaks; the gallery fills in progressively.
- **A4/A10 bands** (`src/components/product/ProofCta.astro`, `src/components/ui/ProofBand.astro`) gain an **optional** `receipt` prop. A product-detail page with a directly relevant receipt can deep-link to it; absent the prop, the bands keep linking to `/proof/`. This is a capability, not a forced rewire — expose the prop and wire the obvious cases (a proven product → its headline receipt). No band is hunted down or restructured.

### Keying `relatedTo`

A receipt's `relatedTo` names the proof entities it backs, using stable keys: matrix cells as `matrix:<capability-slug>:<column-key>` (column keys already exist: `advisor`/`kepler`/`patent`), headlines as `headline:<metric-slug>`. This is for the receipt page's back-links and for an optional build-time sanity check that every `★`-with-`receipt` has a matching collection entry. It is metadata on the receipt side; `proof.ts` does not need to carry it.

Cross-linking is bidirectional: each receipt page's `source[]` links back to the field-note story / model / `/dgx-spark/` the work lives on, reinforcing the pillar's topical authority (same play as the A8 story hub).

## 5. Initial content (~8–10 pages, authored this session)

Author rich markdown for:

- The **4 headline receipts**: the 2-cent overnight lab, 4B-beats-30B, 76%-faster-same-chip, $1-guards-$1,679.
- **One page per distinct `★` proven test** in the matrix. Cells that share a test collapse to one receipt that references both columns:
  - Advisor: answers-from-your-documents, exact-source-citations, clean-refusal, checks-its-own-memory.
  - Kepler: step-by-step reasoning, returns-one-checkable-number.
  - Patent: exact-source-citations (shares the citations receipt with Advisor), step-by-step reasoning (shares with Kepler).

Collapsing shared tests lands the real count around 8–10 pages. All sources are drawn from the field notes / model report cards already referenced in `proof.ts`. Copy follows website-copy-style; honest caveats stay in.

OG/hero: receipts launch with the constellation-fallback OG (no curated art required). Curated hero art is a later `featured-imagery` follow-up, not a ship blocker.

## 6. Out of scope (YAGNI)

- No refactor of `proof.ts` arrays into receipt-derived data — arrays stay authoritative.
- No curated per-receipt artwork this session (fallback OG ships; `featured-imagery` follow-up).
- No `myth`→receipt pages unless a myth maps cleanly onto an already-authored headline/test receipt (reuse, never duplicate).
- No commerce, funnel, or secret changes. The work is read-only over existing proof data plus reuse of the existing OfferSlot double-opt-in funnel.
- No nav change. `/proof/` remains the linked pillar; `/receipts/` is reached from `/proof/` cells/cards, footer, and sitemap (operator decides any nav promotion later).

## 7. Verification (definition of done)

- `npm run build` clean. Page count rises by roughly `1 (index) + N (permalinks) + (1 + N) (OG cards: gallery + per-receipt)` where `N` ≈ 8–10 after shared-test collapse — so on the order of ~20 new prerendered routes, not 10. The exact delta is read off the build, not asserted here; the gate is a clean build, not a specific number.
- Both themes verified in-browser (dark default + light), no console errors.
- All new JSON-LD parses: gallery `CollectionPage`+`BreadcrumbList`; each permalink `BlogPosting`+`BreadcrumbList`.
- `sitemap-0.xml` shows the `/receipts/` branch at the assigned priorities; `/proof/` unchanged at 0.9.
- Deep-links resolve: every `★` cell / headline card with a `receipt` slug links to a real `/receipts/<slug>/`; cells without one keep their prior target.
- A4/A10 bands render correctly both with and without a `receipt` prop (fallback to `/proof/`).
- Each receipt permalink's `source[]` back-links resolve; OfferSlot posts to the live funnel.
- Agent-doc parity unaffected (no CLAUDE.md change). Relay handback drafted on disk (`strategy/orionfold-website/_RELAY.md`, Website→Mac `[acted]`, NOT pushed — strategy repo is Flows' to push).

## 8. Touchpoint summary

New files:
- `src/content/receipts/*.md` (~8–10 authored)
- `src/pages/receipts/index.astro`
- `src/pages/receipts/[slug]/index.astro`
- `src/components/receipts/ReceiptArticle.astro`

Edited files:
- `src/content.config.ts` (define `receipts` collection)
- `src/data/proof.ts` (optional `receipt?` on `MatrixCell`/`Receipt`/`Myth`; `receiptHref` helper)
- `src/components/sections/CapabilityMatrix.astro` (call `receiptHref`)
- `src/pages/proof.astro` (headline cards call `receiptHref`)
- `src/components/product/ProofCta.astro`, `src/components/ui/ProofBand.astro` (optional `receipt` prop)
- `src/data/og.ts` (`receiptOgSlug` for permalinks + a static `OG_PAGES['/receipts/']` entry for the gallery index)
- `src/pages/og/[slug].jpg.ts` (receipt branch in `getStaticPaths`)
- `astro.config.mjs` (`serialize()` `/receipts/` branch)
