// scripts/sync-flow-release.mjs
// Refresh src/data/flow-release.json, the one place the site's Flow version
// comes from ("Flow 2.1"), and the version phrases in public/llms.txt.
//
// Reads the LIVE update feed (orionfold.com/flow/appcast.xml, which redirects
// to the signed feed in storage), never public/flow/appcast.xml in this repo.
// The first <item> is the newest release. Or pass a saved feed file as the
// first argument.
//
// Pages, OG cards and tests read the JSON. llms.txt is a static file, so this
// script rewrites its version phrases too. After a Flow release, run once and
// rebuild:
//   node scripts/sync-flow-release.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const FEED = 'https://orionfold.com/flow/appcast.xml';

// The llms.txt phrases that name the current version. The test
// (scripts/test/flow-release.test.mjs) checks each one against the JSON.
// Not "On Flow 2.0.3, …": a caveat names the build it was found on, and
// rewriting it once invented 2.1.3, then 2.2.3 (2026-10-05).
export const LLMS_VERSION_PHRASES = [
  /(\[Flow\]\(https:\/\/orionfold\.com\/flow\/\): Flow )\d+\.\d+( Living Documents for Mac)/,
  /(## Flow Paths \(Flow )\d+\.\d+( walkthroughs)/,
  /(Real jobs you can do in Flow )\d+\.\d+( on a Mac)/,
];

export function readNewestRelease(xml) {
  const item = xml.split(/<item>/)[1];
  if (!item) throw new Error('feed has no <item>');
  const release = item.match(/<sparkle:shortVersionString>([\d.]+)</)?.[1];
  const build = item.match(/<sparkle:version>(\d+)</)?.[1];
  if (!release || !build) throw new Error('newest feed item has no shortVersionString/version');
  return { release, build, version: release.split('.').slice(0, 2).join('.') };
}

async function main() {
  const xml = process.argv[2]
    ? readFileSync(process.argv[2], 'utf8')
    : await fetch(FEED, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (orionfold-website sync)' } }).then((r) => {
      if (!r.ok) throw new Error(`${FEED}: HTTP ${r.status}`);
      return r.text();
    });
  const { version, release, build } = readNewestRelease(xml);
  const json = {
    source: { feed: FEED, read: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }) },
    version,
    release,
    build,
  };
  writeFileSync(new URL('../src/data/flow-release.json', import.meta.url), `${JSON.stringify(json, null, 2)}\n`);

  const llmsUrl = new URL('../public/llms.txt', import.meta.url);
  let llms = readFileSync(llmsUrl, 'utf8');
  for (const phrase of LLMS_VERSION_PHRASES) {
    if (!llms.match(phrase)) throw new Error(`llms.txt lost a version phrase: ${phrase}`);
    llms = llms.replace(phrase, `$1${version}$2`);
  }
  writeFileSync(llmsUrl, llms);
  console.log(`flow-release: Flow ${version} (release ${release}, build ${build}); llms.txt updated`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
