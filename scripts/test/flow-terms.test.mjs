// Flow vocabulary marking: Flow's own screen labels are set apart in copy.
import test from 'node:test';
import assert from 'node:assert/strict';
import { splitFlowTerms, flowTermsHtml, isFlowTerm, remarkFlowTerms } from '../../src/lib/flow/flow-terms.mjs';

test('specific labels are found in running text, longest first', () => {
  const parts = splitFlowTerms('Tick I accept changes, then press Add Folder… in the sidebar.');
  assert.deepEqual(parts.filter((p) => p.term).map((p) => p.text), ['I accept changes', 'Add Folder…']);
});

test('ordinary words are not marked in running text', () => {
  const parts = splitFlowTerms('You can publish, keep or ask later. Proofreading is not Proofread.');
  assert.deepEqual(parts.filter((p) => p.term).map((p) => p.text), ['Proofread']);
});

test('flowTermsHtml escapes the text around a term', () => {
  assert.equal(flowTermsHtml('<b> & Review Changes'), '&lt;b&gt; &amp; <span class="flow-term">Review Changes</span>');
});

test('generic labels count only as a whole bold or italic run', () => {
  assert.equal(isFlowTerm('Publish'), true);
  assert.equal(isFlowTerm('Publish the deck'), false);
});

test('remarkFlowTerms marks Compare and Paths Markdown only, never links or headings', () => {
  const tree = () => ({ type: 'root', children: [
    { type: 'paragraph', children: [{ type: 'text', value: 'Click ' }, { type: 'strong', children: [{ type: 'text', value: 'Publish' }] }, { type: 'text', value: ' after Review Changes.' }] },
    { type: 'heading', depth: 2, children: [{ type: 'text', value: 'Review Changes' }] },
    { type: 'paragraph', children: [{ type: 'link', url: '/x', children: [{ type: 'text', value: 'Smart Routing' }] }] },
  ] });
  const marked = tree();
  remarkFlowTerms()(marked, { path: '/site/src/content/compare/notion.md' });
  const p = marked.children[0].children;
  assert.equal(p[1].data.hProperties.className[0], 'flow-term');
  assert.equal(p[1].children[0].value, 'Publish');
  assert.ok(p.some((n) => n.data?.hName === 'span' && n.children[0].value === 'Review Changes'));
  assert.equal(marked.children[1].children[0].type, 'text');
  assert.equal(marked.children[2].children[0].children[0].type, 'text');
  const other = tree();
  remarkFlowTerms()(other, { path: '/site/src/content/story/x.md' });
  assert.deepEqual(other, tree());
});
