// Clock times in prose ("12:57") must survive remark-directive (2026-10-05:
// every Flow path page printed "12", an empty <div>, then the rest).
import test from 'node:test';
import assert from 'node:assert/strict';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkDirectiveTimes from '../../src/lib/prose/remark-directive-times.mjs';

const html = async (md) => String(await unified().use(remarkParse).use(remarkDirective).use(remarkDirectiveTimes).use(remarkRehype).use(rehypeStringify).process(md));

test('clock times render as text, not as empty directives', async () => {
  const out = await html('Saved again *(verified: the EPUB read back, 12:57)*. Walk ran 12:02–12:56 PDT.');
  assert.match(out, /read back, 12:57\)/);
  assert.match(out, /12:02–12:56 PDT/);
  assert.doesNotMatch(out, /<div>/);
});
