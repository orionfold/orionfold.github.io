// A Flow component as a document holds it: a ```flowui fence of YAML lines.
// Shiki's Markdown grammar only colours fences it knows, so a Markdown block
// that is one flowui fence is highlighted with this grammar instead (see
// remark-code-block): the fence lines as Markdown punctuation, the inside as YAML.
// Shiki (Astro's highlighter) only loads an embedded language that is
// registered alongside, so the YAML grammar travels with this one.
import yaml from 'shiki/langs/yaml.mjs';

export const FLOWUI_BLOCK_LANG = 'flowui-block';

export const flowuiBlockGrammar = {
  name: FLOWUI_BLOCK_LANG,
  scopeName: 'source.flowui-block',
  embeddedLangs: ['yaml'],
  patterns: [
    {
      begin: '^(```)(flowui)\\s*$',
      beginCaptures: { 1: { name: 'punctuation.definition.markdown' }, 2: { name: 'fenced_code.block.language.markdown' } },
      end: '^(```)\\s*$',
      endCaptures: { 1: { name: 'punctuation.definition.markdown' } },
      contentName: 'meta.embedded.block.yaml',
      patterns: [{ include: 'source.yaml' }],
    },
  ],
};

/** The languages to hand Astro's shikiConfig.langs. */
export const flowuiBlockLangs = () => [...yaml, flowuiBlockGrammar];

/** Is this Markdown block exactly one flowui fence? */
export const isFlowuiBlock = (lang, value) =>
  (lang === 'markdown' || lang === 'md') && /^```flowui\n[\s\S]*\n```\s*$/.test(value);
