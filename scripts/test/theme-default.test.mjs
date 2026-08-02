import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(
  new URL(`../../${relativePath}`, import.meta.url),
  'utf8',
);

const layout = read('src/layouts/Layout.astro');
const privateLayout = read('src/layouts/PrivateLayout.astro');
const nav = read('src/components/Nav.astro');

for (const [name, source] of [
  ['public layout', layout],
  ['private layout', privateLayout],
]) {
  assert.match(source, /\? saved : 'light'/, `${name} must default a fresh session to light`);
  assert.match(source, /setAttribute\('data-theme-mode', 'light'\)/, `${name} fallback must expose the light choice`);
  assert.match(source, /setAttribute\('data-theme', 'light'\)/, `${name} fallback must resolve to light`);
  assert.doesNotMatch(source, /\? saved : 'dark'/, `${name} must not retain the old dark fallback`);
}

assert.match(nav, /defaults new users to light/);
assert.match(nav, /getAttribute\('data-theme-mode'\) \|\| 'light'/);
assert.match(nav, /const order = \['light', 'dark', 'system'\]/, 'explicit theme cycling must remain unchanged');

console.log('theme default: fresh sessions start light while saved and system choices remain available');
