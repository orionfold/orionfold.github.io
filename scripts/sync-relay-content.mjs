#!/usr/bin/env node
// One-way Relay _ASSETS -> Website content sync.
//
// API chapters are copied verbatim. User guides keep their source prose while
// adapting the source editorial frontmatter to Website's public collection
// schema and replacing source-file screenshot paths with portable themed-shot
// markers. The source corpus is read-only.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_ASSETS_ROOT = '/Users/manavsehgal/orionfold/relay/_ASSETS';

function frontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) throw new Error('missing frontmatter');
  return { raw: match[1], body: source.slice(match[0].length) };
}

function scalar(raw, key) {
  const match = raw.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!match) throw new Error(`missing frontmatter field: ${key}`);
  const value = match[1].trim();
  return /^["[{]/.test(value) ? JSON.parse(value) : value;
}

function array(raw, key) {
  const value = scalar(raw, key);
  if (!Array.isArray(value)) throw new Error(`${key} must be an inline JSON array`);
  return value;
}

export function transformGuide(source, { order, screenshotIds }) {
  const { raw, body: sourceBody } = frontmatter(source);
  const title = scalar(raw, 'title');
  const features = array(raw, 'features');
  let body = sourceBody.replace(/^\s*# .+\n+/, '');
  const summaryMatch = body.match(/^## What This Chapter Helps You Do\n\n([^\n]+)$/m);
  if (!summaryMatch) throw new Error(`${title}: missing one-line help summary`);

  // Source guides can point into Relay's repository-owned technical docs.
  // Keep those details canonical instead of publishing a second Website copy.
  body = body.replace(
    /\]\(\.\.\/\.\.\/\.\.\/docs\/([a-z0-9-]+\.md)\)/g,
    (_match, file) => `](https://github.com/orionfold/relay/blob/main/docs/${file})`,
  );
  body = body.replace(
    /\]\(\.\.\/\.\.\/screenshots\/(?:light|dark)\/[^)\n]*\/([a-z0-9-]+)__desktop\.png\)/g,
    (match, id) => {
      if (!screenshotIds.has(id)) throw new Error(`${title}: unknown screenshot target ${id}`);
      return `](relay-shot:${id})`;
    },
  );
  if (/\.\.\/\.\.\/screenshots\//.test(body)) {
    throw new Error(`${title}: an unconverted screenshot path remains`);
  }

  const lines = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `order: ${order}`,
    `summary: ${JSON.stringify(summaryMatch[1])}`,
    'features:',
    ...features.map((feature) => `  - ${JSON.stringify(feature)}`),
    '---',
    body.trimStart().trimEnd(),
    '',
  ];
  return lines.join('\n');
}

function writeIfChanged(path, content, check) {
  const before = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (before === content) return false;
  if (!check) writeFileSync(path, content);
  return true;
}

export function normalizeMemoSource(source) {
  // Memo prose and SVGs remain byte-for-byte source-owned.
  return source;
}

export function validateMemoSource(source, slug = 'memo') {
  const openFigures = (source.match(/<figure\b/gi) ?? []).length;
  const closeFigures = (source.match(/<\/figure>/gi) ?? []).length;
  if (openFigures !== closeFigures) {
    throw new Error(`${slug}: unbalanced inline figure tags (${openFigures} opening, ${closeFigures} closing)`);
  }

  for (const match of source.matchAll(/<figure\b[\s\S]*?<\/figure>/gi)) {
    const blank = /\n[\t ]*\n/.exec(match[0]);
    if (!blank) continue;
    const line = source.slice(0, match.index + blank.index).split('\n').length;
    throw new Error(`${slug}: blank line inside inline figure at line ${line}; refusing a source handoff that CommonMark would split into plaintext`);
  }
}

export function syncRelayContent({ assetsRoot = DEFAULT_ASSETS_ROOT, check = false, repoRoot = REPO_ROOT } = {}) {
  const manifest = JSON.parse(readFileSync(join(assetsRoot, 'screenshots/metadata/manifest.json'), 'utf8'));
  const screenshotIds = new Set(manifest.entries.map((entry) => entry.id));
  const guidesDir = join(assetsRoot, 'docs/guides');
  const guideNames = readdirSync(guidesDir).filter((name) => /^\d{2}-.+\.md$/.test(name)).sort();
  const apiDir = join(assetsRoot, 'api/reference');
  const apiNames = readdirSync(apiDir).filter((name) => name.endsWith('.md')).sort();
  const memosDir = join(assetsRoot, 'memos');
  const memoNames = readdirSync(memosDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(memosDir, entry.name, 'article.md')))
    .map((entry) => entry.name)
    .sort();
  const changed = [];

  // Preflight the complete memo corpus before writing docs, API, or memo files.
  // Relay owns _ASSETS; Website never normalizes it. A malformed handoff fails
  // closed and leaves the last-known-good destination tree untouched.
  const memoSources = new Map();
  for (const name of memoNames) {
    const articlePath = join(memosDir, name, 'article.md');
    const signaturePath = join(memosDir, name, 'signature.svg');
    if (!existsSync(signaturePath)) throw new Error(`${name}: missing signature.svg`);
    const article = readFileSync(articlePath, 'utf8');
    validateMemoSource(article, name);
    memoSources.set(name, {
      'article.md': article,
      'signature.svg': readFileSync(signaturePath, 'utf8'),
    });
  }

  guideNames.forEach((name, index) => {
    const outputName = name.replace(/^\d{2}-/, '');
    const output = transformGuide(readFileSync(join(guidesDir, name), 'utf8'), {
      order: index + 1,
      screenshotIds,
    });
    const outputPath = join(repoRoot, 'src/content/relay-docs', outputName);
    if (writeIfChanged(outputPath, output, check)) changed.push(`docs/${outputName}`);
  });

  apiNames.forEach((name) => {
    const output = `${readFileSync(join(apiDir, name), 'utf8').trimEnd()}\n`;
    const outputPath = join(repoRoot, 'src/content/relay-api', name);
    if (writeIfChanged(outputPath, output, check)) changed.push(`api/${name}`);
  });

  memoNames.forEach((name) => {
    const outputDir = join(repoRoot, 'src/content/memos', name);
    if (!check) mkdirSync(outputDir, { recursive: true });
    for (const file of ['article.md', 'signature.svg']) {
      const output = normalizeMemoSource(memoSources.get(name)[file]);
      const outputPath = join(outputDir, file);
      if (writeIfChanged(outputPath, output, check)) changed.push(`memos/${name}/${file}`);
    }
  });

  return { guideCount: guideNames.length, apiCount: apiNames.length, memoCount: memoNames.length, changed };
}

async function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const assetsIndex = args.indexOf('--assets-root');
  const assetsRoot = assetsIndex >= 0 ? resolve(args[assetsIndex + 1]) : DEFAULT_ASSETS_ROOT;
  const result = syncRelayContent({ assetsRoot, check });
  console.log(`[sync-relay-content] ${result.guideCount} guides + ${result.apiCount} API chapters + ${result.memoCount} memos; ${result.changed.length} ${check ? 'stale' : 'updated'}`);
  result.changed.forEach((path) => console.log(`  ${path}`));
  if (check && result.changed.length) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
