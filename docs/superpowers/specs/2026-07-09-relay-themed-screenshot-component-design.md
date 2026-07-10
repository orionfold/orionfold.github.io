# Relay theme-aware screenshot component — design

_Date: 2026-07-09 · Status: approved, pre-implementation_

## Problem

Relay product screenshots on orionfold.com are **dark-only** (7 hand-vendored PNGs in `src/assets/relay/`, rendered via Astro `<Image>` in `RelayShowcase.astro`). The site has a real light/dark theme (`data-theme="light|dark"` on `<html>`, 3-way toggle light/dark/**system**, new users default to **dark** regardless of OS). A light-mode reader sees dark screenshots mid-page — a fidelity gap, worst on docs where a reader stares at shots longest.

The Relay `_ASSETS/screenshots/` corpus now ships **matched light/dark pairs** (46 pairs, 92 PNGs) indexed by `metadata/manifest.json`. This spec makes the site render the theme-correct variant at runtime with **zero JS, zero double-fetch, zero CLS, and no LCP regression**, and defines the source-side contract so future corpus updates drop straight in.

## Goals

1. A reusable `<ThemedShot>` component that swaps light/dark shots keyed on the site's existing `data-theme` attribute.
2. Refresh existing `/relay/` imagery and make the component available site-wide (`.astro` surfaces + Rail B docs/api markdown).
3. A manifest-driven sync pipeline (curated selective vendor) so the site ships only what it uses.
4. A `_RELAY` handback conveying the naming/pairing contract Relay conforms to at source.

## Non-goals / scope carve-outs

- **The `/relay/demo/` bundle is excluded.** It is the Rail A verbatim static bundle, copied with zero re-skin per the publish contract, and **renders in light theme as designed**. `<ThemedShot>`, the sync script, and the rehype plugin never touch it. Demo captures are single-theme and are NOT themed-pair targets.
- No above-the-fold / LCP use. The component is **always lazy / below-the-fold by contract**. An above-fold Relay hero stays a normal eager single-theme (dark) `<Image>`, preserving the "1 eager image per page" perf-hygiene invariant.
- No new screenshot placements invented. `RelayShowcase.astro` is today's sole screenshot surface; the other Relay components (`RelaySolution`, `RelayUnderTheHood`, `RelayArchitectureGlance`) are prose/stats/diagrams with no raw screenshots.

## Key decisions (and rejected alternatives)

| Decision | Chosen | Rejected | Why |
|---|---|---|---|
| Swap mechanism | **CSS `background-image` keyed on `[data-theme]`** | Two `<Image>` toggled by CSS; `<picture>`+`prefers-color-scheme` | Only the matched-selector `background-image` is fetched → **guaranteed single fetch**, genuinely zero-JS. `<picture>` can only read `prefers-color-scheme`, which is the WRONG signal (site defaults dark regardless of OS + honors manual toggle). |
| CLS avoidance | **Manifest-driven `aspect-ratio`** inline | `padding-top` hack | Manifest carries exact `viewportSize`; `aspect-ratio` reserves height before load with no `<img>`. |
| Markdown embedding | **Portable `relay-shot:<id>` ref → website rehype rewrite to `<ThemedShot>`** | MDX with explicit `<ThemedShot>` tag; plain single-theme images | Keeps markdown portable + verbatim; Relay ships content+intent only, website owns chrome (one-direction contract). |
| Corpus → site | **Manifest-driven selective sync script (allow-list)** | Vendor whole corpus; symlink/build-time read of `_ASSETS` | Ships only used shots (lean public repo); verbatim copy honors one-direction; in-place read breaks ownership contract + CI/Pages. |
| Asset location | **`public/relay/shots/<id>/{light,dark}.<hash>.webp`** | `src/assets/` (Astro-hashed) | `background-image:url(...)` needs a stable author-time URL; `public/` gives that. Content-hash in filename restores cache-busting. |

## Architecture — four units, one direction

```
Relay source (strategy-owned, read-only from site)
  _ASSETS/screenshots/{light,dark}/<area>/<id>__<viewport>.png
  _ASSETS/screenshots/metadata/manifest.json   (id, theme, viewport, pixelSize, area, alt)
        │  (1) scripts/sync-relay-shots.mjs  — read manifest, filter to allow-list,
        │      copy matched pair verbatim, optimize → WebP (content-hashed), emit index
        ▼
  public/relay/shots/<id>/{light,dark}.<hash>.webp  +  src/data/relay-shots.json
        │  (2) <ThemedShot id="…" />  — reads index, renders <div> w/ CSS custom props,
        │      background-image swaps on [data-theme]; only active variant fetches
        ▼
  Rendered on:
    • .astro surfaces (RelayShowcase, …) → <ThemedShot> directly
    • Rail B docs/api markdown → (3) rehype plugin rewrites ![alt](relay-shot:<id>) → <ThemedShot>
        │  (4) _RELAY handback → ~/orionfold/strategy/relay/_RELAY.md (4-point source contract)
```

**Ownership invariants:** website never writes `_ASSETS` (sync reads only); Relay never writes the site (conforms capture output); `/relay/demo/` untouched by all four.

## Unit 1 — `scripts/sync-relay-shots.mjs`

**Inputs:** `--corpus ~/orionfold/relay/_ASSETS/screenshots` (default); `src/data/relay-shots.allow.json` (array of used `id`s).

**Algorithm:**
1. Read manifest; group entries by `id`, collecting `theme→path`, `viewportSize`, `pixelSize`, `area`, `alt`.
2. For each allow-listed `id`:
   - **Assert matched pair** (`light` + `dark` both present); a half-pair is a **fail-loud** error (source bug to flag on-channel, never silently shipped).
   - Optimize each PNG → WebP via `sharp` (quality ~82), downscaled to ~1024–1280px width (shots render ≤ 32rem ≈ 512 CSS px → 1024 @2×; the 2880px retina source is over-large).
   - Write `public/relay/shots/<id>/{light,dark}.<contenthash>.webp`.
   - Compute `aspect-ratio` from `viewportSize` (CSS-pixel ratio governs layout, not the 2× pixel ratio).
3. Emit `src/data/relay-shots.json`: `id → { light, dark, ratio, alt, area }`.
4. **Prune** `public/relay/shots/<id>/` dirs no longer in the allow-list.
5. Print summary: pairs synced, KB before/after, allow-listed ids missing from manifest (fail), manifest ids skipped (info).

**Guardrails:** corpus read-only; single-theme (demo) shots can't enter (allow-list is themed ids + pair assertion rejects singles). Run manually (`npm run sync:relay-shots`), **not** in the default build — vendored `public/` + json are committed so CI stays deterministic/offline.

## Unit 2 — `src/components/relay/ThemedShot.astro`

Index shape (`src/data/relay-shots.json`):
```jsonc
{ "home-cockpit": {
    "light": "/relay/shots/home-cockpit/light.a1b2c3.webp",
    "dark":  "/relay/shots/home-cockpit/dark.d4e5f6.webp",
    "ratio": "1440 / 1100",
    "alt":   "The Relay home cockpit: live agent activity and per-client tasks.",
    "area":  "home" } }
```

Props (minimal): `id` (required, the corpus join key), `alt?` (override manifest alt; `alt=""` → decorative → `role="presentation"`), `class?` (frame classes passed through), `sizes?` (reserved, unused v1).

Markup + swap:
```astro
<div class:list={['relay-shot', className]}
  style={`--shot-light:url("${shot.light}");--shot-dark:url("${shot.dark}");aspect-ratio:${shot.ratio};`}
  role={label ? 'img' : 'presentation'} aria-label={label || undefined}></div>
<style>
  .relay-shot { background-image: var(--shot-light); background-size: cover;
    background-position: top center; background-repeat: no-repeat; width: 100%; }
  :global([data-theme='dark']) .relay-shot { background-image: var(--shot-dark); }
</style>
```

_Note: `var(--shot-light)` is the CSS **base declaration**, not "what loads first." The browser resolves the winning cascade rule before paint and fetches only that one image. A default (dark) visitor has `[data-theme='dark']` stamped pre-paint, so the dark rule wins and **only `dark.webp` is fetched** — the light base is declared but overridden, never requested until a toggle to light._

**Requirement mapping:**
- **Single fetch:** only the matched-selector rule's `background-image` downloads. New visitor = `data-theme="dark"` pre-paint → only `dark.webp` fetched; `light.webp` loads lazily only on first toggle (one-time, cached — the user's own action, imperceptible). "Only-active-loads" = the inactive variant is never paid for unless viewed.
- **Zero-JS / zero-flash:** pure CSS reacting to the pre-paint attribute; nav toggle flip re-matches the rule instantly.
- **Zero-CLS:** inline `aspect-ratio` from manifest.
- **A11y:** `role="img"` + `aria-label` (it's a `<div>`, not `<img>`); empty-alt escape hatch for decorative use.
- **Never LCP:** no eager/`fetchpriority` path; structurally lazy below-fold; above-fold heroes deliberately don't use it.
- **Missing id:** build-time throw naming the id.

Missing-id guard throws at build; unknown `id` never ships.

## Unit 3 — `src/lib/rehype-relay-shots.mjs`

Registered in `astro.config.mjs` **scoped to `relay-docs` + `relay-api` collections only**. Walks HAST, finds `<img src="relay-shot:<id>">`, extracts `id` + markdown `alt`, replaces with a `<ThemedShot id alt>` component node. Unknown `id` → build-time error naming chapter + id. The `relay-shot:<id>` scheme is an explicit **intent marker**: unambiguous to detect, decoupled from file location, reads as a labeled (broken) image in any plain markdown viewer. `.astro` surfaces need no plugin (they call `<ThemedShot>` directly).

## Unit 4 — `_RELAY` handback (source contract)

Written to `~/orionfold/strategy/relay/_RELAY.md` **on disk only, operator-posted** (never commit/push the strategy repo). A dated `Website→Relay` entry stating:

1. **Matched pairs are the unit.** Every themed shot ships `light/` + `dark/` with same `id`, `viewport`, crop/`pixelSize`. Half-pairs are rejected (sync fails loud). **Demo is exempt** (single-theme light-as-designed, never a themed-pair target).
2. **Manifest is the contract surface.** Each entry carries `id`, `theme`, `viewport`, `pixelSize` (→ aspect-ratio), `area`, and a human-authored **`alt`** (rendered verbatim). The `alt` guarantee is the one new ask on Relay.
3. **`id` is the durable join key.** Allow-list + every `relay-shot:<id>` doc ref join on `id`. **Renaming an `id` is a breaking change** — flag on-channel; don't silently rename.
4. **Docs/api embed via `![alt](relay-shot:<id>)`.** Relay writes the portable marker in verbatim markdown; website rehype renders the chrome. Relay writes no component/CTA HTML.

Plus a "what the website did" note and a "your move" (author per-shot `alt`; keep shipping matched pairs; flag id renames).

## The sweep

1. Map the 7 in-use `RelayShowcase` shots to corpus `id`s; seed `relay-shots.allow.json` with exactly those.
2. Run the sync → vendors those pairs + index.
3. Rewrite `RelayShowcase.astro`: each `<Image src={xShot} …/>` → `<ThemedShot id="…" class="block w-full" />`, keeping frame wrappers + captions. Structure/copy unchanged; only the image element becomes theme-aware.
4. Retire the now-superseded PNGs in `src/assets/relay/` (verify each is unreferenced before delete).
5. `/relay/demo/` untouched.

## Verification

- **Single-fetch:** in-browser (Chrome, `data-theme=dark` default) network panel shows only `dark.webp` requested; toggle to light → `light.webp` fetches once, then cached.
- **Zero-CLS:** Lighthouse CLS ≈ 0 on `/relay/`; layout box reserved before image paints.
- **No LCP regression:** LCP element identity unchanged (not a `.relay-shot`); mobile Lighthouse stays in the 90–99 band.
- **Both themes correct:** `/relay/` renders theme-matched shots in light and dark; toggle live-swaps with no flash.
- **Build fails loud** on an unknown `<ThemedShot id>` / `relay-shot:<id>` doc ref (at component render / Astro build — NOT at sync time; the sync script itself fails loud separately on an allow-listed id missing from the manifest or a half-pair).
- **Deploy is operator-gated** ([[confirm-before-live-deploy]]); all work reversible on `main` first.

## Open follow-ups (not in this spec)

- Wiring themed shots into the actual docs/api chapters happens when those Rail B collections are built (`_RELAY` #15 publish pickup) — this spec provides the mechanism, not the per-chapter authoring.
- If a future surface needs an above-fold themed hero, that's a separate design (would need an eager two-source pattern, out of scope here).
