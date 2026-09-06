#!/usr/bin/env node
// Authenticated artifact preparation/verification. Deployment remains in the
// protected workflow's official Pages action; this script never deploys.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createManifest, verifyManifest, RELEASE_REPOSITORY, RELEASE_WORKFLOW, RECOVERY_WORKFLOW, RECOVERY_BASELINE_SHA, RELEASE_CHECKS, RECOVERY_REQUIRED_PATHS } from './release-artifact.mjs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API = `https://api.github.com/repos/${RELEASE_REPOSITORY}`;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sha40 = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value);
const id = value => /^[1-9][0-9]*$/.test(String(value));
const requireValue = (ok, message) => { if (!ok) throw new Error(message); };
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const jsonFile = path => JSON.parse(readFileSync(path, 'utf8'));
const save = (path, value) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); };
export function recipeHash() {
  return hash(['scripts/recovery-overlay.py', 'scripts/migration-recovery.mjs', 'scripts/release-artifact.mjs'].map(path => `${path}\n${hash(readFileSync(resolve(ROOT, path)))}`).join('\n'));
}
export function jobFromStatus(status) {
  const match = status?.log_url?.match(/^https:\/\/github\.com\/orionfold\/orionfold\.github\.io\/actions\/runs\/([1-9][0-9]*)\/job\/([1-9][0-9]*)$/);
  requireValue(match, 'Deployment status has no trusted workflow-run/job binding.');
  return { runId: match[1], jobId: match[2] };
}
export const runFromStatus = status => jobFromStatus(status).runId;
function validateRunIdentity(run, expectedSha, workflow) {
  requireValue(sha40(expectedSha) && run?.repository?.full_name === RELEASE_REPOSITORY && run.path === workflow && run.head_sha === expectedSha && run.head_branch === 'main' && ['push', 'workflow_dispatch'].includes(run.event) && id(run.id) && id(run.run_attempt), 'Source workflow identity is invalid.');
}
export function validateRun(run, expectedSha, workflow = RELEASE_WORKFLOW) {
  validateRunIdentity(run, expectedSha, workflow);
  requireValue(run.status === 'completed' && run.conclusion === 'success', 'Source workflow attempt was not successful.');
}
export async function observeCurrent(api, ownRunId) {
  const deployments = await api('/deployments?environment=github-pages&per_page=100');
  requireValue(Array.isArray(deployments), 'Invalid deployments response.');
  for (const deployment of deployments) {
    requireValue(id(deployment.id) && sha40(deployment.sha) && deployment.environment === 'github-pages', 'Invalid Pages deployment record.');
    const statuses = await api(`/deployments/${deployment.id}/statuses?per_page=1`);
    requireValue(Array.isArray(statuses) && statuses.length === 1, 'Ambiguous deployment status.');
    const status = statuses[0];
    const { runId, jobId } = jobFromStatus(status);
    if (['queued', 'pending', 'waiting', 'in_progress'].includes(status.state)) {
      if (String(runId) === String(ownRunId)) continue;
      throw new Error('Another Pages deployment is pending; recovery identity is not stable.');
    }
    if (status.state === 'inactive') continue;
    requireValue(['success', 'failure', 'error'].includes(status.state), 'Unknown Pages deployment state.');
    const job = await api(`/actions/jobs/${jobId}`);
    requireValue(String(job.id) === jobId && String(job.run_id) === runId && id(job.run_attempt) && job.head_sha === deployment.sha, 'Deployment job identity differs.');
    // A run's latest attempt is mutable. Bind to this deployment's exact job
    // and immutable attempt, including while another attempt is being rerun.
    const run = await api(`/actions/runs/${runId}/attempts/${job.run_attempt}`);
    requireValue([RELEASE_WORKFLOW, RECOVERY_WORKFLOW].includes(run.path), 'Current Pages workflow is not allowlisted.');
    validateRunIdentity(run, deployment.sha, run.path);
    requireValue(String(run.id) === runId && String(run.run_attempt) === String(job.run_attempt), 'Deployment attempt identity differs.');
    const stepName = run.path === RELEASE_WORKFLOW ? 'Deploy to GitHub Pages' : 'Deploy verified recovery to GitHub Pages';
    const steps = job.steps?.filter(step => step.name === stepName);
    requireValue(steps?.length === 1, 'Cannot identify the Pages promotion step.');
    const effect = steps[0];
    if (effect.conclusion === 'skipped' && status.state !== 'success') continue;
    // A later purge/smoke failure must not hide an already successful Pages
    // promotion. A failed/cancelled promotion is ambiguous, so never fall back
    // to an earlier deployment merely because the environment reports failure.
    requireValue(effect.status === 'completed' && effect.conclusion === 'success', 'Pages promotion effect is uncertain.');
    return { deploymentId: String(deployment.id), sourceSha: deployment.sha, runId, runAttempt: String(job.run_attempt), jobId, workflowPath: run.path, observedAt: new Date().toISOString() };
  }
  throw new Error('No unambiguous active successful Pages deployment found.');
}
export function migrationScope(current, candidateSha, ancestor, directChild) {
  requireValue(ancestor, 'Fixed recovery baseline must be an ancestor.');
  requireValue(sha40(candidateSha) && candidateSha !== RECOVERY_BASELINE_SHA, 'Recovery requires a new candidate commit.');
  const eligible = directChild === true && current.workflowPath === RELEASE_WORKFLOW && (current.sourceSha === RECOVERY_BASELINE_SHA || current.sourceSha === candidateSha);
  return { eligible, baselineSha: RECOVERY_BASELINE_SHA, candidateSha, directChild: directChild === true, current, reason: eligible ? 'Direct-child migration on the fixed baseline or its exact rerun.' : 'Later/unrelated release: migration compatibility artifact skipped.' };
}
export function assertCurrent(expected, observed, provenance) {
  requireValue(id(expected.deploymentId) && sha40(expected.sourceSha), 'Explicit current deployment ID and SHA are required.');
  requireValue(String(expected.deploymentId) === observed.deploymentId && expected.sourceSha === observed.sourceSha, 'Current production changed; refusing recovery.');
  requireValue(observed.sourceSha === provenance.sourceSha && observed.runId === String(provenance.runId) && observed.runAttempt === String(provenance.runAttempt) && observed.workflowPath === RELEASE_WORKFLOW, 'Recovery is limited to the artifact candidate deployment.');
}
export function validateCompatibleManifest(manifest, bytes, proofBytes, approvedDigest, run, artifact, now = Date.now()) {
  const p = manifest.provenance;
  requireValue(/^[0-9a-f]{64}$/.test(approvedDigest) && hash(bytes) === approvedDigest, 'Approved manifest digest does not match.');
  requireValue(p?.mode === 'ci-compatible-migration' && p.repository === RELEASE_REPOSITORY && p.workflowPath === RELEASE_WORKFLOW && p.ref === 'refs/heads/main' && p.dirty === false && sha40(p.sourceSha) && sha40(p.sourceTree), 'Compatibility source is not trusted main CI.');
  requireValue(p.baseline?.sourceSha === RECOVERY_BASELINE_SHA && sha40(p.baseline.sourceTree) && /^[0-9a-f]{64}$/.test(p.baseline.lockfileSha256) && p.baseline.ancestor === true && p.baseline.directParent === true, 'Wrong baseline reconstruction provenance.');
  requireValue(p.recipeSha256 === recipeHash() && p.overlayProofSha256 === hash(proofBytes) && JSON.stringify(p.checks) === JSON.stringify(RELEASE_CHECKS), 'Recipe, proof or required checks differ.');
  requireValue(p.productionAtPreparation?.workflowPath === RELEASE_WORKFLOW && [RECOVERY_BASELINE_SHA, p.sourceSha].includes(p.productionAtPreparation.sourceSha) && id(p.productionAtPreparation.deploymentId), 'Artifact was prepared outside this migration.');
  validateRun(run, p.sourceSha);
  requireValue(String(run.id) === String(p.runId) && String(run.run_attempt) === String(p.runAttempt), 'Source run or attempt differs.');
  requireValue(artifact?.name === `site-compatible-recovery-${p.sourceSha}-${p.runId}-${p.runAttempt}` && String(artifact.workflow_run?.id) === String(p.runId) && artifact.workflow_run?.head_sha === p.sourceSha && id(artifact.id) && artifact.expired === false && Number.isFinite(Date.parse(artifact.expires_at)) && Date.parse(artifact.expires_at) > now + 300000, 'Artifact identity or expiry is invalid.');
  for (const path of RECOVERY_REQUIRED_PATHS) requireValue(manifest.files?.some(file => file.path === path), 'Required compatibility path is absent.');
  return p;
}
function context(workflow) {
  requireValue(process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REPOSITORY === RELEASE_REPOSITORY && process.env.GITHUB_REF === 'refs/heads/main' && process.env.GITHUB_WORKFLOW_REF === `${RELEASE_REPOSITORY}/${workflow}@refs/heads/main` && process.env.GITHUB_SHA === git('rev-parse', 'HEAD') && !git('status', '--porcelain', '--untracked-files=normal'), 'Requires the clean allowlisted main workflow.');
}
function ancestor(candidate) {
  try { execFileSync('git', ['merge-base', '--is-ancestor', RECOVERY_BASELINE_SHA, candidate], { cwd: ROOT, stdio: 'pipe' }); return true; } catch { return false; }
}
function directChild(candidate) {
  const parents = git('rev-list', '--parents', '-n', '1', candidate).split(/\s+/);
  return parents.length === 2 && parents[1] === RECOVERY_BASELINE_SHA;
}
function apiClient() {
  const token = process.env.GH_TOKEN;
  requireValue(token, 'GitHub workflow token is required.');
  return async path => {
    requireValue(path.startsWith('/') && !path.includes('..'), 'Unsafe API path.');
    const response = await fetch(API + path, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, signal: AbortSignal.timeout(30000), redirect: 'error' });
    requireValue(response.ok, `GitHub evidence request failed (${response.status}).`);
    return response.json();
  };
}
function overlay(...args) {
  return JSON.parse(execFileSync('python3', [resolve(ROOT, 'scripts/recovery-overlay.py'), ...args], { cwd: ROOT, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }));
}
async function boundedBytes(response, max) {
  requireValue(response.ok, `Artifact request failed (${response.status}).`);
  const parts = []; let size = 0;
  for await (const part of response.body) { size += part.length; requireValue(size <= max, 'Artifact exceeds download budget.'); parts.push(part); }
  return Buffer.concat(parts);
}
async function downloadArtifact(artifactId, destination, artifact) {
  requireValue(id(artifactId) && /^sha256:[0-9a-f]{64}$/.test(artifact.digest), 'Missing authenticated archive digest.');
  const response = await fetch(`${API}/actions/artifacts/${artifactId}/zip`, { headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json' }, redirect: 'manual', signal: AbortSignal.timeout(30000) });
  requireValue(response.status === 302, 'Artifact download did not supply a signed redirect.');
  const url = new URL(response.headers.get('location'));
  requireValue(url.protocol === 'https:' && !url.username && !url.password, 'Unsafe artifact download redirect.');
  // The authenticated API supplied this signed location. Never forward its
  // GitHub Authorization header to artifact storage.
  const bytes = await boundedBytes(await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(120000) }), 1024 ** 3);
  requireValue(`sha256:${hash(bytes)}` === artifact.digest, 'Downloaded archive differs from GitHub digest.');
  writeFileSync(destination, bytes);
}
async function prepare(args, api) {
  context(RELEASE_WORKFLOW);
  const state = jsonFile(args.state);
  requireValue(state.eligible && state.candidateSha === process.env.GITHUB_SHA && ancestor(state.candidateSha) && directChild(state.candidateSha), 'This run has no migration recovery eligibility.');
  const candidateManifest = jsonFile(args.manifest);
  verifyManifest(args.site, candidateManifest);
  requireValue(candidateManifest.provenance.mode === 'ci-production' && candidateManifest.provenance.sourceSha === state.candidateSha && String(candidateManifest.provenance.runId) === process.env.GITHUB_RUN_ID && String(candidateManifest.provenance.runAttempt) === process.env.GITHUB_RUN_ATTEMPT, 'Candidate is not the checked artifact of this run.');
  const scratch = mkdtempSync(resolve(process.env.RUNNER_TEMP || tmpdir(), 'baseline-reconstruction-'));
  try {
    const base = resolve(scratch, 'source'); mkdirSync(base);
    const archive = resolve(scratch, 'baseline.tar');
    execFileSync('git', ['archive', '--format=tar', '--output', archive, RECOVERY_BASELINE_SHA], { cwd: ROOT });
    execFileSync('tar', ['-xf', archive, '-C', base]);
    execFileSync('npm', ['ci'], { cwd: base, stdio: 'inherit' });
    execFileSync('npm', ['run', 'build'], { cwd: base, stdio: 'inherit', env: { ...process.env, PUBLIC_SERVICE_MODE: 'production', PUBLIC_RELAY_OPERATOR_WORKSHOP_CHECKOUT: 'true', PUBLIC_FLOW_ENTERPRISE_CONTACT_ENABLED: 'false', PUBLIC_LIVING_DOCUMENTS_SIGNUP_ENABLED: 'false' } });
    const bundle = resolve(args.bundle); mkdirSync(bundle, { recursive: true });
    const proofPath = resolve(bundle, 'overlay-proof.json');
    const verification = overlay('prepare', '--baseline', resolve(base, 'dist'), '--candidate', resolve(args.site), '--site', resolve(bundle, 'site'), '--proof', proofPath);
    const current = await observeCurrent(api, process.env.GITHUB_RUN_ID);
    requireValue(current.deploymentId === state.current.deploymentId && current.sourceSha === state.current.sourceSha, 'Production changed during recovery preparation.');
    const p = { ...candidateManifest.provenance, mode: 'ci-compatible-migration', baseline: { sourceSha: RECOVERY_BASELINE_SHA, sourceTree: git('rev-parse', `${RECOVERY_BASELINE_SHA}^{tree}`), lockfileSha256: hash(readFileSync(resolve(base, 'package-lock.json'))), ancestor: true, directParent: true, reconstruction: 'npm ci and build from fixed source with Node 22; original expired artifact bytes are unavailable' }, productionAtPreparation: current, recipeSha256: recipeHash(), overlayProofSha256: hash(readFileSync(proofPath)), compatibilityVerification: verification };
    const manifest = createManifest(resolve(bundle, 'site'), p);
    save(resolve(bundle, 'manifest.json'), manifest);
    verifyManifest(resolve(bundle, 'site'), manifest);
    const manifestSha256 = hash(readFileSync(resolve(bundle, 'manifest.json')));
    console.log(JSON.stringify({ prepared: true, manifestSha256, verification }));
    if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, `\n### Migration recovery prepared\nBaseline source: ${RECOVERY_BASELINE_SHA}\nCandidate: ${p.sourceSha}\nManifest SHA-256: ${manifestSha256}\nFive new URLs and ${verification.baselineFilesPreserved} baseline files verified. This reconstructs source; it is not the expired original artifact.\n`, { flag: 'a' });
  } finally { rmSync(scratch, { recursive: true, force: true }); }
}
async function remoteVerify(args, api, download, enforceCurrent = true) {
  context(RECOVERY_WORKFLOW);
  const sourceRun = process.env.RECOVERY_SOURCE_RUN;
  const artifactId = process.env.RECOVERY_ARTIFACT_ID;
  requireValue(id(sourceRun) && id(artifactId), 'Explicit source run and artifact IDs are required.');
  const artifact = await api(`/actions/artifacts/${artifactId}`);
  const name = artifact.name?.match(/^site-compatible-recovery-([0-9a-f]{40})-([1-9][0-9]*)-([1-9][0-9]*)$/);
  requireValue(name && name[2] === String(sourceRun), 'Artifact has no exact source-attempt identity.');
  const run = await api(`/actions/runs/${sourceRun}/attempts/${name[3]}`);
  validateRun(run, name[1]);
  requireValue(String(artifact.workflow_run?.id) === String(sourceRun) && artifact.name === `site-compatible-recovery-${run.head_sha}-${run.id}-${run.run_attempt}` && artifact.expired === false, 'Wrong retained migration artifact.');
  const bundle = resolve(args.bundle);
  if (download) {
    const archive = resolve(process.env.RUNNER_TEMP, `compatible-${artifactId}.zip`);
    await downloadArtifact(artifactId, archive, artifact);
    overlay('unpack', '--archive', archive, '--target', bundle);
    rmSync(archive);
  }
  const bytes = readFileSync(resolve(bundle, 'manifest.json'));
  const manifest = JSON.parse(bytes);
  const proof = readFileSync(resolve(bundle, 'overlay-proof.json'));
  const p = validateCompatibleManifest(manifest, bytes, proof, process.env.RECOVERY_MANIFEST_SHA256, run, artifact);
  requireValue(ancestor(p.sourceSha) && directChild(p.sourceSha), 'Retained direct-parent baseline ancestry is invalid.');
  verifyManifest(resolve(bundle, 'site'), manifest);
  overlay('verify', '--site', resolve(bundle, 'site'), '--proof', resolve(bundle, 'overlay-proof.json'));
  const current = enforceCurrent ? await observeCurrent(api, process.env.GITHUB_RUN_ID) : null;
  if (enforceCurrent) assertCurrent({ deploymentId: process.env.RECOVERY_EXPECTED_DEPLOYMENT, sourceSha: process.env.RECOVERY_EXPECTED_SHA }, current, p);
  console.log(JSON.stringify({ verified: true, current, recoveryArtifactId: artifactId, manifestSha256: hash(bytes) }));
}
async function smoke(args) {
  const manifest = jsonFile(resolve(args.bundle, 'manifest.json'));
  const critical = new Set(RECOVERY_REQUIRED_PATHS);
  // Include the recovered entry-page styles/scripts as well as all new routes,
  // social cards and discovery. A failed smoke is reported; never auto-redeploy.
  for (const page of ['index.html', 'flow/index.html', 'essay/index.html', 'manifesto/index.html']) {
    const html = readFileSync(resolve(args.bundle, 'site', page), 'utf8');
    for (const m of html.matchAll(/(?:src|href)="(\/_astro\/[^"?#]+\.(?:css|js))"/g)) critical.add(m[1].slice(1));
  }
  for (const path of critical) {
    const expected = manifest.files.find(row => row.path === path);
    requireValue(expected, 'Missing smoke target.');
    const route = path.endsWith('index.html') ? path.slice(0, -10) : path;
    let passed = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(`https://orionfold.com/${route}?recovery=${process.env.GITHUB_RUN_ID}-${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' }, redirect: 'error', signal: AbortSignal.timeout(15000) });
        if (response.ok && hash(Buffer.from(await response.arrayBuffer())) === expected.sha256) { passed = true; break; }
      } catch { /* Bounded propagation retry. */ }
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 5000));
    }
    requireValue(passed, `Recovery HTTP/hash smoke failed: /${route}`);
  }
  console.log(JSON.stringify({ smokePassed: true, paths: [...critical] }));
}
async function main(argv) {
  const [command, ...rest] = argv; const args = {};
  for (let i = 0; i < rest.length; i += 2) { requireValue(/^--[a-z-]+$/.test(rest[i]) && rest[i + 1], 'Use named option/value pairs.'); args[rest[i].slice(2)] = rest[i + 1]; }
  if (command === 'smoke') return smoke(args);
  const api = apiClient();
  if (command === 'scope') {
    context(RELEASE_WORKFLOW);
    const state = migrationScope(await observeCurrent(api, process.env.GITHUB_RUN_ID), process.env.GITHUB_SHA, ancestor(process.env.GITHUB_SHA), directChild(process.env.GITHUB_SHA));
    save(resolve(args.state), state);
    if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `eligible=${state.eligible}\n`, { flag: 'a' });
    console.log(JSON.stringify(state));
  } else if (command === 'prepare') await prepare(args, api);
  else if (command === 'inspect') await remoteVerify(args, api, true, false);
  else if (command === 'verify' || command === 'recheck') await remoteVerify(args, api, command === 'verify');
  else throw new Error('Supported commands: scope, prepare, verify, recheck, inspect, smoke.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
