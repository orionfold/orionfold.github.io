// Website owns the release declaration, permanent download link and feed
// redirect. Product owns the DMG, feed generation and signature verification.
// Run --live to check the Cloudflare redirect; ordinary builds stay offline.
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
  redirectContract,
  releaseDeclared,
}) {
  const live = exportedBoolean(launchSource, 'ORIONFOLD_FLOW_LIVE');
  const dmgUrl = exportedString(pricingSource, 'FLOW_DMG_URL');

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

  if (parsedDmg && (parsedDmg.host !== STABLE_DMG_HOST || parsedDmg.pathname !== STABLE_DMG_PATH || parsedDmg.hash)) {
    problems.push('FLOW_DMG_URL must be the exact permanent download URL');
  }
  if (redirectContract?.appcastUrl !== 'https://orionfold.com/flow/appcast.xml' ||
      redirectContract?.appcastRedirectStatus !== 301 ||
      redirectContract?.appcastTarget !== 'https://orionfold.supabase.co/storage/v1/object/public/flow-downloads/appcast.xml') {
    problems.push('the Flow appcast redirect contract must point to the product-owned bucket feed');
  }

  return {
    state: problems.length ? 'blocked' : 'release-ready',
    live,
    dmgUrl,
    problems,
  };
}

export function evaluateLiveRedirect(response, contract) {
  const problems = [];
  if (response.status !== contract.appcastRedirectStatus) problems.push('appcast redirect status differs from the contract');
  if (response.headers.get('location') !== contract.appcastTarget) problems.push('appcast redirect destination differs from the contract');
  return problems;
}

async function main() {
  const [launchSource, pricingSource, redirectSource] = await Promise.all([
    readFile(resolve(ROOT, 'src/data/launch.ts'), 'utf8'),
    readFile(resolve(ROOT, 'src/data/flow-pricing.ts'), 'utf8'),
    readFile(resolve(ROOT, 'src/data/flow-release-contract.json'), 'utf8'),
  ]);
  const result = evaluateFlowReleaseBoundary({
    launchSource,
    pricingSource,
    redirectContract: JSON.parse(redirectSource),
    releaseDeclared: process.env.FLOW_RELEASE_DECLARED,
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
  if (process.argv.includes('--live')) {
    const contract = JSON.parse(redirectSource);
    const response = await fetch(contract.appcastUrl, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(15000) });
    const problems = evaluateLiveRedirect(response, contract);
    if (problems.length) throw new Error(problems.join('; '));
    console.log('[flow-release-boundary] live: exact appcast redirect verified');
  }
  console.log('[flow-release-boundary] pass: operator declaration, permanent download and redirect contract');
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) await main();
