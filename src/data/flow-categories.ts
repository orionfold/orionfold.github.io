// The Flow product tour, split into four category pages (2026-08-20).
//
// WHY. GA4 (Jul 23 to Aug 19) showed cold visitors to /flow/ leaving after
// about eight seconds, while the one warm visitor stayed almost seven
// minutes. The single page carried twelve chapters and nearly 12,000 words.
// The overview now sells the promise and sends the reader into one category;
// each category page carries its chapters verbatim under a shared sub-nav.
//
// RULES. Chapter ids are the ORIGINAL #tour-<chapter> anchors. They exist on
// the category page (the chapter heading) AND on the overview (the card link),
// so every link published before the split still lands somewhere useful.
// Category copy follows website-copy-style: plain words, no em dashes, no
// capability Flow does not have.

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
  /** One or two sentences. Overview card body and category lede. */
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
    title: 'AI that edits with you, not behind your back.',
    blurb:
      'Five AI actions, one trust path. Every change arrives as an exact diff you approve, a model can look things up in your folders while you watch each lookup, the tools live inside the document, and a fifty page file gets the same care part by part.',
    pageTitle: 'Flow · Writing with AI: approve every change · Orionfold',
    description:
      'How Orionfold Flow edits with AI: five actions, lookups you watch live, a tool strip that states scope and cost, and an exact diff you approve for every change.',
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
    title: 'Every run leaves a record you can check.',
    blurb:
      'One card per run names what ran, where it ran, what it cost, and what the evidence does and does not support. Benchmarks measure the models on your own Mac before you trust one.',
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
    title: 'AI runs where you allow it, and nowhere else.',
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
    title: 'Ordinary files, with search and tables that hold up.',
    blurb:
      'Search results are citations checked byte for byte. Tables edit like tables. A small popover shows what the app is using right now. Your files stay ordinary files any app can read.',
    pageTitle: 'Flow · Documents and files: search, tables, plain Markdown · Orionfold',
    description:
      'Orionfold Flow works on ordinary folders of Markdown. Search returns citations checked byte for byte, tables edit as tables, and a popover shows what the app is using.',
    chapters: [
      { id: 'tour-resources', label: 'What it is using' },
      { id: 'tour-search', label: 'Search' },
      { id: 'tour-tables', label: 'Tables' },
      { id: 'tour-files', label: 'Your files' },
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
