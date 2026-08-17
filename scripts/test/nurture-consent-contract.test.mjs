// Cross-repo nurture contract. Added 2026-08-16 when the nurture funnel was
// refocused on Orionfold Flow.
//
// WHY THIS TEST LIVES HERE. The nurture emails are composed and sent by the
// MARKETING repo (marketing/.claude/skills/lead-pipeline/scripts/nurture_send.py),
// but the thing that makes them legal is authored HERE: the consent sentence a
// reader agrees to on the capture form, and the offer key stamped alongside it.
// Marketing branches on that offer key and mails strictly inside that consent
// scope. So the two repos share a contract with no shared code, and the failure
// is silent and one-directional: someone edits a consent sentence or an offer
// key on this side, the capture keeps working, the site still builds, and the
// nurture leg in the other repo quietly starts mailing outside the scope its
// recipients agreed to. Nothing else on either side catches that.
//
// This file therefore asserts ONLY the website-owned half of the contract, in
// the marketing lane's terms. Marketing owns the mirror-image guards (branch
// routing is MECE, digest-scope copy carries no hard offer, cadence >= 7 days)
// in test_nurture_send.py.
//
// MECE ownership, stated once so neither lane drifts into the other:
//   website   = capture, consent text, offer key, double opt-in, delivery,
//               suppression (unsubscribe + bounce/complaint), send transport.
//   marketing = who gets mailed, when, and what it says (selection, branch,
//               cadence, copy), logged to leads/ as the system of record.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

const flowWaitlist = read('src/components/sections/FlowWaitlist.astro');
const waitlistForm = read('src/components/ui/WaitlistForm.astro');
const magnet = read('src/pages/become-ai-native-business.astro');

// ── 1. The two consent scopes marketing branches on ───────────────────────
// Flow-waitlist readers agree to Flow updates BY NAME. That single clause is
// the entire legal basis for the Flow nurture branch (F1..F4). Remove it and
// marketing must stop sending that branch.
assert.match(
  flowWaitlist,
  /you agree to receive Flow development and launch updates/,
  'the Flow waitlist consent must keep naming Flow updates: it is the legal basis for the Flow nurture branch',
);

// Everyone else agreed to the digest ONLY. Marketing therefore restricts the
// non-Flow audience to editorial where Flow is the subject, never a bare pitch.
assert.match(
  waitlistForm,
  /the AI For Everyone digest, one email a week, no more/,
  'the default consent must keep the digest-only scope the digest nurture branch is written against',
);

// ── 2. The weekly ceiling ─────────────────────────────────────────────────
// Both consent sentences promise "one email a week, no more". Marketing enforces
// it with NURTURE_MIN_GAP_DAYS = 7. If this promise is ever loosened here, that
// constant is the thing that must change with it.
for (const [name, source] of [['FlowWaitlist', flowWaitlist], ['WaitlistForm', waitlistForm]]) {
  assert.match(
    source,
    /one email a week, no more/,
    `${name} must keep the weekly cadence promise the nurture leg is capped against`,
  );
}

// ── 3. The offer keys marketing routes on ─────────────────────────────────
// `flow-waitlist` selects the Flow branch; `become-ai-native-business` selects
// the digest branch. These strings are the join between the two repos.
assert.match(
  flowWaitlist,
  /offer="flow-waitlist"/,
  'the Flow capture must keep the offer key the nurture leg routes the Flow branch on',
);
assert.match(
  magnet,
  /offer="become-ai-native-business"/,
  'the magnet capture must keep the offer key the nurture leg routes the digest branch on',
);

// ── 4. Double opt-in stays the gate ───────────────────────────────────────
// Marketing only mails double_optin: confirmed. That value originates from the
// confirm-email round trip on this side; a capture that stopped requiring
// confirmation would strand every new contact as permanently unmailable.
const confirmEmail = read('supabase/functions/confirm-email/index.ts');
assert.match(
  confirmEmail,
  /confirmed: true/,
  'confirm-email must keep setting confirmed: true — it is the flag the nurture leg gates every send on',
);

// ── 5. Suppression stays one-directional ──────────────────────────────────
// Unsubscribes/bounces/complaints are written here and DRAINED by marketing into
// mailable:false. The export is the only way that reaches the nurture leg.
const suppressionsExport = read('supabase/functions/suppressions-export/index.ts');
assert.match(
  suppressionsExport,
  /suppressions/,
  'suppressions-export must keep serving the suppression feed the nurture leg drains before every send',
);

console.log('nurture consent contract: ok');
