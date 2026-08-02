import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(
  new URL(`../../${relativePath}`, import.meta.url),
  'utf8',
);

const subnav = read('src/components/arena/ArenaSubNav.astro');
const page = read('src/pages/arena.astro');

const slots = [...subnav.matchAll(/\{ key: '([^']+)', label: '([^']+)', href: '([^']+)', live: true \}/g)]
  .map(([, key, label, href]) => ({ key, label, href }));

assert.deepEqual(slots, [
  { key: 'overview', label: 'Overview', href: '/arena/' },
  { key: 'demo', label: 'Demo', href: '/arena/demo/' },
  { key: 'notes', label: 'Notes', href: 'https://ainative.business/field-notes/' },
  { key: 'sdk', label: 'SDK', href: 'https://ainative.business/fieldkit/' },
  { key: 'models', label: 'Models', href: '/experts/' },
  { key: 'book', label: 'Book', href: '/books/ai-research-on-nvidia-dgx-spark/' },
  { key: 'receipts', label: 'Receipts', href: '/receipts/' },
]);

assert.match(subnav, /<nav aria-label="Arena sections"/);
assert.match(subnav, /aria-current=\{isActive \? 'page' : undefined\}/);
assert.match(subnav, /flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2/);
assert.match(subnav, /margin-top: 7rem/);
assert.match(subnav, /@media \(min-width: 640px\)[\s\S]*margin-top: 8rem/);
assert.match(subnav, /font-size: 0\.72rem/);
assert.match(subnav, /bottom: -0\.85rem/);

assert.match(page, /import ArenaSubNav from '\.\.\/components\/arena\/ArenaSubNav\.astro'/);
assert.match(page, /<Nav \/>\s*<ArenaSubNav active="overview" \/>\s*<main class="-mt-20 sm:-mt-24">/);

console.log('arena subnav: Relay-style rail exposes the complete Arena resource path');
