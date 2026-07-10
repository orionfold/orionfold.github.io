---
title: "The Web Designer Pack: a landing page you own, generated from a table"
date: 2026-07-09
stage: draft
series: "Relay Packs"
summary: "Relay Web Designer turns a table of page sections into a self-contained static site and publishes the exact reviewed artifact to a GitHub Pages repo you own. No egress until you press publish, no vendor holding the keys. Built from four composable primitives, not a plugin."
tags: ["packs", "web-designer", "static-site", "github-pages", "primitives"]
difficulty: intermediate
signature: signature.svg
status: draft
---

<!-- DRAFT ITERATION 1 — for operator review. Every number traces to metrics.json. Pack facts verified against src/lib/packs/templates/** on 2026-07-09. -->

## 1. The claim

You can build a landing page in Relay without opening a code editor, without a hosting account, and without handing your content to a platform that can change the terms next quarter. You edit rows in a table. You press Generate and get a single `index.html` you can open locally. You press Publish and that exact file lands in a GitHub repository **you** own.

That is the whole Web Designer pack in one breath. What makes it worth an essay is not the feature. It is the shape underneath: the pack is not a monolith and it is not a plugin. It is a **bundle of four composable primitives** — agent profiles, workflow blueprints, data tables, and a view — flattened into one app at install. Change your mind about any layer and you swap a primitive, not the product.

This memo is a build log. It walks the pack from the row you type to the page you own, names each primitive doing the work, and is honest about where the pack stops.

## 2. Why this matters for the Relay operator

Most people who need a landing page do not need a website. They need *one page that says the true thing and has a button*. The industry answer to that is a spectrum of bad trades:

- A **site builder** (Wix, Squarespace, Framer) gives you a page fast, then owns your content, your hosting, and your renewal price. Export is a second-class citizen; you rent the page forever.
- A **static-site generator** (Astro, Hugo, Eleventy) gives you ownership and speed, then asks you to learn a toolchain, a templating language, and a deploy pipeline before you can change a headline.
- An **AI chatbot** will happily *write* you the HTML, then leave you holding a file with no place to put it, no preview you trust, and no repeatable way to change section three next week.

The Web Designer pack collapses that trade. The speed of a builder, the ownership of a static generator, the assistance of an agent — without renting any of the three. The reason it can is that Relay already has the primitives a landing page needs (a table to hold sections, an agent to draft copy, a workflow to shape a section, a view to preview it), so the pack does not build a website engine. It **composes** one.

That is the operator payoff and the thesis of the whole series: a pack is cheaper to trust than a plugin because it is made of parts you already understand, and you keep the parts.

> For the full argument on why a bundle-of-primitives beats a skill, an MCP server, or a plugin, see the pillar memo — *Why Relay Packs* (`/relay/memos/why-relay-packs/`). This memo assumes it and shows it in one domain.

## 3. Where it sits in the arc

Relay ships thirteen packs. They fall into kinds: **industry** delivery packs (CRE, Nonprofit), **persona** spines (the free Agency pack), **functional** packs (CRM, Social), and **bundles** that flatten several children into one app. Web Designer is a bundle. It flattens two children — `relay-web-publisher` and `relay-web-assets` — into a single web-design operating surface.

<figure class="fn-diagram" aria-label="Web Designer is a bundle of two child packs. relay-web-publisher, the first child, contributes the site editor, the section-draft workflow, the web_sections and web_pages tables, and — because it merges first — wins the view arms that generate and publish the site. relay-web-assets, the second child, adds the asset-curator, the asset-intake workflow, the web_assets table, and the gallery. At install, mergeBundle flattens both into exactly one app with one project scope.">
  <svg viewBox="0 0 760 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Two child packs on the left merge through mergeBundle into one flattened app on the right; the first child wins the single-valued view arms while both children's primitives concatenate.">
    <defs>
      <linearGradient id="wd-childa" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.05"/>
      </linearGradient>
      <linearGradient id="wd-childb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--svg-accent-teal)" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="var(--svg-accent-teal)" stop-opacity="0.05"/>
      </linearGradient>
      <linearGradient id="wd-merged" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.30"/>
        <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.07"/>
      </linearGradient>
      <radialGradient id="wd-mglow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.16"/>
        <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <ellipse cx="600" cy="150" rx="170" ry="150" fill="url(#wd-mglow)"/>

    <g class="fn-diagram__edges">
      <path class="fn-diagram__edge fn-diagram__edge--accent" pathLength="100" d="M 280 92 L 440 150" stroke="var(--svg-connector)" stroke-width="1.5" fill="none"/>
      <path class="fn-diagram__edge fn-diagram__edge--accent" pathLength="100" d="M 280 208 L 440 150" stroke="var(--svg-connector)" stroke-width="1.5" fill="none"/>
      <path id="wd-merge-path" class="fn-diagram__edge fn-diagram__edge--accent" pathLength="100" d="M 440 150 L 470 150" stroke="var(--color-primary)" stroke-width="2" fill="none"/>
    </g>

    <g class="fn-diagram__flow">
      <circle class="fn-diagram__flow" cx="440" cy="150" r="4" fill="var(--color-primary)">
        <animateMotion begin="1.5s" dur="2.2s" repeatCount="indefinite" path="M 0 0 L 30 0"/>
      </circle>
    </g>

    <g class="fn-diagram__nodes">
      <rect x="30" y="44" width="250" height="96" rx="9" fill="url(#wd-childa)" stroke="var(--color-primary)" stroke-width="1.5"/>
      <rect x="30" y="160" width="250" height="96" rx="9" fill="url(#wd-childb)" stroke="var(--svg-accent-teal)" stroke-width="1"/>
      <rect x="470" y="60" width="260" height="180" rx="11" fill="url(#wd-merged)" stroke="var(--color-primary)" stroke-width="1.5"/>
    </g>

    <g class="fn-diagram__labels">
      <text x="46" y="62" font-size="9" fill="var(--color-primary)" font-family="var(--font-mono)" letter-spacing="0.08em">FIRST CHILD · WINS THE VIEW</text>
      <text x="46" y="80" font-size="13" font-weight="600" fill="var(--svg-text-bright)" font-family="var(--font-mono)">relay-web-publisher</text>
      <text x="46" y="99" font-size="10.5" fill="var(--svg-text-dim)" font-family="var(--font-mono)">site-editor · section-draft</text>
      <text x="46" y="114" font-size="10.5" fill="var(--svg-text-dim)" font-family="var(--font-mono)">web_sections · web_pages</text>
      <text x="46" y="129" font-size="10.5" fill="var(--color-primary)" font-family="var(--font-mono)">+ generate + publish arms</text>

      <text x="46" y="182" font-size="9" fill="var(--svg-text-muted)" font-family="var(--font-mono)" letter-spacing="0.08em">SECOND CHILD · CONCATENATES</text>
      <text x="46" y="200" font-size="13" font-weight="600" fill="var(--svg-text-bright)" font-family="var(--font-mono)">relay-web-assets</text>
      <text x="46" y="220" font-size="10.5" fill="var(--svg-text-dim)" font-family="var(--font-mono)">asset-curator · asset-intake</text>
      <text x="46" y="236" font-size="10.5" fill="var(--svg-text-dim)" font-family="var(--font-mono)">web_assets · asset-gallery</text>

      <text x="340" y="153" text-anchor="middle" font-size="9.5" fill="var(--svg-text-muted)" font-family="var(--font-mono)">mergeBundle</text>

      <text x="600" y="88" text-anchor="middle" font-size="10" fill="var(--color-primary)" font-family="var(--font-mono)" letter-spacing="0.08em">ONE FLATTENED APP</text>
      <text x="600" y="110" text-anchor="middle" font-size="14" font-weight="600" fill="var(--svg-text-bright)" font-family="var(--font-mono)">relay-web-designer</text>
      <text x="600" y="140" text-anchor="middle" font-size="11" fill="var(--svg-text-bright)" font-family="var(--font-mono)">3 tables · 2 profiles · 2 blueprints</text>
      <text x="600" y="160" text-anchor="middle" font-size="11" fill="var(--svg-text-bright)" font-family="var(--font-mono)">1 view · generate + publish</text>
      <text x="600" y="192" text-anchor="middle" font-size="10.5" fill="var(--svg-text-dim)" font-family="var(--font-mono)">one project scope</text>
      <text x="600" y="210" text-anchor="middle" font-size="10.5" fill="var(--svg-text-dim)" font-family="var(--font-mono)">all bindings intra-app</text>
    </g>
  </svg>
  <figcaption>The flatten. Two child packs install as <em>one</em> app: the first child, <code>relay-web-publisher</code>, wins the single-valued view arms (generate + publish); everything else — profiles, blueprints, tables, galleries — concatenates. A logical-id collision would throw <code>BundleCollisionError</code> rather than half-merge.</figcaption>
</figure>

It sits at the "I have something to sell and I need to show it" edge of the product. A CRE agency uses the delivery packs to run the deal; it uses Web Designer to put the listing on a page. A solo founder uses the Agency spine to run the business; she uses Web Designer to launch it. The pack is deliberately domain-light — it is the surface every other pack eventually points a URL at.

It also carries the newest piece of Relay infrastructure: the **generator/publisher substrate** (TDR-039), the machinery that turns declarative rows into deployable artifacts. Web Designer is that substrate's first consumer, which is why it is the best pack to read if you want to understand where Relay is going: away from "an agent that does a task" and toward "an app that produces an owned thing."

## 4. The journey — from a row to a page you own

Here is the pack doing its job, beat by beat. Each beat names the primitive.

### Beat 1 — the section is a row (the *table* primitive)

*What I ran.* I installed the pack and opened its hero surface. The center of the app is a table called `web_sections`. Each row is one block of a page: `pageSlug`, `kind`, `heading`, `body`, `order`, `ctaLabel`, `ctaUrl`, `imageUrl`, `status`, `notes`.

*What happened.* Adding a section is adding a row. The `kind` column is the vocabulary of a landing page — `hero`, `features`, `cta`, `text` — and `order` is literally the vertical order on the page. A sibling table, `web_pages`, holds the pages themselves; a third table, `web_assets` (from the second bundled child), holds reusable images and proof blocks the sections can reference.

*What it means.* The page has no hidden state. It is data you can read, sort, diff, and back up. There is no proprietary document format between you and your content — the content *is* the table.

### Beat 2 — the agent drafts the copy (the *profile* primitive)

*What I ran.* Rather than write the hero copy cold, I used the pack's `site-editor` profile to draft a section, and its `asset-curator` profile to pick which proof block belonged next to it.

*What happened.* The agents do not "own" the page. They write into rows. The `site-editor` drafts a `web_sections` row; the `asset-curator` organizes the `web_assets` library. Two profiles, two jobs, both writing to tables you can then edit by hand.

*What it means.* The AI is a contributor to a data model, not a black box that emits a finished artifact you cannot revise. If the draft is wrong, you fix a cell.

### Beat 3 — the workflow shapes a section (the *blueprint* primitive)

*What I ran.* I triggered the `section-draft` blueprint to turn a rough brief into a structured section, and (from the assets child) `asset-intake` to bring a new image into the library with the right role.

*What happened.* A blueprint is a repeatable, checkpoint-able workflow. "Draft a page section" is not a one-shot prompt; it is a named procedure I can run again next month with a different brief and get the same shape of output.

*What it means.* Repeatability is the difference between "the AI made me a page once" and "I have a process for making pages." The blueprint is the process, saved.

### Beat 4 — Generate produces the artifact (the *view* primitive + TDR-039 generator)

*What I ran.* With sections in place and marked `published`, I pressed Generate.

*What happened.* The pack's view declares a single `generate` arm: `generatorType: static-site`, `table: web_sections`. The static-site generator reads the ordered rows and produces **one self-contained `index.html`** — a real Artifact, not a preview mockup. It is deterministic: the same rows produce the same file, byte for byte. No network call, no database read at generate time, no clock, no randomness. Only rows marked `status: published` render — a draft section stays invisible until you promote it. Every `ctaUrl` and `imageUrl` passes through a default-deny URL allowlist: `http`, `https`, and `mailto` survive; a `javascript:` or `data:` URL collapses to a harmless `#`.

*What it means.* The thing you preview is the thing you ship. Because generation is offline and deterministic, the preview is not an approximation of the final page — it *is* the final page. That property is what lets the next beat be safe.

### Beat 5 — Publish sends the exact file to a repo you own (TDR-039 publisher)

*What I ran.* I configured a GitHub Pages target — my repo, my token — and pressed Publish.

*What happened.* The view's `publish` arm (`targetType: github-pages`) hands the **exact generated Artifact** to the GitHub Pages adapter. The adapter PUTs the file to your repository through the **GitHub Contents API** — a per-file HTTP write. There is no `git` binary, no shelling out, no `child_process`. It checks that your token actually has contents-write permission before it writes anything, and it defaults to the `gh-pages` branch. Nothing left your machine until this press. The page is now live at your GitHub Pages URL, in a repository whose keys you hold.

*What it means.* Ownership is not a marketing word here; it is the deploy target. Relay never hosts your page. There is no Relay account your site depends on, no Relay bill that keeps it online, no Relay term-of-service that can change and take it down. You published to your own repo. If you uninstalled Relay tomorrow, the page would not notice.

## 5. Verification — how I know each claim is true

Every claim above is checkable against product source, and I checked it (`metrics.json` in this memo folder carries the file:line citations):

- **Four primitive kinds, not five.** The app manifest schema declares exactly four primitive arrays — profiles, blueprints, tables, schedules — plus the view. "Document routing," which I expected to be a fifth kind, turned out to be a *row-insert-triggered blueprint*, not a distinct primitive. I corrected the memo to match the source rather than the folklore.
- **Web Designer is a two-child bundle.** Its `pack.yaml` declares `bundle: [relay-web-publisher, relay-web-assets]`. At install, `mergeBundle` flattens both children into one synthetic app under the Web Designer identity: exactly one app, one project scope, all bindings intra-app.
- **The generate/publish pipeline is literally rows → artifact → repo.** The generator reads `web_sections`; the publisher writes to GitHub via the Contents API. Both arms are single-valued and declared in the publisher child's view, which wins because it merges first.
- **Offline until publish, deterministic, URL-safe.** All three are enforced in the generator source, not asserted in a doc.

This is the discipline the whole `_ASSETS` corpus runs on: a prose number that is not in `metrics.json` is a bug. If I had written "five primitives" because it sounded rounder, the memo's own gate would have caught it.

## 6. Tradeoffs and honest gaps

A memo that only sells is a brochure. Here is where the pack stops, plainly:

- **The section vocabulary is small.** Four `kind` values — `hero`, `features`, `cta`, `text`. This builds a clean landing page, not an arbitrary web app. If you need a pricing matrix, a blog index, or a multi-column comparison table, you are past what the current generator renders. Unknown kinds are skipped, not errored — safe, but silent.
- **One page shape, not a site.** `web_pages` exists, but the generate arm targets a single `index.html`. This is a launch-page tool today, not a multi-page site engine. The substrate can grow there; it has not yet.
- **You bring the GitHub account.** Ownership cuts both ways: because Relay does not host, *you* must have a repo and a token with contents-write scope. That is a real (small) setup cost the site-builder alternatives hide by owning the hosting.
- **Templates install separately.** Web Designer bundles the publisher and the assets library, but not `relay-web-templates`. If you want the versioned template records, that is a separate (free-or-licensed) install and an extra selection step before preview. The bundle is intentionally not everything.
- **It is a paid pack.** Web Designer sits behind the shared Relay license — $349/year introductory, $499 list — the same single license that unlocks *every* paid pack. It is not a separate purchase, but it is not free either. The free Agency spine is the on-ramp; Web Designer is a paid surface on top.

None of these is a defect the pack is hiding. They are the edges of a tool that chose to do one thing — an owned landing page from a table — completely, rather than everything partially.

## 7. What this unlocks

Three concrete things follow from building the pack this way:

1. **A launch page that survives your tools.** Because you publish to your own repo, the page outlives your Relay subscription, your session, and any single vendor. That is the difference between renting a page and owning one.
2. **A repeatable publishing process, not a one-off.** The blueprint and the deterministic generator mean "make a page" is a procedure you run again — for the next product, the next client, the next campaign — not a lucky prompt you cannot reproduce.
3. **A proof point for the substrate.** Web Designer is TDR-039's first consumer. The same generator/publisher machinery that turns `web_sections` into a site can, in principle, turn any table into any owned artifact. This pack is the narrow first case of a general capability: *declarative rows in, deployable owned things out.*

## 8. Closing

The Web Designer pack is a small, honest tool with an unusually clean spine. You edit a table, an agent helps, a workflow shapes it, a deterministic generator turns it into the exact page you preview, and a publisher puts that page in a repository you own. Four primitives, two bundled children, zero vendor lock on the thing you made.

That shape is the point of the *Relay Packs* series. A pack is not a feature bolted onto a chatbot — it is a domain operating surface assembled from parts you keep. The next memos take the same lens to the packs that run a business rather than launch one: the **Agency bundle** that composes a whole agency operating system from a free spine plus an industry vertical, the **Marketing line** that splits a bundle across two function domains bound by an attribution spine, and the **CRE and Nonprofit** verticals that add real domain fields — rent rolls, grant cycles — to that spine.

If you have not read it yet, start with the pillar: *Why Relay Packs* — the argument for why any of this beats a skill, an MCP server, or a plugin. Then come back here, and you will see the argument standing up in one domain, doing real work, and owning its output.

---

_Next in series: **The Agency Bundle** — one free spine, two industries, one flattened app._
