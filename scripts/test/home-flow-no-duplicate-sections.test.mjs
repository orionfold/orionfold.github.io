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
// Operator 2026-10-27: Canvas is shown on both pages on purpose.
const SHARED_ON_PURPOSE = new Set(['WowStat', 'FlowCanvasShowcase']);
// Paper frames (R4): a Panel or a Fold holds a section, it is not one. What sits
// inside each frame is still compared.
const PAPER_FRAMES = new Set(['Panel', 'Fold']);
const sections = (html) => new Set([...html.matchAll(/<([A-Z]\w+)[\s/>]/g)].map((m) => m[1]).filter((c) => !SHARED_ON_PURPOSE.has(c) && !PAPER_FRAMES.has(c)));
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
  // Paper R4: the on-page jumps live in the page's PageNav (was FlowNavigation).
  const page = read('src/pages/flow.astro');
  const onPage = page.slice(page.indexOf('onPage={['), page.indexOf(']} pages={['));
  assert.match(flow, /<FlowCanvasShowcase bare \/>/);
  assert.match(onPage, /'#flow-canvas'/);
  for (const gone of ['#flow-domains', '#agents-reviewed', '#import-publish', '#flow-elements']) assert.ok(!onPage.includes(`'${gone}'`), gone);
  for (const [, id] of onPage.matchAll(/href: '#([\w-]+)'/g)) assert.match(page + read('src/components/living/FlowPlans.astro'), new RegExp(`id(=|: )["'{]?${id}["'}]`), `#${id} exists on the page`);
});

test('the homepage keeps Elements and drops Agents and Import & Publish (operator 2026-10-27)', () => {
  // Paper R2 (operator 2026-10-30): Elements is now a rail of real Elements.
  assert.match(home, /<Rail label="Elements"/);
  assert.doesNotMatch(home, /<FlowAgentsReviewed|<FlowInOut/);
});

test('the homepage keeps its own Paths band (operator 2026-10-27), now a rail of every Path', () => {
  // Paper R2 (operator 2026-10-30): the prototype home has no Canvas band; whether
  // Canvas returns is the operator's call at the R2 preview.
  assert.match(home, /<Panel id="paths"[\s\S]*?<Rail label="Paths"/);
});
