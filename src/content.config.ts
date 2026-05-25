import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Story — a small building-in-public blog (spec §6). The only content
// collection on the site; everything else reads typed src/data/*.ts. Posts are
// plain .md under src/content/story/ (no MDX, spec §3); the glob loader maps
// each filename to its URL slug, so why-we-folded-orionfold.md → /story/why-we-
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

export const collections = { story };
