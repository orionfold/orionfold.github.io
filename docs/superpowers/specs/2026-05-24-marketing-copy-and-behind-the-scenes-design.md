# Design — Marketing copy rewrite + "Behind the scenes" explainers

> **Status:** approved by operator 2026-05-24
> **Scope:** all current user-facing copy + a new reusable explainer component
> **Relates to:** `specs/ainative-clone.md` (canonical), `HANDOFF.md` S4, memory `website-copy-style`

## Goal

Two-sided readability. Visible marketing copy reads at **grade 3–5** (plain words,
short sentences, contractions OK, **no em-dashes**, no AI cadence tells). Technical
readers get optional depth through a collapsible **"Behind the scenes"** reveal per
section. This is the inverse of the donor Field Notes pattern: there, technical
articles explain *down* to general readers; here, simple copy reveals *up* for the
curious.

## Component: `src/components/ui/BehindTheScenes.astro`

Collapsible `<details>` mirroring the donor's `field-notes/TermsInThisPiece.astro`
visual idiom: 1px `--color-border`, rounded, `--color-surface-raised` tint, mono
uppercase eyebrow, a chevron that rotates 180° via `[open]`. **No JS** — native
`<details>`/`<summary>` is accessible and keyboard-friendly out of the box.

- **Props:** `summary?: string` (default `"Behind the scenes"`).
- **Slot:** the technical content (one short paragraph; inline glosses for terms).
- **Layout:** centered, `max-w-2xl`, left-aligned reading text, small/muted.
- **Reuse:** the Software (S7) and Models (S8) showcase pages — the most technical —
  drop the same component in. Record this in HANDOFF so future sessions reuse it.

## Copy rules (from memory `website-copy-style`)

Grade 3–5; short sentences; keep contractions (human); **no em-dashes** (use periods,
commas, or two sentences); gloss unavoidable terms inline `like this (plain meaning)`;
push real depth (model names, GGUF, Spark, edge functions) into the reveal. Product
proper nouns (neosignal, fieldkit, AI Native API, AI Native Platform) stay as names;
their meaning lives in the reveal.

## Files touched

- **New:** `src/components/ui/BehindTheScenes.astro`.
- **`src/components/sections/Hero.astro`** — eyebrow → "Orionfold · an AI studio";
  H1 / subtitle / CTA unchanged (operator wording).
- **`src/components/sections/Narrative.astro`** — rewrite Why / What / How headings,
  intros, force cards, pillar bodies, product-section intro, form value prop; fix
  **"ships all three" → "builds all four"**; add three `BehindTheScenes` blocks
  (one per section) with the approved technical paragraphs.
- **`src/components/ui/WaitlistForm.astro`** — message strings: drop the em-dash
  ("Confirmed — you're on the list." → "You're on the list."), "Network error." →
  "Could not connect. Please try again.", "valid email address" → "real email
  address".
- **`src/components/Footer.astro`** — tagline → "We build open AI software, custom
  models, and the playbooks to run them."
- **Stub pages** (`books`, `software`, `models`, `story/index`, `terms`, `privacy`) —
  replace "Coming soon — built in S#." with a friendly one-liner, no dev references.
- **`src/data/seo.ts` + `Layout.astro` + stub `title=` props** — meta is text content
  too: rewrote `description`/`ogImageAlt` plainly and switched the title/OG separator
  from the em-dash to the middot `·` (matches the hero eyebrow). Lightly overlaps S11.

## Approved copy

### Why (`#why`)
- H2: "AI is moving fast. The gap is growing."
- Intro: "Every few months, AI gets better, faster, and cheaper. People who build with
  AI keep up. People who wait fall behind. Not because they try less. Their work just
  isn't made for AI yet."
- Cards: **New tools every week** — "AI changes so fast that a once-a-year plan can't
  keep up." · **Skill, not staff** — "A 10x worker isn't busier. AI helpers run their
  daily tasks, right on their own computer." · **Open tools caught up** — "Free, open
  AI now matches the big paid tools. No lock to one company. No fee per person."
- Behind the scenes: "Open vs closed, in tech terms. Open models are free to download
  and run on your own machine. Closed models live behind a company's paid service. On
  public benchmarks (shared tests that score AI on the same questions), the best open
  models now land within a few points of the closed ones."

### What
- H2: "Own your AI setup."
- Intro: "You don't need a bigger team or budget. You need four things you control."
- Pillars: **Expert playbooks** — "Books, notes, and real stories that turn hard
  lessons into steps you can follow." · **Open software** — "Run AI helpers and tasks
  yourself. Free and open, with no cap on what you automate." · **Custom models** —
  "AI trained for your field, like patents, security, law, money, or health. Not a
  one-size chatbot." · **Personal devices** — "A computer strong enough to run that AI
  in private, right on your desk."
- Behind the scenes: "\"Open software\" means the code is public and free to run, with
  no fee per user. \"Custom models\" start from open base models like DeepSeek-R1 and
  Qwen, get fine-tuned (trained a bit more) for one field, and ship as GGUF files (a
  format that runs on your own GPU). \"Personal devices\" means Spark-class hardware:
  a small desktop, around $3,000, built to run these models offline."

### How
- H2: "Orionfold builds all four."
- Intro: "We're the studio behind a full AI kit. Open software, custom models, and the
  guides to run it all in private. Every piece links from one place."
- Behind the scenes: "The AI Native platform runs on your own machine. neosignal
  tracks how AI models, chips, and clouds stack up. fieldkit is a free Python toolbox
  of patterns proven on Spark. The AI Native API lets you drive it all with code. Any
  AI feature here runs on a small server function, so keys and private data never reach
  your browser."
- Form value prop: "Get a newsletter made for you, plus early offers, as we build."

### Stub one-liners
Books: "Coming soon. The books and notes we offer will live here." · Software:
"Coming soon. Our open software will live here." · Models: "Coming soon. Our custom AI
models will live here." · Story: "Coming soon. Our build stories will live here." ·
Terms / Privacy: "Coming soon."

## Verification

`npm run build` clean. Browser check: each section shows a closed "Behind the scenes"
that opens to reveal the technical paragraph; chevron rotates; copy reads plain on top.
DoD from S4 still holds (CTA → #why, narrative order, `?confirmed=1` banner).
