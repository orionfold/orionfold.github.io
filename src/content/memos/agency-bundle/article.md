---
title: "The Agency Bundle: one free spine, two industries, one app"
date: 2026-07-09
stage: draft
series: "Relay Packs"
summary: "The free Relay Agency pack is a reusable operating system for a service business. An industry vertical like CRE or Nonprofit is a thin layer that flattens onto that same spine at install. Not basic-versus-advanced. Manual-versus-automated, composed."
tags: ["packs", "agency", "bundle", "cre", "nonprofit", "composition"]
difficulty: intermediate
signature: signature.svg
status: draft
---

<!-- DRAFT ITERATION 1 — for operator review. Every prose number traces to metrics.json. Pack facts verified against src/lib/packs/templates/** on 2026-07-09. kind is derived (taxonomy.ts / isBundle), never a YAML field — cited as design intent. -->

## 1. The claim

You do not buy an agency system. You install a free one, and then you add your industry.

That sentence is the whole memo. The free Relay Agency pack is not a trial or a teaser. It is a complete, reusable operating system for running a service business: the clients, the engagements, the intake queue, the pipeline, and the workflows that move work through them. An industry pack like CRE or Nonprofit does not replace any of it. It is a thin vertical that flattens onto the same spine and adds the domain the spine is deliberately missing.

The interesting shape is what makes that possible. The bundle that ships spine-plus-vertical is not a bigger pack. It is a two-item list that tells the installer to merge two packs into one app. Swap the vertical and the spine does not change. That is the composition model doing real work across a domain boundary, and it is the thing this memo shows.

## 2. Why this matters for the Relay operator

If you run an agency, a studio, or a solo practice, the parts of the job that are the same for everyone are most of the job. Every service business tracks clients. Every one runs engagements with a margin. Every one has an intake queue and a new-business pipeline. None of that is real-estate-specific or nonprofit-specific. It is just *running a practice*.

The industry-specific part is real but small: a commercial-real-estate shop needs a rent roll and a renewal engine; a nonprofit consultancy needs a grants queue and a compliance calendar. That is the vertical. It is a layer, not a product.

Relay draws the line exactly there. The free Agency pack owns the shared operating system, so you never pay for the part that is the same for everyone. The paid vertical adds only the domain automation on top. The split is not basic-versus-advanced, where you pay to unlock better versions of the same thing. It is **manual-versus-automated**: the free spine is the full manual client-book OS, and the paid layer is the domain machine that works it. You get the whole practice for free, and you pay only for your industry.

> For the argument on why a bundle of owned primitives beats a skill, an MCP server, or a plugin, see the pillar memo, *Why Relay Packs* (`/relay/memos/why-relay-packs/`). This memo assumes it and shows it composing across two industries.

## 3. Where it sits in the arc

Relay ships thirteen packs, across kinds. The free Agency pack is a **persona** spine. CRE and Nonprofit are **industry** verticals. And two more packs exist that are neither spine nor vertical: they are **bundles** that compose the two.

A word on precision, because precision is the brand. A pack's kind is not a field you will find written in its `pack.yaml`. It is derived: a persona or industry pack declares its kind through the taxonomy of its tables, and a bundle is any pack that declares a non-empty list of children. So when this memo says the Agency pack is a persona pack and CRE is an industry pack, that is design intent read out of the machine registry, not a label the YAML file wears.

The bundle is the small, easy-to-miss piece that makes the whole thing click. `relay-agency-cre` owns no primitives at all. Its entire content is a two-item list: `relay-agency` first, `relay-cre` second. At install, that list tells the merger to flatten both packs into a single application. `relay-agency-nonprofit` is the same shape with `relay-nonprofit` in the second slot. Same spine, different sleeve.

This memo is the composition proof of the *Relay Packs* series. The pillar argued that a Pack composes owned primitives into a domain app. Here that composition crosses a domain boundary twice, from the same starting point, and lands as one app each time.

## 4. The journey — the flatten, beat by beat

<figure class="fn-diagram" aria-label="One free Agency spine composes into two different industry apps. The spine, relay-agency, is the reusable operating system with seven profiles, seven blueprints, and four tables. Two bundle packs each declare the spine plus one industry vertical: relay-agency-cre adds the CRE rent-roll layer, relay-agency-nonprofit adds the Nonprofit grants layer. The spine is identical in both; only the industry sleeve changes.">
  <svg viewBox="0 0 760 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A central free Agency spine feeds two bundle outputs: a CRE app and a Nonprofit app. The spine primitives are shared and unchanged; each bundle adds a different industry vertical that flattens onto it.">
    <defs>
      <linearGradient id="ab-spine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.30"/>
        <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.07"/>
      </linearGradient>
      <linearGradient id="ab-cre" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--svg-accent-teal)" stop-opacity="0.24"/>
        <stop offset="100%" stop-color="var(--svg-accent-teal)" stop-opacity="0.05"/>
      </linearGradient>
      <linearGradient id="ab-np" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--svg-accent-purple)" stop-opacity="0.24"/>
        <stop offset="100%" stop-color="var(--svg-accent-purple)" stop-opacity="0.05"/>
      </linearGradient>
      <radialGradient id="ab-glow" cx="0.5" cy="0.5" r="0.6">
        <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.16"/>
        <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <ellipse cx="160" cy="160" rx="150" ry="140" fill="url(#ab-glow)"/>

    <g class="fn-diagram__edges">
      <path class="fn-diagram__edge fn-diagram__edge--accent" pathLength="100" d="M 300 130 L 470 90" stroke="var(--svg-connector)" stroke-width="1.5" fill="none"/>
      <path class="fn-diagram__edge fn-diagram__edge--accent" pathLength="100" d="M 300 190 L 470 230" stroke="var(--svg-connector)" stroke-width="1.5" fill="none"/>
    </g>

    <g class="fn-diagram__flow">
      <circle class="fn-diagram__flow" cx="300" cy="130" r="4" fill="var(--color-primary)">
        <animateMotion begin="1.4s" dur="2.6s" repeatCount="indefinite" path="M 0 0 L 170 -40"/>
      </circle>
      <circle class="fn-diagram__flow" cx="300" cy="190" r="4" fill="var(--color-primary)">
        <animateMotion begin="1.8s" dur="2.6s" repeatCount="indefinite" path="M 0 0 L 170 40"/>
      </circle>
    </g>

    <g class="fn-diagram__nodes">
      <rect x="44" y="80" width="256" height="160" rx="12" fill="url(#ab-spine)" stroke="var(--color-primary)" stroke-width="1.5"/>
      <rect x="470" y="42" width="256" height="96" rx="10" fill="url(#ab-cre)" stroke="var(--svg-accent-teal)" stroke-width="1"/>
      <rect x="470" y="182" width="256" height="96" rx="10" fill="url(#ab-np)" stroke="var(--svg-accent-purple)" stroke-width="1"/>
    </g>

    <g class="fn-diagram__labels">
      <text x="62" y="104" font-size="10" fill="var(--color-primary)" font-family="var(--font-mono)" letter-spacing="0.08em">FREE PERSONA SPINE</text>
      <text x="62" y="124" font-size="14" font-weight="600" fill="var(--svg-text-bright)" font-family="var(--font-mono)">relay-agency</text>
      <text x="62" y="150" font-size="11" fill="var(--svg-text-dim)" font-family="var(--font-mono)">7 profiles · 7 blueprints</text>
      <text x="62" y="168" font-size="11" fill="var(--svg-text-dim)" font-family="var(--font-mono)">4 tables · engagements hero</text>
      <text x="62" y="196" font-size="10.5" fill="var(--svg-text-muted)" font-family="var(--font-mono)">clients · engagements</text>
      <text x="62" y="212" font-size="10.5" fill="var(--svg-text-muted)" font-family="var(--font-mono)">intake · pipeline</text>
      <text x="62" y="230" font-size="10" fill="var(--color-primary)" font-family="var(--font-mono)">merges first — owns the hero</text>

      <text x="488" y="64" font-size="9" fill="var(--svg-text-muted)" font-family="var(--font-mono)" letter-spacing="0.08em">BUNDLE · relay-agency-cre</text>
      <text x="488" y="84" font-size="13" font-weight="600" fill="var(--svg-text-bright)" font-family="var(--font-mono)">+ CRE vertical</text>
      <text x="488" y="104" font-size="10.5" fill="var(--svg-text-dim)" font-family="var(--font-mono)">3 profiles · 3 blueprints</text>
      <text x="488" y="122" font-size="10.5" fill="var(--svg-accent-teal)" font-family="var(--font-mono)">rent_roll · renewal engine</text>

      <text x="488" y="204" font-size="9" fill="var(--svg-text-muted)" font-family="var(--font-mono)" letter-spacing="0.08em">BUNDLE · relay-agency-nonprofit</text>
      <text x="488" y="224" font-size="13" font-weight="600" fill="var(--svg-text-bright)" font-family="var(--font-mono)">+ Nonprofit vertical</text>
      <text x="488" y="244" font-size="10.5" fill="var(--svg-text-dim)" font-family="var(--font-mono)">3 profiles · 4 blueprints</text>
      <text x="488" y="262" font-size="10.5" fill="var(--svg-accent-purple)" font-family="var(--font-mono)">grants · compliance calendar</text>
    </g>
  </svg>
  <figcaption>One spine, two sleeves. The free <code>relay-agency</code> pack is identical in both bundles; because it is the first child, it wins the merged app's hero and view. Only the industry vertical in the second slot differs.</figcaption>
</figure>

Here is the composition running, beat by beat. Each beat names the primitive.

### Beat 1 — the free spine is a whole practice

I installed the free Agency pack and opened it. The center of the app is `engagements`, the declared hero table and the place margin lives. Around it are the other three tables the spine owns: `clients`, `intake`, `pipeline`. Seven agent profiles staff the roles of a practice, from `account-manager` to `bookkeeper` to `governance-officer`. Seven blueprints run the recurring work: `client-onboarding`, `intake-routing`, `new-business`, `expense-intake`, `per-client-billing`, `month-end-close`, and `client-status-digest`.

That is a complete client-book operating system, and it costs nothing. Nothing about it is industry-specific. It is the part of every service business that is the same.

### Beat 2 — the bundle declares two children

The `relay-agency-cre` pack contains no profiles, no blueprints, no tables. Its whole body is a list of two children: `relay-agency`, then `relay-cre`. That list is the composition instruction. At install, the merger reads it and flattens both packs into one app under the bundle's identity, so what the operator sees is a single Agency application that happens to know about commercial real estate.

### Beat 3 — merge order decides who wins the view

Order in the children list is merge order, and it matters. The spine merges first, so it wins the single-valued arms of the view: the hero, the kit, the funnel. That is why the merged app's hero is still `engagements`, the spine's money table, not something the vertical invents. The vertical merges second and *adds*: its three CRE profiles, its three blueprints, and its one table, `rent_roll`, all concatenate onto the spine. The result is one app, one project scope, every binding intra-app.

### Beat 4 — the vertical is real domain, not a coat of paint

The CRE layer is not a theme. `rent_roll` is a typed table with the columns a lease portfolio actually needs: `property`, `tenant`, `base_rent`, `expiry`, `escalation`, `option`. The `lease-abstraction` blueprint is row-insert-triggered on that table, so dropping a lease into the rent roll starts the abstraction work automatically. This is a domain data model plus a triggered pipeline, which is what a vertical is when it is done honestly. The neighboring memo on verticals takes this apart in full.

### Beat 5 — swap the sleeve, keep the spine

Now the payoff. Change one line and you get a different industry. `relay-agency-nonprofit` is the same bundle shape with `relay-nonprofit` in the second slot. The spine is byte-for-byte the same seven profiles, seven blueprints, four tables. The vertical that flattens on is different: three profiles, four blueprints, and the `grants` table with its own columns, `client`, `funder`, `program`, `amount`, `deadline`, `stage`, `notes`. The spine did not change. The industry did. That is persona-neutrality proven by construction: the reusable operating system does not know or care which vertical rides on top of it.

## 5. Verification — how I know the flatten holds

Every structural claim above is checkable against product source, and I checked it (`metrics.json` carries the file:line citations):

- **The spine is 7/7/4.** Seven profiles, seven blueprints, four tables, zero schedules, declared in the Agency manifest. The hero is `engagements`, the money table.
- **The verticals add real, bounded domain.** CRE adds 3 profiles, 3 blueprints, and the `rent_roll` table. Nonprofit adds 3 profiles, 4 blueprints, and the `grants` table. Each vertical's lead blueprint is row-insert-triggered on its own table.
- **The bundle is a two-item list, not a fourth pack of primitives.** `relay-agency-cre` and `relay-agency-nonprofit` own no manifest. Each declares `[relay-agency, <vertical>]` and nothing else.
- **First child wins the single-valued view.** The merge function takes the hero, kit, and funnel from the first child to declare them; secondary panels, KPIs, charts, and all four primitive arrays concatenate. Because the spine is child zero, the merged hero is the spine's `engagements`.
- **Collisions fail loud.** A logical-id clash across children throws `BundleCollisionError` rather than half-merging. The merge is all-or-nothing, per primitive kind.

If I had written "the vertical replaces the spine's client book," the source would have contradicted me: the industry packs deliberately do not redeclare `clients`, they feed the spine's client book through seed data.

## 6. Tradeoffs and honest gaps

The fair reading cuts against the pack in specific places, and the brand is precision, so here they are:

- **The industry packs are not standalone products.** A vertical adds a rent roll or a grants queue, but it ships no client book, no engagements table, no margin cockpit. Installed alone, it is half a system. The spine is not optional; it is the system. Do not market a vertical as a standalone industry tool, because it is not one.
- **The spine dependency is a design intent, not a machine guardrail.** There is no `requires` or `dependsOn` field enforcing "install the spine first." Each vertical is technically installable on its own; it just would not have the client book underneath it. The bundle packs exist precisely so you never have to think about that ordering, which is the honest reason they exist.
- **The kinds are derived, not declared.** "Persona," "industry," and "bundle" are read out of the taxonomy and the presence of a children list, not written as a field. That is a clean design, but it means the classification lives in the registry, and a reader auditing a raw `pack.yaml` will not see the label.
- **One license gates the bundle, not the children separately.** The vertical sits behind the shared Relay license, $349/year introductory, $499/year list, the same single license that unlocks every paid pack. The free spine is the on-ramp; the industry layer is paid. There is no separate bundle SKU and no per-child pricing.

None of these is a defect the pack hides. They are the edges of a design that chose to make the shared operating system free and reusable, and the industry layer thin and additive.

## 7. What this unlocks

Building the agency line this way unlocks three things:

1. **A spine that amortizes across every industry.** The expensive part, the client-book operating system, is built once and reused by every vertical. A new industry is not a new product; it is a new thin child that flattens onto the same spine.
2. **Additive verticals, not rewrites.** Because the vertical only adds, and the merge is order-defined and collision-safe, shipping a new industry does not touch the spine or the industries already shipped. The composition scales sideways.
3. **A proof the model crosses domains.** The same bundle shape lands as a CRE app and a Nonprofit app from an identical starting point. That is evidence the composition is not a one-domain trick; it is a general way to turn a reusable spine plus a thin layer into an owned application.

## 8. Closing

The Agency line is the clearest demonstration of the composition thesis, because you can watch one free spine become two different businesses without changing the spine. You install the operating system for free, you add the two-item bundle for your industry, and the merger flattens them into a single app whose hero is still your money table and whose vertical is real typed domain on top.

That is the point of the *Relay Packs* series. A pack is not a monolith and not a plugin. It is composed, and composition means a new industry is a new sleeve on a spine you already own. The next memo takes the same lens to a harder flatten: the **Marketing line**, a bundle split not across a persona and a vertical but across two function domains, bound by a shared attribution key that only lights up once the two halves are merged.

---

_Next in series: **The Marketing Line** — a bundle split across two function domains, bound by an attribution spine._
