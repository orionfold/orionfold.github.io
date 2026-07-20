# Relay Host cross-funnel hero — prior design QA

- Source visual truth: `/Users/manavsehgal/.codex/generated_images/019f76fe-63bf-7d31-93ce-c19088619003/exec-552d4b03-d4e5-4efc-8296-168205fa624e.png`
- AI Native motion reference: `/Users/manavsehgal/ainative-business.github.io/src/components/sections/Hero.astro`
- Full-view comparison evidence: `/private/tmp/relay-host-design-compare.png`
- Implementation evidence:
  - `/private/tmp/orionfold-relay-host-home-desktop.png`
  - `/private/tmp/orionfold-relay-host-relay-feature-fixed.png`
  - `/private/tmp/orionfold-relay-host-relay-feature-dark.png`
  - `/private/tmp/orionfold-relay-host-home-mobile-fixed.png`
- Viewports: desktop 1440 × 1000; mobile 390 × 844
- States: homepage and Relay landing; light and dark themes; settled entrance animation

## Findings

- No remaining P0/P1/P2 mismatch.
- Typography: Geist display/mono treatment preserves the mock's large white/cyan hierarchy, tracked technical eyebrow and compact price note. DOM text remains selectable and accessible.
- Spacing and rhythm: the desktop 0.78/1.22 composition preserves the mock's copy/diagram-to-product-shot balance. Mobile intentionally stacks the screenshot below the story and keeps every line inside the 336px card.
- Colors and tokens: the feature remains a dark cinematic surface in both site themes, using Orionfold cyan for the single interactive color. Surrounding page theme changes do not alter the artwork's contrast.
- Image quality: the flattened 1.5 MB mock is not shipped. The implementation uses the real 56 KB Host deployment WebP through Astro responsive image processing and a purpose-built scalable ten-Cell topology. The product frame preserves sharp UI detail without stretching.
- Copy: the approved `Relay Host` and `One Host. Ten managed Cells.` hierarchy is preserved. The implementation corrects the mock's literal twelve-box drawing to the contracted ten managed Cells.
- Interaction and motion: the CTA and product shot both route to `/relay/host/`. The shot uses the AI Native float, perspective settle, hover lift, live pulse and sheen; all continuous effects stop under `prefers-reduced-motion`.

## Comparison history

1. P1 — competing offers on `/relay/`: the existing Relay Core sticky purchase bar remained visible over the Relay Host feature. Fixed by adding an optional competing-offer boundary to `LandingStickyCta`; browser evidence confirms the bar is hidden while `#get-relay-host` intersects.
2. P2 — mobile clipping: the screenshot's intrinsic width gave the mobile grid an oversized min-content track, clipping copy and the price note inside the card. Fixed with explicit `min-width: 0` constraints on both grid items; the 390px browser check reports zero page overflow and a 278px paragraph inside the 336px card.
3. Post-fix comparison: desktop light and dark captures preserve the reference hierarchy; mobile stacks without clipping; the Host CTA navigates to `/relay/host/`; browser console reports no warnings or errors.

Focused-region comparison was not separately required: the 2400 × 700 combined comparison keeps the heading, ten-Cell topology, product frame and screenshot crop legible. The mobile capture supplies the breakpoint-specific focused evidence.

## Verification

- Primary interaction: `Explore Relay Host` navigated from the homepage feature to `/relay/host/`.
- Responsive: no horizontal overflow at 1440px or 390px.
- Theme: verified in light and dark modes.
- Console: no warnings or errors.
- Production build: passed in the final verification pass (117 pages).

scope result: passed

---

# Homepage Relay product-shot hero — design QA

- Source visual truth:
  - `/Users/manavsehgal/orionfold/website/src/components/product/RelayHostBox.astro`
  - `/Users/manavsehgal/orionfold/website/public/relay/shots/agents-list/dark-1600.a5e04613.webp`
- Implementation route: `http://127.0.0.1:4321/`
- Intended viewports: desktop 1440 × 1000; mobile 390 × 844
- Intended states: light, dark, reduced motion, and keyboard focus
- Browser-rendered implementation screenshot: unavailable; the in-app Browser rejected the local-page refresh and subsequent inspection under its URL safety policy.
- Full-view comparison evidence: blocked because the implementation capture is unavailable.
- Focused-region comparison evidence: blocked for the same reason.

## Findings

- [P1] Final rendered hierarchy is unverified.
  - Location: homepage hero.
  - Evidence: source images were opened and inspected; the implementation passed its source contract, responsive asset byte ceilings, `git diff --check`, and the 125-page production build, but browser capture was denied.
  - Impact: code and asset correctness do not prove the Kanban crop, overlay position, responsive scale, or theme switch look right in the actual page.
  - Fix: refresh the already-open local homepage in the in-app Browser, then capture desktop/mobile and light/dark states and compare them with the source product shots.

## Required fidelity surfaces

- Fonts and typography: the existing pitch hierarchy is preserved, with the Relay Host section's white/cyan emphasis and compact mono chrome. Browser verification pending.
- Spacing and layout rhythm: one action remains in the pitch column; the grid shifts to a 0.72/1.28 split and the Agents shot uses its full 1.31:1 source ratio. Browser verification pending.
- Colors and visual tokens: the Relay Host blueprint field, dark cinematic surface, localized cyan glows, frame chrome and glass-chip treatment are reused. Browser verification pending.
- Image quality and asset fidelity: source WebPs are the current optimized 720/1280/1600 Relay screenshot variants and pass byte ceilings. Rendered sharpness and crop pending.
- Copy and content: the Agents library directly supports “Get an AI team”; the whole framed screenshot and the quiet bottom-right “View the interactive demo” label route to `/relay/demo/`, with no “live” claim.

## Comparison history

- No visual iteration completed because the first implementation capture was blocked. No screenshot-based issue has been falsely marked resolved.

final result: blocked
