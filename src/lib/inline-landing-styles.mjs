import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';

const LANDINGS = ['index.html', 'flow/index.html'];

/** Preserve Astro's compiled cascade in place, without a second blocking fetch.
 * Only the two cold-entry landings opt in; other routes reuse cached CSS files.
 * Keeping the emitted files also preserves their use by those other routes.
 */
export async function inlineLandingStyles(html, directory) {
  const root = resolve(directory);
  const links = [...html.matchAll(/<link\b(?:"[^"]*"|'[^']*'|[^'">])*>/g)];
  for (const [tag] of links) {
    // Astro emits these two attributes for an unconditional compiled stylesheet.
    // Leave media, integrity, external, or otherwise qualified links untouched.
    const match = tag.match(/^<link rel="stylesheet" href="(\/_astro\/[^"?#]+\.css)"\s*\/?>$/);
    if (!match) continue;
    const file = resolve(root, `.${match[1]}`);
    if (!file.startsWith(root + sep)) throw new Error(`Stylesheet escapes build directory: ${match[1]}`);
    const css = await readFile(file, 'utf8');
    if (/<\/style\b/i.test(css) || /@import\s/i.test(css)) {
      throw new Error(`Stylesheet cannot be safely embedded: ${match[1]}`);
    }
    // A CSS URL resolves against the document after inlining. Astro currently
    // emits root-relative asset URLs; reject a future relative URL rather than
    // silently break fonts/images on /flow/.
    for (const [, doubleQuoted, singleQuoted, unquoted] of css.matchAll(/url\(\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|([^)]*))\s*\)/gi)) {
      const url = (doubleQuoted ?? singleQuoted ?? unquoted).trim();
      if (!/^(?:\/(?!\/)|data:|https?:\/\/)/i.test(url)) {
        throw new Error(`Inlining would change a CSS URL: ${url}`);
      }
    }
    html = html.replace(tag, () => `<style>${css}</style>`);
  }
  return html;
}

export default function inlineLandingStylesIntegration() {
  return {
    name: 'inline-landing-styles',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const directory = fileURLToPath(dir);
        for (const landing of LANDINGS) {
          const file = resolve(directory, landing);
          const html = await readFile(file, 'utf8');
          const output = await inlineLandingStyles(html, directory);
          if (output === html) throw new Error(`No compiled stylesheet links found in ${landing}; check Astro's emitted markup`);
          await writeFile(file, output);
        }
      },
    },
  };
}
