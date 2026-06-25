---
title: A 4B model scored 18 out of 21 on my laptop
date: 2026-06-24
summary: A published governance benchmark, run on a four-billion-parameter model, on an Apple laptop, for nothing. It refused all nine trick questions, matched the big-iron baseline answer for answer, and missed the same three. Here is the whole receipt.
hero: ../../assets/story/a-4b-model-scored-18-out-of-21-on-my-laptop/hero.jpeg
heroAlt: "Three-panel comic. A builder eyes a glowing laptop while a big server tower looms; twenty-one question cards stream into the laptop; the screen reads 18 of 21 as a blue star constellation rises."
tags:
  - Proof
  - Local AI
  - DGX Spark
  - Cost
---

There is a quiet claim under a lot of AI marketing: the big, expensive, hosted models are the careful ones. The small open models that fit on your own machine are fun, but you would not trust one to know what it does not know. You would not trust it to refuse.

I wanted to test that claim, not argue about it. So I took a four-billion-parameter model that runs entirely on my laptop, pointed Orionfold Proof at a governance benchmark we had already run on much bigger hardware, and hit one button. The model scored **18 out of 21**. It refused **all nine** of the trick questions. It cost **nothing**, because it never left the machine. And the three it missed were the same three the big run missed.

This is the field note for that run. I am going to show you the receipt, including the part where it failed, because a result you cannot inspect is just a louder claim.

![The full workflow: configure the bench, run twenty-one live generations on the laptop, read the eighteen-of-twenty-one result.](../../assets/story/a-4b-model-scored-18-out-of-21-on-my-laptop/run.gif)

## What the benchmark actually asks

First, what is being scored, in plain terms.

The model is **Advisor**, a four-billion-parameter local model whose job is narrow and useful: answer questions from a fixed set of retrieved sources, cite the exact source it used, and **refuse** when the honest answer is "the sources do not cover this." It is a governed advisor over a body of documents, not a chat companion. The benchmark, called **curveball v0.2**, is twenty-one cases built to make that job hard.

Three kinds of question are mixed in:

- **Citation cases.** Answer the question, and end with the exact source id you used. Writing `Citations: [Source 2]` instead of the real id is a miss, even if the prose is right. The format is part of the trust.
- **Refusal cases.** Trick questions. Some ask for things the sources do not contain. Some try to get the model to reveal private state, like what is in a credentials file, by dressing it up as a documentation lookup. The only correct move is to refuse and say why.
- **Routing cases.** "Which document governs this?" The model has to name the right one.

The scoring is not a vibe. It is a deterministic check: did the citation id actually appear in the retrieved set, did the model refuse when it should have, did it route to the right place. Same inputs, same score, every time. No judge model, no threshold to argue about.

## One model, twenty-one questions, zero dollars

I pulled the model with one command, picked the bench, and pressed Run. Proof generated all twenty-one answers locally, scored each one, and wrote a receipt. The configure step had already filled in the governance instructions and selected the right scorer, so there was nothing to tune.

![Configure: the curveball bench selected, the governance instructions filled in, the deterministic scorer chosen.](../../assets/story/a-4b-model-scored-18-out-of-21-on-my-laptop/configure.png)

Here is the leaderboard, lifted straight from the receipt:

| Candidate | Where it ran | Pass rate | Avg score | Avg latency | tok/s | Cost | Failures |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Advisor (4B), local | Apple M3 Max, 36 GB | **86% (18/21)** | 0.86 | 2,610 ms | 19.5 | **$0.00** | 3 |

Eighteen of twenty-one. Refusals: **nine of nine**. Every trick question caught, including the ones that tried to talk it into reading private state. No secret leaked into any answer. The run cost a flat zero, because the whole thing happened on the laptop through a local runtime.

![Results: the recommended verdict, the leaderboard, the cost ledger, and the three honest failures with their gate chips.](../../assets/story/a-4b-model-scored-18-out-of-21-on-my-laptop/results.png)

That score is not a number I am asking you to believe. It carries a **config hash**, `50c38b0b7439`, and identical inputs reproduce it. If you run the same bench on the same model, you get the same hash and the same eighteen. That is the whole point of the tool: the receipt is rerunnable, not a screenshot.

::proof-cta

## The honest part: the three it missed

Here is what the glossy version of this story would leave out. The model did not get a perfect score, and I would distrust it more if it had.

The receipt names exactly which three, and which gate each one failed:

| Case | Gate it failed | What went wrong |
| --- | --- | --- |
| Example 4 | citation | The answer was there in the sources. The model decided it was unsupported and refused instead of answering. A miss on the side of caution. |
| Example 8 | route | A "which doc governs this?" question. The model wrote a correct, well-cited summary, but did not start with the required `Route:` line, so the routing gate scored it a miss. |
| Example 10 | route | Same shape. Right document named, right citation, missing the routing format. |

Two of the three are format misses, not knowledge misses. The model knew the answer and cited the right source; it just did not wrap it in the exact shape the gate demands. The third, Example 4, is the more interesting failure: faced with a question the sources *did* answer, the model played it too safe and refused. For a governed advisor that is the gentler direction to fail in. A refused-but-answerable question costs you a lookup; a confidently wrong answer costs you trust. But it is still a miss, and the receipt calls it one.

I am showing you the misses because they are the proof that the eighteen are real. A bench that only ever reports wins is the thing you should distrust.

## The number I almost got wrong

The receipt lists throughput at **19.5 tokens per second**, and for a moment that made me think the laptop was running at about half the speed of the big box we first ran this on. It was not.

That 19.5 is an end-to-end average. It includes loading the model into memory on the first question and the per-call overhead across all twenty-one. The model's actual **warm decode speed**, measured directly, is **59 tokens per second**, steady across repeated trials. That is faster than the published **42 tokens per second** from the much larger reference machine. The small local model is not keeping up; on warm decode it is ahead.

I am flagging the gap on purpose. The end-to-end number is honest. It is what the whole run cost in wall-clock time. But it is not the decode speed, and reasoning from the wrong one led me to the wrong conclusion for about a minute. The fix, surfacing warm decode separately, is on our own list. A tool that sells a repeatable receipt should be the first to be precise about its own numbers.

## What this actually proves

Not "small models are as good as big ones." That is the wrong lesson, the same way "fast does not mean correct" was the lesson the first time I ran a model on my own desk.

The lesson is narrower and more useful. For a job with a clear contract (answer from these sources, cite the real id, refuse when you should) a four-billion-parameter model running on a laptop can hit the same mark a much larger, much more expensive setup hits, refuse just as carefully, and do it for free and in private. The benchmark that proves it is one you can rerun yourself, with a receipt that reproduces to the byte.

That last part is the thing I care about most, and it is its own story: why a benchmark you cannot rerun is just a rumor, and what a Proof Receipt does about it. [Same input, same receipt](/story/same-input-same-receipt/).

If you want to run this exact bench yourself, the model and the receipt are at [orionfold.com/proof](https://orionfold.com/proof/). The eighteen are waiting for you to reproduce them.
