# A11 Receipts Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the `/proof/` page's denormalized proof data into a first-class, individually-URL'd content type — a flat `/receipts/` hub plus `/receipts/<slug>/` permalinks — so each piece of evidence is independently crawlable and the `/proof/` cells/cards plus the A4/A10 bands can deep-link to a specific receipt.

**Architecture:** A new `receipts` markdown content collection mirrors the existing `letters` collection wholesale (glob loader, `index.astro` hub, `[slug]/index.astro` permalink, shared article component, per-item OG card, sitemap branch). `src/data/proof.ts` stays the authoritative source for the `/proof/` overview; proof entities gain an optional `receipt?` slug that, when set, redirects their link to `/receipts/<slug>/` (graceful fallback to the existing target otherwise). No `/proof/` visuals change.

**Tech Stack:** Astro 5 (content collections via `glob` loader, static `getStaticPaths`), TypeScript, Tailwind v4 utility classes + existing `of-*` / token classes, schema.org JSON-LD, Satori+resvg OG pipeline.

## Global Constraints

- Work on `main` only. No branches, no worktrees. Commit per task; do NOT push (operator-gated deploy).
- Copy voice: grade 3–5 English, jargon explained, **no em-dashes**, no AI tells (website-copy-style). Honest caveats stay in (receipt-honesty: say "verifiable receipt", never "all gates green").
- Relative time in copy where it reads as velocity; never invent pricing/license/benchmark claims; only `manav@orionfold.com` as an email; no PII/secrets.
- `src/data/proof.ts` arrays remain authoritative — additive changes only, no existing link may break.
- Edge-fn / commerce / funnel / secrets: untouched. This work is read-only over proof data plus reuse of the existing `OfferSlot` double-opt-in funnel.
- Build gate is a clean `npm run build`, not a specific page count (OG cards are routes too, so the route delta is ~20 for ~9 receipts).
- Mirror the `letters` collection patterns exactly; do not invent new conventions.

---

### Task 1: Define the `receipts` content collection + author the first receipt

**Files:**
- Modify: `src/content.config.ts` (add `receipts` collection after the `letters` block ~line 167–181; extend the `collections` export at line 183)
- Create: `src/content/receipts/4b-out-trusts-30b.md` (the first authored receipt — proves the schema end-to-end)

**Interfaces:**
- Produces: a `receipts` collection where `getCollection('receipts')` returns entries with `data: { title: string; metric: string; claim: string; dek: string; date: Date; tags: string[]; hero?: ImageMetadata; heroAlt?: string; relatedTo: string[]; source: { label: string; href: string }[]; verify?: string }` and `id` = the filename stem (e.g. `4b-out-trusts-30b`).

- [ ] **Step 1: Add the collection definition**

In `src/content.config.ts`, immediately after the closing `});` of the `letters` collection (line 181) and before `export const collections`, add:

```ts
// Receipts (A11) — the individually-URL'd evidence gallery. Each entry is one
// checkable claim with a rich explainer body: the test we locked, the run, and
// how anyone reruns it. Mirrors the `letters` glob-loader idiom; the filename
// stem is the URL slug (4b-out-trusts-30b.md -> /receipts/4b-out-trusts-30b/).
// src/data/proof.ts stays the source of truth for the /proof/ overview; a
// receipt only ADDS a deep-link target via its slug. Voice: grade 3-5, no
// em-dashes, honest caveats kept (website-copy-style + receipt-honesty).
const receipts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/receipts' }),
  schema: ({ image }) =>
    z.object({
      // Page + card title, e.g. "A 4B model out-trusts a 30B".
      title: z.string(),
      // The number that pops, shown as the card's big metric, e.g. "4B beats 30B".
      metric: z.string(),
      // The one-line claim this receipt proves.
      claim: z.string(),
      // One-line standfirst, used as the meta description + card dek.
      dek: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()).default([]),
      // Optional curated hero (src/assets/receipts/<id>/hero.* by convention so
      // the OG endpoint can find it); absent -> seeded constellation OG.
      hero: image().optional(),
      heroAlt: z.string().optional(),
      // Stable keys of the proof.ts entities this receipt backs (for back-links
      // + a future sanity check): matrix cells as "matrix:<capability-slug>:<col>",
      // headlines as "headline:<metric-slug>".
      relatedTo: z.array(z.string()).default([]),
      // Where the work lives: field-note story, model page, /dgx-spark/, etc.
      source: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
      // The rerun recipe: how a reader reproduces the result.
      verify: z.string().optional(),
    }),
});
```

- [ ] **Step 2: Register the collection in the export**

Change line 183 from:

```ts
export const collections = { story, productDetail, letters };
```

to:

```ts
export const collections = { story, productDetail, letters, receipts };
```

- [ ] **Step 3: Author the first receipt**

Create `src/content/receipts/4b-out-trusts-30b.md` (real content from the existing `receipts[]` "4B beats 30B" entry + the `/software/advisor/` 18-of-21 receipt — sources already cited in `proof.ts`):

```markdown
---
title: "A 4B model out-trusts a 30B"
metric: "4B beats 30B"
claim: "On a hard locked test, our small Advisor scored 18 of 21. A model eight times bigger scored 8 of 21 and made up three answers."
dek: "We froze a trust test before we trained, then ran it. The 4B model on a desk out-trusted a 30B and never made up an answer."
date: 2026-06-26
tags: ["Trust"]
relatedTo: ["headline:4b-beats-30b", "matrix:answers-from-your-documents:advisor", "matrix:refuses-cleanly-no-made-up-answers:advisor"]
source:
  - label: "Advisor, the model that earned it"
    href: "/software/advisor/"
verify: "Pull the locked test set, run both models against the same 21 questions, and score refusals as wins. The test is frozen before any training, so the score is not tuned to it."
---

We do not ask you to trust the number. We froze the test first, then ran it, then published what happened.

## The test we locked

Twenty-one hard questions. Nine of them are traps: there is no honest answer in the documents, so the right move is to refuse. The other twelve have a real answer that must come from the source, with the source named.

We wrote and froze this test before we trained Advisor. That order matters. A test written after training can be quietly shaped to flatter the model. A test frozen first cannot.

## What happened

Our Advisor is a 4B model, small enough to run on a desk box with no cloud account. It scored 18 of 21. It refused all nine trick questions and leaked zero secrets.

A model eight times bigger scored 8 of 21. It also made up three answers, stated plainly, with no hint they were invented.

## The honest part

The big model is far smarter than ours in the open. Ask it to write a poem or reason through a riddle and it wins. The point here is narrower and it is the one that matters for work you can stand behind: on a locked trust test, a small model you own out-trusted a big one, and only the big one made things up.

## Rerun it

Pull the locked test set, run both models against the same 21 questions, and score a clean refusal as a win. Because the test was frozen before training, the score is not tuned to it. If your numbers do not match ours, tell us.
```

- [ ] **Step 4: Verify the collection type-checks and loads**

Run: `npm run build 2>&1 | tail -20`
Expected: build proceeds past content-collection sync with no schema error mentioning `receipts`. (The `/receipts/` pages do not exist yet, so no new routes appear — that is fine; this step only proves the schema + entry parse.)

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/content/receipts/4b-out-trusts-30b.md
git commit -m "feat(a11): receipts content collection + first receipt

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Receipt article component + permalink route

**Files:**
- Create: `src/components/receipts/ReceiptArticle.astro`
- Create: `src/pages/receipts/[slug]/index.astro`

**Interfaces:**
- Consumes: the `receipts` collection from Task 1.
- Produces: a route `/receipts/<slug>/` for every receipt entry, each carrying `BlogPosting` + `BreadcrumbList` JSON-LD and an `OfferSlot`. `ReceiptArticle.astro` accepts props `{ metric: string; title: string; claim: string; dek: string; dateIso: string; dateFmt: string; sources: { label: string; href: string }[]; verify?: string }` and renders the body via a default `<slot/>`.

- [ ] **Step 1: Create the article shell component**

Create `src/components/receipts/ReceiptArticle.astro` (mirrors `LetterArticle.astro`'s masthead+prose shape; adds the receipt-specific "the receipt" source list + "rerun it" block):

```astro
---
// The render shell for one receipt page. Masthead (metric eyebrow + title +
// claim + date), the explainer body via <slot/>, then the two receipt-specific
// blocks: where the work lives (sources) and how to rerun it. Voice: grade 3-5,
// no em-dashes (website-copy-style); honest caveats stay in (receipt-honesty).
interface Props {
  metric: string;
  title: string;
  claim: string;
  dek: string;
  dateIso: string;
  dateFmt: string;
  sources: { label: string; href: string }[];
  verify?: string;
}
const { metric, title, claim, dek, dateIso, dateFmt, sources, verify } = Astro.props;
---
<article class="mx-auto max-w-2xl">
  <header>
    <p class="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">{metric}</p>
    <h1 class="mt-3 font-display text-3xl leading-tight text-text sm:text-4xl">{title}</h1>
    <p class="mt-4 text-lg leading-relaxed text-text-muted">{claim}</p>
    <p class="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-text-dim">
      <time datetime={dateIso}>{dateFmt}</time>
    </p>
  </header>

  <div class="story-prose mt-10">
    <slot />
  </div>

  {sources.length > 0 && (
    <section class="mt-12 rounded-2xl border border-border bg-surface-raised/60 p-6">
      <p class="font-mono text-[11px] uppercase tracking-[0.18em] text-text-dim">The receipt</p>
      <ul class="mt-3 grid gap-2">
        {sources.map((s) => (
          <li>
            <a href={s.href} class="text-primary underline underline-offset-2 hover:text-primary/80">{s.label} &rarr;</a>
          </li>
        ))}
      </ul>
    </section>
  )}

  {verify && (
    <section class="mt-6 rounded-2xl border border-border bg-surface/60 p-6">
      <p class="font-mono text-[11px] uppercase tracking-[0.18em] text-text-dim">Rerun it</p>
      <p class="mt-3 text-base leading-relaxed text-text">{verify}</p>
    </section>
  )}
</article>
```

- [ ] **Step 2: Create the permalink route**

Create `src/pages/receipts/[slug]/index.astro` (mirrors `letter/[slug]/index.astro`):

```astro
---
// /receipts/<slug>/ — the permalink for one receipt (individually crawlable +
// OG-shareable). Carries the canonical BlogPosting; the /receipts/ index hub
// points here. A11.
import { getCollection, render, type CollectionEntry } from 'astro:content';
import Layout from '../../../layouts/Layout.astro';
import Nav from '../../../components/Nav.astro';
import Footer from '../../../components/Footer.astro';
import ReceiptArticle from '../../../components/receipts/ReceiptArticle.astro';
import OfferSlot from '../../../components/ui/OfferSlot.astro';
import { ogPath, receiptOgSlug } from '../../../data/og';
import { SITE, PERSON, PUBLISHER } from '../../../data/seo';

export async function getStaticPaths() {
  const receipts = await getCollection('receipts');
  return receipts.map((receipt) => ({ params: { slug: receipt.id }, props: { receipt } }));
}

const { receipt } = Astro.props as { receipt: CollectionEntry<'receipts'> };
const { Content } = await render(receipt);
const { title, metric, claim, dek, date, source, verify } = receipt.data;

const dfmt = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d);
const dateIso = date.toISOString().slice(0, 10);
const canonical = new URL(Astro.url.pathname, Astro.site).href;
const ogImageUrl = new URL(ogPath(receiptOgSlug(receipt.id)), Astro.site).href;

const blogPostingSchema = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: title,
  description: dek,
  image: ogImageUrl,
  datePublished: dateIso,
  dateModified: dateIso,
  author: { ...PERSON, url: `${SITE.url}/about/` },
  publisher: PUBLISHER,
  mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
  url: canonical,
  inLanguage: 'en',
  articleSection: 'Receipts',
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
    { '@type': 'ListItem', position: 2, name: 'Receipts', item: `${SITE.url}/receipts/` },
    { '@type': 'ListItem', position: 3, name: title, item: canonical },
  ],
};
---
<Layout
  title={`${title} · Receipts · Orionfold`}
  description={dek}
  ogImage={ogPath(receiptOgSlug(receipt.id))}
  ogImageAlt={`${title} · a receipt you can rerun, from Orionfold`}
  ogType="article"
  article={{ datePublished: dateIso, dateModified: dateIso, author: 'Manav Sehgal', section: 'Receipts' }}
  jsonLd={[blogPostingSchema, breadcrumbSchema]}
>
  <Nav />
  <main class="px-6 pt-36 pb-24 sm:pt-40">
    <div class="mx-auto max-w-2xl">
      <a href="/receipts/" class="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.15em] text-text-muted transition-colors hover:text-primary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        All receipts
      </a>
    </div>
    <div class="mt-8">
      <ReceiptArticle
        metric={metric}
        title={title}
        claim={claim}
        dek={dek}
        dateIso={dateIso}
        dateFmt={dfmt(date)}
        sources={source}
        verify={verify}
      >
        <Content />
      </ReceiptArticle>
    </div>
  </main>

  <OfferSlot
    offer="proof-playbook"
    source="receipt-page"
    label="Want the rest?"
    heading="Get the proof playbook."
    dek="The one-page guide to locking a test, running it on your own desk, and reading the receipts. Plus a note when we publish new proof."
    artifact="One-page PDF + new-proof notes"
    buttonText="Send it"
    class="border-t border-border"
  />
  <Footer />
</Layout>
```

- [ ] **Step 3: Add the OG slug helper (needed by the route import)**

In `src/data/og.ts`, immediately after the `letterOgSlug` definition (line 170), add:

```ts
// OG card slug for a single receipt (A11). Namespaced like story-<id> /
// letter-<id> so a receipt card can't collide with the static '/receipts/'
// index card or any other route. The OG endpoint emits /og/receipt-<id>.jpg.
export const receiptOgSlug = (id: string) => `receipt-${id}`;
```

(The OG endpoint branch that consumes this is wired in Task 4; the helper must exist now because the permalink route imports it. Until Task 4 the `/og/receipt-*.jpg` route does not exist, so the permalink's `og:image` URL 404s in a dev preview — that is expected and resolved in Task 4. The build does not fail on a missing OG route because nothing enumerates it yet.)

- [ ] **Step 4: Verify the permalink builds and renders**

Run: `npm run build 2>&1 | tail -25`
Expected: build is clean; output includes `/receipts/4b-out-trusts-30b/index.html`. Confirm with:

Run: `ls dist/receipts/4b-out-trusts-30b/index.html`
Expected: the file exists.

- [ ] **Step 5: Commit**

```bash
git add src/components/receipts/ReceiptArticle.astro src/pages/receipts/[slug]/index.astro src/data/og.ts
git commit -m "feat(a11): receipt permalink route + article shell + og slug helper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: The `/receipts/` gallery hub

**Files:**
- Create: `src/pages/receipts/index.astro`
- Modify: `src/data/og.ts` (add `OG_PAGES['/receipts/']` static entry)

**Interfaces:**
- Consumes: the `receipts` collection (Task 1), `ReceiptArticle`/`receiptOgSlug` not needed here; the index uses `ogMeta('/receipts/')`.
- Produces: the route `/receipts/` listing every receipt as a card linking to its permalink, with `CollectionPage` + `BreadcrumbList` JSON-LD.

- [ ] **Step 1: Add the static OG entry for the gallery index**

In `src/data/og.ts`, inside the `OG_PAGES` object (after an existing entry, e.g. `/cockpit/`), add:

```ts
  '/receipts/': {
    slug: 'receipts',
    eyebrow: 'Receipts',
    title: 'The proof, one receipt at a time.',
    seed: 'receipts',
    alt: 'Orionfold receipts: frozen tests you can rerun, each with its own page',
  },
```

- [ ] **Step 2: Create the gallery hub page**

Create `src/pages/receipts/index.astro`:

```astro
---
// /receipts/ — the receipts gallery hub. The complete, crawlable set of
// individually-URL'd receipts (A11). /proof/ stays the curated pillar; this is
// the full index one level out, a first-class content type alongside /story/
// and /letter/. Each card links to its own permalink.
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import Nav from '../../components/Nav.astro';
import Footer from '../../components/Footer.astro';
import PageHeader from '../../components/ui/PageHeader.astro';
import OfferSlot from '../../components/ui/OfferSlot.astro';
import { ogMeta } from '../../data/og';
import { SITE } from '../../data/seo';

const receipts = (await getCollection('receipts')).sort(
  (a, b) => b.data.date.getTime() - a.data.date.getTime(),
);
const og = ogMeta('/receipts/');

const collectionSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Receipts',
  description:
    'Every Orionfold receipt on its own page: a frozen test you can rerun, the run, and what we found. The proof, not the pitch.',
  url: `${SITE.url}/receipts/`,
  hasPart: receipts.map((r) => ({
    '@type': 'BlogPosting',
    headline: r.data.title,
    description: r.data.dek,
    datePublished: r.data.date.toISOString().slice(0, 10),
    url: `${SITE.url}/receipts/${r.id}/`,
  })),
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
    { '@type': 'ListItem', position: 2, name: 'Receipts', item: `${SITE.url}/receipts/` },
  ],
};
---
<Layout
  title="Receipts · Orionfold"
  description="Every receipt on its own page: a frozen test you can rerun, the run, and what we found. The proof, not the pitch."
  ogImage={og.image}
  ogImageAlt={og.alt}
  jsonLd={[collectionSchema, breadcrumbSchema]}
>
  <Nav />
  <main>
    <PageHeader
      eyebrow="Receipts"
      title="The proof, one receipt at a time."
      subtitle="Each claim on its own page: the test we locked, the run, and how you rerun it. The wall is at /proof/. These are the receipts behind it, one link each."
    />

    <section class="px-6 py-12">
      <div class="mx-auto max-w-3xl">
        <ul class="grid gap-3" data-animate-stagger>
          {receipts.map((r) => (
            <li data-animate>
              <a href={`/receipts/${r.id}/`} class="of-surface of-pressable group block rounded-2xl p-6">
                <div class="flex items-baseline justify-between gap-3">
                  <span class="font-display text-2xl leading-none text-primary">{r.data.metric}</span>
                  <span class="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-text-dim">{r.data.tags[0] ?? 'Receipt'}</span>
                </div>
                <p class="mt-4 text-base font-medium leading-snug text-text group-hover:text-primary">{r.data.title}</p>
                <p class="mt-2 text-sm leading-relaxed text-text-muted">{r.data.dek}</p>
                <span class="mt-4 inline-block text-sm text-primary transition-colors group-hover:text-primary/80">See the receipt &rarr;</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>

    <OfferSlot
      offer="proof-playbook"
      source="receipts-index"
      label="Not ready to buy?"
      heading="Get the proof playbook."
      dek="The one-page guide to locking a test, running it on your own desk, and reading the receipts. Plus a note when we publish new proof."
      artifact="One-page PDF + new-proof notes"
      buttonText="Send it"
      class="border-t border-border"
    />
  </main>
  <Footer />
</Layout>
```

- [ ] **Step 3: Verify the hub builds**

Run: `npm run build 2>&1 | tail -25 && ls dist/receipts/index.html`
Expected: clean build; `dist/receipts/index.html` exists.

- [ ] **Step 4: Commit**

```bash
git add src/pages/receipts/index.astro src/data/og.ts
git commit -m "feat(a11): /receipts/ gallery hub + static OG entry

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Per-receipt OG cards

**Files:**
- Modify: `src/pages/og/[slug].jpg.ts` (add a `fromReceipts` branch + import + a hero-background helper)

**Interfaces:**
- Consumes: `receiptOgSlug` (Task 2), the `receipts` collection (Task 1).
- Produces: a `/og/receipt-<id>.jpg` route per receipt; resolves the permalink's and hub's `og:image`.

- [ ] **Step 1: Import `receiptOgSlug` and add the hero helper**

In `src/pages/og/[slug].jpg.ts`, change the import on line 11 from:

```ts
import { OG_PAGES, storyOgSlug, productOgSlug, letterOgSlug } from '../../data/og';
```

to:

```ts
import { OG_PAGES, storyOgSlug, productOgSlug, letterOgSlug, receiptOgSlug } from '../../data/og';
```

Then, right after the `letterHeroBackground` helper definition (the function that checks `src/assets/letters/<id>/hero.<ext>`), add the receipt equivalent:

```ts
// Same convention for receipts: src/assets/receipts/<id>/hero.<ext>.
function receiptHeroBackground(id: string): string | undefined {
  for (const ext of ['png', 'jpg', 'jpeg']) {
    const p = path.join(process.cwd(), 'src/assets/receipts', id, `hero.${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}
```

- [ ] **Step 2: Add the `fromReceipts` branch**

In `getStaticPaths`, immediately after the `fromLetters` block (ends ~line 91) and before the `fromProducts` block, add:

```ts
  // Receipts (A11): one card per receipt, mirroring the letter cards. Background
  // is the receipt's curated hero when present (src/assets/receipts/<id>/hero.*),
  // otherwise the seeded constellation.
  const receiptEntries = await getCollection('receipts');
  const fromReceipts = receiptEntries.map((r: CollectionEntry<'receipts'>) => ({
    params: { slug: receiptOgSlug(r.id) },
    props: {
      title: r.data.title,
      eyebrow: 'Receipt',
      seed: r.id,
      meta: fmtDate(r.data.date),
      backgroundPath: receiptHeroBackground(r.id),
    } satisfies CardOptions,
  }));
```

- [ ] **Step 3: Include the branch in the returned paths**

Change the final return (line 125) from:

```ts
  return [...fromPages, ...fromPosts, ...fromLetters, ...fromProducts];
```

to:

```ts
  return [...fromPages, ...fromPosts, ...fromLetters, ...fromProducts, ...fromReceipts];
```

- [ ] **Step 4: Verify OG cards build**

Run: `npm run build 2>&1 | tail -25 && ls dist/og/receipt-4b-out-trusts-30b.jpg dist/og/receipts.jpg`
Expected: clean build; both files exist (per-receipt card + the static `/receipts/` index card from Task 3's `OG_PAGES` entry).

- [ ] **Step 5: Commit**

```bash
git add "src/pages/og/[slug].jpg.ts"
git commit -m "feat(a11): per-receipt OG cards

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Sitemap priority branch for `/receipts/`

**Files:**
- Modify: `astro.config.mjs` (add a branch in `serialize()` after the `/proof/` branch ~line 157–159)

**Interfaces:**
- Consumes: nothing new.
- Produces: `/receipts/` at `priority 0.8 / weekly` and `/receipts/<slug>/` at `priority 0.7 / weekly` in the sitemap.

- [ ] **Step 1: Add the receipts branch**

In `astro.config.mjs`, inside `serialize(item)`, immediately after the existing `/proof/` branch:

```js
        if (url === 'https://orionfold.com/proof/') {
          return { ...item, changefreq: 'weekly', priority: 0.9, lastmod };
        }
```

add:

```js
        // Receipts (A11): the gallery hub sits just under /proof/; each receipt
        // permalink is fresh, indexable evidence in its own right.
        if (url === 'https://orionfold.com/receipts/') {
          return { ...item, changefreq: 'weekly', priority: 0.8, lastmod };
        }
        if (url.startsWith('https://orionfold.com/receipts/')) {
          return { ...item, changefreq: 'weekly', priority: 0.7, lastmod };
        }
```

- [ ] **Step 2: Verify the sitemap entries**

Run: `npm run build >/dev/null 2>&1 && grep -A2 '/receipts/' dist/sitemap-0.xml | head -30`
Expected: the `/receipts/` hub appears with `<priority>0.8</priority>` and each `/receipts/<slug>/` with `<priority>0.7</priority>`.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "feat(a11): sitemap priority for /receipts/ hub + permalinks

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Deep-link wiring — `proof.ts` `receipt?` field + `receiptHref` helper

**Files:**
- Modify: `src/data/proof.ts` (add `receipt?` to `MatrixCell`, `Receipt`, `Myth`; add `receiptHref` helper; set the slug on the entities backed by Task 1's receipt)

**Interfaces:**
- Produces: `receiptHref(slug?: string): string | undefined` returning `/receipts/<slug>/` when `slug` is set, else `undefined`. `MatrixCell`, `Receipt`, `Myth` each gain an optional `receipt?: string` (a receipt collection id).

- [ ] **Step 1: Extend the interfaces**

In `src/data/proof.ts`, add `receipt?` to the three interfaces.

`MatrixCell` (currently lines 23–27):

```ts
export interface MatrixCell {
  mark: Mark;
  /** A star cell links to the public page that carries its frozen test. */
  href?: string;
  /** A11: when set, the cell deep-links to /receipts/<receipt>/ instead of href. */
  receipt?: string;
}
```

`Receipt` (currently lines 125–130):

```ts
export interface Receipt {
  metric: string;
  label: string;
  body: string;
  href: string;
  /** A11: when set, the headline card deep-links to /receipts/<receipt>/. */
  receipt?: string;
}
```

`Myth` (currently lines 165–168):

```ts
export interface Myth {
  claim: string;
  bust: string;
  /** A11: when set, the myth can link out to /receipts/<receipt>/ for the proof. */
  receipt?: string;
}
```

- [ ] **Step 2: Add the `receiptHref` helper**

In `src/data/proof.ts`, right after the `isProvenProduct` function (ends line 55), add:

```ts
// A11: resolve a proof entity's optional receipt slug to its permalink. When a
// receipt page exists for a star cell or headline card, the link points at the
// specific receipt; otherwise the caller falls back to the entity's own href.
export function receiptHref(slug?: string): string | undefined {
  return slug ? `/receipts/${slug}/` : undefined;
}
```

- [ ] **Step 3: Set the slug on the entities Task 1's receipt backs**

The first authored receipt (`4b-out-trusts-30b`) backs the "4B beats 30B" headline and the Advisor "answers from your own documents" + "refuses cleanly" star cells. Wire those:

In the `receipts` array, the "4B beats 30B" entry (lines 142–147) — add `receipt`:

```ts
  {
    metric: '4B beats 30B',
    label: 'Small out-trusts big',
    body:
      'On a hard locked test, our 4B Advisor scored 18 of 21. A model eight times bigger scored 8 of 21 and made up 3 fake answers. Advisor refused all 9 trick questions and leaked zero secrets.',
    href: '/software/advisor/',
    receipt: '4b-out-trusts-30b',
  },
```

In the `matrix` array, the "Answers from your own documents" row's first cell (the `A` star, line 75) and the "Refuses cleanly, no made-up answers" row's first cell (line 83) — add `receipt` alongside the existing `href`:

```ts
  {
    capability: 'Answers from your own documents',
    cells: [{ mark: 'star', href: A, receipt: '4b-out-trusts-30b' }, { mark: 'none' }, { mark: 'maybe' }, { mark: 'maybe' }, { mark: 'maybe' }, { mark: 'maybe' }],
  },
```

```ts
  {
    capability: 'Refuses cleanly, no made-up answers',
    cells: [{ mark: 'star', href: A, receipt: '4b-out-trusts-30b' }, { mark: 'none' }, { mark: 'maybe' }, { mark: 'maybe' }, { mark: 'maybe' }, { mark: 'maybe' }],
  },
```

- [ ] **Step 4: Verify it type-checks**

Run: `npm run build 2>&1 | tail -15`
Expected: clean build, no type error on `proof.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/data/proof.ts
git commit -m "feat(a11): proof.ts receipt? field + receiptHref helper, wire first receipt

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Consume the deep-links in `CapabilityMatrix` + `/proof/` headline cards

**Files:**
- Modify: `src/components/sections/CapabilityMatrix.astro` (cell link, ~line 75–76)
- Modify: `src/pages/proof.astro` (headline card link, ~line 156)

**Interfaces:**
- Consumes: `receiptHref` (Task 6), the `receipt?` fields (Task 6).
- Produces: matrix star cells and headline cards that link to `/receipts/<slug>/` when a `receipt` is set, else keep their existing `href`.

- [ ] **Step 1: Wire the matrix cell**

In `src/components/sections/CapabilityMatrix.astro`, import `receiptHref` where the component imports from `proof.ts` (the file already imports `cols`, `matrix`, etc. — add `receiptHref` to that import). Then change the cell render (lines 74–80) so the link prefers the receipt:

Find:

```astro
              <td data-base={!cols[i].ours ? 'true' : undefined}>
                {cell.href ? (
                  <a href={cell.href} title={meaning[cell.mark]} class={`mark mark-${cell.mark} inline-block transition-transform hover:scale-125`} aria-label={`${cols[i].label}: ${meaning[cell.mark]}`}>{glyph[cell.mark]}</a>
```

Replace with:

```astro
              <td data-base={!cols[i].ours ? 'true' : undefined}>
                {(receiptHref(cell.receipt) ?? cell.href) ? (
                  <a href={receiptHref(cell.receipt) ?? cell.href} title={meaning[cell.mark]} class={`mark mark-${cell.mark} inline-block transition-transform hover:scale-125`} aria-label={`${cols[i].label}: ${meaning[cell.mark]}`}>{glyph[cell.mark]}</a>
```

(Confirm the import line near the top of the frontmatter reads e.g. `import { cols, matrix, speedRows, speedCaveat, receiptHref } from '../../data/proof';` — add `receiptHref` if absent.)

- [ ] **Step 2: Wire the headline card**

In `src/pages/proof.astro`, change the import on line 16 from:

```ts
import { receipts, myths } from '../data/proof';
```

to:

```ts
import { receipts, myths, receiptHref } from '../data/proof';
```

Then change the headline card anchor (line 156) from:

```astro
            <a href={r.href} data-animate class="of-surface of-pressable group flex flex-col rounded-2xl p-6">
```

to:

```astro
            <a href={receiptHref(r.receipt) ?? r.href} data-animate class="of-surface of-pressable group flex flex-col rounded-2xl p-6">
```

- [ ] **Step 3: Verify the links resolve**

Run: `npm run build >/dev/null 2>&1 && grep -o 'href="/receipts/4b-out-trusts-30b/"' dist/proof/index.html | head`
Expected: at least one match (the "4B beats 30B" headline card now points at the receipt). The two wired star cells also point there.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/CapabilityMatrix.astro src/pages/proof.astro
git commit -m "feat(a11): /proof/ star cells + headline cards deep-link to receipts

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Optional `receipt` prop on the A4/A10 bands

**Files:**
- Modify: `src/components/product/ProofCta.astro` (A4 band)
- Modify: `src/components/ui/ProofBand.astro` (A10 band)

**Interfaces:**
- Consumes: `receiptHref` (Task 6).
- Produces: both bands accept an optional `receipt?: string` prop; when set, the band's CTA links to `/receipts/<slug>/` instead of `/proof/`. Default behavior (no prop) is unchanged.

- [ ] **Step 1: Inspect both bands' current CTA target**

Run: `grep -n "href=\"/proof/\"\|/proof/\|interface Props\|Astro.props" src/components/product/ProofCta.astro src/components/ui/ProofBand.astro`
Expected: each file has a CTA anchor pointing at `/proof/` and a `Props` interface (or inline destructure). Note the exact anchor line in each.

- [ ] **Step 2: Add the prop to `ProofCta.astro`**

In `src/components/product/ProofCta.astro`, add `receipt?: string` to the `Props` interface and destructure it. Add this near the other frontmatter consts (importing the helper):

```ts
import { receiptHref } from '../../data/proof';
```

and after destructuring props:

```ts
const proofTarget = receiptHref(receipt) ?? '/proof/';
```

Then change the CTA anchor's `href="/proof/"` to `href={proofTarget}`. (The A4/A10 bands link to `/proof/` top with no anchor suffix — Step 1's grep confirms the exact current value; if it differs, point it at `proofTarget` the same way.)

- [ ] **Step 3: Add the prop to `ProofBand.astro`**

Repeat Step 2 for `src/components/ui/ProofBand.astro`: import `receiptHref` (adjust the relative path — from `src/components/ui/` it is `'../../data/proof'`), add `receipt?: string` to props, compute `const proofTarget = receiptHref(receipt) ?? '/proof/';`, and point the CTA anchor at `{proofTarget}`.

- [ ] **Step 4: Verify nothing regressed (no prop = `/proof/`)**

Run: `npm run build >/dev/null 2>&1 && grep -rl 'href="/proof/"' dist/software dist/models dist/story 2>/dev/null | head`
Expected: pages rendering the bands WITHOUT a `receipt` prop still emit `href="/proof/"` — the fallback works. (No caller passes `receipt` yet; wiring a specific product to its receipt is a deliberate later content step, out of this task's scope per the spec — exposing the capability is the deliverable.)

- [ ] **Step 5: Commit**

```bash
git add src/components/product/ProofCta.astro src/components/ui/ProofBand.astro
git commit -m "feat(a11): A4/A10 bands accept optional receipt deep-link prop

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Author the remaining receipts (3 headlines + the distinct star tests)

**Files:**
- Create: `src/content/receipts/overnight-lab-2-cents.md`
- Create: `src/content/receipts/76-percent-faster-same-chip.md`
- Create: `src/content/receipts/one-dollar-guards-1679.md`
- Create: `src/content/receipts/answers-with-exact-citations.md` (Advisor + Patent — shared)
- Create: `src/content/receipts/checks-its-own-memory.md` (Advisor)
- Create: `src/content/receipts/step-by-step-reasoning.md` (Kepler + Patent — shared)
- Create: `src/content/receipts/one-checkable-number.md` (Kepler)
- Modify: `src/data/proof.ts` (set `receipt` on the remaining headline cards + the matching star cells)

**Interfaces:**
- Consumes: the collection schema (Task 1) + `receiptHref` wiring (Tasks 6–7) — every new slug auto-gets a permalink, OG card, sitemap entry, and deep-link the moment its file lands and its `proof.ts` entity sets the slug.

- [ ] **Step 1: Author the three remaining headline receipts**

Create each file using the same frontmatter shape as Task 1. Pull body content + `source` from the existing `receipts[]` and `myths[]` in `proof.ts` (do not invent numbers). Frontmatter slugs/metrics/claims:

`overnight-lab-2-cents.md` — metric `2 cents`, claim from the "An overnight lab" receipt (50 experiments, 73 minutes, ~2 cents), `source` → `/dgx-spark/`, `relatedTo: ["headline:2-cents"]`, tags `["Cost"]`.

`76-percent-faster-same-chip.md` — metric `76% faster`, claim from the "Same model, same chip" receipt (38.8 wps up from 22.1, 4-bit mode), `source` → `/dgx-spark/`, `relatedTo: ["headline:76-faster"]`, tags `["Speed"]`.

`one-dollar-guards-1679.md` — metric `$1 guards $1,679`, claim from the "A cheap wind tunnel" receipt, `source` → `/dgx-spark/`, `relatedTo: ["headline:1-guards-1679"]`, tags `["Cost"]`.

Each body follows the Task 1 structure: "## The test we locked" / "## What happened" / "## The honest part" / "## Rerun it". Keep grade 3–5, no em-dashes, caveats in. `verify` = a one-line rerun recipe specific to that claim.

- [ ] **Step 2: Author the four distinct star-test receipts**

Create the four star-cell receipts. These describe the frozen capability test behind each `★`, sourced from the model pages already linked in the matrix (`/software/advisor/`, `/models/kepler/`, `/models/patent-strategist/`):

`answers-with-exact-citations.md` — backs Advisor + Patent "Gives exact source citations" cells. `source` → both `/software/advisor/` and `/models/patent-strategist/`. `relatedTo: ["matrix:gives-exact-source-citations:advisor", "matrix:gives-exact-source-citations:patent"]`. tags `["Trust"]`.

`checks-its-own-memory.md` — backs Advisor "Checks its own memory quality". `source` → `/software/advisor/`. `relatedTo: ["matrix:checks-its-own-memory-quality:advisor"]`. tags `["Trust"]`.

`step-by-step-reasoning.md` — backs Kepler + Patent "Shows step-by-step reasoning". `source` → `/models/kepler/` + `/models/patent-strategist/`. `relatedTo: ["matrix:shows-step-by-step-reasoning:kepler", "matrix:shows-step-by-step-reasoning:patent"]`. tags `["Reasoning"]`.

`one-checkable-number.md` — backs Kepler "Returns one checkable number". `source` → `/models/kepler/`. `relatedTo: ["matrix:returns-one-checkable-number:kepler"]`. tags `["Reasoning"]`.

Use only capability descriptions consistent with the matrix; do not invent benchmark figures beyond what the model pages state. Where a precise number is not on hand, describe the test qualitatively and point `source` at the model page (receipt-honesty: never fabricate).

- [ ] **Step 3: Wire the remaining `proof.ts` deep-links**

In `src/data/proof.ts`:
- Headlines: add `receipt: 'overnight-lab-2-cents'` to the "2 cents" entry, `receipt: '76-percent-faster-same-chip'` to "76% faster", `receipt: 'one-dollar-guards-1679'` to "$1 guards $1,679".
- Star cells (add `receipt` next to the existing `href`):
  - "Gives exact source citations" row: Advisor cell (`href: A`) → `receipt: 'answers-with-exact-citations'`; Patent cell (`href: P`) → `receipt: 'answers-with-exact-citations'`.
  - "Checks its own memory quality" row: Advisor cell (`href: A`) → `receipt: 'checks-its-own-memory'`.
  - "Shows step-by-step reasoning" row: Kepler cell (`href: K`) → `receipt: 'step-by-step-reasoning'`; Patent cell (`href: P`) → `receipt: 'step-by-step-reasoning'`.
  - "Returns one checkable number" row: Kepler cell (`href: K`) → `receipt: 'one-checkable-number'`.

- [ ] **Step 4: Verify all receipts build with permalinks, OG, sitemap, and deep-links**

Run:
```bash
npm run build >/dev/null 2>&1 && \
ls dist/receipts/*/index.html && \
ls dist/og/receipt-*.jpg && \
grep -c '<loc>https://orionfold.com/receipts/' dist/sitemap-0.xml && \
grep -o 'href="/receipts/[a-z0-9-]*/"' dist/proof/index.html | sort -u
```
Expected: ~8 permalink `index.html` files; ~8 `receipt-*.jpg` OG cards; sitemap `<loc>` count ≈ 9 (hub + 8 permalinks); the `/proof/` page emits deep-links to multiple distinct receipt slugs.

- [ ] **Step 5: Commit**

```bash
git add src/content/receipts/ src/data/proof.ts
git commit -m "feat(a11): author remaining receipts + wire all proof.ts deep-links

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Final verification + relay handback draft

**Files:**
- Modify (on disk only, NOT committed): `strategy/orionfold-website/_RELAY.md`

- [ ] **Step 1: Full build + page-count sanity**

Run: `npm run build 2>&1 | tail -5`
Expected: clean build, exit 0. Note the page count (should rise by ~20 routes vs the prior 68pp baseline — index + ~8 permalinks + ~9 OG cards). The gate is "clean build", not a specific number.

- [ ] **Step 2: JSON-LD parse check**

Run:
```bash
node -e "const fs=require('fs');for(const f of ['dist/receipts/index.html','dist/receipts/4b-out-trusts-30b/index.html']){const h=fs.readFileSync(f,'utf8');for(const m of h.matchAll(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/g)){JSON.parse(m[1]);}console.log('OK',f);}"
```
Expected: `OK dist/receipts/index.html` and `OK dist/receipts/4b-out-trusts-30b/index.html` (every JSON-LD block parses).

- [ ] **Step 3: In-browser visual check, both themes**

Start the dev server if not running (`npm run dev`, log to `/tmp/astro-dev-4321.log`). Using the Chrome MCP browser (sandbox curl cannot reach localhost):
- Load `http://localhost:4321/receipts/` — gallery renders all cards, dark theme; toggle to light, re-check contrast on metric/title/dek and the OfferSlot button.
- Load `http://localhost:4321/receipts/4b-out-trusts-30b/` — masthead, body prose, "The receipt" source list, "Rerun it" block, OfferSlot all render; back-link works; both themes.
- Load `http://localhost:4321/proof/` — confirm the "4B beats 30B" headline card and the wired star cells now navigate to `/receipts/...`; the page visual is otherwise unchanged.
- Check the browser console on each page: no errors.

- [ ] **Step 4: Confirm no regression on the bands**

Load a software detail page (e.g. `http://localhost:4321/software/arena/`) and a non-Proof story permalink. Confirm the A4 ProofCta band and A10 ProofBand still render and their CTA still points at `/proof/` (no `receipt` prop wired yet). No console errors.

- [ ] **Step 5: Draft the relay handback (disk only)**

Append a `Website→Mac [acted]` entry to `strategy/orionfold-website/_RELAY.md` summarizing A11 done: flat `/receipts/` hub + permalinks live in source, proof.ts cells/headlines deep-link to specific receipts, A4/A10 bands gained the optional `receipt` prop, ~8 receipts authored. Note it is build-clean + browser-verified, push operator-gated. **Do NOT commit or push the strategy repo** (Flows owns its git — [[never-push-strategy-repo]]).

- [ ] **Step 6: Report completion**

Summarize to the operator: A11 shipped in source (build-clean, both themes verified), list the new routes, note push is operator-gated, and that wiring specific product bands to specific receipts is an available follow-up (the capability exists; no caller passes `receipt` yet). Update HANDOFF.md's A11 line from open to done with the commit range when the operator pushes.

---

## Notes for the implementer

- **Slug = filename stem.** A receipt's URL, OG slug, and `proof.ts` `receipt:` value are all the markdown filename without `.md`. Keep them identical.
- **Honest content rule is load-bearing.** Every number must trace to `proof.ts` or a model/field-note page already on the site. If you cannot source a number, describe the test qualitatively and link the page — never fabricate (receipt-honesty).
- **Fallback is the safety net.** `receiptHref(undefined)` returns `undefined`, so any cell/card/band without a wired receipt keeps its exact prior behavior. This is why Tasks 6–8 cannot break existing links.
- **localhost is browser-only.** The sandbox cannot curl `localhost:4321` (returns 000) — verify via the Chrome MCP browser, and verify built artifacts via `dist/` greps.
