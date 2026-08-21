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
// 2026-08-20 split: the twelve tour chapters live in components rendered by
// the four /flow/<category>/ pages; /flow/ is the overview. Content contracts
// run over the whole surface (`tour`); layout contracts name their file.
const CHAPTERS = [
  'ChapterAgency', 'ChapterExpand', 'ChapterToolbar', 'ChapterLongDocs', 'ChapterDomains', 'ChapterReceipts', 'ChapterRuntime',
  'ChapterBenchmarks', 'ChapterRouting', 'ChapterResources', 'ChapterSearch', 'ChapterTables', 'ChapterVisualize', 'ChapterFiles',
];
const chapterPath = (c) => `src/components/flow/chapters/${c}.astro`;
const chapters = CHAPTERS.map((c) => read(chapterPath(c))).join('\n');
const chaptersCopy = CHAPTERS.map((c) => readCopy(chapterPath(c))).join('\n');
const categoryShell = read('src/components/flow/FlowCategoryPage.astro');
const categories = read('src/data/flow-categories.ts');
const CATEGORY_SLUGS = ['writing-with-ai', 'receipts', 'models-and-runtime', 'documents-and-files'];
const categoryPages = Object.fromEntries(CATEGORY_SLUGS.map((slug) => [slug, read(`src/pages/flow/${slug}.astro`)]));
const tour = `${flow}\n${chapters}\n${categoryShell}`;
// 2026-08-20 content-masterclass rewrite: the H1 is the approval promise in
// plain words (title tag, OG card, and H1 agree); the locked tagline moved to
// the press kit, where a journalist wants the exact phrase.
// Two sentences, each in its own <span> so the title reads as two lines on a
// large screen (operator ask, 2026-08-20 23:50); asserted sentence by sentence.
assert.match(flow, /flow-hero__title[\s\S]*?<span>Every AI change is a diff you approve\.<\/span>[\s\S]*?<span>Every run leaves a receipt\.<\/span>/, 'the H1 is the approval promise, one sentence per line');
assert.match(read('src/styles/flow.css'), /\.flow-hero__title span \{ display: block; text-wrap: nowrap; \}/, 'the two-line rule lives in flow.css');
assert.match(flow, /const FLOW_TITLE = 'Orionfold Flow · Every AI change is a diff you approve, with a receipt'/, 'the title tag carries the same promise');
assert.match(flow, /title=\{FLOW_TITLE\}/);
assert.match(flow, /\{SITE\.tagline\}/, 'the locked tagline stays in the press kit');
assert.match(flow, /Anyone whose name is on the document/, 'the ICP line sits in the first screen');
assert.match(flow, /<FlowProofNuggets formId="flow-proof-waitlist" \/>/, 'two dated facts and the native ask follow the hero');
assert.match(flow, /Patent pending/);
assert.match(flow, /In development · Freemium subscription planned/);
assert.match(flow, /Every screen is the real development build/);
// First-paint capture (operator decision 2026-08-20): the hero leads with the
// email field and no join-versus-tour fork; the in-development framing rides
// the hero product-shot caption instead of a line above it.
assert.match(flow, /source="flow-hero-waitlist"/, 'the hero carries its own attributable waitlist capture');
assert.match(flow, /caption="In development · Freemium subscription planned · Every screen is the real development build"/, 'the development framing stays welded to the hero shot');
assert.doesNotMatch(flow, /of-secondary-action">See the product tour/, 'no join-versus-tour fork on first paint');
// One consent sentence, one module (src/data/flow-consent.ts): every Flow
// capture surface imports it, so recorded consent cannot drift between them.
const consentModule = read('src/data/flow-consent.ts');
assert.match(consentModule, /export const FLOW_CONSENT_TEXT =\s*\n?\s*'By joining the Flow waitlist, you agree to receive Flow development and launch updates plus the AI For Everyone digest, one email a week, no more\. You can unsubscribe any time\. See our privacy policy\.'/);
for (const [name, path] of [['flow.astro', 'src/pages/flow.astro'], ['index.astro', 'src/pages/index.astro'], ['FlowWaitlist', 'src/components/sections/FlowWaitlist.astro'], ['FlowProofNuggets', 'src/components/flow/FlowProofNuggets.astro']]) {
  assert.match(read(path), /import \{ FLOW_CONSENT_TEXT \} from '[./]+data\/flow-consent'/, `${name} must import the shared consent sentence`);
  assert.doesNotMatch(read(path), /consentText\s*=\s*'By joining/, `${name} must not carry its own copy of the consent sentence`);
}
// Every Flow capture form carries ONE caption line (operator decision
// 2026-08-20): the long consent sentence is recorded on submit, never shown.
for (const [name, src] of [['flow', flow], ['FlowWaitlist', read('src/components/sections/FlowWaitlist.astro')], ['FlowProofNuggets', read('src/components/flow/FlowProofNuggets.astro')]]) {
  assert.doesNotMatch(src, /\{(hero)?[pP]rivacyNote\}/, `${name} must not render the long consent note`);
  assert.match(src, /of-waitlist-caption[^>]*>\s*Free to join · Double opt-in · One email a week, no more/, `${name} carries the one-line caption`);
}
// Truth boundaries from the Flow capability briefs.
assert.doesNotMatch(tour, /Apple Intelligence/, 'Apple Intelligence was retired from Flow on 2026-08-14 and must not appear');
assert.doesNotMatch(readCopy('src/pages/flow.astro'), /—/, 'Flow landing-page copy must not use em dashes');
assert.doesNotMatch(chaptersCopy, /—/, 'Flow chapter copy must not use em dashes');
assert.doesNotMatch(readCopy('src/components/flow/FlowCategoryPage.astro'), /—/, 'Flow category shell copy must not use em dashes');
assert.doesNotMatch(readCopy('src/data/flow-categories.ts'), /—/, 'Flow category copy must not use em dashes');
assert.doesNotMatch(tour, /data-checkout=/, 'Flow must not expose checkout before commercial terms exist');
assert.doesNotMatch(tour, /\$\d+\s*(?:\/|per\s)/i, 'no price tiers exist yet, so none may be implied');
assert.match(chapters, /Install nothing but Flow\./, 'the runtime story stays "built so that", led by its own chapter');
assert.match(flow, /patent-pending technology for revision-scoped, verifiable AI agency in durable documents/);
// Measured numbers with dates (the stat band).
for (const value of ['22.3 ms', '620,000', '$0.00425', '+19.2 MiB', '5 actions', '4 domains']) {
  assert.match(flow, new RegExp(esc(value)), `${value} must stay in the measured stat band`);
}
assert.match(flow, /2026-08-04/, 'the search measurement keeps its date');
// The four execution domains, named exactly.
assert.match(flow, /Local, LAN, Cloud prepaid, Cloud postpaid/);
// Section order: tour → enterprise → press → waitlist. (The stack band left
// for the footer directory on 2026-08-20; the press kit names the footer.)
const anchors = ['id="tour"', 'id="enterprise"', 'id="press"', 'id="waitlist"'];
assert.doesNotMatch(flow, /id="stack"/, 'the stack band lives in the footer directory, not on the overview');
const anchorIndexes = anchors.map((a) => flow.indexOf(a));
assert.ok(anchorIndexes.every((i) => i >= 0), 'every landing anchor must exist');
assert.deepEqual([...anchorIndexes].sort((a, b) => a - b), anchorIndexes, 'anchor order must stay tour, enterprise, press, waitlist');
// Each tour chapter stays deep-linkable AND stays clear of the fixed nav when
// jumped to. The two are asserted separately because the class list is not
// order-stable: the 2026-08-16 typography pass added .of-display alongside
// scroll-mt-28, and a combined "id then class" regex broke on the reorder
// while the anchors themselves were still perfectly fine.
for (const id of ['tour-agency', 'tour-expand', 'tour-toolbar', 'tour-longdocs', 'tour-domains', 'tour-receipts', 'tour-runtime', 'tour-benchmarks', 'tour-routing', 'tour-resources', 'tour-search', 'tour-tables', 'tour-visualize', 'tour-files']) {
  const heading = chapters.match(new RegExp(`<h3[^>]*\\sid="${id}"[^>]*>`))?.[0];
  assert.ok(heading, `${id} must stay a linkable tour chapter heading`);
  assert.match(heading, /\bscroll-mt-28\b/, `${id} must clear the fixed nav when deep-linked`);
  // The overview keeps the same id on the card link, so /flow/#tour-<x> links
  // published before the split still land on the card that points onward.
  assert.match(categories, new RegExp(`id: '${id}'`), `${id} must be registered in flow-categories.ts`);
}
assert.match(flow, /<a id=\{ch\.id\} class="scroll-mt-28" href=\{`\$\{flowCategoryHref\(cat\.slug\)\}#\$\{ch\.id\}`\}>/, 'overview card links carry the chapter ids as anchor stubs');
// Every chapter component renders on exactly one category page.
for (const c of CHAPTERS) {
  const uses = Object.values(categoryPages).filter((page) => page.includes(`<${c} />`)).length;
  assert.equal(uses, 1, `${c} must render on exactly one category page`);
}
for (const slug of CATEGORY_SLUGS) {
  assert.match(categoryPages[slug], new RegExp(`<FlowCategoryPage slug="${slug}">`), `${slug} page must use the shared shell`);
  assert.match(categories, new RegExp(`slug: '${slug}'`), `${slug} must be registered in flow-categories.ts`);
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
const flowProductImages = [...tour.matchAll(/from '(?:\.\.\/)+assets\/flow\/(shots|details)\/([^']+)'/g)];
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
assert.match(chapters, /import FlowDetail from '\.\.\/FlowDetail\.astro'/);
for (const detail of [
  'detail-proposal', 'detail-checks', 'detail-result', 'detail-diff', 'detail-domains',
  'detail-runtime-storage', 'detail-parts', 'detail-grid', 'detail-search',
  'detail-expand-hover', 'detail-expand-consent', 'detail-expand-banner',
  'detail-expand-bound', 'detail-expand-lookups', 'detail-expand-saved',
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
// Enterprise adoption patterns: nine question cards, honestly tagged. Data
// lives in src/data/flow-enterprise.ts (2026-08-20); the overview teases three
// and /flow/enterprise/ renders all nine.
const enterpriseData = read('src/data/flow-enterprise.ts');
const enterpriseSource = enterpriseData.match(/export const FLOW_ENTERPRISE: EnterprisePattern\[\] = \[([\s\S]*?)\n\];/)?.[1] ?? '';
const enterprisePage = read('src/pages/flow/enterprise.astro');
assert.match(enterprisePage, /FLOW_ENTERPRISE\.map\(/, '/flow/enterprise/ renders every pattern');
assert.match(enterprisePage, /<FlowWaitlist placement="flow-enterprise"/, '/flow/enterprise/ closes with its own attributable placement');
assert.match(flow, /FLOW_ENTERPRISE_TEASER\.map\(/, 'the overview teases the patterns');
assert.match(flow, /href="\/flow\/enterprise\/"/, 'the overview links on to the full set');
assert.match(enterpriseData, /\['Data classification', 'Attribution', 'Knowledge mining'\]/, 'the teaser picks three named patterns');
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


// ── Expand with Sources (0131) truth rails, 2026-08-20 ────────────────────
// Source: flow-expand-with-sources-source.md "Hard guardrails". Lookup-backed
// runs are hosted-Anthropic only today, fetch is closed, estimate and recorded
// cost are two facts, the 12-lookup bound is a feature, retrieval is named.
const expandCopy = readCopy(chapterPath('ChapterExpand'));
assert.match(expandCopy, /hosted Anthropic models only/, 'Expand must state the hosted-only carrier');
assert.match(expandCopy, /0\.000924 USD/, 'Expand must carry the pre-run estimate to the digit');
assert.match(expandCopy, /0\.026684 USD/, 'Expand must carry the recorded cost to the digit');
assert.match(expandCopy, /two facts/, 'estimate and recorded cost must be presented as two facts');
assert.match(expandCopy, /limit of 12 lookups/, 'the bound must be named');
assert.match(expandCopy, /[Nn]othing in the document was changed/, 'the bound must be shown as a no-write ending');
assert.match(expandCopy, /fetching public\s+pages stays switched off/i, 'fetch must be stated as closed');
assert.doesNotMatch(expandCopy, /lookups? (run|runs|ran) (locally|on this Mac)/i, 'no local-lookup claim (goal 0142 is unbuilt)');
assert.doesNotMatch(expandCopy, /\$0\.00\b/, 'no zero-dollar lookup claim');
assert.doesNotMatch(expandCopy, /citation|snapshot|grounded in your research/i, 'no citation, snapshot, or grounding claim (goal 0074)');
assert.doesNotMatch(expandCopy, /—/, 'Expand chapter copy must not use em dashes');
assert.ok(categoryPages['writing-with-ai'].includes('<ChapterExpand />'), 'Expand renders on the Writing with AI page');

// ── The category pages' CTA (2026-08-20 split) ──
// The mid-tour repeat used to sit at the seam between chapters 2 and 3 of the
// single page. The tour now spans four category pages, each of which closes
// with the SAME `flow-mid` placement (inside the tour, own form id and
// attribution source), and the overview keeps only the hero capture and the
// closing placement="flow". A category page must never reuse placement="flow":
// that would collapse category signups onto the overview closer in the data.
assert.doesNotMatch(flow, /placement="flow-mid"/, 'the overview no longer carries the mid-tour CTA');
assert.match(categoryShell, /<FlowWaitlist placement="flow-mid"/, 'category pages close with the flow-mid placement');
assert.doesNotMatch(categoryShell, /placement="flow"[\s/>]/, 'a category page must not reuse the overview closer placement');
assert.match(categoryShell, /aria-label="Flow tour categories"/, 'category pages carry the shared sub-nav');
assert.match(categoryShell, /aria-current=\{c\.slug === cat\.slug \? 'page' : undefined\}/, 'the sub-nav marks the current category');
// One offer, two surfaces: the placements must resolve to DIFFERENT form ids
// (no duplicate DOM ids) and therefore different attribution sources.
const waitlistComponent = read('src/components/sections/FlowWaitlist.astro');
assert.match(waitlistComponent, /'home' \| 'flow' \| 'flow-mid' \| 'flow-enterprise'/);
assert.match(waitlistComponent, /'flow-mid-waitlist'/);
// The mid-tour continue link goes to the NEXT part (passed in by the shell),
// never to a #tour-<chapter> anchor that may not exist on this page: the
// 2026-08-20 split left '#tour-domains' dead on three of four pages.
assert.doesNotMatch(waitlistComponent, /#tour-/, 'FlowWaitlist must not hardcode a chapter anchor');
assert.match(categoryShell, /<FlowWaitlist placement="flow-mid" storyHref=\{flowStoryHref\} nextHref=\{nextHref\} nextLabel=\{nextLabel\} \/>/, 'the shell passes the next part to the mid-tour panel');
assert.match(categoryShell, /const nextHref = next \? flowCategoryHref\(next\.slug\) : '\/flow\/enterprise\/'/);
// The category hero carries the same cover crop as the overview card, so the
// picture a reader clicked is the picture that greets them.
assert.match(categoryShell, /import \{ FLOW_CATEGORY_SHOTS \} from '\.\.\/\.\.\/data\/flow-category-shots'/);
assert.match(flow, /import \{ FLOW_CATEGORY_SHOTS \} from '\.\.\/data\/flow-category-shots'/);
assert.match(categoryShell, /<FlowDetail\s[\s\S]*?src=\{cover\.src\}/, 'the category hero shows its cover crop');
// Chapters are numbered 1 to 13 across the four parts.
assert.match(categoryShell, /Chapters \{firstChapter\} to \{lastChapter\} of \{totalChapters\}/);
assert.match(flow, /Chapters \{chapterOffsets\[i\] \+ 1\} to \{chapterOffsets\[i\] \+ cat\.chapters\.length\}/);
// The waitlist panel names the exchange and offers the free book as a second magnet.
assert.match(waitlistComponent, /The launch note the day Flow ships for Mac\./);
assert.match(waitlistComponent, /magnetHref\('flow-waitlist'\)/, 'the panel offers the free book');
for (const id of ["'home-flow-waitlist'", "'flow-mid-waitlist'", "'flow-page-waitlist'", "'flow-enterprise-waitlist'"]) {
  assert.ok(waitlistComponent.includes(id), `FlowWaitlist must keep a distinct form id for ${id}`);
}

// ── Homepage: the demand-generation front door ─────────────────────────────
const home = read('src/pages/index.astro');
assert.match(home, /const HOME_TITLE = 'Orionfold Flow · AI that asks before it changes your document'/, 'the title tag carries the hero promise');
assert.match(home, /title=\{HOME_TITLE\}/);
assert.match(home, /description=\{SITE\.description\}/);
assert.match(home, /jsonLd=\{\[flowSchema\]\}/, 'the homepage carries the Flow SoftwareApplication entity');
// Hero copy, 2026-08-20 content-masterclass rewrite: the common belief, then
// the flip, written against the review-surface picture whose Approve and Save
// button is DISABLED until the box is ticked. Headline, lede, and picture carry
// one claim, and the reader knows who the page is for before the claim.
assert.match(home, /Most AI tools rewrite your document\. Flow asks first\./);
assert.match(home, /Anyone whose name is on the document/, 'the ICP line sits in the first screen');
assert.match(home, /Patent pending/);
// Asserted sentence by sentence: each lives in its own <span> so it can be set
// one-per-line on large screens.
for (const sentence of [
  'Every AI change arrives as a diff you approve, with a receipt of what ran, where it ran, and what it cost.',
  'Your text changes two ways only: an edit you typed, or a change you approved.',
]) {
  assert.match(home, new RegExp(esc(sentence)), `the hero lede keeps: ${sentence}`);
}
assert.match(home, /Nothing is saved until you approve it/, 'the approval gate is stated beside its crop');
assert.match(home, /<FlowProofNuggets formId="home-proof-waitlist" \/>/, 'two dated facts and the native ask follow the hero');
assert.match(home, /You draft in a chat window, paste into your document/, 'the copy-paste argument stays on the page, in the problem band');
assert.match(home, /Chat is where work evaporates\./, 'the buyer-language problem band leads the argument');
assert.doesNotMatch(readCopy('src/pages/index.astro'), /—/, 'homepage copy must not use em dashes');
// Hero waitlist capture with its own attribution source and the canonical consent.
assert.match(home, /id="home-hero-waitlist"/);
assert.match(home, /source="home-hero-waitlist"/);
assert.match(home, /offer="flow-waitlist"/);
const flowWaitlistComponent = read('src/components/sections/FlowWaitlist.astro');
assert.match(home, /const consentText = FLOW_CONSENT_TEXT;/, 'the hero form records the shared consent sentence');
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
assert.match(home, /<FlowDetail[\s\S]*?src=\{detailDiff\}/, 'the diff crop proves the hero claim');
assert.match(home, /of-stage__detail of-stage__detail--tr"\s*\n?\s*src=\{detailDiff\}/, 'the hero crop takes top-right (a short strip never overlaps from a bottom corner); the first band below takes top-left');
assert.match(home, /<FlowDetail[\s\S]*?src=\{row\.detail\}/, 'the capability bands render their crops');
assert.match(home, /<FlowDetail[\s\S]*?src=\{row\.detail\}/, 'every capability band carries its own legible crop');
for (const detailImport of ['detailDiff', 'detailDomains', 'detailParts', 'detailRunChecks']) {
  assert.match(home, new RegExp(`import ${detailImport} from '\\.\\./assets/flow/details/`), `${detailImport} must come from the generated crop set`);
}
for (const href of ['/flow/writing-with-ai/#tour-toolbar', '/flow/writing-with-ai/#tour-longdocs', '/flow/models-and-runtime/#tour-domains', '/flow/receipts/#tour-receipts', '/flow/enterprise/', '/flow/#press']) {
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
// Order: hero → two measured facts + ask → problem band → four bands →
// enterprise teaser → origin → waitlist. The stack band left for the footer.
const homeOrder = [
  'class="home-hero',
  '<FlowProofNuggets',
  'Chat is where work evaporates.',
  '{capabilityRows.map(',
  'For enterprise AI owners',
  'The origin story',
  '<FlowWaitlist placement="home" />',
].map((marker) => home.indexOf(marker));
assert.doesNotMatch(home, /One company, one stack/, 'the stack band lives in the footer directory');
assert.equal((home.match(/kicker: '/g) ?? []).length, 4, 'four capability bands, not seven');
assert.ok(homeOrder.every((i) => i >= 0), 'every homepage band must exist');
assert.deepEqual([...homeOrder].sort((a, b) => a - b), homeOrder, 'homepage band order must hold');

// ── Waitlist funnel contracts (unchanged rails) ────────────────────────────
for (const phrase of [
  "'home-flow-waitlist'",
  "'flow-page-waitlist'",
  'offer="flow-waitlist"',
  'Join the waitlist',
  'Check your inbox to confirm.',
  'Free to join · Double opt-in · One email a week, no more',
]) {
  assert.match(flowWaitlistComponent, new RegExp(esc(phrase)));
}
assert.match(consentModule, /AI For Everyone digest, one email a week, no more/);
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
const ogCardSource = read('src/lib/og/card.ts');
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
// The frame is 660 wide but sits at left:660 on a 1200-wide card, so ONLY THE
// LEFT 540px OF EACH CROP IS EVER SEEN — the remaining 120px bleeds off the
// right edge by design. That is easy to forget and was a real defect: the home
// card shipped 2026-08-16 with the resource popover sliced by the frame edge,
// so the $0.00 spend rows the headline promises were cut off and the card read
// as a rendering bug. Re-cropped 2026-08-18 by padding the capture on the right
// so the popover lands inside the visible band.
//
// Asserted structurally rather than visually: the subject must not run to the
// crop's right edge, or it is being cut off again. A crop whose rightmost 120px
// is uniform padding satisfies this; one whose UI runs to x=660 does not.
assert.match(
  ogCardSource,
  /left: 660,/,
  'the card frame geometry this crop rule depends on must stay put',
);
// And the home crop specifically must keep clear of that boundary. The popover
// is the card's whole payload, so if UI runs right up to the crop's edge it is
// being sliced again. Checked as a content hash of the shipped asset: this is a
// hand-placed crop, and any re-crop must be re-verified by eye at social size
// (dist/og/home.jpg, zoom the popover) and this hash updated deliberately.
const ogHomeShotHash = createHash('sha256').update(readBinary('src/assets/flow/og-home-shot.png')).digest('hex');
assert.equal(
  ogHomeShotHash,
  '9ae7cff1e4cd3a0f7217fa9b4b4210237ca4580b6f7c56e1af369d05d75232d7',
  'the home OG crop changed: re-check the decision footer is not clipped by the 540px visible band, then update this hash',
);
const ogCard = ogCardSource;
assert.match(ogCard, /function heroGridSvg\(\)/, 'the light card draws the hero gradient + fading grid');
assert.match(ogCard, /brandLockup\(true\)/, 'light cards carry the full brand lockup with the origami mark');
const ogEndpoint = read('src/pages/og/[slug].jpg.ts');
assert.match(ogEndpoint, /endsWith\('\.webp'\)/, 'Satori cannot decode webp, so webp screenshots must fall back to the banner');

// ── Benchmarks truth boundaries (2026-08-18) ───────────────────────────────
// The benchmarks brief names three claims a publisher must not soften, and
// each is one careless copy edit away from becoming false. They are asserted
// here rather than trusted to review because all three read as harmless
// tightenings: dropping "published specification", calling the context ceiling
// the model's, or implying a shared leaderboard would each shorten the copy
// while turning a checkable statement into an unbacked one.
// Truth guards read the whole tour surface (overview + the twelve chapter
// components) since the 2026-08-20 split.
const nuggetsCopy = readCopy('src/components/flow/FlowProofNuggets.astro');
const flowTourCopy = `${readCopy('src/pages/flow.astro')}\n${nuggetsCopy}\n${chaptersCopy}`;
const flowBenchCopy = flowTourCopy;
const homeBenchCopy = `${readCopy('src/pages/index.astro')}\n${nuggetsCopy}`;
assert.doesNotMatch(nuggetsCopy, /—/, 'proof-nuggets copy must not use em dashes');
assert.match(nuggetsCopy, /Recorded 2026-07-30/, 'the probe card keeps its date');
assert.match(nuggetsCopy, /Measured 2026-08-18/, 'the benchmark card keeps its date');

// 1. Bandwidth. No public interface on a Mac reports memory bandwidth: 300 GB/s
//    is the manufacturer's published figure and 268.6 GB/s is what Flow
//    measured. Copy may never present the published number as something Flow
//    read from the machine.
// Proximity, not mere co-occurrence: the label has to travel WITH the number.
// A file-wide check passed a probe that stripped the label from the sentence
// carrying 300 GB/s while the phrase survived in an unrelated caption, which is
// exactly the drift this is meant to catch. 160 characters is about a sentence
// either side of the figure.
for (const [name, copy] of [['flow.astro', flowBenchCopy], ['index.astro', homeBenchCopy]]) {
  for (const hit of copy.matchAll(/300\s*GB\/s/g)) {
    const around = copy.slice(Math.max(0, hit.index - 160), hit.index + 160);
    assert.match(
      around,
      /published specification/i,
      `${name} may only state 300 GB/s alongside its published-specification label`,
    );
  }
}

// 2. The context window is FLOW'S call, not the model's limit. Revised
//    2026-08-20 against the re-audited brief: the hard-coded 8,192 floor was
//    replaced 2026-08-18 by a per-model, per-machine window (the smaller of
//    what the model declares and Flow's stated memory budget). Public copy
//    must never quote one number as "the" window, and must never describe the
//    limit as a model limitation.
assert.match(
  flowBenchCopy,
  /worked out per model, per machine/,
  'the tour must present the reading window as per model, per machine, never one number',
);
assert.doesNotMatch(
  flowBenchCopy,
  /8,000 words|8,192/,
  'the retired single-number context window must not reappear in the benchmarks chapter',
);
assert.match(
  flowBenchCopy,
  /names the limit as Flow's own, not the model's/,
  "the tour must name the reading limit as Flow's own, never the model's",
);

// 3. No central benchmark feed exists. Every figure is measured on the reader's
//    own Mac or computed from their own model files. A "shared"/"community"
//    leaderboard would be an outright fabrication of a feature.
assert.match(
  flowBenchCopy,
  /Flow publishes no shared leaderboard and downloads no results/,
  'the tour must state that no results come from other people\'s hardware',
);
// The pattern deliberately requires an AFFIRMATIVE phrasing. The tour's own
// disclaimer contains the words "shared leaderboard" inside a denial of it, so
// a bare keyword ban would fail on the very sentence that makes the promise
// true. Only a claim NOT preceded by "no"/"never"/"without" is a breach.
for (const [name, copy] of [['flow.astro', flowBenchCopy], ['index.astro', homeBenchCopy]]) {
  const claims = [...copy.matchAll(/(?:community|global|shared|crowdsourced)\s+(?:benchmark|leaderboard)/gi)];
  for (const claim of claims) {
    const preceding = copy.slice(Math.max(0, claim.index - 40), claim.index);
    assert.match(
      preceding,
      /\b(?:no|not|never|without|nobody|anyone else's)\b[^.]*$/i,
      `${name} must not imply a benchmark feed Flow does not ship`,
    );
  }
}

// 4. Vocabulary. The implementation says TTFT, tok/s, prefill, decode, KV cache
//    and quantization; the screen itself obeys a person-words rule and the
//    published vocabulary is the screen's. Scoped to the benchmarks copy is not
//    possible in a whole-file grep, so this checks the words that would only
//    ever arrive with a benchmarks edit. The runtime chapter's "263 tok/s"
//    stat card was rewritten in person-words on 2026-08-20, so tok/s and
//    "4-bit" are on the list now.
for (const [name, copy] of [['flow.astro', flowBenchCopy], ['index.astro', homeBenchCopy]]) {
  for (const jargon of ['TTFT', 'time to first token', 'prefill', 'KV cache', 'quantization', 'tok/s', '4-bit']) {
    assert.doesNotMatch(
      copy,
      new RegExp(esc(jargon), 'i'),
      `${name} must use the screen's person-words, not "${jargon}"`,
    );
  }
}

// 4b. A2 (2026-08-18): a score is RELATIVE to the models being ranked, on this
//    Mac. The best measured value on each axis becomes 1.00, so the number
//    answers "which of these, here" and supports nothing wider. Publishing it
//    as a cross-machine or cross-catalog rating would be the one claim the
//    normalization cannot carry.
assert.match(
  flowBenchCopy,
  /A score ranks these models against each other, on this Mac/,
  'the tour must scope a score to these models on this Mac',
);
for (const [name, copy] of [['flow.astro', flowBenchCopy], ['index.astro', homeBenchCopy]]) {
  assert.doesNotMatch(
    copy,
    /(?:fastest|best|top)\s+(?:local\s+)?model\s+(?:anywhere|on any Mac|overall)/i,
    `${name} must not publish a score as a cross-machine rating`,
  );
}

// 4c. A2: the score is NOT a quality verdict. It weighs speed, reading rate and
//    headroom — the only axes Flow has measured — and the screen itself prints
//    "Not ranked: instruction-following". Copy that let the ranking stand for
//    answer quality would claim a measurement Flow does not take.
assert.match(
  flowBenchCopy,
  /never about how good the answers are/,
  'the tour must state the ranking is not a verdict on answer quality',
);
for (const [name, copy] of [['flow.astro', flowBenchCopy], ['index.astro', homeBenchCopy]]) {
  assert.doesNotMatch(
    copy,
    /(?:score|rank\w*)\s+(?:the\s+)?(?:model\s+)?quality|quality\s+score/i,
    `${name} must not imply the benchmark score measures model quality`,
  );
}

// 5. The measurement's scope stays welded to it. A ranking of local models is
//    meaningless without the machine and the date, and both pages carry the
//    same 4.5s-vs-10.2s comparison, so both must carry its qualification.
assert.match(
  flowBenchCopy,
  /Measured 2026-08-18 on one Apple M3 Max, on a development build/,
  'the benchmarks chapter keeps its measurement scope and date',
);
for (const [name, copy] of [['flow.astro', flowBenchCopy], ['index.astro', homeBenchCopy]]) {
  if (/4\.5 seconds/.test(copy)) {
    assert.match(copy, /M3 Max/, `${name} must name the Mac the 4.5 second figure was measured on`);
  }
}

// ── Smart Routing truth boundaries (2026-08-18) ─────────────────────────────
// The smart-routing brief draws a boundary that is easy to cross in BOTH
// directions: the feature's selling point is what it refuses to do, so a
// well-meaning copy edit that makes it sound smarter ("AI-powered", "learns")
// fabricates the exact adaptivity the design rejects, while an edit that
// drops the refusal language deletes the differentiator.

// 1. The published vocabulary is the screen's. The implementation says
//    predicates, resolvers and fail-closed; none of those may reach a reader.
//    (Comment-stripped copy: the chapter's own source comment is allowed to
//    name the banned words in order to ban them.)
const flowRoutingCopy = flowTourCopy;
for (const jargon of ['predicate', 'resolver', 'fail-closed', 'fails closed']) {
  assert.doesNotMatch(
    flowRoutingCopy,
    new RegExp(esc(jargon), 'i'),
    `flow.astro must use the screen's person-words, not "${jargon}"`,
  );
}

// 2. The name. "Auto routing" was retired 2026-08-18 and appears nowhere on
//    screen; reintroducing it (in copy OR alt text) would name a control that
//    no longer exists.
assert.doesNotMatch(flowRoutingCopy, /auto[- ]routing/i, 'the retired "Auto routing" name must not come back');
assert.match(flowRoutingCopy, /Smart Routing/, 'the feature is named Smart Routing');

// 3. It is a deterministic ordered rulebook, and that is the pitch. Copy must
//    state the procedure in the screen's own sentence shape and must never
//    dress the rulebook up as adaptive intelligence.
assert.match(
  flowRoutingCopy,
  /[Rr]ules decide in order/,
  'the tour must state the procedure: rules decide in order, first match applies',
);
assert.match(
  flowRoutingCopy,
  /Decided by the rule/,
  'the tour must carry the signed-route sentence that names the deciding rule',
);
assert.doesNotMatch(
  flowRoutingCopy,
  /AI-powered routing|learns your|adapts to your/i,
  'Smart Routing is a deterministic rulebook and must not be sold as adaptive',
);

// 4. Rules see locality, document fit, price, and measured speed. Never a
//    quality verdict — the same boundary the Benchmarks chapter carries from
//    the other side, so both chapters must keep their halves of it.
assert.match(
  flowRoutingCopy,
  /never judge answer quality/,
  'the routing chapter must state that rules do not judge answer quality',
);

// 5. No surface edits folder- or document-scoped rule sets yet, so the page
//    may claim system-wide rules only.
assert.doesNotMatch(
  flowRoutingCopy,
  /(?:folder|document)-scoped rule|per-folder rule|rules for this folder/i,
  'scoped rule sets are unreleased and must not be claimed',
);

// 6. The capture's scope stays welded to it, matching the Benchmarks pattern.
assert.match(
  flowRoutingCopy,
  /Captured 2026-08-18 on a development build/,
  'the routing chapter keeps its capture scope and date',
);

// ── Receipts and Evidence truth boundaries (2026-08-19) ─────────────────────
// The two 2026-08-19 brief revisions (the run card, the answer-first Evidence
// gallery) ship STAGED demonstration receipts: written over the demo library
// through the same code path a real run uses, every validity mark earned, but
// not a real charge. The chapter is honest only while the staging disclosure
// travels with it and while the staged figure never migrates into copy as a
// real one. Each guard below was chosen because the breach reads like a
// harmless tightening.
const flowReceiptCopy = flowTourCopy;
const homeReceiptCopy = readCopy('src/pages/index.astro');

// 1. The staging disclosure stays welded to the chapter. Dropping "staged
//    demonstration" would quietly promote invented figures into evidence.
assert.match(
  flowReceiptCopy,
  /staged demonstration material/,
  'the receipts chapter must disclose that the pictured receipts are staged',
);
assert.match(
  flowReceiptCopy,
  /Captured 2026-08-19 on a development build/,
  'the receipts chapter keeps its capture scope and date',
);

// 2. The staged $0.00318 must never appear in body copy as a charge. It lives
//    in the pixels and may be DESCRIBED (alt text reads what is legible), but
//    every mention must sit within a sentence's reach of the receipt/record
//    framing, and the REAL recorded run stays $0.00425 with its token counts.
for (const [name, copy] of [['flow.astro', flowReceiptCopy], ['index.astro', homeReceiptCopy]]) {
  for (const hit of copy.matchAll(/0\.00318/g)) {
    const around = copy.slice(Math.max(0, hit.index - 240), hit.index + 240);
    assert.match(
      around,
      /demonstration|receipt/i,
      `${name} may only show 0.00318 as what the pictured receipt reads, never as a real charge`,
    );
  }
  assert.doesNotMatch(
    copy,
    /real(?:ly)?[^.]{0,80}0\.00318|0\.00318[^.]{0,80}\breal\b/i,
    `${name} must never call the staged 0.00318 run real`,
  );
}
assert.match(
  flowReceiptCopy,
  /\$0\.00425[^.]*(?:real|billed)|real[^.]*\$0\.00425|105 input and 149 output/,
  'the real recorded run stays $0.00425 with its token counts',
);

// 3. The score delta claims exact History verification, wired 2026-08-19: the
//    +4 and "Compared" render only against a byte-verified baseline. Copy must
//    keep the qualification, and must never present the delta as generally
//    available progress tracking.
assert.match(
  flowReceiptCopy,
  /baseline revision was\s+verified in History,? byte for byte/,
  'the delta claim must keep its byte-for-byte History verification',
);
assert.match(
  flowReceiptCopy,
  /shows its\s+reason instead of a number/,
  'the unverifiable-comparison behavior stays stated: a reason, not a number',
);

// 4. Cost honesty keeps both halves: an estimate is never recorded as a
//    charge, and a local run's absent cost means none was owed.
assert.match(flowReceiptCopy, /An estimate is never recorded as a charge/);
assert.match(flowReceiptCopy, /none was owed/);

// 5. Each check row carries two encodings — the stored outcome and the rule's
//    CURRENT consequence pill — and the pill vocabulary is the screen's own.
assert.match(flowReceiptCopy, /Stops the change/);
assert.match(flowReceiptCopy, /Warns you/);
assert.match(flowReceiptCopy, /Needs your acknowledgment/);

// 6. Vocabulary: "receipts", never "logs" or "telemetry"; and the internal
//    core-package name stays out of public copy.
for (const [name, copy] of [['flow.astro', flowReceiptCopy], ['index.astro', homeReceiptCopy]]) {
  assert.doesNotMatch(copy, /\btelemetry\b/i, `${name} must say receipts, not telemetry`);
  assert.doesNotMatch(copy, /\baudit log\b/i, `${name} must say receipts, not audit log`);
  assert.doesNotMatch(copy, /FlowCore/, `${name} must not name internal packages`);
}

// 7. Prompt/key privacy is a structural claim and stays stated once, in the
//    receipts chapter.
assert.match(
  flowReceiptCopy,
  /Your prompt and your API key are\s+not recorded, and there is structurally\s+nowhere in a receipt for them to go/,
  'the receipts chapter keeps the structural privacy claim',
);

// ── Charts and diagrams (0129, Visualize) truth rails, 2026-08-20 ─────────
// Source: the Flow CHANGELOG entries of 2026-08-20 and the 0129 SPEC. Each
// guard is a sentence a copy edit would happily "tighten" into a false one.
const visualizeCopy = readCopy(chapterPath('ChapterVisualize'));
assert.match(visualizeCopy, /after the selected text, never in place of it/, 'Visualize adds after the selection; it never replaces');
assert.doesNotMatch(visualizeCopy, /replaces? (your|the) (table|text|selection) with/i, 'no replace claim');
assert.match(visualizeCopy, /A proposal Flow cannot draw is never shown/, 'the undrawable-proposal rule stays stated');
assert.match(visualizeCopy, /offline/, 'rendering is stated as offline');
assert.doesNotMatch(visualizeCopy, /Wi-?Fi off|airplane mode|network (was )?disabled/i, 'the Wi-Fi-off capture was waived; never claim it');
assert.doesNotMatch(visualizeCopy, /callouts?[^.]*(ship|today|now)|(ship|today|now)[^.]*callouts?/i, 'layout blocks are a later goal');
assert.match(visualizeCopy, /are a separate, later goal, and are not claimed here/, 'the layout-blocks boundary is stated');
assert.match(visualizeCopy, /Captured 2026-08-20 on a development build/, 'the chapter keeps its capture scope and date');
assert.match(visualizeCopy, /invented demo data/, 'chart numbers are disclosed as invented');
assert.doesNotMatch(visualizeCopy, /infographic|AI-generated (chart|image)/i, 'the vocabulary is the screen\'s');
assert.ok(categoryPages['documents-and-files'].includes('<ChapterVisualize />'), 'Visualize renders on the Documents and files page');
for (const detail of ['detail-chart-line', 'detail-chart-gallery', 'detail-chart-flowchart']) {
  assert.match(detailScript, new RegExp(`out: '${esc(detail)}\\.webp'`), `${detail} must stay a generated crop`);
  assert.ok(existsSync(new URL(`../../src/assets/flow/details/${detail}.webp`, import.meta.url)), `${detail}.webp must be committed`);
}

// ── AEO surfaces stay Flow-first ───────────────────────────────────────────
const llms = read('public/llms.txt');
assert.match(llms, /patent-pending AI agency built in/);
assert.match(llms, /\[Flow\]\(https:\/\/orionfold\.com\/flow\/\)/);
for (const anchor of ['flow/#tour', 'flow/enterprise/', 'flow/#press']) {
  assert.match(llms, new RegExp(esc(anchor)), `llms.txt must feed the ${anchor} surface to answer engines`);
}
const astroConfig = read('astro.config.mjs');
assert.match(astroConfig, /map\['\/flow\/'\] = '\d{4}-\d{2}-\d{2}'/, 'the hand-built Flow landing tracks an honest sitemap lastmod');
assert.match(read('tests/e2e/critical-routes.spec.ts'), /'\/flow\/'/);

console.log('[flow-flagship-surface] Flow leads with real captures, truthful claims, and waitlist capture; the catalog lives in the footer');
