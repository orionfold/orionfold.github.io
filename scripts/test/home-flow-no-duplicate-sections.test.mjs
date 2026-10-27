// Operator, 2026-10-27: "do not duplicate sections across home and flow - we
// have plenty of features and sections to spread evenly." The homepage and
// /flow/ never render the same section component or the same stat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const body = (p) => {
  const src = read(p);
  return src.slice(src.indexOf('<main'), src.indexOf('</main>'));
};
const sections = (html) => new Set([...html.matchAll(/<([A-Z]\w+)[\s/>]/g)].map((m) => m[1]).filter((c) => c !== 'WowStat'));
const stats = (html) => [...html.matchAll(/<WowStat ids=\{\[([^\]]*)\]/g)].flatMap((m) => m[1].match(/'[^']+'/g) ?? []);

const home = body('src/pages/index.astro');
const flow = body('src/pages/flow.astro');

test('the homepage and /flow/ share no section', () => {
  const shared = [...sections(home)].filter((c) => sections(flow).has(c));
  assert.deepEqual(shared, []);
});

test('the homepage and /flow/ share no stat', () => {
  const flowStats = new Set(stats(flow));
  assert.deepEqual(stats(home).filter((s) => flowStats.has(s)), []);
});

test('/flow/ links only to sections it has, and Canvas has one', () => {
  const nav = read('src/components/living/FlowNavigation.astro');
  const onPage = nav.slice(nav.indexOf('const onPage'), nav.indexOf('const pages'));
  assert.match(flow, /<FlowCanvasShowcase \/>/);
  assert.match(onPage, /'#flow-canvas'/);
  for (const gone of ['#flow-domains', '#agents-reviewed', '#import-publish', '#flow-elements']) assert.ok(!onPage.includes(`'${gone}'`), gone);
});

test('the homepage keeps Elements and drops Agents and Import & Publish (operator 2026-10-27)', () => {
  assert.match(home, /<FlowElementsShowcase id="home-elements" \/>/);
  assert.doesNotMatch(home, /<FlowAgentsReviewed|<FlowInOut/);
});
