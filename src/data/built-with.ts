// "Built with Orionfold" (operator 2026-10-28): founder walks and customer
// cases on the homepage, told plainly, dated, and linked to the files, issues
// and releases behind each one. Never a quotation: a walk is the founder's own
// signed account, a case is told with the customer's approval and names what
// can be checked (the customer's approval to be named is recorded in the
// planning changelog, not on the page). The word testimonial waits for a
// customer who said it and agreed to be quoted. Add a walk here as it happens; the band renders them all.
export type BuiltWithKind = 'walk' | 'case';

export interface BuiltWithFact {
  label: string;
  href: string;
}

export interface BuiltWithEntry {
  id: string;
  kind: BuiltWithKind;
  /** Product the entry was built with. */
  product: 'Flow' | 'Relay';
  /** Short, date-first eyebrow. */
  when: string;
  title: string;
  /** One to four short sentences. No quotation marks. */
  body: string;
  /** Checkable facts, each with the place to check it. */
  facts: BuiltWithFact[];
  /** Who it is about, as they are named publicly. */
  who: string;
  role: string;
  /** Where the full account lives. */
  href: string;
  hrefLabel: string;
}

export const BUILT_WITH: BuiltWithEntry[] = [
  {
    id: 'ai-consulting-walk',
    kind: 'walk',
    product: 'Flow',
    when: 'October 25 to 26, 2026',
    title: 'AI Consulting, built in Flow',
    body: 'I wrote the AI Consulting Domain in Flow over two days. It carries nine years of Amazon mechanisms, from picking the right AI project to taking a pilot to production. Chat drafted each document in my voice and marked every claim it could not stand behind. An old ChatGPT chat came in as a reference, links kept. Skills drew the figures, and each one can be pressed and stepped through. I reviewed every change, published the folder to GitHub, and pulled it into a fresh Flow. When I published again, that copy showed the update as a change to review.',
    facts: [
      { label: '6 files, 75 KB', href: 'https://github.com/orionfold/flow/tree/main/flow-domains/ai-consulting-starter' },
      { label: 'About 3 hours', href: '/domains/ai-consulting/#the-numbers' },
      { label: '$0 extra API spend', href: '/domains/ai-consulting/#the-numbers' },
    ],
    who: 'Manav Sehgal',
    role: 'Founder, Orionfold',
    href: '/domains/ai-consulting/',
    hrefLabel: 'Read the walk',
  },
  {
    id: 'dgh42-relay-case',
    kind: 'case',
    product: 'Relay',
    when: 'July to October 2026',
    title: 'DGH42 built Lantern on Relay',
    body: 'Harun Yayli, co-founder of DGH42, chose Relay for the expertise behind AI Native Business and for an open-source foundation he could adapt. Lantern, the DGH42 platform that learns a business from its own email, files and feedback, runs on Relay. So does BeneFACT, its product for small nonprofits. Flow is designed to make this path easier for subject matter experts. It pairs a familiar document interface with opinionated AI defaults. Capture your methods, apply them to customer work, review the results, and publish useful deliverables under your own brand.',
    facts: [
      { label: 'Relay, open source', href: 'https://github.com/orionfold/relay' },
      { label: 'BeneFACT', href: 'https://dgh42.com/beneFACT' },
      { label: 'Flow Domains', href: '/domains/' },
    ],
    who: 'Harun Yayli',
    role: 'Co-founder, DGH42',
    href: 'https://github.com/dgh42/orionfold-relay',
    hrefLabel: 'See the public fork',
  },
];
