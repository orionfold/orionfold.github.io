// Remark plugin: give clock times back to the text.
//
// remark-directive reads ":57" in "12:57" as a text directive named "57", and
// an unhandled directive renders as an empty <div>, so "read back, 12:57)"
// printed as "12", a line break, and ")" on every Flow path page. No directive
// this site uses starts with a digit, so any that does is turned back into the
// text it was written as. Runs right after remark-directive.
export function directiveText(node) {
  const label = (node.children ?? []).map((c) => c.value ?? '').join('');
  const attrs = node.attributes && Object.keys(node.attributes).length
    ? `{${Object.entries(node.attributes).map(([k, v]) => (v ? `${k}="${v}"` : k)).join(' ')}}`
    : '';
  return `:${node.name}${label ? `[${label}]` : ''}${attrs}`;
}

function walk(node) {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    if (child.type === 'textDirective' && /^\d/.test(child.name)) return { type: 'text', value: directiveText(child) };
    walk(child);
    return child;
  });
}

export default function remarkDirectiveTimes() {
  return (tree) => walk(tree);
}
