import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../../src/pages/relay/host.astro', import.meta.url), 'utf8');

const requiredQuestions = [
  'Can I give each of my customers their own Relay workspace?',
  'How does my customer open their Cell?',
  'How does the customer create their login?',
  'Does the customer need to install Relay?',
  'Can more than one person use the same customer Cell?',
  'Can one customer see another customer’s Cell?',
  'Can I, as the Host administrator, access a customer’s Cell?',
  'When should a customer receive a separate Host instead of a Cell on mine?',
  'Is customer onboarding automatic?',
  'What happens if a customer loses their password?',
  'What happens when I stop managing a customer?',
  'How many customers can one Relay Host serve?',
  'Is this the same as Orionfold hosting Relay for my customers?',
  'Where can I find the setup instructions?',
];

for (const question of requiredQuestions) {
  assert.match(page, new RegExp(question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `missing FAQ: ${question}`);
}

for (const phrase of [
  'a separate managed Relay Cell for each customer',
  'authenticated browser access',
  'one built-in administrator credential per Cell',
  'Same-Host Cells trust the Host administrator',
  'guided manual setup',
]) {
  assert.match(page, new RegExp(phrase, 'i'), `missing customer-access guardrail: ${phrase}`);
}

assert.match(page, /id="customer-cell-access" class="scroll-mt-36/, 'customer access FAQ anchor must clear the fixed navigation');
assert.match(page, /relay\/blob\/v0\.44\.9\/docs\/digitalocean-relay-host\.md/, 'DigitalOcean guide must be release matched');
assert.match(page, /relay\/blob\/v0\.44\.9\/docs\/relay-host-access\.md/, 'Host access guide must be release matched');
assert.match(page, /mainEntity: \[/, 'customer access questions must be included in FAQPage structured data');
assert.doesNotMatch(page, /one-click customer invitations (?:are|is) (?:available|supported)/i, 'FAQ must not claim automated invitations');

console.log('relay-host-access-faq: canonical guided-beta access answers and trust boundaries pass');
