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
| S2 | Design system: single light theme + assets | ⬜ queued |
| S3 | App shell: Layout + Nav + Footer | ⬜ queued |
| S4 | Homepage part 1: hero + CTA + narrative + lead form | ⬜ queued |
| S5 | Homepage part 2: highlights + stories carousel | ⬜ queued |
| S6 | Books page (showcase + link out) | ⬜ queued |
| S7 | Software page (platform, neosignal, fieldkit, API) | ⬜ queued |
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

## S2 — Design system: single light theme + assets ⬜

**Port-from:** donor `src/styles/global.css`, `public/` (logo mark, favicon, manifest).

- Create `src/styles/global.css`: collapse to one light theme (promote donor `[data-theme="light"]` token values into the default `@theme`; see spec §7). Keep fonts, scroll-reveal/SVG animations, noise grain (opacity 0.015), focus/selection/scrollbar, heading clamp scale.
- **Drop** dark defaults, `[data-theme]`, `.theme-transitions`, always-dark code-block rules.
- **Logo:** copy donor `public/logos/ai-native-logo.png` → `public/logos/orionfold-logo.png` (1000×1000 transparent PNG, dark-navy "A" delta w/ cyan streaks). Regenerate `favicon.svg`/`.ico`, `apple-touch-icon.png`, and `manifest.json` icons from it (not the donor "S" set).

**DoD:** ☐ a throwaway test page renders light tokens + Geist + a `[data-animate]` reveal · ☐ favicon/logo assets present · ☐ build clean.

---

## S3 — App shell: Layout + Nav + Footer ⬜

**Port-from:** donor `src/layouts/Layout.astro`, `src/components/Nav.astro`, `src/components/Footer.astro`.

- `Layout.astro`: SEO/OG/JSON-LD head, canonical, favicon links, font preload. **Remove the no-FOUC theme script.** Props: title/description/ogImage/jsonLd.
- `Nav.astro`: logo mark (`public/logos/orionfold-logo.png`, ~34px) + **"Orion"+"fold"** wordmark ("fold" in `--color-primary`); top links **Books · Software · Models · Story**; mobile hamburger; scroll-blur. Remove `ThemeToggle`.
- `Footer.astro`: footer menu (group links to the 4 pages) + **Terms · Privacy** + social icons (YouTube `@ainativebusiness`, X `@manavsehgal`, GitHub `manavsehgal`). Update copyright to Orionfold LLC.

**DoD:** ☐ shell renders on a stub page · ☐ nav links route (even to stubs) · ☐ mobile menu toggles · ☐ social icons link out · ☐ build clean.

---

## S4 — Homepage part 1: hero + CTA + narrative + lead form ⬜

**Port-from:** donor `src/components/sections/Hero.astro`, `src/components/ui/WaitlistForm.astro`; this repo's `main.js` (form POST + `?confirmed=` handling).

- `src/pages/index.astro` using `Layout`.
- Hero: H1 "Do you want to grow 10x using AI?", subtitle, CTA button "I am ready to grow 10x fast" → smooth-scroll to `#why`.
- Narrative sections: Why (`#why`) → What you need to do → How Orionfold can help (closes with lead-capture form, value prop "personalized newsletter + exclusive offers").
- Form: vanilla, POST to `https://orionfold.supabase.co/functions/v1/waitlist-signup` with email + honeypot + `source: "home"`. Port the `?confirmed=1|already|error` banner handling onto the page.

**DoD:** ☐ CTA scrolls to `#why` · ☐ narrative reads Why→What→How→form · ☐ `?confirmed=1` shows success banner · ☐ build clean. *(Live submit verified at S12.)*

---

## S5 — Homepage part 2: highlights + stories carousel ⬜

**Depends on:** S4, and S9 data (can stub stories until S9).

- Highlight sections: **Book** (AI Native Business → `/books/`), **Software** (AI Native Platform → `/software/`), **Model** (Patent Strategist, headline "Offline patent-prosecution reasoning on Spark-class hardware" → `/models/`).
- **Stories carousel:** top 3 Story posts, vanilla scroll-snap (idiom from `Nav.astro` inline script).

**DoD:** ☐ three highlight sections render + link · ☐ carousel scroll-snaps through 3 cards · ☐ reduced-motion respected · ☐ build clean.

---

## S6 — Books page ⬜

**Source:** spec §6 (Books). `src/data/books.ts` + `src/pages/books.astro`.

- Two cards: AI Native Business (→ ainative.business/book) and Field Notes (→ ainative.business/field-notes). Placeholder cover slots.

**DoD:** ☐ `/books/` renders both cards · ☐ external links correct · ☐ build clean.

---

## S7 — Software page ⬜

**Source:** spec §6 (Software). `src/data/software.ts` + `src/pages/software.astro`.

- Four cards: AI Native Platform (→ /docs/), neosignal (→ neosignal.io), fieldkit (→ /fieldkit/), AI Native API (→ /docs/api/).

**DoD:** ☐ `/software/` renders four cards · ☐ external links correct · ☐ build clean.

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
