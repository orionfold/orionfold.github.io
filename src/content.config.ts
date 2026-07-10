import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Story — a small building-in-public blog (spec §6). The only content
// collection on the site; everything else reads typed src/data/*.ts. Posts are
// plain .md under src/content/story/ (no MDX, spec §3); the glob loader maps
// each filename to its URL slug, so why-i-folded-orionfold.md → /story/why-i-
// folded-orionfold/. Frontmatter stays minimal: title/date/summary + optional
// tags so the index and the homepage carousel can render and sort by date.
const story = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/story' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      summary: z.string(),
      tags: z.array(z.string()).default([]),
      // Optional seed for the card's constellation cover (V6). Omitted -> the
      // cover seeds off the post slug, so each post still gets a distinct motif.
      accent: z.string().optional(),
      // Optional curated hero image (I-series). Shown atop the post and used as
      // the card cover. By convention the source lives at
      // src/assets/story/<slug>/hero.png so the OG endpoint can find it too
      // (see specs/2026-05-25-og-and-featured-image-pipeline.md).
      hero: image().optional(),
      heroAlt: z.string().optional(),
    }),
});

// Product detail bodies (P-series, spec §5.1). The companion to the typed
// src/data/{software,models,books}.ts SSOT: those stay the source of truth for
// cards/roadmap/commerce; this collection carries the rich detail-page body +
// structured fields, keyed <type>/<slug>. A route emits a detail page only when
// a matching entry exists here (incremental rollout, no empty pages). Mirrors the
// `story` glob-loader idiom. Every field below the join keys is optional, so the
// detail template is adaptive: a section renders only when its data is present.
const productDetail = defineCollection({
  // id includes the type folder (software/ai-native-platform, books/ai-native-
  // platform) so two products of different types can share a slug-named file
  // without one silently overwriting the other. Identity is (type, slug); the
  // default loader keys by bare filename stem, which collides across folders.
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/products',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: ({ image }) =>
    z.object({
      // Join keys (required).
      type: z.enum(['software', 'model', 'book']),
      slug: z.string(), // matches the .ts record: software/book .slug, model = slugify(title)
      valueProp: z.string(), // the hero one-liner (grade 3-5, website-copy-style)

      // Hero override. By convention the hero reuses the listing poster/cover the
      // route resolves from the SSOT; set this only to point at a different image.
      hero: image().optional(),
      heroAlt: z.string().optional(),

      // Metadata strip under the hero (the HuggingFace persistent-sidebar move).
      chips: z.array(z.object({ label: z.string(), value: z.string() })).optional(),

      // Edition split: when true, the page renders the paid Field Edition block
      // side-by-side with the open base product. Positioning is CAPABILITY/VALUE-led
      // (the assembled, proven, kept-proven AI team delivered turnkey), NOT a
      // free-vs-paid sell — the old "Free and open: the machine. Paid: the evidence."
      // framing is retired (operator 2026-06-13, extended to all paid products
      // 2026-06-26). Singleton today (Arena); the copy + price + proof live in
      // FieldEditionBox.astro, this just turns it on so the base product's
      // chips/story stay the page's spine and the paid edition is an additive
      // section, not a gated version.
      fieldEdition: z.boolean().optional(),

      // Copy-paste code tabs (software/models): install + usage.
      install: z.array(z.object({ label: z.string(), lang: z.string(), code: z.string() })).optional(),
      usage: z.array(z.object({ label: z.string(), lang: z.string(), code: z.string() })).optional(),

      // Full spec table (label/value rows).
      specs: z.array(z.object({ label: z.string(), value: z.string() })).optional(),

      // Benchmark table (models — from HF cards / project-stats.json).
      benchmarks: z
        .object({ columns: z.array(z.string()), rows: z.array(z.array(z.string())) })
        .optional(),

      // Book table of contents.
      chapters: z
        .array(
          z.object({
            number: z.union([z.number(), z.string()]).optional(),
            part: z.string().optional(),
            title: z.string(),
            subtitle: z.string().optional(),
            readingTime: z.string().optional(),
          }),
        )
        .optional(),

      // Gallery (repo docs screenshots, reused DGX figures, posters). image() so
      // each gets WebP/AVIF + responsive sizes like the rest of the site.
      // `detail` (optional) turns the item into a large showcase row: the
      // screenshot at its natural aspect with this explainer paragraph beside it
      // (copy sourced from the product's upstream article, site voice). Items
      // without `detail` render in the compact grid, also uncropped.
      gallery: z
        .array(
          z.object({
            src: image(),
            alt: z.string(),
            caption: z.string().optional(),
            detail: z.string().optional(),
          }),
        )
        .optional(),

      // Inward cross-sell (RelatedRail).
      relatedModels: z.array(z.string()).optional(), // model slugs
      relatedReading: z.array(z.object({ title: z.string(), href: z.string() })).optional(),
      relatedBook: z.string().optional(), // book slug

      testimonials: z
        .array(z.object({ quote: z.string(), author: z.string(), role: z.string().optional() }))
        .optional(),

      // Demoted outbound links (rendered after the conversion point, new tab).
      outbound: z
        .array(
          z.object({
            label: z.string(),
            href: z.string(),
            kind: z.enum(['github', 'huggingface', 'docs', 'site']),
          }),
        )
        .optional(),

      // Maintenance contract: maps each detail section to its origin so the
      // product-detail-sync skill (P9, spec §5.6/§5.7) can re-pull + refresh it.
      sources: z
        .array(
          z.object({
            section: z.string(),
            type: z.enum([
              'github-readme',
              'hf-card',
              'book-manifest',
              'docs-screenshots',
              'field-notes',
              'url',
              // A single tracked file pulled from a repo at `owner/repo:path`
              // (e.g. the Arena onboarding asciinema cast). Lets a future
              // product-detail-sync re-pull the exact file it was built from.
              'file',
            ]),
            ref: z.string(),
            lastSynced: z.string(),
          }),
        )
        .optional(),
    }),
});

// Letters — the founder's monthly letter, a dated series (one markdown file per
// edition). A distinct genre from `story` (the build-log): these are timely,
// first-person dispatches that make the standing Orionfold case against a current
// industry topic, with cited sources. The canonical /letter/ route shows the
// newest edition and archives the rest; each edition gets a permalink
// /letter/<slug>/. Mirrors the `story` glob-loader idiom.
const letters = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/letters' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // Human label for the edition, e.g. "June 2026" — shown on the masthead,
      // the homepage band, and the archive list.
      edition: z.string(),
      date: z.coerce.date(),
      // One-line standfirst, used on the homepage band and the archive list.
      dek: z.string(),
      hero: image().optional(),
      heroAlt: z.string().optional(),
    }),
});

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

// Relay docs (Rail B publish, _RELAY #15) — the 9-chapter SMB user guide,
// copied verbatim from the strategy-owned _ASSETS/docs/guides corpus (one-
// direction publish contract: website consumes, never writes back). Each file
// is a green chapter; the filename stem is the URL slug
// (get-started-with-relay.md -> /relay/docs/get-started-with-relay/). Inline
// screenshots use the portable ![alt](relay-shot:<id>) marker, which the global
// rehype bridge (src/lib/relay/rehype-relay-shots.mjs) rewrites into themed
// shots. `order` drives the chapter list + prev/next; the CTA chrome is the
// website's (footer-CTA only, hardcoded per the publish contract — Relay ships
// content only, never CTA HTML). Mirrors the `receipts` glob-loader idiom.
const relayDocs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/relay-docs' }),
  schema: () =>
    z.object({
      title: z.string(),
      // 1-based chapter position; drives the guide list order + prev/next links.
      order: z.number(),
      // One-line dek: the chapter's "what this helps you do" opener. Used as the
      // meta description, the card sub-line, and the OG alt.
      summary: z.string(),
      // Feature coverage carried from the source chapter (operator-facing chips).
      features: z.array(z.string()).default([]),
    }),
});

// Relay memos (Rail B publish, _RELAY #17) — the "Relay Packs" editorial series,
// a long-form building-in-public arc (one pillar + four domain memos) on the pack
// architecture. Copied verbatim from the strategy-owned _ASSETS/memos corpus (same
// one-direction publish contract as relayDocs: website consumes, never writes
// back; fidelity is enforced at the Relay source gate). The filename-folder stem
// is the URL slug (why-relay-packs/article.md -> /relay/memos/why-relay-packs/).
// Each memo body carries exactly one inline <figure class="fn-diagram"><svg>…</svg>
// (token-only, theme-reactive via the global --svg-* set) and pairs with a
// signature.svg hero the route inlines. This mirrors the `relayDocs` shape plus
// the memo-specific fields Relay ships: `series` (groups the 5), `signature` (hero
// SVG ref), `stage`/`status` (editorial lifecycle), `difficulty`, `date`.
// Conversion chrome is the website's (1 mid-essay interstitial + footer CTA, no
// sticky — an editorial read gets the story treatment); Relay ships content only.
const memos = defineCollection({
  // Nested per-slug folders (why-relay-packs/article.md); the folder name is the
  // slug, so key on the folder, not the bare `article` filename (which would
  // collide across all five). Same generateId idiom as productDetail.
  loader: glob({
    pattern: '**/article.md',
    base: './src/content/memos',
    generateId: ({ entry }) => entry.replace(/\/article\.md$/, ''),
  }),
  schema: () =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      // The editorial thread that groups the series on the index.
      series: z.string(),
      // One-line blurb (Relay gate caps at 300): meta description + card/
      // interstitial dek.
      summary: z.string(),
      tags: z.array(z.string()).default([]),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      // Relative ref to the per-memo hero SVG in the same folder (signature.svg).
      // The route reads the file and inlines it so its --svg-* tokens theme-swap.
      signature: z.string().optional(),
      // Editorial lifecycle (Relay-owned): draft -> review -> published. `stage`
      // and `status` are the same lifecycle in the source; both accepted so the
      // verbatim frontmatter validates. `status` is the publish discriminator —
      // gating the surface on status === 'published' is a one-line filter change
      // in the routes when the operator wants that (drafts render today, _RELAY
      // #17, operator decision 2026-07-09).
      stage: z.enum(['draft', 'review', 'published']).optional(),
      status: z.enum(['draft', 'review', 'published']).default('draft'),
    }),
});

// Relay API reference (Rail B publish, _RELAY #23) — the developer API guide,
// authored chapter-by-chapter at the strategy-owned _ASSETS/api/reference corpus
// (same one-direction publish contract as relayDocs/memos: website consumes,
// never writes back; prose-green is enforced at the Relay source gate). #23 is a
// single-chapter pilot: only 01-overview-local-api.md is prose-green and shipped;
// 02-08 stay reserved at source until authored. The filename stem is the URL slug
// (01-overview-local-api.md -> /relay/api/01-overview-local-api/). Inline
// screenshots use the same portable ![alt](relay-shot:<id>) marker the global
// rehype bridge rewrites into themed shots; the chapter body carries NO H1
// (frontmatter `title` is the SSOT, #23 note #2). Frontmatter is Relay's shape
// (id/title/status/stability/families) — display copy (order, meta description)
// is derived in the route from the filename + families, never by editing the
// verbatim chapter. CTA chrome is the website's (footer-CTA only, the edge-to-
// edge RelayCtaBand), same as docs + memos. Mirrors the `relayDocs` glob-loader idiom.
const relayApi = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/relay-api' }),
  schema: () =>
    z.object({
      // Stable chapter id from the source (e.g. "01-overview-local-api"); also
      // the URL slug via the filename stem.
      id: z.string(),
      title: z.string(),
      // Editorial lifecycle carried verbatim from the source frontmatter; the
      // pilot ships as `draft` (publish/go-live is the operator + website call,
      // not the status field — same rule as memos).
      status: z.enum(['draft', 'review', 'published']).default('draft'),
      // Stability contract for the whole endpoint group (platform | app-internal
      // | ...); shown as an operator-facing chip.
      stability: z.string(),
      // The endpoint families this chapter documents (context/workspace/...);
      // rendered as chips and folded into the derived meta description.
      families: z.array(z.string()).default([]),
    }),
});

export const collections = { story, productDetail, letters, receipts, relayDocs, memos, relayApi };
