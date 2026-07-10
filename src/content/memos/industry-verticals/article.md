---
title: "CRE and Nonprofit: what a vertical actually adds"
date: 2026-07-09
stage: draft
series: "Relay Packs"
summary: "A vertical pack is not a coat of paint. It is a real domain data model plus a triggered pipeline that works it. CRE ships a rent roll and a renewal engine; Nonprofit ships a grants queue and a grant pipeline. Two industries, the same four primitives, the same free spine underneath."
tags: ["packs", "cre", "nonprofit", "verticals", "primitives", "triggers"]
difficulty: intermediate
signature: signature.svg
status: draft
---

<!-- DRAFT ITERATION 1 — for operator review. Every prose number traces to metrics.json. Pack facts verified against src/lib/packs/templates/** on 2026-07-09. kind:industry is derived from taxonomy, not a YAML field; the spine dependency is prose, not machine-enforced. -->

## 1. The claim

A vertical pack is a rent roll and a renewal engine. Or it is a grants queue and a compliance calendar. It is not a coat of paint on a generic tool.

That distinction is the whole memo. "Vertical" is a word marketing loves and usually means nothing by: a stock template, a different color, a demo dataset. In Relay a vertical means something specific and checkable. It is a **domain data model**, the typed fields that a real commercial-real-estate portfolio or a real grants practice actually needs, plus a **triggered pipeline**, the workflow that starts working the moment a row lands in that model.

CRE and Nonprofit are two instances of that exact pattern. They add different domains, but they add them the same way, through the same four primitive kinds, on top of the same free spine. Read them side by side and the vertical stops being a marketing category and becomes a repeatable engineering shape.

## 2. Why this matters for the Relay operator

Generic AI gives generic advice. Ask a general assistant about a lease and it will say sensible, shallow things about leases in general. It does not know your `base_rent`, your `escalation` schedule, or which `option` is coming due, because those are not fields it has. They are fields *you* have, in a spreadsheet it cannot see and cannot act on.

A vertical closes that gap by encoding the fields that matter as typed columns, then pointing a workflow at them. The CRE pack does not "know about real estate" in the abstract. It has a `rent_roll` table with `property`, `tenant`, `base_rent`, `expiry`, `escalation`, and `option` columns, and a `lease-abstraction` workflow that fires when you add a lease. The Nonprofit pack has a `grants` table with `client`, `funder`, `program`, `amount`, `deadline`, `stage`, and `notes`, and a grant pipeline that fires when you add a grant.

That is the difference between an assistant that discusses your domain and a system that operates in it. The vertical is the domain made into data a workflow can act on.

> For the argument on why owned primitives beat a skill, an MCP server, or a plugin, see the pillar memo, *Why Relay Packs* (`/relay/memos/why-relay-packs/`). For how a vertical composes onto the free spine, see the **Agency Bundle** memo. This one goes down into the vertical itself and shows what it is made of.

## 3. Where it sits in the arc

Relay ships thirteen packs across kinds. CRE and Nonprofit are both **industry** verticals. As in the earlier memos, a precision note: "industry" is not a field written in the `pack.yaml`. The kind is derived from the taxonomy of the pack's tables. So when this memo calls both packs industry verticals, that is design intent read from the registry, not a label the file wears.

Both verticals sit on top of the free Agency spine, and they sit there in a very specific way. Neither redeclares the `clients` table. The spine owns the client book; the vertical feeds it through seed data and adds only its own domain table on top. That is why a vertical is a layer, not a product: it brings the rent roll or the grants queue, and it borrows everything else from the spine.

One honest caveat that the tradeoffs section returns to: the spine dependency is a design intent, not a machine guardrail. There is no field that forces you to install the spine first. The vertical is technically installable alone; it simply would not have a client book underneath it. The Agency-line bundles exist precisely to remove that footgun.

This memo closes the *Relay Packs* series arc. The pillar made the argument, Web Designer showed one owned artifact, the Agency Bundle showed one flatten, the Marketing line showed a cross-domain join, and this memo shows the vertical from the inside: two domains, one repeatable skeleton.

## 4. The journey — two verticals, one skeleton

<figure class="fn-diagram" aria-label="CRE and Nonprofit are the same vertical machine with different domain labels. Each is an empty domain table that acts as a work queue, a row-insert trigger that fires a pipeline the moment a row lands, a set of human checkpoints inside that pipeline, and a domain-ready deliverable at the end. The CRE row reads rent_roll, lease-abstraction, and a renewal engine; the Nonprofit row reads grants, grant-pipeline-deep, and application assembly. Same skeleton, two domains.">
  <svg viewBox="0 0 760 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Two identical horizontal pipelines stacked: each runs from an empty domain queue through a row-insert trigger to checkpointed work to a deliverable. The top pipeline is labeled with CRE fields, the bottom with Nonprofit fields, showing the same machine under two domains.">
    <defs>
      <linearGradient id="iv-queue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--svg-text-muted)" stop-opacity="0.16"/>
        <stop offset="100%" stop-color="var(--svg-text-muted)" stop-opacity="0.04"/>
      </linearGradient>
      <linearGradient id="iv-cre" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--svg-accent-teal)" stop-opacity="0.24"/>
        <stop offset="100%" stop-color="var(--svg-accent-teal)" stop-opacity="0.05"/>
      </linearGradient>
      <linearGradient id="iv-np" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--svg-accent-purple)" stop-opacity="0.24"/>
        <stop offset="100%" stop-color="var(--svg-accent-purple)" stop-opacity="0.05"/>
      </linearGradient>
      <radialGradient id="iv-glow" cx="0.5" cy="0.5" r="0.6">
        <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="620" cy="160" rx="170" ry="150" fill="url(#iv-glow)"/>
    <g class="fn-diagram__edges">
      <path class="fn-diagram__edge fn-diagram__edge--accent" pathLength="100" d="M 186 96 L 246 96" stroke="var(--svg-connector)" stroke-width="1.5" fill="none"/>
      <path class="fn-diagram__edge fn-diagram__edge--accent" pathLength="100" d="M 386 96 L 446 96" stroke="var(--svg-connector)" stroke-width="1.5" fill="none"/>
      <path class="fn-diagram__edge fn-diagram__edge--accent" pathLength="100" d="M 586 96 L 646 96" stroke="var(--svg-connector)" stroke-width="1.5" fill="none"/>
      <path class="fn-diagram__edge fn-diagram__edge--accent" pathLength="100" d="M 186 224 L 246 224" stroke="var(--svg-connector)" stroke-width="1.5" fill="none"/>
      <path class="fn-diagram__edge fn-diagram__edge--accent" pathLength="100" d="M 386 224 L 446 224" stroke="var(--svg-connector)" stroke-width="1.5" fill="none"/>
      <path class="fn-diagram__edge fn-diagram__edge--accent" pathLength="100" d="M 586 224 L 646 224" stroke="var(--svg-connector)" stroke-width="1.5" fill="none"/>
    </g>
    <g class="fn-diagram__flow">
      <circle class="fn-diagram__flow" cx="186" cy="96" r="4" fill="var(--svg-accent-teal)">
        <animateMotion begin="1.5s" dur="4.4s" repeatCount="indefinite" path="M 0 0 L 60 0 L 260 0 L 460 0"/>
      </circle>
      <circle class="fn-diagram__flow" cx="186" cy="224" r="4" fill="var(--svg-accent-purple)">
        <animateMotion begin="2.1s" dur="4.4s" repeatCount="indefinite" path="M 0 0 L 60 0 L 260 0 L 460 0"/>
      </circle>
    </g>
    <g class="fn-diagram__nodes">
      <rect x="40" y="70" width="146" height="52" rx="8" fill="url(#iv-queue)" stroke="var(--svg-stroke)" stroke-width="1" stroke-dasharray="4 4"/>
      <rect x="246" y="70" width="140" height="52" rx="8" fill="url(#iv-cre)" stroke="var(--svg-accent-teal)" stroke-width="1"/>
      <rect x="446" y="70" width="140" height="52" rx="8" fill="url(#iv-cre)" stroke="var(--svg-accent-teal)" stroke-width="1"/>
      <rect x="646" y="70" width="90" height="52" rx="8" fill="url(#iv-cre)" stroke="var(--svg-accent-teal)" stroke-width="1.5"/>
      <rect x="40" y="198" width="146" height="52" rx="8" fill="url(#iv-queue)" stroke="var(--svg-stroke)" stroke-width="1" stroke-dasharray="4 4"/>
      <rect x="246" y="198" width="140" height="52" rx="8" fill="url(#iv-np)" stroke="var(--svg-accent-purple)" stroke-width="1"/>
      <rect x="446" y="198" width="140" height="52" rx="8" fill="url(#iv-np)" stroke="var(--svg-accent-purple)" stroke-width="1"/>
      <rect x="646" y="198" width="90" height="52" rx="8" fill="url(#iv-np)" stroke="var(--svg-accent-purple)" stroke-width="1.5"/>
    </g>
    <g class="fn-diagram__labels">
      <text x="52" y="60" font-size="9" fill="var(--svg-accent-teal)" font-family="var(--font-mono)" letter-spacing="0.08em">CRE</text>
      <text x="113" y="92" text-anchor="middle" font-size="11" font-weight="600" fill="var(--svg-text-bright)" font-family="var(--font-mono)">rent_roll</text>
      <text x="113" y="108" text-anchor="middle" font-size="8.5" fill="var(--svg-text-muted)" font-family="var(--font-mono)">empty queue</text>
      <text x="316" y="92" text-anchor="middle" font-size="10.5" fill="var(--svg-text-bright)" font-family="var(--font-mono)">row-insert</text>
      <text x="316" y="108" text-anchor="middle" font-size="8.5" fill="var(--svg-text-muted)" font-family="var(--font-mono)">lease-abstraction</text>
      <text x="516" y="92" text-anchor="middle" font-size="10.5" fill="var(--svg-text-bright)" font-family="var(--font-mono)">checkpoints</text>
      <text x="516" y="108" text-anchor="middle" font-size="8.5" fill="var(--svg-text-muted)" font-family="var(--font-mono)">renewal engine</text>
      <text x="691" y="92" text-anchor="middle" font-size="10.5" fill="var(--svg-accent-teal)" font-family="var(--font-mono)">abstract</text>
      <text x="691" y="108" text-anchor="middle" font-size="8.5" fill="var(--svg-text-muted)" font-family="var(--font-mono)">+ LOI</text>
      <text x="52" y="188" font-size="9" fill="var(--svg-accent-purple)" font-family="var(--font-mono)" letter-spacing="0.08em">NONPROFIT</text>
      <text x="113" y="220" text-anchor="middle" font-size="11" font-weight="600" fill="var(--svg-text-bright)" font-family="var(--font-mono)">grants</text>
      <text x="113" y="236" text-anchor="middle" font-size="8.5" fill="var(--svg-text-muted)" font-family="var(--font-mono)">empty queue</text>
      <text x="316" y="220" text-anchor="middle" font-size="10.5" fill="var(--svg-text-bright)" font-family="var(--font-mono)">row-insert</text>
      <text x="316" y="236" text-anchor="middle" font-size="8.5" fill="var(--svg-text-muted)" font-family="var(--font-mono)">grant-pipeline</text>
      <text x="516" y="220" text-anchor="middle" font-size="10.5" fill="var(--svg-text-bright)" font-family="var(--font-mono)">checkpoint</text>
      <text x="516" y="236" text-anchor="middle" font-size="8.5" fill="var(--svg-text-muted)" font-family="var(--font-mono)">application</text>
      <text x="691" y="220" text-anchor="middle" font-size="10.5" fill="var(--svg-accent-purple)" font-family="var(--font-mono)">package</text>
      <text x="691" y="236" text-anchor="middle" font-size="8.5" fill="var(--svg-text-muted)" font-family="var(--font-mono)">+ compliance</text>
      <text x="388" y="300" text-anchor="middle" font-size="10" fill="var(--color-primary)" font-family="var(--font-mono)">same machine — queue, trigger, checkpoints, deliverable — two domains</text>
    </g>
  </svg>
  <figcaption>One skeleton, two domains. Each vertical is an empty domain queue, a row-insert trigger, checkpointed work, and a domain deliverable. The CRE row abstracts leases and drafts renewals; the Nonprofit row runs grants to an application package. The shape is identical; only the fields change.</figcaption>
</figure>

Here are both verticals doing their job. The beats run in parallel to make the shared skeleton obvious.

### Beat 1 — the domain table is an empty work queue

The CRE pack's `rent_roll` and the Nonprofit pack's `grants` both ship **empty**. That is deliberate. Each is a trigger-bound table, so seeding a row would dispatch its blueprint on install, before you have configured anything. Shipping empty means the queue waits for you. On first open it can read as "nothing here," but it is not nothing; it is a work queue awaiting its first row. Drop a lease into `rent_roll`, or a grant into `grants`, and the work starts.

### Beat 2 — the row-insert trigger starts the pipeline

CRE's `lease-abstraction` blueprint is row-insert-triggered on `rent_roll`. Nonprofit's `grant-pipeline-deep` blueprint is row-insert-triggered on `grants`. In both, adding a row is the start signal. You do not go find a "run" button; the act of recording the lease or the grant is what launches the domain workflow. This is the "add a row, the work starts" contract, and it is the same mechanism in both packs, pointed at different tables.

### Beat 3 — human checkpoints keep the domain honest

The pipelines are not one-shot prompts; they are checkpointed procedures with real approval gates. CRE's `lease-abstraction` has two human checkpoints, "Abstract key clauses" and "Verify abstraction against source," because a mis-abstracted lease clause is an expensive error to ship. Nonprofit's `grant-pipeline-deep` has one human checkpoint, "Draft the application package," the moment before something goes out under the organization's name. The gates are where the domain expert stays in the loop.

### Beat 4 — the domain deliverable, and the deeper engine

The end of each pipeline is a domain-ready artifact. On the CRE side, `lease-abstraction` produces a client-ready lease abstract and a consolidated rent roll. And CRE ships a deeper blueprint on top, `cre-renewal-engine`, a five-step procedure, critical dates to renewal analysis to comp evidence to a lead LOI draft to a portfolio roll-up, with two of its own approval gates. On the Nonprofit side, `grant-pipeline-deep` runs a fit-scored grant to an assembled application and into a post-award compliance calendar. Three CRE profiles and three Nonprofit profiles specialize the work along the way. Different deliverables, same shape: typed input, triggered pipeline, checkpointed work, owned output.

### Beat 5 — both borrow the client book from the spine

Neither vertical redeclares `clients`. The free Agency spine owns the client book, and both verticals feed it through seed data rather than rebuilding it. A CRE lease and a nonprofit grant both belong to a client, and that client lives in the spine's table, not the vertical's. This is why the vertical is a layer: it adds the domain queue and the domain pipeline, and it leans on the spine for everything a domain does not change.

## 5. Verification — how I know each vertical is real domain

Every structural claim above is checkable against product source, and I checked it (`metrics.json` carries the file:line citations):

- **CRE is 3/3/1, Nonprofit is 3/4/1.** Three profiles, three blueprints, one table for CRE; three profiles, four blueprints, one table for Nonprofit. Both declare zero schedules.
- **The domain tables are typed, not generic.** `rent_roll` carries `property`, `tenant`, `base_rent`, `expiry`, `escalation`, `option`. `grants` carries `client`, `funder`, `program`, `amount`, `deadline`, `stage`, `notes`. These are columns in the manifest, not prose.
- **The pipelines are row-insert-triggered.** `lease-abstraction` fires on `rent_roll`; `grant-pipeline-deep` fires on `grants`. Adding a row is the start signal, declared in the trigger block.
- **The checkpoints are real approval gates.** `lease-abstraction` has two; `grant-pipeline-deep` has one; `cre-renewal-engine` runs five steps with two gates of its own. Each gate is a `requiresApproval` step in the blueprint source.
- **Both tables ship empty and both borrow the spine's client book.** The empty state is deliberate, because seeding a trigger-bound table would dispatch its blueprint on install. Clients live in the spine, fed by seed data.

If I had written "the CRE pack includes a client database," the source would have contradicted me: it deliberately does not, and that omission is the point.

## 6. Tradeoffs and honest gaps

The fair reading cuts against the verticals in specific places, and the brand is precision, so here they are:

- **Empty-by-design reads as empty-on-arrival.** A trigger-bound table with no rows can look, on first open, like a pack that did not install anything. It is a work queue, but a new user does not know that until they add the first row. The design is right; the first impression needs a nudge the pack does not currently give.
- **The verticals are not standalone.** Each adds a domain queue and a domain pipeline, but neither ships a client book, and the client is a first-class part of both domains. Installed alone, a vertical is missing the spine it was built to lean on. Do not market it as a standalone industry system.
- **The spine dependency is not machine-enforced.** There is no `requires` field. You can install a vertical without the spine, and nothing stops you; you just end up with a domain queue and no client book underneath it. The Agency bundles exist to make the correct install one step.
- **Domain depth is real but bounded.** The columns and blueprints that ship are genuinely domain-shaped, but they are a fixed set. `rent_roll` has six columns, not every field a CRE analyst might want; `grant-pipeline-deep` has one approval gate, not every review a cautious grants director might insert. The vertical does a defined slice of the domain well; it is not the whole domain.
- **Both are paid packs.** The verticals sit behind the shared Relay license, $349/year introductory, $499/year list, the same single license that unlocks every paid pack. The free Agency spine is the on-ramp; the vertical is a paid add-on.

None of these is a defect the packs hide. They are the edges of a design that chose to make the shared operating system free and the domain layer a real, bounded, triggered thing on top.

## 7. What this unlocks

Building verticals this way unlocks three things:

1. **Domain fields as typed data, not prose.** Because `base_rent` and `escalation` and `deadline` are columns, a workflow can act on them, a query can filter on them, and you can back them up. That is the difference between an assistant that talks about your domain and a system that operates in it.
2. **Triggered pipelines, so recording is running.** The row-insert trigger means the act of recording a lease or a grant is the act of starting the work. There is no separate "kick off the process" step to forget. The queue and the trigger are the process.
3. **A repeatable vertical template.** A rent roll and a grants queue are the same shape, an empty triggered queue running a checkpointed pipeline to a domain deliverable, wearing different fields. That shape is the template for every future vertical. A new industry is the same machine with new domain labels.

## 8. Closing

CRE and Nonprofit are the series' proof that a vertical is engineering, not decoration. Each is a typed domain table that ships empty on purpose, a row-insert trigger that turns recording into running, a checkpointed pipeline that keeps the domain expert in the loop, and an owned deliverable at the end. Set the two side by side and the vertical stops being a marketing word: it is one repeatable machine, wearing rent-roll fields in one pack and grant fields in the other, riding the same free spine.

That closes the arc of the *Relay Packs* series. The pillar argued that a pack composes owned primitives into a domain operating system. Web Designer showed one owned artifact. The Agency Bundle showed one flatten. The Marketing line showed a cross-domain join. And the verticals show the domain from the inside: real typed fields, a real triggered pipeline, the four primitives generic AI cannot reach because it has no persistent fields to reach into. Install any of the packs and the argument stops being an argument. It becomes an app you own.

---

_Series close. Pillar: **Why Relay Packs**. Domain memos: **Web Designer**, **Agency Bundle**, **Marketing Line**._
