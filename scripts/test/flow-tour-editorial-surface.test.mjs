import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const copyOnly = (source) => source
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/^\s*\/\/.*$/gm, ' ');

const categories = read('src/data/flow-categories.ts');
const shell = read('src/components/flow/FlowCategoryPage.astro');
const tour = read('src/pages/flow/tour.astro');
const og = read('src/data/og.ts');
const routes = {
  writing: read('src/pages/flow/writing-with-ai.astro'),
  documents: read('src/pages/flow/documents-and-files.astro'),
  models: read('src/pages/flow/models-and-runtime.astro'),
  receipts: read('src/pages/flow/receipts.astro'),
  enterprise: read('src/pages/flow/enterprise.astro'),
};

const order = ['writing-with-ai', 'documents-and-files', 'models-and-runtime', 'receipts'];
const positions = order.map((slug) => categories.indexOf(`slug: '${slug}'`));
assert.ok(positions.every((position) => position >= 0), 'all four tour jobs stay registered');
assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'tour order follows work: write, files, models, record');

const jobs = [
  ['writing-with-ai', 'Write with AI. Keep the final word.', 'Before and after bytes. One human review gate. Nothing saved without approval.'],
  ['documents-and-files', 'Do more with your files. Keep them yours.', 'The file on disk stays ordinary Markdown that any editor can read.'],
  ['models-and-runtime', 'Choose where AI runs. Every time.', 'One named domain, model, deciding rule, and cost before every run.'],
  ['receipts', 'Know what AI did. Keep the record.', 'One run card bound to the exact document before and after the change.'],
];
for (const [slug, title, proof] of jobs) {
  const start = categories.indexOf(`slug: '${slug}'`);
  const next = categories.indexOf('\n  {', start + 1);
  const block = categories.slice(start, next < 0 ? categories.length : next);
  assert.match(block, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${slug} owns one concise H1`);
  assert.match(block, new RegExp(proof.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${slug} names one proof pattern`);
  assert.match(block, /pageTitle:/, `${slug} owns search-facing title copy`);
  assert.match(block, /description:/, `${slug} owns a concise description`);
}

assert.match(shell, /The proof[\s\S]*\{cat\.proof\}/, 'the shared hero renders the route proof');
assert.match(shell, /href="\/flow\/specifications\/"[\s\S]*Read Tech Specs/, 'dense facts route to Tech Specs');
assert.match(shell, /<FlowWaitlist placement="flow-mid"/, 'each product-tour job keeps one conversion close');
assert.doesNotMatch(copyOnly(shell), /Orionfold Flow[\s\S]{0,80}Product tour · Part/, 'the hero no longer repeats an app badge before the product-tour eyebrow');

for (const component of ['ChapterAgency', 'ChapterExpand', 'ChapterToolbar', 'ChapterLongDocs']) assert.match(routes.writing, new RegExp(`<${component} \/>`));
for (const component of ['ChapterSearch', 'ChapterTables', 'ChapterVisualize', 'ChapterPictures', 'ChapterFiles']) assert.match(routes.documents, new RegExp(`<${component} \/>`));
for (const component of ['ChapterDomains', 'ChapterRuntime', 'ChapterRouting', 'ChapterResources']) assert.match(routes.models, new RegExp(`<${component} \/>`));
for (const component of ['ChapterReceipts', 'ChapterBenchmarks']) assert.match(routes.receipts, new RegExp(`<${component} \/>`));
assert.doesNotMatch(routes.documents, /ChapterResources/, 'machine resources belong to Models and Runtime, not Documents and Files');

assert.match(tour, /const tourCards = FLOW_CATEGORIES;/, 'the tour home derives its titles, order, and chapter lists from one source');
assert.match(tour, /\{category\.title\}/);
assert.match(tour, /\{category\.blurb\}/);
assert.doesNotMatch(tour, /Six focused AI actions/, 'the retired action count cannot survive in tour-card copy');

assert.match(routes.enterprise, /Govern AI where the work happens\./, 'enterprise owns one governance job');
assert.match(routes.enterprise, /Control\. Verify\. Learn\./, 'enterprise groups the argument into three decisions');
assert.match(routes.enterprise, /One run\. Four inspectable decisions\./, 'enterprise uses the same run-level proof pattern as the product');
assert.match(routes.enterprise, /Read the nine adoption patterns/, 'dense adoption detail is progressively disclosed');
assert.match(routes.enterprise, /href="\/flow\/receipts\/"/, 'enterprise routes to its proof');
assert.match(routes.enterprise, /href="\/flow\/specifications\/"/, 'enterprise routes to its exact facts');
assert.doesNotMatch(routes.enterprise, /Press kit and contact|\/flow\/#press/, 'enterprise has one product next step, not a press detour');

for (const [slug, title] of [
  ['writing-with-ai', 'Write with AI. Keep the final word.'],
  ['documents-and-files', 'Do more with your files. Keep them yours.'],
  ['models-and-runtime', 'Choose where AI runs. Every time.'],
  ['receipts', 'Know what AI did. Keep the record.'],
  ['enterprise', 'Govern AI where the work happens'],
]) {
  const block = og.match(new RegExp(`'/flow/${slug}/': \\{([\\s\\S]*?)\\n  \\},`))?.[1] ?? '';
  assert.match(block, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${slug} social copy matches the page promise`);
}

const inScopeCopy = copyOnly([
  categories,
  shell,
  tour,
  routes.enterprise,
].join('\n'));
assert.doesNotMatch(inScopeCopy, /—/, 'tour-family editorial copy uses short sentences, not em dashes');
for (const stale of [
  'Most AI edits happen behind your back',
  'Most note apps lock your files in a database',
  'Most tools decide where your text goes',
  'Most AI work leaves no trace',
  'Most enterprise AI fails at the audit',
]) assert.doesNotMatch(inScopeCopy, new RegExp(stale), `retired setup copy stays retired: ${stale}`);

console.log('Flow tour editorial surface: four buyer jobs, one enterprise job, one proof pattern each');
