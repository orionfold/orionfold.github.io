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

export const collections = { story, productDetail, letters };
