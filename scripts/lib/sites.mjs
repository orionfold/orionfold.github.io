// The site registry — single source of truth for the two tracked sites'
// identifiers, shared by the metrics fetchers and the dashboard. Zone ids and
// GA4 property ids are IDENTIFIERS, not secrets (useless without the account
// token / a logged-in session), so they live inline here — nothing about a site
// goes into .env.local except the shared CLOUDFLARE_API_TOKEN. Plain ESM, no deps.
//
// orionfold is the DEFAULT site: its snapshot files keep the bare
// `<source>-<date>.json` name (no migration, unbroken trends). Non-default sites
// get a `-<key>` segment via metricSiteSegment(). Verified identifiers live in
// the multi-site-stats spec (specs/2026-06-27-multi-site-stats-tracking-design.md).

export const SITES = [
  {
    key: 'orionfold',
    domain: 'orionfold.com',
    isDefault: true,
    cfZoneId: '3512c8e3c458c154d8eb47598b1d2846',
    ga4: 'a395553282p538751483',
    gsc: 'sc-domain:orionfold.com',
    lighthouseUrl: 'https://orionfold.com/',
  },
  {
    key: 'ainative',
    domain: 'ainative.business',
    cfZoneId: '506ad3d8f352887fd33766b0858f41f6',
    ga4: 'TBD-first-run', // read during the first seo-aeo-audit roundtrip, then fill in
    gsc: 'sc-domain:ainative.business',
    lighthouseUrl: 'https://ainative.business/',
  },
];

export const DEFAULT_SITE = SITES.find((s) => s.isDefault);

export function siteByKey(key) {
  return SITES.find((s) => s.key === key) ?? null;
}

// '' for the default site → bare `<source>-<date>.json`; '-<key>' otherwise.
// The ONE place the bare-vs-suffixed filename rule lives.
export function metricSiteSegment(siteKey) {
  return siteKey === DEFAULT_SITE.key ? '' : `-${siteKey}`;
}
