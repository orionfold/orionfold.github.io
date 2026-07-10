// Remark plugin: give every prose code block a titled, copyable card.
//
// WHY REMARK (not rehype): Astro's markdown pipeline runs user remark plugins →
// user rehype plugins → Astro's internal shiki highlighter. So by the time a
// rehype plugin sees the tree, the <pre><code> is bare and the language has been
// stripped from the HAST (it lives on the mdast `code` node, `code.lang`,
// consumed by shiki later). The language + the fence meta string only exist HERE,
// on the mdast `code` node. So the chrome is built at the remark layer.
//
// HOW: for each ```fence``` code node we leave the code node itself untouched (so
// Astro's shiki still highlights it into <pre class="astro-code">), and we insert
// a raw-HTML OPENING node before it and a CLOSING node after it, wrapping it in:
//   <figure class="of-code">
//     <div class="of-code__bar"><span title>…</span><button copy>…</button></div>
//     [<figcaption class="of-code__caption">…</figcaption>]   (only if authored)
//     …the shiki <pre> renders here…
//   </figure>
// Raw `{type:'html'}` mdast nodes pass through Astro's markdown pipeline (same
// idiom the sibling remark-asciinema / remark-proof-cta plugins use). Styling for
// .of-code* lives in global.css; the copy button is wired by one delegated global
// script in the base Layout.
//
// TITLE: derived from the language (bash → "Terminal", json → "JSON", …), or an
// author override via ```lang title="…". CAPTION: renders ONLY when the author
// sets ```lang caption="…" — so untitled blocks never get an empty caption bar.
// Applies to ALL fenced blocks (single + multi-line). Inline `code` is not a
// `code` fence node, so it is untouched; the product CodeTabs component is not
// markdown, so it is unaffected.

import { visit } from 'unist-util-visit';

const LANG_LABELS = {
  bash: 'Terminal', sh: 'Terminal', shell: 'Terminal', zsh: 'Terminal', console: 'Terminal',
  json: 'JSON', jsonc: 'JSON',
  ts: 'TypeScript', typescript: 'TypeScript', tsx: 'TypeScript',
  js: 'JavaScript', javascript: 'JavaScript', jsx: 'JavaScript',
  astro: 'Astro', html: 'HTML', xml: 'XML', css: 'CSS', scss: 'SCSS',
  md: 'Markdown', markdown: 'Markdown', mdx: 'MDX',
  py: 'Python', python: 'Python',
  yaml: 'YAML', yml: 'YAML', toml: 'TOML', sql: 'SQL', diff: 'Diff',
  text: 'Text', plaintext: 'Text',
};

function labelForLang(lang) {
  if (!lang || lang === 'plaintext' || lang === 'text') return lang ? 'Text' : 'Code';
  return LANG_LABELS[lang] ?? lang.charAt(0).toUpperCase() + lang.slice(1);
}

// Pull key="value" / key='value' pairs out of a fence meta string.
function parseMeta(meta) {
  const out = {};
  if (!meta) return out;
  const re = /(\w+)=(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(meta)) !== null) out[m[1]] = m[2] ?? m[3] ?? '';
  return out;
}

// Minimal HTML-attribute escaping for values we interpolate into attributes/text.
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const COPY_ICON =
  '<svg class="of-code__copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>' +
  '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

export default function remarkCodeBlock() {
  return (tree) => {
    // Collect first (we mutate parent.children as we go).
    const targets = [];
    visit(tree, 'code', (node, index, parent) => {
      if (!parent || index == null) return;
      targets.push({ node, index, parent });
    });

    // Splice from the end so earlier indices stay valid.
    for (let i = targets.length - 1; i >= 0; i--) {
      const { node, index, parent } = targets[i];
      const meta = parseMeta(node.meta);
      const lang = node.lang || '';
      const title = meta.title || labelForLang(lang);
      const caption = meta.caption;

      const bar =
        '<div class="of-code__bar">' +
        `<span class="of-code__title">${esc(title)}</span>` +
        '<button type="button" class="of-code__copy" data-code-copy aria-label="Copy code">' +
        COPY_ICON +
        '<span class="of-code__copy-label">Copy</span>' +
        '</button>' +
        '</div>';

      const captionHtml = caption
        ? `<figcaption class="of-code__caption">${esc(caption)}</figcaption>`
        : '';

      const open = {
        type: 'html',
        value: `<figure class="of-code"${lang ? ` data-lang="${esc(lang)}"` : ''}>${bar}${captionHtml}`,
      };
      const close = { type: 'html', value: '</figure>' };

      // Wrap: [ …, open, code(untouched), close, … ]
      parent.children.splice(index, 1, open, node, close);
    }
  };
}
