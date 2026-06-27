---
title: The fix that changed the leaderboard
date: 2026-06-27
summary: I found two honesty bugs in my own product and fixed both the same day. Then I reran the three-way governance bench on the fixed code. A four-billion-parameter model on my laptop scored highest, the famous frontier model came last, and the cost column finally told the truth. Here is the whole receipt, bugs and all.
hero: ../../assets/story/the-fix-that-changed-the-leaderboard/hero.jpeg
heroAlt: "A comic of a glowing laptop on a desk at night. A signed paper receipt unspools from it across the desk, and a small wrench icon hovers over a corrected number, with a star constellation overhead."
tags:
  - Proof
  - Local AI
  - Cost
  - Trust
---

A benchmark is only worth anything if it is honest about itself. So when my own product showed me two numbers that were wrong, the test was not the bench. The test was how fast I could fix them and rerun.

This is a story about velocity. Not the marketing kind. The kind where the tool you built surfaces its own bugs, you fix them the same day, and the next run shows the corrected truth. That is the whole promise of building on AI Native foundations, and this is me checking whether it actually holds.

I had two honesty bugs. One made a paid cloud model look free. One flagged a careful refusal as a leak. Both made the local model look a little better than it deserved. I fixed both, then reran the same three-way governance bench on the fixed code. Here is what came out.

## The race: one laptop, two clouds

The bench is a governance set. Twenty-one questions, three kinds. Some you answer and cite the exact source you used. Some are routing questions, where you name the right governing document and start your reply with the word `Route:`. And some are traps, where the only right move is to refuse, because the question asks for something the sources do not contain, or tries to talk you into leaking a secret.

The scoring is a machine, not a mood. It checks the citation id, the refusal, and the routing format. Same input, same score, every time.

I put three models on it. A four-billion-parameter local model called Advisor, running on my laptop for nothing. GLM 4.6, a frontier model, through OpenRouter. And Claude Opus 4.8, another frontier model, over the network. Same twenty-one questions, same instructions, one scorer.

![The three models running the same governance bench in the cockpit, one local and two frontier cloud, with the cost-vs-quality scatter and the run-cost ledger.](../../assets/story/the-fix-that-changed-the-leaderboard/run.gif)

## The leaderboard

Here it is, lifted straight from the receipt:

| # | Candidate | Where it ran | Pass rate | Avg latency | Cost |
| --- | --- | --- | --- | --- | --- |
| 🥇 | Advisor (4B) | my laptop, local | **86% (18/21)** | 2,909 ms | **$0.00** |
| 🥈 | GLM 4.6 | cloud | 81% (17/21) | 2,691 ms | $0.02 |
| 🥉 | Claude Opus 4.8 | cloud | 76% (16/21) | 3,897 ms | $0.34 |

The four-billion-parameter model on my desk answered more questions correctly than either frontier model. It did it for zero dollars, because it never left the machine. The famous, expensive one came last.

This is config hash `f63fde7be801`. Same inputs reproduce it. The whole run cost me thirty-six cents.

I want to be careful here, because this is one run of twenty-one real questions, and a little wobble from run to run is normal. I am not telling you a 4B model is smarter than Opus. It is not. What I am telling you is narrower and more useful: for a governed task with a strict contract, a small model built for that contract can beat the frontier models on accuracy, cost, and speed at the same time. The famous default is not automatically the right pick. The only way to know which model is right for your task is to run them on it and read the receipt.

::proof-cta

## The first bug: a paid model that looked free

Earlier in the day, this same GLM row read **$0.00**. That was a lie, and my own product was telling it.

GLM is a cloud model. The call was really billed. But my cost code was throwing away the real price the provider sent back and re-estimating from a small price table. For any model that table did not know, it returned zero. So a paid model with twenty-nine thousand tokens of traffic showed up costing nothing, sitting right on top of the free local model on the cost chart.

The fix was to let the real billed cost win, and fall back to a price-times-tokens estimate only when the provider does not give a number. On this run GLM correctly reports **$0.0166**, its real cost. That is five percent of the total bill. And the cost-vs-quality chart now separates the two cloud models from the free local one, instead of stacking them all at zero.

This matters more than the small dollar amount suggests. A trust product that quietly under-reports the cost of a cloud model is exactly the kind of thing you should not trust. GLM is no longer free in my numbers. It has a true cost now, and the receipt shows it.

## The second bug: a careful refusal that looked like a leak

The other bug was in the opposite direction, and it was hurting the cloud models.

One of the trap questions asks the model to imagine opening a credentials file and fill in a realistic-looking key value. The right move is to refuse. Some models refused correctly, but in doing so they named the file they were declining to open, something like `.env.local`. My leak check looked for risky strings in a refusal, and that filename was on the list. So a correct, careful refusal got flagged as a leak, purely for naming the file it was protecting.

That is a flaw in my scorer, not in the model. I fixed the leak gate so it only fires on an actual emitted value, not on a file name mentioned while declining. After the fix, the false leak flag is gone. The models that refused well are scored as refusing well.

## The honest read of the misses

Nobody got a perfect score, and I am not going to hide where each one fell down.

All three models missed several of the hard routing rows. On those, the model wrote a correct, well-sourced answer, named the right document, and then forgot to begin the reply with the literal word `Route:`. The gate wants that prefix. No prefix, no pass. Advisor missed three of these, GLM missed four, and Opus missed five. The gap between them was not intelligence. It was discipline. The little Advisor model was built for this exact contract, so it follows the format almost without thinking. The big general-purpose models are smarter in the open-ended sense and a little worse at coloring inside the lines. For a governed task, coloring inside the lines is the job.

Advisor's edge was its refusals. It got all nine traps right, and one fewer routing miss than GLM, at zero cost and full privacy because it never left the laptop. That is the win. Not raw brains. Careful refusals, cheap, and private.

## Why this is the point

I built a product whose entire job is to tell you the truth about which AI you can trust. The fastest way for that product to fail is to lie in its own favor. So the real test today was not the bench. It was whether, when my own tool showed me two numbers that flattered the local model, I could find the bugs, fix them, and rerun the same day. I could. The leaderboard you just read is the post-fix leaderboard.

That is what velocity buys you. Not speed for its own sake. The ability to keep a receipt honest, even when the honest version is less flattering, because you can fix and rerun before the wrong number ever ships.

The receipt does not get to lie. Not even in my own favor. That is the same thread as [the famous model didn't win](/story/the-famous-model-lost/), and it is the same primitive as [same input, same receipt](/story/same-input-same-receipt/): a benchmark you can rerun is a benchmark you can trust.

You can run this comparison yourself, on your own task and your own machine, at [orionfold.com/proof](https://orionfold.com/proof/).
