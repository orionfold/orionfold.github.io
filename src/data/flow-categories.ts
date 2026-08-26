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
  /** The one visual proof pattern the page keeps returning to. */
  proof: string;
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
    title: 'Write with AI. Keep the final word.',
    blurb:
      'Seven focused actions help draft, check, translate, structure, source, and visualize your work. Every result arrives as a review you approve before it changes the file.',
    proof: 'Before and after bytes. One human review gate. Nothing saved without approval.',
    pageTitle: 'Flow · Writing with AI you approve · Orionfold',
    description:
      'Write, refine, translate, structure, source, and visualize in Orionfold Flow. Review the exact change and approve it before the file is saved.',
    chapters: [
      { id: 'tour-agency', label: 'Writing you approve' },
      { id: 'tour-expand', label: 'Expand with Sources' },
      { id: 'tour-toolbar', label: 'The tool strip' },
      { id: 'tour-longdocs', label: 'Long documents' },
    ],
  },
  {
    slug: 'documents-and-files',
    label: 'Documents and files',
    title: 'Do more with your files. Keep them yours.',
    blurb:
      'Search, tables, charts, diagrams, and pictures work directly on ordinary Markdown folders. Flow adds a better workspace, not a private file format.',
    proof: 'The file on disk stays ordinary Markdown that any editor can read.',
    pageTitle: 'Flow · Documents and files that stay yours · Orionfold',
    description:
      'Search, edit tables, draw charts and diagrams, and manage pictures directly in ordinary Markdown folders with Orionfold Flow for Mac.',
    chapters: [
      { id: 'tour-search', label: 'Search' },
      { id: 'tour-tables', label: 'Tables' },
      { id: 'tour-visualize', label: 'Charts and diagrams' },
      { id: 'tour-pictures', label: 'Pictures' },
      { id: 'tour-files', label: 'Your files' },
    ],
  },
  {
    slug: 'models-and-runtime',
    label: 'Models and runtime',
    title: 'Choose where AI runs. Every time.',
    blurb:
      'Keep work on your Mac, use models on your network, or route to cloud providers you trust. Flow shows the place, model, rule, and cost before the run.',
    proof: 'One named domain, model, deciding rule, and cost before every run.',
    pageTitle: 'Flow · Choose where AI runs · Orionfold',
    description:
      'Run AI on your Mac, network, or chosen cloud with Orionfold Flow. Its local runtime, explicit domains, and ordered rules keep every route visible.',
    chapters: [
      { id: 'tour-domains', label: 'Trust boundaries' },
      { id: 'tour-runtime', label: 'Owned local runtime' },
      { id: 'tour-routing', label: 'Smart Routing' },
      { id: 'tour-resources', label: 'What it is using' },
    ],
  },
  {
    slug: 'receipts',
    label: 'Receipts and evidence',
    title: 'Know what AI did. Keep the record.',
    blurb:
      'Every approved run records the model, location, cost, checks, evidence, and saved change. Benchmarks show how local models performed on your Mac before you choose.',
    proof: 'One run card bound to the exact document before and after the change.',
    pageTitle: 'Flow · Receipts and evidence for every AI run · Orionfold',
    description:
      'Inspect the model, route, cost, checks, evidence, and saved change for every approved Orionfold Flow run. Compare local models on your own Mac.',
    chapters: [
      { id: 'tour-receipts', label: 'Receipts' },
      { id: 'tour-benchmarks', label: 'Benchmarks' },
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
