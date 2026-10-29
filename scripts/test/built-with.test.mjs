// Built with Orionfold (operator 2026-10-28): founder walks and customer cases
// on the homepage are signed accounts with checkable links, never quotations.
// A walk is the founder's own; a case runs with the customer's approval,
// recorded in the planning changelog rather than on the page. The links point
// only at places this repository has verified (the launch story, the Domain
// folder, the Relay repository, DGH42's public pages).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const source = read('src/data/built-with.ts');
// The data file is TypeScript; read the entries through the built homepage and
// the source text rather than a runtime import.
const entries = [...source.matchAll(/\{\s*\n\s*id: '([^']+)',\s*\n\s*kind: '(walk|case)'[\s\S]*?\n  \},/g)].map((m) => ({ id: m[1], kind: m[2], text: m[0] }));

const VERIFIED_HOSTS = ['https://github.com/orionfold/', 'https://github.com/dgh42/', 'https://dgh42.com/'];

test('every entry is a walk or a case, signed, dated, and linked to checkable places', () => {
  assert.ok(entries.length >= 2, 'the founder walk and the DGH42 case');
  for (const entry of entries) {
    for (const field of ['when', 'title', 'body', 'who', 'role', 'href', 'hrefLabel']) assert.match(entry.text, new RegExp(`\\n\\s*${field}: '`), `${entry.id} has ${field}`);
    const facts = [...entry.text.matchAll(/href: '([^']+)'/g)].map((m) => m[1]);
    assert.ok(facts.length >= 2, `${entry.id} links to more than one place`);
    for (const href of facts) {
      assert.ok(href.startsWith('/') || VERIFIED_HOSTS.some((h) => href.startsWith(h)), `${entry.id} links only to verified places: ${href}`);
    }
    if (entry.kind === 'walk') assert.match(entry.text, /who: 'Manav Sehgal'/, 'a walk is the founder’s own account');
  }
});

test('no entry is a quotation, and the DGH42 case keeps the approved facts', () => {
  const bodies = [...source.matchAll(/body: '([^']*)'/g)].map((m) => m[1]);
  for (const body of bodies) {
    assert.doesNotMatch(body, /[“”"]/, 'no quotation marks: these are accounts, not testimonials');
    assert.doesNotMatch(body, /—/, 'no em-dashes');
  }
  assert.match(source, /https:\/\/github\.com\/orionfold\/relay'/, 'Relay is the open-source foundation');
  assert.match(source, /https:\/\/dgh42\.com\/beneFACT/);
  assert.match(source, /Flow is designed to make this path easier for subject matter experts\./, 'the case carries the approved Flow connection');
  assert.doesNotMatch(source, /shipped the next day/, 'operator 2026-10-28 18:36: the next-day line is out');
  assert.doesNotMatch(source, /take rate|marketplace|revenue|paying customers|100\+/i, 'nothing from the private packet beyond the approved public facts');
  assert.match(source, /'\$0 extra API spend'/);
  assert.match(source, /'About 3 hours'/);
  assert.match(source, /'6 files, 75 KB'/);
});

test('the launch story still carries the numbers the walk links to', () => {
  const story = read('src/content/domains/ai-consulting.md');
  assert.match(story, /^## The numbers$/m, 'the anchor #the-numbers exists');
  assert.match(story, /about 3 hours/);
  assert.match(story, /\$0, every run on the Claude subscription/);
  assert.match(story, /6 Markdown files, 75 KB/);
});

test('the built homepage renders the band after Domains with both cards, and /flow/ does not', () => {
  const home = new URL('dist/index.html', root);
  if (!existsSync(home)) { test.skip('dist/ not built'); return; }
  const html = readFileSync(home, 'utf8');
  assert.match(html, /id="home-built-with"/);
  assert.ok(html.indexOf('id="home-domains"') < html.indexOf('id="home-built-with"'), 'the band follows the Domains band');
  assert.ok(html.indexOf('id="home-built-with"') < html.indexOf('id="home-elements"'), 'and precedes Elements');
  for (const entry of entries) assert.match(html, new RegExp(`id="home-built-with-${entry.id}"`));
  assert.doesNotMatch(html, /approval/, 'operator 2026-10-28 18:39: the approval is recorded in the ledger, not on the page');
  assert.match(html, /Founder walk/); assert.match(html, /Customer case/);
  const flow = readFileSync(new URL('dist/flow/index.html', root), 'utf8');
  assert.doesNotMatch(flow, /built-with/);
});
