// The LCP image on each hero surface, asserted on the BUILT HTML.
//
// WHY OUTPUT AND NOT SOURCE. The rule "the product shot must not compete with
// the homepage LCP" was guarded by a regex over the component source. When the
// shared hero learned to prioritise per background on 2026-08-30, that proxy
// fired on a conditional that was in fact correct, while a real defect had sat
// in the output for weeks: on /flow/ the LCP-candidate product shot shipped
// `loading="lazy"` and a decorative 40px app icon shipped `eager`. Source text
// could not see either fact. This file reads what the browser receives.
//
// THE INVARIANT, one line: exactly one eager+high image per hero, and it is the
// largest thing painted in the first viewport.
//   racing (homepage)  — full-bleed campaign photograph is the LCP
//   blueprint (/flow/) — background is a pure-CSS grid, so the SHOT is the LCP
//
// Skips when dist/ is absent so a bare `node --test` run stays green; the
// deploy chain always builds first.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const distPath = (p) => new URL(`../../dist/${p}`, import.meta.url);
const pages = ['index.html', 'flow/index.html'];

if (!pages.every((p) => existsSync(distPath(p)))) {
  console.log('# skip flow-hero-lcp-priority: dist/ not built');
  process.exit(0);
}

/** Every <img> in the document head-to-first-hero region, as attribute maps. */
const imagesIn = (html) =>
  [...html.matchAll(/<img[^>]*>/g)].map((m) => {
    const tag = m[0];
    const attr = (name) => (tag.match(new RegExp(`${name}="([^"]*)"`)) || [, null])[1];
    const src = attr('src') || '';
    return {
      name: src.split('/').pop().split('.')[0],
      loading: attr('loading'),
      fetchpriority: attr('fetchpriority'),
    };
  });

const firstNamed = (imgs, fragment) => imgs.find((i) => i.name.includes(fragment));

// ---- homepage: the campaign photograph is the LCP -------------------------
const home = imagesIn(readFileSync(distPath('index.html'), 'utf8'));
const campaign = firstNamed(home, 'pit-stop-daylight-wide');
assert.ok(campaign, 'homepage hero still renders the campaign art');
assert.equal(campaign.loading, 'eager', 'homepage LCP campaign art is eager');
assert.equal(campaign.fetchpriority, 'high', 'homepage LCP campaign art is fetchpriority=high');

const homeShot = firstNamed(home, 'home-hero-welcome');
assert.ok(homeShot, 'homepage hero still renders the product shot');
assert.equal(
  homeShot.loading,
  'lazy',
  'homepage product shot stays lazy — it must not compete with the campaign LCP',
);

// ---- /flow/: no background image, so the product shot IS the LCP ----------
const flow = imagesIn(readFileSync(distPath('flow/index.html'), 'utf8'));
const flowShot = firstNamed(flow, 'flow-hero-project');
assert.ok(flowShot, '/flow/ hero still renders the Project Plan product shot');
assert.equal(
  flowShot.loading,
  'eager',
  '/flow/ LCP product shot is eager — a lazy LCP image is the documented anti-pattern',
);
assert.equal(
  flowShot.fetchpriority,
  'high',
  '/flow/ LCP product shot is fetchpriority=high',
);

// ---- the decorative badge never outranks a real LCP candidate ------------
// A 40px alt="" icon held `eager` on both heroes while the shot below it was
// lazy. It carries no meaning and must never win early bandwidth.
for (const [label, imgs] of [['homepage', home], ['/flow/', flow]]) {
  for (const icon of imgs.filter((i) => i.name.includes('app-icon'))) {
    assert.equal(
      icon.loading,
      'lazy',
      `${label}: the decorative 40px app icon stays lazy (alt="", never an LCP candidate)`,
    );
  }
}

// ---- exactly one eager+high image per page --------------------------------
for (const [label, imgs] of [['homepage', home], ['/flow/', flow]]) {
  const prioritised = imgs.filter((i) => i.loading === 'eager' && i.fetchpriority === 'high');
  assert.equal(
    prioritised.length,
    1,
    `${label}: exactly one image is eager+high, got ${prioritised.length} (${prioritised.map((i) => i.name).join(', ')})`,
  );
}

console.log('# flow-hero-lcp-priority: LCP priority correct on both heroes');
