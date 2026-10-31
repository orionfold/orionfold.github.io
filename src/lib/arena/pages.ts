// The Arena resource path, for the Paper PageNav under /arena/ (R7d retires
// ArenaSubNav). Notes and the SDK live on ainative.business.
export type ArenaPageKey = 'overview' | 'demo' | 'notes' | 'sdk' | 'models' | 'book' | 'receipts';

const PAGES: { key: ArenaPageKey; href: string; label: string }[] = [
  { key: 'overview', href: '/arena/', label: 'Overview' },
  { key: 'demo', href: '/arena/demo/', label: 'Demo' },
  { key: 'notes', href: 'https://ainative.business/field-notes/', label: 'Notes' },
  { key: 'sdk', href: 'https://ainative.business/fieldkit/', label: 'SDK' },
  { key: 'models', href: '/experts/', label: 'Models' },
  { key: 'book', href: '/books/ai-research-on-nvidia-dgx-spark/', label: 'Book' },
  { key: 'receipts', href: '/receipts/', label: 'Receipts' },
];

export const ARENA_PAGES = (current?: ArenaPageKey) =>
  PAGES.map(({ key, href, label }) => ({ href, label, current: key === current }));
