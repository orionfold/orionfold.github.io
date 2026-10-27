// Flow Domains (/domains/): the Flow 3.0 launch surface and its launch story,
// written by the website lane from the product lane's AI Consulting Starter
// journals and shots (operator 2026-10-27). The landing follows the Flow 3.0
// PR/FAQ's limits: no per-Domain fee (Pro plus the Publish add-on), publishing brings no customers
// by itself, Flow MCP is described as it works, from its changelog.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = (rel) => readFileSync(new URL(rel, root), 'utf8');
const built = (route) => read(`dist${route}index.html`);
const hasDist = existsSync(new URL('dist/domains/index.html', root));

test('the launch story is written for Flow 3.0 from the walk, with every shot on disk and every number labelled', () => {
  const md = read('src/content/domains/ai-consulting-starter.md');
  assert.match(md, /^release: "3\.0"$/m);
  assert.match(md, /^repo: https:\/\/github\.com\/orionfold\/flow\/tree\/main\/flow-domains\/ai-consulting-starter$/m);
  assert.doesNotMatch(md, /—/, 'no em-dashes');
  for (const m of md.matchAll(/\]\((\.\.\/\.\.\/assets\/flow\/domains\/[^)]+)\)/g)) {
    assert.ok(existsSync(new URL(`src/content/domains/${m[1]}`, root)), `${m[1]} exists`);
  }
  const table = md.slice(md.indexOf('## The numbers'));
  const rows = table.split('\n').filter((l) => /^\| (?!Figure|---)/.test(l));
  assert.ok(rows.length >= 10);
  for (const r of rows) assert.match(r, /\| (verified|derived):/, `labelled: ${r.slice(0, 60)}`);
  for (const fact of ['788', '49 links', '14 public pages', '1,624 words', '6 files sent', 'No licence stated', 'CC BY 4.0', '$0']) assert.ok(md.includes(fact), fact);
  assert.ok(existsSync(new URL('src/assets/flow/domains/ai-consulting-starter/card.jpg', root)), 'the OG card has a jpg, not a webp');
});

test('the landing keeps the PR/FAQ’s promises and limits', () => {
  const page = read('src/pages/domains/index.astro');
  assert.match(page, /Easily co-author with any AI once,<br \/><em>one-click publish as AI system everywhere\.<\/em>/, 'the operator’s selected headline, word for word');
  assert.match(page, /No fee per Domain/);
  assert.match(page, /Flow Pro and the Publish add-on/, 'publishing needs Pro plus Publish (operator, 2026-10-27)');
  assert.doesNotMatch(page, /Publishing is part of your Flow subscription/, 'Pro alone does not cover publishing');
  assert.match(page, /Flow does not promise leads or revenue/);
  assert.match(page, /FLOW MCP · YOUR AGENTS/);
  assert.match(page, /Settings ▸ General ▸ Your agents/, 'Flow MCP is named where it lives');
  assert.doesNotMatch(page, /building Flow MCP|COMING NEXT/i, 'Flow MCP is code complete (2026-10-27), not next');
  assert.doesNotMatch(page, /DGH42|Harun|BeneFACT|take rate|marketplace/i, 'nothing private from the PR/FAQ');
  assert.doesNotMatch(page, /—/, 'no em-dashes');
});

test('the built pages link the Domain, the story and each other, and the nav leads with Domains', { skip: !hasDist }, () => {
  const land = built('/domains/');
  assert.ok(land.includes('href="/domains/ai-consulting-starter/"'));
  assert.ok(land.includes('href="https://github.com/orionfold/flow/tree/main/flow-domains/ai-consulting-starter"'));
  assert.match(land, /"@type":"FAQPage"/);
  assert.equal((land.match(/data-dj-go=/g) ?? []).length, 4, 'four journey steps');
  const story = built('/domains/ai-consulting-starter/');
  assert.match(story, /"@type":"Article"/);
  assert.ok(story.includes('href="/domains/"'));
  assert.equal((story.match(/<article[\s\S]*?<\/article>/)[0].match(/<img [^>]*alt="[^"]+"/g) ?? []).length, 14, 'the walk’s fourteen shots, each described');
  assert.match(read('src/components/Nav.astro'), /\{ href: '\/flow\/', label: 'Flow' \},\n  \{ href: '\/domains\/', label: 'Domains' \},/);
  assert.match(read('src/components/Footer.astro'), /href: '\/domains\/', label: 'Domains'/);
  assert.match(read('public/llms.txt'), /## Flow Domains/);
});
