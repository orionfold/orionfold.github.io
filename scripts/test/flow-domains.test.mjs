// Flow Domains (/domains/): the Flow 3.0 launch surface and its launch story,
// written by the website lane from the product lane's AI Consulting
// journals and shots (operator 2026-10-27). The landing follows the Flow 3.0
// PR/FAQ's limits: no per-Domain fee (Pro plus the Publish add-on), publishing brings no customers
// by itself, Flow MCP is described as it works, from its changelog.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = (rel) => readFileSync(new URL(rel, root), 'utf8');
const built = (route) => read(`dist${route}index.html`);
const hasDist = existsSync(new URL('dist/domains/index.html', root));
// G-135: the blueprints, in the site's order after the launch story (the
// PR/FAQ's ranks 2 to 5, then the ten researched fields of G-138), read from
// the collection so a new blueprint is guarded the day it lands.
const front = (md) => md.match(/^---\n([\s\S]*?)\n---\n/)[1];
const BLUEPRINTS = readdirSync(new URL('src/content/domains/', root))
  .filter((f) => f.endsWith('.md') && /^kind: blueprint$/m.test(front(read(`src/content/domains/${f}`))))
  .map((f) => f.replace(/\.md$/, ''))
  .sort((a, b) => Number(front(read(`src/content/domains/${a}.md`)).match(/^order: (\d+)$/m)[1]) - Number(front(read(`src/content/domains/${b}.md`)).match(/^order: (\d+)$/m)[1]));
const FIRST_FOUR = ['learning-design', 'research-synthesis', 'finance-advisory', 'accounting-advisory'];
const PRIVATE = /DGH42|Harun|BeneFACT|Boardy|take rate|marketplace for Domains|Batista|Hardman|Stevens|Hopper|Marasigan/i;

test('the launch story is written for Flow 3.0 from the walk, with every shot on disk and every number labelled', () => {
  const md = read('src/content/domains/ai-consulting.md');
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
  assert.ok(existsSync(new URL('src/assets/flow/domains/ai-consulting/card.jpg', root)), 'the OG card has a jpg, not a webp');
});

test('the blueprints invite an expert to build, on public signals only, and never claim a walk', () => {
  assert.ok(BLUEPRINTS.length >= 4, 'at least the first four');
  assert.deepEqual(BLUEPRINTS.slice(0, 4), FIRST_FOUR, 'the PR/FAQ ranks lead');
  for (const [i, slug] of BLUEPRINTS.entries()) {
    const md = read(`src/content/domains/${slug}.md`);
    const [, front, body] = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    assert.match(front, /^kind: blueprint$/m, `${slug} is a blueprint`);
    assert.match(front, /^release: "3\.0"$/m);
    assert.match(front, new RegExp(`^order: ${i + 2}$`, 'm'), `${slug} sits at rank ${i + 2}`);
    for (const k of ['walked', 'repo', 'files', 'size', 'licence']) assert.doesNotMatch(front, new RegExp(`^${k}:`, 'm'), `${slug}: a blueprint has no ${k}`);
    assert.ok((front.match(/^  - (n: |name: )/gm) ?? []).length >= 5, `${slug} plans its documents`);
    assert.doesNotMatch(md, /—/, 'no em-dashes');
    assert.doesNotMatch(md, PRIVATE, `${slug}: nothing from the private PR/FAQ`);
    assert.match(body, /It is not built\. \[AI Consulting\]\(\/domains\/ai-consulting\/\) is a Domain that exists today/, `${slug} says so up front`);
    assert.doesNotMatch(body, /Only one Domain exists/, `${slug}: more than one Domain is built (2026-10-29)`);
    assert.doesNotMatch(body, /\| (verified|derived):/, `${slug}: no walk numbers`);
    assert.doesNotMatch(body, /\b(we|I) built\b|was built in Flow|walked end to end/i, `${slug}: no built claim`);
    // Every market signal carries a public, dated, linked source and the day it was checked.
    const table = body.slice(body.indexOf('## The signals'), body.indexOf('## What your Domain holds'));
    const rows = table.split('\n').filter((l) => /^\| (?!Figure|---)/.test(l));
    assert.ok(rows.length >= 6, `${slug}: at least six signals`);
    for (const r of rows) assert.match(r, /\| source: \[[^\]]+\]\(https?:\/\/[^)]+\),( published \d{4}(-\d{2}(-\d{2})?)?,)? checked 2026-\d{2}-\d{2} \|$/, `labelled and dated: ${r.slice(0, 70)}`);
    assert.match(body, /help\.openai\.com\/en\/articles\/20001519/, `${slug}: the forcing event, with its source`);
    // The walkthrough is the AI Consulting story, linked at the hands-on steps.
    assert.ok((body.match(/\/domains\/ai-consulting\/#/g) ?? []).length >= 4, `${slug} points at the walkthrough's steps`);
    // Pricing stays the guarded truth; the reused shots are captioned as the Domain they show.
    assert.match(body, /Bringing any Domain into Flow is free on Base\./);
    assert.match(body, /Publishing to GitHub needs the Publish add-on too/);
    assert.match(body, /There is no fee per Domain/);
    assert.match(body, /Publishing does not bring clients on its own\./);
    for (const m of body.matchAll(/!\[([^\]]*)\]\((\.\.\/\.\.\/assets\/flow\/domains\/[^)]+)\)/g)) {
      assert.ok(existsSync(new URL(`src/content/domains/${m[2]}`, root)), `${m[2]} exists`);
      assert.match(m[1], /Shown on AI Consulting/, `${slug}: a reused shot says which Domain it shows`);
    }
    assert.ok(existsSync(new URL(`src/assets/flow/domains/${slug}/card.jpg`, root)), `${slug} has a card.jpg for the OG pipeline`);
    // G-138: a blueprint is given away to the expert, speaks their field,
    // maps Flow 3.0 features to their work, and carries what search and
    // answer engines need (keywords, the questions experts ask, the mock script).
    assert.match(body, /## What Flow does for this work/, `${slug} maps features to the work`);
    assert.ok((body.match(/^\*\*[^*]+\*\* /gm) ?? []).length >= 10, `${slug}: bold-led paragraphs for documents and features`);
    assert.ok((front.match(/^keywords: \[.{40,}\]$/m)), `${slug}: keywords for search`);
    assert.ok((front.match(/^  - q: /gm) ?? []).length >= 4, `${slug}: the questions experts ask`);
    assert.match(front, /^mock:\n  folder: /m, `${slug}: a mock script`);
    assert.ok((front.match(/^    - title: /gm) ?? []).length >= 5, `${slug}: the mock plays at least five steps`);
    assert.match(body, /yours to take|build it, put your name on it|launch it as your/i, `${slug}: given away to the expert`);
  }
  const schema = read('src/content.config.ts');
  assert.match(schema, /kind: z\.enum\(\['launch', 'blueprint'\]\)/);
  assert.match(schema, /a blueprint has no \$\{k\}; nothing was built or walked/);
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
  for (const rel of ['src/pages/domains/[slug].astro', 'src/content/domains/ai-consulting.md', 'src/content/compare/custom-gpts.md', 'public/llms.txt', 'src/components/flow/FlowDomainsBand.astro']) {
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
  assert.ok(land.includes('href="/domains/ai-consulting/"'));
  assert.ok(land.includes('href="https://github.com/orionfold/flow/tree/main/flow-domains/ai-consulting-starter"'));
  assert.match(land, /"@type":"FAQPage"/);
  // Operator 2026-10-27: How it moves became the homepage's Flow Domains band.
  assert.match(land, /data-dp/, 'the Domain payload band');
  assert.doesNotMatch(land, /data-dj-go=/);
  const story = built('/domains/ai-consulting/');
  assert.match(story, /"@type":"Article"/);
  assert.ok(story.includes('href="/domains/"'));
  assert.equal((story.match(/<article[\s\S]*?<\/article>/)[0].match(/<img [^>]*alt="[^"]+"/g) ?? []).length, 14, 'the walk’s fourteen shots, each described');
  assert.match(read('src/components/Nav.astro'), /\{ href: '\/flow\/', label: 'Flow' \},\n  \{ href: '\/domains\/', label: 'Domains', children: domains, all: 'All Domains' \},/);
  assert.match(read('src/components/Footer.astro'), /href: '\/domains\/', label: 'Domains'/);
  assert.match(read('public/llms.txt'), /## Flow Domains/);
  // G-135: the Domains menu lists the five in the site's order, then All Domains;
  // the landing features the launch story and cards the four blueprints.
  const menu = land.match(/<div class="living-nav-dd">\s*<a[^>]*href="\/domains\/"[\s\S]*?living-nav-dd-all[^>]*>[^<]*/)[0];
  assert.deepEqual([...menu.matchAll(/<b>([^<]+)<\/b>/g)].map((m) => m[1]), ['AI Consulting', 'Anthropic S-1 Analyst', 'Learning Design', 'Research Synthesis', 'Finance Advisory'], 'the menu keeps the top five: the built Domains, then the blueprints; the rest are on /domains/');
  assert.match(menu, /living-nav-dd-all[^>]*>All Domains/);
  const cards = land.match(/<ul class="dm-cards">[\s\S]*?<\/ul>/)[0];
  for (const slug of BLUEPRINTS) assert.ok(cards.includes(`href="/domains/${slug}/"`), `${slug} is a card`);
  assert.doesNotMatch(cards, /ai-consulting|anthropic-s1-analyst/, 'the built Domains are not blueprint cards');
  // Operator 2026-10-29: the founder's built Domains get their own section, launch story first.
  const founders = land.match(/<ul class="dm-founders">[\s\S]*?<\/ul>/)[0];
  const order = [...founders.matchAll(/<b><a href="\/domains\/([^/]+)\/">/g)].map((m) => m[1]);
  assert.deepEqual(order, ['ai-consulting', 'anthropic-s1-analyst'], 'both built Domains, the launch story first');
  assert.ok(founders.includes('href="https://github.com/orionfold/flow/tree/main/flow-domains/anthropic-s1-analyst"'));
  const s1 = built('/domains/anthropic-s1-analyst/');
  assert.match(s1, /· A FOUNDER DOMAIN</);
  assert.match(s1, /nothing in it is investment advice/, 'the body says it is not investment advice');
  assert.match(s1, /<dt>Hands-on time<\/dt><dd>About 3 hours, in one afternoon<\/dd>/, 'its own walk facts, not the launch story\'s');
  for (const slug of BLUEPRINTS) {
    const page = built(`/domains/${slug}/`);
    assert.match(page, /· A BLUEPRINT</, `${slug} is headed as a blueprint`);
    assert.doesNotMatch(page, /<title>[^<]*built in Flow/, `${slug}: the title never says the Domain was built`);
    assert.match(page, /<title>[^<]*blueprint[^<]*<\/title>/i, `${slug}: the title says blueprint`);
    assert.match(page, /class="da da--blueprint"/, `${slug}: the hero is the planned folder, drawn`);
    assert.match(page, /<dt>Status<\/dt><dd>A blueprint\. Not built yet\.<\/dd>/);
    assert.doesNotMatch(page.match(/<header[\s\S]*?<\/header>/)[0], /github\.com\/orionfold/, `${slug}: no repository link, nothing is published`);
    assert.match(read('public/llms.txt'), new RegExp(`orionfold\\.com/domains/${slug}/`), `${slug} is in llms.txt`);
    assert.match(read('dist/sitemap-0.xml'), new RegExp(`/domains/${slug}/</loc><lastmod>2026-`), `${slug} is in the sitemap with a real lastmod`);
    assert.match(page, /"@type":"FAQPage"/, `${slug}: the questions experts ask are a FAQPage`);
    assert.match(page, /"keywords":"/, `${slug}: keywords in the Article JSON-LD`);
    assert.match(page, /class="hs dmk" data-story/, `${slug}: the Domain on a client job, drawn`);
    assert.match(page, /Questions experts ask/);
  }
});
