import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
const read = (relativePath) => readFileSync(new URL(relativePath, root), 'utf8');

const layout = read('src/layouts/Layout.astro');
const privateLayout = read('src/layouts/PrivateLayout.astro');
const nav = read('src/components/Nav.astro');
const css = read('src/styles/global.css');

for (const [name, source] of [
  ['public layout', layout],
  ['private layout', privateLayout],
]) {
  assert.match(source, /<html lang="en" data-theme="light">/, `${name} declares the sole light appearance before paint`);
  assert.doesNotMatch(source, /of-theme|data-theme-mode|prefers-color-scheme|matchMedia/, `${name} has no saved or system appearance runtime`);
}

for (const retired of [
  'theme-toggle',
  'lockedTheme',
  'data-theme-lock',
  'data-theme-mode',
  "localStorage.setItem('of-theme'",
  'prefers-color-scheme: dark',
]) {
  assert.doesNotMatch(nav, new RegExp(retired.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Nav retires ${retired}`);
}

assert.doesNotMatch(css, /html\[data-theme=["']dark["']\]/, 'global tokens have no dark remap');
assert.doesNotMatch(css, /\[data-theme-mode=/, 'global CSS has no theme-control icon state');
assert.doesNotMatch(css, /\.theme-toggle\b/, 'global CSS has no theme-control styling');
assert.doesNotMatch(css, /color-scheme:\s*dark/, 'global CSS never asks the browser for dark chrome');

const appearanceFiles = [];
const walk = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (['.astro', '.css', '.mjs', '.ts', '.tsx'].includes(extname(entry.name))) appearanceFiles.push(path);
  }
};
walk(fileURLToPath(new URL('src/', root)));

const forbiddenRuntime = /data-shot-dark|data-theme-mode|\[data-theme=["']dark["']\]|html\[data-theme=["']dark["']\]|prefers-color-scheme:\s*dark|\bdark:/;
for (const path of appearanceFiles) {
  const source = readFileSync(path, 'utf8');
  assert.doesNotMatch(source, forbiddenRuntime, `${path} exposes no alternate dark appearance branch`);
}

console.log('site appearance: every route has one static light theme and no switcher');
