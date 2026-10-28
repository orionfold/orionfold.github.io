// Operator rule (2026-10-28): a sentence broken with a colon ("setup: payoff")
// reads as machine-written. Site copy says it in two sentences instead. This
// guard reads the BUILT key pages, strips markup, and fails on a clause joined
// to a lowercase clause by ": ". Clock times, URLs, labels ("Source: …",
// "verified: …") and product output quoted inside a mock are not joins.
// Synced content (paths bodies, element cards, Relay docs, stories) is owned
// upstream and is not guarded here; see the memory `no-colon-joined-sentences`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const dist = (route) => new URL(`dist${route}index.html`, root);
const hasDist = existsSync(dist('/'));

const ROUTES = [
  '/', '/flow/', '/domains/', '/domains/ai-consulting/', '/domains/learning-design/', '/domains/research-synthesis/', '/domains/finance-advisory/', '/domains/accounting-advisory/', '/flow/paths/', '/flow/compare/',
  '/flow/compare/notion/', '/flow/compare/obsidian/', '/flow/compare/custom-gpts/', '/flow/compare/claude-code/',
  '/flow/compare/codex/', '/flow/compare/hermes-openclaw/', '/flow/compare/word/', '/flow/compare/canva/',
];

// Product output quoted inside a mock, and label-style cells, stay as the product wrote them.
const ALLOWED = [
  'I made a README for Agents and Harness: the title',
  'The brief is in Review: a working argument',
  'Working argument: better harness defaults',
  'Review Changes 8 changes: the charts',
  'Summary Three lines: role, years',
  'Portfolio: two 2026 case studies',
  'Overnight note The first draft was refused: one number',
  'Platform: approve the pinned runner image',
  'Search: obtain the fixture',
  'Pick a model: on this Mac or your own key',
  'Proposed outline What Agents Actually Did: a record',
  'Flow Domains: your expertise as a living system',
  'Flow Paths: real work, walked end to end',
  'From an empty folder to GitHub: how AI Consulting',
  // The four Domain blueprints' titles (G-135), the same shape as the launch story's.
  'Teach the way you teach, every time: a blueprint for Learning Design',
  'From transcripts to a decision, your way: a blueprint for Research Synthesis',
  'The board pack that remembers your judgment: a blueprint for Finance Advisory',
  'A close your clients can read: a blueprint for Accounting Advisory',
  'Flow with Canva: the words and numbers',
  'Flow with Claude Code: your agent writes',
  'Flow with Codex: your agent proposes',
  'Flow for experts with a custom GPT or a Claude Project: your method',
  'Flow with Hermes Agent or OpenClaw: the agent does the work',
  'Flow for Notion users: your pages',
  'Flow for Obsidian users: same Markdown files',
  'Flow with Word: check the work',
  'Source: Claude Code docs: Overview',
  'Start with the AI Consulting Domain',
  // The mock's proposed book outline, as Flow wrote it in the walk.
  'Model or Harness: each incident traced back',
  // A path summary synced from the product's article (sync-flow-paths); owned upstream.
  'This month’s budget out: spent against the plan',
];

const JOIN = /([A-Za-z\)’”'"][^.!?\n]{0,160}?[A-Za-z\)’”'"]): ([a-z][^.!?\n]{0,120})/g;

export function colonJoins(html) {
  let s = html.replace(/<(script|style|noscript|svg|template)[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  s = s.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ');
  s = s.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/[ \t]+/g, ' ');
  const out = [];
  for (const m of s.matchAll(JOIN)) {
    const before = m[1], after = m[2];
    if (/\d:$/.test(before) || /^\d/.test(after)) continue; // 10:55
    if (/\b(https?|mailto)$/i.test(before)) continue; // URLs
    if (/\b(verified|derived|Source|Sources|Note|Questions|Privacy requests|Terms version)$/.test(before)) continue; // labels
    const snippet = `${before.slice(-90)}: ${after.slice(0, 70)}`;
    if (ALLOWED.some((a) => snippet.includes(a) || `${before}: ${after}`.includes(a))) continue;
    out.push(snippet);
  }
  return [...new Set(out)];
}

test('key pages carry no colon-joined sentences in their copy', { skip: !hasDist }, () => {
  const found = [];
  for (const route of ROUTES) {
    if (!existsSync(dist(route))) continue;
    for (const j of colonJoins(readFileSync(dist(route), 'utf8'))) found.push(`${route}  ${j}`);
  }
  assert.deepEqual(found, [], `colon-joined sentences (write two sentences instead):\n${found.join('\n')}`);
});

test('the copy rule holds in the source of the hero paragraphs and the Domains page', () => {
  const read = (rel) => readFileSync(new URL(rel, root), 'utf8');
  for (const rel of ['src/components/living/HomeHero.astro', 'src/components/living/FlowHero.astro', 'src/components/flow/FlowDomainsBand.astro']) {
    const paras = [...read(rel).matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => m[1].replace(/<[^>]+>/g, ' '));
    for (const p of paras) assert.doesNotMatch(p, /[a-z\)]: [a-z]/, `${rel}: ${p.slice(0, 80)}`);
  }
});
