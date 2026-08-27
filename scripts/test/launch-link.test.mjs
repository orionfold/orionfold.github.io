// /launch is the one link inside the Flow launch email. It must stay a short
// first-party path that lands on the launch story with the campaign UTMs
// attached, so GA4 counts every subscriber who arrived from the email while the
// email itself carries no tracking domain and no query string.
import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');
const STORY = '/story/the-pit-crew-that-never-touches-the-wheel/';
const CAMPAIGN = 'utm_source=launch-email&utm_medium=email&utm_campaign=flow-launch&utm_content=story';

test('the launch link redirects to the launch story with the campaign attribution', () => {
  const config = read('astro.config.mjs');
  assert.match(config, new RegExp(`'/launch/': '${STORY}\\?${CAMPAIGN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`));
  assert.match(config, /!page\.endsWith\('\/launch\/'\)/, 'the redirect page stays out of the sitemap');
});

test('the built redirect page sends the reader on with the UTMs and asks not to be indexed', () => {
  const page = 'dist/launch/index.html';
  if (!existsSync(new URL(`../../${page}`, import.meta.url))) {
    assert.ok(process.env.CI === undefined, `${page} must exist in the CI build`);
    return;
  }
  const html = read(page);
  assert.match(html, /http-equiv="refresh"/i);
  assert.match(html, new RegExp(`${STORY.replace(/\//g, '\\/')}\\?${CAMPAIGN.replace(/&/g, '(?:&|&amp;)')}`));
  assert.match(html, /name="robots" content="noindex"/i);
  const sitemap = read('dist/sitemap-0.xml');
  assert.doesNotMatch(sitemap, /\/launch\//);
});
