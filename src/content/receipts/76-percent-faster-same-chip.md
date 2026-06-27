---
title: "The same model, 76% faster, same chip"
metric: "76% faster"
claim: "A 4-bit mode made the same model run 76% faster, 38.8 words a second up from 22.1, on a fraction of the memory."
dek: "No new chip, no new model. Just a leaner 4-bit mode, and the same model typed 76% faster while using far less memory."
date: 2026-06-26
tags: ["Speed"]
relatedTo: ["headline:76-faster"]
source:
  - label: "The desk box we measured on"
    href: "/dgx-spark/"
verify: "Run the same model on the same box twice: once in the default mode, once in the 4-bit mode. Time the words per second on both and read the memory each one holds."
---

We did not swap the chip or the model. We changed how the model is stored, and it got much faster.

## The test we locked

Take one model, one desk box. Run it two ways: the convenient default, then a leaner 4-bit mode. Measure the same two things each time, raw typing speed in words a second and how much memory the model holds.

## What happened

The default ran at 22.1 words a second. The 4-bit mode ran the same model at 38.8 words a second. That is 76% faster, on the same chip, with no change to the answers' job.

It also used a fraction of the memory. Less memory held by the model means more room for everything else the one box has to do at the same time.

## The honest part

A 4-bit mode trims some precision to win the speed and the memory. For the work we run it on, the trade holds and the answers stay good. That is a thing to check for your own task, not assume. The win here is that the lever exists at all, and it is free.

## Rerun it

Run the same model on the same box twice, once in the default mode and once in the 4-bit mode. Time the words per second on both and read the memory each one holds.
