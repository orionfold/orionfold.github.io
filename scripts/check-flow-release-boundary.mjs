// Fail closed at the GitHub Pages deployment boundary for Orionfold Flow.
//
// Local launch rehearsal deliberately renders the released layout before the
// signed package exists. That is useful for review, but it must never become an
// accidental public release. The deployment workflow calls this script before
// it builds. A live Flow surface therefore needs three independent facts: an
// operator declaration, a permanent public DMG at the stable download URL, and
// a signed non-empty Sparkle appcast.
//
// WHAT CHANGED 2026-08-29, AND WHY THE ENCLOSURE COMPARISON HAD TO GO (ledger
// 20:55 / 21:12 PDT). This script used to require that FLOW_DMG_URL equal the
// newest appcast enclosure. That held only while the CTA was rewritten to a new
// versioned path on every release. The CTA is now a STABLE URL that the product
// lane overwrites in place, so it can never again equal a versioned enclosure —
// the old assertion would fail by construction and block every site deploy,
// including deploys with nothing to do with Flow.
//
// It is deliberately NOT replaced by a sha256 comparison against the published
// artifact. That check needs a 46 MB download at deploy time, which would make
// an unrelated deploy fail on a network blip; and after the feed moved out of
// this repo it would have this lane asserting, over the network, an invariant
// that belongs to the lane that publishes it. The product lane already verifies
// exactly that — publish-dmg.sh hashes the stable object against the versioned
// release on every publish, and its feed step verifies the newest entry's
// edSignature against the real bytes before rendering (ledger 21:05 / 21:12).
//
// So what this gate still owns is what is local and public-facing: the CTA must
// be a real HTTPS DMG on the download host, never a placeholder, never this
// public repo, and it must not go live without the operator declaration. Every
// signature guarantee below is unchanged.
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { verifyFeedSignature } from './lib/sparkle-feed.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// The one permanent download object. Kept here rather than imported so this
// gate still fails if src/data/flow-pricing.ts is edited to point elsewhere.
const STABLE_DMG_HOST = 'orionfold.supabase.co';
const STABLE_DMG_PATH = '/storage/v1/object/public/flow-downloads/Orionfold-Flow.dmg';

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

  // The CTA points at the stable object the product lane overwrites on each
  // release. Pinning the exact path is what keeps this a real assertion rather
  // than a vague "some DMG somewhere": a versioned path here would mean the
  // per-release CTA edit had crept back in.
  if (parsedDmg && parsedDmg.hostname === STABLE_DMG_HOST && parsedDmg.pathname !== STABLE_DMG_PATH) {
    problems.push(
      `FLOW_DMG_URL must be the stable download object (${STABLE_DMG_PATH}), not a per-release versioned path`,
    );
  }

  const item = appcastSource.match(/<item>[\s\S]*?<\/item>/)?.[0] ?? '';
  if (!item) {
    problems.push('the Sparkle appcast has no published release item');
  } else {
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
  console.log('[flow-release-boundary] pass: operator declaration, stable DMG, and signed appcast agree');
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) await main();
