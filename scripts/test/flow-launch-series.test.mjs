// Flow launch-week story series contracts.
//
// The series is 5 to 7 first-person stories published one a day during launch
// week, drawn from the measured capability briefs in ~/orionfold-flow/docs/
// reference. Story #1 doubles as the full subscriber email body, so a false
// claim here reaches an inbox as well as the web. Each website story is the
// canonical essay reused for LinkedIn Newsletters, X Articles, Substack, and
// email. The length guard protects enough narrative depth for those channels
// without restoring the 3,000-word product inventories these essays replaced.
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

assert.equal(flowStories.length, 6, `the Flow launch sequence is five capability stories plus the ad-to-download story, found ${flowStories.length}`);

const editorialContract = {
  'the-day-i-stopped-trusting-invisible-edits.md': {
    title: 'The Edit I Never Approved',
    proof: [
      /Text changes in Flow only when you type the edit or approve the proposal/,
      /Only approval changes the file/,
    ],
  },
  'where-your-ai-actually-runs.md': {
    title: 'The Fan Was the Only Status Light',
    proof: [
      /Local, on this Mac/,
      /A fallback that would cross an execution domain stops and asks/,
      /prompt and API key have no field in that record/,
    ],
  },
  'the-fastest-model-on-your-mac.md': {
    title: 'The Faster Model Was the Bigger One',
    proof: [
      /20\.4 GB model reached its first word in 4\.5 seconds/,
      /8\.5 GB model took 10\.2 seconds/,
      /not a claim about answer quality/,
    ],
  },
  'a-search-result-is-a-citation.md': {
    title: 'The Search Result That Moved',
    proof: [
      /compares the anchored passage with the text found during search/,
      /22\.3 milliseconds at the 95th percentile/,
      /10,000 notes/,
    ],
  },
  'charts-that-come-from-the-words.md': {
    title: 'The Chart That Stayed Wrong',
    proof: [
      /34 chart types and 20 diagram types/,
      /draws the result on the Mac, offline/,
      /It adds a fenced block after them/,
    ],
  },
  // Story #6 speaks to the readers the winning Meta ad (c8, "built by one
  // founder ... could not touch a document without permission") brought in. It
  // walks the homepage racing structure (driver, car, pit crew, record) and is
  // the only story that ends on the download. Its measured numbers must stay
  // word-for-word with the stories and surfaces that own them.
  'the-pit-crew-that-never-touches-the-wheel.md': {
    title: 'The Pit Crew That Never Touches the Wheel',
    proof: [
      /could not touch a document without permission/,
      /Text changes in Flow only when you type the edit or approve the proposal/,
      /34 chart types and 20 diagram types/,
      /20\.4 GB model reached its first word in 4\.5 seconds/,
      /say nothing about answer quality/,
      /22\.3 milliseconds at the 95th percentile/,
      /\$0\.00425/,
      /::flow-cta/,
      /\[Download Flow\]\(\/flow\/\)/,
      // The above-the-fold ask lives in the first paragraph as an inline link.
      /^You may have met Orionfold in one sentence\.[^\n]*:flow-download\[Download Flow\]/m,
    ],
  },
};

for (const { file, text } of flowStories) {
  const where = (rule) => `${file}: ${rule}`;
  const body = text.split('\n---\n').slice(1).join('\n---\n').trim();
  const words = body.match(/[A-Za-z0-9$][A-Za-z0-9’'._$-]*/g) ?? [];
  const sections = body.match(/^## /gm) ?? [];
  const contract = editorialContract[file];

  // Frontmatter must be complete or the collection schema fails the build in a
  // way that names the schema, not the story.
  assert.match(text, /\ntitle: .+/, where('has a title'));
  assert.match(text, /\ndate: \d{4}-\d{2}-\d{2}/, where('has a date'));
  assert.match(text, /\nsummary: /, where('has a summary'));
  assert.ok(contract, where('is one of the six named launch stories'));
  assert.ok(text.includes(`\ntitle: ${contract.title}\n`), where('uses the accepted story title'));
  assert.ok(words.length >= 1_150 && words.length <= 1_650, where(`keeps one substantial cross-channel essay, found ${words.length} body words`));
  assert.ok(sections.length >= 3 && sections.length <= 5, where(`uses a restrained section hierarchy, found ${sections.length}`));
  assert.match(body.slice(0, 900), /\bI\b|\bmy\b/i, where('opens on a first-person event'));
  for (const proof of contract.proof) assert.match(text, proof, where(`retains required proof ${proof}`));

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
  assert.doesNotMatch(text, /\bFlow is out\b|\bships today\b|\bdownload it\b/i, where('launch-dark stories do not claim public availability'));
  assert.doesNotMatch(text, /twenty seven|\b27 finished documents\b/i, where('the Flow Guide count must not regress'));

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

// FINAL ART TRIPWIRE. The launch series must keep its curated covers and useful
// descriptions. Placeholder declarations are no longer allowed back in.
for (const { file, text } of flowStories) {
  assert.match(text, /\nhero: .*\/hero\.jpg\n/, `${file}: must use its curated JPEG cover`);
  assert.match(text, /\nheroAlt: "[^"\n]{30,}"\n/, `${file}: needs descriptive hero alt text`);
  assert.doesNotMatch(text, /placeholder artwork/i, `${file}: must not restore placeholder art`);
}

// Story #1 is the launch story and doubles as the subscriber email body. Its
// job is approval, while the overview and Tech Specs own pricing detail.
const launchStory = flowStories.find(({ file }) => file === 'the-day-i-stopped-trusting-invisible-edits.md');
assert.ok(launchStory, 'the launch story is present');
assert.match(
  launchStory.text,
  /AI proposes\. You review\. Only approval changes the file\./,
  'the launch story lands the approval lesson',
);
assert.doesNotMatch(
  launchStory.text,
  /ten dollars|ninety-six|Pro Days|local models are part of the subscription/i,
  'pricing detail stays on the overview and Tech Specs instead of interrupting the approval story',
);

// The download story carries the Flow card at its authored midpoint, and the
// card itself reads the one canonical URL and caption so it cannot drift from
// the hero, nav, and pricing buttons. It renders only while Flow is live.
const downloadStory = flowStories.find(({ file }) => file === 'the-pit-crew-that-never-touches-the-wheel.md');
assert.ok(downloadStory, 'the ad-to-download story is present');
assert.doesNotMatch(downloadStory.text, /\$10|\$96|ten dollars|ninety-six/i, 'the download story leaves the price to the overview and Tech Specs');
assert.doesNotMatch(downloadStory.text, /Flow Ideas/, 'the download story uses the racing metaphor without marketing the flag-gated Ideas feature');

const storyRoute = readFileSync(new URL('../../src/pages/story/[slug]/index.astro', import.meta.url), 'utf8');
assert.match(storyRoute, /'the-pit-crew-that-never-touches-the-wheel': \{/, 'the download story has a FLOW_CTA entry');
assert.match(storyRoute, /const flowCta = ORIONFOLD_FLOW_LIVE \? FLOW_CTA\[/, 'the Flow card is gated on the launch flag');
assert.match(storyRoute, /href=\{FLOW_DMG_URL\}/, 'the Flow card points at the one canonical download URL');
assert.match(storyRoute, /caption=\{FLOW_DOWNLOAD_CAPTION\}/, 'the Flow card carries the shared download caption');
assert.match(storyRoute, /ctaText: 'Download Flow Now'/, 'the Flow card uses the hero download label');
assert.match(storyRoute, /define:vars=\{\{ flowDmgUrl: FLOW_DMG_URL/, 'inline prose links upgrade to the one canonical download URL while live');
// Every story footer ends on Flow (operator 2026-08-26 10:03): no book magnet,
// no Proof/Relay/Arena band, one Flow block between prev/next and subscribe,
// waitlist while launch-dark and the canonical download while live.
assert.doesNotMatch(storyRoute, /MagnetBand|ProductBand/, 'the book magnet and the product band left the story footer');
assert.match(storyRoute, /<StoryPrevNext[\s\S]*?<FlowStoryCta[\s\S]*?<StorySubscribe/, 'the footer Flow block sits between prev/next and the subscribe form');
assert.match(storyRoute, /const hasMidStoryFlowCta = post\.id in FLOW_CTA;/, 'a story with the mid-article block does not repeat it at the foot');
assert.match(storyRoute, /href: '\/flow\/#waitlist',\s*ctaText: 'Join the waitlist'/, 'launch-dark footer asks for the waitlist, not a download');
assert.match(storyRoute, /href: FLOW_DMG_URL,\s*ctaText: 'Download Flow Now'/, 'live footer uses the one canonical download URL and label');
const flowStoryCta = readFileSync(new URL('../../src/components/story/FlowStoryCta.astro', import.meta.url), 'utf8');
assert.match(flowStoryCta, /<a href="\/flow\/" class="flow-story-cta__tour">\s*Flow Product Tour/, 'the Flow block carries a tour pill on its image into /flow/');
assert.match(flowStoryCta, /<a href="\/flow\/" class="flow-story-cta__figure"/, 'the Flow block image opens the Flow landing page, not the package');
assert.match(flowStoryCta, /<FlowDownloadCta source=\{downloadSource\} size="large" \/>/, 'the live Flow block reuses the home-hero download bar');
const remarkCta = readFileSync(new URL('../../src/lib/products/remark-proof-cta.mjs', import.meta.url), 'utf8');
assert.match(remarkCta, /node\.name !== 'flow-cta'/, 'the remark plugin accepts the ::flow-cta directive');
assert.match(remarkCta, /href="\/flow\/" data-flow-inline-download/, 'inline download links fall back to /flow/ without JavaScript or when Flow is off');
for (const file of Object.keys(editorialContract)) {
  assert.match(
    storyRoute,
    new RegExp(`'${file.replace(/\.md$/, '')}'`),
    `${file}: the title and human stakes render before supporting art`,
  );
}
