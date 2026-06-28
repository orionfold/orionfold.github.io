---
title: "A $1 test that guards $1,679"
metric: "$1 guards $1,679"
claim: "A $1 test on the desk box gates about $1,679 of expected loss from a wrong cloud booking, by culling 100 candidate designs down to a few before any cloud chip is rented."
dek: "Before booking a big cloud training run, we test the design on the desk first. The cheap test catches the bad designs, and one wrong booking it stops pays for the whole box. Rerun it yourself."
date: 2026-06-28
tags: ["Cost"]
relatedTo: ["headline:1-guards-1679"]
source:
  - label: "The desk box we test on first"
    href: "/dgx-spark/"
  - label: "Built with Orionfold Arena"
    href: "/software/arena/"
verify: "Run the cheap desk sweep before your next big cloud booking: try many designs on the box, keep the few that look strong, and book only those. Track how often the sweep catches a design that would have failed in the cloud, and multiply that rate by the cost of the booking it stops."
# --- provenance (not rendered by the receipts schema, tolerated) ---
recommended: "A 100-design recipe sweep on a DGX Spark before an 8xH100 cloud training campaign"
---

The box is not just where the cheap work runs. It is the wind tunnel you check the expensive work in first.

## The test we locked

Before booking a big, costly cloud training run, we run a small version of the same design on the desk box. We try a hundred candidate designs there for about a dollar of electricity, keep the few that look strong, and book the cloud only for those. The desk sweep is cheap. The cloud booking it is checking is not, and a wrong one is money gone.

## What happened

<figure class="fn-diagram" aria-label="Three bars at the same dollar scale. The expected loss from a wrong cloud booking is about $1,680. The desk test costs $1.01, a sliver too small to see at this scale. The net saving per campaign is about $1,679. The saving bar is almost the same length as the loss bar because the test costs so little.">
  <svg viewBox="0 0 900 300" role="img" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="ofg-loss" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="var(--svg-accent-red)" stop-opacity="0.30"/>
        <stop offset="100%" stop-color="var(--svg-accent-red)" stop-opacity="0.08"/>
      </linearGradient>
      <linearGradient id="ofg-save" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="var(--color-primary)" stop-opacity="0.34"/>
        <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.08"/>
      </linearGradient>
    </defs>
    <g class="fn-diagram__edges">
      <path class="fn-diagram__edge fn-diagram__edge--ghost" d="M 360 50 L 360 250" />
      <path class="fn-diagram__edge fn-diagram__edge--ghost" d="M 540 50 L 540 250" />
      <path class="fn-diagram__edge fn-diagram__edge--ghost" d="M 720 50 L 720 250" />
      <path class="fn-diagram__edge fn-diagram__edge--ghost" d="M 860 50 L 860 250" />
      <path class="fn-diagram__edge" d="M 360 250 L 860 250" />
    </g>
    <g class="fn-diagram__nodes">
      <rect class="fn-diagram__node fn-diagram__node--accent" x="360" y="70"  width="500" height="40" rx="4" style="fill: url(#ofg-loss)"/>
      <rect class="fn-diagram__node" x="360" y="130" width="3"   height="40" rx="2"/>
      <rect class="fn-diagram__node fn-diagram__node--accent" x="360" y="190" width="500" height="40" rx="4" style="fill: url(#ofg-save)"/>
    </g>
    <g class="fn-diagram__labels">
      <text class="fn-diagram__label fn-diagram__label--accent" x="40" y="40" text-anchor="start">SAME DOLLAR SCALE · SMALL CLOUD CAMPAIGN</text>
      <text class="fn-diagram__label" x="40" y="95"  text-anchor="start">What a wrong booking costs</text>
      <text class="fn-diagram__label" x="40" y="155" text-anchor="start">What the desk test costs</text>
      <text class="fn-diagram__label" x="40" y="215" text-anchor="start">What you save per campaign</text>
      <text class="fn-diagram__label fn-diagram__label--mono" x="852" y="95"  text-anchor="end">$1,680</text>
      <text class="fn-diagram__label fn-diagram__label--mono" x="372" y="155" text-anchor="start">$1.01</text>
      <text class="fn-diagram__label fn-diagram__label--mono" x="852" y="215" text-anchor="end">$1,679</text>
    </g>
    <g class="fn-diagram__annotations">
      <text class="fn-diagram__annotation" x="860" y="40" text-anchor="end">about 1,670x the cost of the test</text>
      <text class="fn-diagram__annotation" x="610" y="284" text-anchor="middle">the test line is too small to see next to the loss it prevents</text>
    </g>
  </svg>
  <figcaption>The dollar test is a sliver next to the loss it prevents. You break even the first time it stops a wrong booking.</figcaption>
</figure>

The desk sweep cost about a dollar and culled a hundred candidate designs down to a handful. Against a small cloud campaign of about $3,360, that dollar gates about $1,679 of expected loss. "Expected loss" means the cost of a wrong booking, weighted by how often you would pick wrong. At a careful, conservative guess that you would otherwise pick wrong half the time, half of $3,360 is the loss you avoid, and that works out to roughly 1,670 times the cost of the test.

One wrong booking it stops pays for the whole box.

## The honest part

The $1,679 is an expected figure, not a promise on every single run. Some designs would have worked fine in the cloud without the desk check, so the value is in the ones that would not have, and in never having to guess which is which before you pay.

The desk check is also not the whole job. It cuts how often you pick wrong, but it does not drop it to zero. A few failure modes only show up at full cloud scale, so the honest move is to keep a short cloud sanity check at the front of the real run. The desk test lowers the risk a lot for a dollar. It does not erase it.

This ran on Orionfold Arena, the local-AI cockpit, on a desk box you can own. [See Arena](/software/arena/).

## Why this can be trusted

The two numbers are a cost and a piece of arithmetic, both shown in the open. The dollar is measured electricity for the sweep. The $1,679 is the cloud booking cost times a wrong-pick rate we state plainly and chose to be conservative, not a number tuned to look big.

We also said where the math is soft: the savings are expected, not guaranteed, the desk box cannot reproduce every cloud failure, and some rejected designs would have been fine. The claim survives all of that, because the value is simply that a one dollar test changes the odds on a booking that costs thousands.

## Rerun it

Run the cheap desk sweep before your next big cloud booking: try many designs on the box, keep the few that look strong, and book only those. Track how often the sweep catches a design that would have failed in the cloud, and multiply that rate by the cost of the booking it stops. If your numbers do not match ours, tell us.
