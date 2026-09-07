import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import inlineLandingStylesIntegration, { inlineLandingStyles } from '../../src/lib/inline-landing-styles.mjs';

async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'landing-styles-'));
  try {
    await mkdir(join(root, '_astro'));
    await writeFile(join(root, '_astro/base.css'), '@font-face{src:url("/fonts/body.woff2")}h1{color:red}');
    await writeFile(join(root, '_astro/page.css'), 'h1{color:teal}');
    await run(root);
  } finally { await rm(root, { recursive: true, force: true }); }
}
const links = '<link rel="stylesheet" href="/_astro/base.css"><style>h1{color:blue}</style><link rel="stylesheet" href="/_astro/page.css">';

test('compiled rules retain cascade order, fonts and document content without a blocking link', () => fixture(async root => {
  const input = `<head>${links}</head><body><h1>Hello</h1></body>`;
  const output = await inlineLandingStyles(input, root);
  assert.equal(output, '<head><style>@font-face{src:url("/fonts/body.woff2")}h1{color:red}</style><style>h1{color:blue}</style><style>h1{color:teal}</style></head><body><h1>Hello</h1></body>');
  assert.equal(await inlineLandingStyles(output, root), output, 'repeated builds do not duplicate CSS');
  assert.equal(await readFile(join(root, '_astro/page.css'), 'utf8'), 'h1{color:teal}', 'shared asset remains cacheable on other routes');
}));

test('external and qualified stylesheet loading semantics are preserved', () => fixture(async root => {
  const input = '<link rel="stylesheet" href="https://example.com/a.css"><link rel="stylesheet" href="/_astro/base.css" media="print"><link rel="preload" as="style" href="/_astro/page.css">';
  assert.equal(await inlineLandingStyles(input, root), input);
}));

test('quoted SVG data URLs with parentheses and nested quotes remain intact', () => fixture(async root => {
  const css = `p{background:url("data:image/svg+xml,%3Csvg%3E%3Crect filter='url(%23noise)'/%3E%3C/svg%3E")}`;
  await writeFile(join(root, '_astro/page.css'), css);
  const output = await inlineLandingStyles('<link rel="stylesheet" href="/_astro/page.css">', root);
  assert.equal(output, `<style>${css}</style>`);
}));

test('a URL that would resolve differently or unsafe style text fails the build', () => fixture(async root => {
  for (const css of ['p{background:url(../image.png)}', 'p{fill:url(#filter)}', '@import "other.css";', 'p{content:"</style><script>"}']) {
    await writeFile(join(root, '_astro/page.css'), css);
    await assert.rejects(inlineLandingStyles(links, root), /CSS URL|safely embedded/);
  }
  await assert.rejects(inlineLandingStyles('<link rel="stylesheet" href="/_astro/missing.css">', root), /ENOENT/);
  await assert.rejects(inlineLandingStyles('<link rel="stylesheet" href="/_astro/../../outside.css">', root), /escapes build directory/);
}));

test('the build hook changes only home and Flow; inner pages keep cached stylesheet links', () => fixture(async root => {
  await mkdir(join(root, 'flow')); await mkdir(join(root, 'story'));
  for (const path of ['index.html', 'flow/index.html', 'story/index.html']) await writeFile(join(root, path), links);
  await inlineLandingStylesIntegration().hooks['astro:build:done']({ dir: pathToFileURL(root + '/') });
  for (const path of ['index.html', 'flow/index.html']) assert.doesNotMatch(await readFile(join(root, path), 'utf8'), /rel="stylesheet"/);
  assert.equal(await readFile(join(root, 'story/index.html'), 'utf8'), links);
}));

test('an Astro markup change cannot silently disable the landing optimization', () => fixture(async root => {
  await writeFile(join(root, 'index.html'), '<link href="/_astro/base.css" rel="stylesheet">');
  await assert.rejects(inlineLandingStylesIntegration().hooks['astro:build:done']({ dir: pathToFileURL(root + '/') }), /No compiled stylesheet links found in index.html/);
}));
