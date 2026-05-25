// Software showcase data (spec §6). A small typed array feeding /software/.
// Four products, each summed up in plain words and linking out to its canonical
// home (ainative.business or neosignal.io) — showcase + link out, no docs ported
// here. Copy reads grade 3–5, no em-dashes, jargon held back for the page's
// "Behind the scenes" reveal (memory `website-copy-style`, spec §7).
export interface SoftwareProduct {
  slug: string;
  eyebrow: string;
  title: string;
  body: string;
  pills: string[];
  href: string; // canonical home (external)
  ctaText: string;
}

export const software: SoftwareProduct[] = [
  {
    slug: 'ai-native-platform',
    eyebrow: 'The platform',
    title: 'AI Native Platform',
    body: 'Run AI helpers on your own computer. Hand them tasks, build flows that run step by step, set schedules, and watch the work as it goes. It even tracks what each run costs. One place, no cloud needed.',
    pills: ['Runs local', 'Agents', 'Workflows', 'Cost tracking'],
    href: 'https://ainative.business/docs/',
    ctaText: 'Read the docs',
  },
  {
    slug: 'neosignal',
    eyebrow: 'Market intel',
    title: 'neosignal',
    body: 'See where AI is headed. neosignal tracks and scores AI models, chips, cloud hosts, and tools, then shows how well they work together. Get an alert the moment something big shifts.',
    pills: ['Model scores', 'Chips & clouds', 'Fit matrix', 'Alerts'],
    href: 'https://neosignal.io',
    ctaText: 'Visit neosignal',
  },
  {
    slug: 'fieldkit',
    eyebrow: 'Open toolbox',
    title: 'fieldkit',
    body: 'A free Python toolbox of patterns we proved on a small AI desktop. It covers the whole job: faster replies, search over your own files, scoring, training, and shipping models. Use just the parts you need.',
    pills: ['Open source', 'Python', 'Proven on Spark', 'Free'],
    href: 'https://ainative.business/fieldkit/',
    ctaText: 'Get fieldkit',
  },
  {
    slug: 'ai-native-api',
    eyebrow: 'For builders',
    title: 'AI Native API',
    body: 'Drive the whole platform with code. Your own apps can start tasks, read results, and manage everything through plain web calls. It covers 27 groups of actions across the platform.',
    pills: ['REST API', '27 groups', 'For developers'],
    href: 'https://ainative.business/docs/api/',
    ctaText: 'Read the API docs',
  },
];
