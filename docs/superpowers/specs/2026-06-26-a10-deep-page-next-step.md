# A10 — deep-page consistent "next step to Proof" + opt-in

Status: spec (2026-06-26). Relay ask A10 (`strategy/orionfold-website/_RELAY.md`, Mac→Website 2026-06-25).

## The ask (verbatim intent)

> Our GA4 shows traffic concentrates on deep pages (Stories, model/software detail) that offer no next step and surface no capture. Every deep page should carry one consistent next-step CTA toward `/proof/` and the A6 opt-in.

## Grounding — what already exists (audited 2026-06-26)

The relay's premise was partly stale. Actual state of the deep-page families:

| Deep page | Proof next-step today | Email capture today |
|---|---|---|
| Software detail | ✅ `product/ProofCta.astro` band | — |
| Model detail | ✅ `product/ProofCta.astro` band | — |
| **Book detail** | ❌ (ProofCta guard excludes `book`) | — |
| **Story posts** | ⚠️ bespoke `story/ProofCTA.astro` mini-hero, **Proof-tagged posts only** | ✅ `StorySubscribe` at foot of EVERY post (same A6 double-opt-in funnel) |
| **Letters** | ✅ hardcoded `/proof/` + `/cockpit/` capability close (every edition) | ❌ no inline capture |

So the genuine, non-duplicating gaps are smaller than "add band + slot everywhere":

- Books have **no** Proof next-step.
- Stories have a Proof next-step on **only some** posts (Proof-tagged), not all; they already have capture.
- Letters already link to Proof but have **no** inline email capture.

## Decisions (operator-confirmed 2026-06-26)

1. **Books → add the `product/ProofCta` band.** Flip the `ProductDetail.astro` guard to include `view.type === 'book'`. The band's honesty gradient already renders the generic "See the receipts" variant for non-house surfaces (`isProvenProduct` returns false), so a book links to `/proof/` without overclaiming.

2. **Stories → guarantee a Proof next-step on EVERY post.** Add a slim Proof band at the end of every story (after tags / `StoryPrevNext`, before `StorySubscribe`). Do **not** add an `OfferSlot` — `StorySubscribe` already captures via the same funnel; a second card would duplicate. Leave the bespoke mid-article `story/ProofCTA.astro` untouched (Proof-tagged posts keep it; minor overlap on those few is acceptable and intentional — mid-article hook + end-of-article close).

3. **Letters → add the A6 `OfferSlot`.** Letters' real gap is inline capture, not a Proof link (they already have one). Append `OfferSlot` after `LetterArticle` (which ends in the `/proof/` close). Keep the existing close.

4. **Software/Model → no change** (already carry the band).

Net: no duplicated capture cards, no double Proof links, three surgical edits.

## Components

- **`product/ProofCta.astro`** (A4) — slim band, props `{type, slug}`; copy driven by `isProvenProduct`. Reused for books as-is.
- **NEW `ui/ProofBand.astro`** — generic presentational band for non-product surfaces (stories). Same markup/voice as `product/ProofCta`'s unproven variant, **no product coupling** (no `type`/`slug`, no proof-matrix import). Avoids overloading A4's clean product interface with a "no product" mode. Optional `source` prop only for an analytics hook if needed later.
- **`ui/OfferSlot.astro`** (A6) — reused on letters with letter-appropriate copy.

Rationale for a new `ProofBand` vs. reusing `product/ProofCta` with a fake slug: passing a non-existent slug to lean on `isProvenProduct`→false is a silent smell. A purpose-named component keeps editorial pages decoupled from the product proof matrix and matches component weight to context (slim band for a universal footer; the heavy 3D mini-hero stays for mid-article Proof-tagged placement).

## Files touched

1. `src/layouts/ProductDetail.astro` — guard `software||model` → `software||model||book` (~line 279). One-token change.
2. `src/components/ui/ProofBand.astro` — NEW slim generic band.
3. `src/pages/story/[slug]/index.astro` — render `<ProofBand>` after the article, before `StorySubscribe`.
4. `src/components/letters/LetterArticle.astro` (or the letter `[slug]` page) — render `<OfferSlot>` after the capability close. Decide inside-component vs page-level during impl (inside-component keeps every edition consistent, matching the close's own "same on every edition" design).

## Voice / guardrails

- Grade 3–5, no em-dashes, no invented per-product claims ([[website-copy-style]]).
- Theme-aware (both light + dark) — reuse the existing band's `bg-surface-raised` + `bg-accent`/`text-accent-text` accent triad (already WCAG-clean per the 06-22 CTA sweep).
- No commerce/secrets/funnel logic touched — `OfferSlot` already posts to the live double-opt-in funnel.

## Verification

- `npm run build` clean (expect 68pp).
- In-browser both themes: book detail shows band → `/proof/`; a non-Proof story shows the end band; a letter shows the OfferSlot below its close, no duplicate Proof link.
- No duplicate capture card on story pages.
- `scripts/check_agent_parity.py` not affected (no CLAUDE/AGENTS change).
