#!/usr/bin/env node
// Preflight: the deploy chain, defined once, run everywhere.
//
// GitHub Pages deploys from a PUBLIC repository on every push to main, so a
// push is a release. On 2026-08-27 three consecutive deploys failed at three
// different steps (release boundary, Playwright, node contracts) because each
// push had been verified locally with a hand-picked subset of the chain and CI
// was the first place the whole sequence ran. This file removes the choice:
//
//   - The deploy workflow calls `node scripts/preflight.mjs <step>` for every
//     step, in this order. `scripts/test/preflight.test.mjs` fails if the
//     workflow and STEPS drift apart.
//   - `npm run preflight` (no arguments) runs the same steps, in the same order,
//     with the same environment, and writes a stamp keyed on the git tree hash.
//   - The tracked pre-push hook (`scripts/git-hooks/pre-push`) refuses to push
//     `main` unless the pushed tree carries a fresh green stamp or CI already
//     deployed that exact commit green; otherwise it runs preflight inline.
//
// Steps never read files from the working tree that CI cannot see (.env.local,
// untracked files) except through the build itself; that residual gap is why
// the stamp also requires a clean working tree.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const STAMP_PATH = resolve(ROOT, 'output/preflight/stamp.json');
export const DEPLOY_WORKFLOW = 'deploy.yml';

// The customer-visible build state. The workflow sets the same value at job
// level; running it here too means a local build cannot differ from Pages.
export const BUILD_ENV = { PUBLIC_RELAY_OPERATOR_WORKSHOP_CHECKOUT: 'true' };

// ---------------------------------------------------------------------------
// Publish sweep rules. Pure functions so the contract test can pin them.
// ---------------------------------------------------------------------------

// Dot- or underscore-prefixed top-level paths are local-only by convention,
// with exactly three public exceptions that the build/deploy needs.
const TOP_LEVEL_PUBLIC_EXCEPTIONS = new Set(['.github', '.gitignore', '.lighthouserc.cjs']);

// Nested dot/underscore segments that are public by design: Deno's shared
// module folder, exported Next.js demo bundles, Pages markers, templates.
const NESTED_PUBLIC_ALLOW = [
  /^supabase\/functions\/_shared\//,
  /^supabase\/functions\/\.env\.example$/,
  /^supabase\/\.gitignore$/,
  /^public\/[^/]+\/demo\/(?:_next\/|\.nojekyll$)/,
  /^public\/[^/]+\/demo\/assets\/_slug_\.[A-Za-z0-9]+\.css$/,
  /\/\.gitkeep$/,
];

const LOCAL_ONLY_BASENAMES = new Set([
  'CLAUDE.md',
  'AGENTS.md',
  'CODEX-CC.md',
  'OPS-NOTES.md',
  '_TODOS.json',
  '_STATUS.json',
  '.todos-sync-state.json',
]);

const LOCAL_ONLY_TOP_DIRS = new Set(['audit-reports', 'checks']);

/** Returns a reason string when `path` must never be tracked, else null. */
export function classifyPath(path) {
  const segments = path.split('/');
  const base = segments[segments.length - 1];
  if (LOCAL_ONLY_BASENAMES.has(base)) return `${base} is local-only`;
  if (/HANDOFF/i.test(base) && base.endsWith('.md')) return 'HANDOFF notes are local-only';
  if (LOCAL_ONLY_TOP_DIRS.has(segments[0])) return `${segments[0]}/ is local-only`;
  if (/^\.env(?:\..+)?$/.test(base) && base !== '.env.example') return 'environment files are local-only';
  if (NESTED_PUBLIC_ALLOW.some((rule) => rule.test(path))) return null;
  if (/^[._]/.test(segments[0]) && !TOP_LEVEL_PUBLIC_EXCEPTIONS.has(segments[0])) {
    return 'dot- and underscore-prefixed top-level paths are local-only';
  }
  for (const segment of segments.slice(1)) {
    if (/^[._]/.test(segment)) return 'dot- and underscore-prefixed paths are local-only';
  }
  return null;
}

// Provider key shapes. Each needs real length so placeholders do not trip it.
export const SECRET_SHAPES = [
  ['Stripe secret or restricted key', /\b[rs]k_(?:live|test)_[A-Za-z0-9]{20,}\b/],
  ['Stripe webhook signing secret', /\bwhsec_[A-Za-z0-9]{20,}\b/],
  ['Supabase access token', /\bsbp_[A-Za-z0-9]{20,}\b/],
  ['Anthropic API key', /sk-ant-[A-Za-z0-9_-]{20,}/],
  ['OpenAI-style API key', /\bsk-[A-Za-z0-9]{20,}\b/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{30,}\b/],
  ['GitHub fine-grained token', /\bgithub_pat_[A-Za-z0-9_]{30,}\b/],
  ['Resend API key', /\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{20,}\b/],
  ['AWS access key id', /\bAKIA[0-9A-Z]{16}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ['private key block', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY/],
];

const JWT_SHAPE = /\beyJ[A-Za-z0-9_-]{8,}\.(eyJ[A-Za-z0-9_-]{8,})\.[A-Za-z0-9_-]{8,}/g;

// Coarse POSIX-ERE prefilters for `git grep -E` (which has no \b or (?:)).
// The precise JavaScript shapes above decide; these only narrow the lines.
const SECRET_PREFILTER = '[rs]k_(live|test)_|whsec_|sbp_|sk-ant-|sk-[A-Za-z0-9]{20}|gh[pousr]_[A-Za-z0-9]{30}|github_pat_|re_[A-Za-z0-9]{8}_|AKIA[0-9A-Z]{16}|xox[baprs]-|AIza|PRIVATE KEY|eyJ[A-Za-z0-9_-]{8}';
const EMAIL_PREFILTER = '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z][A-Za-z]+';

/** Returns a reason when `text` carries key material, else null. */
export function findSecret(text) {
  for (const [label, shape] of SECRET_SHAPES) {
    if (shape.test(text)) return label;
  }
  // Supabase anon JWTs are public by design; a service-role JWT is not. Tell
  // them apart by the role claim instead of blocking every JWT.
  for (const match of text.matchAll(JWT_SHAPE)) {
    try {
      const payload = JSON.parse(Buffer.from(match[1], 'base64url').toString('utf8'));
      if (payload && payload.role === 'service_role') return 'Supabase service-role JWT';
    } catch {
      // Not a decodable JWT payload: not our concern.
    }
  }
  return null;
}

// The public business contact is the only mailbox allowed in tracked files.
// Test doubles (example.com, a@b.com) are fine; a real person's mailbox is not.
const CONSUMER_MAIL_DOMAINS = /^(?:gmail|googlemail|yahoo|ymail|outlook|hotmail|live|msn|icloud|me|mac|aol|proton|protonmail|pm)\.(?:com|me|ch|co\.uk|de|fr|in)$/i;
const EMAIL_SHAPE = /\b([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g;

/** Returns the first disallowed mailbox in `text`, else null. */
export function findEmail(text) {
  for (const match of text.matchAll(EMAIL_SHAPE)) {
    const local = match[1].toLowerCase();
    const domain = match[2].toLowerCase();
    if (CONSUMER_MAIL_DOMAINS.test(domain)) return match[0];
    if (domain === 'orionfold.com' && local !== 'manav') return match[0];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Git and process helpers.
// ---------------------------------------------------------------------------

const run = (cmd, args, { env = {}, input, quiet = false } = {}) =>
  spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    input,
    // Tree-wide greps can return long minified lines; never let the buffer decide.
    maxBuffer: 256 * 1024 * 1024,
    stdio: quiet ? ['pipe', 'pipe', 'pipe'] : ['inherit', 'inherit', 'inherit'],
    env: { ...process.env, ...env },
  });

const git = (...args) => {
  const result = run('git', args, { quiet: true });
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr.trim()}`);
  return result.stdout.trim();
};

export const treeOf = (rev = 'HEAD') => git('rev-parse', `${rev}^{tree}`);

export const workingTreeIsClean = () => git('status', '--porcelain', '--untracked-files=normal') === '';

const isCI = () => Boolean(process.env.GITHUB_ACTIONS || process.env.CI);

const group = (title) => {
  if (process.env.GITHUB_ACTIONS) console.log(`::group::${title}`);
  else console.log(`\n== ${title} ==`);
};
const endGroup = () => {
  if (process.env.GITHUB_ACTIONS) console.log('::endgroup::');
};

// ---------------------------------------------------------------------------
// Step implementations. Each returns { ok, detail }.
// ---------------------------------------------------------------------------

const SKIP_CONTENT_SCAN = /\.(?:png|webp|jpe?g|gif|ico|svg|woff2?|ttf|otf|pdf|mp4|zip|epub|wasm|avif)$|(?:^|\/)package-lock\.json$|(?:^|\/)deno\.lock$/i;

/**
 * Sweep a committed tree for local-only paths, key material, and mailboxes.
 * Range paths (files that were added and deleted between two commits) are
 * checked too: history is public as well.
 */
export function sweepTree(sha, { rangeFrom } = {}) {
  const problems = [];
  const paths = git('ls-tree', '-r', '--name-only', sha).split('\n').filter(Boolean);
  for (const path of paths) {
    const reason = classifyPath(path);
    if (reason) problems.push(`${path}: ${reason}`);
  }

  if (rangeFrom) {
    const range = git('log', '--name-only', '--format=', `${rangeFrom}..${sha}`);
    const seen = new Set(paths);
    for (const path of new Set(range.split('\n').filter(Boolean))) {
      if (seen.has(path)) continue;
      const reason = classifyPath(path);
      if (reason) problems.push(`${path}: ${reason} (touched in the pushed history)`);
    }
  }

  // One git grep per rule family over the whole tree keeps this fast on
  // thousands of files (a pathspec list that long overflows the argv limit);
  // -I skips binaries and the path filter drops lockfiles and media.
  const contentHits = (pattern) => {
    const result = run('git', ['grep', '-I', '-n', '-E', '-e', pattern, sha], { quiet: true });
    if (result.status === 1) return [];
    if (result.status !== 0) throw new Error(`git grep failed (${result.status ?? result.error}): ${result.stderr.trim()}`);
    return result.stdout.split('\n').filter(Boolean).map((line) => {
      const [, path, lineNo, ...rest] = line.match(/^[^:]+:([^:]+):(\d+):(.*)$/) ?? [];
      return { path, line: Number(lineNo), text: rest.join(':') };
    }).filter((hit) => hit.path && !SKIP_CONTENT_SCAN.test(hit.path));
  };

  for (const hit of contentHits(SECRET_PREFILTER)) {
    if (!hit.path) continue;
    const reason = findSecret(hit.text);
    if (reason) problems.push(`${hit.path}:${hit.line}: ${reason}`);
  }
  for (const hit of contentHits(EMAIL_PREFILTER)) {
    if (!hit.path) continue;
    const mailbox = findEmail(hit.text);
    if (mailbox) problems.push(`${hit.path}:${hit.line}: mailbox ${mailbox} is not the public business contact`);
  }
  return problems;
}

function stepSweep({ sha = 'HEAD', rangeFrom } = {}) {
  const resolved = git('rev-parse', sha);
  const problems = sweepTree(resolved, { rangeFrom });
  if (problems.length) {
    console.error(`[preflight] the tree at ${resolved.slice(0, 7)} must not be published:`);
    for (const problem of problems) console.error(`- ${problem}`);
    return { ok: false, detail: `${problems.length} publish problem(s)` };
  }
  console.log(`[preflight] publish sweep clean at ${resolved.slice(0, 7)}`);
  return { ok: true, detail: 'clean' };
}

/**
 * CI reads the operator's repository variable. Locally, read the same
 * variable through gh so the boundary sees exactly what the deploy will see.
 */
export function resolveReleaseDeclared({ env = process.env, ci = isCI(), lookup } = {}) {
  if (ci) return { value: env.FLOW_RELEASE_DECLARED, source: 'workflow environment' };
  const fetched = lookup ? lookup() : (() => {
    const result = run('gh', ['variable', 'get', 'FLOW_RELEASE_DECLARED'], { quiet: true });
    return result.status === 0 ? result.stdout.trim() : null;
  })();
  if (fetched !== null && fetched !== undefined) {
    return { value: fetched, source: 'repository variable via gh' };
  }
  if (env.FLOW_RELEASE_DECLARED !== undefined) {
    return { value: env.FLOW_RELEASE_DECLARED, source: 'local environment (gh unavailable; CI reads the repository variable, so this may differ)' };
  }
  return { value: undefined, source: 'unset (gh unavailable and no local value; CI would also see unset unless the repository variable exists)' };
}

function stepBoundary() {
  const declared = resolveReleaseDeclared();
  console.log(`[preflight] FLOW_RELEASE_DECLARED=${declared.value ?? '<unset>'} from ${declared.source}`);
  const env = { ...BUILD_ENV };
  if (declared.value === undefined) delete env.FLOW_RELEASE_DECLARED;
  else env.FLOW_RELEASE_DECLARED = declared.value;
  const result = spawnSync(process.execPath, [resolve(ROOT, 'scripts/check-flow-release-boundary.mjs')], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...env, ...(declared.value === undefined ? { FLOW_RELEASE_DECLARED: '' } : {}) },
  });
  return { ok: result.status === 0, detail: `exit ${result.status}` };
}

const shell = (label, cmd, args, env = {}) => {
  const result = run(cmd, args, { env: { ...BUILD_ENV, ...env } });
  return { ok: result.status === 0, detail: `${label} exit ${result.status}` };
};

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

export const STEPS = [
  { name: 'sweep', title: 'Sweep the tree for local-only paths, key material, and mailboxes', run: stepSweep },
  { name: 'boundary', title: 'Verify Flow release boundary', run: stepBoundary },
  { name: 'deno', title: 'Test server and commerce contracts', run: () => shell('deno test', 'deno', ['test', '-A', 'supabase/functions']) },
  { name: 'build', title: 'Build site', run: () => shell('astro build', npx, ['astro', 'build']) },
  {
    name: 'node',
    title: 'Test source and rendered-output contracts',
    run: () => {
      const files = readdirSync(resolve(ROOT, 'scripts/test')).filter((f) => f.endsWith('.test.mjs')).sort().map((f) => `scripts/test/${f}`);
      return shell('node --test', process.execPath, ['--test', '--test-reporter=spec', ...files]);
    },
  },
  {
    name: 'e2e',
    title: 'Test critical browser journeys',
    // CI=1 locally too: no reuse of a stale server on the Playwright port, the
    // same retry policy, and `test.only` is rejected, exactly as in the workflow.
    run: () => shell('playwright test', npx, ['playwright', 'test'], { CI: '1' }),
  },
];

// ---------------------------------------------------------------------------
// Stamp: proof that the whole chain passed on an exact tree.
// ---------------------------------------------------------------------------

export function readStamp(path = STAMP_PATH) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

/** A stamp proves a tree only if it was written on that tree from a clean checkout. */
export function stampSatisfies(stamp, tree, { steps = STEPS.map((s) => s.name) } = {}) {
  if (!stamp || stamp.tree !== tree || stamp.dirty) return false;
  return steps.every((name) => Array.isArray(stamp.steps) && stamp.steps.includes(name));
}

function writeStamp() {
  const dirty = !workingTreeIsClean();
  const stamp = {
    tree: treeOf('HEAD'),
    head: git('rev-parse', 'HEAD'),
    dirty,
    at: new Date().toISOString(),
    node: process.version,
    steps: STEPS.map((s) => s.name),
  };
  mkdirSync(dirname(STAMP_PATH), { recursive: true });
  writeFileSync(STAMP_PATH, `${JSON.stringify(stamp, null, 2)}\n`);
  if (dirty) {
    console.log('[preflight] all steps passed, but the working tree is dirty: commit first, then rerun so the stamp matches the tree you push.');
  } else {
    console.log(`[preflight] all steps passed on tree ${stamp.tree.slice(0, 12)}; stamp written to output/preflight/stamp.json`);
  }
  return stamp;
}

// ---------------------------------------------------------------------------
// Push gate (called by the pre-push hook with the pushed and remote SHAs).
// ---------------------------------------------------------------------------

function deployedGreen(sha) {
  const result = run('gh', ['run', 'list', '--workflow', DEPLOY_WORKFLOW, '--commit', sha, '--json', 'conclusion', '--jq', '[.[] | select(.conclusion == "success")] | length'], { quiet: true });
  if (result.status !== 0) return false;
  return Number(result.stdout.trim()) > 0;
}

export function gate(localSha, remoteSha) {
  const zero = /^0{40}$/;
  const local = git('rev-parse', localSha);
  const remoteKnown = remoteSha && !zero.test(remoteSha) && run('git', ['cat-file', '-e', remoteSha], { quiet: true }).status === 0;

  group('Publish sweep of the pushed tree and history');
  const sweep = stepSweep({ sha: local, rangeFrom: remoteKnown ? remoteSha : undefined });
  endGroup();
  if (!sweep.ok) return false;

  const tree = git('rev-parse', `${local}^{tree}`);
  const stamp = readStamp();
  if (stampSatisfies(stamp, tree)) {
    console.log(`[preflight] push allowed: tree ${tree.slice(0, 12)} passed preflight at ${stamp.at}`);
    return true;
  }
  if (deployedGreen(local)) {
    console.log(`[preflight] push allowed: ${local.slice(0, 7)} already deployed green on GitHub Pages`);
    return true;
  }
  if (treeOf('HEAD') === tree && workingTreeIsClean()) {
    console.log(`[preflight] no stamp for tree ${tree.slice(0, 12)}; running the full chain before the push`);
    return runAll();
  }
  console.error('[preflight] push refused. The pushed commit has no proof:');
  console.error('- no green preflight stamp for its tree (run `npm run preflight` on a clean checkout of it), and');
  console.error('- no green GitHub Pages deploy of that exact commit, and');
  console.error('- it is not the clean working tree, so preflight cannot verify it in place.');
  return false;
}

// ---------------------------------------------------------------------------
// CLI.
// ---------------------------------------------------------------------------

function runSteps(names) {
  for (const name of names) {
    const step = STEPS.find((s) => s.name === name);
    if (!step) {
      console.error(`[preflight] unknown step "${name}". Steps: ${STEPS.map((s) => s.name).join(', ')}`);
      return false;
    }
    group(step.title);
    const started = Date.now();
    const result = step.run();
    endGroup();
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    if (!result.ok) {
      const message = `[preflight] FAILED ${name} (${result.detail}) after ${seconds}s`;
      if (process.env.GITHUB_ACTIONS) console.log(`::error::${message}`);
      console.error(message);
      return false;
    }
    console.log(`[preflight] ok ${name} (${seconds}s)`);
  }
  return true;
}

function runAll() {
  const ok = runSteps(STEPS.map((s) => s.name));
  if (ok) writeStamp();
  return ok;
}

function main(argv) {
  const args = [...argv];
  if (args.includes('--list')) {
    for (const step of STEPS) console.log(`${step.name}\t${step.title}`);
    return 0;
  }
  const gateAt = args.indexOf('--gate');
  if (gateAt !== -1) {
    const [localSha, remoteSha] = args.slice(gateAt + 1, gateAt + 3);
    if (!localSha) {
      console.error('usage: preflight.mjs --gate <local-sha> [remote-sha]');
      return 2;
    }
    return gate(localSha, remoteSha) ? 0 : 1;
  }
  const shaAt = args.indexOf('--sha');
  const sha = shaAt !== -1 ? args[shaAt + 1] : 'HEAD';
  const names = args.filter((a, i) => !a.startsWith('--') && (shaAt === -1 || i !== shaAt + 1));
  if (names.length === 0) return runAll() ? 0 : 1;
  if (names.length === 1 && names[0] === 'sweep') return stepSweep({ sha }).ok ? 0 : 1;
  return runSteps(names) ? 0 : 1;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) process.exit(main(process.argv.slice(2)));
