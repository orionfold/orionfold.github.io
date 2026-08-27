// The deploy chain is defined once (scripts/preflight.mjs) and must be the same
// chain in the GitHub Pages workflow, the local `npm run preflight`, and the
// pre-push gate. These contracts keep the three from drifting apart again.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  STEPS,
  classifyPath,
  findEmail,
  findSecret,
  resolveReleaseDeclared,
  stampSatisfies,
} from '../preflight.mjs';

const read = (relativePath) => readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

test('the deploy workflow runs every preflight step, in preflight order, and nothing else between checkout and upload', () => {
  const workflow = read('.github/workflows/deploy.yml');
  const calls = [...workflow.matchAll(/run: node scripts\/preflight\.mjs (\S+)/g)].map((m) => m[1]);
  assert.deepEqual(calls, STEPS.map((s) => s.name), 'workflow steps must equal STEPS in order');
  for (const step of STEPS) {
    assert.match(workflow, new RegExp(`- name: ${step.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n`), `workflow names the "${step.name}" step by its preflight title`);
  }
  assert.doesNotMatch(workflow, /run: npm run (?:build|test:node|test:e2e|test:deno)\b/, 'the workflow never calls a test or build script directly; parity lives in preflight');
  assert.match(workflow, /FLOW_RELEASE_DECLARED: \$\{\{ vars\.FLOW_RELEASE_DECLARED \}\}/, 'the operator declaration still comes from the repository variable');
  assert.match(workflow, /timeout-minutes: \d+/, 'a hung build cannot hold the deploy lane for hours');
  assert.match(workflow, /if: failure\(\)[\s\S]*upload-artifact[\s\S]*output\/playwright/, 'browser traces and screenshots are uploaded when the chain fails');
});

test('the chain order is boundary before build and browser journeys last', () => {
  const names = STEPS.map((s) => s.name);
  assert.equal(names[0], 'sweep');
  assert.ok(names.indexOf('boundary') < names.indexOf('build'));
  assert.ok(names.indexOf('build') < names.indexOf('node'));
  assert.equal(names[names.length - 1], 'e2e');
});

test('package scripts expose preflight and install the pre-push gate on npm install', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts.preflight, 'node scripts/preflight.mjs');
  assert.equal(pkg.scripts['hooks:install'], 'node scripts/install-git-hooks.mjs');
  assert.equal(pkg.scripts.prepare, 'node scripts/install-git-hooks.mjs');
  assert.match(pkg.scripts['test:node'], /--test-reporter=spec/, 'failures are readable in CI logs');
});

test('the tracked pre-push hook gates only main and delegates every decision to preflight', () => {
  const hook = read('scripts/git-hooks/pre-push');
  assert.match(hook, /refs\/heads\/main/);
  assert.match(hook, /node scripts\/preflight\.mjs --gate "\$local_sha" "\$remote_sha"/);
  assert.doesNotMatch(hook, /\$\{?[A-Z_]*(?:SKIP|BYPASS|FORCE)/, 'the hook reads no environment switch that skips the gate');
});

test('local-only paths are classified as unpublishable; public exceptions pass', () => {
  for (const path of [
    'CLAUDE.md',
    'AGENTS.md',
    'CODEX-CC.md',
    'HANDOFF.md',
    'docs/FLOW-HANDOFF-notes.md',
    '_TODOS.json',
    '.env',
    '.env.local',
    'src/.env.production',
    'audit-reports/2026-08-27.md',
    'checks/x.json',
    '_SPECS/2026-08-27-000000_thing.md',
    '.claude/hooks/publish-guard.py',
    '.remember/now.md',
    'src/_private/notes.md',
  ]) {
    assert.ok(classifyPath(path), `${path} must be flagged`);
  }
  for (const path of [
    '.github/workflows/deploy.yml',
    '.gitignore',
    '.lighthouserc.cjs',
    'supabase/functions/_shared/catalog.ts',
    'supabase/functions/.env.example',
    'supabase/.gitignore',
    'public/relay/demo/_next/static/chunk.js',
    'public/arena/demo/.nojekyll',
    'public/arena/demo/assets/_slug_.DA94GVbZ.css',
    'src/assets/models/.gitkeep',
    'src/pages/index.astro',
    'scripts/preflight.mjs',
  ]) {
    assert.equal(classifyPath(path), null, `${path} is public by design`);
  }
});

test('key material is recognised by shape and service-role JWTs by claim; anon JWTs pass', () => {
  // Built by concatenation so no real-looking key sits in this file.
  const stripe = ['sk', 'live', 'A'.repeat(24)].join('_');
  assert.match(findSecret(`const value = "${stripe}";`), /Stripe/);
  assert.match(findSecret(['whsec', 'B'.repeat(32)].join('_')), /webhook/);
  assert.match(findSecret(['sbp', 'C'.repeat(40)].join('_')), /Supabase access/);
  assert.match(findSecret(`-----BEGIN ${'PRIVATE'} KEY-----`), /private key/);
  const jwt = (role) => ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ role, iss: 'supabase' })).toString('base64url'), 'x'.repeat(43)].join('.');
  assert.match(findSecret(jwt('service_role')), /service-role/);
  assert.equal(findSecret(jwt('anon')), null);
  assert.equal(findSecret('api_base = "https://api.stripe.com/v1"'), null);
  assert.equal(findSecret('const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");'), null);
});

test('only the public business contact and test doubles may appear in tracked files', () => {
  assert.equal(findEmail('Write to manav@orionfold.com or manav@updates.orionfold.com'), null);
  assert.equal(findEmail('jane@example.com, a@b.com, buyer@example.com'), null);
  assert.equal(findEmail('noreply@anthropic.com'), null);
  // Built by concatenation so the sweep of this tree does not flag its own fixtures.
  const at = (local, domain) => `${local}@${domain}`;
  assert.match(findEmail(`reach me at ${at('someone', 'gmail.com')}`), /gmail/);
  assert.match(findEmail(`cc: ${at('ops', 'orionfold.com')}`), /ops@orionfold\.com/);
  assert.match(findEmail(at('X', 'ICLOUD.COM')), /icloud/i);
});

test('the boundary reads the repository variable locally and the workflow environment in CI', () => {
  assert.deepEqual(resolveReleaseDeclared({ ci: true, env: { FLOW_RELEASE_DECLARED: 'true' } }), { value: 'true', source: 'workflow environment' });
  assert.equal(resolveReleaseDeclared({ ci: false, env: { FLOW_RELEASE_DECLARED: 'true' }, lookup: () => 'false' }).value, 'false', 'the repository variable wins over a local override');
  assert.equal(resolveReleaseDeclared({ ci: false, env: {}, lookup: () => null }).value, undefined);
  assert.match(resolveReleaseDeclared({ ci: false, env: { FLOW_RELEASE_DECLARED: 'true' }, lookup: () => null }).source, /may differ/);
});

test('a stamp proves a tree only when it is the same tree, clean, and covers every step', () => {
  const steps = STEPS.map((s) => s.name);
  const tree = 'a'.repeat(40);
  assert.equal(stampSatisfies({ tree, dirty: false, steps }, tree), true);
  assert.equal(stampSatisfies({ tree, dirty: true, steps }, tree), false, 'a dirty checkout proves nothing about the committed tree');
  assert.equal(stampSatisfies({ tree: 'b'.repeat(40), dirty: false, steps }, tree), false);
  assert.equal(stampSatisfies({ tree, dirty: false, steps: steps.filter((s) => s !== 'e2e') }, tree), false, 'a partial run is not a proof');
  assert.equal(stampSatisfies(null, tree), false);
});
