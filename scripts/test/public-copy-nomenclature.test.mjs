import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const presentationRoots = ['src/pages', 'src/components', 'src/layouts'];

function astroFiles(directory) {
  return readdirSync(`${repositoryRoot}${directory}`, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return astroFiles(relativePath);
    return entry.isFile() && entry.name.endsWith('.astro') ? [relativePath] : [];
  });
}

function copyBearingSource(relativePath) {
  const source = readFileSync(`${repositoryRoot}${relativePath}`, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');

  // "Website" is the ordinary subject of this privacy-policy heading, not a
  // repository role. Keep the exception exact so other uses still fail.
  return relativePath === 'src/pages/privacy.astro'
    ? source.replace('Website usage information.', 'Site usage information.')
    : source;
}

const forbiddenNomenclature = [
  ['internal goal ID', /\bG-\d{3}\b/],
  ['internal repository role "Website"', /\bWebsite\b/],
  ['private project path', /(?:^|[^\w])_(?:ASSETS|IDEAS|SPECS|FLOWS)(?:[^\w]|$)/],
  ['internal launch state', /\blaunch-dark\b/i],
  ['internal planning term', /\b(?:backlog|goal contract)\b/i],
  ['internal gate term', /\b(?:operator|release|publication|activation) gate\b/i],
  ['development review term', /\b(?:local|dev(?:elopment)?) (?:preview|review)\b/i],
  ['test-commerce term', /\bsandbox checkout\b/i],
  ['build-state term', /\bin this build\b/i],
];

for (const relativePath of presentationRoots.flatMap(astroFiles)) {
  const source = copyBearingSource(relativePath);
  for (const [label, pattern] of forbiddenNomenclature) {
    assert.doesNotMatch(source, pattern, `${relativePath} exposes ${label} in customer-facing copy`);
  }
}

console.log('[public-copy-nomenclature] website-owned customer copy contains no internal project vocabulary');
