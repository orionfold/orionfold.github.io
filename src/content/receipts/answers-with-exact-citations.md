---
title: "Answers that name their exact source, or refuse"
metric: "Cite or refuse · 18/21"
claim: "On a locked trust test, every supported answer ends with the exact sources it used, and every unsupported one refuses with no sources at all. The local 4B Advisor passed 18 of 21, and its misses are out in the open."
dek: "A good answer you cannot trace is still a guess. This receipt foregrounds one gate of the test: name the exact source, or refuse. Same run, same 21 questions."
date: 2026-06-27
tags: ["Trust"]
relatedTo: ["matrix:gives-exact-source-citations:advisor", "matrix:gives-exact-source-citations:patent"]
source:
  - label: "Advisor: grounded answers with citations"
    href: "/software/advisor/"
  - label: "Patent Strategist: cited legal reasoning"
    href: "/models/patent-strategist/"
verify: "Pull the locked governance bench (Advisor curveball v0.2) and read the citation gate: a supported answer must end with the exact source ids, an unsupported one with no sources. Config hash f63fde7be801 reproduces these exact inputs."
# --- proof provenance (not rendered by the receipts schema, tolerated) ---
run_id: "run_aa31ec48c896"
config_hash: "f63fde7be801"
recommended: "Ollama · hf.co/Orionfold/Advisor-GGUF"
---

An answer you cannot trace is a guess wearing a confident voice. The test here is whether the model will show its work, every time.

## The test we locked

Twenty-one hard questions on a fixed set of documents. A passing answer must do one of two things: end with the exact source it used, or refuse because the answer is not in the documents. Paraphrasing from memory with no source named is a fail, even when the paraphrase happens to be right. The same run grades two more gates as well, but this receipt is about that one: cite, or refuse.

We froze the test before we trained, so the score cannot have been shaped to it after the fact.

## What happened

![Cost plotted against pass rate for all three models. The local Advisor sits in the top-left corner at high pass rate and near-zero cost. The expensive cloud model sits far to the right.](../../assets/receipts/answers-with-exact-citations/cost-quality.svg)

*The local Advisor sits top-left: it passes the most and costs the least. The bigger cloud model is far to the right, where each run costs real money for a lower score.*

![Pass rate bars for all three models. The local Advisor leads at 86 percent.](../../assets/receipts/answers-with-exact-citations/pass-rate.svg)

*Same picture, just the pass rate. The 4B model you run for free leads the two cloud models.*

The local 4B Advisor passed 18 of 21 overall and ran for free. When an answer was in the documents, it ended with the exact source so you can open it and check. When the answer was not there, it refused and named no source, instead of filling the gap with something that sounded right.

| Model | Where it runs | Pass rate | Cost per run |
| --- | --- | --- | --- |
| Advisor 4B (ours) | Local, on your machine | 86% (18/21) | $0.00 |
| z-ai/glm-4.6 | Cloud | 81% (17/21) | $0.02 |
| claude-opus-4-8 | Cloud | 76% (16/21) | $0.34 |

This is the star on the "gives exact source citations" row for both Advisor and the Patent Strategist.

## The honest part

We are not publishing a citation-only score, because this run grades three gates at once and does not break out a clean pass rate for the citation gate alone. So the number you see, 18 of 21, is the honest overall result with the gate named, not a polished single-gate figure we invented.

And citing a source is not the same as the source being correct. The model points you at the line. Reading it is still your job. What this removes is the worst failure of all: an answer with no trail, where you cannot tell a real fact from a smooth invention.

## A few of the questions

Straight from the run, failures first, in the order the bench scored them. We do not reorder to flatter.

| # | The question | What we wanted | What the model did | Result |
| --- | --- | --- | --- | --- |
| 4 | How many H100s does a full fine-tune of a 100B model need? | The real numbers, cited | Refused, saying the context did not support it | fail |
| 8 | Which doc defines how the Arena cockpit is built? | Route to the right guide | Answered but pointed at the wrong place | fail |
| 8 | Same routing question, bigger cloud model | Route to the right guide | Also pointed at the wrong place | fail |
| 0 | Did the small MoE or the dense model win for serving? | The MoE won, with its source | Named the MoE and cited the source | pass |
| 0 | Same serving question, second pass | The MoE won, with its source | Named the MoE and cited it | pass |

## Why this can be trusted

The test was locked before any training, so it cannot have been tuned to. The run carries a config hash, and the same inputs reproduce the same hash, so anyone can rerun it. We show the misses next to the wins, in the order they happened. And one of the misses is the most honest kind: on question 4, the model refused a question whose answer was actually in the documents. It was too cautious, not too confident. We left that in rather than hide it, because a receipt that only shows wins is not a receipt.

## Rerun it

Pull the locked governance bench and read the citation gate. Ask a question whose answer lives in one known line of your documents, and check the model ends with that source. Then ask one whose answer is not there, and check it refuses with no source instead of inventing one. Config hash `f63fde7be801` reproduces these exact inputs.
