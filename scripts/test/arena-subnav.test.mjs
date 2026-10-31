import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(
  new URL(`../../${relativePath}`, import.meta.url),
  'utf8',
);

// R7d: the Arena resource path moved from ArenaSubNav to the Paper PageNav.
const pages = read('src/lib/arena/pages.ts');
const page = read('src/pages/arena.astro');

const slots = [...pages.matchAll(/\{ key: '([^']+)', href: '([^']+)', label: '([^']+)' \}/g)]
  .map(([, key, href, label]) => ({ key, label, href }));

assert.deepEqual(slots, [
  { key: 'overview', label: 'Overview', href: '/arena/' },
  { key: 'demo', label: 'Demo', href: '/arena/demo/' },
  { key: 'notes', label: 'Notes', href: 'https://ainative.business/field-notes/' },
  { key: 'sdk', label: 'SDK', href: 'https://ainative.business/fieldkit/' },
  { key: 'models', label: 'Models', href: '/experts/' },
  { key: 'book', label: 'Book', href: '/books/ai-research-on-nvidia-dgx-spark/' },
  { key: 'receipts', label: 'Receipts', href: '/receipts/' },
]);

assert.match(pages, /current: key === current/);
assert.match(page, /import \{ ARENA_PAGES \} from '\.\.\/lib\/arena\/pages'/);
assert.match(page, /<PageNav label="Arena product navigation"[\s\S]*pages=\{ARENA_PAGES\('overview'\)\}/);
assert.doesNotMatch(page, /ArenaSubNav/);

console.log('arena subnav: the Paper PageNav exposes the complete Arena resource path');
