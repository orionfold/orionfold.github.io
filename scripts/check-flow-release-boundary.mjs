// Fail closed at the GitHub Pages deployment boundary for Orionfold Flow.
//
// Local launch rehearsal deliberately renders the released layout before the
// signed package exists. That is useful for review, but it must never become an
// accidental public release. The deployment workflow calls this script before
// it builds. A live Flow surface therefore needs all three independent facts:
// an operator declaration, a permanent public DMG, and a signed non-empty
// Sparkle appcast whose current enclosure is that same DMG.
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { verifyFeedSignature } from './lib/sparkle-feed.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const exportedBoolean = (source, name) => {
  const match = source.match(new RegExp(`export\\s+const\\s+${name}\\s*=\\s*(true|false)\\s*;`));
  if (!match) throw new Error(`Could not read ${name} from its source`);
  return match[1] === 'true';
};

const exportedString = (source, name) => {
  const match = source.match(new RegExp(`export\\s+const\\s+${name}\\s*=\\s*(["'])(.*?)\\1\\s*;`));
  if (!match) throw new Error(`Could not read ${name} from its source`);
  return match[2];
};

export function evaluateFlowReleaseBoundary({
  launchSource,
  pricingSource,
  appcastSource,
  releaseDeclared,
  // Optional so older callers keep working; when present, the feed's signature
  // block is verified against it rather than merely detected.
  releasesSource,
}) {
  const live = exportedBoolean(launchSource, 'ORIONFOLD_FLOW_LIVE');
  const dmgUrl = exportedString(pricingSource, 'FLOW_DMG_URL');
  const publicEdKeyBase64 = releasesSource
    ? exportedString(releasesSource, 'FEED_PUBLIC_ED_KEY_BASE64')
    : null;

  if (!live) {
    return { state: 'launch-dark', live, dmgUrl, problems: [] };
  }

  const problems = [];
  if (releaseDeclared !== 'true') {
    problems.push('the operator release declaration is absent');
  }

  let parsedDmg;
  try {
    parsedDmg = new URL(dmgUrl);
  } catch {
    problems.push('FLOW_DMG_URL is not an absolute URL');
  }
  if (/placeholder|\.invalid(?:\/|$)/i.test(dmgUrl)) {
    problems.push('FLOW_DMG_URL is still the rehearsal placeholder');
  }
  if (parsedDmg) {
    if (parsedDmg.protocol !== 'https:') problems.push('FLOW_DMG_URL must use HTTPS');
    if (parsedDmg.username || parsedDmg.password) problems.push('FLOW_DMG_URL must not carry credentials');
    if (parsedDmg.search) problems.push('FLOW_DMG_URL must not carry a query string');
    if (!parsedDmg.pathname.toLowerCase().endsWith('.dmg')) problems.push('FLOW_DMG_URL must name a DMG');
    if (parsedDmg.hostname === 'orionfold.com') {
      problems.push('the DMG must use the external download host, not the public website repository');
    }
  }

  const item = appcastSource.match(/<item>[\s\S]*?<\/item>/)?.[0] ?? '';
  if (!item) {
    problems.push('the Sparkle appcast has no published release item');
  } else {
    const enclosureUrl = item.match(/<enclosure\b[^>]*\burl="([^"]+)"/)?.[1];
    if (enclosureUrl !== dmgUrl) {
      problems.push('the current appcast enclosure does not match FLOW_DMG_URL');
    }
    if (!/\bsparkle:edSignature="[A-Za-z0-9+/=]+"/.test(item)) {
      problems.push('the current DMG has no Sparkle EdDSA signature');
    }
    if (!/<sparkle:version>\d+<\/sparkle:version>/.test(item)) {
      problems.push('the current appcast item has no numeric CFBundleVersion');
    }
  }

  if (item && !/<!--\s*sparkle-signatures:[\s\S]*?edSignature:\s*[A-Za-z0-9+/=]+[\s\S]*?length:\s*\d+[\s\S]*?-->/.test(appcastSource)) {
    problems.push('the non-empty Sparkle feed has no appended signed-feed block');
  } else if (item && publicEdKeyBase64) {
    // A block that is present but wrong is the same failure to a user as no
    // block at all, minus the honesty. Verify it the way the app will.
    const verdict = verifyFeedSignature(appcastSource, publicEdKeyBase64);
    if (!verdict.valid) {
      problems.push(`the signed-feed block does not verify against the app's EdDSA public key (${verdict.reason})`);
    }
  }

  return {
    state: problems.length ? 'blocked' : 'release-ready',
    live,
    dmgUrl,
    problems,
  };
}

async function main() {
  const [launchSource, pricingSource, appcastSource, releasesSource] = await Promise.all([
    readFile(resolve(ROOT, 'src/data/launch.ts'), 'utf8'),
    readFile(resolve(ROOT, 'src/data/flow-pricing.ts'), 'utf8'),
    readFile(resolve(ROOT, 'public/flow/appcast.xml'), 'utf8'),
    readFile(resolve(ROOT, 'src/data/flow-releases.ts'), 'utf8'),
  ]);
  const result = evaluateFlowReleaseBoundary({
    launchSource,
    pricingSource,
    appcastSource,
    releaseDeclared: process.env.FLOW_RELEASE_DECLARED,
    releasesSource,
  });

  if (result.state === 'launch-dark') {
    console.log('[flow-release-boundary] pass: Flow is launch-dark');
    return;
  }
  if (result.problems.length) {
    console.error('[flow-release-boundary] refusing the public build:');
    for (const problem of result.problems) console.error(`- ${problem}`);
    process.exitCode = 1;
    return;
  }
  console.log('[flow-release-boundary] pass: operator declaration, DMG, and signed appcast agree');
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) await main();
