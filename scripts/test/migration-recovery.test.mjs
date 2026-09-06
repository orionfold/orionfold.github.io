import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { observeCurrent, migrationScope, assertCurrent, validateCompatibleManifest, recipeHash, runFromStatus } from '../migration-recovery.mjs';
import { RECOVERY_BASELINE_SHA, RECOVERY_COMPATIBILITY_ROUTES, RECOVERY_REQUIRED_PATHS, RELEASE_REPOSITORY, RELEASE_WORKFLOW, RELEASE_CHECKS } from '../release-artifact.mjs';
const sha = 'a'.repeat(40);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const run = () => ({ id: 100, run_attempt: 1, repository: { full_name: RELEASE_REPOSITORY }, path: RELEASE_WORKFLOW, head_sha: sha, head_branch: 'main', event: 'push', status: 'completed', conclusion: 'success' });
const status = (state, id = '100') => ({ state, log_url: `https://github.com/${RELEASE_REPOSITORY}/actions/runs/${id}/job/900` });
const current = () => ({ deploymentId: '200', sourceSha: sha, runId: '100', runAttempt: '1', workflowPath: RELEASE_WORKFLOW });

test('current identity is the successful Pages deployment, skipping only own pending deployment', async () => {
  const records = {
    '/deployments?environment=github-pages&per_page=100': [{ id: 201, sha, environment: 'github-pages' }, { id: 200, sha, environment: 'github-pages' }],
    '/deployments/201/statuses?per_page=1': [status('in_progress', '999')],
    '/deployments/200/statuses?per_page=1': [status('success')],
    '/actions/jobs/900': { id: 900, run_id: 100, run_attempt: 1, head_sha: sha, steps: [{ name: 'Deploy to GitHub Pages', status: 'completed', conclusion: 'success' }] },
    '/actions/runs/100/attempts/1': run(),
    '/actions/runs/100': { ...run(), run_attempt: 2, status: 'in_progress', conclusion: null },
  };
  const calls = [];
  const api = async path => { calls.push(path); assert.ok(records[path], 'Unexpected API path ' + path); return structuredClone(records[path]); };
  const observed = await observeCurrent(api, '999');
  assert.equal(observed.deploymentId, '200');
  assert.equal(observed.runAttempt, '1');
  assert.equal(calls.includes('/actions/runs/100'), false, 'mutable latest rerun cannot identify deployed attempt');
  await assert.rejects(observeCurrent(api, '998'), /Another Pages deployment/);
  records['/deployments/200/statuses?per_page=1'] = [status('inactive')];
  await assert.rejects(observeCurrent(api, '999'), /No unambiguous/);
  records['/deployments/200/statuses?per_page=1'] = [{ state: 'success', log_url: 'https://untrusted.example/actions/runs/100' }];
  await assert.rejects(observeCurrent(api, '999'), /trusted workflow-run/);
  assert.throws(() => runFromStatus({ state: 'success' }), /binding/);
});

test('a post-promotion job failure cannot hide served bytes, while an uncertain failed promotion stops recovery', async () => {
  const job = { id: 900, run_id: 100, run_attempt: 1, head_sha: sha, steps: [{ name: 'Deploy to GitHub Pages', status: 'completed', conclusion: 'success' }] };
  const api = async path => {
    if (path.startsWith('/deployments?')) return [{ id: 200, sha, environment: 'github-pages' }];
    if (path.includes('/statuses')) return [status('failure')];
    if (path === '/actions/jobs/900') return structuredClone(job);
    if (path === '/actions/runs/100/attempts/1') return { ...run(), conclusion: 'failure' };
    throw new Error('Unexpected API request');
  };
  assert.equal((await observeCurrent(api, '999')).deploymentId, '200', 'successful promotion survives later purge failure');
  job.steps[0].conclusion = 'failure';
  await assert.rejects(observeCurrent(api, '999'), /promotion effect is uncertain/);
  job.steps[0].conclusion = 'skipped';
  await assert.rejects(observeCurrent(api, '999'), /No unambiguous/);
  job.head_sha = 'f'.repeat(40);
  await assert.rejects(observeCurrent(api, '999'), /job identity differs/);
});

test('fixed ancestor baseline scope allows this migration and exact rerun but skips unrelated production', () => {
  assert.equal(migrationScope({ ...current(), sourceSha: RECOVERY_BASELINE_SHA }, sha, true, true).eligible, true);
  assert.equal(migrationScope(current(), sha, true, true).eligible, true);
  assert.equal(migrationScope({ ...current(), sourceSha: 'b'.repeat(40) }, sha, true, true).eligible, false);
  assert.equal(migrationScope({ ...current(), workflowPath: '.github/workflows/recover.yml' }, sha, true, true).eligible, false);
  assert.equal(migrationScope(current(), sha, true, false).eligible, false, 'later Y release rerun must not manufacture a baseline artifact');
  assert.throws(() => migrationScope(current(), sha, false, true), /ancestor/);
  assert.throws(() => migrationScope(current(), RECOVERY_BASELINE_SHA, true, true), /new candidate/);
});

test('recovery can only replace the exact artifact candidate deployment, never a later release or replay', () => {
  const expected = { deploymentId: '200', sourceSha: sha };
  const p = { sourceSha: sha, runId: '100', runAttempt: '1' };
  assert.doesNotThrow(() => assertCurrent(expected, current(), p));
  for (const change of [{ deploymentId: '201' }, { sourceSha: 'b'.repeat(40) }, { runId: '101' }, { runAttempt: '2' }, { workflowPath: '.github/workflows/recover.yml' }]) {
    assert.throws(() => assertCurrent(expected, { ...current(), ...change }, p));
  }
  assert.throws(() => assertCurrent({ deploymentId: '../200', sourceSha: sha }, current(), p));
});

function provenanceFixture() {
  const proof = Buffer.from('{"proof":true}');
  const manifest = { provenance: { mode: 'ci-compatible-migration', repository: RELEASE_REPOSITORY, workflowPath: RELEASE_WORKFLOW, ref: 'refs/heads/main', dirty: false, sourceSha: sha, sourceTree: 'b'.repeat(40), runId: '100', runAttempt: '1', baseline: { sourceSha: RECOVERY_BASELINE_SHA, sourceTree: 'c'.repeat(40), lockfileSha256: 'd'.repeat(64), ancestor: true, directParent: true }, productionAtPreparation: { ...current(), sourceSha: RECOVERY_BASELINE_SHA }, recipeSha256: recipeHash(), overlayProofSha256: hash(proof), checks: RELEASE_CHECKS }, files: RECOVERY_REQUIRED_PATHS.map(path => ({ path })) };
  const artifact = { id: 300, name: `site-compatible-recovery-${sha}-100-1`, workflow_run: { id: 100, head_sha: sha }, expired: false, expires_at: '2026-10-10T10:00:00Z' };
  return { manifest, proof, artifact, run: run(), now: Date.parse('2026-09-06T10:00:00Z') };
}
test('compatible artifact requires exact reviewed digest, successful source run, recipe, fixed baseline, proof and unexpired identity', () => {
  const f = provenanceFixture();
  const check = (value, digest, proof = value.proof) => {
    const bytes = Buffer.from(JSON.stringify(value.manifest));
    return validateCompatibleManifest(value.manifest, bytes, proof, digest || hash(bytes), value.run, value.artifact, value.now);
  };
  assert.equal(check(f).sourceSha, sha);
  const changes = [
    v => v.manifest.provenance.mode = 'local-reconstruction',
    v => v.manifest.provenance.baseline.sourceSha = 'f'.repeat(40),
    v => v.manifest.provenance.baseline.ancestor = false,
    v => v.manifest.provenance.baseline.directParent = false,
    v => v.manifest.provenance.productionAtPreparation.sourceSha = 'f'.repeat(40),
    v => v.manifest.provenance.checks = ['build'],
    v => v.manifest.provenance.recipeSha256 = 'f'.repeat(64),
    v => v.run.conclusion = 'failure',
    v => v.run.path = '.github/workflows/other.yml',
    v => v.run.repository.full_name = 'another/repo',
    v => v.run.run_attempt = 2,
    v => v.artifact.name = 'arbitrary-archive',
    v => v.artifact.expired = true,
    v => v.artifact.expires_at = '2026-09-06T10:04:59Z',
    v => v.artifact.workflow_run.head_sha = 'f'.repeat(40),
  ];
  for (const change of changes) { const value = structuredClone(f); change(value); assert.throws(() => check(value)); }
  assert.throws(() => check(f, '0'.repeat(64)), /digest/);
  assert.throws(() => check(f, undefined, Buffer.from('different')), /proof/);
  for (const path of RECOVERY_REQUIRED_PATHS) {
    const value = structuredClone(f); value.manifest.files = value.manifest.files.filter(row => row.path !== path);
    assert.throws(() => check(value), /Required compatibility/);
  }
});

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const python = (...args) => spawnSync('python3', args, { cwd: ROOT, encoding: 'utf8' });
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'migration-overlay-test-'));
  const base = join(root, 'baseline'), candidate = join(root, 'candidate'), site = join(root, 'site'), proof = join(root, 'proof.json');
  const put = (dir, path, text) => { mkdirSync(join(dir, path, '..'), { recursive: true }); writeFileSync(join(dir, path), text); };
  const baseline = {
    'index.html': '<h1>Baseline home</h1>', 'flow/index.html': '<h1 id="pricing">Baseline pricing</h1>',
    'sitemap-index.xml': '<sitemapindex><sitemap><loc>https://orionfold.com/sitemap-0.xml</loc></sitemap></sitemapindex>',
    'sitemap-0.xml': '<urlset><url><loc>https://orionfold.com/</loc><lastmod>2026-08-31</lastmod></url></urlset>',
    'story/rss.xml': '<rss><channel><lastBuildDate>old</lastBuildDate><item><link>https://orionfold.com/story/old/</link></item></channel></rss>',
    'llms.txt': '# Orionfold\nOriginal discovery.\n',
  };
  for (const [path, text] of Object.entries(baseline)) { put(base, path, text); put(candidate, path, text); }
  const urls = RECOVERY_COMPATIBILITY_ROUTES.map(r => 'https://orionfold.com' + r.route);
  put(candidate, 'sitemap-0.xml', '<urlset>' + urls.map(url => `<url><loc>${url}</loc><lastmod>2026-09-06</lastmod></url>`).join('') + '</urlset>');
  put(candidate, 'llms.txt', urls.map(url => `[New page](${url})`).join('\n'));
  put(candidate, 'story/rss.xml', `<rss><channel><lastBuildDate>new</lastBuildDate><item><link>${urls[0]}</link></item></channel></rss>`);
  put(candidate, '_astro/new.css', '@font-face{src:url(/fonts/new.woff2)}.paper{background:url(/assets/living-systems/paper.svg)}');
  put(candidate, 'fonts/new.woff2', 'font'); put(candidate, 'assets/living-systems/paper.svg', '<svg/>');
  for (const row of RECOVERY_COMPATIBILITY_ROUTES) {
    put(candidate, row.page, `<html><head><meta property="og:image" content="https://orionfold.com/${row.og}"><link rel="stylesheet" href="/_astro/new.css"></head><body><h1 id="start">New route</h1><a href="${row.page.startsWith('flow/') ? '/flow/#get-flow' : '/flow/#pricing'}">Pricing</a></body></html>`);
    put(candidate, row.og, 'social ' + row.route);
  }
  const prepare = () => python('scripts/recovery-overlay.py', 'prepare', '--baseline', base, '--candidate', candidate, '--site', site, '--proof', proof);
  const verify = () => python('scripts/recovery-overlay.py', 'verify', '--site', site, '--proof', proof);
  return { root, base, candidate, site, proof, put, prepare, verify, close: () => rmSync(root, { recursive: true, force: true }) };
}
test('overlay preserves baseline, adds five routes/discovery/assets and applies only known pricing anchors', () => {
  const f = fixture();
  try {
    const result = f.prepare(); assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).routes.length, 5);
    assert.equal(f.verify().status, 0);
    assert.equal(readFileSync(join(f.site, 'index.html'), 'utf8'), '<h1>Baseline home</h1>');
    assert.match(readFileSync(join(f.site, 'flow/settings/index.html'), 'utf8'), /href="\/flow\/#pricing"/);
    const original = readFileSync(join(f.site, 'index.html'));
    writeFileSync(join(f.site, 'index.html'), 'unauthorized replacement');
    assert.match(f.verify().stderr, /Baseline bytes changed/);
    writeFileSync(join(f.site, 'index.html'), original);
    writeFileSync(join(f.site, 'fonts/new.woff2'), 'tampered');
    assert.match(f.verify().stderr, /Candidate asset bytes changed/);
    writeFileSync(join(f.site, 'fonts/new.woff2'), 'font');
    rmSync(join(f.site, 'flow/settings/index.html'));
    assert.match(f.verify().stderr, /Missing required/);
  } finally { f.close(); }
});
test('overlay rejects asset collisions that would silently break new pages and non-additive route replacement', () => {
  const f = fixture();
  try {
    f.put(f.base, '_astro/new.css', 'old different CSS');
    assert.match(f.prepare().stderr, /Candidate dependency collision/);
  } finally { f.close(); }
  const g = fixture();
  try { g.put(g.base, 'essay/index.html', 'existing'); assert.match(g.prepare().stderr, /must be additive/); } finally { g.close(); }
});
test('retained ZIP extraction rejects traversal, symlinks, duplicate members and arbitrary extra files', () => {
  const root = mkdtempSync(join(tmpdir(), 'recovery-zip-test-'));
  try {
    for (const [name, mode] of [['../escape', 0], ['site/link', 0o120777], ['outside.txt', 0], ['duplicate', 0]]) {
      const archive = join(root, 'input.zip'), target = join(root, 'unpacked');
      const generated = python('-c', 'import zipfile,sys\np,name,mode=sys.argv[1],sys.argv[2],int(sys.argv[3])\nwith zipfile.ZipFile(p,"w") as z:\n i=zipfile.ZipInfo("site/same" if name=="duplicate" else name); i.external_attr=mode<<16; z.writestr(i,"x")\n if name=="duplicate": z.writestr("site/same","y")', archive, name, String(mode));
      assert.equal(generated.status, 0, generated.stderr);
      const result = python('scripts/recovery-overlay.py', 'unpack', '--archive', archive, '--target', target);
      assert.notEqual(result.status, 0, name);
      assert.match(result.stderr, /Unsafe|Unsupported|Unexpected/);
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('normal pipeline retains verified compatibility before environment approval and recovery shares protected lock', () => {
  const deploy = readFileSync(join(ROOT, '.github/workflows/deploy.yml'), 'utf8');
  const recover = readFileSync(join(ROOT, '.github/workflows/recover.yml'), 'utf8');
  assert.deepEqual([...deploy.matchAll(/run: node scripts\/preflight\.mjs (\S+)/g)].map(m => m[1]), RELEASE_CHECKS);
  assert.ok(deploy.indexOf('migration-recovery.mjs prepare') > deploy.indexOf('scripts/preflight.mjs e2e'));
  assert.ok(deploy.indexOf('name: site-compatible-recovery-') < deploy.indexOf('\n  deploy:'));
  assert.match(deploy, /recovery-scope\.outputs\.eligible == 'true'/);
  for (const source of [deploy, recover]) { assert.match(source, /group: pages\n  cancel-in-progress: false/); assert.match(source, /name: github-pages/); }
  assert.match(recover, /if: github\.ref == 'refs\/heads\/main'/);
  assert.ok(recover.indexOf('migration-recovery.mjs recheck') > recover.indexOf('uses: actions/upload-pages-artifact'));
  assert.ok(recover.indexOf('migration-recovery.mjs recheck') < recover.indexOf('uses: actions/deploy-pages'));
  assert.match(recover, /RECOVERY_EXPECTED_DEPLOYMENT: \$\{\{ inputs.expected_deployment_id \}\}/);
  assert.doesNotMatch(recover, /npm ci|npm run build|workflow_run:|pull_request:|--no-verify/);
  const verificationJob = recover.slice(recover.indexOf('  verify-live:'));
  assert.match(verificationJob, /needs: recover/);
  assert.match(verificationJob, /migration-recovery.mjs smoke/);
  assert.doesNotMatch(verificationJob, /environment:|pages: write|id-token: write/);
  assert.ok(recover.indexOf('  verify-live:') < recover.indexOf('name: Purge Cloudflare cache'));
});
