---
title: The Faster Model Was the Bigger One
date: 2026-08-24
summary: "I picked a small local model for weeks because it looked faster. One measurement on my own Mac proved the larger model was quicker."
hero: ../../assets/story/the-fastest-model-on-your-mac/hero.jpg
heroAlt: "An engineer times two model engines on the same test rig as the larger one races ahead."
tags:
  - Orionfold Flow
  - AI-native work
  - Building in public
---

I had been running the wrong model for weeks, and I felt clever about it the whole time.

I kept several models on my Mac. For ordinary document work, I picked the smaller file. Small model, small wait. Big models belong on big machines. The rule felt so obvious that I never measured it.

Then I ran the same work through a much larger model. The answer began arriving before I had finished sitting back in my chair.

I ran it again because it could not be right.

It was right.

On one M3 Max, on the same day, through the same runtime, the 20.4 GB model reached its first word in 4.5 seconds and read at 84 words per second. The 8.5 GB model took 10.2 seconds to begin and read at 28 words per second.

The file nearly two and a half times larger started 2.3 times sooner and ran three times faster.

My sensible shortcut had been the long way around.

The strange part was not that I had guessed wrong. It was how little evidence I had needed to feel certain. File size was visible. The model names looked technical. The conclusion arrived before the work did.

## File size was answering the wrong question

The larger model did not read all 20.4 GB for every word. It was built as a collection of specialists and activated only a small set at a time.

Size on disk tells you how much room a model occupies. It does not tell you how much work the machine performs for each word.

That difference is easy to understand after someone points it out. Before the measurement, I had treated the size as if it described the experience. A tidy number had become a proxy for the thing I actually cared about: how long I would wait.

I went looking for a better answer and found plenty of leaderboards. They had careful tables, precise figures, and models ranked from fastest to slowest. Then I noticed what made every one of them incomplete for my decision.

The measurements came from computers I did not own.

A model benchmark is a fact about a model and a machine together. Remove the machine from the label and the number looks universal when it is not. Memory bandwidth, available memory, runtime, prompt length, and model format all matter.

The same model can feel immediate on one Mac and impractical on another. A benchmark gathered elsewhere may be excellent evidence about that machine. It is not a measurement of mine.

I could solve this with a stopwatch and an afternoon. A person trying to choose a model for work should not need either. The app should measure the models they have on the Mac they own.

## Measure here

Flow's Benchmarks screen has no shared leaderboard. It ranks the local models available to this Mac from measurements made on this Mac.

The machine description sits beside the results because the machine is part of every result. A measurement carries its date. A model Flow can see but cannot run stays visible with the reason.

Nothing measures itself. Loading a model takes time, memory, and power, so Measure is an action you choose. The screen does not turn an idle moment into a benchmark simply because more data would look useful.

The default ranking begins with time to first word because that is the wait you feel after pressing a button. Reading speed remains visible for longer responses. I had initially been drawn to reading speed because it is the number people quote. For short document work, the silent wait before anything appears often matters more.

The prompt length belongs beside that measurement too. A waiting time without the work that produced it is another number detached from its conditions.

Flow may estimate reading speed from the model's active size and this Mac's observed throughput. It never estimates time to first word. When the arithmetic runs beyond the evidence, Flow shows no estimate rather than inventing a tidy ceiling.

That happened during development. One calculation for a very small model produced a speed that the formula could express but the evidence could not support. Capping it at a plausible number would have looked polished. Leaving it unavailable was more honest.

Memory fit follows the same restraint. Different runtimes account for memory differently, so Flow reports a useful verdict rather than pretending unlike byte counts are directly comparable.

Those refusals matter more than another decimal place. A benchmark earns trust by showing where measurement ends.

## The score shows its work

Different jobs need different tradeoffs. A quick rewrite benefits from a fast first word. A long document may need more room.

Flow offers three named views: Responsive, Balanced, and Roomy. Each view prints its weights and applies them to the measured models on this Mac.

Open a row and the score breaks into its parts. The total is the sum of the values on screen. There is no separate stored score that can drift from its explanation.

That matters because a single ranking invites a single interpretation: first is best. The measurements support a narrower conclusion. One model may begin fastest. Another may read fastest. A third may leave the most memory available. The active weighting decides which tradeoff rises to the top, and the arithmetic remains visible.

The score is relative to the models in that list. It is not a portable rating and not a claim about answer quality. The screen says what is not ranked: instruction-following.

That last line keeps the benchmark honest. Flow can measure wait, reading speed, and fit. It cannot turn those numbers into a verdict on whether a model understood your work.

The distinction sounds obvious, yet product screens collapse unlike facts all the time. A fast model becomes “best.” A large context becomes “smart.” A score built for one machine becomes a property of the model itself. Each shortcut makes the interface easier to read and the decision harder to defend.

I wanted the screen to reduce uncertainty without manufacturing certainty.

## Knowing is not choosing

The measurement changed which model I reached for. It did not remove the need to choose.

If I had to inspect a benchmark before every AI action, the screen would become another place where useful information goes to be ignored. So Flow can use measured facts inside rules you write.

“Fastest measured on this Mac” can be a routing preference because it is based on a measurement you can inspect. With no measurement, the rule says none exists. It does not substitute a default order and call it speed.

Other rules can prefer work that stays on the Mac, a model that can hold the whole document, or a route under a chosen cost. Rules decide in order. The rule that decided is named wherever the route is shown.

There is no learning hidden behind that behavior. Flow does not watch what I pick and gradually replace my stated preference with a prediction about me. The rulebook applies in the order I wrote it. Pinning a model turns the rulebook off and says so.

The model remains my choice, expressed through an ordered rule or a model I pin. Measurement informs the choice. It does not make the decision mysterious.

This is where the benchmark became more than a table. It changed a guess I repeated every day into a preference the software could execute and explain.

## The useful answer

I had trusted file size because it was visible. I had trusted internet tables because they looked precise. Both were easier than measuring the machine in front of me, and both sent me to the slower model.

The confident answer arrived free. The useful answer cost one measurement.

That is a small product lesson and a larger one. Numbers do not become evidence merely because they are precise. A useful measurement carries its conditions with it, shows what it did not measure, and stays close to the decision it informs.

The faster model was the bigger one. On a different Mac, it may not be.

That is exactly why Flow measures here.
