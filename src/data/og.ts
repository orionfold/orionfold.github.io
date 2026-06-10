// OG image route map (I-series). The single source of truth for per-page social
// cards: the build endpoint (src/pages/og/[slug].png.ts) reads this to know what
// to render, and the page templates read it to point their `ogImage` at the
// matching file. Keeping both sides on one map means the /og/<slug>.png
// convention can't drift. Story posts are NOT listed here — they come from the
// `story` content collection and use storyOgSlug(). See
// specs/2026-05-25-og-and-featured-image-pipeline.md.

export interface OgPage {
  /** Output file is /og/<slug>.jpg */
  slug: string;
  /** Small uppercase label at the top of the card. */
  eyebrow: string;
  /** Headline (real Geist text, wraps automatically). */
  title: string;
  /** Constellation seed; use the route's own key so each page draws a distinct sky. */
  seed: string;
  /** og:image:alt — grade 3-5, no em-dashes (website-copy-style). */
  alt: string;
  /** Optional bottom-right caption. */
  meta?: string;
  /** Optional repo-relative product screenshot, framed on the right (offering cards). */
  screenshot?: string;
  /** Optional repo-relative curated hero art, used FULL-BLEED as the card background
   *  instead of the brand banner (a landing page with its own featured image, e.g.
   *  /dgx-spark/). Title legibility comes from the card's text glow. PNG/JPG only. */
  background?: string;
}

export const OG_PAGES: Record<string, OgPage> = {
  '/': {
    slug: 'home',
    eyebrow: 'Orionfold',
    title: 'Private AI capability for small teams',
    seed: 'home',
    alt: 'Orionfold: private agents, domain models, benchmarks, and playbooks for small teams',
  },
  '/advisor/': {
    slug: 'advisor',
    eyebrow: 'Advisor',
    title: 'Ask Orionfold privately',
    seed: 'advisor',
    alt: 'Orionfold Advisor: a private expert interface over the Orionfold corpus',
  },
  '/workflows/': {
    slug: 'workflows',
    eyebrow: 'Workflows',
    title: 'Private Agent Starter Kits',
    seed: 'workflows',
    alt: 'Orionfold Workflows: private agent starter kits with evals, approvals, and audit trails',
  },
  '/domain-packs/': {
    slug: 'domain-packs',
    eyebrow: 'Experts',
    title: 'Offline models with benchmarks and playbooks',
    seed: 'domain-packs',
    alt: 'Orionfold Domain Experts: offline models, benchmarks, local run paths, and playbooks',
  },
  '/workbench/': {
    slug: 'workbench',
    eyebrow: 'Cockpit',
    title: 'The cockpit for private AI work',
    seed: 'workbench',
    alt: 'Orionfold Cockpit: Arena, Cortex, fieldkit, and tools for local AI work',
  },
  '/learn/': {
    slug: 'learn',
    eyebrow: 'Learn',
    title: 'The playbooks behind the stack',
    seed: 'learn',
    alt: 'Orionfold Learn: books, field notes, DGX Spark research, and build stories',
  },
  '/software/': {
    slug: 'software',
    eyebrow: 'Software',
    title: 'Open software you control',
    seed: 'software',
    alt: 'Orionfold software: open AI apps you run on your own computer',
    screenshot: 'src/assets/platform/ai-native-platform.png',
  },
  '/models/': {
    slug: 'models',
    eyebrow: 'Models',
    title: 'AI tuned for your field',
    seed: 'models',
    alt: 'Orionfold models: open-weight AI tuned for your field',
  },
  '/roadmap/': {
    slug: 'roadmap',
    eyebrow: 'Adoption',
    title: 'What we build, ship, and plan next',
    seed: 'roadmap',
    alt: 'Orionfold adoption map: every offering by status, with ways to sponsor the work',
  },
  '/sponsor/': {
    slug: 'sponsor',
    eyebrow: 'Sponsor',
    title: 'Back the work, move it up the list',
    seed: 'sponsor',
    alt: 'Sponsor Orionfold: monthly tiers that prioritize your feature and support requests',
  },
  '/books/': {
    slug: 'books',
    eyebrow: 'Books',
    title: "Read how it's built",
    seed: 'books',
    alt: 'Orionfold books: read how an AI-native business is built',
  },
  '/dgx-spark/': {
    slug: 'dgx-spark',
    eyebrow: 'NVIDIA DGX Spark',
    title: 'AI research, run on one desk',
    seed: 'dgx-spark',
    alt: 'Orionfold on NVIDIA DGX Spark: the book, models, and tools proven on one small AI desktop',
    background: 'src/assets/dgx-spark/hero.jpg',
  },
  '/story/': {
    slug: 'story',
    eyebrow: 'Story',
    title: 'From the build log',
    seed: 'story',
    alt: 'Orionfold story: building in public',
  },
  '/about/': {
    slug: 'about',
    eyebrow: 'About',
    title: 'The builder behind Orionfold',
    seed: 'about',
    alt: 'About Manav Sehgal, the builder behind Orionfold',
  },
  '/terms/': {
    slug: 'terms',
    eyebrow: 'Legal',
    title: 'Terms of Use',
    seed: 'terms',
    alt: 'Orionfold Terms of Use',
  },
  '/privacy/': {
    slug: 'privacy',
    eyebrow: 'Legal',
    title: 'Privacy Policy',
    seed: 'privacy',
    alt: 'Orionfold Privacy Policy',
  },
};

export const ogPath = (slug: string) => `/og/${slug}.jpg`;
export const storyOgSlug = (id: string) => `story-${id}`;

// OG card slug for a product detail page (P8). Namespaced by type so a model
// slug (slugify(title)) can't collide with a software/book slug, and so none of
// these collide with the static-page slugs above or with story-<id>. The detail
// route emits /og/<type>-<slug>.jpg via the same [slug].jpg.ts pipeline.
export const productOgSlug = (type: string, slug: string) => `${type}-${slug}`;

/** Image path + alt for a static route, used by page templates. */
export function ogMeta(route: string): { image: string; alt: string } {
  const p = OG_PAGES[route];
  return { image: ogPath(p.slug), alt: p.alt };
}
