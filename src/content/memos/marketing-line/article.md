---
title: "The Marketing Line: a bundle split across two function domains"
date: 2026-07-09
stage: draft
series: "Relay Packs"
summary: "A lead in CRM and a campaign in Social are strangers until one shared key makes them a funnel. The Marketing line bundles two function packs and binds them with an attribution key that only lights up after the flatten. Composition across function domains, encoded as data."
tags: ["packs", "marketing", "crm", "social", "attribution", "bundle"]
difficulty: intermediate
signature: signature.svg
status: draft
---

<!-- DRAFT ITERATION 1 — for operator review. Every prose number traces to metrics.json. Pack facts verified against src/lib/packs/templates/** on 2026-07-09. relay-marketing owns no manifest; the join is a field-name convention, not a structured join object. -->

## 1. The claim

Two halves of marketing only become one system when you bundle them.

A lead lives in a CRM. A campaign lives in a social tool. In most stacks they are strangers: the lead came from *somewhere*, the campaign drove traffic *somewhere*, and connecting the two is a quarterly spreadsheet exercise nobody enjoys. The Marketing line takes a different route. It bundles two function packs, `relay-crm` and `relay-social`, and binds them with a single shared key. Before the bundle, each pack is half a system. After the flatten, the key turns the lead and the campaign into one funnel.

What makes this memo worth writing is that the binding is **data, not a dashboard hack**. Attribution here is a column that matches a column. And the cross-child features that use it are dormant when you install either pack alone, then light up the moment they are merged. That dormant-then-live behavior is the composition model showing its seams honestly, and it is the thing this memo shows.

## 2. Why this matters for the Relay operator

Attribution is the hard problem in marketing, and most tools solve it with a report that guesses. They watch a click, they watch a signup, and they draw a line between them with a heuristic you cannot inspect. When the numbers look wrong, you cannot audit the join, because the join was never a real thing. It was a chart.

The Marketing line encodes attribution as a fact instead. A campaign carries a `utm_campaign` value. A lead carries a `source_campaign` value. When they match, that lead is attributed to that campaign, and the match is a value you can read, sort, and back up. There is no proprietary attribution model between you and the truth. The truth is two columns holding the same string.

Consent gets the same treatment. It is not a buried toggle; it is a `consent_policy` table with typed columns. Whether a lead is mailable, under what basis, in what jurisdiction, at what cadence cap, is data you own, not a setting the tool remembers for you.

> For the argument on why a bundle of owned primitives beats a skill, an MCP server, or a plugin, see the pillar memo, *Why Relay Packs* (`/relay/memos/why-relay-packs/`). For the simpler flatten, one persona spine plus one industry sleeve, see the **Agency Bundle** memo. This one is the harder flatten: two functions bound by a key.

## 3. Where it sits in the arc

Relay ships thirteen packs across kinds. The **Agency Bundle** memo covered a bundle of a persona spine plus an industry vertical. The Marketing line is a different shape: a bundle split across two **function** domains. Neither child is a spine and neither is a vertical. `relay-crm` is the lead book. `relay-social` is the demand engine. `relay-marketing` composes them.

A precision note that carries over from the Agency memo: `relay-marketing` owns no manifest and declares no primitives of its own. Its entire body is a two-item children list, `relay-crm` then `relay-social`. Everything the merged app contains comes from flattening those two children.

Order in that list is merge order. CRM merges first, so it owns the leads book and wins the single-valued arms of the merged view: the hero is the lead pipeline, and the funnel is CRM's. Social merges second and adds its campaigns, its creatives, its channels, and, crucially, the cross-child bindings that reach back into CRM's data.

This memo is the cross-domain composition proof of the *Relay Packs* series. The Agency memo showed composition across a persona-and-vertical boundary. This one shows it across a function boundary, where the two halves are useless apart and become a funnel together.

## 4. The journey — the attribution spine, beat by beat

<figure class="fn-diagram" aria-label="Two function packs merge into one marketing app bound by a shared key. relay-crm, the first child, contributes the leads table with its source_campaign column and wins the funnel view. relay-social, the second child, contributes the campaigns table with its utm_campaign column plus the cross-child bindings. When source_campaign equals utm_campaign, a lead is attributed to a campaign — a join that only exists after the two children are flattened into one app.">
  <svg viewBox="0 0 760 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A CRM leads table on the left and a Social campaigns table on the right meet at a central seam where source_campaign equals utm_campaign; the seam is the join key that binds the two function packs into one attributed funnel after the bundle flatten.">
    <defs>
      <linearGradient id="ml-crm" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.26"/>
        <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.06"/>
      </linearGradient>
      <linearGradient id="ml-social" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--svg-accent-blue)" stop-opacity="0.26"/>
        <stop offset="100%" stop-color="var(--svg-accent-blue)" stop-opacity="0.06"/>
      </linearGradient>
      <linearGradient id="ml-seam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--svg-accent-green)" stop-opacity="0.30"/>
        <stop offset="100%" stop-color="var(--svg-accent-green)" stop-opacity="0.08"/>
      </linearGradient>
      <radialGradient id="ml-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stop-color="var(--svg-accent-green)" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="var(--svg-accent-green)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="380" cy="150" rx="120" ry="130" fill="url(#ml-glow)"/>
    <g class="fn-diagram__edges">
      <path class="fn-diagram__edge fn-diagram__edge--accent" pathLength="100" d="M 250 150 L 344 150" stroke="var(--svg-connector)" stroke-width="1.5" fill="none"/>
      <path class="fn-diagram__edge fn-diagram__edge--accent" pathLength="100" d="M 416 150 L 510 150" stroke="var(--svg-connector)" stroke-width="1.5" fill="none"/>
    </g>
    <g class="fn-diagram__flow">
      <circle class="fn-diagram__flow" cx="250" cy="150" r="4" fill="var(--svg-accent-green)">
        <animateMotion begin="1.5s" dur="2.4s" repeatCount="indefinite" path="M 0 0 L 94 0"/>
      </circle>
      <circle class="fn-diagram__flow" cx="510" cy="150" r="4" fill="var(--svg-accent-green)">
        <animateMotion begin="1.9s" dur="2.4s" repeatCount="indefinite" path="M 0 0 L -94 0"/>
      </circle>
    </g>
    <g class="fn-diagram__nodes">
      <rect x="40" y="96" width="210" height="108" rx="10" fill="url(#ml-crm)" stroke="var(--color-primary)" stroke-width="1.5"/>
      <rect x="510" y="96" width="210" height="108" rx="10" fill="url(#ml-social)" stroke="var(--svg-accent-blue)" stroke-width="1"/>
      <rect x="344" y="112" width="72" height="76" rx="9" fill="url(#ml-seam)" stroke="var(--svg-accent-green)" stroke-width="1.5"/>
    </g>
    <g class="fn-diagram__labels">
      <text x="58" y="118" font-size="9" fill="var(--color-primary)" font-family="var(--font-mono)" letter-spacing="0.08em">FIRST CHILD · relay-crm</text>
      <text x="58" y="138" font-size="13" font-weight="600" fill="var(--svg-text-bright)" font-family="var(--font-mono)">leads</text>
      <text x="58" y="160" font-size="10.5" fill="var(--svg-text-dim)" font-family="var(--font-mono)">stage + direct_status</text>
      <text x="58" y="178" font-size="10.5" fill="var(--color-primary)" font-family="var(--font-mono)">source_campaign</text>
      <text x="58" y="194" font-size="9.5" fill="var(--svg-text-muted)" font-family="var(--font-mono)">wins the funnel view</text>
      <text x="380" y="106" text-anchor="middle" font-size="8.5" fill="var(--svg-accent-green)" font-family="var(--font-mono)" letter-spacing="0.06em">JOIN KEY</text>
      <text x="380" y="146" text-anchor="middle" font-size="11" font-weight="600" fill="var(--svg-text-bright)" font-family="var(--font-mono)">match</text>
      <text x="380" y="164" text-anchor="middle" font-size="9" fill="var(--svg-accent-green)" font-family="var(--font-mono)">= attributed</text>
      <text x="528" y="118" font-size="9" fill="var(--svg-text-muted)" font-family="var(--font-mono)" letter-spacing="0.08em">SECOND CHILD · relay-social</text>
      <text x="528" y="138" font-size="13" font-weight="600" fill="var(--svg-text-bright)" font-family="var(--font-mono)">campaigns</text>
      <text x="528" y="160" font-size="10.5" fill="var(--svg-text-dim)" font-family="var(--font-mono)">funnel_stage · status</text>
      <text x="528" y="178" font-size="10.5" fill="var(--svg-accent-blue)" font-family="var(--font-mono)">utm_campaign</text>
      <text x="528" y="194" font-size="9.5" fill="var(--svg-text-muted)" font-family="var(--font-mono)">adds cross-child bindings</text>
      <text x="380" y="238" text-anchor="middle" font-size="10" fill="var(--svg-accent-green)" font-family="var(--font-mono)">source_campaign == utm_campaign — dormant apart, live after flatten</text>
    </g>
  </svg>
  <figcaption>The seam. A lead's <code>source_campaign</code> matching a campaign's <code>utm_campaign</code> is the whole attribution join. It is a field-name convention, not a special join object, so it costs nothing until the two packs are the same app.</figcaption>
</figure>

Here is the composition running, beat by beat. Each beat names the primitive.

### Beat 1 — the lead book (CRM's tables and schedule)

The CRM half is a lead pipeline. Its `leads` table is unusual in a good way: it tracks two axes at once. `stage` is the marketing lifecycle, from lead to subscriber to qualified to customer. `direct_status` is the outreach state, from research queue to ready-to-contact to awaiting-reply. A lead is a position on both axes, not a single funnel step, which is closer to how a real book of leads actually behaves.

The `lead-enrich` blueprint is row-insert-triggered on `leads`, so a lead that lands gets enriched automatically. A `consent_policy` table keeps mailability as first-class data. And the `lead-poller` schedule runs on cron `0 6,11,15,19 * * *`, four times a day, to keep the list clean. That is three profiles, two blueprints, three tables, and one schedule, all aimed at one job: owning the lead book.

### Beat 2 — the demand engine (Social's tables and schedule)

The Social half is the campaign side. Its `campaigns` table is the important one: each campaign carries a `utm_campaign` column, the value that a lead will later match against. Around it sit `content_assets`, the `creatives` it repurposes into, `channels`, and `ad_initiatives` for the CAC and ROAS advisor. The `content-cadence` schedule runs weekly on cron `0 8 * * 1`. Three profiles, three blueprints, five tables, one schedule, all aimed at the other job: driving demand.

Note the table is named `campaigns`, not `utm_campaign`. The `utm_campaign` is a column on it, the key value a campaign publishes so the CRM side can point back at it. That precision matters, because the whole attribution story rides on that one column name.

### Beat 3 — apart, each is half a system

Install CRM alone and you have a lead book with a `source_campaign` column that points at campaigns you do not have. Install Social alone and you have campaigns with a `utm_campaign` column that no lead references. Each pack ships the *hook* for the join, and each hook dangles until the other pack is present. This is not a bug. It is the design admitting, in data, that a lead and a campaign are two halves of one funnel.

### Beat 4 — the cross-child bindings light up (only after flatten)

Now merge them, and the dormant hooks wake. Two of them are the point of the whole line.

The first is an `attributed-leads` KPI. It is declared in Social's view, but it reads CRM's `leads` table, a table Social does not own. Standalone, that KPI has nothing to count. Bundled, it counts the leads attributed through the join. It is deliberately a KPI and not a chart, because the merge concatenates KPIs across children but does not merge charts, so the attribution proof had to live where it would survive the flatten.

The second is a `welcome-creative` blueprint. It lives in Social but is row-insert-triggered on CRM's `leads` table. Standalone, it never fires, because the `leads` table does not exist in a lone Social install. Bundled, a new lead triggers a Social workflow. A blueprint in one child, firing on a table owned by the other, is composition you can point at.

### Beat 5 — the funnel closes the loop

The merged app's funnel is CRM's `leads-funnel`, an Attract, Capture, Nurture, Convert band-flow. CRM wins it because it merges first. But even the funnel spans both children: its Attract band reads Social's `channels` table. So the funnel, like the KPI and the blueprint, is only fully lit inside the bundle. The two function domains are stitched at the seam, and the funnel is the stitch made visible.

## 5. Verification — how I know the join holds

Every structural claim above is checkable against product source, and I checked it (`metrics.json` carries the file:line citations):

- **CRM is 3/2/3/1, Social is 3/3/5/1.** The profile, blueprint, table, and schedule counts are declared in each child's manifest. The crons are exactly `0 6,11,15,19 * * *` for the CRM poller and `0 8 * * 1` for the Social cadence.
- **The join is two matching columns, not a join object.** `leads.source_campaign` and `campaigns.utm_campaign` are ordinary columns. There is no structured `join:` primitive; the binding is a field-name convention plus the manifest comments that document it.
- **The cross-child features are declared to reach across children.** The `attributed-leads` KPI is in Social's view but reads CRM's `leads`. The `welcome-creative` blueprint is in Social but row-insert-triggered on CRM's `leads`.
- **CRM wins the single-valued view; KPIs merge, charts do not.** The hero and funnel come from CRM because it merges first. The attribution KPI survives the flatten because KPIs concatenate across children while charts do not.

If I had written "the packs share a leads table," the source would have contradicted me: CRM owns `leads`, Social only reaches into it, and that asymmetry is the whole point.

## 6. Tradeoffs and honest gaps

The fair reading cuts against the line in specific places, and the brand is precision, so here they are:

- **The cross-child features are silent when the packs are installed alone.** The `attributed-leads` KPI has nothing to count and the `welcome-creative` blueprint never fires. That is a feature, not a defect, but it must be explained, because a user who installs Social alone and expects attribution will find a quiet dashboard. The value is in the bundle.
- **Attribution is only as good as the UTM discipline upstream.** The join matches a lead's `source_campaign` to a campaign's `utm_campaign`. If the tracking link was never tagged, the columns never match, and the lead is unattributed. The pack encodes the join faithfully; it cannot invent a tag that was not set.
- **The join is a convention, not an enforced constraint.** Matching column names is how the attribution works, but nothing in the schema forces a `source_campaign` to reference a real campaign. It is a documented contract, which is honest and flexible, but it is not a foreign key the database rejects a bad value against.
- **The Marketing line is family-disjoint from the Agency line.** Do not co-install the Marketing bundle and an Agency bundle expecting them to merge into one super-app. They are separate families. Each is its own app.
- **It is a paid line.** The Marketing bundle sits behind the shared Relay license, $349/year introductory, $499/year list, the same single license that unlocks every paid pack. One install buys the whole marketing function, CRM plus Social composed, but it is not free.

None of these is a defect the line hides. They are the edges of a design that chose to make attribution real data and to be honest that a lead and a campaign are only a funnel together.

## 7. What this unlocks

Building the Marketing line this way unlocks three things:

1. **Attribution as data, not a guess.** Because the join is two columns holding the same value, you can query it, audit it, and trust it. When a number looks wrong, you can find the lead whose `source_campaign` did not match and fix the tag, instead of arguing with a chart.
2. **A template for cross-domain bundles.** The pattern, two function packs bound by a shared key, generalizes. Any two domains that share an identifier can be composed the same way, with the binding dormant apart and live together. Marketing is the first instance of a reusable shape.
3. **The funnel as a portable primitive.** The Attract-Capture-Nurture-Convert band-flow is declared once, in CRM, and reads across both children. It is a funnel you own as data, not a visualization locked inside a reporting tool.

## 8. Closing

The Marketing line is the composition thesis at its hardest and clearest. Two packs, each half a system, each shipping the hook for a join that dangles until the other arrives. Bundle them and the hooks wake: a KPI in one child counts leads owned by the other, a blueprint in one child fires on a table owned by the other, and a funnel spans them both. The binding is not a chart. It is a lead's `source_campaign` equal to a campaign's `utm_campaign`, a fact you own.

That is the point of the *Relay Packs* series. Composition is not a slogan; it is dormant-then-live behavior you can watch at the seam. The last memo in the arc goes the other direction, down into a single vertical, to show what a domain layer actually adds: the **CRE and Nonprofit** packs, where a rent roll and a grants queue are real typed fields with real triggered pipelines riding on the same free spine.

---

_Next in series: **CRE and Nonprofit** — what a vertical actually adds, on the same four primitives._
