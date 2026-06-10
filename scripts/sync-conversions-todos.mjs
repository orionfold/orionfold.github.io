#!/usr/bin/env node
// sync-conversions-todos — polls Supabase for new conversions and mints
// delegate todos into _TODOS.json (the agency todo-sync echo) so:
//   - the operator's cockpit surfaces them immediately (reminder), and
//   - the marketing agent picks them up via ref_project: "marketing"
//     once the operator adopts them (todo-sync contract §5).
//
// Watches two tables:
//   - public.sponsors  → one delegate per new sponsor row (Gold/Platinum
//     titles name the Discord-invite benefit the operator owes).
//   - public.waitlist  → one delegate per batch of newly CONFIRMED story
//     subscribers.
//
// PII RULE: _TODOS.json is committed to a PUBLIC repo. This script selects
// row ids, tiers, and dates — NEVER emails. The todo titles point at the
// Supabase tables/Stripe for the actual contact details.
//
// State: .todos-sync-state.json (git-ignored) holds the high-water marks.
// First run bootstraps at the current position and mints nothing, so
// pre-existing rows (e.g. the operator's own test signups) stay silent.
//
//   node scripts/sync-conversions-todos.mjs [--dry-run]
//
// Auth: SUPABASE_ACCESS_TOKEN env, else the Supabase CLI token in the
// macOS keychain. Local/operator-machine only — never runs in CI.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TODOS_PATH = resolve(ROOT, '_TODOS.json');
const STATE_PATH = resolve(ROOT, '.todos-sync-state.json');
const PROJECT_REF = 'lgnmmcxvwdnusvfpguvf';
const DRY_RUN = process.argv.includes('--dry-run');

function accessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN;
  const raw = execFileSync('security', ['find-generic-password', '-s', 'Supabase CLI', '-w'], {
    encoding: 'utf8',
  }).trim();
  return raw.startsWith('go-keyring-base64:')
    ? Buffer.from(raw.slice('go-keyring-base64:'.length), 'base64').toString('utf8')
    : raw;
}

async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`Supabase query failed (${res.status}): ${await res.text()}`);
  return res.json();
}

// Timestamps interpolated into SQL come only from our own state file — still,
// validate the shape so a corrupted state file can't inject anything.
function isoOrThrow(ts) {
  if (!/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}(:?\d{2})?|Z)?$/.test(ts)) {
    throw new Error(`State file timestamp looks wrong: ${ts}`);
  }
  return ts;
}

const tierName = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Unknown-tier');
const today = () => new Date().toISOString().slice(0, 10);

function nextWebsiteId(todos) {
  let max = 0;
  for (const t of todos) {
    const m = /^website-(\d+)$/.exec(String(t.id ?? ''));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return () => `website-${++max}`;
}

function delegateTodo(id, title) {
  return {
    id,
    title,
    status: 'open',
    kind: 'delegate',
    project: 'website',
    ref_project: 'marketing',
    due: null,
    origin: 'website',
    goal_refs: [],
    updated: today(),
  };
}

const [sponsors, confirmed] = await Promise.all([
  sql('select id, tier, status, roadmap_item, created_at from public.sponsors order by id'),
  sql('select id, confirmed_at from public.waitlist where confirmed order by confirmed_at'),
]);

// ── Bootstrap: record where we are, mint nothing ─────────────────────────────
if (!existsSync(STATE_PATH)) {
  const state = {
    lastSponsorRowId: sponsors.length ? sponsors[sponsors.length - 1].id : 0,
    lastConfirmedAt: confirmed.length
      ? confirmed[confirmed.length - 1].confirmed_at
      : '1970-01-01T00:00:00Z',
    bootstrappedAt: new Date().toISOString(),
  };
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
  console.log(
    `Bootstrapped: watching from sponsor row ${state.lastSponsorRowId}, ` +
      `subscriber confirmations after ${state.lastConfirmedAt}. Nothing minted.`,
  );
  process.exit(0);
}

const state = JSON.parse(readFileSync(STATE_PATH, 'utf8'));
const newSponsors = sponsors.filter((s) => s.id > state.lastSponsorRowId);
const newConfirmed = confirmed.filter(
  (w) => new Date(w.confirmed_at) > new Date(isoOrThrow(state.lastConfirmedAt)),
);

if (!newSponsors.length && !newConfirmed.length) {
  console.log('No new sponsors or confirmed subscribers since last sync.');
  process.exit(0);
}

const doc = JSON.parse(readFileSync(TODOS_PATH, 'utf8'));
const mintId = nextWebsiteId(doc.todos);
const minted = [];

for (const s of newSponsors) {
  const date = String(s.created_at).slice(0, 10);
  const backing = s.roadmap_item ? `, backing ${s.roadmap_item}` : '';
  const discord = ['gold', 'platinum'].includes(s.tier)
    ? ' Operator: send the Orionfold Discord invite (Gold/Platinum benefit).'
    : '';
  minted.push(
    delegateTodo(
      mintId(),
      `New ${tierName(s.tier)} sponsor (sponsors row ${s.id}, started ${date}${backing}).` +
        discord +
        ' Marketing: welcome + log the sponsor. Contact details live in the Supabase sponsors table / Stripe dashboard, never in this file.',
    ),
  );
}

if (newConfirmed.length) {
  const ids = newConfirmed.map((w) => w.id).join(', ');
  minted.push(
    delegateTodo(
      mintId(),
      `${newConfirmed.length} new confirmed story subscriber(s) (waitlist row${newConfirmed.length > 1 ? 's' : ''} ${ids}). ` +
        'Marketing: send the welcome touch + add to the nurture list. Emails live in the Supabase waitlist table, never in this file.',
    ),
  );
}

if (DRY_RUN) {
  console.log('DRY RUN — would mint:');
  for (const t of minted) console.log(` ${t.id}: ${t.title}`);
  process.exit(0);
}

doc.todos.unshift(...minted);
// Contract §3: cap at 20, dropping oldest done first.
while (doc.todos.length > 20) {
  const idx = doc.todos.map((t) => t.status).lastIndexOf('done');
  if (idx === -1) break;
  doc.todos.splice(idx, 1);
}
doc.updated = new Date().toISOString().slice(0, 19);
writeFileSync(TODOS_PATH, JSON.stringify(doc, null, 2) + '\n');

state.lastSponsorRowId = sponsors.length ? sponsors[sponsors.length - 1].id : state.lastSponsorRowId;
if (confirmed.length) state.lastConfirmedAt = confirmed[confirmed.length - 1].confirmed_at;
writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');

console.log(`Minted ${minted.length} todo(s) into _TODOS.json:`);
for (const t of minted) console.log(` ${t.id}: ${t.title.slice(0, 100)}…`);
console.log('Commit the _TODOS.json change with the session echo.');
