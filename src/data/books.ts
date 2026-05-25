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
    eyebrow: 'Field notes',
    title: 'Field Notes',
    body: 'Short write-ups from our own build days. Each one turns a real session into a clear lesson, and every lesson is backed by code that runs. A good read if you want to see how the work really gets done.',
    pills: ['From real builds', 'Backed by code', 'New notes often'],
    href: 'https://ainative.business/field-notes',
    ctaText: 'Read the notes',
    cover: {
      title: 'Field Notes',
      subtitle: 'Lessons from the build.',
      tag: 'Running log',
    },
  },
];
