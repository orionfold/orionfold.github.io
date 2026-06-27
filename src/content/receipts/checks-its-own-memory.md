---
title: "A model that checks its own memory"
metric: "Knows what it knows"
claim: "Advisor checks the quality of its own memory before it answers, so a thin or stale note does not become a confident wrong answer."
dek: "Most models answer from whatever they pulled, good or bad. This one grades the notes first, and says so when they are weak."
date: 2026-06-26
tags: ["Trust"]
relatedTo: ["matrix:checks-its-own-memory-quality:advisor"]
source:
  - label: "Advisor: the model that earned it"
    href: "/software/advisor/"
verify: "Feed the model a question where the relevant note is thin or out of date. Check that it flags the weak memory rather than answering as if the note were solid."
---

The quiet failure in a memory-backed model is good answers from bad notes. This test is about catching that before it reaches you.

## The test we locked

When the model pulls notes from its memory to answer, does it grade how good those notes are first? A passing model treats a thin, stale, or off-topic note differently from a solid one, and tells you when the memory it found is weak.

## What happened

Advisor does this. Before it answers, it checks the quality of the memory it pulled. When the notes are weak, that shows in how it answers, rather than a thin note quietly turning into a confident wrong answer.

This is the star on the "checks its own memory quality" row. It is the only model in the matrix that earns it. The run lives on Advisor's page.

## The honest part

Self-checking is not the same as being right. A model can grade its memory well and still reason poorly from good notes. What this removes is one specific trap: the answer that sounds sure because the model never noticed the note behind it was bad.

## Rerun it

Feed the model a question where the relevant note is thin or out of date. Check that it flags the weak memory rather than answering as if the note were solid.
