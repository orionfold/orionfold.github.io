# G-111 design QA — product-led, light-only Flow Ideas homepage

**Review target**

- Canonical homepage at `http://127.0.0.1:4321/`.
- Desktop viewport: 1440 × 900.
- Mobile viewport: 390 × 844 (384 CSS-pixel client width in the in-app browser).
- Representative public route: `/about/`.
- Representative private-layout route: `/training/relay-operator-workshop/access/`.

**Hero findings**

- The operator-approved copy pair is “You drive the work. Flow tunes AI to your needs.” with the founder quote “I stay in the driver’s seat. Flow tunes AI to the work in front of me, runs it where I choose, and changes nothing until I approve.”
- The daylight landscape racing pit-stop creative remains the full-bleed desktop hero background.
- Mobile resolves the dedicated daylight portrait crop; the racing world, Orionfold sign, headline, and primary CTA remain visible in the opening composition.
- The separate right-side vertical campaign still/film card is absent.
- The right proof position renders the operator-selected real `flow-expand-hover-panel-shot.webp` Flow capture in landscape format. The title-bar brand, working document, selected text, Expand with Sources action, and receipt timeline are visible together, with the existing ambient glow, compositor-only float, hover lift, and diagonal sheen shell. At large desktop it is 10% larger and right-anchored through the viewport edge; the complete 16:9 frame remains visible, and the text column itself is unchanged. Mobile also keeps the complete frame.
- Product-shot badges and captions are removed so the full product surface stands on its own.
- The hero title and selected product frame render at 90% opacity. The 6px custom scrollbar track now matches the light racing canvas, removing the white strip beside the background without stretching or cropping the artwork.
- The product capture is visible without opacity gating and is not a second eager LCP candidate.
- The page renders one H1 and has no horizontal overflow at either reviewed viewport.
- The former hero telemetry, pit-stop link, and user/driver plus Flow/race-car legend are absent.
- At desktop, the audience statement stays on one line while all three launch pills share a right-aligned row beside it.
- A buyer-facing capability ticker loops inside the racing creative from y=794 to y=872 at 1440×900, leaving 28px before the fold. It names verified cloud routes, local routes, AI subscriptions, everyday Flow work, Agency capabilities, and governance controls. It does not advertise Swift or other implementation details.

**Blueprint and grid findings**

- The daylight racing-car blueprint remains recognizable behind the race-act sections.
- Contrast sharpening preserves the meaningful car outline while the shared opacity and radial mask keep it subordinate to copy and product evidence.
- A one-pixel technical grid uses the same fade mask, so the raster blueprint dissolves into the grid instead of ending as a hard-edged image.
- Desktop and mobile resolve only daylight blueprint sources.

**Light-only appearance findings**

- Homepage, `/about/`, and the private-layout access route all render `data-theme="light"` with the light body background.
- No theme switcher is present.
- No dark appearance asset is requested on the reviewed routes.
- Stale saved preference, system color-scheme, campaign flag, and component tone props have no homepage appearance path.
- Intentional dark content inside screenshots or campaign photography remains content within the light page, not a selectable site theme.

**Behavior and diagnostics**

- No browser console warnings or errors were observed on the reviewed routes.
- No horizontal overflow was observed at desktop or mobile widths.
- Product-shot float and sheen are transform-only; the reduced-motion rule removes both loops while leaving the screenshot visible and static.
- The capability ticker uses two identical halves and a `translateX(-50%)` seam; reduced motion pauses the loop.
- The campaign flag still gates the separate Ideas concept route but no longer selects homepage appearance.
- The former original/dark/light homepage comparison routes and sitemap exception are removed.

**Verification**

- `npm run test:node` — pass, 72/72 tests.
- `git diff --check` — pass.
- `npm run build` — pass, 144 pages.
- `PUBLIC_FLOW_IDEAS_CAMPAIGN=true npm run build` — pass, 144 pages. The build used existing local snapshots when sandboxed live roadmap/trust pulls were unavailable.
- Browser QA — pass at 1440 × 900 and 390 × 844, plus representative public/private-layout routes.

**Operator gate**

- Implementation is ready for visual acceptance.
- No Website commit, push, deploy, campaign activation, spend change, or public positioning change has been performed or authorized.

final result: ready for operator visual acceptance
