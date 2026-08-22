---
title: The Fastest Model on Your Mac Is Probably Not the One You Picked
date: 2026-08-24
summary: "I trusted a benchmark measured on a machine I do not own, and picked the wrong model for a month. So Flow now measures the models you have, on the Mac you are sitting at."
tags:
  - Orionfold Flow
  - AI-native work
  - Building in public
---

I had been running the wrong model for weeks, and I felt clever about it the whole time.

I had a folder of models on my Mac. When I needed one for a document I picked the small one. Small file, small memory, small wait. Big models are for big machines, and a laptop is not a big machine. Everybody knows this. I knew it so well I never checked.

Then one afternoon I ran the same piece of work through a much larger model, mostly by accident, and the answer started arriving before I had finished sitting back in my chair. I ran it again, because that could not be right. It was right.

On my Mac, on the same day, through the same runtime, here is what the two models actually did:

| Model | Size on disk | Time to first word | Reading speed |
| --- | --- | --- | --- |
| `qwen3.5-35b-a3b-4bit` | 20.4 GB | 4.5 s | 84 words/s |
| `ternary-bonsai-27b-mlx-2bit` | 8.5 GB | 10.2 s | 28 words/s |

The file nearly two and a half times bigger on disk reached its first word 2.3 times quicker, and produced words three times faster once it got going. The small one, the sensible one, the one I had been picking on purpose for weeks, was the slow one.

It felt like finding out the shortcut you take every morning is the long way round, and always was, and nobody was hiding it from you. You just never measured.

## Why bigger can be quicker

The reason is not magic, and it is the whole argument for measuring instead of guessing.

Some models are built as one solid block. To write a single word, the machine reads the entire block. Big block, long read, slow word.

The larger model here is built as a set of specialists, 256 of them, and for any given word it wakes only 8. So although the file is huge, the part it reads per word is small. Size on disk tells you how much room a model takes up, not how much of itself it reads per word. Only the second is the thing you sit and wait for.

A leaderboard sorted by file size would put those two models in exactly the wrong order. Mine did. My leaderboard was in my head, it had one rule, and the rule was wrong.

## The benchmark problem

So I went looking for a leaderboard that was not in my head.

There are plenty. People publish local model speeds constantly, in blog posts and forum threads and tidy comparison tables. I read a lot of them. Then I noticed what made all of them useless to me.

Every single number was measured on somebody else's computer.

That sounds obvious written down. It did not feel obvious while reading. A number in a table looks like a fact about the model. It is not. It is a fact about the model *and* the machine it ran on, welded together, with the machine half quietly left off the label.

That half matters enormously. The speed a model reads at is limited by how fast the chip pulls data out of memory, and that is a property of the chip. The same model can be comfortable on one Mac and unusable on another, and no amount of reading somebody else's table tells you which one you own.

I solved it for myself with a stopwatch and an afternoon. But I kept thinking about the person who does not have an afternoon and does not think of themselves as somebody who benchmarks things, who will make the same wrong guess I did because it is the sensible-sounding one. That person should not have to run a research project to learn which of their own models is fastest. The app should just tell them.

## What I built instead

Flow now has a Benchmarks screen. It does one thing: it measures the models you already have, on the Mac you are sitting at, and ranks them for that Mac.

It fetches nothing. There is no central feed of numbers gathered from other people's hardware. Every figure was either measured on your machine or worked out from your own model files. That is the entire supply chain, and it is short on purpose.

Beside the title sits a strip describing the machine. On mine: Apple M3 Max, 36 GB memory, 30 GPU cores, 10 and 4 CPU cores, 192 GB free of 926 GB. All read from the Mac, and anything the Mac does not report is absent rather than invented. A ranking of models means nothing without the hardware it was measured on, so you see what the ranking is *of* before you read it.

## Ranking by the thing you actually feel

The default sort is time to first word. How long you sit there after you press the button, before anything appears.

I got that wrong first. My early version sorted by reading speed, the more impressive-sounding number and the one everybody quotes. Then I did the arithmetic on a realistic piece of work and found the wait before the first word is roughly 50 times larger than the gap between any two models' reading speeds. Sorting by reading speed sorts by the number you barely notice and hides the one you sit through. So first word leads, with reading speed beside it, because that matters once the answer is long. The prompt length is stated on screen too. A waiting time without its length is a claim nobody can check.

Two more things on that screen matter.

**Every row says whether its number was measured or guessed.** A measured row carries its date. An unmeasured row says *Estimated*, marks its figure with a squiggle, and offers a **Measure** button. No row is ever blank, and a guess never outranks a measurement.

**Time to first word is never guessed.** Only measured. You can read the shape of a model file and predict its reading speed honestly enough, but you cannot predict the wait that way. An invention in the most prominent spot would be the worst thing this screen could do, so that spot only holds a real measurement.

A model the runtime cannot even open is still listed with the reason why, rather than dropped. If you can see it in your library it belongs here, or its absence reads as a bug. And nothing measures itself: a measurement loads many gigabytes off your disk and spends real time and battery, so each one is a button you press on purpose.

## The estimate that refuses to be made

One detail here I am oddly proud of is restraint rather than engineering.

When Flow estimates a reading speed for a model you have not measured, it works it out from how much of itself the model reads per word against how fast this Mac was observed moving data. That method checks out where it can be checked. At the one point where an independent measurement exists, the estimate said 64.0 words a second and the measurement came back 62.7. Within two percent.

Then I pointed the same method at a very small model and it produced roughly 927 words a second.

That is arithmetic running off the end of its evidence. Not a speed, a formula that has stopped describing reality. I could have capped it at a tidy-looking ceiling and it would have looked completely normal on screen. Instead that row shows no estimate at all. A cap would publish a ceiling I made up. An empty space is honest about not knowing.

The same instinct governs another number. A memory bandwidth figure of 300 GB/s gets quoted for this chip. No Mac reports it to software, so wherever it appears Flow labels it *Published specification*, next to a figure Flow really did observe while running a model: 268.6 GB/s achieved. Two kinds of fact, kept apart, both labelled. The published one is never dressed up as something Flow read from the Mac.

Memory itself is a verdict, not a number. *Fits comfortably*, *Fits*, or *Too large for this Mac*. The two engines Flow uses account for memory so differently that a byte count would invite a comparison the measurement cannot support.

## Three ways to be right

Speed is not the only thing anyone wants. Some work needs the answer to start immediately, some needs a model that can hold a long document at once. So above the leaderboard sits a three-way switch: Responsive, Balanced, Roomy. Flipping it re-scores every row, and the active setting prints the weights it is using, on screen.

| Setting | Time to first word | Reading speed | Memory headroom |
| --- | --- | --- | --- |
| Responsive | 70% | 20% | 10% |
| Balanced (default) | 50% | 30% | 20% |
| Roomy | 20% | 30% | 50% |

A blended score is a dangerous thing to ship. A single number that ranks things is exactly what people quote without checking, and exactly what a company can quietly tilt in its own favour. So this one shows its working. Tap a row and it opens into the arithmetic that produced it. On my screen the top model reads `1.00 × 50% = 0.50`, then `0.60 × 30% = 0.18`, then `1.00 × 20% = 0.20`, **Total 0.88**. The collapsed row above it reads **Score 88 of 100**. Same number. The second model opens to `0.46 × 50% = 0.23`, `1.00 × 30% = 0.30`, `0.53 × 20% = 0.11`, **Total 0.64**.

Read those together and you see something a single ranked list would bury. The two models win different things. The first is best on this Mac at reaching a first word, a perfect 1.00, but a middling reader at 0.60. The second is the best reader on the machine, a full 1.00, while slower off the mark at 0.46. Neither is simply better. The weighting decided between them, and you can watch it decide.

The score cannot drift from its own explanation, because there is no stored total anywhere. The score *is* the sum of those parts.

I considered sliders and decided against them. Three sliders turn a leaderboard into a settings panel, and you end up fiddling with machinery instead of reading a result. A named setting with its reasoning printed beside it gives the same visible, chosen weighting and leaves the screen a leaderboard.

One more limit, stated on the screen: scores are relative to the models being ranked, because no absolute scale exists. "Fast" for a small model on this M3 Max is not "fast" for a big one on a thin laptop. The best measured value on each axis becomes 1.00 and everything else sits against it. So a score answers *which of these models, on this Mac*, which is the only question the measurements support. It is not a rating you can carry to another machine, and I would rather say so than have someone screenshot it as one.

The screen also names what it does not measure, out loud: **Not ranked: instruction-following.** Flow measures speed and fit. It has no opinion on whether a model is any good at following what you asked, and I will not imply I have answered that by ranking something else. A model that has never been run gets no score at all, either. Not a zero, which would rank it last as though it had been measured and lost.

## Knowing is not the same as choosing

Measuring the models fixed my ignorance. It did not fix my workflow.

I now knew which model was quickest, which could hold the longest document, and which stayed on my machine. I still had to pick one every time I did anything. Every action became a small decision, and small decisions made all day are how you end up defaulting back to whatever is easiest to click. Which is how I got here in the first place.

What I wanted was to write my preferences down once and have the app apply them.

That is Smart Routing. You keep an ordered list of rules. Rules decide in order, and the first one that matches applies. That is not my summary of the feature. It is printed on the screen in those words, because a routing system you cannot state in one sentence is one you cannot predict.

Five rules ship built in, and they read like things a person would say:

- *Stays on this Mac*
- *Can hold the whole document*
- *Under $0.05 a run*
- *Fastest measured on this Mac*
- *Cheapest*

Any of them can be duplicated into a rule you edit yourself. The editor is small: a name, a condition, an effect. If something is wrong it says so beside the field it is wrong in, and Save stays switched off until the draft makes sense. I have used too many settings screens that let you save nonsense and behave strangely later.

## The sentence that made it worth building

Here is the part I would keep if I had to throw the rest away.

**The rule that decided is named wherever the route is shown.**

Hover the model name in the toolbar and it says: *Decided by the rule "Can hold the whole document".* Open the Settings explanation and it says the same thing in the same words, because both read from one source. There is a test whose only job is to keep those two surfaces from drifting apart, and to stop anyone typing a "Decided by" sentence by hand somewhere new.

That is the difference between routing you can read and routing you cannot. Most automatic model picking elsewhere is a box that chooses on your behalf using the vendor's reasoning, and tells you afterwards if at all. This is your rulebook, in your order, applied the same way every time, with the decider named on the screen where you approve the work.

There is no learning here, and that is on purpose rather than a gap. It does not study your habits or adapt. It does what your list says, in the order your list says it, every time. The predictability is the feature.

## Rules that admit when they have nothing

The honesty rules from the Benchmarks screen carry straight over, and they are why I trust the thing.

**A rule that matches but has nothing to offer says so.** In orange, on the row: "No model qualifies right now." It is not skipped quietly while another rule takes over behind your back.

**A speed rule with nothing measured refuses to pretend.** *Fastest measured on this Mac* reads the same measurements the Benchmarks screen shows. With nothing measured it says "No speeds measured on this Mac yet." rather than handing you the default ordering dressed up as a speed ranking. A model never measured is not ranked at all.

**A cost rule with no published price fails shut.** Flow will not invent a rate, so a model without a published price cannot qualify for an under-a-price rule. That is the safe direction to fail in.

**Every rule row carries a live count.** "4 of 8 models qualify." Counted from the providers switched on this second, not from something stored last month.

**Pinning a model turns the rulebook off out loud.** Pin one model and the rules section says the rules are deciding nothing. No rule takes credit for a choice you made yourself.

Those five took longer to build than the routing itself. Every one is the app admitting to a limit, and that is the only thing I have found worth over-engineering, because it is what makes the rest believable.

## Where this actually sits

I should be straight about what is where. Both screens are built, tested, and living in the repository. Neither is in the installed, signed copy of Flow yet. Everything above came from a development build: written down and working, not yet delivered to your Applications folder. When it ships signed I will re-take the pictures and re-check every number here the same day. I would rather say that now than have you go looking for a screen that has not arrived.

One thing has not changed. Models running on your own Mac are part of the subscription, exactly like the ones running anywhere else. It would be an easier story to say that once a model lives on your machine the software costs nothing. It would not be true. What you pay for is the measuring, the ranking, the rules, the naming of the rule that decided, the proposal, the approval, the record. That layer costs the same to build whichever machine the model sits on, and it is why the output is safe to accept. Ten dollars a month, or ninety-six a year.

## What I actually learned

The lesson is smaller than the feature, and more useful.

I had a belief about my own machine. Smaller is faster. Reasonable, widely shared, easy to check, and wrong. I held it for weeks because it never occurred to me it was checkable, and because every table I could find agreed with me while quietly describing a computer I do not own.

The fix was not a better model or a cleverer guess. It was measuring the thing in front of me, then writing down what I wanted so I would not have to keep guessing.

That is most of what I have learned building this way. The confident answer arrives free. The measurement costs something. And almost every time I have paid for the measurement, it has told me something I would have sworn was not true.

So go and look at which model on your Mac is actually the quick one. You may already know. I thought I did.
