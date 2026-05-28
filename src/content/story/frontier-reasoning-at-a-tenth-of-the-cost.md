---
title: Frontier reasoning at a tenth of the cost
date: 2025-01-21
summary: In early 2025 a model called DeepSeek did frontier-level reasoning for about 95% less. And it was small enough to run on my own machine.
hero: ../../assets/story/frontier-reasoning-at-a-tenth-of-the-cost/hero.jpeg
heroAlt: "Splash comic. A giant glowing price tag tears from 100k down to 10k in a grand hall, while a golden AI brain and a small gold desktop computer glow nearby. A banner reads: Frontier reasoning at a tenth of the cost."
tags:
  - Open models
  - Cost
  - Reduce the gap
---

For two years the rule was simple. The best thinking came from the biggest, most expensive models, and they lived in someone else's cloud. In January 2025 that rule broke, and I got to watch it break on my own screen.

## How big models learned to think

First, a quick word on what changed in the models themselves.

The newest frontier models had learned to reason. Instead of blurting out the first answer, they would work through a problem step by step, almost like showing their work. OpenAI's o1 was the famous one. It was strong, and it was costly to use.

To get that smartness into a smaller model, people used a trick called distillation. Distillation means teaching a small model to copy a big model's answers. It helped, but the small copy was always a step behind the original.

## DeepSeek did it differently

A team called DeepSeek released a model named DeepSeek-R1. They trained it to reason using reinforcement learning, which is training by reward and trial, the way you learn a game by playing it and seeing what works. The model was not just copying a bigger one. It was learning to think on its own. The team even wrote that it reached an "aha moment," a point where it taught itself to stop and rethink a hard step.

Then came the numbers, and they were frontier numbers.

- On a hard United States math exam (AIME 2024), it scored 79.8%.
- On a set of tough math problems (MATH-500), 97.3%.
- On competitive coding (Codeforces), it landed in the 96.3 percentile.
- On a broad knowledge test (MMLU), 90.8%.

And the cost. DeepSeek reported training the model for about 95% less than the leading frontier models. Not a little cheaper. A different category of cheap.

## The part that made me sit up

They did not stop at one giant model. They distilled it down into a whole family of smaller ones: sizes of 1.5, 7, 8, 14, 32, and 70 billion parameters. Parameters are a rough measure of the size of a model's brain. The smaller versions carried a lot of the reasoning with them.

The 70 billion version is still big, over 140 gigabytes. But the 8 billion version is about 16 gigabytes. That fits on a normal machine. That fits on mine.

## So I ran it myself

I did not want to just read about it. I wanted to feel it.

I opened a notebook on AWS, downloaded the 8 billion DeepSeek model from Hugging Face (a public library where open models live), put the files in my own storage, and imported it so I could talk to it directly.

Then I watched it think. As I wrote at the time, "the reasoning is fairly human like and sometimes very verbose." It talked itself through the problem, out loud, on my own setup, for pennies of compute. The smartest thing I owned, and it was mine to keep.

## Why this was the gap closing

In the last story I said the gap between paid and open AI was closing. This was the week it nearly shut. Frontier-grade thinking was now open, small, and cheap enough to run yourself.

Here is the lesson I carried out of that week. The expensive part of AI was about to stop being the model. If the brains were cheap and yours to keep, then the real question was no longer "can I afford the AI." It was "what will I build with it."

So I set myself a test. Could I build a real, finished product in a single weekend, with AI writing most of the code? I tried, and I wrote down what happened: [I built a real product in a weekend](/story/i-built-a-real-product-in-a-weekend/).
