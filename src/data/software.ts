// Software showcase data (spec §6; expanded V5). A typed array feeding
// /software/. Twelve products grouped into four clusters (platform, apps, intel,
// devtools), each summed up in plain words and linking out to its canonical home
// (a live site if it has one, else the GitHub repo). Showcase + link out, no docs
// ported here. Copy reads grade 3–5, no em-dashes, jargon held back for the
// page's "Behind the scenes" reveal (memory `website-copy-style`, spec §7).
//
// `cover` is an asset key: a filename under src/assets/projects/ (resolved by a
// glob in software.astro), or the sentinels '@platform' / '@neosignal' for the
// two donor screenshots imported directly. `coverType` picks how it renders:
// a framed screenshot, a logo on the constellation motif, or the bare motif.
export type SoftwareGroup = 'platform' | 'apps' | 'intel' | 'devtools';
// 'poster' is a curated witty movie-poster key-art (featured-imagery skill),
// rendered full-bleed (no BrowserFrame) since it is illustrative art, not a UI.
export type CoverType = 'screenshot' | 'logo' | 'motif' | 'poster';

export interface SoftwareProduct {
  slug: string;
  group: SoftwareGroup;
  eyebrow: string;
  title: string;
  body: string;
  pills: string[];
  href: string; // canonical home (external)
  ctaText: string;
  coverType: CoverType;
  cover?: string; // asset filename, or '@platform' / '@neosignal'
}

// Group headings + blurbs for the page sections (order = display order).
export const softwareGroups: { id: SoftwareGroup; label: string; blurb: string }[] = [
  { id: 'platform', label: 'The platform', blurb: 'The core: run AI on your own computer, and drive it with code.' },
  { id: 'apps', label: 'Personal AI apps', blurb: 'Ready-to-use apps that keep your data on your machine.' },
  { id: 'intel', label: 'Intelligence & research', blurb: 'Tools that turn the fast-moving AI world into clear answers.' },
  { id: 'devtools', label: 'Developer tools', blurb: 'For builders: testing, terminals, and reusable patterns.' },
];

export const software: SoftwareProduct[] = [
  // ── The platform ──
  {
    slug: 'ai-native-platform',
    group: 'platform',
    eyebrow: 'The platform',
    title: 'AI Native Platform',
    body: 'Run AI helpers on your own computer. Hand them tasks, build flows that run step by step, set schedules, and watch the work as it goes. It even tracks what each run costs. One place, no cloud needed.',
    pills: ['Runs local', 'Agents', 'Workflows', 'Cost tracking'],
    href: 'https://ainative.business/docs/',
    ctaText: 'Read the docs',
    coverType: 'screenshot',
    cover: '@platform',
  },
  {
    slug: 'ai-native-api',
    group: 'platform',
    eyebrow: 'For builders',
    title: 'AI Native API',
    body: 'Drive the whole platform with code. Your own apps can start tasks, read results, and manage everything through plain web calls. It covers 27 groups of actions across the platform.',
    pills: ['REST API', '27 groups', 'For developers'],
    href: 'https://ainative.business/docs/api/',
    ctaText: 'Read the API docs',
    coverType: 'motif',
  },

  // ── Personal AI apps ──
  {
    slug: 'neocash',
    group: 'apps',
    eyebrow: 'Personal wealth',
    title: 'NeoCash',
    body: 'A money helper that runs on your own machine and walks you through taxes, saving, and investing. Your financial details never leave your browser.',
    pills: ['Runs local', '5 money agents', 'Private', 'Web app'],
    href: 'https://neocash.io',
    ctaText: 'Visit NeoCash',
    coverType: 'screenshot',
    cover: 'neocash.png',
  },
  {
    slug: 'openvolo',
    group: 'apps',
    eyebrow: 'Social CRM',
    title: 'OpenVolo',
    body: 'Keep your contacts and posts for X, LinkedIn, and Gmail in one place on your own computer, with AI helpers that draft and sort your outreach.',
    pills: ['Runs local', 'X · LinkedIn · Gmail', 'AI drafting', 'One command'],
    href: 'https://openvolo.com',
    ctaText: 'Visit OpenVolo',
    coverType: 'logo',
    cover: 'openvolo-logo.png',
  },
  {
    slug: 'memo',
    group: 'apps',
    eyebrow: 'Browser tool',
    title: 'Memo',
    body: 'A Chrome add-on that saves anything you find online so you can chat with it later, using the AI you choose, even a private one on your machine.',
    pills: ['Chrome extension', '4 AI providers', 'Local-first', 'YouTube'],
    href: 'https://github.com/navam-io/memo',
    ctaText: 'See it on GitHub',
    coverType: 'screenshot',
    cover: 'memo.png',
  },
  {
    slug: 'marketer',
    group: 'apps',
    eyebrow: 'Marketing',
    title: 'Marketer',
    body: 'Turn one article into ready-to-post social updates with AI, then copy and paste them anywhere. No logins or connections to set up.',
    pills: ['Copy-paste', 'AI drafts', 'Kanban', 'Local-first'],
    href: 'https://github.com/navam-io/marketer',
    ctaText: 'See it on GitHub',
    coverType: 'motif',
  },

  // ── Intelligence & research ──
  {
    slug: 'neosignal',
    group: 'intel',
    eyebrow: 'Market intel',
    title: 'neosignal',
    body: 'See where AI is headed. neosignal tracks and scores AI models, chips, cloud hosts, and tools, then shows how well they work together. Get an alert the moment something big shifts.',
    pills: ['Model scores', 'Chips & clouds', 'Fit matrix', 'Alerts'],
    href: 'https://neosignal.io',
    ctaText: 'Visit neosignal',
    coverType: 'screenshot',
    cover: '@neosignal',
  },
  {
    slug: 'trends',
    group: 'intel',
    eyebrow: 'Enterprise intel',
    title: 'Trends',
    body: 'AI agents research what is coming, find what your business needs, and weigh build versus buy, turning market trends into a clear tech plan.',
    pills: ['Multi-agent', 'Build vs buy', 'Live demo', 'Next.js'],
    href: 'https://github.com/navam-io/trends',
    ctaText: 'See it on GitHub',
    coverType: 'screenshot',
    cover: 'trends.png',
  },
  {
    slug: 'moments',
    group: 'intel',
    eyebrow: 'News intel',
    title: 'Moments',
    body: 'Turns the flood of AI-industry news into clear insights, spotting the big moments and showing how they connect, all on your own systems.',
    pills: ['Runs local', 'Multi-agent', 'Dashboards', 'Claude SDK'],
    href: 'https://github.com/navam-io/moments',
    ctaText: 'See it on GitHub',
    coverType: 'screenshot',
    cover: 'moments.png',
  },

  // ── Developer tools ──
  {
    slug: 'command',
    group: 'devtools',
    eyebrow: 'Developer tool',
    title: 'Command',
    body: 'Turn your terminal into a fast personal AI app that runs 15+ models, including private ones on your laptop, with three simple commands.',
    pills: ['Terminal', '15+ models', '7 providers', 'Local-first'],
    href: 'https://github.com/navam-io/command',
    ctaText: 'See it on GitHub',
    coverType: 'screenshot',
    cover: 'command.png',
  },
  {
    slug: 'sentinel',
    group: 'devtools',
    eyebrow: 'Agent testing',
    title: 'Sentinel',
    body: 'Build and run tests for your AI helpers by dragging boxes around. Like Postman, but for checking that AI agents behave.',
    pills: ['Visual canvas', 'Desktop app', 'YAML export', 'Well tested'],
    href: 'https://github.com/navam-io/sentinel',
    ctaText: 'See it on GitHub',
    coverType: 'logo',
    cover: 'sentinel-logo.png',
  },
  {
    slug: 'fieldkit',
    group: 'devtools',
    eyebrow: 'Open toolbox',
    title: 'fieldkit',
    body: 'A free Python toolbox of patterns we proved on a small AI desktop. It covers the whole job: faster replies, search over your own files, scoring, training, and shipping models. Use just the parts you need.',
    pills: ['Open source', 'Python', 'Proven on Spark', 'Free'],
    href: 'https://ainative.business/fieldkit/',
    ctaText: 'Get fieldkit',
    coverType: 'motif',
  },
];
