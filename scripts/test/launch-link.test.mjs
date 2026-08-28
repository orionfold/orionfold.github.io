// /launch is the one link inside the Flow launch email. It must stay a short
// first-party path that lands on the launch story with the campaign UTMs
// attached, so GA4 counts every subscriber who arrived from the email while the
// email itself carries no tracking domain and no query string. It is a real
// page, not an astro.config redirect: the static redirect stub painted an
// unstyled "Redirecting to" document before navigating (operator, 2026-08-27).
import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');
const STORY = '/story/the-pit-crew-that-never-touches-the-wheel/';
const CAMPAIGN = 'utm_source=launch-email&utm_medium=email&utm_campaign=flow-launch&utm_content=story';
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('the launch link target is the launch story with the campaign attribution', () => {
  const data = read('src/data/launch-link.ts');
  assert.match(data, new RegExp(`LAUNCH_LINK_STORY = '${escape(STORY)}'`));
  assert.match(data, new RegExp(`'${escape(CAMPAIGN)}'`));
});

test('the launch page redirects before first paint, falls back without JavaScript, and is not indexed', () => {
  const page = read('src/pages/launch.astro');
  assert.doesNotMatch(page, /from '\.\.\/layouts\/Layout\.astro'/, 'the redirect page loads nothing but the redirect');
  assert.match(page, /<head>\s*<meta charset="utf-8" \/>\s*<script is:inline define:vars=\{\{ target \}\}>\s*location\.replace\(target\);/, 'the inline replace is the first thing in <head>');
  assert.match(page, /http-equiv="refresh" content=\{`0;url=\$\{target\}`\}/, 'meta refresh remains for readers without JavaScript');
  assert.match(page, /name="robots" content="noindex, nofollow"/);
  assert.match(page, /<style>[\s\S]*background: #f6f8f9;[\s\S]*<\/style>/, 'the fallback body is styled, never a bare document');
  const config = read('astro.config.mjs');
  assert.doesNotMatch(config, /'\/launch\/':/, 'no astro.config redirect competes with the page');
  assert.match(config, /!page\.endsWith\('\/launch\/'\)/, 'the page stays out of the sitemap');
});

test('the launch page carries share-card metadata read from the story itself', () => {
  // Link scrapers never follow the redirect (launch-day audit, 2026-08-27):
  // a forwarded /launch link must unfurl exactly like the story it lands on.
  const page = read('src/pages/launch.astro');
  assert.match(page, /getEntry\('story', storyId\)/, 'title, summary and image come from the story entry, never a copied literal');
  for (const tag of ['og:title', 'og:description', 'og:image', 'twitter:card', 'twitter:image']) {
    assert.match(page, new RegExp(`(?:property|name)="${escape(tag)}"`), `/launch must carry ${tag}`);
  }
});

test('the built page carries the replace, the refresh, the clean canonical, and no sitemap entry', () => {
  const page = 'dist/launch/index.html';
  if (!existsSync(new URL(`../../${page}`, import.meta.url))) {
    assert.ok(process.env.CI === undefined, `${page} must exist in the CI build`);
    return;
  }
  const html = read(page);
  const target = `${STORY}?${CAMPAIGN}`;
  assert.match(html, /location\.replace\(target\)/);
  assert.ok(html.includes(JSON.stringify(target)) || html.includes(target.replace(/&/g, '&amp;')), 'the built page names the target');
  assert.match(html, new RegExp(`http-equiv="refresh" content="0;url=${escape(STORY)}\\?${CAMPAIGN.replace(/&/g, '(?:&|&amp;|&#38;)')}"`));
  assert.match(html, new RegExp(`rel="canonical" href="https://orionfold\\.com${escape(STORY)}"`), 'canonical is the story without UTMs');
  assert.match(html, /name="robots" content="noindex, nofollow"/);
  assert.doesNotMatch(html, /Redirecting to/, 'the Astro redirect stub is gone');
  const storyId = STORY.split('/').filter(Boolean).pop();
  const storyTitle = read(`src/content/story/${storyId}.md`).match(/^title: (.+)$/m)[1].trim();
  assert.match(html, new RegExp(`property="og:title" content="${escape(storyTitle)} · Orionfold"`), 'the share title is the story title');
  assert.match(html, new RegExp(`property="og:image" content="https://orionfold\\.com/og/story-${escape(storyId)}\\.jpg"`), 'the share image is the story OG card');
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  const sitemap = read('dist/sitemap-0.xml');
  assert.doesNotMatch(sitemap, /\/launch\//);
});
