import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

// Operator 2026-10-31: /workflows/ sells one repeat job run as a Flow Playbook,
// not the Relay-led Private Agent Starter Kit, and never links a dead anchor.
test('/workflows/ is framed as a Flow Playbook workflow', () => {
  const page = read('src/pages/workflows.astro');
  assert.match(page, /Flow Playbook/);
  assert.match(page, /href="\/playbooks\/#dm-blueprints"/);
  assert.doesNotMatch(page, /Private Agent Starter Kit|Request a starter kit|\/adoption\/#run/);
  for (const p of ['src/data/flagship-offers.ts', 'src/data/og.ts', 'src/data/roadmap-overlay.ts', 'public/llms.txt']) {
    assert.doesNotMatch(read(p), /Private Agent Starter Kits?\b(?!-)/, p);
  }
});
