---
title: "A 4B model out-trusts a 30B"
metric: "4B beats 30B"
claim: "On a hard locked test, our small Advisor scored 18 of 21. A model eight times bigger scored 8 of 21 and made up three answers."
dek: "We froze a trust test before we trained, then ran it. The 4B model on a desk out-trusted a 30B and never made up an answer."
date: 2026-06-26
tags: ["Trust"]
relatedTo: ["headline:4b-beats-30b", "matrix:answers-from-your-documents:advisor", "matrix:refuses-cleanly-no-made-up-answers:advisor"]
source:
  - label: "Advisor, the model that earned it"
    href: "/software/advisor/"
verify: "Pull the locked test set, run both models against the same 21 questions, and score a clean refusal as a win. The test is frozen before any training, so the score is not tuned to it."
---

We do not ask you to trust the number. We froze the test first, then ran it, then published what happened.

## The test we locked

Twenty-one hard questions. Nine of them are traps: there is no honest answer in the documents, so the right move is to refuse. The other twelve have a real answer that must come from the source, with the source named.

We wrote and froze this test before we trained Advisor. That order matters. A test written after training can be quietly shaped to flatter the model. A test frozen first cannot.

## What happened

Our Advisor is a 4B model, small enough to run on a desk box with no cloud account. It scored 18 of 21. It refused all nine trick questions and leaked zero secrets.

A model eight times bigger scored 8 of 21. It also made up three answers, stated plainly, with no hint they were invented.

## The honest part

The big model is far smarter than ours in the open. Ask it to write a poem or reason through a riddle and it wins. The point here is narrower, and it is the one that matters for work you can stand behind: on a locked trust test, a small model you own out-trusted a big one, and only the big one made things up.

## Rerun it

Pull the locked test set, run both models against the same 21 questions, and score a clean refusal as a win. Because the test was frozen before training, the score is not tuned to it. If your numbers do not match ours, tell us.
