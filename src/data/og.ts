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
    title: 'Get an AI team without hiring one',
    seed: 'home',
    alt: 'Orionfold: private agents, domain models, benchmarks, and playbooks for small teams',
  },
  '/advisor/': {
    slug: 'advisor',
    eyebrow: 'Advisor',
    title: 'Ask Orionfold privately',
    seed: 'advisor',
    alt: 'Orionfold Advisor: a governed local AI advisor over the Orionfold corpus',
    background: 'src/assets/projects/advisor-poster.png',
  },
  '/become-ai-native-business/': {
    slug: 'become-ai-native-business',
    eyebrow: 'Free book',
    title: 'Become an AI-native business',
    seed: 'ai-native-business',
    alt: 'Get the AI Native Business book free, in PDF and EPUB, from Orionfold',
    background: 'src/assets/book/ai-native-business-book.jpg',
  },
  '/workflows/': {
    slug: 'workflows',
    eyebrow: 'Workflows',
    title: 'Private Agent Starter Kits',
    seed: 'workflows',
    alt: 'Orionfold Workflows: private agent starter kits with evals, approvals, and audit trails',
  },
  '/experts/': {
    slug: 'experts',
    eyebrow: 'Experts',
    title: 'Offline models with benchmarks and playbooks',
    seed: 'domain-packs',
    alt: 'Orionfold Domain Experts: offline models, benchmarks, local run paths, and playbooks',
  },
  '/cockpit/': {
    slug: 'cockpit',
    eyebrow: 'Cockpit',
    title: 'The cockpit for private AI work',
    seed: 'workbench',
    alt: 'Orionfold Cockpit: Arena, Cortex, fieldkit, and tools for local AI work',
  },
  '/receipts/': {
    slug: 'receipts',
    eyebrow: 'Receipts',
    title: 'The proof, one receipt at a time.',
    seed: 'receipts',
    alt: 'Orionfold receipts: frozen tests you can rerun, each with its own page',
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
  '/adoption/': {
    slug: 'adoption',
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
  '/letter/': {
    slug: 'letter',
    eyebrow: 'A letter from the founder',
    title: 'One person. One desk. One box.',
    seed: 'letter',
    alt: 'A letter from the founder of Orionfold: one person, one desk, one box, a whole AI lab',
  },
  '/proof/': {
    slug: 'proof',
    eyebrow: 'Receipts',
    title: 'The proof, not the pitch',
    seed: 'proof',
    alt: 'Orionfold receipts: frozen tests you can rerun, a small model that out-trusts a big one',
    // The Orionfold Proof poster (art-deco receipt rising from a MacBook into the
    // Orion stars) full-bleed as the social card, same pattern as advisor/dgx-spark.
    background: 'src/assets/proof/orionfold-proof-poster.jpeg',
  },
  '/relay/': {
    slug: 'relay',
    eyebrow: 'Orionfold Relay · Own it',
    title: 'Run AI client work, see what each client costs',
    seed: 'relay',
    alt: 'Orionfold Relay: the free, open engine for AI agents and workflows, with premium packs you own',
    background: 'src/assets/projects/orionfold-relay-poster.jpeg',
  },
  '/arena/': {
    slug: 'arena',
    eyebrow: 'Eval cockpit',
    title: 'See which AI wins, on your own desk',
    seed: 'arena',
    alt: 'Orionfold Arena: the eval cockpit that runs, compares, scores, and trains local AI models on one DGX Spark',
    // The Arena poster full-bleed as the social card, same pattern as proof.
    background: 'src/assets/projects/arena-poster.png',
  },
  '/promise/': {
    slug: 'promise',
    eyebrow: 'Our promise',
    title: 'What you pay for, and what you never lose',
    seed: 'promise',
    alt: 'The Orionfold promise: every capability ships free, paid packs sell maintained content, and nothing that shipped free ever regresses to paid',
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
// OG card slug for a single founder-letter edition. Namespaced like story-<id>
// so a per-edition card can't collide with the static `/letter/` index card
// (slug 'letter') or any other route. The OG endpoint emits /og/letter-<id>.jpg.
export const letterOgSlug = (id: string) => `letter-${id}`;

// OG card slug for a single receipt (A11). Namespaced like story-<id> /
// letter-<id> so a receipt card can't collide with the static '/receipts/'
// index card or any other route. The OG endpoint emits /og/receipt-<id>.jpg.
export const receiptOgSlug = (id: string) => `receipt-${id}`;

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
