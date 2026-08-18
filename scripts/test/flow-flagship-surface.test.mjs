// Flow flagship surface contracts. Rewritten 2026-08-15 for the operator-
// approved Flow takeover: the homepage and /flow/ lead with real development-
// build captures, measured numbers, buyer-language copy, and waitlist capture;
// the top nav is Flow-only and the catalog lives in the footer. These
// assertions protect that surface and its truth boundaries (no Apple
// Intelligence, no pricing, gated agency, patent-pending phrasing).
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');
// Source with comments removed, for the assertions that are about what a READER
// sees. The em-dash ban is a copy rule (an em dash in body text is one of the
// AI tells the house style bans); it is not a rule about how we annotate our own
// CSS. Asserting it against the raw file conflated the two and made an
// explanatory code comment fail a copy contract.
const readCopy = (relativePath) =>
  read(relativePath)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ') // JSX-expression comments in the template
    .replace(/<!--[\s\S]*?-->/g, ' ') // HTML comments
    .replace(/\/\*[\s\S]*?\*\//g, ' ') // block comments (frontmatter + <style>)
    .replace(/^\s*\/\/.*$/gm, ' '); // whole-line // comments
const readBinary = (relativePath) => readFileSync(new URL(`../../${relativePath}`, import.meta.url));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Nav: Flow-only takeover ────────────────────────────────────────────────
const nav = read('src/components/Nav.astro');
const navArray = nav.match(/const links = \[([\s\S]*?)\n\];/)?.[1] ?? '';
const navLabels = [...navArray.matchAll(/label: '([^']+)'/g)].map((match) => match[1]);
assert.deepEqual(navLabels, ['Flow', 'Tour', 'Enterprise', 'Press', 'Story'], 'the top nav is Flow-only');
for (const retired of ['Relay', 'Arena', 'Models', 'Books', 'Training', 'Proof']) {
  assert.equal(navLabels.includes(retired), false, `${retired} stays out of the top nav (footer Products column owns it)`);
}
assert.match(nav, /href="\/flow\/#waitlist"[\s\S]*?>Join the waitlist<\/a>/, 'the nav CTA drives the Flow waitlist');
assert.doesNotMatch(nav, />Get Proposal</, 'the proposal CTA left the nav (footer keeps the path)');
assert.match(nav, /Orionfold Flow is coming to Mac/, 'the sticky bar promotes the Flow waitlist');
assert.match(nav, /of-flow-bar-dismissed/, 'the Flow bar uses its own dismissal key so old book-bar dismissals do not hide it');

// ── Footer: Products column houses the displaced flagships ─────────────────
const footer = read('src/components/Footer.astro');
const products = footer.match(/const PRODUCTS = \[([\s\S]*?)\n\];/)?.[1] ?? '';
for (const href of ['/flow/', '/relay/', '/arena/', '/advisor/', '/proof/', '/dgx-spark/']) {
  assert.match(products, new RegExp(`href: '${esc(href)}'`), `${href} must live in the footer Products column`);
}
assert.doesNotMatch(footer, /\{ key: 'flagship', label: 'Flagship' \}/, 'the flagship group left the Software sub-grid to avoid double-listing');
assert.match(footer, /flow: '\/flow\/'/);
assert.match(footer, /proof: '\/proof\/'/);
assert.match(footer, /label: 'Free AI book'/, 'the magnet funnel stays reachable from the footer');
assert.match(footer, /Site source: Apache 2\.0/);

// ── /flow/: the flagship atlas ─────────────────────────────────────────────
const flow = read('src/pages/flow.astro');
assert.match(flow, /Conduct beautiful documents with AI agency built in/, 'the locked tagline stays the H1');
assert.match(flow, /Patent pending/);
assert.match(flow, /In development · Freemium subscription planned/);
assert.match(flow, /Every screen below is the real development build/);
// Truth boundaries from the Flow capability briefs.
assert.doesNotMatch(flow, /Apple Intelligence/, 'Apple Intelligence was retired from Flow on 2026-08-14 and must not appear');
assert.doesNotMatch(readCopy('src/pages/flow.astro'), /—/, 'Flow landing-page copy must not use em dashes');
assert.doesNotMatch(flow, /data-checkout=/, 'Flow must not expose checkout before commercial terms exist');
assert.doesNotMatch(flow, /\$\d+\s*(?:\/|per\s)/i, 'no price tiers exist yet, so none may be implied');
assert.match(flow, /Install nothing but Flow\./, 'the runtime story stays "built so that", led by its own chapter');
assert.match(flow, /patent-pending technology for revision-scoped, verifiable AI agency in durable documents/);
// Measured numbers with dates (the stat band).
for (const value of ['22.3 ms', '620,000', '$0.00425', '+19.2 MiB', '5 actions', '4 domains']) {
  assert.match(flow, new RegExp(esc(value)), `${value} must stay in the measured stat band`);
}
assert.match(flow, /2026-08-04/, 'the search measurement keeps its date');
// The four execution domains, named exactly.
assert.match(flow, /Local, LAN, Cloud prepaid, Cloud postpaid/);
// Section order: tour → enterprise → stack → press → waitlist.
const anchors = ['id="tour"', 'id="enterprise"', 'id="stack"', 'id="press"', 'id="waitlist"'];
const anchorIndexes = anchors.map((a) => flow.indexOf(a));
assert.ok(anchorIndexes.every((i) => i >= 0), 'every landing anchor must exist');
assert.deepEqual([...anchorIndexes].sort((a, b) => a - b), anchorIndexes, 'anchor order must stay tour, enterprise, stack, press, waitlist');
// Each tour chapter stays deep-linkable AND stays clear of the fixed nav when
// jumped to. The two are asserted separately because the class list is not
// order-stable: the 2026-08-16 typography pass added .of-display alongside
// scroll-mt-28, and a combined "id then class" regex broke on the reorder
// while the anchors themselves were still perfectly fine.
for (const id of ['tour-agency', 'tour-longdocs', 'tour-domains', 'tour-runtime', 'tour-resources', 'tour-search', 'tour-tables', 'tour-files']) {
  const heading = flow.match(new RegExp(`<h3[^>]*\\sid="${id}"[^>]*>`))?.[0];
  assert.ok(heading, `${id} must stay a linkable tour chapter heading`);
  assert.match(heading, /\bscroll-mt-28\b/, `${id} must clear the fixed nav when deep-linked`);
}
// Real capture rail: every tour shot comes from the dev-build capture set.
assert.match(flow, /import FlowShot from '\.\.\/components\/flow\/FlowShot\.astro'/);
// The requirement is provenance, not a headcount: every picture on the page has
// to come from the real development-build capture set (or a purpose-cut crop of
// one) rather than a stock or mocked image. Asserting an exact number made an
// ordinary edit — 2026-08-16 replaced the raw readout strip with a legible crop
// cut from that same strip — look like a contract breach when nothing about the
// provenance rule had changed.
// Product imagery only: the app icon also lives under assets/flow/ and is
// brand art, not evidence, so it is deliberately outside this rule.
const flowProductImages = [...flow.matchAll(/from '\.\.\/assets\/flow\/(shots|details)\/([^']+)'/g)];
assert.ok(flowProductImages.length >= 8, 'the tour keeps its rail of real captures');
for (const [, dir, file] of flowProductImages) {
  assert.match(file, /\.webp$/, `${file} must ship as webp`);
  assert.ok(
    existsSync(new URL(`../../src/assets/flow/${dir}/${file}`, import.meta.url)),
    `${dir}/${file} must exist on disk`,
  );
}
// Both frames stay on the page: a crop proves one control is real, a whole
// window proves it is a real Mac app. A page of crops alone loses the second.
assert.ok(flowProductImages.some(([, dir]) => dir === 'shots'), 'the tour keeps whole-window captures for context');
assert.ok(flowProductImages.some(([, dir]) => dir === 'details'), 'the tour keeps legible purpose-cut crops');
// ── Legible feature details (2026-08-16 Apple-style imagery pass) ──────────
// A full 2560x1400 window rendered into a page column shows the control a
// section is describing at roughly eight pixels tall, so the claim cannot be
// checked by eye. Every detail below is a purpose-cut crop of ONE control from
// the same real capture, produced by scripts/prepare-flow-details.mjs and shown
// near 1:1. These assertions keep the crops present, generated, and captioned.
const detailScript = read('scripts/prepare-flow-details.mjs');
assert.match(flow, /import FlowDetail from '\.\.\/components\/flow\/FlowDetail\.astro'/);
for (const detail of [
  'detail-proposal', 'detail-checks', 'detail-diff', 'detail-domains',
  'detail-runtime-storage', 'detail-parts', 'detail-grid', 'detail-search',
]) {
  assert.match(detailScript, new RegExp(`out: '${esc(detail)}\\.webp'`), `${detail} must stay a generated crop`);
  assert.ok(
    existsSync(new URL(`../../src/assets/flow/details/${detail}.webp`, import.meta.url)),
    `${detail}.webp must be committed (re-run scripts/prepare-flow-details.mjs)`,
  );
}
// Every crop is cut from a real development-build capture, never a mock.
for (const [, from] of detailScript.matchAll(/from: '([^']+)'/g)) {
  assert.ok(
    existsSync(new URL(`../../src/assets/flow/shots/${from}`, import.meta.url)),
    `${from} must exist in the capture set that the crops are cut from`,
  );
}
// The crops are magnified fragments, so they carry no window chrome and must
// say what is on screen; an uncaptioned crop reads as a stray UI screenshot.
const flowDetailComponent = read('src/components/flow/FlowDetail.astro');
assert.match(flowDetailComponent, /caption &&/, 'FlowDetail renders its caption when given one');
// Anchored to line-start so the rule catches a real declaration and not the
// comment that explains why the declaration is banned.
assert.doesNotMatch(flowDetailComponent, /^\s+filter:\s*blur\(/m, 'blur filters stay out of the shot frame (retina scroll-jank source)');

// The Living Workbench concept illustration closes the probe section.
assert.match(flow, /import FlowWorkbenchIllustration from '\.\.\/components\/flow\/FlowWorkbenchIllustration\.astro'/);
assert.match(flow, /<FlowWorkbenchIllustration \/>/);
assert.match(flow, /The whole promise in one picture\./);
// Enterprise adoption patterns: nine question cards, honestly tagged.
const enterpriseSource = flow.match(/const enterprise = \[([\s\S]*?)\n\];/)?.[1] ?? '';
for (const k of ['Allocation', 'Data classification', 'Attribution', 'Guardrails', 'Evidence', 'Routing', 'Curation', 'System of record', 'Knowledge mining']) {
  assert.match(enterpriseSource, new RegExp(`k: '${k}'`), `${k} must remain an enterprise pattern card`);
}
assert.match(enterpriseSource, /tag: 'Direction'/, 'unshipped patterns stay honestly tagged as Direction');
// Press kit and FAQ.
assert.match(flow, /The facts, ready to quote\./);
assert.match(flow, /manav@orionfold\.com/);
assert.match(flow, /'@type': 'FAQPage'/);
assert.match(flow, /'@type': 'SoftwareApplication'/);
assert.match(flow, /How is Flow different from a chat canvas or artifacts panel\?/);
// The waitlist stays the closing conversion surface.
assert.match(flow, /<FlowWaitlist placement="flow" storyHref=\{flowStoryHref\} \/>/);
assert.ok(flow.indexOf('<FlowWaitlist placement="flow"') > flow.indexOf('id="press"'));

// ── The mid-tour CTA repeat (2026-08-18) ──
// The tour is eight chapters long and the closer sits past all of them, so the
// offer is repeated at the halfway seam. The risk this guards is NOT that the
// section goes missing — it is that someone "simplifies" it to a second
// placement="flow". That would emit the same formId twice, and formId seeds
// five DOM ids plus the section's aria-labelledby, so the page would carry
// duplicate ids and the label association would break. It would also collapse
// both CTAs onto one attribution source, making them indistinguishable in
// conversion data. Hence: distinct placement, and it must come BEFORE the
// chapter it hands off to.
assert.match(flow, /<FlowWaitlist placement="flow-mid"/, 'the mid-tour CTA must use its own placement');
assert.ok(
  flow.indexOf('<FlowWaitlist placement="flow-mid"') < flow.indexOf('aria-labelledby="tour-domains"'),
  'the mid-tour CTA must sit at the seam, before the domains chapter',
);
assert.ok(
  flow.indexOf('<FlowWaitlist placement="flow-mid"') < flow.indexOf('<FlowWaitlist placement="flow"'),
  'the mid-tour CTA must come before the closing one',
);
// One offer, two surfaces: the placements must resolve to DIFFERENT form ids
// (no duplicate DOM ids) and therefore different attribution sources.
const waitlistComponent = read('src/components/sections/FlowWaitlist.astro');
assert.match(waitlistComponent, /'home' \| 'flow' \| 'flow-mid'/);
assert.match(waitlistComponent, /'flow-mid-waitlist'/);
for (const id of ["'home-flow-waitlist'", "'flow-mid-waitlist'", "'flow-page-waitlist'"]) {
  assert.ok(waitlistComponent.includes(id), `FlowWaitlist must keep a distinct form id for ${id}`);
}

// ── Homepage: the demand-generation front door ─────────────────────────────
const home = read('src/pages/index.astro');
assert.match(home, /title=\{`\$\{SITE\.tagline\} · Orionfold`\}/);
assert.match(home, /description=\{SITE\.description\}/);
assert.match(home, /jsonLd=\{\[flowSchema\]\}/, 'the homepage carries the Flow SoftwareApplication entity');
// Hero copy, operator-written 2026-08-16 against the resource-popover picture.
// "open" is load-bearing in the headline — it is the positioning wedge, not a
// stray adjective, so it is asserted rather than left to a loose match.
assert.match(home, /Bring open AI models to your documents/);
assert.match(home, /Patent pending/);
// Asserted sentence by sentence, not as one run of text: each lives in its own
// <span> so it can be set nowrap on large screens (one sentence per line), and
// a regex spanning the markup between them would break on any layout tweak.
// Open-first is not open-only — the last two sentences head off "so I am stuck
// with small local models", and dropping them leaves the headline limiting.
for (const sentence of [
  'Stay in control of cost, privacy, and quality on your Mac.',
  'Switching to frontier models is a checkbox.',
  'Flow selects the best model for the job.',
]) {
  assert.match(home, new RegExp(esc(sentence)), `the hero lede keeps: ${sentence}`);
}
// The approval promise left the hero but must not leave the homepage — it moved
// into the leading capability band, which still shows it with the diff crop.
assert.match(home, /Nothing is saved until you approve it\./, 'the approval gate stays on the homepage after moving out of the hero');
assert.match(home, /You draft in a chat window, paste into your document/, 'the copy-paste argument stays on the page, in the problem band');
assert.match(home, /Chat is where work evaporates\./, 'the buyer-language problem band leads the argument');
assert.doesNotMatch(readCopy('src/pages/index.astro'), /—/, 'homepage copy must not use em dashes');
// Hero waitlist capture with its own attribution source and the canonical consent.
assert.match(home, /id="home-hero-waitlist"/);
assert.match(home, /source="home-hero-waitlist"/);
assert.match(home, /offer="flow-waitlist"/);
const flowWaitlistComponent = read('src/components/sections/FlowWaitlist.astro');
const consent = home.match(/consentText =\s*\n\s*'([^']+)'/)?.[1];
assert.ok(consent, 'the hero form declares its consent copy');
assert.ok(flowWaitlistComponent.includes(consent), 'hero consent copy must stay byte-identical to FlowWaitlist');
// Real capture hero + capability rows into the tour.
assert.match(home, /<FlowShot[\s\S]*?priority/, 'the hero shot stays the eager LCP image');
// The homepage pairs each window with a legible crop of the control its
// headline names (2026-08-16 imagery pass), same rationale as /flow/ above.
assert.match(home, /import FlowDetail from '\.\.\/components\/flow\/FlowDetail\.astro'/);
// The requirement is that the DIFF stays proven with a picture — not that the
// hero is where that happens. On 2026-08-16 the resource popover took the hero
// slot and the approval story moved into the leading capability band, so this
// asserts the crop is on the page rather than pinning it to one section. The
// hero itself deliberately carries NO crop: its capture is legible whole, and
// the overlay exists to rescue an illegible control, not as decoration.
assert.match(home, /detail: detailDiff/, 'the diff crop stays on the homepage, in the band that now makes the approval claim');
assert.match(home, /<FlowDetail[\s\S]*?src=\{row\.detail\}/, 'the capability bands render their crops');
assert.match(home, /<FlowDetail[\s\S]*?src=\{row\.detail\}/, 'every capability band carries its own legible crop');
for (const detailImport of ['detailDiff', 'detailDomains', 'detailParts', 'detailGrid']) {
  assert.match(home, new RegExp(`import ${detailImport} from '\\.\\./assets/flow/details/`), `${detailImport} must come from the generated crop set`);
}
for (const href of ['/flow/#tour-longdocs', '/flow/#tour-domains', '/flow/#tour-files', '/flow/#enterprise', '/flow/#press']) {
  assert.match(home, new RegExp(esc(href)), `${href} must stay linked from the homepage`);
}
// The origin story band replaces the founder section.
assert.match(home, /The origin story/i);
assert.match(home, /Limitless, without the pill\./);
assert.match(home, /assets\/story\/limitless-without-the-pill\/hero\.png/);
assert.equal((home.match(/href="\/story\/limitless-without-the-pill\/"/g) ?? []).length, 2, 'the origin card and its text action share the canonical story route');
// The catalog bands moved to the footer; they must not return to the homepage.
for (const retired of ['RelayBand', 'FieldEditionBand', 'CatalogShelf', 'CapabilitySystemMap', 'HomeFlowIntro', 'FromTheFounder', 'RelayHostBox', 'Highlights', 'StoriesCarousel']) {
  assert.doesNotMatch(home, new RegExp(`<${retired}`), `${retired} stays off the Flow-first homepage`);
}
// Order: hero → problem band → wedge → rows → enterprise → stack → origin → waitlist.
const homeOrder = [
  'class="home-hero',
  'Chat is where work evaporates.',
  'A silent rewrite is not a feature. It is a risk.',
  'For enterprise AI owners',
  'One company, one stack',
  'The origin story',
  '<FlowWaitlist placement="home" />',
].map((marker) => home.indexOf(marker));
assert.ok(homeOrder.every((i) => i >= 0), 'every homepage band must exist');
assert.deepEqual([...homeOrder].sort((a, b) => a - b), homeOrder, 'homepage band order must hold');

// ── Waitlist funnel contracts (unchanged rails) ────────────────────────────
for (const phrase of [
  "'home-flow-waitlist'",
  "'flow-page-waitlist'",
  'offer="flow-waitlist"',
  'Join the waitlist',
  'Check your inbox to confirm.',
  'AI For Everyone digest, one email a week, no more',
  'href="/privacy/"',
]) {
  assert.match(flowWaitlistComponent, new RegExp(esc(phrase)));
}
assert.match(flowWaitlistComponent, /import WaitlistForm from '\.\.\/ui\/WaitlistForm\.astro'/);
assert.doesNotMatch(flowWaitlistComponent, /type="(text|tel|number)"/, 'Flow waitlist must remain email-only apart from the shared honeypot');

// ── The Living Workbench illustration component (unchanged) ────────────────
const flowWorkbench = read('src/components/flow/FlowWorkbenchIllustration.astro');
assert.match(flowWorkbench, /import lightMaster from '\.\.\/\.\.\/assets\/flow\/living-workbench-light-alpha-v2\.png'/);
assert.match(flowWorkbench, /import darkMaster from '\.\.\/\.\.\/assets\/flow\/living-workbench-dark-alpha-v2\.png'/);
assert.match(flowWorkbench, /data-relay-shot/);
assert.match(flowWorkbench, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation: none !important/);
const transparentLight = readBinary('src/assets/flow/living-workbench-light-alpha-v2.png');
const transparentDark = readBinary('src/assets/flow/living-workbench-dark-alpha-v2.png');
assert.equal(
  createHash('sha256').update(transparentLight).digest('hex'),
  '900356a19c851ebb75889d58ffa62b6d42a28d7c112c8402bb501c585ee804d6',
  'the source-faithful transparent light-theme Living Workbench master must not drift',
);
assert.equal(
  createHash('sha256').update(transparentDark).digest('hex'),
  'eb26b2d6a624c6b7eee14e5cd5256c6b02d5bf87d9e894c802c269fe3059cd55',
  'the source-faithful transparent dark-theme Living Workbench master must not drift',
);

// ── The operator-written origin story stays intact ─────────────────────────
const flowStory = read('src/content/story/limitless-without-the-pill.md');
const flowStoryBody = flowStory.split('\n---\n').slice(1).join('\n---\n').trim();
assert.equal(flowStoryBody.length, 28_779, 'operator-written X article body must remain complete after link cleanup');
assert.equal(
  createHash('sha256').update(flowStoryBody).digest('hex'),
  '7a100eae06a80c1e1143830bfeee59ec56dc739c6c5835ab90e6c9f23387f380',
  'operator-written article wording, order, citations, lists, and link treatment must stay intact',
);
assert.equal(
  createHash('sha256').update(readBinary('src/assets/story/limitless-without-the-pill/hero.png')).digest('hex'),
  'cc6a5f04f26518316dafa1bbd282e5c728f8cba41c11f9b0008dfc44e7de7545',
  'the operator-supplied story creative must remain intact',
);

// ── Sibling product pages keep the shared rail ─────────────────────────────
assert.match(read('src/pages/relay/index.astro'), /<ProductLineRail current="relay"/);
assert.match(read('src/pages/arena.astro'), /<ProductLineRail current="arena"/);
assert.match(read('src/pages/proof.astro'), /<ProductLineRail class=/);

// ── Catalog SSOT: Flow leads the flagship group ────────────────────────────
const software = read('src/data/software.ts');
const flowIndex = software.indexOf("slug: 'flow'");
const relayIndex = software.indexOf("slug: 'relay'");
const arenaIndex = software.indexOf("slug: 'arena'");
assert.ok(flowIndex >= 0 && flowIndex < relayIndex && relayIndex < arenaIndex, 'software order must be Flow, Relay, Arena');
assert.match(software.slice(flowIndex, relayIndex), /group: 'flagship'/);
assert.match(software.slice(flowIndex, relayIndex), /'Patent pending'/, 'the Flow catalog entry carries the patent-pending pill');

// ── Terms keep the proprietary-product disclosure ──────────────────────────
const terms = read('src/pages/terms.astro');
assert.match(terms, /publishes open-source software and also develops proprietary commercial software/);
assert.match(terms, /Proprietary products, including Orionfold Flow/);

// ── OG cards: light hero-grid cards with the real capture ──────────────────
const ogData = read('src/data/og.ts');
const ogFlow = ogData.match(/'\/flow\/': \{([\s\S]*?)\n  \},/)?.[1] ?? '';
const ogHome = ogData.match(/'\/': \{([\s\S]*?)\n  \},/)?.[1] ?? '';
for (const entry of [ogFlow, ogHome]) {
  assert.match(entry, /Orionfold Flow · Patent pending/);
  assert.match(entry, /light: true/);
}
// Each flagship card carries its OWN capture, cropped from that page's hero
// picture. They shared one screenshot until 2026-08-16, which is how both cards
// kept showing a retired shot after the heroes were rebuilt.
const ogShots = [ogHome, ogFlow].map((entry) => entry.match(/screenshot: '([^']+)'/)?.[1]);
assert.deepEqual(
  ogShots,
  ['src/assets/flow/og-home-shot.png', 'src/assets/flow/og-flow-shot.png'],
  'the home and flow cards each point at their own hero-derived capture',
);
for (const shot of ogShots) {
  // Satori cannot decode webp, and the card frames the file at its native size,
  // so a card screenshot must be a PNG that is actually on disk at 660x338.
  // Downscaling a 2560px capture into the frame is what made the UI text in
  // these cards unreadable, so the crop is baked into the asset, not the render.
  assert.ok(shot.endsWith('.png'), `${shot} must be a PNG for Satori to decode`);
  assert.ok(existsSync(new URL(`../../${shot}`, import.meta.url)), `${shot} must exist on disk`);
  // PNG IHDR: 8-byte signature, 4-byte length, 4-byte type, then width/height.
  const png = readBinary(shot);
  assert.deepEqual(
    { width: png.readUInt32BE(16), height: png.readUInt32BE(20) },
    { width: 660, height: 338 },
    `${shot} must be pre-cropped to the card frame`,
  );
}
const ogCard = read('src/lib/og/card.ts');
assert.match(ogCard, /function heroGridSvg\(\)/, 'the light card draws the hero gradient + fading grid');
assert.match(ogCard, /brandLockup\(true\)/, 'light cards carry the full brand lockup with the origami mark');
const ogEndpoint = read('src/pages/og/[slug].jpg.ts');
assert.match(ogEndpoint, /endsWith\('\.webp'\)/, 'Satori cannot decode webp, so webp screenshots must fall back to the banner');

// ── AEO surfaces stay Flow-first ───────────────────────────────────────────
const llms = read('public/llms.txt');
assert.match(llms, /patent-pending AI agency built in/);
assert.match(llms, /\[Flow\]\(https:\/\/orionfold\.com\/flow\/\)/);
for (const anchor of ['flow/#tour', 'flow/#enterprise', 'flow/#press']) {
  assert.match(llms, new RegExp(esc(anchor)), `llms.txt must feed the ${anchor} surface to answer engines`);
}
const astroConfig = read('astro.config.mjs');
assert.match(astroConfig, /map\['\/flow\/'\] = '\d{4}-\d{2}-\d{2}'/, 'the hand-built Flow landing tracks an honest sitemap lastmod');
assert.match(read('tests/e2e/critical-routes.spec.ts'), /'\/flow\/'/);

console.log('[flow-flagship-surface] Flow leads with real captures, truthful claims, and waitlist capture; the catalog lives in the footer');
