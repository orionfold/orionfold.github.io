import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createManifest, verifyManifest, validateRecoveryEvidence, safeRelativePath, RELEASE_CHECKS, RELEASE_REPOSITORY, RELEASE_WORKFLOW, RECOVERY_COMPATIBILITY_ROUTES, RECOVERY_REQUIRED_PATHS } from '../release-artifact.mjs';
const hash = value => createHash('sha256').update(value).digest('hex');
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'release-contract-'));
  for (const path of RECOVERY_REQUIRED_PATHS) {
    mkdirSync(join(dir, path, '..'), { recursive: true });
    writeFileSync(join(dir, path), `<h1>${path}</h1>`);
  }
  const now = Date.parse('2026-09-06T10:00:00Z');
  const provenance = { mode: 'ci-production', repository: RELEASE_REPOSITORY, sourceSha: 'a'.repeat(40), sourceTree: 'b'.repeat(40), dirty: false, workflowPath: RELEASE_WORKFLOW, ref: 'refs/heads/main', runId: '100', runAttempt: '1', pagesArtifactId: '88', checks: RELEASE_CHECKS };
  const manifest = createManifest(dir, provenance);
  const bytes = Buffer.from(JSON.stringify(manifest));
  const current = { repository: RELEASE_REPOSITORY, sourceSha: 'c'.repeat(40), runId: '200', artifactId: '201', observedAt: new Date(now).toISOString() };
  const evidence = {
    approvedRecovery: { sourceSha: provenance.sourceSha, runId: '100', artifactId: '101', manifestSha256: hash(bytes) },
    workflowRun: { repository: RELEASE_REPOSITORY, path: RELEASE_WORKFLOW, head_sha: provenance.sourceSha, id: '100', run_attempt: 1, head_branch: 'main', event: 'push', status: 'completed', conclusion: 'success' },
    artifact: { id: '101', name: `site-recovery-${provenance.sourceSha}-100-1`, workflow_run_id: '100', expired: false, expires_at: '2026-10-10T10:00:00Z' },
    expectedCurrent: { ...current }, observedCurrent: { ...current },
  };
  return { dir, manifest, bytes, evidence, now, close: () => rmSync(dir, { recursive: true, force: true }) };
}
test('complete file inventory verifies and catches modified, missing or additional bytes', () => {
  const f = fixture();
  try {
    assert.equal(verifyManifest(f.dir, f.manifest).verified, true);
    writeFileSync(join(f.dir, 'extra.html'), 'unexpected');
    assert.throws(() => verifyManifest(f.dir, f.manifest), /differ/);
    rmSync(join(f.dir, 'extra.html'));
    writeFileSync(join(f.dir, 'flow/index.html'), 'tampered');
    assert.throws(() => verifyManifest(f.dir, f.manifest), /differ/);
    rmSync(join(f.dir, 'flow/index.html'));
    assert.throws(() => verifyManifest(f.dir, f.manifest), /differ/);
  } finally { f.close(); }
});
test('artifact paths and symbolic links cannot escape the selected directory', () => {
  for (const path of ['../outside', '/absolute', 'one/../two', 'one\\two', 'one\nfile', './file', '']) assert.equal(safeRelativePath(path), false);
  const f = fixture();
  try { symlinkSync('/etc/hosts', join(f.dir, 'link')); assert.throws(() => createManifest(f.dir, f.manifest.provenance), /Links are not allowed/); }
  finally { f.close(); }
});
test('recovery dry run validates the explicit artifact allowlist but never enables deployment', () => {
  const f = fixture();
  try {
    const result = validateRecoveryEvidence(f.manifest, f.bytes, f.evidence, f.now);
    assert.equal(result.checksPassed, true);
    assert.equal(result.dryRunOnly, true);
    assert.equal(result.deployAllowed, false);
  } finally { f.close(); }
});
test('a changed current production or stale observation forbids whole-site recovery', () => {
  const f = fixture();
  try {
    for (const key of ['sourceSha', 'runId', 'artifactId']) {
      const evidence = structuredClone(f.evidence);
      evidence.observedCurrent[key] = key === 'sourceSha' ? 'd'.repeat(40) : '999';
      assert.throws(() => validateRecoveryEvidence(f.manifest, f.bytes, evidence, f.now), /Current production changed/);
    }
    assert.throws(() => validateRecoveryEvidence(f.manifest, f.bytes, f.evidence, f.now + 300001), /not fresh/);
  } finally { f.close(); }
});
test('wrong repository, workflow, source, missing checks, failed run, expiry or digest refuses recovery', () => {
  const f = fixture();
  try {
    const changes = [
      e => e.workflowRun.repository = 'other/repo',
      e => e.workflowRun.path = '.github/workflows/arbitrary.yml',
      e => e.workflowRun.head_sha = 'd'.repeat(40),
      e => e.workflowRun.conclusion = 'failure',
      e => e.artifact.expired = true,
      e => e.artifact.name = 'arbitrary-archive',
      e => e.approvedRecovery.manifestSha256 = '0'.repeat(64),
    ];
    for (const change of changes) {
      const evidence = structuredClone(f.evidence); change(evidence);
      assert.throws(() => validateRecoveryEvidence(f.manifest, f.bytes, evidence, f.now));
    }
    const manifest = structuredClone(f.manifest); manifest.provenance.checks = ['build'];
    assert.throws(() => validateRecoveryEvidence(manifest, f.bytes, f.evidence, f.now), /checks/);
  } finally { f.close(); }
});
test('reconstructed local baseline and missing new-page overlay are ineligible for the fast path', () => {
  const f = fixture();
  try {
    const local = structuredClone(f.manifest); local.provenance.mode = 'local-reconstruction';
    assert.throws(() => validateRecoveryEvidence(local, f.bytes, f.evidence, f.now), /allowlisted/);
    for (const path of RECOVERY_REQUIRED_PATHS) {
      const noOverlay = structuredClone(f.manifest);
      noOverlay.files = noOverlay.files.filter(file => file.path !== path);
      assert.throws(() => validateRecoveryEvidence(noOverlay, f.bytes, f.evidence, f.now), /overlay/, path);
    }
    assert.deepEqual(RECOVERY_COMPATIBILITY_ROUTES.map(({ route }) => route), [
      '/essay/', '/manifesto/', '/flow/night-shift/', '/flow/living-documents/', '/flow/settings/',
    ]);
  } finally { f.close(); }
});
test('workflow retains both packages for at least 30 days without changing preflight or deployment guards', () => {
  const source = readFileSync(new URL('../../.github/workflows/deploy.yml', import.meta.url), 'utf8');
  const calls = [...source.matchAll(/run: node scripts\/preflight\.mjs (\S+)/g)].map(match => match[1]);
  assert.deepEqual(calls, RELEASE_CHECKS);
  assert.match(source, /group: pages/);
  assert.match(source, /name: github-pages/);
  assert.match(source, /Upload artifact[\s\S]*upload-pages-artifact@v5[\s\S]*retention-days: 35/);
  assert.match(source, /name: site-recovery-.*[\s\S]*retention-days: 35/);
  assert.ok(source.indexOf('release-artifact.mjs capture') > source.indexOf('scripts/preflight.mjs e2e'));
});
