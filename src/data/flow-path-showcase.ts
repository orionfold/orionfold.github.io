// Native showcase for each Flow 2.0 path: what the app's own Home draws
// (App/PathShowcaseView.swift, from the Guide manifest: hue, before → Flow →
// after diagram, steps, benefits), plus a mock of the document the path ends
// with. Every figure in a mock comes from that path's walkthrough article or
// the fictional test files it used (orionfold-flow articles/_inputs/
// generate.py); every company and person is fictional.
//
// Tier pills are deliberately left out: the manifest's "free" marks disagree
// with the rule that any model run is Pro, so the site shows benefits only.

export type Hue = 'teal' | 'blue' | 'cyan' | 'indigo' | 'purple' | 'orange' | 'mint';
export type Mark = 'pdf' | 'xlsx' | 'pptx' | 'docx' | 'md' | 'csv' | 'code' | 'folder' | 'web' | 'terminal' | 'claude' | 'openai' | 'dictation' | 'history' | 'epub' | 'chart' | 'model' | 'flow';
export type Capability = 'sources' | 'jobs' | 'review' | 'publish' | 'ask' | 'night' | 'picture' | 'router';

export const HUE: Record<Hue, string> = {
  teal: '#0e9e98',
  blue: '#2f6fd6',
  cyan: '#0f8fb3',
  indigo: '#5b54d6',
  purple: '#8a4fc7',
  orange: '#d9731a',
  mint: '#15a37a',
};

/** One stage-aware block inside a mocked Flow document. `at` is the stage it appears. */
export type DocBlock =
  | { kind: 'kpis'; items: { label: string; value: string; after?: string; delta?: string }[] }
  | { kind: 'bars'; title: string; unit?: string; items: { label: string; value: number; after?: number; hi?: boolean }[] }
  | { kind: 'line'; title: string; labels: string[]; values: number[]; next?: { label: string; value: number }; min: number; max: number; unit?: string }
  | { kind: 'table'; title?: string; head: string[]; rows: string[][]; changed?: number[] }
  | { kind: 'prose'; text: string; cites?: number; proposed?: boolean }
  | { kind: 'diff'; title: string; pairs: { before: string; after: string }[]; note?: string }
  | { kind: 'callout'; tone: 'brief' | 'watch' | 'ask'; title: string; text: string }
  | { kind: 'diagram'; title: string; nodes: string[] }
  | { kind: 'picture'; scene: 'commuter'; caption: string }
  | { kind: 'bilingual'; left: string; right: string; notes: number }
  | { kind: 'consent'; rows: [string, string][]; action: string }
  | { kind: 'tree'; items: { name: string; depth: number; open?: boolean }[] }
  | { kind: 'chips'; items: string[] };

export interface DocMock {
  folder: string;
  file: string;
  title: string;
  dek: string;
  blocks: DocBlock[];
  /** The review row Flow shows once the change is ready. */
  review: string;
  /** The receipt line after approval. Machine time and cost as measured. */
  receipt: string;
}

export interface PathShowcase {
  slug: string;
  title: string;
  persona: string;
  /** One-line "what's in it for me" for the nav dropdown. */
  hook: string;
  chip: string;
  hue: Hue;
  steps: string[];
  benefits: string[];
  diagram: { in: Mark[]; middle: string; out: Mark[]; through: Capability[]; captions: [string, string, string] };
  doc: DocMock;
  /** Which doc blocks a thumbnail shows (the most visual pair). */
  thumb: number[];
}

export const SHOWCASE: Record<string, PathShowcase> = {
  'recurring-client-brief': {
    slug: 'recurring-client-brief',
    thumb: [0, 1],
    title: 'The recurring client brief',
    persona: 'Consultants · analysts · fractional operators',
    hook: 'Sourced once. Refreshed monthly.',
    chip: 'Clients',
    hue: 'teal',
    steps: ['Import last month’s PDFs, decks and sheets', 'Draft the brief with sources, and approve it', 'Publish to PDF or Word; refresh next month'],
    benefits: ['Time', 'Quality'],
    diagram: { in: ['pdf', 'xlsx', 'pptx'], middle: 'brief', out: ['pdf', 'docx'], through: ['sources', 'jobs'], captions: ['Client files', 'A brief to sign', 'Fresh next month'] },
    doc: {
      folder: 'Client Brief', file: 'Client Brief.md',
      title: 'Cascadia Freight steering brief', dek: 'Pinecrest Partners · monthly brief · September 2026',
      blocks: [
        { kind: 'bars', title: 'Parcels by hub (k)', items: [{ label: 'Tacoma', value: 412, after: 428 }, { label: 'Portland', value: 287, after: 301 }, { label: 'Boise', value: 133, after: 142, hi: true }] },
        { kind: 'table', title: 'Hub performance', head: ['Hub', 'On time', 'Cost / parcel'], rows: [['Tacoma', '96.9%', '$4.29'], ['Portland', '95.1%', '$4.52'], ['Boise', '93.4%', '$4.71']], changed: [2] },
        { kind: 'callout', tone: 'ask', title: 'Asks this month', text: 'Approve a one-month extension of the incumbent carrier contract. Keep the Boise second shift through peak.' },
      ],
      review: 'This month expanded from 4 sources. 4 sources cited.',
      receipt: '45 s · Flow Runtime · on this Mac · $0.00',
    },
  },
  'docs-true-to-code': {
    slug: 'docs-true-to-code',
    thumb: [0, 1],
    title: 'Docs that stay true to the code',
    persona: 'Builders · indie hackers',
    hook: 'Catch doc drift before your users do.',
    chip: 'Code',
    hue: 'blue',
    steps: ['Add the repo folder; your git stays yours', 'Proofread or expand a spec, change by change', 'Publish to GitHub Pages or a PDF'],
    benefits: ['Ownership', 'Quality'],
    diagram: { in: ['code', 'folder'], middle: 'spec', out: ['web', 'pdf'], through: ['review', 'publish'], captions: ['Your repo', 'An approved spec', 'Live docs'] },
    doc: {
      folder: 'quayside', file: 'docs/scheduling-spec.md',
      title: 'Scheduling spec', dek: 'Quayside · docs/scheduling-spec.md',
      blocks: [
        { kind: 'diagram', title: 'Request path', nodes: ['Client', 'Rate limiter', 'Scheduler', 'Worker'] },
        { kind: 'diff', title: 'Proofread · 4 fixes on 2 lines', pairs: [{ before: 'can not', after: 'cannot' }, { before: 'an other', after: 'another' }, { before: 'days', after: 'day’s' }, { before: 'avaliable', after: 'available' }] },
        { kind: 'chips', items: ['M docs/scheduling-spec.md', '?? .flow-receipts', '?? .flow-review'] },
      ],
      review: '4 fixes on 2 lines. The rest of the file is unchanged.',
      receipt: '~4 s · Flow Runtime · on this Mac · $0.00',
    },
  },
  'review-agents': {
    slug: 'review-agents',
    thumb: [1, 2],
    title: 'Review what your agents wrote',
    persona: 'Claude Code and Codex users',
    hook: 'See every agent edit before it lands.',
    chip: 'Agents',
    hue: 'cyan',
    steps: ['Point your agent at a folder open in Flow', 'Keep or revert each change it made', 'History keeps the run and every version'],
    benefits: ['Trust', 'Cost'],
    diagram: { in: ['terminal', 'claude', 'openai'], middle: 'review', out: ['history'], through: [], captions: ['Agents at work', 'Keep or revert', 'Full history'] },
    doc: {
      folder: 'Agent Desk', file: 'pricing.md',
      title: 'Lumen Invoicing pricing', dek: 'Agent Desk · 239 words · proofread by Codex',
      blocks: [
        { kind: 'consent', rows: [['Agent', 'Codex CLI · Codex subscription'], ['What it may do', 'Full access · Agent Desk'], ['Cost', 'Included in a subscription you already pay for']], action: 'Allow Once' },
        { kind: 'diff', title: 'Exact changes · 3 lines', pairs: [{ before: 'buisness', after: 'business' }, { before: 'definately', after: 'definitely' }, { before: 'get started with', after: 'get started with,' }] },
        { kind: 'bars', title: 'What the agent carried', items: [{ label: 'Words on the page', value: 239 }, { label: 'Tokens sent in', value: 21831, hi: true }] },
      ],
      review: '6 words added or removed; original: 239 words.',
      receipt: '26.7 s · Codex subscription · file untouched until approved',
    },
  },
  'investor-update': {
    slug: 'investor-update',
    thumb: [1, 0],
    title: 'The investor update and the watch',
    persona: 'Founders',
    hook: 'Numbers and market, checked daily.',
    chip: 'Founders',
    hue: 'orange',
    steps: ['Import the metrics workbook and last month’s deck', 'The watch checks competitors; the Morning Briefing says what moved', 'Publish PowerPoint or PDF, every claim sourced'],
    benefits: ['Time', 'Trust'],
    diagram: { in: ['web', 'xlsx'], middle: 'update', out: ['pptx'], through: ['night', 'sources'], captions: ['Web and metrics', 'A checked update', 'To investors'] },
    doc: {
      folder: 'Investor Update', file: 'Investor Update.md',
      title: 'Tidewell investor update', dek: 'August 2026 · 13 slides when published',
      blocks: [
        { kind: 'kpis', items: [{ label: 'MRR', value: '$248k', delta: '+6.9%' }, { label: 'NRR', value: '117%' }, { label: 'Runway', value: '17.9 mo' }] },
        { kind: 'line', title: 'MRR ($k)', labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], values: [182, 191, 203, 219, 232, 248], min: 170, max: 255 },
        { kind: 'callout', tone: 'watch', title: 'Morning Briefing', text: '7 sources checked: 6 current, 1 changed. Research Decisions.md changed since it was last checked.' },
        { kind: 'prose', text: 'Alexa+ costs $19.99 a month without Prime. Raycast now sells three tiers, from $10 to $50.', cites: 2, proposed: true },
      ],
      review: 'Market section: 422 words, 11 of 13 sources cited.',
      receipt: '79 s · Flow Runtime · on this Mac · $0.00',
    },
  },
  'campaign-with-proof': {
    slug: 'campaign-with-proof',
    thumb: [0, 1],
    title: 'Campaign with proof',
    persona: 'Marketers',
    hook: 'Launch copy, every claim sourced.',
    chip: 'Marketers',
    hue: 'mint',
    steps: ['Import the brief and last quarter’s results', 'Expand with Sources, then Translate', 'Publish a Word file and a web page'],
    benefits: ['Quality', 'Time'],
    diagram: { in: ['web', 'md'], middle: 'campaign', out: ['docx', 'web'], through: ['sources'], captions: ['Your sources', 'A cited campaign', 'In two languages'] },
    doc: {
      folder: 'Marketing Campaign', file: 'Launch Post.md',
      title: 'Fieldstone Bikes Q4 launch post', dek: 'Denver and Salt Lake City · English and Spanish',
      blocks: [
        { kind: 'picture', scene: 'commuter', caption: 'The Commuter, on a 6-mile ride to work.' },
        { kind: 'bars', title: 'Q3 trials by channel', items: [{ label: 'Paid social', value: 612 }, { label: 'Search', value: 455 }, { label: 'Employer partners', value: 301, hi: true }, { label: 'Podcast', value: 118 }] },
        { kind: 'bilingual', left: '71% of riders ride three or more days a week after 60 days.', right: 'El 71 % de los ciclistas sale tres o más días por semana tras 60 días.', notes: 12 },
        { kind: 'chips', items: ['unsupported-citations ✓', 'reference-freshness ✓', 'human-review ✓'] },
      ],
      review: '372 words, was 8. 12 footnotes. 25 of 25 figures match.',
      receipt: '48 s draft · 15 s Spanish · on this Mac · $0.00',
    },
  },
  'status-from-what-you-have': {
    slug: 'status-from-what-you-have',
    thumb: [0, 1],
    title: 'Status from what you already have',
    persona: 'Knowledge workers',
    hook: 'Status from files you already have.',
    chip: 'Teams',
    hue: 'indigo',
    steps: ['Import the attachments; dictate your notes', 'Ask what changed this week; Summarize', 'Publish a clean Word file for the team'],
    benefits: ['Time', 'Privacy'],
    diagram: { in: ['docx', 'pdf', 'dictation'], middle: 'status', out: ['docx'], through: ['ask'], captions: ['Files and voice', 'Weekly status', 'Sent to the team'] },
    doc: {
      folder: 'Team Status', file: 'My notes.md',
      title: 'Status, week of September 28', dek: 'Brightwater Commerce · six points',
      blocks: [
        { kind: 'bars', title: 'Confidence', items: [{ label: 'Dana', value: 90 }, { label: 'Priya', value: 85 }, { label: 'Marcus', value: 60 }, { label: 'Sam', value: 35, hi: true }] },
        { kind: 'table', head: ['Item', 'Owner', 'Due'], rows: [['Partial refund fix', 'Kestrel', 'Oct 2'], ['Webhook retry policy', 'Brightwater', 'Sept 30']] },
      ],
      review: '22 of 22 figures found in the sources. One name corrected in review.',
      receipt: '~16 s of model time',
    },
  },
  'leave-rented-notes': {
    slug: 'leave-rented-notes',
    thumb: [0, 1],
    title: 'Leave rented notes',
    persona: 'Coming from Notion',
    hook: 'Your notes, as files you own.',
    chip: 'Own your notes',
    hue: 'purple',
    steps: ['Export from Notion; add the folder', 'Pick a model: on this Mac or your own key', 'Every AI edit is a change you approve'],
    benefits: ['Ownership', 'Cost'],
    diagram: { in: ['md', 'folder'], middle: 'router', out: ['flow', 'claude'], through: [], captions: ['Notion export', 'Smart Routing', 'Mac or your key'] },
    doc: {
      folder: 'Fernhill Studio', file: '2026-09-08 Marlow kickoff.md',
      title: 'Marlow kickoff', dek: 'Fernhill Studio · meeting notes',
      blocks: [
        { kind: 'tree', items: [{ name: 'Fernhill Studio', depth: 0, open: true }, { name: 'Clients', depth: 1 }, { name: 'Meeting notes', depth: 1, open: true }, { name: '2026-09-08 Marlow kickoff', depth: 2 }, { name: 'Reading list.csv', depth: 1 }] },
        { kind: 'diff', title: 'Proofread · 38 of 142 words', pairs: [{ before: 'dana says the delivery thing is the whole problem honestly', after: 'Dana says the delivery step is the whole problem.' }] },
      ],
      review: '38 words added or removed; original: 142 words.',
      receipt: '~6 s · Gemma 4 E4B · on this Mac · $0.00',
    },
  },
};

export const showcaseFor = (slug: string): PathShowcase | undefined => SHOWCASE[slug];
