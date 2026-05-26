// Books showcase data (spec §6). A small typed array feeding /books/ (and
// available to the homepage later). Showcase + link out: each entry sums up the
// work and links to its canonical home on ainative.business — we don't port
// chapters or articles here. Copy reads grade 3–5, no em-dashes, with quick
// inline glosses for jargon (memory `website-copy-style`).
export interface Book {
  slug: string;
  eyebrow: string;
  title: string;
  body: string;
  pills: string[];
  href: string; // canonical home (external)
  ctaText: string;
  cover: {
    title: string;
    subtitle: string;
    tag: string;
  };
}

export const books: Book[] = [
  {
    slug: 'ai-native-business',
    eyebrow: 'The book',
    title: 'AI Native Business',
    body: 'A free book on running a business with AI agents (software helpers that do the work for you). Fourteen short chapters in four parts take you from the first idea to a working system. About a two hour read, open to all.',
    pills: ['14 chapters', '4 parts', '~2h read', 'Free to read'],
    href: 'https://ainative.business/book',
    ctaText: 'Read the book',
    cover: {
      title: 'AI Native Business',
      subtitle: 'Build with AI agents.',
      tag: 'Free · open',
    },
  },
  {
    slug: 'field-notes',
    eyebrow: 'AI Research Field Notes',
    title: 'AI Research on NVIDIA DGX Spark',
    body: 'Real notes from doing AI research on one desktop. The NVIDIA DGX Spark is a small machine with huge power (petascale means it runs about a quadrillion math steps a second), so you can push local AI further with no cloud needed. Every lesson is backed by code that runs.',
    pills: ['Local AI', 'NVIDIA DGX Spark', 'Petascale desktop', 'Backed by code'],
    href: 'https://ainative.business/field-notes',
    ctaText: 'Read the notes',
    cover: {
      title: 'AI Research on NVIDIA DGX Spark',
      subtitle: 'Pushing the Frontier of Local AI on a Petascale Desktop',
      tag: 'Running log',
    },
  },
];
