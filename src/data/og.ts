// OG image route map (I-series). The single source of truth for per-page social
// cards: the build endpoint (src/pages/og/[slug].png.ts) reads this to know what
// to render, and the page templates read it to point their `ogImage` at the
// matching file. Keeping both sides on one map means the /og/<slug>.png
// convention can't drift. Story posts are NOT listed here — they come from the
// `story` content collection and use storyOgSlug(). See
// specs/2026-05-25-og-and-featured-image-pipeline.md.

export interface OgPage {
  /** Output file is /og/<slug>.png */
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
}

export const OG_PAGES: Record<string, OgPage> = {
  '/': {
    slug: 'home',
    eyebrow: 'Orionfold',
    title: 'Grow 10x with AI, on your own computer',
    seed: 'home',
    alt: 'Orionfold: open AI software, models, and playbooks to grow 10x on your own computer',
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
  '/books/': {
    slug: 'books',
    eyebrow: 'Books',
    title: "Read how it's built",
    seed: 'books',
    alt: 'Orionfold books: read how an AI-native business is built',
  },
  '/story/': {
    slug: 'story',
    eyebrow: 'Story',
    title: 'From the build log',
    seed: 'story',
    alt: 'Orionfold story: building in public',
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

export const ogPath = (slug: string) => `/og/${slug}.png`;
export const storyOgSlug = (id: string) => `story-${id}`;

/** Image path + alt for a static route, used by page templates. */
export function ogMeta(route: string): { image: string; alt: string } {
  const p = OG_PAGES[route];
  return { image: ogPath(p.slug), alt: p.alt };
}
