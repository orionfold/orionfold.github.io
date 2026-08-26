// The Flow product tour, split into a tour landing and four category pages.
//
// WHY. GA4 (Jul 23 to Aug 19) showed cold visitors to /flow/ leaving after
// about eight seconds, while the one warm visitor stayed almost seven
// minutes. The single page carried twelve chapters and nearly 12,000 words.
// The product overview now sells the promise and routes into /flow/tour/;
// the tour landing introduces the four parts, and each category page carries
// its chapters under a shared sub-nav.
//
// RULES. Chapter ids are the ORIGINAL #tour-<chapter> anchors. They exist on
// the category page (the chapter heading) AND on the product overview (the
// tour invitation), so every link published before the split still lands
// somewhere useful.
// Category copy follows website-copy-style: plain words, no em dashes, no
// capability Flow does not have. Titles name the common belief and flip it
// (content-masterclass review, 2026-08-20); blurbs are short sentences, one
// idea each.

export interface FlowChapter {
  /** The original anchor id, e.g. `tour-agency`. Never rename. */
  id: string;
  /** Short label, as the chapter's own eyebrow names it. */
  label: string;
}

export interface FlowCategory {
  slug: string;
  /** Sub-nav label and card eyebrow. */
  label: string;
  /** Category page H1 and overview card title. */
  title: string;
  /** Two to four short sentences. Overview card body and category lede. */
  blurb: string;
  /** `<title>` for the category page (search-facing). */
  pageTitle: string;
  /** Meta description, under 160 characters. */
  description: string;
  chapters: FlowChapter[];
}

export const FLOW_CATEGORIES: FlowCategory[] = [
  {
    slug: 'writing-with-ai',
    label: 'Writing with AI',
    title: 'Most AI edits happen behind your back. Flow edits with you.',
    blurb:
      'Seven AI actions, one trust path. Every change arrives as an exact diff you approve. The tools tell you the cost before you click. A fifty page file gets the same care, part by part.',
    pageTitle: 'Flow · Writing with AI: approve every change · Orionfold',
    description:
      'How Orionfold Flow edits with AI: seven actions, lookups you watch live, a tool strip that states scope and cost, and an exact diff you approve for every change.',
    chapters: [
      { id: 'tour-agency', label: 'Writing you approve' },
      { id: 'tour-expand', label: 'Expand with Sources' },
      { id: 'tour-toolbar', label: 'The tool strip' },
      { id: 'tour-longdocs', label: 'Long documents' },
    ],
  },
  {
    slug: 'receipts',
    label: 'Receipts and evidence',
    title: 'Most AI work leaves no trace. Every Flow run leaves a receipt.',
    blurb:
      'One card per run names what ran, where it ran, and what it cost. It says what the evidence does and does not support. Benchmarks measure the models on your own Mac before you trust one.',
    pageTitle: 'Flow · Receipts and evidence: what ran and what it cost · Orionfold',
    description:
      'Every Orionfold Flow run records a receipt: the model, the place it ran, the exact cost, the checks, and the evidence. Benchmarks measure local models on your Mac.',
    chapters: [
      { id: 'tour-receipts', label: 'Receipts' },
      { id: 'tour-benchmarks', label: 'Benchmarks' },
    ],
  },
  {
    slug: 'models-and-runtime',
    label: 'Models and runtime',
    title: 'Most tools decide where your text goes. With Flow, you do.',
    blurb:
      'Four domains decide where work may run. A complete local runtime ships inside the app. Your rules pick the model, and the screen names the rule that did.',
    pageTitle: 'Flow · Models and runtime: local, LAN, or your cloud · Orionfold',
    description:
      'Orionfold Flow runs AI where you allow: on your Mac, on your network, or in the cloud you already pay for. A 19 MiB local runtime ships inside the app. Rules pick the model.',
    chapters: [
      { id: 'tour-domains', label: 'Trust boundaries' },
      { id: 'tour-runtime', label: 'Owned local runtime' },
      { id: 'tour-routing', label: 'Smart Routing' },
    ],
  },
  {
    slug: 'documents-and-files',
    label: 'Documents and files',
    title: 'Most note apps lock your files in a database. Flow works on plain folders.',
    blurb:
      'A search result is a citation, checked byte for byte. Tables edit like tables. Fifty four chart and diagram types are drawn from the text in the file, offline, and Flow can draw one for you. Pictures swap from your own folder. Your files stay ordinary files any app can read.',
    pageTitle: 'Flow · Documents and files: search, tables, plain Markdown · Orionfold',
    description:
      'Orionfold Flow works on ordinary folders of Markdown. Search returns citations checked byte for byte, tables edit as tables, charts draw from the text, and pictures swap from your folder.',
    chapters: [
      { id: 'tour-search', label: 'Search' },
      { id: 'tour-tables', label: 'Tables' },
      { id: 'tour-visualize', label: 'Charts and diagrams' },
      { id: 'tour-pictures', label: 'Pictures' },
      { id: 'tour-files', label: 'Your files' },
      { id: 'tour-resources', label: 'What it is using' },
    ],
  },
];

export const flowCategoryHref = (slug: string) => `/flow/${slug}/`;

/** Where an old `/flow/#tour-<chapter>` anchor now lives. */
export const chapterHref = (chapterId: string): string => {
  const cat = FLOW_CATEGORIES.find((c) => c.chapters.some((ch) => ch.id === chapterId));
  if (!cat) throw new Error(`Unknown Flow chapter ${chapterId}`);
  return `${flowCategoryHref(cat.slug)}#${chapterId}`;
};
