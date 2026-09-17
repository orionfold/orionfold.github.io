// Flow flagship surface contracts. Rewritten 2026-08-15 for the operator-
// approved Flow takeover: the homepage and /flow/ lead with real development-
// build captures, measured numbers, buyer-language copy, and waitlist capture;
// the top nav carries the flagship family and the catalog lives in the footer. These
// assertions protect that surface and its truth boundaries (no Apple
// Intelligence, no pricing, gated agency, patent-pending phrasing).
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

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

const livingFiles = readdirSync(new URL('../../src/components/living/', import.meta.url)).filter(name => name.endsWith('.astro'));
const livingSource = livingFiles.map(name => read(`src/components/living/${name}`)).join('\n');
const livingFaq = read('src/data/living-faq.json');
// ── Nav: flagship product family ──────────────────────────────────────────
const nav = read('src/components/Nav.astro');
const navArray = nav.match(/const links = \[([\s\S]*?)\n\];/)?.[1] ?? '';
const navLabels = [...navArray.matchAll(/label: '([^']+)'/g)].map((match) => match[1]);
assert.deepEqual(navLabels, ['Flow', 'Essay', 'The Manifesto', 'Story', 'Books'], 'the global nav carries the approved Living Documents and editorial front doors');
for (const localOnly of ['Tour', 'Tech Specs', 'Enterprise']) {
  assert.equal(navLabels.includes(localOnly), false, `${localOnly} stays in the Flow-local rail, not the global nav`);
}
for (const retired of ['Models', 'Training', 'Proof']) {
  assert.equal(navLabels.includes(retired), false, `${retired} stays out of the curated top nav`);
}
// The nav CTA and sticky bar now switch on ORIONFOLD_FLOW_LIVE (operator ask
// 2026-08-22 10:13: the sticky CTA becomes a direct Download button). Both
// branches must exist in the source, so the pre-launch wording is still one
// flag flip away rather than deleted.
assert.match(nav, /flowLive \? 'Download Flow' : 'Join the waitlist'/, 'the nav CTA keeps the same launch intent as the hero and returns to the waitlist when the flag is off');
assert.doesNotMatch(nav, /See Flow plans/, 'the launch CTA never changes from download intent to a pricing detour');
assert.match(nav, /'\/flow\/#waitlist'/, 'the pre-launch waitlist path survives in the off branch');
assert.doesNotMatch(nav, />Get Proposal</, 'the proposal CTA left the nav (footer keeps the path)');
assert.match(nav, /Orionfold Flow is coming to Mac/, 'the pre-launch sticky bar copy survives in the off branch');
assert.match(nav, /Orionfold Flow for Mac/, 'the launched sticky bar names the shipped app');
assert.match(nav, /of-flow-bar-dismissed/, 'the Flow bar uses its own dismissal key so old book-bar dismissals do not hide it');

// ── Footer: curated Flow, Orionfold, and Connect navigation ────────────────
const footer = read('src/components/Footer.astro');
const columns = name => [...(footer.match(new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\n\\];'))?.[1] ?? '').matchAll(/href: '([^']+)', label: '([^']+)'/g)].map(match => [match[1], match[2]]);
assert.deepEqual(columns('FLOW_COLUMNS'), [
  ['/flow/', 'Overview'], ['/essay/', 'Essay'], ['/manifesto/', 'Manifesto'],
  ['/flow/tour/', 'Tour'], ['/flow/night-shift/', 'Night Shift'], ['/flow/living-documents/', 'Living Documents'], ['/flow/settings/', 'Settings'], ['/flow/specifications/', 'Tech Specs'], ['/flow/enterprise/', 'Enterprise'],
]);
assert.deepEqual(columns('ORIONFOLD_COLUMNS'), [
  ['/flow/', 'Flow'], ['/arena/', 'Arena'], ['/relay/', 'Relay'],
  ['/about/', 'About'], ['/story/', 'Story'], ['/proposal/', 'Proposal'], ['/sponsor/', 'Sponsor'],
  ['/models/', 'Models'], ['/dgx-spark/', 'DGX Spark'],
]);
assert.doesNotMatch(footer, /SW_GROUPS|LANDING_HREF|latestStories|Free AI book/, 'the catch-all directory is retired');
assert.doesNotMatch(footer, /Site source: Apache 2\.0|Public site source/, 'footer omits the removed source license caption');

// ── /flow/: the flagship atlas ─────────────────────────────────────────────
const flowPageSource = read('src/pages/flow.astro');
const flow = flowPageSource + '\n' + livingSource + '\n' + livingFaq;
const flowTour = read('src/pages/flow/tour.astro');
const flowSubNav = read('src/components/flow/FlowSubNav.astro');
const flowMeasurements = read('src/data/flow-measurements.ts');
const sharedHero = read('src/components/flow/FlowLaunchHomeHero.astro');
// 2026-08-20 split: the twelve tour chapters live in components rendered by
// the four /flow/<category>/ pages; /flow/ is the overview. Content contracts
// run over the whole surface (`tour`); layout contracts name their file.
const CHAPTERS = [
  'ChapterAgency', 'ChapterExpand', 'ChapterToolbar', 'ChapterLongDocs', 'ChapterDomains', 'ChapterReceipts', 'ChapterRuntime',
  'ChapterBenchmarks', 'ChapterRouting', 'ChapterResources', 'ChapterSearch', 'ChapterTables', 'ChapterVisualize', 'ChapterPictures', 'ChapterFiles',
];
const chapterPath = (c) => `src/components/flow/chapters/${c}.astro`;
const chapters = CHAPTERS.map((c) => read(chapterPath(c))).join('\n');
const chaptersCopy = CHAPTERS.map((c) => readCopy(chapterPath(c))).join('\n');
const categoryShell = read('src/components/flow/FlowCategoryPage.astro');
const categories = read('src/data/flow-categories.ts');
const CATEGORY_SLUGS = ['writing-with-ai', 'receipts', 'models-and-runtime', 'documents-and-files'];
const categoryPages = Object.fromEntries(CATEGORY_SLUGS.map((slug) => [slug, read(`src/pages/flow/${slug}.astro`)]));
const tour = `${flow}\n${flowTour}\n${chapters}\n${categoryShell}`;
assert.deepEqual(
  [...flowSubNav.matchAll(/label: '([^']+)'/g)].map((match) => match[1]),
  ['Overview', 'Tour', 'Tech Specs', 'Enterprise'],
  'Flow carries the same concise product-local navigation pattern as Relay and Arena',
);
assert.match(flowPageSource, /<FlowNavigation \/>/, 'the Flow overview retains its local product navigation');
assert.match(flowSubNav, /label: 'Tour', href: '\/flow\/tour\/'/, 'Tour opens its own product-tour landing');
assert.match(flowTour, /<FlowSubNav active="tour" \/>/, 'the tour landing marks Tour active');
assert.match(categoryShell, /<FlowSubNav active="tour" \/>/, 'the Flow category pages mark Tour active');
// Approved Living Systems product proofs replace the racing photograph and
// real screenshot on the flagship. Detailed tours keep their capture rails.
assert.match(flowPageSource, /<FlowHero \/>/);
assert.match(read('src/components/living/FlowHero.astro'), /GIVE[\s\S]*YOUR[\s\S]*WORK[\s\S]*NIGHT SHIFT/);
assert.match(flow, /offline/i, 'the document tools retain their offline promise');
assert.match(flow, /diff you approve|Review changes|Keep\/Revert|Keep and Revert/i, 'human review remains visible');
assert.match(flow, /patent pending/i);
assert.match(flowPageSource, /title=\{title\}/);
assert.doesNotMatch(flowPageSource, /FlowLaunchHomeHero|FlowShot|FlowIdeasPitStop|FlowRaceBlueprint/);
for (const surface of ['src/pages/flow.astro', 'src/components/flow/FlowCategoryPage.astro', 'src/pages/flow/enterprise.astro']) {
  const copy = readCopy(surface);
  assert.doesNotMatch(copy, /Pre-launch|Freemium subscription planned|Every screen is the real build, running|\bin development\b/i, `${surface}: retired disclosure stays removed`);
}
assert.doesNotMatch(livingSource, /Private review|data-launch-action|data-signup(?:\s|=|>)|FlowShot|<video\b/i, 'flagships use native mocks and production service components');
assert.match(read('src/components/living/LivingDownload.astro'), /<FlowDownloadCta source=\{source\}/, 'one existing component still owns the download');

// ── Flow pricing: Base vs Pro truth boundaries ─────────────────────────────
// Base = Flow unlicensed, free forever; Pro = Base + the AI features. The split
// is a rendering of the product lane's verified Free vs Paid table
// (FLOW-GROWTH-CONTRACT.md, orionfold-flow 2026-08-22 01:14 PDT), enforced in
// the app at ONE seam (LicensedAgencyRunner). These guards protect the claims a
// pricing page is most likely to get wrong.
const pricingData = read('src/data/flow-pricing.ts');
const pricingCopy = readCopy('src/components/flow/FlowPricing.astro');
const launch = read('src/data/launch.ts');

// THE PRICE GATE. The app does not yet enforce the terms, so no amount ships.
// This is the invariant the whole section is built around: flipping the flag is
// the ONLY thing that may reveal a price.
// LOCAL LAUNCH REHEARSAL (operator direction 2026-08-22 09:18): the flag is ON
// locally so the whole site renders as it will on launch day. It is NOT a claim
// that Flow is buyable, and the operator's standing gate is LOCAL COMMITS ONLY,
// no push until release is declared.
//
// So this guard no longer pins the flag's value -- it pins the COUPLING that
// matters: every price, buy button and download must render behind the flag, so
// one line reverts the entire site to pre-launch. What must never happen is a
// price that ships REGARDLESS of the flag.
assert.match(launch, /export const ORIONFOLD_FLOW_LIVE = (?:true|false);/, 'the Flow launch flag exists and is a single boolean');
assert.match(launch, /LOCAL COMMITS ONLY/, 'the rehearsal gate is recorded beside the flag');
assert.doesNotMatch(pricingCopy, /\$\s?10\b|\$\s?96\b/, 'no literal Flow price in the pricing markup');
assert.match(pricingCopy, /ORIONFOLD_FLOW_LIVE/, 'the price and buy button render behind the launch flag');

// NO PRO DAYS COUNTDOWN. A Pro Day is spent only on a day the user actually
// invokes AI, so any "N days free" phrasing is false. B2 (the tier-and-remaining
// pill) is unbuilt, so the grant gets no countdown copy at all.
assert.doesNotMatch(pricingCopy, /\b\d+\s*(?:Pro )?days? (?:free|left|remaining)/i, 'no Pro Days countdown copy');
assert.doesNotMatch(pricingCopy, /free trial/i, 'Flow has a Pro Day grant, not a calendar free trial');
assert.doesNotMatch(pricingCopy, /\bcredits?\b|\btokens?\b|usage allowance/i, 'Flow is BYOK: never meter it as credits or tokens');

// THE LINE MOST LIKELY TO BE GOT WRONG: local models are PAID. The gate sits
// above the runner protocol, so Ollama, MLX and llama.cpp are all behind it.
assert.match(pricingData, /Local model routing/, 'local model routing is listed under Pro');
assert.doesNotMatch(
  pricingCopy,
  /bring your own model[^.]{0,40}free|local models?[^.]{0,30}\bfree\b/i,
  '"bring your own model and it is free" is FALSE and must never ship',
);
assert.match(pricingCopy, /local models are part of Pro too/i, 'the page states plainly that local models are paid');

// THE READ/PRODUCE SPLIT (product lane B11 report, 2026-08-22 09:55). The
// original 01:14 table was corrected in five rows, two of which had promised
// free what is actually paid. The governing rule: if a model runs it is Pro; the
// RECORD of what a model did is Base to read and Pro to produce.
//
// These guards pin the two directions that cost real money if they regress:
// a taster wrongly moved to Pro makes Base look crippled, and a paid capability
// wrongly listed as Base generates refund requests.
assert.match(pricingData, /Read every receipt/, 'reading receipts is Base (the taster)');
assert.match(pricingData, /Produce new receipts/, 'producing receipts is Pro');
assert.match(pricingData, /Generate new evidence/, 'generating evidence is Pro');
// Flow Runtime and Smart Routing are shipped, named subsystems that the 01:14
// table omitted entirely. Both are Pro.
assert.match(pricingData, /Flow Runtime/, 'Flow Runtime is listed under Pro');
assert.match(pricingData, /Smart Routing/, 'Smart Routing is listed under Pro');
// Guardrails as shipped run over exact bytes with NO model, so they are Base.
// AI-judged guardrails would be Pro and are not built.
assert.match(pricingData, /Guardrails.*no model involved/, 'the shipped guardrails are Base');
// 0103 removed the on-device execution domain entirely (closed 2026-08-14).
// It must never appear in a comparison table.
assert.doesNotMatch(pricingData, /Apple Intelligence/i, 'Apple Intelligence does not exist in Flow');
assert.doesNotMatch(pricingCopy, /Apple Intelligence/i, 'Apple Intelligence does not exist in Flow');

// THE DOWNLOAD CAPTION. One constant, used under every Download button, so the
// grant figure cannot be typed differently on two surfaces. 10 is what the app
// enforces (ProDayGrant.installDays == 10, operator 2026-08-22 08:11) and it is
// expected to RISE, which is exactly why it lives in one place.
assert.match(
  pricingData,
  /FLOW_DOWNLOAD_CAPTION = "For Mac OS\. Base is free forever\. 10 Pro days included\. No credit card to use\."/,
  'the download caption states the grant the app actually enforces',
);
// "Included", never "free trial", and never a countdown: a Pro Day is spent only
// on a day the reader invokes AI, so "10 days free" would be false.
assert.doesNotMatch(pricingData, /10 days free/i, 'the grant is not a calendar countdown');

// THE DOWNLOAD CTA IS ONE COMPONENT. Seven surfaces render it (both heroes, the
// shared waitlist panel, the pricing card, the nav, and the launch story's top
// bar + Flow card, guarded in flow-launch-series), so the disabled state
// lives in one place rather than being re-implemented per surface.
// OPERATOR DECISION 2026-08-22 20:47: the disabled state and its "not live yet"
// caption were removed on explicit instruction. Every surface now renders the
// download as a live anchor at FLOW_DMG_URL, whatever that URL currently is.
const downloadCta = read('src/components/flow/FlowDownloadCta.astro');
assert.match(downloadCta, /href=\{FLOW_DMG_URL\}/, 'the CTA links straight at the one download URL');
assert.match(downloadCta, />\s*Download Flow Now\s*</, 'the button carries the operator label');
assert.doesNotMatch(downloadCta, /aria-disabled/, 'the disabled state is gone by operator decision');
// The subtext under the button is the shared constant, never retyped per surface.
assert.match(downloadCta, /\{FLOW_DOWNLOAD_CAPTION\}/, 'the subtext comes from the one caption constant');

// THE NAV STICKY BAR leads with the download once Flow is live (operator ask
// 2026-08-22 10:13). All three nav calls to action switch together.
const navSource = read('src/components/Nav.astro');
assert.match(navSource, /const navCtaLabel = flowLive \? 'Download Flow' : 'Join the waitlist';/);
assert.match(navSource, /const stickyCtaLabel = navCtaLabel;/);
// The nav keeps the same direct-download contract as every other launch CTA.
// Release safety is enforced at the deployment boundary, not by changing the
// action label or detouring this one surface to pricing.
assert.match(navSource, /const flowDownloadHref = flowLive \? FLOW_DMG_URL : '\/flow\/#waitlist';/, 'the launched nav points at the one canonical download URL');

// BASE IS THE ABSENCE OF AN ENTITLEMENT. It has no SKU, no price and no
// entitlement string, and the commerce layer must never grow one for it.
const commerce = read('src/data/commerce.ts');
assert.doesNotMatch(commerce, /license_orionfold_flow_base|flow_base/i, 'Base must never acquire a SKU');
assert.match(commerce, /license_orionfold_flow_monthly/);
assert.match(commerce, /license_orionfold_flow_annual/);
// The annual amount is DERIVED from the monthly one and one rate, never a second
// literal, or the two can silently disagree.
assert.match(commerce, /annualDiscount: FLOW_ANNUAL_DISCOUNT/, 'the annual discount comes from the catalog, not a literal');
assert.match(
  read('supabase/functions/_shared/catalog.ts'),
  /FLOW_ANNUAL_AMOUNT = Math\.round\(\s*FLOW_MONTHLY_AMOUNT \* 12 \* \(1 - FLOW_ANNUAL_DISCOUNT\)/,
  'the annual amount is derived from the monthly amount and one rate',
);

// THE LAPSE PROMISE is quoted from the app's own withdrawal notice, so the page
// reuses a sentence the binary enforces rather than paraphrasing it.
assert.match(pricingData, /Your text wasn't checked\. Subscribe to keep using Flow's AI features/, "the app's own withdrawal sentence is quoted verbatim");
assert.match(pricingData, /Your documents are free forever\. The AI is what you pay for\./);
// Documents stay free when the grant is spent: no locks, no export wall.
assert.match(pricingCopy, /you keep your work/i);

// One consent sentence, one module (src/data/flow-consent.ts): every Flow
// capture surface imports it, so recorded consent cannot drift between them.
const consentModule = read('src/data/flow-consent.ts');
assert.match(consentModule, /export const FLOW_CONSENT_TEXT =\s*\n?\s*'By joining the Flow waitlist, you agree to receive Flow development and launch updates plus the AI For Everyone digest, one email a week, no more\. You can unsubscribe any time\. See our privacy policy\.'/);
// FlowProofNuggets is unmounted as of 2026-08-21 but still carries a form, so
// it stays in this list: if anyone remounts it, the shared consent sentence is
// already enforced.
for (const [name, path] of [['FlowLaunchHomeHero', 'src/components/flow/FlowLaunchHomeHero.astro'], ['FlowWaitlist', 'src/components/sections/FlowWaitlist.astro'], ['FlowProofNuggets', 'src/components/flow/FlowProofNuggets.astro']]) {
  assert.match(read(path), /import \{ FLOW_CONSENT_TEXT \} from '[./]+data\/flow-consent(?:\.ts)?'/, `${name} must import the shared consent sentence`);
  assert.doesNotMatch(read(path), /consentText\s*=\s*'By joining/, `${name} must not carry its own copy of the consent sentence`);
}
// Every Flow capture form carries ONE caption line (operator decision
// 2026-08-20): the long consent sentence is recorded on submit, never shown.
for (const [name, src] of [['FlowLaunchHomeHero', sharedHero], ['FlowWaitlist', read('src/components/sections/FlowWaitlist.astro')], ['FlowProofNuggets', read('src/components/flow/FlowProofNuggets.astro')]]) {
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
assert.match(chapters, /Local AI comes with the app\./, 'the runtime story leads with the zero-extra-runtime benefit');
assert.match(flow, /revision-scoped verifiable AI agency is patent pending/);
// The measured stat band. Every figure must survive; the fine print states the
// DATA (what was measured, on what) and, since the operator's 2026-08-22 call,
// no longer prints capture dates. The dates stay recorded in the capability
// briefs — dropping them from the page changed no figure.
// '7 actions': Visualize joined the six-action catalog in Flow 0129 and is
// present in the current AgencyAction.allCases product source.
for (const value of ['22.3 ms', '620,000', '$0.00425', '+19.2 MiB', '7 actions', '2 locations']) {
  assert.match(flowMeasurements, new RegExp(esc(value)), `${value} must stay in the measured stat band`);
}
// Scoped to the canonical measurement source: the press facts table further
// down is a different surface and deliberately keeps its dates.
const statBand = flowMeasurements;
assert.doesNotMatch(statBand, /\b20\d\d-\d\d-\d\d\b(?![^\n]*\*\/)/, 'the stat band prints data, not capture dates');
assert.match(statBand, /icon: '/, 'every stat carries an infographic glyph');
// Prose anywhere in the tour must not return to the retired five- or six-action counts.
// Alt text is exempt on purpose: the toolbar captures predate Expand and still
// show five monograms, and alt text describes the picture, not the catalog.
const chapterProse = chapters.replace(/alt="[^"]*"/g, '');
for (const stale of [/[Ff]ive AI actions/, /[Ff]ive actions/, /five AI tools/, /[Ss]ix AI actions/, /[Ss]ix actions/, /six AI tools/]) {
  assert.doesNotMatch(chapterProse, stale, 'the Agency catalog is seven actions with Expand with Sources and Visualize');
}
assert.doesNotMatch(flowMeasurements, /[56] actions/, 'the stat band counts seven actions');
// Flow 1.6 offers this Mac and configured cloud APIs; LAN and CLI routes are dark.
assert.match(flowMeasurements, /This Mac or configured cloud API providers/);
assert.doesNotMatch(flowMeasurements, /3 locations|your network|\bLAN\b/);
// Section order: tour → enterprise → press → waitlist. (The stack band left
// for the footer directory on 2026-08-20; the press kit names the footer.)
const anchors = ['id="tour"', 'id="enterprise"', 'id="press"', 'id="waitlist"'];
assert.doesNotMatch(flow, /id="stack"/, 'the stack band lives in the footer directory, not on the overview');
for (const anchor of anchors) assert.ok(flow.includes(anchor) || livingFaq.includes(anchor.replace('id=','\"id\": ')), `legacy landing anchor retained: ${anchor}`);
// Each tour chapter stays deep-linkable AND stays clear of the fixed nav when
// jumped to. The two are asserted separately because the class list is not
// order-stable: the 2026-08-16 typography pass added .of-display alongside
// scroll-mt-28, and a combined "id then class" regex broke on the reorder
// while the anchors themselves were still perfectly fine.
for (const id of ['tour-agency', 'tour-expand', 'tour-toolbar', 'tour-longdocs', 'tour-domains', 'tour-receipts', 'tour-runtime', 'tour-benchmarks', 'tour-routing', 'tour-resources', 'tour-search', 'tour-tables', 'tour-visualize', 'tour-pictures', 'tour-files']) {
  const heading = chapters.match(new RegExp(`<h3[^>]*\\sid="${id}"[^>]*>`))?.[0];
  assert.ok(heading, `${id} must stay a linkable tour chapter heading`);
  assert.match(heading, /\bscroll-mt-28\b/, `${id} must clear the fixed nav when deep-linked`);
  // The overview keeps the same id in its tour invitation, so /flow/#tour-<x>
  // links published before the split still land on the route into the tour.
  assert.match(categories, new RegExp(`id: '${id}'`), `${id} must be registered in flow-categories.ts`);
}
for (const id of ['tour-agency','tour-expand','tour-toolbar','tour-longdocs','tour-domains','tour-receipts','tour-runtime','tour-benchmarks','tour-routing','tour-resources','tour-search','tour-tables','tour-visualize','tour-pictures','tour-files']) assert.ok(livingSource.includes(`id="${id}"`), `overview preserves legacy ${id}`);
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
assert.match(flowPageSource, /import FlowHero from '\.\.\/components\/living\/FlowHero\.astro'/);
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

// G-113 overview compression: one concrete four-part product argument replaces
// the old five-layer concept diagram and its second product model.
assert.doesNotMatch(flow, /FlowWorkbenchIllustration|Five layers, one approval/, 'the overview keeps one product model');
for (const capability of ['FlowDocuments','FlowIdeas','FlowRouting','FlowReceipts','FlowMorningBriefing']) assert.match(flowPageSource, new RegExp(`<${capability} \\/>`), `${capability} stays in the overview`);
// Enterprise adoption patterns: nine question cards, honestly tagged. Data
// lives in src/data/flow-enterprise.ts (2026-08-20); the overview now carries
// one compact route and /flow/enterprise/ renders all nine.
const enterpriseData = read('src/data/flow-enterprise.ts');
const enterpriseSource = enterpriseData.match(/export const FLOW_ENTERPRISE: EnterprisePattern\[\] = \[([\s\S]*?)\n\];/)?.[1] ?? '';
const enterprisePage = read('src/pages/flow/enterprise.astro');
assert.match(enterprisePage, /FLOW_ENTERPRISE\.map\(/, '/flow/enterprise/ renders every pattern');
assert.match(enterprisePage, /<FlowWaitlist placement="flow-enterprise"/, '/flow/enterprise/ closes with its own attributable placement');
assert.doesNotMatch(flow, /FLOW_ENTERPRISE_TEASER\.map\(/, 'the overview no longer duplicates enterprise detail cards');
assert.match(flow, /href="\/flow\/enterprise\/"/, 'the overview links on to the full set');
assert.match(enterpriseData, /\['Data classification', 'Attribution', 'Knowledge mining'\]/, 'the teaser picks three named patterns');
for (const k of ['Allocation', 'Data classification', 'Attribution', 'Guardrails', 'Evidence', 'Routing', 'Curation', 'System of record', 'Knowledge mining']) {
  assert.match(enterpriseSource, new RegExp(`k: '${k}'`), `${k} must remain an enterprise pattern card`);
}
assert.match(enterpriseSource, /tag: 'Direction'/, 'unshipped patterns stay honestly tagged as Direction');
// The plain-language facts and FAQ stay visible, with schema from the same data.
assert.match(livingFaq, /Product facts and press contact/);
assert.match(livingFaq, /manav@orionfold\.com/);
assert.match(flowPageSource, /FAQPage/);
assert.match(flowPageSource, /SoftwareApplication/);
assert.match(flowPageSource, /faqs\.map/);
assert.match(read('src/components/living/FlowFaq.astro'), /faqs\.map/);
assert.match(read('src/components/living/FlowPlans.astro'), /FLOW\.monthly\.amount/);
assert.match(read('src/components/living/FlowPlans.astro'), /FLOW\.annual\.amount/);
assert.match(read('src/components/living/FlowPlans.astro'), /ORIONFOLD_FLOW_LIVE && <p class="ls-plan-price">/, 'new price rendering retains the release gate');

// ── Expand with Sources (0131) truth rails, 2026-08-20 ────────────────────
// Source: flow-expand-with-sources-source.md "Hard guardrails". Lookup-backed
// runs are hosted-Anthropic only today, fetch is closed, estimate and recorded
// cost are two facts, the 12-lookup bound is a feature, retrieval is named.
const expandCopy = readCopy(chapterPath('ChapterExpand'));
assert.match(expandCopy, /In Flow 1\.6, lookups run on this Mac[\s\S]*supported Anthropic models/, 'Expand describes both shipped local and hosted paths');
assert.match(expandCopy, /0\.000924 USD/, 'Expand must carry the pre-run estimate to the digit');
assert.match(expandCopy, /0\.026684 USD/, 'Expand must carry the recorded cost to the digit');
assert.match(expandCopy, /two facts/, 'estimate and recorded cost must be presented as two facts');
assert.match(expandCopy, /limit of 12 lookups/, 'the bound must be named');
assert.match(expandCopy, /[Nn]othing in the document was changed/, 'the bound must be shown as a no-write ending');
assert.match(expandCopy, /Web Lookups[\s\S]*starts off/, 'Web Lookups retains its off-by-default boundary');
assert.match(expandCopy, /local path reads the document and searches open folders[\s\S]*each lookup is receipted/, 'the v1.6 local lookup claim retains its scope and receipt');
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
assert.match(categoryShell, /href="\/flow\/tour\/"[\s\S]*Tour overview/, 'the category rail returns to the dedicated tour home');
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
assert.match(categoryShell, /href="\/flow\/tour\/" data-dir="prev"[\s\S]*Product tour/, 'the first-part pager returns to the tour home');
// The category hero carries the same cover crop as the dedicated tour card, so
// the picture a reader clicked is the picture that greets them.
assert.match(categoryShell, /import \{ FLOW_CATEGORY_SHOTS \} from '\.\.\/\.\.\/data\/flow-category-shots'/);
assert.match(flowTour, /import \{ FLOW_CATEGORY_SHOTS \} from '\.\.\/\.\.\/data\/flow-category-shots'/);
assert.match(categoryShell, /<FlowDetail\s[\s\S]*?src=\{cover\.src\}/, 'the category hero shows its cover crop');
// Chapters remain numbered across the category family; the concise overview
// points to one tour home, which then links to each part.
assert.match(categoryShell, /Product tour · Part \{index \+ 1\} of \{FLOW_CATEGORIES\.length\}/);
assert.match(categoryShell, /The proof[\s\S]*\{cat\.proof\}/, 'every tour hero names its one proof pattern');
assert.match(flow, /href="\/flow\/tour\/"/, 'the overview routes into the dedicated tour home');
assert.doesNotMatch(flow, /tourCards\.map\(\(card\) =>/, 'the full tour grid no longer lives on the product overview');
assert.match(flowTour, /tourCards\.map\(\(category, index\) =>/, 'the dedicated tour landing owns the four-part grid');
for (const slug of CATEGORY_SLUGS) {
  assert.match(categories, new RegExp(`slug: '${slug}'`), `${slug} stays represented on the tour landing`);
}
assert.doesNotMatch(flow, /chapterOffsets|cat\.chapters\.map/, 'chapter lists stay in the tour pages');
// The waitlist panel names the exchange and offers the free book as a second magnet.
assert.match(waitlistComponent, /The launch note the day Flow ships for Mac\./);
assert.match(waitlistComponent, /magnetHref\('flow-waitlist'\)/, 'the panel offers the free book');
for (const id of ["'home-flow-waitlist'", "'flow-mid-waitlist'", "'flow-page-waitlist'", "'flow-enterprise-waitlist'"]) {
  assert.ok(waitlistComponent.includes(id), `FlowWaitlist must keep a distinct form id for ${id}`);
}

// ── Homepage: approved native compositions, shared real download owner ──
const homePageSource = read('src/pages/index.astro');
const home = homePageSource + '\n' + livingSource;
const homeHero = read('src/components/living/HomeHero.astro');
const flowWaitlistComponent = read('src/components/sections/FlowWaitlist.astro');
assert.match(homeHero, /MAKE[\s\S]*KNOWLEDGE[\s\S]*LIVING[\s\S]*THING/);
assert.match(homePageSource, /<ConfirmBanner \/>/, 'confirmed-email landing behavior remains mounted');
assert.match(homePageSource, /SoftwareApplication/);
assert.match(homeHero, /<HomeKnowledgeDemo \/>/);
assert.match(read('src/components/living/FlowHero.astro'), /<ProductDemo \/>/);
assert.doesNotMatch(homePageSource, /FlowShot|FlowLaunchHomeHero|HomeRaceCapabilityAct|FlowIdeasPitStop/);
const homeOrder = ['<HomeHero','<CapabilityRibbon','<HomeContinuity','<HomeDocumentWorkshop','<HomeIdeas','<HomeProof','<Founder','<EssayInvitation','<Ecosystem','<HomeClosing'].map(marker => homePageSource.indexOf(marker));
assert.match(home, /id="waitlist"/, 'old campaign landing anchor survives');
assert.match(read('src/components/living/EmailInvitation.astro'), /<LivingDocumentsForm \/>/, 'the new offer has a dedicated signup component');
assert.match(read('src/components/living/LivingDocumentsForm.astro'), /data-consent=\{FLOW_LIVING_DOCUMENTS_CONSENT_TEXT\}/, 'new consent is imported rather than retyped');
assert.match(read('src/scripts/living-documents.js'), /IntersectionObserver/);
assert.match(read('src/scripts/living-documents.js'), /prefers-reduced-motion/);
assert.doesNotMatch(read('src/scripts/living-documents.js'), /fetch\(|XMLHttpRequest|data-launch-action|data-signup/);
// TRUTH RAILS for the two new bands, from the Flow capability briefs. Each of
// these is a sentence someone will want to "tighten" into a bigger claim.
const homeCopy = livingSource.replace(/<!--[\s\S]*?-->/g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
// Smart Routing brief: the published vocabulary is the SCREEN's. The
// implementation words must never reach public copy, and the retired name
// "Auto routing" must not come back.
for (const banned of ['predicate', 'resolver', 'fail-closed', 'Auto routing']) {
  assert.doesNotMatch(homeCopy, new RegExp(esc(banned), 'i'), `Smart Routing copy must not say "${banned}" (screen vocabulary only)`);
}
// The routing rules order by measured SPEED on this Mac. They are never a
// verdict on answer quality, and a model with no measurement is not ranked.
assert.doesNotMatch(homeCopy, /best (model|answers)|smartest model|highest quality model/i, 'routing ranks measured speed and fit, never answer quality');
// Rules do not adapt. The refusal to learn is the selling point.
assert.doesNotMatch(homeCopy, /learns your (preferences|habits|style)/i, 'Smart Routing rules do not learn; they are re-applied');
// Self-improvement is a journey; no frontier model has achieved it, so Flow
// claims the SYSTEM improves (benchmarks + rules + new model capability) and
// never that the model improves itself.
assert.doesNotMatch(homeCopy, /self-improving (AI|model|intelligence)|the AI improves itself|improves its own/i, 'Flow never claims the model improves itself');
// Visualize ADDS a fence after the selection. It never replaces the text, and
// the pictures are drawn from the file, not generated as images.
assert.doesNotMatch(homeCopy, /AI-generated infographic|rewrites your table into a chart|replaces your table/i, 'Visualize adds a fence after the selection, never replaces it');
// Designed layout blocks (callouts, columns, cards) are a separate later goal.
assert.doesNotMatch(homeCopy, /callouts?, columns,? and cards|designed layout blocks/i, 'designed layout blocks are a later goal and must not be claimed');
// The visualization count is 34 CHART types (the app's own
// App/Editor/fence-vocabulary.mjs CHART_TYPES list, which is Flint's Vega-Lite
// set minus Map and Choropleth) plus 20 DIAGRAM types on a separate renderer.
// Collapsing that into "54 chart types" misstates the 34 and would be caught
// by anyone reading the app. Marimekko, Dumbbell and Funnel are on backends
// Flow does not ship and are never promised.
for (const surface of ['src/pages/index.astro', 'src/pages/flow.astro', 'src/data/flow-categories.ts']) {
  const copy = readCopy(surface);
  assert.doesNotMatch(copy, /54 chart types|fifty four chart types/i, `${surface}: 54 is charts PLUS diagrams, never 54 chart types`);
  for (const absent of ['Marimekko', 'Dumbbell', 'Funnel chart', 'Choropleth']) {
    assert.doesNotMatch(copy, new RegExp(esc(absent), 'i'), `${surface} must not promise ${absent} (not on a backend Flow ships)`);
  }
  // COMPETITIVE RAILS, from the 2026-08-21 market check. Flow is NOT the only
  // Markdown app that renders charts and diagrams: MarkText bundles mermaid 11
  // and vega-embed and does both natively (verified in its package.json), and
  // Mermaid alone is now near-universal (Bear 2.9.2 Jul 2026, Craft, Typora,
  // Joplin, Obsidian, Zettlr, VS Code). Either claim would be false and an
  // evaluator would catch it. The defensible difference is NAMED chart types
  // versus a hand-authored chart grammar, plus one house style across both
  // engines. Keep the copy on that ground.
  assert.doesNotMatch(copy, /only (Mac )?(Markdown )?(app|editor)[^.]*\b(chart|diagram|mermaid)/i, `${surface}: never claim to be the only app that draws charts or diagrams (MarkText does both)`);
  assert.doesNotMatch(copy, /first (Markdown )?(app|editor)[^.]*\b(chart|diagram|mermaid)/i, `${surface}: never claim a first on charts or diagrams`);
  assert.doesNotMatch(copy, /no other (app|editor)[^.]*\b(chart|diagram|mermaid)/i, `${surface}: never claim no other app draws charts or diagrams`);
}
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

// ── The light-only Living Workbench illustration component ────────────────
const flowWorkbench = read('src/components/flow/FlowWorkbenchIllustration.astro');
assert.match(flowWorkbench, /import lightMaster from '\.\.\/\.\.\/assets\/flow\/living-workbench-light-alpha-v2\.png'/);
assert.doesNotMatch(flowWorkbench, /darkMaster|data-relay-shot|data-shot-dark/, 'workbench has no alternate appearance runtime');
assert.match(flowWorkbench, /src=\{lightSrc\}/);
assert.match(flowWorkbench, /srcset=\{lightSrcset\}/);
assert.match(flowWorkbench, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation: none !important/);
const transparentLight = readBinary('src/assets/flow/living-workbench-light-alpha-v2.png');
assert.equal(
  createHash('sha256').update(transparentLight).digest('hex'),
  '900356a19c851ebb75889d58ffa62b6d42a28d7c112c8402bb501c585ee804d6',
  'the source-faithful transparent light-theme Living Workbench master must not drift',
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

// ── OG cards: four distinct Living Documents editorial promises ────────
const ogData = read('src/data/og.ts');
for (const route of ['/', '/flow/', '/essay/', '/manifesto/']) {
  const entry=ogData.split(`'${route}': {`)[1]?.split(/\n\s*},/)[0] ?? '';
  assert.match(entry, /["']?living["']?: true/, `${route}: approved Living Systems card`);
  assert.match(entry, /["']?alt["']?: ["'][^"']{35,}/, `${route}: descriptive social alt`);
  assert.doesNotMatch(entry, /screenshot:/, `${route}: flagship social card uses editorial origami`);
}
assert.match(ogData,/Give your work a Night Shift/);
assert.match(ogData,/Make knowledge a living thing/);
assert.match(ogData,/Room for a Renaissance/);
assert.match(ogData,/The Living Documents Manifesto/);
const ogCardSource=read('src/lib/og/card.ts');
assert.match(ogCardSource,/livingCardTree/);
assert.match(ogCardSource,/hero-home-paper-planes\.png/);
assert.match(ogCardSource,/function heroGridSvg\(\)/, 'existing non-flagship cards retain their rendering path');
assert.match(read('src/pages/og/[slug].jpg.ts'),/endsWith\('\.webp'\)/, 'non-flagship WebP handling remains safe for Satori');

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
  /Measured 2026-08-18 on one Apple M3 Max, on the running build/,
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
  /Captured September 6, 2026[\s\S]*Installed Flow 1\.6 \(1899\)/,
  'the routing chapter keeps its current capture scope and date',
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
const homeReceiptCopy = homeCopy;

// 1. The disclosure stays welded to the chapter. Since G-120 (2026-08-26) the
//    pictured run is the operator's own hosted run on the release build, and
//    the chapter must say so with the exact recorded figure, never round it
//    into a claim, and never let the older staged figure back in as real.
assert.match(
  flowReceiptCopy,
  /The pictured run is real: 0\.121375 USD billed for claude-opus-5 through Anthropic/,
  'the receipts chapter must disclose what the pictured receipt is: a real hosted run, with its exact recorded cost',
);
assert.match(
  flowReceiptCopy,
  /historical hosted-run capture is from 2026-08-26, installed build 1255[\s\S]*Evidence settings detail is Flow 1\.6/,
  'the receipts chapter distinguishes historical run evidence from current Settings',
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
assert.match(visualizeCopy, /Captured 2026-08-26 on the installed release build 1255/, 'the chapter keeps its capture scope and date');
assert.match(visualizeCopy, /invented demo data/, 'chart numbers are disclosed as invented');
assert.doesNotMatch(visualizeCopy, /infographic|AI-generated (chart|image)/i, 'the vocabulary is the screen\'s');
assert.ok(categoryPages['documents-and-files'].includes('<ChapterVisualize />'), 'Visualize renders on the Documents and files page');
for (const detail of ['detail-chart-line', 'detail-chart-gallery', 'detail-chart-flowchart']) {
  assert.match(detailScript, new RegExp(`out: '${esc(detail)}\\.webp'`), `${detail} must stay a generated crop`);
  assert.ok(existsSync(new URL(`../../src/assets/flow/details/${detail}.webp`, import.meta.url)), `${detail}.webp must be committed`);
}

// ── The image gallery (0054, Pictures) truth rails, 2026-08-21 ────────────
// The brief (docs/reference/flow-image-gallery-source.md) states these as hard
// guardrails. The NO-AI one is the highest-risk sentence on the page: in 2026 a
// reader assumes a picture surface describes pictures for you, and a well-meant
// copy edit ("Flow suggests a description") would invent a capability the goal
// explicitly deferred. Guard it from both directions.
const picturesCopy = readCopy(chapterPath('ChapterPictures'));
// Prose wraps across source lines, so every phrase assertion runs over a
// whitespace-collapsed copy — otherwise a harmless re-wrap breaks the guard
// and teaches the next person that these rails are noise.
const picturesProse = picturesCopy.replace(/\s+/g, ' ');
assert.match(picturesProse, /[Tt]he gallery proposes nothing and writes nothing on its own/, 'the no-AI rail stays stated');
assert.doesNotMatch(
  picturesProse,
  /(Flow|it|gallery)\s+(can\s+)?(suggests?|proposes?|generates?|writes?|describes?)\s+(the\s+|a\s+|your\s+)?(alt|description|caption)/i,
  'the gallery never proposes or generates a description',
);
assert.doesNotMatch(picturesProse, /auto-?(generate|describe|caption)|AI-(generated|written)\s+(alt|description)/i, 'no generated-description claim');
// Not an image editor in the pixel sense: GFM has no syntax for any of these.
assert.doesNotMatch(picturesProse, /\b(crop|resize|filter)(s|ping|ed)?\s+(your|the|a)\s+picture/i, 'no pixel-editing claim');
assert.match(picturesProse, /No cropping, resizing, or filters/, 'the no-pixel-editing boundary is stated');
// Copy, never move, never overwrite — the rule that protects the user's files.
assert.match(picturesProse, /copies a new picture[^.]*folder[^.]*original stays exactly where it was/, 'import is stated as a copy, never a move');
assert.doesNotMatch(picturesProse, /moves? (your|the) (file|picture|original) into/i, 'never claim a move');
// One line, and zero bytes until you act: both measured, both easy to inflate.
assert.match(picturesProse, /A swap changes that one line/, 'the one-line swap claim stays exact');
assert.match(picturesProse, /changes nothing on disk, byte for byte/, 'browsing writes nothing');
// The collection is the folder, not a library Flow keeps.
assert.match(picturesProse, /Flow keeps no library of its own/, 'the folder-is-the-collection rail stays stated');
assert.doesNotMatch(picturesProse, /upload(s|ed|ing)?\s+(to|into)\s+(Flow|the (app|cloud|library))/i, 'nothing is uploaded');
// Web images are recognised and NOT loaded; they never appear in the gallery.
assert.doesNotMatch(picturesProse, /(paste|add|use)\s+(an?\s+)?(image|picture)\s+(from\s+)?(a\s+)?(url|link|the web)/i, 'no web-image claim');
// Drag-from-Finder was NOT exercised live; the doors that were are named.
assert.doesNotMatch(picturesProse, /drag (it |a picture |an image )?(from|out of) (the )?Finder/i, 'a Finder drag was never verified');
assert.match(picturesProse, /Captured 2026-08-26 on the installed release build 1255/, 'the chapter keeps its capture scope and date');
assert.match(picturesProse, /invented demo data/, 'the demo document is disclosed as invented');
assert.ok(categoryPages['documents-and-files'].includes('<ChapterPictures />'), 'Pictures renders on the Documents and files page');
for (const detail of ['detail-gallery-words', 'detail-gallery-collection']) {
  assert.match(detailScript, new RegExp(`out: '${esc(detail)}\\.webp'`), `${detail} must stay a generated crop`);
  assert.ok(existsSync(new URL(`../../src/assets/flow/details/${detail}.webp`, import.meta.url)), `${detail}.webp must be committed`);
}

// ── AEO surfaces stay Flow-first ───────────────────────────────────────────
const llms = read('public/llms.txt');
assert.match(llms, /patent[- ]pending/);
assert.match(llms, /\[Flow\]\(https:\/\/orionfold\.com\/flow\/\)/);
for (const anchor of ['flow/tour/', 'flow/night-shift/', 'flow/living-documents/', 'flow/settings/', 'flow/enterprise/', 'flow/#press']) {
  assert.match(llms, new RegExp(esc(anchor)), `llms.txt must feed the ${anchor} surface to answer engines`);
}
const astroConfig = read('astro.config.mjs');
assert.match(astroConfig, /map\['\/flow\/'\] = '\d{4}-\d{2}-\d{2}'/, 'the hand-built Flow landing tracks an honest sitemap lastmod');
assert.match(read('tests/e2e/critical-routes.spec.ts'), /'\/flow\/'/);

// ── The MACHINE-READ layer must not lag the launch ─────────────────────────
// 2026-08-22. The rendered site branches on ORIONFOLD_FLOW_LIVE, but three
// surfaces have no flag available and are the ones machines actually quote:
// llms.txt (static, answer engines), the sitemap priority band, and the FAQPage
// JSON-LD on the magnet page. Each drifted behind the site at least once.
//
// llms.txt is STATIC -- no flag, so it states one thing and must match whatever
// the flag currently renders. These guards ban the pre-launch vocabulary
// outright rather than pinning the launched wording, so a copy rewrite stays
// free while a regression to "waitlist"/"not announced" cannot ship.
for (const banned of [
  [/pre-launch/i, 'llms.txt must not describe a released Flow as pre-launch'],
  [/waitlist/i, 'llms.txt must not offer a waitlist once Flow is downloadable'],
  [/development build/i, 'llms.txt must not call the shipping app a development build'],
  [/not announced/i, 'llms.txt must not say the price or date is unannounced'],
]) {
  assert.doesNotMatch(llms, banned[0], banned[1]);
}

// Flow is the lead flagship and outranks /proof/ and /relay/, both of which sit
// at 0.9. A flagship release left in the 0.6 fallthrough band deprioritises
// recrawl exactly when it matters most.
assert.match(
  astroConfig,
  /url === 'https:\/\/orionfold\.com\/flow\/'\)\s*\{\s*return \{ \.\.\.item, changefreq: 'weekly', priority: 0\.9, lastmod \};/,
  'the Flow landing sits in the top sitemap band with the other flagships',
);
assert.match(
  astroConfig,
  /url\.startsWith\('https:\/\/orionfold\.com\/flow\/'\)\)\s*\{\s*return \{ \.\.\.item, changefreq: 'weekly', priority: 0\.8, lastmod \};/,
  'the Flow tour + enterprise subpages form the cluster band below the hub',
);

// The catalog card carries the roadmap status the rest of the site implies.
const softwareData = read('src/data/software.ts');
assert.match(softwareData, /import \{ ORIONFOLD_FLOW_LIVE \} from '\.\/launch'/, 'the Flow card reads the launch flag');
assert.match(softwareData, /status: ORIONFOLD_FLOW_LIVE \? 'active' : 'planned'/, 'a released Flow is not still roadmap-planned');
assert.match(softwareData, /eyebrow: ORIONFOLD_FLOW_LIVE \? 'Lead flagship · Out now for Mac' : 'Lead flagship · In development'/);

// The magnet funnel: its FAQ answers ship inside FAQPage JSON-LD, so a stale one
// is quoted by answer engines rather than merely read by a visitor.
const magnetSource = read('src/pages/become-ai-native-business.astro');
assert.match(magnetSource, /import \{ ORIONFOLD_FLOW_LIVE \} from '\.\.\/data\/launch'/, 'the magnet page reads the launch flag');
assert.match(magnetSource, /ORIONFOLD_FLOW_LIVE\s*\n?\s*\? 'Flow is our Mac app/, 'the What-is-Flow FAQ answer branches on the flag');
// Both branches must survive in source (one line reverts the site), so a source
// grep cannot tell which one RENDERS. Every pre-launch phrase on this page is
// therefore required to sit inside a flag branch rather than be absent -- the
// rendered-output check belongs in the e2e suite, which sees real HTML.
for (const [phrase, label] of [
  ['be first to hear when Orionfold Flow is ready', 'the repeated CTA'],
  ['It is in development as a freemium subscription', 'the Flow-tie block and the FAQ'],
  ['the Mac app we are building', 'the hero subline'],
]) {
  const hits = magnetSource.split(phrase).length - 1;
  assert.ok(hits > 0, `${label} keeps its pre-launch wording in the off branch`);
  for (const line of magnetSource.split('\n').filter((l) => l.includes(phrase))) {
    assert.match(
      line,
      /ORIONFOLD_FLOW_LIVE|^\s*[:?]|^\s*\? |^\s*: /,
      `${label}: every pre-launch phrase must sit inside a flag branch, not ship unconditionally`,
    );
  }
}
// The recorded consent sentence deliberately does NOT branch: it is written
// verbatim into the DB on submit, so forking it would fork the compliance record
// between subscribers. It is true in both states. Guard that it stays unforked.
assert.match(
  magnetSource,
  /const consentText =\s*\n?\s*'By subscribing you agree to receive the free book, Orionfold Flow development and launch updates/,
  'the recorded consent sentence stays one literal, never flag-branched',
);
assert.doesNotMatch(magnetSource, /consentText =\s*ORIONFOLD_FLOW_LIVE/, 'consent is a compliance record, not launch copy');

// The magnet thank-you page: its own comment promised this becomes the download
// step on launch. It must route through FlowDownloadCta so it inherits the
// truthful unavailable state rather than hand-rolling a link that could 404.
const thanksSource = read('src/pages/become-ai-native-business/thanks.astro');
assert.match(thanksSource, /import FlowDownloadCta from '\.\.\/\.\.\/components\/flow\/FlowDownloadCta\.astro'/);
assert.match(thanksSource, /<FlowDownloadCta[\s\S]{0,200}?source="magnet-thanks"/, 'the thanks-page download is attributable to its own surface');
assert.doesNotMatch(thanksSource, /href=\{FLOW_DMG_URL\}/, 'the thanks page must not hand-roll the download link');

// ── The annual saving is DERIVED, never written ────────────────────────────
// 2026-08-22 14:16 B11: the app published "two months free" for the annual term.
// At $10/mo and $96/yr the saving is $24 of $120 -- 20%, which is 2.4 months. The
// app's 2 came out of an integer division that truncated the 0.4 away. The
// website never carried the phrase, and this guard is what keeps it that way:
// any month-count framing of the annual term is arithmetically wrong at these
// prices, and a hand-written percentage silently disagrees with the catalog the
// day either price moves.
const flowPricing = readCopy('src/components/flow/FlowPricing.astro');
assert.match(
  flowPricing,
  /const discountPercent = Math\.round\(FLOW\.annualDiscount \* 100\)/,
  'the annual saving is computed from the one catalog rate, never written as a literal',
);
assert.match(flowPricing, /save \{discountPercent\} percent/, 'the rendered saving reads from the derived value');
for (const surface of ['src/components/flow/FlowPricing.astro', 'src/pages/flow.astro', 'src/data/flow-pricing.ts']) {
  const copy = readCopy(surface);
  assert.doesNotMatch(
    copy,
    /(two|three|2|3)\s+months?\s+free/i,
    `${surface}: the annual term is a percentage off, never a count of free months`,
  );
  assert.doesNotMatch(
    copy,
    /save\s+\d+\s*(percent|%)/i,
    `${surface}: a hand-written saving drifts from the catalog -- derive it from FLOW.annualDiscount`,
  );
}

// The refreshed press facts make no release-state claim. Downloads retain
// their shared release gate; no launch-dark promise can leak into the FAQ.
assert.doesNotMatch(livingFaq, /join the waitlist|not yet released|licensing is unfinished/i);
assert.match(downloadCta, /ORIONFOLD_FLOW_LIVE/);

// ── Withdrawn features must not be sold ────────────────────────────────────
// 2026-08-22 15:43 B11: Flow Quick is withdrawn from the first paid release
// (`68638ba`) and cannot be reached in a shipped build. It was listed as a Pro
// capability on /flow/, which sells a subscriber a feature they cannot use — the
// exact direction the downstream contract test cannot catch, since it only
// notices claims REMOVED from the site, never stale ones still on it.
//
// The feature still exists in source and restoring it is one flag, so this guard
// exists to make the return deliberate: re-add the row only against a NEW
// product-lane entry saying it ships, never by reading the app source.
for (const surface of ['src/data/flow-pricing.ts', 'src/pages/flow.astro']) {
  const copy = readCopy(surface);
  assert.doesNotMatch(
    copy,
    /label:\s*["'`]Flow Quick/i,
    `${surface}: Flow Quick is withdrawn — it must not be listed as a capability`,
  );
  assert.doesNotMatch(
    copy,
    /global hotkey assistant/i,
    `${surface}: the Flow Quick claim must not survive under a different label`,
  );
}

console.log('[flow-flagship-surface] Living Systems front doors, real tour evidence, shared download and consent contracts');
