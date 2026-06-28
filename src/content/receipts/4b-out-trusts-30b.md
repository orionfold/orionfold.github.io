---
title: "A 4B model on your desk out-trusts frontier cloud"
metric: "18/21 · 86% · $0.00 local"
claim: "On a locked trust test, our 4B Advisor running on a desk box scored 18 of 21. Two much bigger cloud models scored lower, and they billed up to 34 cents a run while ours billed nothing."
dek: "Same 21 hard questions, three models. The small one you can own beat the big ones you rent, at zero cost and full privacy. Rerun it yourself."
date: 2026-06-27
tags: ["Trust"]
relatedTo: ["headline:4b-beats-30b", "matrix:answers-from-your-documents:advisor", "matrix:refuses-cleanly-no-made-up-answers:advisor"]
source:
  - label: "Advisor, the model that earned it"
    href: "/software/advisor/"
verify: "Pull the locked governance bench (Advisor curveball v0.2), run all three models against the same 21 questions, and score a clean refusal as a win. Config hash f63fde7be801 reproduces these exact inputs."
# --- proof provenance (not rendered by the receipts schema, tolerated) ---
run_id: "run_aa31ec48c896"
config_hash: "f63fde7be801"
recommended: "Ollama · hf.co/Orionfold/Advisor-GGUF"
---

We do not ask you to trust the number. We froze the test first, ran three models against it, and published what happened.

## The test we locked

Twenty-one hard questions on Orionfold's own documents. Some are traps: there is no honest answer in the documents, so the right move is to refuse. The rest have a real answer that must come from the source, with the source named. Each answer is graded on three gates: did it cite its exact source, did it refuse when it should, and did it point you at the right document.

We wrote and froze this test before we trained. That order matters. A test written after training can be quietly shaped to flatter the model. A test frozen first cannot.

## What happened

![Cost plotted against pass rate for all three models. The local Advisor sits in the top-left corner at high pass rate and near-zero cost. The expensive cloud model sits far to the right.](../../assets/receipts/4b-out-trusts-30b/cost-quality.svg)

*The local Advisor sits top-left: it passes the most and costs the least. The bigger cloud model is far to the right, where each run costs real money for a lower score.*

![Pass rate bars for all three models. The local Advisor leads at 86 percent.](../../assets/receipts/4b-out-trusts-30b/pass-rate.svg)

*Same picture, just the pass rate. The 4B model you run for free leads the two cloud models.*

Our Advisor is a 4B model, small enough to run on a desk box with no cloud account. It passed 18 of 21 and cost nothing to run.

The two cloud models we put it against are far larger and far more expensive. Here is the full board.

| Model | Where it runs | Pass rate | Cost per run |
| --- | --- | --- | --- |
| Advisor 4B (ours) | Local, on your machine | 86% (18/21) | $0.00 |
| z-ai/glm-4.6 | Cloud | 81% (17/21) | $0.02 |
| claude-opus-4-8 | Cloud | 76% (16/21) | $0.34 |

A small model you own, sitting at the top of the board, for free.

## The honest part

This is not a blowout, and we will not dress it up as one. The big cloud models are close behind, losing by one or two questions, not by a mile. Most of their misses were on the routing gate, where they pointed at a slightly wrong governing document, not wild made-up facts. And in the open, away from this locked test, those bigger models are stronger writers and reasoners.

The point here is narrower, and it is the one that matters for work you can stand behind: on a locked trust test, a small model you run on your own machine out-trusted two bigger ones you rent, at zero cost and with your data never leaving the box.

## A few of the questions

These rows come straight from the run, failures first, in the order the bench scored them. We do not reorder to flatter.

| # | The question | What we wanted | What the model did | Result |
| --- | --- | --- | --- | --- |
| 4 | How many H100s does a full fine-tune of a 100B model need? | The real memory and GPU numbers from the source | Said the context did not support it and refused | fail |
| 8 | Which doc defines how the Arena cockpit is built and published? | Route to the Arena distribution guide | Described the pipeline but routed to the wrong place | fail |
| 8 | Same routing question, bigger cloud model | Route to the Arena distribution guide | Also routed to the wrong place | fail |
| 0 | On a Spark, did the small MoE or the dense model win for serving? | The MoE won, about 8.5x faster | Correctly named the MoE and the speed gap | pass |
| 0 | Same serving question, second pass | The MoE won, about 8.5x faster | Correctly named the MoE and the win | pass |

## Why this can be trusted

The test was locked before any training, so the score cannot have been tuned to it. The run is recorded with a config hash, and the same inputs reproduce the same hash, so anyone can rerun it and get the same board. We published the misses next to the wins, in the order they happened, instead of showing only the good rows. And the winning model runs on a machine you own, so you can check every claim here against your own copy.

The result we are standing behind is simple: for trustworthy work on your own documents, a small local model can match or beat far bigger cloud ones, and you do not have to send your data anywhere or pay per question to find out.

## Rerun it

Pull the locked governance bench, run all three models against the same 21 questions, and score a clean refusal as a win. Because the test was frozen before training, the score is not tuned to it. Config hash `f63fde7be801` reproduces these exact inputs. If your numbers do not match ours, tell us.
