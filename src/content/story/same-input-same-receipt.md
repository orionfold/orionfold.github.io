---
title: Same input, same receipt
date: 2026-06-24
summary: A benchmark you cannot rerun is a rumor. Every Proof Receipt carries a config hash, twelve characters that reproduce the whole run to the byte. Here is what that small string actually buys you, and why I built the product around it.
hero: ../../assets/story/same-input-same-receipt/hero.jpeg
heroAlt: "Two-panel before-and-after comic. On the left a pair of hands holds a fading, crumbling grey screenshot of a chart; on the right the same hands hold a glowing printed receipt stamped with a star seal, a laptop beside it."
tags:
  - Proof
  - Trust
  - Local AI
---

Most AI benchmarks you read are screenshots. A number, a chart, a confident sentence about which model won. You cannot rerun them. You cannot change one input and watch the result move. You have to take the author's word for it, and the author had every reason to pick the run that looked best.

I did not want to ship another tool that produces screenshots. I wanted the opposite: a result you can pick up, rerun, and check. So every receipt Orionfold Proof writes carries a small string near the bottom, and that string is the whole idea.

## The twelve characters

Here is the line, from a real receipt, the four-billion-parameter model that [scored 18 out of 21 on my laptop](/story/a-4b-model-scored-18-out-of-21-on-my-laptop/):

```
Run id:      run_a9014d0871ab
Config hash: 50c38b0b7439   (identical inputs reproduce this hash)
Rerun:       POST /api/runs { "dataset_id": "advisor-curveball-v0.2",
             "candidate_ids": ["ollama:hf.co/Orionfold/Advisor-GGUF"], ... }
```

That `50c38b0b7439` is the **config hash**. It is computed from everything that determines the result: the dataset, the exact examples, the candidates, the prompts, the scoring rubric. Feed the same inputs in, and you get the same twelve characters back, every time. The receipt even tells you how to reproduce it. The `Rerun` line is the literal request that made it.

This is not a checksum of the *output*. It is a fingerprint of the *setup*. Which means two people on two different machines, who have never spoken, can run the same proof and confirm they ran the same thing, because the hash matches. The result becomes a fact you can check, not a claim you have to trust.

## Change one input, change the hash

The hash is only useful because it is honest about change. Touch anything that matters, and it moves.

Swap the model, and the hash changes: you are proving a different thing. Edit one example in the dataset, and the hash changes: your test is no longer the test you cited. Loosen the rubric threshold to make a model look better, and the hash changes, and anyone holding the old receipt can see you changed the question.

That last one is the quiet protection. The most common way benchmarks lie is not a fabricated number; it is a moved goalpost. Run it, do not like the result, nudge the threshold, run again, publish the good one. With a config hash, the nudge is visible. The receipt that says 86% at one hash and the receipt that says 86% at a *different* hash are not the same claim, and the difference is right there in twelve characters.

I caught this on myself last week. I ran the same governance bench on the same three models twice. The first time I forgot to give the models their instructions, and all three scored a dismal 1 out of 21, at hash `b6fa4ce299ef`. The second time I supplied the contract, and they scored 18, 17, and 16, at hash `88403c2fc4e7`. Two different hashes, two different results, no ambiguity about which run was which. The hash did not let me quietly pretend the first run never happened, or that the second one was the only one. If I had only shown you the good numbers, the hash on the receipt would not have matched the bench I claimed to run. The fingerprint keeps me honest even when I would rather not be.

::proof-cta

## Why a receipt, and not a dashboard

There is a deeper reason this matters, and it goes back to who the tool is for.

The person using Proof is usually deciding what to trust for someone else: a client, a team, a future version of themselves who will have forgotten the details. A dashboard is for watching. A receipt is for handing over. It is the artifact you attach to a proposal, the thing you can show a client under NDA without leaking a key, the record you can pull up in six months and rerun to check it still holds.

So the receipt is the product, and the hash is what makes it a receipt instead of a screenshot. It is signed. It is rerunnable. It records the failures alongside the wins, on purpose, because a record that only flatters is the one a careful buyer throws away.

## The honest part

A config hash does not make a result *correct*. It makes it *reproducible*, which is a different and smaller promise. A reproducible benchmark can still ask a bad question, score it with a bad rubric, or measure the wrong thing entirely. The hash only guarantees that if you run what I ran, you will see what I saw.

But that smaller promise is the one almost nobody else makes, and it is the floor everything else stands on. You cannot argue about whether a benchmark measures the right thing until you can agree on what was run. The hash gets you to that line. After that, the argument is about the question, which is the argument worth having.

That is the whole philosophy of the thing: prove it yourself, on your own machine, and rerun the proof anytime. You can see what it produces, including the receipts behind the other stories, at [orionfold.com/proof](https://orionfold.com/proof/).
