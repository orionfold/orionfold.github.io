# HANDOFF — orionfold.com build

> **What this is.** The build spine for rebuilding orionfold.com from a vanilla HTML/CSS/JS
> stealth page into an **Astro 5 marketing site** cloned from `ainative.business` (light theme
> only), framing **Orionfold as the parent studio** that ships the AI Native platform, neosignal,
> fieldkit, the AI Native API, the book, Field Notes, and HuggingFace models. Each task below is
> sized to **comfortably run in one cleared Claude Code session**.

- **Canonical spec:** `specs/ainative-clone.md` (git-ignored, local-only). Read it first.
- **Donor repo (port from here):** `/Users/manavsehgal/Developer/ainative-business.github.io`
  — Astro 5 + Tailwind v4. Has every pattern named below.
- **Live backend (reuse, do not move):** Supabase project `lgnmmcxvwdnusvfpguvf`
  (`orionfold.supabase.co`) — `waitlist` table + `waitlist-signup`/`confirm-email` edge fns +
  Resend double-opt-in. **Capture funnel is done and working — never break it.**

---

## Session protocol

**Each cleared session is one task below.**

**On start**
1. Read `specs/ainative-clone.md`, then this `HANDOFF.md`; find the first ⬜/▶ task.
2. Skim *only* the donor files that task names (the main lever that keeps a session in one context window).

**Golden rules (do not violate without operator approval)**
- 🔒 **Never switch the GitHub Pages source until S12 ("the flip").** Pages serves the vanilla
  `index.html` today; the Astro build develops alongside it and goes live only at launch. Until
  then, build sessions are local-only (`npm run dev` / `npm run build`).
- 🔒 **Never touch the live `waitlist`/`confirm-email` edge fns, the `waitlist` migration, or any
  secret.** New backend work is additive only.
- 🔒 **Secrets live on Supabase / in `.env.local` (git-ignored), never committed.**
- 🔒 **Preserve `CNAME` (`orionfold.com`)** through every change — ship it as `public/CNAME`.
- 🔒 **Light theme only.** No dark mode, no theme toggle.

**On finish**
1. Tick the task's DoD checkboxes.
2. Flip its status marker (legend below) and date it.
3. Append a one-line **→ next/gotchas** note under the task.

**Dev gotcha (funnel):** the edge-function CORS allowlist is `https://orionfold.com`, so the
lead form will CORS-fail from `localhost`. Full submit test is a launch/ops step on the live
domain — don't treat a localhost CORS error as a bug.

**Status legend:** ✅ done · ▶ in progress · ⬜ queued · 🅿️ parked

---

## Build progress at a glance

| # | Session | Status |
|---|---------|--------|
| S0 | Spec + HANDOFF (this planning session) | ✅ done |
| S1 | Astro scaffold + Tailwind v4 + deploy pipeline | ✅ done |
| S2 | Design system: single light theme + assets | ✅ done |
| S3 | App shell: Layout + Nav + Footer | ✅ done |
| S4 | Homepage part 1: hero + CTA + narrative + lead form | ✅ done |
| S5 | Homepage part 2: highlights + stories carousel | ✅ done |
| S6 | Books page (showcase + link out) | ✅ done |
| S7 | Software page (platform, neosignal, fieldkit, API) | ✅ done |
| S8 | Models page (8 HF models + dataset) | ⬜ queued |
| S9 | Story collection + index + posts | ⬜ queued |
| S10 | Terms + Privacy (Orionfold-modified) | ⬜ queued |
| S11 | SEO baseline | ⬜ queued |
| S12 | Launch readiness + the flip | ⬜ queued |

> **Future (separate specs):** OpenRouter AI features · real Story content · book/model artwork.

---

## S1 — Astro scaffold + Tailwind v4 + deploy pipeline ✅ `2026-05-24`

**Port-from:** donor `package.json`, `astro.config.mjs`, `.github/workflows/deploy.yml`, `public/fonts/`.

- Scaffold Astro 5 in this repo **without disturbing** `index.html`/`styles.css`/`main.js`/`video.mp4`.
- Deps: `astro@^5`, `@tailwindcss/vite@^4`, `tailwindcss@^4`, `@astrojs/sitemap@^3`. **No React, no MDX.**
- `astro.config.mjs`: `site: 'https://orionfold.com'`, `trailingSlash: 'always'`, tailwind vite plugin, sitemap integration.
- Copy Geist `.woff2` fonts into `public/fonts/`. Add `public/CNAME` = `orionfold.com`.
- Add `.github/workflows/deploy.yml` (port donor's, **drop** the Chrome/OG step). **Trigger is `workflow_dispatch`-only — the `push: [main]` auto-deploy stays commented out until S12, so pushing to remote before the flip triggers no deploy. Do not enable as Pages source yet.**

**DoD:** ☑ `npm run dev` boots a blank Astro page · ☑ `npm run build` clean to `dist/` · ☑ vanilla page still intact · ☑ Pages source unchanged.

**→ next/gotchas:** Astro `5.18.1` installed (deps: astro, @tailwindcss/vite, tailwindcss, @astrojs/sitemap — no React/MDX, no fontsource; the 4 Geist `.woff2` live in `public/fonts/` for an `@font-face` wire-up in S2). Scaffold files (`package.json`, `astro.config.mjs`, `tsconfig.json`, `src/`, `public/`, `.github/`, `package-lock.json`) are **untracked, not yet committed/pushed** — build sessions stay local-only per the golden rules, so nothing has triggered CI. `dist/`, `node_modules/`, `.astro/` added to `.gitignore`. `deploy.yml` is `workflow_dispatch`-only — the `push: [main]` trigger is commented out, so pushing to remote before S12 triggers **no** deploy (the branch-based Pages source keeps serving the vanilla page); S12 uncomments the push trigger and switches the Pages source to GitHub Actions in one move. `index.astro` is a throwaway placeholder — S3 introduces `Layout.astro` and S4 builds the real homepage. Local Node is v22; CI workflow pins Node 20 (matches donor). S2 is next: port donor `src/styles/global.css` collapsed to one light theme + regenerate logo/favicon assets.

---

## S2 — Design system: single light theme + assets ✅ `2026-05-24`

**Port-from:** donor `src/styles/global.css`, `public/` (logo mark, favicon, manifest).

- Create `src/styles/global.css`: collapse to one light theme (promote donor `[data-theme="light"]` token values into the default `@theme`; see spec §7). Keep fonts, scroll-reveal/SVG animations, noise grain (opacity 0.015), focus/selection/scrollbar, heading clamp scale.
- **Drop** dark defaults, `[data-theme]`, `.theme-transitions`, always-dark code-block rules.
- **Logo:** copy donor `public/logos/ai-native-logo.png` → `public/logos/orionfold-logo.png` (1000×1000 transparent PNG, dark-navy "A" delta w/ cyan streaks). Regenerate `favicon.svg`/`.ico`, `apple-touch-icon.png`, and `manifest.json` icons from it (not the donor "S" set).

**DoD:** ☑ a throwaway test page renders light tokens + Geist + a `[data-animate]` reveal · ☑ favicon/logo assets present · ☑ build clean.

**→ next/gotchas:** `src/styles/global.css` written by promoting the donor's `[data-theme="light"]` values into the default `@theme` (verified: compiled CSS emits `--color-surface:oklch(98% .005 260)`, zero `data-theme` selectors leak). Dropped the dark `@theme`, the `[data-theme]` block, `.theme-transitions`, and the always-dark `.astro-code`/`.prose` code rules; **folded** noise-grain `0.015`, `.timeline-line`, and `.hero-gradient-text` into un-prefixed base rules (they were `html[data-theme="light"] …` overrides that would never match again). **Assets** (all in `public/`, copied into `dist/` on build): parent mark `logos/orionfold-logo.png` (donor `ai-native-logo.png` verbatim, 1000×1000); regenerated from it via ImageMagick → `favicon.svg` (SVG wrapping a 64px base64 PNG, same idiom as donor), multi-res `favicon.ico` (16/32/48/64), `apple-touch-icon.png` (180), and PWA icons **renamed** `orionfold-{64,128,512}.png` (replacing donor's `ainative-s-*` set). `manifest.json` rewritten for Orionfold: `theme_color #296cd8` (= primary `oklch(0.55 0.18 260)`), `background_color #f6f9fc` (= surface), `display: browser`. **`index.astro` is still a throwaway** — now a design-system smoke test (token swatches, Geist faces, wordmark, inline IntersectionObserver reveal); S4 replaces its body. S3 (next) builds `Layout.astro`/`Nav.astro`/`Footer.astro`: Layout must add the `<link>`s for `/favicon.svg`, `/favicon.ico`, `/apple-touch-icon.png`, `/manifest.json` + Geist font preloads + the real scroll-reveal observer, and **must NOT port the donor's no-FOUC theme `<script>`** (deleted by design). Nav renders the mark ~34px + "Orion"+"**fold**"(primary) wordmark.

---

## S3 — App shell: Layout + Nav + Footer ✅ `2026-05-24`

**Port-from:** donor `src/layouts/Layout.astro`, `src/components/Nav.astro`, `src/components/Footer.astro`.

- `Layout.astro`: SEO/OG/JSON-LD head, canonical, favicon links, font preload. **Remove the no-FOUC theme script.** Props: title/description/ogImage/jsonLd.
- `Nav.astro`: logo mark (`public/logos/orionfold-logo.png`, ~34px) + **"Orion"+"fold"** wordmark ("fold" in `--color-primary`); top links **Books · Software · Models · Story**; mobile hamburger; scroll-blur. Remove `ThemeToggle`.
- `Footer.astro`: footer menu (group links to the 4 pages) + **Terms · Privacy** + social icons (YouTube `@ainativebusiness`, X `@manavsehgal`, GitHub `manavsehgal`). Update copyright to Orionfold LLC.

**DoD:** ☑ shell renders on a stub page · ☑ nav links route (even to stubs) · ☑ mobile menu toggles · ☑ social icons link out · ☑ build clean.

**→ next/gotchas:** Built `src/layouts/Layout.astro`, `src/components/Nav.astro`, `src/components/Footer.astro` + `src/data/seo.ts` (minimal `SITE` — Layout imports it; **S11 enriches** with ORGANIZATION/PERSON/PUBLISHER JSON-LD + real `/og-image.png`, additive). **Donor idiom kept:** each page imports Layout+Nav+Footer and composes `<Layout><Nav/>…<Footer/></Layout>` (Layout is `<head>` + `<slot/>` + the scroll-reveal & img-zoom scripts only). **Dropped from donor Layout** (per spec §7): no-FOUC theme `<script>`, reader-settings init, `.theme-transitions` script, RSS/JSON `<link>`s, **and the GA tag** (it was ainative's measurement id `G-59FCBN11J6` — keeping it would log Orionfold traffic to the donor; Orionfold's own analytics can be added later). Single `<meta name="theme-color" content="#f6f9fc">` (= manifest `background_color`). Verified clean (`grep` of `dist/index.html`): **0** occurrences of `data-theme`, `gtag`, `theme-toggle`, `feed.xml`, or `ainative-s`. Nav drops `ThemeToggle` + the in-nav GitHub icon (social lives in Footer); wordmark = `Orion`(text)+`fold`(primary). Footer = Explore/Legal/Connect columns; social → YouTube `@ainativebusiness`, X `@manavsehgal`, GitHub `manavsehgal`; copyright "© {year} Orionfold LLC." **Created 6 route stubs** (`books`, `software`, `models`, `story/index`, `terms`, `privacy`) so nav/footer links route instead of 404 — each is `noindex`, marked `S3 STUB`, replaced by S6–S10. `index.astro` is now an **S3 shell stub** (S2 design-system page retired) — S4 replaces its `<main>` with the real hero + narrative + lead form. Note Nav is `position:fixed`, so pages need top padding (stubs use `pt-40`). **Browser-verified** (playwright, dev server): mobile hamburger toggles the menu open (4 links), nav link routes to `/books/`, desktop shell + footer render. `npm run build` clean → 7 pages + `sitemap-index.xml`.

---

## S4 — Homepage part 1: hero + CTA + narrative + lead form ✅ `2026-05-24`

**Port-from:** donor `src/components/sections/Hero.astro`, `src/components/ui/WaitlistForm.astro`; this repo's `main.js` (form POST + `?confirmed=` handling).

- `src/pages/index.astro` using `Layout`.
- Hero: H1 "Do you want to grow 10x using AI?", subtitle, CTA button "I am ready to grow 10x fast" → smooth-scroll to `#why`.
- Narrative sections: Why (`#why`) → What you need to do → How Orionfold can help (closes with lead-capture form, value prop "personalized newsletter + exclusive offers").
- Form: vanilla, POST to `https://orionfold.supabase.co/functions/v1/waitlist-signup` with email + honeypot + `source: "home"`. Port the `?confirmed=1|already|error` banner handling onto the page.

**DoD:** ☑ CTA scrolls to `#why` · ☑ narrative reads Why→What→How→form · ☑ `?confirmed=1` shows success banner · ☑ build clean. *(Live submit verified at S12.)*

**→ next/gotchas:** Built `index.astro` = `<Layout><Nav/><main><Hero/><Narrative/></main><Footer/></Layout>` (no more S3 stub; homepage is now indexable — `noindex` dropped). New files: `src/components/sections/Hero.astro`, `src/components/sections/Narrative.astro`, `src/components/ui/WaitlistForm.astro`, `src/components/ui/SectionLabel.astro`. **The donor's `Hero.astro` layout is NOT ported** — it's a diagram-dominant book hero; the spec dictates a centered H1→subtitle→CTA, so only the *idioms* carried over (dual atmospheric glow, `.hero-gradient-text`, bottom fade, `data-animate-stagger`). **Smooth scroll is CSS-only** (`html{scroll-behavior:smooth}` from S2) — CTA is a plain `<a href="#why">`; `#why` carries `scroll-mt-24` so the heading clears the `position:fixed` nav (browser-verified: heading lands ~108px from top, not under the nav). **`WaitlistForm.astro` fuses two sources:** donor submit/validation/honeypot UX + `main.js`'s `?confirmed=` banner handling, gated behind a new `watchConfirmed` prop (only the home instance sets it, since the confirm-email redirect lands on `/`). Endpoint re-pointed donor `stagent.supabase.co` → **`orionfold.supabase.co`**, `source:"home"`; payload shape `{email,website,source}` unchanged — **do not edit, funnel is live**. Browser-verified (playwright/preview): `?confirmed=1` shows "Confirmed — you're on the list.", hides the input row, and cleans the URL via `replaceState`. **`SectionLabel.astro` ported verbatim** (brand-neutral eyebrow) — S5–S10 reuse it. Narrative copy is original Orionfold parent-studio framing; the "How" product pills currently **all link to stub routes** (`/software/`, `/books/`, `/models/`) — they get real destinations as S6–S8 land. `npm run build` clean → 7 pages + sitemap; `grep` of `dist/index.html`: 0 occurrences of `stagent`, `ainative-business`, `data-theme`, `gtag`. Gotcha for future visual checks: a full-page screenshot shows only eyebrow labels because `[data-animate]` starts at `opacity:0` and the IntersectionObserver doesn't fire without real scroll — force-add `.is-visible` in a JS eval to capture the revealed state. Two benign font-preload console warnings (inherited from the donor `<link rel=preload>` in Layout; not an S4 regression). S5 (next) appends Book/Software/Model highlight sections + the stories carousel to `<main>`, after `<Narrative/>`.

**→ post-S4 copy pass (2026-05-24):** All user-facing copy rewritten to grade 3–5 plain English, em-dashes removed (memory `website-copy-style`; design `docs/superpowers/specs/2026-05-24-marketing-copy-and-behind-the-scenes-design.md`). New reusable **`src/components/ui/BehindTheScenes.astro`** — a no-JS collapsible `<details>` (donor `TermsInThisPiece` idiom) holding the technical depth; three on the homepage (Why/What/How). **Reuse it on Software (S7) + Models (S8)** — those pages are the most technical. Fixed stale "Orionfold ships all three" → "builds all four". Title/OG separator switched from `—` to middot `·` (Layout default + all stub `title=` props + `seo.ts` description/ogImageAlt). Only remaining em-dash in built HTML is a dev HTML comment (honeypot), not reader-facing. Stub "Coming soon — built in S#." lines replaced with friendly one-liners.

---

## S5 — Homepage part 2: highlights + stories carousel ✅ `2026-05-24`

**Depends on:** S4, and S9 data (can stub stories until S9).

- Highlight sections: **Book** (AI Native Business → `/books/`), **Software** (AI Native Platform → `/software/`), **Model** (Patent Strategist, headline "Offline patent-prosecution reasoning on Spark-class hardware" → `/models/`).
- **Stories carousel:** top 3 Story posts, vanilla scroll-snap (idiom from `Nav.astro` inline script).

**DoD:** ☑ three highlight sections render + link · ☑ carousel scroll-snaps through 3 cards · ☑ reduced-motion respected · ☑ build clean.

**→ next/gotchas:** Appended `<Highlights/>` then `<StoriesCarousel/>` to `<main>` after `<Narrative/>`. **New files:** `src/components/sections/Highlights.astro`, `src/components/sections/StoriesCarousel.astro`, and a reusable `src/components/ui/Highlight.astro`. `Highlight.astro` generalises the donor `Book.astro` two-column band: text-side props (eyebrow/title/body/pills/href/ctaText) + a named `<slot name="media">`, with a `reverse` prop that alternates the media side on `lg` (text leads on mobile via `order-2`). The three highlights link to the **showcase stubs** `/books/`, `/software/`, `/models/` (S6–S8 build the real pages). **Cover/app/terminal visuals are CSS-only placeholders** (`aria-hidden`, no images) — real artwork is a later spec; the book is a tilted spine'd cover, software is a macOS-style app frame with a "task running…" skeleton, the model is a faux-terminal showing offline inference. Copy is grade 3–5 w/ inline glosses (agents, patents) per memory `website-copy-style`; **0 reader-facing em-dashes** (the one em-dash in `dist/index.html` is still the S4 honeypot HTML comment). **Carousel is native CSS scroll-snap** (`snap-x snap-mandatory` track + `snap-start` cards, `-mx-6 px-6` so cards bleed to the edge with a peek on mobile, webkit/FF scrollbar hidden). Prev/next arrows are a **progressive enhancement** (`initStoriesCarousel()` + `astro:after-swap`, Nav idiom): `hidden sm:flex`, scroll by one card width, `behavior:'auto'` under `prefers-reduced-motion`, and **auto-disable at the rail ends** — at desktop ≥~1100px the 3 cards fit inside `max-w-6xl` so the rail doesn't overflow and both arrows sit disabled (correct: nothing to scroll); they activate once it overflows (verified at 390px: overflow 531px, snap-start, ~276px cards). **Stories are stubbed inline** (`Why we folded Orionfold` / `Building in public, week one` / `Shipping models from one small desktop`) and all cards + "All stories →" link to the `/story/` stub. **S9 rewires this**: read top-3 from the `story` collection by date and re-point cards to real `/story/[slug]/` routes (the `dateFmt` + card markup mirror the donor `FieldNotesRail.astro` so the swap is mechanical). Reduced motion is handled centrally in `global.css` (`[data-animate]` + `scroll-behavior`); the carousel step() additionally honors it. Browser-verified (playwright, preview): all 7 `<main>` h2s present in order, 3 highlights render + link, carousel snaps, mobile peek + hidden arrows. `npm run build` clean → 7 pages + sitemap. **Visual-check gotcha unchanged from S4:** `[data-animate]` starts at `opacity:0`; force-add `.is-visible` via JS eval before screenshotting, and scroll with `behavior:'instant'` (the global smooth-scroll makes `scrollTo` async, so measuring `scrollY` right after a default `scrollTo` reads a mid-animation value). S6 (next) builds the Books page (`src/data/books.ts` + `src/pages/books.astro`, two cards linking out to ainative.business).

---

## S6 — Books page ✅ `2026-05-24`

**Source:** spec §6 (Books). `src/data/books.ts` + `src/pages/books.astro`.

- Two cards: AI Native Business (→ ainative.business/book) and Field Notes (→ ainative.business/field-notes). Placeholder cover slots.

**DoD:** ☑ `/books/` renders both cards · ☑ external links correct · ☑ build clean.

**→ next/gotchas:** Page is **data-driven**: new typed `src/data/books.ts` (`Book[]` — eyebrow/title/body/pills/href/ctaText + `cover{title,subtitle,tag}`) feeds `books.astro`, which maps each entry onto the **S5 `Highlight.astro` band** (alternating `reverse` via `i % 2`) so the showcase matches the homepage rhythm — no bespoke card layout. Added **one additive prop** to `Highlight.astro`: `external?` (default `false`, so the homepage's internal-link highlights are untouched); when set it adds `target="_blank" rel="noopener noreferrer"` and swaps the right-arrow for an up-right "leaves the site" arrow. New **`src/components/ui/BookCover.astro`** generalises the homepage book-cover idiom (tilted, spine'd, `aria-hidden` CSS-only placeholder, `data-animate`) and takes title/subtitle/tag — **reuse it if S5's inline homepage cover is ever refactored to read `books.ts`** (not done here; S5 left intact). Stub retired: `books.astro` dropped `noindex`, set real `title`/`description` (em-dash-free). Both external links link out to the **canonical homes** on ainative.business (spec's showcase + link-out discipline — no chapters/articles ported). Browser-verified (preview, force `.is-visible`): 2 covers, 2 CTAs → `/book` + `/field-notes`, reversed Field Notes band renders, footer intact. `npm run build` clean → 7 pages + sitemap; `grep` of `dist/books/index.html`: 0 `noindex`, 0 `S3 STUB`/`Coming soon`, 0 em-dashes. **S7 (next)** builds the Software page (`src/data/software.ts` + `src/pages/software.astro`, four product cards linking out) — it can reuse the same `books.ts`→`Highlight` + `external` pattern, and is the first page to fold in `BehindTheScenes.astro` (per spec §7, Software + Models are the technical pages). Four cards = grid, not alternating bands, so a card component (or a 2-col grid of a lighter card) likely fits better than four full-width `Highlight` bands; decide at S7.

---

## S7 — Software page ✅ `2026-05-24`

**Source:** spec §6 (Software). `src/data/software.ts` + `src/pages/software.astro`.

- Four cards: AI Native Platform (→ /docs/), neosignal (→ neosignal.io), fieldkit (→ /fieldkit/), AI Native API (→ /docs/api/).

**DoD:** ☑ `/software/` renders four cards · ☑ external links correct · ☑ build clean.

**→ next/gotchas:** Page is **data-driven** like S6: new typed `src/data/software.ts` (`SoftwareProduct[]` — eyebrow/title/body/pills/href/ctaText, no `cover`) feeds `software.astro`. **Resolved the S6 open question** ("four bands vs grid"): four equal-weight products read better as a **2×2 catalog grid** than four tall alternating `Highlight` bands, so I built a new lighter **`src/components/ui/ProductCard.astro`** (mono eyebrow → `h2` title → plain pitch → label pills → off-site CTA) and laid it out in a `data-animate-stagger` `grid max-w-5xl gap-6 sm:grid-cols-2`. `Highlight.astro`/`books.ts` left untouched — `/books/` keeps its alternating bands. All four cards are **external** (`target=_blank rel=noopener noreferrer` + up-right "leaves the site" arrow, same SVG path as `Highlight`'s `external`): `https://ainative.business/docs/`, `https://neosignal.io`, `https://ainative.business/fieldkit/`, `https://ainative.business/docs/api/` (donor routes `/docs`, `/docs/api`, `/fieldkit` verified to exist; neosignal is its own product, no donor page). **First page to fold in `BehindTheScenes.astro`** (spec §7): one page-level reveal `summary="The technical details"` holds the donor's real vocab the cards omit — task execution/workflows/profiles/schedules/monitoring/cost ledger/agent integration/chat; scoring system + compatibility matrix; KV-cache/NIM/RAG/eval/training/lineage/quantization/HF publish/CLI/viz/notebooks; REST API + 27 endpoint groups across core/intelligence/content/platform/operations. Cards stay grade 3–5 with inline glosses ("flows that run step by step", "the chips that run AI"); **0 reader-facing em-dashes**, 0 `noindex`/`S3 STUB`/`Coming soon`, 0 `stagent`/`data-theme`/`gtag` leak (grepped `dist/software/index.html`). Stub retired (`noindex` dropped, real `title`/`description`). Browser-verified (chrome-devtools, preview, force `.is-visible`): 4 `<article>` cards in the grid, correct titles/eyebrows/pills/CTAs/hrefs, BTS `<details>` present, full-page screenshot clean (light theme + Geist + footer intact). `npm run build` clean → 7 pages + sitemap. **S8 (next)** builds the Models page (`src/data/models.ts` + `src/pages/models.astro`): 8 HF models + 1 dataset grouped by domain (Patent/Security/Legal/Finance/Medical), real `huggingface.co/Orionfold/<repo>` links, copy from donor `src/content/artifacts/*.yaml` + HF cards. It can reuse this exact `data.ts → ProductCard grid + BehindTheScenes` pattern (Models is the other technical page per spec §7) — though grouping by domain may want a sub-heading per group above each card cluster.

---

## S8 — Models page ⬜

**Source:** spec §6 (Models) + donor `src/content/artifacts/*.yaml` + `huggingface.co/Orionfold`.
`src/data/models.ts` + `src/pages/models.astro`.

- Group by domain (Patent, Security, Legal, Finance, Medical) + the bench dataset. Each card: base model, format, recommended variant, one-line positioning, downloads → real `huggingface.co/Orionfold/<repo>`.

**DoD:** ☐ all 8 models + dataset shown · ☐ every link resolves to a real HF repo · ☐ build clean.

---

## S9 — Story collection + index + posts ⬜

**Source:** spec §6 (Story).

- `src/content.config.ts` with a `story` collection (title/date/summary/tags). `src/pages/story/index.astro` + `src/pages/story/[slug]/index.astro`. 3–4 placeholder `.md` posts.
- Wire the homepage carousel (S5) to read top 3 by date.

**DoD:** ☐ `/story/` lists posts · ☐ post pages render · ☐ homepage carousel reads real posts · ☐ build clean.

---

## S10 — Terms + Privacy ⬜

**Port-from:** donor `src/pages/terms.astro`, `src/pages/privacy.astro`.

- Port both; swap entity → **Orionfold LLC**, domain/email → Orionfold. Footer already links here (S3).

**DoD:** ☐ `/terms/` + `/privacy/` render with Orionfold details · ☐ build clean.

---

## S11 — SEO baseline ⬜

**Port-from:** donor sitemap config, `public/robots.txt`, `src/data/seo.ts`.

- Confirm `@astrojs/sitemap` output; add `public/robots.txt`; static `public/og-image.png`; per-page title/description/OG; Organization JSON-LD (Orionfold LLC) in `Layout`.

**DoD:** ☐ `/sitemap-index.xml` builds · ☐ robots present · ☐ each page has meta + OG · ☐ build clean.

---

## S12 — Launch readiness + the flip ⬜ `[ops]`

- Final `npm run build`; review all routes locally.
- **The flip (do together):** (a) uncomment the `push: [main]` trigger in `.github/workflows/deploy.yml`, and (b) switch the GitHub Pages source to GitHub Actions — then push so `deploy.yml` deploys `dist/`. Retire vanilla files (`index.html`, `styles.css`, `main.js`, `video.mp4`). *(Before this, the workflow is `workflow_dispatch`-only and dormant.)*
- Verify on live `orionfold.com`: pages serve, CNAME intact, **lead form submit + email confirmation work end-to-end** (CORS now passes), sitemap reachable.

**DoD:** ☐ Astro site live on `orionfold.com` · ☐ CNAME intact · ☐ funnel verified live · ☐ vanilla files retired · ☐ sitemap reachable.
