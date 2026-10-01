// Native showcase for each Flow 2.0 path: what the app's own Home draws
// (App/PathShowcaseView.swift, from the Guide manifest: hue, before → Flow →
// after diagram, steps, benefits), plus a mock of the document the path ends
// with. Every figure in a mock comes from that path's walkthrough article or
// the fictional test files it used (orionfold-flow articles/_inputs/
// generate.py); every company and person is fictional.
//
// Tier pills are deliberately left out: the manifest's "free" marks disagree
// with the rule that any model run is Pro, so the site shows benefits only.

export type Hue = 'teal' | 'blue' | 'cyan' | 'indigo' | 'purple' | 'orange' | 'mint' | 'yellow' | 'brown' | 'green' | 'red' | 'pink';
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
  yellow: '#b07d05',
  brown: '#8a5a3c',
  green: '#2f8a3e',
  red: '#cf3f36',
  pink: '#c2477f',
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
  | { kind: 'consent'; title?: string; rows: [string, string][]; action: string }
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
  'weekly-issue': {
    slug: 'weekly-issue',
    thumb: [0, 1],
    title: 'The weekly issue, then the book',
    persona: 'Creators',
    hook: 'Your issues as files. Your year as a book.',
    chip: 'Writing',
    hue: 'yellow',
    steps: ['Dictate the issue; draft it with Expand', 'Describe Picture writes the alt text', 'Collect the issues into an EPUB'],
    benefits: ['Ownership', 'Time'],
    diagram: { in: ['dictation', 'md'], middle: 'issue', out: ['epub'], through: ['picture', 'publish'], captions: ['Voice and notes', 'This week’s issue', 'A book of the year'] },
    doc: {
      folder: 'Newsletter Archive', file: 'issues/Issue 03.md',
      title: 'The Harbour Letter, issue 3', dek: 'Writing in the open · spoken, then filled out from the notes',
      blocks: [
        { kind: 'prose', text: '40 readers and 11 replies in the first week. 9 drafts since August, at 3.4 replies each. 2 corrections, 0 unsubscribes.', cites: 1 },
        { kind: 'callout', tone: 'brief', title: 'Alt text, from Describe Picture', text: 'A stylized scene depicts a small red boat in the foreground with several other boats in the background under a pale sun.' },
        { kind: 'tree', items: [{ name: 'A Year of the Harbour Letter.epub', depth: 0, open: true }, { name: 'Cover', depth: 1 }, { name: 'Contents', depth: 1 }, { name: 'Issue 01', depth: 1 }, { name: 'Issue 02', depth: 1 }, { name: 'Issue 03', depth: 1 }] },
      ],
      review: '145 words added or removed; original: 114 words.',
      receipt: '~14 s · Gemma 4 E4B · on this Mac · $0.00',
    },
  },
  'account-brief': {
    slug: 'account-brief',
    thumb: [0, 1],
    title: 'Account brief before the call',
    persona: 'Sellers',
    hook: 'Know what changed before the call.',
    chip: 'Sellers',
    hue: 'brown',
    steps: ['Import the lead sheet from Excel', 'Run Jobs to refresh the account', 'Publish Excel with every source kept'],
    benefits: ['Time', 'Trust'],
    diagram: { in: ['xlsx', 'md'], middle: 'jobs', out: ['xlsx'], through: [], captions: ['Lead sheet', 'Jobs refresh it', 'Brief for the call'] },
    doc: {
      folder: 'Sales Account', file: 'Account Brief.md',
      title: 'Meridian Retail account brief', dek: 'Refreshed from the lead sheet before Discovery 04',
      blocks: [
        { kind: 'table', title: 'Questions for the meeting', head: ['Id', 'Question', 'Owner'], rows: [['R4', 'Windows reviewers', 'Mara'], ['R6', 'Store-cluster roll-up', 'Elliot']], changed: [1] },
        { kind: 'diff', title: 'Exact changes · 1 out, 1 in', pairs: [{ before: 'R3 · Export for counsel · Open', after: 'R6 · Store-cluster roll-up · Open' }], note: 'R3 was answered. R4 is unchanged.' },
        { kind: 'chips', items: ['Source file on every row', 'Captured on every row', 'README sheet'] },
      ],
      review: '2 awaiting a decision · 4 of 4 completed.',
      receipt: '~17 s · Qwen 3.8 27B · on this Mac · $0.00',
    },
  },
  'portfolio-explains-itself': {
    slug: 'portfolio-explains-itself',
    thumb: [0, 1],
    title: 'A portfolio that explains itself',
    persona: 'Investors',
    hook: 'Your holdings, explained on your Mac.',
    chip: 'Money',
    hue: 'green',
    steps: ['Import your holdings from a spreadsheet', 'Gather quotes; the charts redraw from your own files', 'Overnight notes describe the tables on a model on this Mac'],
    benefits: ['Privacy', 'Ownership'],
    diagram: { in: ['xlsx', 'web'], middle: 'dashboard', out: ['chart', 'model'], through: ['jobs', 'night'], captions: ['Holdings, quotes', 'A dashboard', 'Notes on this Mac'] },
    doc: {
      folder: 'Stock Portfolio', file: 'Portfolio Dashboard.md',
      title: 'Portfolio dashboard', dek: 'Fictional lots · public prices, 30 September 2026 · not investment advice',
      blocks: [
        { kind: 'kpis', items: [{ label: 'Value', value: '111,233' }, { label: 'Day change', value: '510' }, { label: 'Gain on cost', value: '16%' }] },
        { kind: 'bars', title: 'Largest holdings', items: [{ label: 'NVDA', value: 17294, hi: true }, { label: 'AAPL', value: 13305 }, { label: 'GOOGL', value: 10434 }] },
        { kind: 'callout', tone: 'watch', title: 'Overnight note', text: 'The first draft was refused: one number could not be traced to the data. The second draft traced 14 of 14.' },
      ],
      review: '11 changes: 10 views redrawn and the note.',
      receipt: '~2 min 21 s · Qwen 3.8 27B · on this Mac · $0.00',
    },
  },
  'manuscript-to-book': {
    slug: 'manuscript-to-book',
    thumb: [0, 1],
    title: 'Manuscript to book',
    persona: 'Authors',
    hook: 'Proofread on your Mac. A book you own.',
    chip: 'Authors',
    hue: 'red',
    steps: ['Import the Word manuscript', 'Proofread chapter by chapter', 'Generate a cover and publish the EPUB'],
    benefits: ['Ownership', 'Cost'],
    diagram: { in: ['docx'], middle: 'book', out: ['epub'], through: ['review', 'picture'], captions: ['Word manuscript', 'Proofread', 'Book and cover'] },
    doc: {
      folder: 'Manuscript', file: 'chapters/The ferryman’s ledger.md',
      title: 'The ferryman’s ledger', dek: 'The Estuary · chapter 3, imported from Word',
      blocks: [
        { kind: 'diff', title: 'Proofread · 3 fixes', pairs: [{ before: 'writen', after: 'written' }, { before: 'Their were', after: 'There were' }, { before: 'it’s painter', after: 'its painter' }], note: 'Nothing else changed.' },
        { kind: 'consent', title: 'Before anything leaves this Mac', rows: [['Service', 'OpenRouter · Gemini 3.1 Flash Lite Image'], ['What leaves this Mac', 'Title, subtitle, author, one sentence'], ['Estimated cost', '0.0336 USD a picture']], action: 'Allow Once' },
        { kind: 'tree', items: [{ name: 'The Estuary.epub', depth: 0, open: true }, { name: 'Cover', depth: 1 }, { name: 'Contents', depth: 1 }, { name: 'Chapter 01', depth: 1 }, { name: 'Chapter 02', depth: 1 }, { name: 'The ferryman’s ledger', depth: 1 }] },
      ],
      review: '3 fixes on 3 lines. The rest of the chapter is unchanged.',
      receipt: '~9 s · Gemma 4 E4B · on this Mac · $0.00',
    },
  },
  'life-admin-handled': {
    slug: 'life-admin-handled',
    thumb: [0, 1],
    title: 'Life admin, handled',
    persona: 'Tax · budget · insurance · travel',
    hook: 'Your month, from your bank’s export.',
    chip: 'Life',
    hue: 'pink',
    steps: ['Make a copy of the Household Budget', 'Replace the sample statements with your own', 'Run Jobs to redraw this month’s totals'],
    benefits: ['Time', 'Privacy'],
    diagram: { in: ['csv', 'folder'], middle: 'budget', out: ['chart'], through: ['jobs'], captions: ['Your statements', 'This month’s review', 'Totals that redraw'] },
    doc: {
      folder: 'Household Budget', file: 'Household Budget.md',
      title: 'Household budget, September', dek: 'Harbor Credit Union statement · a fictional household',
      blocks: [
        { kind: 'kpis', items: [{ label: 'Spent', value: '$6,916' }, { label: 'Plan', value: '$7,810' }, { label: 'Savings rate', value: '29.4%' }] },
        { kind: 'bars', title: 'Travel against its budget ($)', items: [{ label: 'Budget', value: 300 }, { label: 'Spent', value: 386, hi: true }] },
        { kind: 'callout', tone: 'ask', title: 'No rule could place these', text: '2 lines, $445: a vet visit and a Zelle payment. Name these first.' },
      ],
      review: '8 changes: the charts, the tables and the notes.',
      receipt: '~1 s totals · Qwen 3.8 27B notes · on this Mac · $0.00',
    },
  },
};

export const showcaseFor = (slug: string): PathShowcase | undefined => SHOWCASE[slug];
