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
  - `/Users/manavsehgal/orionfold/website/public/relay/shots/agents-list/light-1600.4207cac7.webp`
  - `/Users/manavsehgal/orionfold/website/public/relay/shots/agents-list/dark-1600.a5e04613.webp`
- Implementation route: `http://127.0.0.1:4321/`
- Intended viewports: desktop 1440 × 1000; mobile 390 × 844
- Intended states: light, dark, reduced motion, and keyboard focus
- Browser-rendered implementation evidence: captured 2026-07-20 in the in-app Browser at 1440 × 1000 dark and 390 × 844 light.
- Full-view comparison evidence: both rendered states preserve the approved blueprint field, product-shot dominance, CTA hierarchy and quiet demo link.
- Focused-region comparison evidence: the resolved theme swaps both the complete visual token set and the responsive Agents screenshot source.

## Findings

- No open visual finding remains. The earlier light-mode defect is resolved and verified in the rendered page.

## Required fidelity surfaces

- Fonts and typography: the pitch hierarchy is preserved; text resolves to dark ink/cyan in light mode and white/cyan in dark mode, while retaining compact mono chrome. Verified.
- Spacing and layout rhythm: one action remains in the pitch column; the grid shifts to a 0.72/1.28 split and the Agents shot uses its full 1.31:1 source ratio. Verified at desktop and mobile.
- Colors and visual tokens: the hero has a pale blueprint canvas, darker cyan action color, light window chrome and restrained shadows by default, plus a scoped dark override that preserves the approved cinematic treatment. Verified.
- Image quality and asset fidelity: the hero retains its eager responsive dark source for the default-theme LCP path and participates in the existing resolved-theme observer to swap to the optimized light Agents capture. Browser readback confirmed the light and dark 1280 variants, correct frame surfaces and no horizontal overflow.
- Copy and content: the Agents library directly supports “Get an AI team”; the whole framed screenshot and the quiet bottom-right “View the interactive demo” label route to `/relay/demo/`, with no “live” claim.

## Comparison history

1. Operator finding — light mode left the whole hero dark because its surface, text, frame chrome, demo link and image source were hard-coded.
2. Fix — replaced those values with a light-default hero token set plus a scoped `html[data-theme='dark']` override; connected the eager Agents image to the existing theme observer with both responsive variants.
3. Post-fix evidence — compiled CSS contains both resolved theme rule sets, built HTML contains both screenshot sources, focused tests and the production build pass, and the in-app Browser shows the light 390 px and dark 1440 px variants with the correct responsive source, no overflow and no console warnings/errors.

final result: passed

---

# Relay Operator Workshop landing — design QA

**Date:** 2026-07-20
**Result:** passed

## Visual truth and implementation evidence

- Product truth: fresh 1274 × 717 captures from the local guided workspace in
  `output/screengrabs/workshop-2026-07-20/`, covering Start, Inspect, Adapt,
  Govern, Run, Retain and Finish in both light and dark themes.
- Focused asset comparison:
  `audit-reports/workshop-landing-design-qa-2026-07-20/focused-raw-vs-optimized.png`
  places the raw Inspect capture beside its 1274 px WebP rendition. UI text,
  borders, chapter controls and the video shell remain legible; no visible
  compression halo, bleeding or crop drift was found.
- Full-layout comparison:
  `audit-reports/workshop-landing-design-qa-2026-07-20/full-layout-before-vs-fixed.png`
  places the initial and corrected Inspect landing sections together.
- Final implementation evidence:
  `workshop-landing-light-desktop.png`, `workshop-landing-dark-desktop.png`,
  `workshop-landing-inspect-light-desktop-fixed.png`,
  `workshop-landing-light-390-fixed.png`, and
  `workshop-landing-dark-390-fixed2.png` in the same audit directory.

## Viewports, themes and interactions

- Desktop: 1280 × 720, public landing section and focused Inspect section.
- Mobile: real responsive 390 × 844 frame, with document width 390 and no
  horizontal overflow.
- Theme states: light and dark; every workshop image changed to the matching
  asset and the inactive theme was not requested.
- Transcript state: Inspect disclosure open, chapter navigation visible, source
  links visible in place.
- Relay handoff states: ready on the configured local runtime, unavailable on a
  stopped alternate address, corrected address, retry and return-to-lesson.

## Fidelity review

- **Typography and copy:** existing Orionfold display, body and mono hierarchy
  is preserved. Step labels, headings and captions remain readable at desktop
  and mobile widths. The seven explainers accurately describe the screen shown.
- **Spacing and layout:** the sequence alternates screenshots and explainers at
  desktop and stacks them coherently on mobile. Section rhythm, frame radii,
  borders and glow treatment use existing page tokens.
- **Colors and surfaces:** page, screenshot frame, labels and captions remain
  coherent in both themes. Screenshots switch with the site theme instead of
  displaying a dark product image on the light page.
- **Image quality:** all fourteen theme masters use the same 1274 / 717 aspect
  ratio. Responsive 720 and 1274 WebP variants remain sharp while bounding one
  active theme to 125,986 bytes light / 121,046 bytes dark on mobile and 258,954
  bytes light / 252,382 bytes dark on desktop.
- **Behavior and accessibility:** images have explicit dimensions, descriptive
  alt text, lazy loading and active-theme-only loading. Native transcript
  disclosures are keyboard reachable. Mobile anchors clear the fixed header.
- **Icons and shortcuts:** no placeholder illustration, CSS art, custom SVG or
  new icon family was introduced. The product imagery is captured from the real
  guided workspace with synthetic workshop data and no private Motion frame.

## Findings and dispositions

1. **P2 · layout:** the first alternating implementation kept the same column
   tracks when the Inspect image moved right, leaving the real screen visibly
   smaller than the adjacent copy. Fixed by swapping the odd-row tracks to
   `1.22fr 0.78fr`; the post-fix combined comparison shows equal visual weight.
2. **P2 · responsiveness:** the `#inside-workshop` mobile anchor initially put
   its heading beneath the fixed navigation. Fixed with the existing Tailwind
   scroll-margin utility; the final 390 px light and dark captures show the
   heading fully visible.
3. **P2 · accessibility:** the final local browser pass showed the public free
   lesson's cross-origin WebVTT track blocked while the MP4 still played. Fixed
   by opting the video element into anonymous CORS; a fresh navigation reports
   zero browser warnings and errors and the source contract is regression tested.

No P0, P1 or unresolved P2 findings remain.

final result: passed

---

# Homepage AI-native business positioning — design QA

**Date:** 2026-07-20

## Evidence

- Source visual truth: the prior homepage gradient treatment in
  `/private/tmp/orionfold-hero-audit/02-home-hero-mobile.png` and the exact
  `hero-gradient-text` implementation from `0fcc7ca^`.
- Normalized source state:
  `audit-reports/homepage-positioning-2026-07-20/home-mobile-prior-gradient-reference.png`
  renders the prior headline in the current layout so viewport, theme, spacing
  and imagery are held constant.
- Implementation screenshots:
  `audit-reports/homepage-positioning-2026-07-20/home-mobile-light-final.png`,
  `home-mobile-dark.png`, `home-desktop-light-fixed.png`, and
  `home-desktop-dark.png` in the same audit directory.
- Viewports: 390 × 844 mobile and 1280 × 720 desktop.
- States: light and dark themes; homepage default route; CTA and product-shot
  composition unchanged.
- Full-view comparison:
  `audit-reports/homepage-positioning-2026-07-20/mobile-prior-gradient-vs-final.png`.
- Focused comparison:
  `audit-reports/homepage-positioning-2026-07-20/focused-headline-gradient-comparison.png`.

## Findings

- No P0 or P1 findings.
- **P2 · headline wrapping — corrected:** the first implementation allowed the
  browser to break `AI-native` after the hyphen at desktop width. Keeping that
  term on one line removes the editorially awkward `AI- / native` split while
  preserving balanced wrapping. Post-fix desktop and 390 px captures show no
  clipping or horizontal overflow.
- No unresolved P2 findings.

## Required fidelity surfaces

- **Fonts and typography:** Geist display/body/mono roles, weight, tracking and
  line height remain unchanged. The whole H1 now reuses the prior ink-to-cyan
  gradient rather than applying cyan to one phrase.
- **Spacing and layout rhythm:** hero grid, margins, CTA, product frame and
  above-the-fold hierarchy are unchanged. The longer promise occupies four
  desktop lines and three centered mobile lines without crowding the abstract.
- **Colors and tokens:** the existing global `hero-gradient-text` token maps
  text ink to Orionfold cyan in light and white to cyan in dark mode. Contrast
  remains coherent with each blueprint surface.
- **Image quality:** the existing responsive Blueprint Gallery source, crop,
  eager loading and theme switching are unchanged and remain sharp in both
  reviewed themes.
- **Copy and content:** visible hero copy preserves all four operator-specified
  optionality dimensions. Homepage title, description, OG title/alt and the
  Organization description now express the same positioning. The CTA support
  label reads `Run AI-native business` while `Get Orionfold Relay` remains the
  primary action; product-specific copy elsewhere is unchanged.
- **Accessibility and responsiveness:** semantic H1 and description remain live
  text; mobile readback reports a 336 px H1 inside a 390 px viewport and a 384
  px document width. Theme controls remain functional and browser console shows
  zero warnings/errors.

## Comparison history

1. Initial desktop capture exposed the P2 hyphen line break.
2. Wrapped `AI-native` as one editorial unit without fixing a full line width.
3. Operator aligned the CTA support label to the new promise; the refreshed
   focused comparison shows the revised label without changing button geometry.
4. Re-captured light/dark desktop and mobile states; no P0/P1/P2 issue remains.

final result: passed
