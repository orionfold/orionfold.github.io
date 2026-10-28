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
  assert.match(page, /Write your method once\.<br \/><em>Every client gets the living version\.<\/em>/, 'the H1 is the plain promise (review 2026-10-28, G6)');
  assert.match(page, /Easily co-author with any AI once, one-click publish as AI system everywhere\./, 'the operator’s selected line stays, word for word, as the tagline');
  // Why now (review 2026-10-28, A1): the forcing event with its dated source.
  assert.match(page, /WHY NOW/);
  assert.match(page, /December 11, 2026/);
  assert.ok(page.includes('href="/flow/compare/custom-gpts/"'), 'the why-now block links the Compare page');
  assert.match(page, /help\.openai\.com\/en\/articles\/20001519/, 'with its source');
  // Pricing follows the product: New from GitHub is ungated (0284), Chat needs Pro (DR-023).
  assert.match(page, /Bringing a Domain in is free on Base\. Chat on it, and the door for your own agents, need Flow Pro\./);
  assert.doesNotMatch(page, /Import add-on/, 'no Import add-on claim on a Domain pull');
  assert.match(page, /The door is open only while Flow is, and it needs Flow Pro\./, 'the agents door is Pro (operator 2026-10-28)');
  assert.match(page, /the door for your own agents, need Flow Pro/, 'and the FAQ says so');
  // Review 2026-10-28: A5 one email, four PULL fields; A6 two day headers; G5 one reader plus two.
  assert.match(page, /href=\{TALK\}/);
  assert.match(page, /mailto:manav@orionfold\.com\?subject=/);
  for (const f of ['The client job I would build a Domain for', 'When it is due', 'What I use for it today', 'What gets in the way']) assert.ok(page.includes(f), f);
  assert.match(page, /day: 'Day 1 · October 25'/);
  assert.match(page, /day: 'Day 2 · October 26'/);
  const roles = page.match(/const ROLES = \[([^\]]+)\]/)[1].split(',').length;
  assert.equal(roles, 3, 'the first buyer and two adjacent roles');
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

test('every surface prices a Domain the way the product gates it', () => {
  for (const rel of ['src/pages/domains/[slug].astro', 'src/content/domains/ai-consulting-starter.md', 'src/content/compare/custom-gpts.md', 'public/llms.txt', 'src/components/flow/FlowDomainsBand.astro']) {
    const text = read(rel);
    assert.doesNotMatch(text, /bring\w* (a Domain|one) in needs/i, `${rel}: a pull is free on Base`);
    assert.doesNotMatch(text, /Domain in needs Flow Pro and the Import/i, rel);
  }
  assert.match(read('src/content/compare/custom-gpts.md'), /Publishing a Domain needs Flow Pro and the Publish add-on/);
  assert.match(read('src/data/flow-pricing.ts'), /a Domain to a GitHub repository/, 'the Publish add-on names the Domain route');
  const plans = read('src/components/living/FlowPlans.astro');
  assert.match(plans, /any Domain you bring in from GitHub/, 'Base lists the pull');
  assert.match(plans, /Chat on a folder or a Domain/, 'Pro lists Chat on a Domain');
  assert.match(plans, /The door for your own agents in Terminal/, 'Pro lists the agents door (operator 2026-10-28)');
  assert.match(read('public/llms.txt'), /Your agents, a Flow Pro feature/);
  assert.match(read('src/components/flow/domains/DomainPayload.astro'), /setTimeout\(reveal, 1500\)/, 'the payload figure never stays blank (A4)');
});

test('the built pages link the Domain, the story and each other, and the nav leads with Domains', { skip: !hasDist }, () => {
  const land = built('/domains/');
  assert.ok(land.includes('href="/domains/ai-consulting-starter/"'));
  assert.ok(land.includes('href="https://github.com/orionfold/flow/tree/main/flow-domains/ai-consulting-starter"'));
  assert.match(land, /"@type":"FAQPage"/);
  // Operator 2026-10-27: How it moves became the homepage's Flow Domains band.
  assert.match(land, /data-dp/, 'the Domain payload band');
  assert.doesNotMatch(land, /data-dj-go=/);
  const story = built('/domains/ai-consulting-starter/');
  assert.match(story, /"@type":"Article"/);
  assert.ok(story.includes('href="/domains/"'));
  assert.equal((story.match(/<article[\s\S]*?<\/article>/)[0].match(/<img [^>]*alt="[^"]+"/g) ?? []).length, 14, 'the walk’s fourteen shots, each described');
  assert.match(read('src/components/Nav.astro'), /\{ href: '\/flow\/', label: 'Flow' \},\n  \{ href: '\/domains\/', label: 'Domains' \},/);
  assert.match(read('src/components/Footer.astro'), /href: '\/domains\/', label: 'Domains'/);
  assert.match(read('public/llms.txt'), /## Flow Domains/);
});
