// The footer's curated links, shared by the Living Systems footer and the
// Paper footer so the two never drift while the site migrates (G-139).
// Paths and Compare list every published page, so a new path reaches the
// footer without an edit here.
import { publishedPaths, publishedCompare, pathHref, compareHref } from '../lib/flow/paths';

export interface FooterLink { href: string; label: string }

export const FLOW_COLUMNS: FooterLink[][] = [
  [
    { href: '/flow/', label: 'Overview' },
    { href: '/playbooks/', label: 'Playbooks' },
    { href: '/flow/elements/', label: 'Elements' },
    { href: '/essays/', label: 'Essays' },
  ],
  [
    { href: '/flow/tour/', label: 'Tour' },
    { href: '/flow/night-shift/', label: 'Night Shift' },
    { href: '/flow/living-documents/', label: 'Living Documents' },
    { href: '/flow/settings/', label: 'Settings' },
    { href: '/flow/specifications/', label: 'Tech Specs' },
    { href: '/flow/enterprise/', label: 'Enterprise' },
  ],
];

export const ORIONFOLD_COLUMNS: FooterLink[][] = [
  [
    { href: '/flow/', label: 'Flow' },
    { href: '/arena/', label: 'Arena' },
    { href: '/relay/', label: 'Relay' },
  ],
  [
    { href: '/about/', label: 'About' },
    { href: '/story/', label: 'Story' },
    { href: '/learn/', label: 'Books' },
    { href: '/proposal/', label: 'Proposal' },
    { href: '/sponsor/', label: 'Sponsor' },
  ],
  [
    { href: '/models/', label: 'Models' },
    { href: '/dgx-spark/', label: 'DGX Spark' },
  ],
];

export const LEGAL_LINKS: FooterLink[] = [
  { href: '/promise/', label: 'Promise' },
  { href: '/terms/', label: 'Terms' },
  { href: '/privacy/', label: 'Privacy' },
];

export const SOCIAL_LINKS = {
  linkedin: 'https://www.linkedin.com/in/manavsehgal/',
  x: 'https://x.com/manavsehgal',
  github: 'https://github.com/manavsehgal',
};

export const footerPaths = async (): Promise<FooterLink[]> =>
  (await publishedPaths()).map((p) => ({ href: pathHref(p.id), label: p.data.path }));

export const footerCompare = async (): Promise<FooterLink[]> =>
  (await publishedCompare()).map((p) => ({ href: compareHref(p.id), label: p.data.kind === 'switch' ? `Flow vs ${p.data.tool}` : `Flow with ${p.data.tool}` }));
