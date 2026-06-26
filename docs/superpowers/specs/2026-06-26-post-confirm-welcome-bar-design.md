# Post-confirm welcome bar — design

Date: 2026-06-26
Status: approved (brainstorm)
Relay context: A6 follow-up (single-product pivot set). Operator ask 2026-06-26.

## Problem

When a subscriber clicks the double-opt-in confirm link, the confirm-email edge
function redirects to `/?confirmed=1`. Today that state surfaces as a small
floating toast (`src/components/ui/ConfirmBanner.astro`): it sits at `top-20`,
auto-dismisses after 8 seconds, and cleans the URL so a reload does not re-show
it. The operator's feedback: this is low-visibility and easy to scroll past, and
because the URL is cleaned, an accidental reload loses it entirely. It also does
nothing to move the freshly-confirmed subscriber toward the flagship Proof
surface.

## Goal

For the **success state only**, replace the floating toast with a prominent,
full-width welcome bar that:

1. Is unmissable — full-width, sits in normal page flow directly under the nav,
   pushes the hero down (does not float over content).
2. Persists for the browser session — survives the URL clean and accidental
   reloads, so the welcome is not a one-frame flash.
3. Drives the next action — a primary CTA to `/proof/` ("See the proof").
4. Is dismissible — a manual ✕ that suppresses it for the rest of the session.

The `already` and `error` states are **out of scope for the bar**: they remain
the existing small floating toast (one-shot acknowledgments), unchanged.

## Non-goals

- No new analytics events (the funnel already fires GA4 on signup/confirm).
- No bar on deep pages — the component is mounted only on the homepage, which is
  where the confirm link lands.
- No automated test layer — this is a presentational change, verified in-browser
  the same way the original `ConfirmBanner` was.
- No change to the confirm-email edge function or its redirect contract.

## Approach

Reshape the existing `src/components/ui/ConfirmBanner.astro` rather than add a new
file. It already owns the `?confirmed=` contract and is wired once in
`src/pages/index.astro`. The component renders **two distinct markup blocks**
keyed on state:

- **Success bar** (`?confirmed=1`) — the new prominent full-width band.
- **Toast** (`already` / `error`) — the existing floating toast, essentially
  unchanged.

### Component structure

`ConfirmBanner.astro` emits:

1. A **success bar** `<div>`: full-width, in normal flow, server-rendered with
   `hidden`. Contains a check icon, a welcome line, a primary CTA button
   ("See the proof →" → `/proof/`), and a dismiss ✕ button.
2. The **existing toast** `<div>`: floating, `fixed top-20`, server-rendered with
   `hidden`. Contains a status dot, text, and a ✕ button.
3. A `<script>` that decides which (if any) to reveal.

### Placement & layout

The success bar renders as the **first child of `<body>` flow, above `<main>`
and below the sticky `<Nav>`**. Because it is in normal flow (not `fixed`), it
reflows the page and pushes the hero down — unmissable. The nav stays sticky on
top. In `index.astro` the `<ConfirmBanner />` call already sits between `<Nav />`
and `<main>`, so no structural move is needed; the success-bar markup just needs
to be a normal-flow block rather than a `fixed` overlay.

### CLS guard

The bar is server-rendered with `hidden`. A **pre-paint inline script** (the same
discipline as the no-FOUC theme init in `Layout.astro`) decides visibility before
first paint, so the reflow happens before paint rather than as a post-paint jump.
When the bar is not shown, it has zero layout footprint.

### Persistence & dismiss logic

Two `sessionStorage` keys:

- `of-confirm-welcome` — set to `'1'` the first time `?confirmed=1` is seen.
- `of-confirm-welcome-dismissed` — set to `'1'` when the user dismisses or acts.

Algorithm on each homepage load:

1. Read `confirmed` from the URL query.
2. If `confirmed === '1'`:
   - Set `sessionStorage['of-confirm-welcome'] = '1'`.
   - Clean the URL (`history.replaceState` to `location.pathname`) — keep this so
     a shared/bookmarked URL does not carry the param.
3. Show the **success bar** when
   `sessionStorage['of-confirm-welcome'] === '1'` AND
   `sessionStorage['of-confirm-welcome-dismissed'] !== '1'` — regardless of
   whether the param is present this load. This is what makes it survive reloads.
4. Dismiss ✕ → set `of-confirm-welcome-dismissed = '1'`, hide the bar. Never
   shows again this session.
5. The "See the proof →" CTA also sets `of-confirm-welcome-dismissed = '1'`
   before navigating, so returning to the homepage in the same session does not
   re-nag.

For `confirmed === 'already'` or `confirmed === 'error'`: show the **toast**
(unchanged behavior — `already` auto-dismisses after 8s; `error` shows a red dot
and manual-dismiss only). These states are **not** persisted to sessionStorage —
they are one-shot, param-driven acknowledgments.

If no param is present and no persisted welcome flag is set, nothing renders.

### Theme & accessibility

- The CTA uses the DS **accent triad** (`bg-accent` / `text-accent-text` /
  `hover:bg-accent-hover`) so it resolves correctly in both light and dark with
  no white-on-cyan WCAG regression (per the 2026-06-22 CTA-alignment rule).
- The bar band uses a theme-aware surface (`bg-surface-raised` or an
  accent-tinted equivalent) with `text-text`; contrast verified in-browser both
  themes.
- The success bar carries `role="status"` and `aria-live="polite"`; the ✕ keeps
  `aria-label="Dismiss"`.

### Copy

Grade 3–5 English, no em-dashes, no AI tells (per website-copy-style):

- Headline (working): "You're in. Welcome to the real build log."
- CTA: "See the proof →"

Exact wording finalized during build and shown in-browser before commit.

## Files touched

- `src/components/ui/ConfirmBanner.astro` — reshaped (the only code file).

No changes to `index.astro` (already mounts the component in the right spot),
edge functions, catalog, or the funnel.

## Verification

- `npm run build` clean (expect 68 pages).
- In-browser on `http://localhost:4321/`:
  - `/?confirmed=1` → success bar shows, reflows the hero down, URL cleans.
  - Reload `/` → bar persists (sessionStorage), no param needed.
  - Dismiss ✕ → bar gone; reload `/` → stays gone this session.
  - "See the proof →" → navigates to `/proof/`; return to `/` → bar stays gone.
  - `/?confirmed=already` → neutral toast, auto-dismiss.
  - `/?confirmed=error&error=...` → red-dot toast, manual dismiss only.
  - Both themes (light + dark) legible; computed contrast checked.
- No console errors.

## Out of scope (logged, not built)

- Offer-aware confirmation email body (separate A6 follow-up).
- Bar on deep pages / pairing with A10 OfferSlot placement (A10 is its own task).
