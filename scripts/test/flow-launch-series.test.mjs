// Flow launch-week story series contracts.
//
// The series is 5 to 7 first-person stories published one a day during launch
// week, drawn from the measured capability briefs in ~/orionfold-flow/docs/
// reference. Story #1 doubles as the full subscriber email body, so a false
// claim here reaches an inbox as well as the web.
//
// These guards exist because the series repeats, in prose, the exact claims the
// Flow surface tests protect in markup. A rule enforced on /flow/ and not in a
// story is not enforced: the story is the surface a reader actually reads, and
// it is the one a language model quotes.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const STORY_DIR = new URL('../../src/content/story/', import.meta.url);
const read = (file) => readFileSync(new URL(file, STORY_DIR), 'utf8');

// The series is identified by tag AND publication date rather than a hardcoded
// filename list, so a story added later in launch week is guarded automatically
// instead of silently escaping.
//
// The date floor matters: `limitless-without-the-pill.md` (2026-07-22) carries
// the same Flow tag but was published BEFORE these copy rules existed, and it
// contains 7 em dashes. Retroactively failing the build over already-published
// prose would be a guard punishing history rather than protecting the launch, so
// the window starts at the launch story. Every other pre-existing story is
// already clean, so the floor costs no real coverage.
const SERIES_START = '2026-08-22';
const flowStories = readdirSync(STORY_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((file) => ({ file, text: read(file) }))
  .filter(({ text }) => /^tags:[\s\S]*?- Orionfold Flow/m.test(text))
  .filter(({ text }) => (text.match(/\ndate: (\d{4}-\d{2}-\d{2})/)?.[1] ?? '') >= SERIES_START);

assert.ok(flowStories.length >= 3, `expected the Flow series to exist, found ${flowStories.length}`);

for (const { file, text } of flowStories) {
  const where = (rule) => `${file}: ${rule}`;

  // Frontmatter must be complete or the collection schema fails the build in a
  // way that names the schema, not the story.
  assert.match(text, /\ntitle: .+/, where('has a title'));
  assert.match(text, /\ndate: \d{4}-\d{2}-\d{2}/, where('has a date'));
  assert.match(text, /\nsummary: /, where('has a summary'));

  // HOUSE COPY RULE: no em dashes in body text. This is the single most common
  // failure when prose is drafted at length.
  assert.doesNotMatch(text, /—/, where('must not use em dashes'));

  // PRICING TRUTH BOUNDARIES. Each of these mirrors a guard on the Flow surface.
  // A Pro Day is spent only on a day the reader actually invokes AI, so any
  // calendar countdown is false.
  assert.doesNotMatch(text, /free trial/i, where('Flow has a Pro Day grant, not a calendar free trial'));
  assert.doesNotMatch(text, /\b\d+\s*(?:Pro )?days? (?:free|left|remaining)/i, where('no Pro Days countdown'));
  // Flow is BYOK, so there is no marginal cost to meter and nothing to call a credit.
  assert.doesNotMatch(text, /\busage allowance\b/i, where('never meter Flow as an allowance'));

  // THE MOST DANGEROUS CLAIM IN THE WHOLE SERIES. The gate sits ABOVE the runner
  // protocol, so local models are part of the paid subscription. "Bring your own
  // model and it is free" would generate refund requests on day one.
  assert.doesNotMatch(
    text,
    /bring your own model[^.]{0,40}\bfree\b/i,
    where('"bring your own model and it is free" is FALSE'),
  );

  // VOCABULARY BAN. The app's own screens use person-words, and the briefs warn
  // the publisher explicitly: implementation vocabulary must not reach public copy.
  for (const banned of [/\bTTFT\b/i, /\bprefill\b/i, /\btok\/s\b/i, /\bKV cache\b/i, /\bquantization\b/i]) {
    assert.doesNotMatch(text, banned, where(`must not use implementation vocabulary ${banned}`));
  }

  // NOT YET PUBLISHABLE. A real appcast has never served a real update, so the
  // self-update claim is not true yet. (A lapsed subscriber still RECEIVING
  // updates is safe to say, and is deliberately not matched here.)
  assert.doesNotMatch(text, /Flow can update itself/i, where('the self-update claim is not publishable yet'));
}

// PLACEHOLDER ARTWORK TRIPWIRE. Every story in the series carries a hero so the
// pages are not bare, but the current images are locally generated placeholders
// that say so on their own face. This asserts the pairing stays honest: a story
// with a hero must carry alt text, and while the alt text still says
// "Placeholder artwork" the note explaining how to replace it must survive.
//
// This guard is meant to FAIL once real creative lands, at which point the alt
// text describes the real picture and this block is deleted. That is the signal,
// not a bug.
for (const { file, text } of flowStories) {
  if (!/\nhero: /.test(text)) continue;
  assert.match(text, /\nheroAlt: /, `${file}: a hero image needs alt text`);
  if (/Placeholder artwork/i.test(text)) {
    assert.match(
      text,
      /# PLACEHOLDER ARTWORK\./,
      `${file}: placeholder art must keep the note saying how to replace it`,
    );
  }
}

// Story #1 is the launch story and doubles as the subscriber email body, so it
// carries the promise the whole pricing model rests on.
const launchStory = flowStories.find(({ file }) => file === 'the-day-i-stopped-trusting-invisible-edits.md');
assert.ok(launchStory, 'the launch story is present');
assert.match(
  launchStory.text,
  /Your documents are free forever\. The AI is what you pay for\./,
  'the launch story states the promise verbatim',
);
// It must be explicit about the local-model line rather than silent on it,
// because silence is what lets a reader assume the convenient wrong thing.
assert.match(
  launchStory.text,
  /[Ll]ocal models are part of the subscription/,
  'the launch story states plainly that local models are paid',
);
