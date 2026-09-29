// The sample-data disclaimer appears once, subtly, under the homepage mock
// (operator review 2026-09-29). Mocks elsewhere carry no repeating label.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

test('the homepage mock carries the one sample-data note', () => {
  assert.match(read('src/components/living/HomeKnowledgeDemo.astro'), /class="ls-demo-note">Product mocks on this site use fictional sample data\.</);
});

test('no mock repeats the illustration label or sample-content note', () => {
  const dirs = ['src/components/living', 'src/components/flow', 'src/components/flow/mocks'];
  for (const dir of dirs) {
    for (const f of readdirSync(new URL(`../../${dir}`, import.meta.url)).filter((n) => n.endsWith('.astro'))) {
      const src = read(`${dir}/${f}`);
      assert.doesNotMatch(src, /FLOW \/ ILLUSTRATION|Illustrated workflows with sample content|uses fictional sample data|Illustration only/, `${dir}/${f}`);
    }
  }
});
