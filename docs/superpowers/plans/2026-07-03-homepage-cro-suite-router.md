# Homepage CRO Suite-Router Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `orionfold.com/` from a Proof landing page into a Relay-led suite router: new company-router hero, promoted thesis diagram, company trust trio, Relay as lead product, SEO retargeted off the Proof spear, and a factual count fix.

**Architecture:** Reorder + retone existing homepage sections in `src/pages/index.astro`; add one new component (`CompanyTrustTrio.astro`); retarget the page's `<title>`/meta via explicit props to `Layout.astro` (global defaults untouched); swap the hero art for a new Gemini asset. No commerce, funnel, or secrets touched.

**Tech Stack:** Astro 5 (static `.astro` components), Tailwind, the Orionfold design system (`.of-*` utility classes), the `featured-imagery` skill (Gemini via operator Chrome) for the hero asset.

## Global Constraints

- Work on `main` only, no branches/worktrees (memory `work-on-main-no-worktrees`). Repo root `/Users/manavsehgal/orionfold/website`.
- Copy is grade 3–5/5–7 plain English, no em-dashes, no AI tells (memory `website-copy-style`).
- Brand-prefix rule: always "Orionfold Relay / Proof / Arena," never bare product nouns in H1/`<title>`/meta/OG.
- Perf invariants (memory `mobile-perf-hygiene`, `homepage-hero-constellation`): max 1 eager image per page; the hero image is the LCP candidate → `loading="eager"` + `fetchpriority="high"` + NO `data-animate` on it; all other homepage images stay `loading="lazy"`.
- The "test" per task = `npm run build` stays green (81+ pages) + in-browser verification on `http://localhost:4321/` in BOTH light and dark themes via Chrome MCP (never curl for verification).
- Deploy is operator-gated: commit locally, do NOT push. Hand back via the `Website→Mac` entry in `strategy/orionfold-website/_RELAY.md` (disk-only) when build-green.
- Publish-guard footgun: an underscore-prefixed word anywhere in a commit message trips the hook → write the message to a file and `git commit -F <file>`.

---

### Task 1: Reorder homepage sections + retarget SEO (structural core)

Do the pure reorder + the SEO props first so the page's new skeleton is in place and buildable before any new component exists. `CompanyTrustTrio` is added in Task 2 — until then the reorder omits it (the page is valid without it).

**Files:**
- Modify: `src/pages/index.astro` (section order in `<main>`, lines ~24–33; add `title`+`description` props to `<Layout>`, line ~20)
- Modify: `src/data/og.ts` (the `'/'` OG card `title`, line ~36)

**Interfaces:**
- Produces: the new `<main>` order that Tasks 2–6 slot into. `<CompanyTrustTrio />` is referenced starting in Task 2.

- [ ] **Step 1: Add explicit company SEO props to the Layout call**

In `src/pages/index.astro`, change the opening `<Layout>` tag (currently `<Layout ogImage={og.image} ogImageAlt={og.alt}>`) to pass the company promise as title + description:

```astro
<Layout
  title="Orionfold · Get an AI team without hiring one"
  description="Orionfold takes the AI scattered across your work and runs it through one path you own, see, test, and approve. Agents that do the work, models that know your field, and tests that prove it, all on your own machine."
  ogImage={og.image}
  ogImageAlt={og.alt}
>
```

Leave `src/data/seo.ts` `SITE.description` UNTOUCHED (it is the global fallback for other pages).

- [ ] **Step 2: Reorder the `<main>` sections**

In `src/pages/index.astro`, replace the `<main>` body (currently `Hero → FromTheFounder → FieldEditionBand → CapabilitySystemMap → RelayBand → Highlights → CatalogShelf → StoriesCarousel`) with the Relay-led router order. Note `CompanyTrustTrio` is NOT yet imported — it is added in Task 2, so it is intentionally absent here:

```astro
  <main>
    <Hero />
    <CapabilitySystemMap />
    <RelayBand />
    <FieldEditionBand />
    <FromTheFounder />
    <Highlights />
    <CatalogShelf />
    <StoriesCarousel />
  </main>
```

(Hero rebuild is Task 3; CapabilitySystemMap de-Proof is Task 4; the 14/6 fix is Task 5. This task only moves the existing components.)

- [ ] **Step 3: Align the homepage OG card title**

In `src/data/og.ts`, the `'/'` entry: change `title: 'Private AI capability for small teams'` to `title: 'Get an AI team without hiring one'` (keep `eyebrow: 'Orionfold'` and the `alt`).

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: green, 81+ pages, no errors about missing imports.

- [ ] **Step 5: Verify in browser (both themes)**

Start dev if not running (`npm run dev`), then via Chrome MCP load `http://localhost:4321/`. Confirm: section order is Hero → thesis diagram → Relay band → Arena band → founder letter → book/catalog/stories tail. View source / inspect `<head>`: `<title>` now reads "Orionfold · Get an AI team without hiring one" (NOT the Proof spear). Toggle dark theme, confirm no layout break.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro src/data/og.ts
git commit -F .git-msg-task1.txt   # see message below; -F avoids the underscore-in-message footgun
```

Message (write to `.git-msg-task1.txt`, a git-ignored scratch name, then delete after):
```
feat(homepage): reorder to Relay-led suite router + retarget SEO

Move Relay to lead product, promote the thesis diagram to section 2,
demote the founder letter below product routing. Homepage now passes
its own company-promise title + meta instead of inheriting the Proof
spear default; OG card title aligned. Proof keeps its own spear.
```

---

### Task 2: CompanyTrustTrio component

A new company-scoped trust trio, adapted from the shipped `/relay/` `trustTrio` (`src/pages/relay.astro:133–152`). Lifts "own it / runs on your machine / verify every call" from product scope to company scope, each tile linking its `docs/trust/` page.

**Files:**
- Create: `src/components/sections/CompanyTrustTrio.astro`
- Modify: `src/pages/index.astro` (import it + place it between `<CapabilitySystemMap />` and `<RelayBand />`)

**Interfaces:**
- Consumes: the section order from Task 1.
- Produces: `<CompanyTrustTrio />`, a self-contained section (no props).

- [ ] **Step 1: Create the component**

Create `src/components/sections/CompanyTrustTrio.astro`. It mirrors the `/relay/` trio's data shape + the design-system idiom (icon in a `.of-*` tile, `text-primary` accents, grade 5 copy, no em-dashes). Uses the same `docs/trust/` hrefs (those docs are the company trust source):

```astro
---
// Homepage company trust trio (homepage CRO rebuild, 2026-07-03). The /relay/
// own-it trio (relay.astro trustTrio) lifted from product scope to COMPANY
// scope: the three durable buyer benefits that hold across the whole suite.
// Sits right after the thesis diagram, before the product bands, so the ethos
// is set before any pitch. Each tile links the canonical docs/trust/ page (one
// source, no drift). Copy grade 5, no em-dashes (website-copy-style).
const trio = [
  {
    title: 'You own it forever',
    body: 'The engines are open source and your licenses work offline. If Orionfold vanished tomorrow, your setup keeps running.',
    icon: '<path d="M12 2 4 5v6c0 5.5 3.8 9.5 8 11 4.2-1.5 8-5.5 8-11V5Z"/>',
    href: 'https://github.com/orionfold/relay/blob/main/docs/trust/continuity.md',
  },
  {
    title: 'Runs on your own machine',
    body: 'Everything runs on your own computer. No tracking, no usage reports, no check-ins home.',
    icon: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
    href: 'https://github.com/orionfold/relay/blob/main/docs/trust/data-flow.md',
  },
  {
    title: 'Verify every call yourself',
    body: 'Anything that could leave your machine is listed in full, with an off switch. Check it before you run it.',
    icon: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    href: 'https://github.com/orionfold/relay/blob/main/docs/trust/supply-chain.md',
  },
];
---
<section class="px-6 py-12 sm:py-16">
  <div class="mx-auto max-w-6xl">
    <div class="mb-7">
      <p class="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Why teams trust it</p>
      <h2 class="mt-2 text-3xl sm:text-4xl">Yours to own, run, and check.</h2>
    </div>
    <div data-animate-stagger class="grid gap-4 sm:grid-cols-3">
      {trio.map((t) => (
        <a
          href={t.href}
          data-animate
          class="of-surface of-pressable block rounded-2xl p-6"
        >
          <span class="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" set:html={t.icon} />
          </span>
          <span class="block text-lg leading-tight text-text">{t.title}</span>
          <span class="mt-2 block text-sm leading-relaxed text-text-muted">{t.body}</span>
          <span class="of-text-action of-compact mt-4 inline-block text-xs">See how →</span>
        </a>
      ))}
    </div>
  </div>
</section>
```

Note: the whole tile is an `<a>` using `of-pressable` (surface-hover is correct for a non-solid card here; this is NOT a solid CTA, so `of-pressable` is the right primitive — memory `ds-action-vs-pressable-primitives` only forbids it on SOLID buttons).

- [ ] **Step 2: Import + place it in index.astro**

In `src/pages/index.astro`, add the import next to the other section imports:
```astro
import CompanyTrustTrio from '../components/sections/CompanyTrustTrio.astro';
```
And place it in `<main>` between the thesis diagram and the Relay band:
```astro
    <CapabilitySystemMap />
    <CompanyTrustTrio />
    <RelayBand />
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: green, page count +0 (it is a component, not a route).

- [ ] **Step 4: Verify in browser (both themes)**

Chrome MCP `http://localhost:4321/`: the trust trio renders after the thesis diagram, three tiles, icons visible, each links to a `docs/trust/` GitHub page. Check dark theme: tiles + icons legible, no contrast break.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/CompanyTrustTrio.astro src/pages/index.astro
git commit -m "feat(homepage): company trust trio (own it / runs local / verify)"
```

---

### Task 3: Rebuild the Hero pitch column (copy + CTA row) — art swap deferred to Task 7

Rebuild the hero's left column to the company-router pitch with a Relay-led CTA row. The ART swap waits for the Gemini asset (Task 7); this task keeps the existing image so the page stays buildable and the LCP wiring is proven before the file changes.

**Files:**
- Modify: `src/components/sections/Hero.astro` (eyebrow line ~31–33, H1 ~35–37, paragraph ~39–41, CTA block ~43–66, in-art chip link ~90–96)

**Interfaces:**
- Consumes: `magnetHref('hero-secondary')` (already imported) for the tertiary free-book CTA.
- Produces: the rebuilt hero; Task 7 swaps only the `<Image src=...>` + its `alt`.

- [ ] **Step 1: Rewrite the eyebrow, H1, and paragraph**

In `src/components/sections/Hero.astro`, replace the eyebrow `<p>` text "Prove it yourself, on your own machine" with "Private AI you own, on your own machine". Replace the H1 text "Prove which AI you can trust." with "Get an AI team without hiring one." Replace the subtitle `<p>` (the "Orionfold Proof runs on your own machine..." paragraph) with the company paragraph:

```
Orionfold takes the AI scattered across your work and runs it through one path you own, see, test, and approve. Agents that do the real work, models that know your field, and tests that prove it. All on your own machine.
```

- [ ] **Step 2: Rewrite the CTA row to Relay-led**

Replace the three CTA anchors in the `.of-primary-action` / `.of-secondary-action` / magnet block. Primary → Relay, secondary → Proof, tertiary → free book (keep the magnet href + UTM mechanism):

```astro
      <div class="mx-auto mt-9 flex w-full max-w-[24rem] flex-col items-stretch gap-3 lg:mx-0">
        <a
          href="/relay/"
          class="of-primary-action group w-full justify-center !text-sm sm:!text-base"
        >
          Run real client work with Orionfold Relay
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
        <a
          href="/proof/"
          class="of-secondary-action w-full justify-center !text-sm sm:!text-base"
        >
          See the receipts on Orionfold Proof
        </a>
        <a
          href={magnetHeroHref}
          class="group mt-1 inline-flex items-center justify-center gap-1.5 self-center font-mono text-xs tracking-wider text-text-muted transition-colors hover:text-primary lg:self-start"
        >
          Or get the free AI Native Business book
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </a>
      </div>
```

- [ ] **Step 3: Repoint the in-art chip to Relay**

In the hero art block, change the chip anchor `href="/proof/#get-proof"` and its text "Get Orionfold Proof" to point at Relay: `href="/relay/"` with text "Get Orionfold Relay". (This is the small chip overlaid on the poster image, ~line 90–96.) Leave the `<Image>` element itself for Task 7.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: green.

- [ ] **Step 5: Verify in browser (both themes)**

Chrome MCP `http://localhost:4321/`: H1 reads "Get an AI team without hiring one." CTA row: primary = Relay (cyan solid), secondary = Proof, tertiary = free book link. Chip on the art now says "Get Orionfold Relay" → `/relay/`. Confirm the hero image still paints eager (it is unchanged this task). Dark theme legible.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/Hero.astro
git commit -m "feat(homepage): company-router hero copy + Relay-led CTA row"
```

---

### Task 4: De-Proof the thesis diagram terminus

Reframe `CapabilitySystemMap.astro`'s terminus from Proof-product framing to company scope, so the promoted diagram reads as the suite thesis, not a Proof pitch.

**Files:**
- Modify: `src/components/sections/CapabilitySystemMap.astro` (the `proof` zone label, line ~109)

**Interfaces:**
- Consumes: the section-2 position from Task 1.
- Produces: no new interface.

- [ ] **Step 1: Reframe the terminus zone label**

In `src/components/sections/CapabilitySystemMap.astro`, change the zone label `<p class="flow-zone-label">Proof · open it yourself</p>` (line ~109) to a company-scoped label: `<p class="flow-zone-label">Yours · open it yourself</p>`. Leave the four capability tiles (Advisor / Arena / Cortex / fieldkit) as-is — they already span the suite and are the capability proof. Leave the terminus CTA `/cockpit/` unchanged (SEO equity retained; the brief does not ask to move it).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: green.

- [ ] **Step 3: Verify in browser (both themes)**

Chrome MCP `http://localhost:4321/`: the thesis diagram's terminus label no longer says "Proof · open it yourself"; the four tiles + "Open the Cockpit →" CTA still render. Dark theme fine.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/CapabilitySystemMap.astro
git commit -m "feat(homepage): reframe thesis-diagram terminus to company scope"
```

---

### Task 5: Fix the factual count + reorder the nav

Two small, independent copy edits bundled (both are one-line, both are "correctness" fixes a reviewer would gate together).

**Files:**
- Modify: `src/components/sections/FieldEditionBand.astro` (line ~48)
- Modify: `src/components/Nav.astro` (the `links` array, lines ~32–39)

**Interfaces:** none new.

- [ ] **Step 1: Fix the 15/7 count**

In `src/components/sections/FieldEditionBand.astro` line ~48, change `shipped 15 tools, 7 open models, 3 books, and 2 production` to `shipped 14 tools, 6 models, 3 books, and 2 production`.

- [ ] **Step 2: Reorder the nav to Relay-led**

In `src/components/Nav.astro`, the `links` array (lines ~32–39): reorder the first three flagship entries from Proof · Arena · Relay to Relay · Proof · Arena. Result:

```astro
const links = [
  { href: '/relay/', label: 'Relay' },
  { href: '/proof/', label: 'Proof' },
  { href: '/arena/', label: 'Arena' },
  { href: '/experts/', label: 'Models', divider: true },
  { href: '/learn/', label: 'Books' },
  { href: '/story/', label: 'Story', divider: true },
];
```

Update the header comment block (lines ~13–20) to note the 2026-07-03 reorder to Relay-led (one line: "2026-07-03: nav reordered Proof·Arena·Relay -> Relay·Proof·Arena for the Relay-led homepage router.").

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: green.

- [ ] **Step 4: Verify in browser (both themes)**

Chrome MCP `http://localhost:4321/`: Arena band reads "14 tools, 6 models". Desktop nav order = Relay · Proof · Arena │ Models · Books │ Story. Open the mobile menu (resize narrow), confirm same order. Dark theme fine.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/FieldEditionBand.astro src/components/Nav.astro
git commit -m "fix(homepage): count 14 tools/6 models + nav leads with Relay"
```

---

### Task 6: Grep sweep — confirm no stray Proof spear / wrong counts on the homepage

A verification-only task (no code unless the sweep finds something). Catches any missed occurrence before the hero-art task.

**Files:** none (read-only sweep).

- [ ] **Step 1: Sweep for stale strings**

Run:
```bash
cd /Users/manavsehgal/orionfold/website
grep -rniE '15 tools|7 open models|prove which ai you can trust' src/components/sections/ src/pages/index.astro
```
Expected: NO matches in homepage-reachable files. (The string "Prove which AI you can trust" SHOULD still exist in `src/pages/proof.astro` + `Layout.astro`'s default — those are correct; do NOT touch them.)

- [ ] **Step 2: If any homepage match remains, fix it**

If the grep hits a homepage component, correct it to the company/Relay framing per the spec, rebuild, and fold the fix into the relevant prior commit's spirit (new commit `fix(homepage): sweep stray <string>`). If clean, no commit needed for this task.

---

### Task 7: Generate + wire the new Gemini hero asset (operator-gated curation)

Generate a new hero image matching "Get an AI team without hiring one" via the `featured-imagery` skill (Gemini in the operator's Chrome), curate with the operator, place it, and wire it into the hero preserving the LCP invariants.

**Files:**
- Create: `src/assets/<new-hero-file>.jpg` (exact name chosen at curation; e.g. `src/assets/home/ai-team-hero.jpg`)
- Modify: `src/components/sections/Hero.astro` (the `<Image src={heroImage}>` import + element + `alt`, lines ~7 and ~77–87)

**Interfaces:**
- Consumes: the rebuilt hero from Task 3.
- Produces: the final hero art.

- [ ] **Step 1: Invoke the featured-imagery skill**

Use the `featured-imagery` skill to generate a homepage hero for the concept "Get an AI team without hiring one" — one operator at a controlled path / an AI team the operator directs; house style, dark theme, DS canon (see memories `og-image-strategy`, `poster-variety-feedback` for palette/variety rules). The skill drives Gemini in the operator's logged-in Chrome and stops at the human curation gate.

- [ ] **Step 2: Operator curates + names the file**

Operator picks the winner. Place it under `src/assets/` (propose `src/assets/home/ai-team-hero.jpg`; confirm the final path with the operator).

- [ ] **Step 3: Wire it into the hero**

In `src/components/sections/Hero.astro`:
- Change the import (line ~7) from `import heroImage from '../../assets/proof/orionfold-proof-poster.jpeg';` to the new asset path.
- Update the `<Image>` `alt` (line ~79) to describe the new art (grade 3–5, no em-dashes).
- Keep `loading="eager"`, `decoding="async"`, `fetchpriority="high"`, `data-no-zoom`, and the `widths`/`sizes`/`class` exactly as they are (LCP invariant). Do NOT add `data-animate` to the image.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: green; the new `<Image>` emits `/_astro/` variants (PNG/JPG process fine through Astro — memory `astro-raw-asset-import-gif-footgun` only bites GIFs; this is a JPG, so it is safe).

- [ ] **Step 5: Verify in browser (both themes) + LCP**

Chrome MCP `http://localhost:4321/`: new hero art renders; the Proof laptop poster is gone from the homepage (it stays on `/proof/`). Confirm the new image is the LCP element and paints eager. Dark theme legible.

- [ ] **Step 6: Commit**

```bash
git add src/assets/home/ai-team-hero.jpg src/components/sections/Hero.astro
git commit -m "feat(homepage): new company-router hero art (AI-team concept)"
```

---

### Task 8: Final verification + relay handback

Whole-page pass in both themes, then write the disk-only handback so the operator can review and gate the deploy.

**Files:**
- Modify: `strategy/orionfold-website/_RELAY.md` (append a `Website→Mac` entry, newest-first, at the top of the entries — DISK ONLY, never committed to the website repo)
- Modify: `HANDOFF.md` + `_STATUS.json` (session tracker; git-ignored)

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: green, 81+ pages.

- [ ] **Step 2: Full in-browser pass, both themes**

Chrome MCP `http://localhost:4321/`, light AND dark: verify the whole new page top to bottom — company-router hero + new art, thesis diagram (de-Proofed) at section 2, company trust trio, Relay band as lead product, Arena band with 14/6, founder letter demoted, book/catalog/stories tail, Relay-led nav. Inspect `<head>`: `<title>` + meta + OG all on the company promise, not the Proof spear.

- [ ] **Step 3: Write the relay handback (disk-only)**

Append a newest-first `## 2026-07-03 — Website→Mac — ✅ ...` entry at the top of the entries in `strategy/orionfold-website/_RELAY.md`, summarizing: all P0 + P1 items landed (list them), commit SHAs, build-green + both-themes-verified, the one carve-out (CatalogShelf 6-vs-7 SSOT discrepancy flagged for reconciliation), and that deploy is operator-gated. Status `[closed — over to operator for review + the /proof/ page-2 handoff]`.

- [ ] **Step 4: Update the session tracker**

Update `HANDOFF.md` (prune per the handoff discipline) + `_STATUS.json` to record the homepage CRO rebuild as shipped-local-awaiting-operator-review, and note the 6-vs-7 discrepancy as an open reconciliation item.

- [ ] **Step 5: Report to the operator**

Summarize what shipped, the commits, the one flagged discrepancy, and that nothing is pushed — deploy is their call. Do NOT push.

---

## Self-Review

**Spec coverage:**
- P0-1 company-router hero → Task 3 (copy/CTA) + Task 7 (art). ✓
- P0-2 SEO re-alignment → Task 1 (title/meta props + OG card). ✓
- P0-3 Relay to first product position → Task 1 (reorder). ✓
- P0-4 new Gemini hero asset → Task 7. ✓
- P1-5 one Relay→Arena sequencer → Task 1 (reorder; no Proof band, operator-approved). ✓
- P1-6 promote thesis diagram to ~section 2 + de-Proof → Task 1 (move) + Task 4 (de-Proof). ✓
- P1-7 company trust trio + retire Receipts block → Task 2 (trio; the Receipts block is already absent from index.astro, noted in spec). ✓
- P1-8 demote founder letter → Task 1 (reorder). ✓
- P1-9 fix 15/7 → 14/6 → Task 5 (hardcoded line); CatalogShelf 6-vs-7 carved out + flagged in Task 8. ✓
- P1-10 grade 5-7 + brand-prefix → Tasks 1/3 copy + Task 6 sweep. ✓
- P1-11 nav leads with Relay → Task 5. ✓

**Placeholder scan:** hero-art filename is the one deliberately-open value (chosen at the curation gate); every other step has concrete copy/paths/commands. No TBD/TODO/"handle edge cases". ✓

**Type/name consistency:** `CompanyTrustTrio` named identically in Task 2 create + import. Hero `magnetHeroHref` variable already exists in the file (Task 3 reuses it, does not redefine). Section names in the Task 1 reorder match the existing imports in index.astro. ✓
