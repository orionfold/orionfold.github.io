#!/usr/bin/env node
// Local artifact integrity / recovery evidence tools. This program never calls
// GitHub, uploads an archive, extracts an archive, or performs a deployment.
import { createHash } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { STEPS } from './preflight.mjs';

export const RELEASE_REPOSITORY = 'orionfold/orionfold.github.io';
export const RELEASE_WORKFLOW = '.github/workflows/deploy.yml';
export const RECOVERY_WORKFLOW = '.github/workflows/recover.yml';
export const RECOVERY_BASELINE_SHA = 'bbbf645b02349c4be744e0b3505c933dc616c54e';
export const RELEASE_CHECKS = STEPS.map(step => step.name);
// New canonical URLs must survive any return to the baseline presentation.
// The local overlay tools consume this same contract; release eligibility checks
// require page, social and discovery surfaces before considering provenance.
export const RECOVERY_COMPATIBILITY_ROUTES = Object.freeze([
  { route: '/essay/', page: 'essay/index.html', og: 'og/essay.jpg' },
  { route: '/manifesto/', page: 'manifesto/index.html', og: 'og/manifesto.jpg' },
  { route: '/flow/night-shift/', page: 'flow/night-shift/index.html', og: 'og/flow-night-shift.jpg' },
  { route: '/flow/living-documents/', page: 'flow/living-documents/index.html', og: 'og/flow-living-documents.jpg' },
  { route: '/flow/settings/', page: 'flow/settings/index.html', og: 'og/flow-settings.jpg' },
]);
export const RECOVERY_REQUIRED_PATHS = Object.freeze([
  'index.html', 'flow/index.html',
  ...RECOVERY_COMPATIBILITY_ROUTES.flatMap(({ page, og }) => [page, og]),
  'sitemap-index.xml', 'sitemap-0.xml', 'story/rss.xml', 'llms.txt',
]);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sha = value => createHash('sha256').update(value).digest('hex');
const sha40 = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value);
const decimal = value => /^\d+$/.test(String(value));
const fail = message => { throw new Error(message); };
export function safeRelativePath(value) {
  return typeof value === 'string' && value.length > 0 && !isAbsolute(value) &&
    !/[\\\x00-\x1f\x7f]/.test(value) && value.split('/').every(part => part && part !== '.' && part !== '..');
}
export function inventory(siteDirectory) {
  const root = realpathSync(siteDirectory);
  const files = [];
  function visit(directory) {
    for (const name of readdirSync(directory).sort()) {
      const full = resolve(directory, name);
      const path = relative(root, full).split('\\').join('/');
      if (!safeRelativePath(path)) fail('Unsafe artifact path.');
      const stat = lstatSync(full);
      if (stat.isSymbolicLink() || (stat.isFile() && stat.nlink > 1)) fail(`Links are not allowed in an artifact: ${path}`);
      if (stat.isDirectory()) visit(full);
      else if (stat.isFile()) files.push({ path, bytes: stat.size, sha256: sha(readFileSync(full)) });
      else fail(`Unsupported artifact entry: ${path}`);
    }
  }
  visit(root);
  return files.sort((a, b) => a.path.localeCompare(b.path, 'en'));
}
export function createManifest(siteDirectory, provenance) {
  const files = inventory(siteDirectory);
  if (!files.some(file => file.path === 'index.html')) fail('Artifact is missing index.html.');
  if (!sha40(provenance.sourceSha) || !sha40(provenance.sourceTree)) fail('Invalid source provenance.');
  return {
    schemaVersion: 1, createdAt: new Date().toISOString(),
    provenance,
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    contentSha256: sha(JSON.stringify(files)), files,
  };
}
export function verifyManifest(siteDirectory, manifest) {
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.files)) fail('Unsupported release manifest.');
  const paths = new Set();
  for (const file of manifest.files) {
    if (!safeRelativePath(file.path) || paths.has(file.path) || !Number.isSafeInteger(file.bytes) || file.bytes < 0 || !/^[0-9a-f]{64}$/.test(file.sha256)) fail('Invalid manifest file entry.');
    paths.add(file.path);
  }
  const actual = inventory(siteDirectory);
  if (JSON.stringify(actual) !== JSON.stringify(manifest.files)) fail('Artifact files differ from the retained manifest.');
  if (sha(JSON.stringify(actual)) !== manifest.contentSha256 || actual.length !== manifest.fileCount || actual.reduce((sum, file) => sum + file.bytes, 0) !== manifest.totalBytes) fail('Manifest totals or content hash do not match.');
  return { verified: true, fileCount: actual.length, totalBytes: manifest.totalBytes, contentSha256: manifest.contentSha256 };
}

// The evidence must come from separately checked GitHub API records, not from
// the artifact itself. This validates consistency only: JSON on disk is NOT
// authenticated platform proof. The result can never authorize a deployment.
export function validateRecoveryEvidence(manifest, manifestBytes, evidence, now = Date.now()) {
  const p = manifest.provenance;
  const { approvedRecovery: approved, workflowRun: run, artifact, expectedCurrent, observedCurrent } = evidence;
  if (p.mode !== 'ci-production' || p.dirty !== false || p.repository !== RELEASE_REPOSITORY || p.workflowPath !== RELEASE_WORKFLOW || p.ref !== 'refs/heads/main') fail('Recovery artifact is not from the allowlisted production workflow.');
  if (JSON.stringify(p.checks) !== JSON.stringify(RELEASE_CHECKS)) fail('Required release checks are missing.');
  if (!sha40(p.sourceSha) || !decimal(p.runId) || !decimal(p.runAttempt)) fail('Invalid retained source/run identity.');
  if (!approved || approved.sourceSha !== p.sourceSha || String(approved.runId) !== String(p.runId) || approved.manifestSha256 !== sha(manifestBytes)) fail('Recovery source or manifest is not explicitly allowlisted.');
  if (!run || run.repository !== RELEASE_REPOSITORY || run.path !== RELEASE_WORKFLOW || run.head_sha !== p.sourceSha || String(run.id) !== String(p.runId) || String(run.run_attempt) !== String(p.runAttempt) || run.head_branch !== 'main' || !['push', 'workflow_dispatch'].includes(run.event) || run.status !== 'completed' || run.conclusion !== 'success') fail('Recovery source workflow was not successful in this repository.');
  const expectedName = `site-recovery-${p.sourceSha}-${p.runId}-${p.runAttempt}`;
  if (!artifact || !decimal(artifact.id) || artifact.name !== expectedName || String(artifact.id) !== String(approved.artifactId) || String(artifact.workflow_run_id) !== String(p.runId) || artifact.expired !== false || Date.parse(artifact.expires_at) <= now + 300000 || !Number.isFinite(Date.parse(artifact.expires_at))) fail('Retained artifact identity or expiry is invalid.');
  for (const current of [expectedCurrent, observedCurrent]) {
    if (!current || current.repository !== RELEASE_REPOSITORY || !sha40(current.sourceSha) || !decimal(current.runId) || !decimal(current.artifactId)) fail('Exact current production identity is required.');
  }
  for (const key of ['sourceSha', 'runId', 'artifactId']) if (String(expectedCurrent[key]) !== String(observedCurrent[key])) fail('Current production changed: whole-site recovery would overwrite a later deployment.');
  const age = now - Date.parse(observedCurrent.observedAt);
  if (!Number.isFinite(age) || age < 0 || age > 300000) fail('Current production evidence is not fresh.');
  for (const path of [...RECOVERY_REQUIRED_PATHS, ...(evidence.requiredPaths || [])]) if (!safeRelativePath(path) || !manifest.files.some(file => file.path === path)) fail('Recovery compatibility overlay is missing a required path.');
  return {
    dryRunOnly: true, checksPassed: true, deployAllowed: false,
    recoverySourceSha: p.sourceSha,
    expectedCurrentSourceSha: expectedCurrent.sourceSha,
    reason: 'Remote recovery promotion is unavailable. Platform evidence must be authenticated and rechecked under the protected deployment concurrency lock before a future promotion implementation can be used.',
  };
}

function provenance(mode) {
  const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  const sourceSha = git('rev-parse', 'HEAD');
  const sourceTree = git('rev-parse', 'HEAD^{tree}');
  const dirty = Boolean(git('status', '--porcelain', '--untracked-files=normal'));
  const env = process.env;
  if (mode === 'ci') {
    if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_REPOSITORY !== RELEASE_REPOSITORY || env.GITHUB_SHA !== sourceSha || env.GITHUB_REF !== 'refs/heads/main' || env.GITHUB_WORKFLOW_REF !== `${RELEASE_REPOSITORY}/${RELEASE_WORKFLOW}@refs/heads/main` || dirty) fail('CI provenance requires the clean, allowlisted main workflow checkout.');
    if ((env.PUBLIC_SERVICE_MODE || 'production') !== 'production' || env.PUBLIC_RELAY_OPERATOR_WORKSHOP_CHECKOUT !== 'true') fail('Recovery retention requires the production build configuration.');
    if (!decimal(env.GITHUB_RUN_ID) || !decimal(env.GITHUB_RUN_ATTEMPT) || !decimal(env.RELEASE_PAGES_ARTIFACT_ID)) fail('Missing CI run identity.');
  } else if (mode !== 'local') fail('Capture mode must be local or ci.');
  return {
    mode: mode === 'ci' ? 'ci-production' : 'local-reconstruction', repository: RELEASE_REPOSITORY,
    sourceSha, sourceTree, dirty,
    workflowPath: mode === 'ci' ? RELEASE_WORKFLOW : null,
    ref: mode === 'ci' ? env.GITHUB_REF : null,
    runId: mode === 'ci' ? env.GITHUB_RUN_ID : null,
    runAttempt: mode === 'ci' ? env.GITHUB_RUN_ATTEMPT : null,
    pagesArtifactId: mode === 'ci' ? env.RELEASE_PAGES_ARTIFACT_ID : null,
    checks: mode === 'ci' ? RELEASE_CHECKS : [],
    node: process.version,
    lockfileSha256: sha(readFileSync(resolve(ROOT, 'package-lock.json'))),
    publicBuildFlags: {
      PUBLIC_SERVICE_MODE: env.PUBLIC_SERVICE_MODE || 'production',
      PUBLIC_RELAY_OPERATOR_WORKSHOP_CHECKOUT: env.PUBLIC_RELAY_OPERATOR_WORKSHOP_CHECKOUT === 'true',
      PUBLIC_LIVING_DOCUMENTS_SIGNUP_ENABLED: env.PUBLIC_LIVING_DOCUMENTS_SIGNUP_ENABLED === 'true',
      PUBLIC_FLOW_ENTERPRISE_CONTACT_ENABLED: env.PUBLIC_FLOW_ENTERPRISE_CONTACT_ENABLED === 'true',
    },
  };
}
function main(args) {
  const [command, ...rest] = args;
  const options = {};
  for (let i = 0; i < rest.length; i += 2) {
    if (!/^--[a-z-]+$/.test(rest[i]) || !rest[i + 1] || rest[i + 1].startsWith('--')) fail('Use named option/value pairs.');
    options[rest[i].slice(2)] = rest[i + 1];
  }
  if (!options.site || !options.manifest) fail('Provide --site and --manifest local paths.');
  const site = realpathSync(resolve(options.site));
  const manifestPath = resolve(options.manifest);
  const relativeManifest = relative(site, manifestPath);
  if (relativeManifest !== '..' && !relativeManifest.startsWith('../') && !isAbsolute(relativeManifest)) fail('Keep the release manifest outside the site output.');
  if (command === 'capture') {
    const manifest = createManifest(site, provenance(options.mode || 'local'));
    mkdirSync(dirname(manifestPath), { recursive: true });
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(JSON.stringify({ captured: true, mode: manifest.provenance.mode, fileCount: manifest.fileCount, contentSha256: manifest.contentSha256 }));
    return;
  }
  const bytes = readFileSync(manifestPath);
  const manifest = JSON.parse(bytes);
  const verified = verifyManifest(site, manifest);
  if (command === 'verify') { console.log(JSON.stringify(verified)); return; }
  if (command === 'recovery-dry-run' && options.evidence) {
    console.log(JSON.stringify(validateRecoveryEvidence(manifest, bytes, JSON.parse(readFileSync(resolve(options.evidence))))));
    return;
  }
  fail('Supported commands: capture, verify, recovery-dry-run. No deployment command exists.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
