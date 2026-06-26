// Proof / "Receipts" SSOT. Feeds the /proof/ page and the CapabilityMatrix
// component. Every claim here is repurposed from the internal field notes and
// model report cards, rewritten to the site voice (grade 3-5, jargon explained,
// no em-dashes; website-copy-style). The honest caveats stay in on purpose: they
// are the credibility tax that makes the rest believable (receipt-honesty rule).
//
// Receipt ethos: each row points at a public page where the work can be checked,
// and every star (proved on a locked test) deep-links to the model that earned it.

export type Mark = 'star' | 'strong' | 'maybe' | 'none';

export interface MatrixCol {
  key: string;
  label: string;
  /** Small caption under the column head, e.g. "4B · ours". */
  sub: string;
  /** Our own house model (true) vs a popular base model shown for comparison (false). */
  ours: boolean;
  /** Public home for the model (column head links here). */
  href?: string;
}

export interface MatrixCell {
  mark: Mark;
  /** A star cell links to the public page that carries its frozen test. */
  href?: string;
}

export interface MatrixRow {
  capability: string;
  /** Cells in the same order as `cols`. */
  cells: MatrixCell[];
}

// The columns: our three house models first, then three popular open base
// models for scale. Advisor ships as software (governed local advisor); Kepler
// and Patent ship as models.
export const cols: MatrixCol[] = [
  { key: 'advisor', label: 'Advisor', sub: '4B · ours', ours: true, href: '/software/advisor/' },
  { key: 'kepler', label: 'Kepler', sub: '8B · ours', ours: true, href: '/models/kepler/' },
  { key: 'patent', label: 'Patent', sub: '8B · ours', ours: true, href: '/models/patent-strategist/' },
  { key: 'qwen', label: 'Qwen3', sub: '8B · base', ours: false },
  { key: 'llama', label: 'Llama 3.3', sub: '70B · base', ours: false },
  { key: 'deepseek', label: 'DeepSeek-R1', sub: 'base', ours: false },
];

// Proven = the product appears as one of our own (ours:true) columns in the
// matrix above, i.e. it earned a star anyone can rerun. Drives the Proof CTA
// band on its detail page (A4). Books are never part of the proof story.
export function isProvenProduct(type: 'software' | 'model' | 'book', slug: string): boolean {
  if (type === 'book') return false;
  const base = type === 'software' ? 'software' : 'models';
  const path = `/${base}/${slug}/`;
  return cols.some((c) => c.ours && c.href === path);
}

// How to read a mark:
//   star   = we proved it on a locked test, and you can rerun it
//   strong = yes, strong
//   maybe  = possible, but not guaranteed
//   none   = not built for this
// Base-model marks are general, vendor-documented capability, NOT our
// measurement. Only the star cells (ours) come with a frozen test anyone can rerun.
const A = '/software/advisor/';
const K = '/models/kepler/';
const P = '/models/patent-strategist/';

export const matrix: MatrixRow[] = [
  {
    capability: 'Runs offline on a desk box',
    cells: [{ mark: 'strong' }, { mark: 'strong' }, { mark: 'strong' }, { mark: 'strong' }, { mark: 'maybe' }, { mark: 'maybe' }],
  },
  {
    capability: 'Answers from your own documents',
    cells: [{ mark: 'star', href: A }, { mark: 'none' }, { mark: 'maybe' }, { mark: 'maybe' }, { mark: 'maybe' }, { mark: 'maybe' }],
  },
  {
    capability: 'Gives exact source citations',
    cells: [{ mark: 'star', href: A }, { mark: 'none' }, { mark: 'star', href: P }, { mark: 'maybe' }, { mark: 'maybe' }, { mark: 'maybe' }],
  },
  {
    capability: 'Refuses cleanly, no made-up answers',
    cells: [{ mark: 'star', href: A }, { mark: 'none' }, { mark: 'maybe' }, { mark: 'maybe' }, { mark: 'maybe' }, { mark: 'maybe' }],
  },
  {
    capability: 'Calls tools, takes actions',
    cells: [{ mark: 'maybe' }, { mark: 'none' }, { mark: 'none' }, { mark: 'strong' }, { mark: 'strong' }, { mark: 'strong' }],
  },
  {
    capability: 'Shows step-by-step reasoning',
    cells: [{ mark: 'none' }, { mark: 'star', href: K }, { mark: 'star', href: P }, { mark: 'maybe' }, { mark: 'none' }, { mark: 'strong' }],
  },
  {
    capability: 'Returns one checkable number',
    cells: [{ mark: 'none' }, { mark: 'star', href: K }, { mark: 'none' }, { mark: 'maybe' }, { mark: 'maybe' }, { mark: 'maybe' }],
  },
  {
    capability: 'Checks its own memory quality',
    cells: [{ mark: 'star', href: A }, { mark: 'none' }, { mark: 'none' }, { mark: 'none' }, { mark: 'none' }, { mark: 'none' }],
  },
];

// The speed table. The WOW is the dead heat on raw typing speed from a model on
// your own desk, next to the big hosted ones. The caveat below is the honest part.
export interface SpeedRow {
  model: string;
  where: string;
  /** Words per second. */
  wps: string;
  ours?: boolean;
}

export const speedRows: SpeedRow[] = [
  { model: 'Our Advisor (4B)', where: 'your own desk, fully private', wps: '~70', ours: true },
  { model: 'DeepSeek V4 Pro', where: 'hosted in the cloud', wps: '78.6' },
  { model: 'Claude Opus 4.7', where: 'hosted in the cloud', wps: '50.9' },
  { model: 'GPT-5.4', where: 'hosted in the cloud', wps: '166.8' },
];

export const speedCaveat =
  'Straight talk: those big hosted models are far smarter than our small one, and some speed-chip services are faster still. The WOW is the dead heat on raw typing speed from a model on your own desk that never sends your data out.';

// The headline receipts. Each pairs our number with the world it beats, and
// points at a public page where the work lives.
export interface Receipt {
  metric: string;
  label: string;
  body: string;
  href: string;
}

export const receipts: Receipt[] = [
  {
    metric: '2 cents',
    label: 'An overnight lab',
    body:
      'Our desk box ran 50 AI experiments by itself in 73 minutes, on about 2 cents of electricity. The same loop on rented cloud chips runs to dollars, plus a fee for every word. And ours never sends your data out.',
    href: '/dgx-spark/',
  },
  {
    metric: '4B beats 30B',
    label: 'Small out-trusts big',
    body:
      'On a hard locked test, our 4B Advisor scored 18 of 21. A model eight times bigger scored 8 of 21 and made up 3 fake answers. Advisor refused all 9 trick questions and leaked zero secrets.',
    href: '/software/advisor/',
  },
  {
    metric: '76% faster',
    label: 'Same model, same chip',
    body:
      'A special 4-bit mode made the same model run 76% faster, 38.8 words a second up from 22.1, on a fraction of the memory. Less memory means more room for everything else on the one box.',
    href: '/dgx-spark/',
  },
  {
    metric: '$1 guards $1,679',
    label: 'A cheap wind tunnel',
    body:
      'Before booking a big cloud training run, we test the design on the desk first. A $1 test on the box gates about $1,679 of expected loss. One wrong booking it stops pays for the whole box.',
    href: '/dgx-spark/',
  },
];

// Contrarian takes. Each is a thing people assume, next to the receipt that
// proves it wrong.
export interface Myth {
  claim: string;
  bust: string;
}

export const myths: Myth[] = [
  {
    claim: 'Real AI needs the cloud.',
    bust: 'We ran 50 experiments overnight for 2 cents, all on a desk.',
  },
  {
    claim: 'Failure is expensive, so play it safe.',
    bust: 'On the box, a failed try costs a fraction of a penny. So we let the machine fail 42 times out of 50, on purpose.',
  },
  {
    claim: 'Better answers come from a smarter model.',
    bust: 'Our biggest jump came from the ranker, which notes to read first, not the model. Answer quality went from 3.30 to 4.27 out of 5.',
  },
  {
    claim: "A small box can't beat a managed service.",
    bust: 'Dropping to a 4-bit mode made our box 76% faster than the convenient default.',
  },
  {
    claim: 'Bigger models are always safer to trust.',
    bust: 'Our 4B out-trusts a 30B, 18 of 21 versus 8 of 21, and only the big one made up answers.',
  },
];
