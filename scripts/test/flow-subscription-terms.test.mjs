import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { FLOW_ADDONS, FLOW_ADDON_TERMS, FLOW_BASE_CAPABILITIES, FLOW_CANCEL_TERMS, FLOW_LAPSE_FACTS, FLOW_TRIAL_TERMS } from '../../src/data/flow-pricing.ts';
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

test('terms cover the plan, paid period and all trial capabilities', () => {
  assert.match(FLOW_CANCEL_TERMS, /until you cancel/);
  assert.match(FLOW_CANCEL_TERMS, /Cancel anytime in Flow, Settings ▸ Billing ▸ Manage Plan\./);
  assert.match(FLOW_CANCEL_TERMS, /Your plan stays on until the paid period ends\. No refunds, except where the law requires\./);
  assert.match(FLOW_TRIAL_TERMS, /every paid feature, including Import and Publish/);
  assert.match(FLOW_TRIAL_TERMS, /10 Pro Days/);
  assert.match(FLOW_ADDON_TERMS, /\$10\/month or \$96\/year per seat/);
  assert.match(FLOW_ADDON_TERMS, /needs Flow Pro/);
});

test('Website plans and terms reuse the approved facts', () => {
  for (const p of ['src/components/living/FlowPlans.astro', 'src/pages/flow/specifications.astro', 'src/pages/terms.astro']) {
    const source = read(p);
    for (const name of ['FLOW_CANCEL_TERMS', 'FLOW_ADDON_TERMS', 'FLOW_TRIAL_TERMS']) assert.ok(source.split(name).length >= 3, `${p} imports and renders ${name}`);
  }
  assert.match(read('src/pages/terms.astro'), /17\. Flow Subscriptions and Add-ons/);
});

test('free and lapsed promises do not include paid-format publishing', () => {
  assert.deepEqual(FLOW_ADDONS.map((a) => a.name), ['Flow Import', 'Flow Publish']);
  const base = JSON.stringify(FLOW_BASE_CAPABILITIES);
  assert.doesNotMatch(base, /\b(export|publish|Word|PowerPoint|PDF)\b/i);
  assert.ok(FLOW_LAPSE_FACTS.some((s) => s.includes('Markdown editing and saving stay free')));
  for (const p of ['src/components/living/FlowPlans.astro', 'src/pages/promise.astro', 'src/data/living-faq.json', 'src/pages/flow/specifications.astro']) {
    assert.doesNotMatch(read(p), /no watermark or export wall|charts and export|visualize, and export|Anything that ever shipped free does not later become paid/i);
  }
});

test('evergreen FAQ and essay formats disclose paid Import and Publish', () => {
  for (const p of ['src/pages/become-ai-native-business.astro', 'src/components/living/EssayChapter06.astro', 'public/downloads/room-for-a-renaissance.md']) {
    const source = read(p);
    assert.doesNotMatch(source, /exporting[^.]{0,50}free|export wall/i, p);
    assert.match(source, /Flow Import and Flow Publish are separate paid add-ons to Pro\./, p);
  }
  const chapter = read('src/components/living/EssayChapter06.astro').match(/<p>(Ownership extends to the business model\.[\s\S]*?)<\/p>/)?.[1];
  assert.ok(chapter, 'the essay retains its ownership paragraph');
  assert.ok(read('public/downloads/room-for-a-renaissance.md').includes(chapter), 'the downloadable essay carries the same pricing promise');
});

test('Flow skip is wired before Website dispatch; orphan helpers cannot reappear', () => {
  const source = read('supabase/functions/stripe-webhook/index.ts');
  assert.ok(source.indexOf('await dispatchWebsiteCommerceEvent') < source.indexOf('switch (verifiedEvent.type)'));
  const welcome = read('src/pages/flow/welcome.astro');
  assert.match(welcome, /orionfold-flow:\/\/licence\?session=/);
  assert.doesNotMatch(welcome, /import.*license-claim/);
});
