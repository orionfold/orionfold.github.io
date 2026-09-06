import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const routes = { home: 'index', flow: 'flow', essay: 'essay', manifesto: 'manifesto' };
const base = read('src/styles/living-base.css');
const styles = Object.fromEntries(Object.keys(routes).map(route => [route, read(`src/styles/living-${route}.css`)]));

for (const [route, page] of Object.entries(routes)) {
  const source = read(`src/pages/${page}.astro`), css = styles[route];
  assert.match(source, new RegExp(`import '../styles/living-base\\.css';\\s*import '../styles/living-${route}\\.css';`), `${route}: base precedes the selected route cascade`);
  for (const other of Object.keys(routes).filter(name => name !== route)) assert.ok(!source.includes(`styles/living-${other}.css`), `${route}: no unrelated page sheet`);
  assert.ok(!source.includes('living-flagships.css'), `${route}: no monolithic bundle`);
  assert.match(css, /\.ls \.ls-main\s*\{padding-top:var\(--of-nav-height,82px\)\}/, `${route}: root section clears fixed navigation`);
  assert.match(css, /@media/, `${route}: responsive cascade retained`);
  assert.match(css, /prefers-reduced-motion/, `${route}: reduced motion remains explicit`);
  // Every authored animation reference resolves in the page's selected sheet.
  for (const declaration of (base + css).matchAll(/animation(?:-name)?\s*:\s*([^;}]+)/g)) {
    for (const name of declaration[1].match(/\bls-[a-z-]+\b/g) ?? []) assert.ok((base + css).includes(`@keyframes ${name}`), `${route}: animation ${name} has its keyframes`);
  }
}
assert.match(base, /\.ls p,\s*\.ls h1/, 'shared typography reset includes root compositions');
assert.match(base, /:focus-visible/, 'keyboard focus stays in the common base');
assert.doesNotMatch(styles.home, /\.ls-(?:essay-layout|essay-reading|manifesto-part|craft-workbench)\b/, 'homepage does not load editorial or advanced-workbench surfaces');
assert.doesNotMatch(styles.essay, /\.ls-(?:product-demo|scene-body|hero-inner|plan-grid)\b/, 'typography-only essay omits interactive product styles');
assert.match(styles.essay, /\.ls-essay-layout\s*\{[^}]*display:\s*grid/, 'essay root grid survives route selection');
assert.match(styles.manifesto, /\.ls-manifesto-hero\s*\{[^}]*display:\s*grid/, 'manifesto root grid survives route selection');
for (const route of ['home', 'flow']) {
  assert.match(styles[route], /backdrop-filter:/, `${route}: Liquid Glass product treatment remains`);
  for (const state of [1, 2, 3, 4, 5]) assert.ok(styles[route].includes(`data-step='${state}'`), `${route}: runtime step ${state} retains its style`);
  assert.match(styles[route], /data-motion='off'/, `${route}: runtime motion preference retained`);
}
// Raw-source gzip is deliberately conservative: minification can only improve
// the measured release budget, which is checked on the emitted build separately.
assert.ok(gzipSync(base + styles.home).length < 9000, 'homepage composition CSS source must stay below 9KB gzip');
assert.ok(gzipSync(base + styles.essay).length < 3500, 'essay composition CSS source must stay below 3.5KB gzip');
console.log('Living Systems styles: route ownership, root layouts, runtime states and source budgets');


// Persistently visible illustration text is content even before its active step.
const block = (css, selector) => css.split(`${selector} {`)[1]?.split('}')[0] ?? '';
for (const route of ['home', 'flow']) {
  for (const selector of ['.ls-demo-events p', '.ls-overnight-note', '.ls-demo-stages span']) assert.match(block(styles[route], selector), /opacity:\s*1(?:;|\s*})?/, `${route}: ${selector} stays readable while pending`);
  assert.match(block(styles[route], '.ls-demo-stages span'), /color:\s*#586b63/, `${route}: opaque progress label color`);
}
for (const route of ['home', 'flow', 'manifesto']) assert.match(block(styles[route], '.ls-code-sheet small'), /color:\s*#586650/, `${route}: code note contrast`);
assert.match(block(styles.flow, ".ls-example-tabs button[aria-selected='true'] > span"), /opacity:\s*1/, 'selected library number keeps full-contrast red');
const entrance = styles.flow.split('@keyframes ls-craft-arrive')[1]?.split('@keyframes')[0] ?? '';
assert.doesNotMatch(entrance, /opacity:/, 'craft entrance never fades readable content');
assert.match(entrance, /transform:\s*translateY\(5px\)/, 'craft entrance keeps its existing motion');
for (const selector of ['.ls-craft-workbench .ls-craft-switcher button > span', '.ls-craft-workbench .ls-craft-small', '.ls-craft-workbench .ls-craft-sidebar > p']) assert.match(block(styles.flow, selector), /color:\s*#64705e/, `desktop workbench label remains readable: ${selector}`);
const luminance = hex => {
  const channels = hex.match(/[0-9a-f]{2}/gi).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
};
for (const [foreground, background] of [['586b63', 'ffeb4b'], ['586b63', 'fffbdd'], ['586650', 'f0f1e9'], ['64705e', 'fbfbf8'], ['64705e', 'ffffff'], ['64705e', 'fcfcf9'], ['64705e', 'f8f9f6'], ['ba2d21', 'ffef74']]) {
  const a = luminance(foreground), b = luminance(background), contrast = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  assert.ok(contrast >= 4.5, `${foreground} on ${background}: ${contrast.toFixed(2)} exceeds AA normal-text contrast`);
}
