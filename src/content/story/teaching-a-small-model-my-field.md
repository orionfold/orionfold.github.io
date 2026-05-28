---
title: Teaching a small model my field
date: 2026-04-23
summary: I taught a 3B model my own field with 231 question-answer pairs. It stopped refusing and started answering, in my voice. Small and tuned beat big and general.
hero: ../../assets/story/teaching-a-small-model-my-field/hero.jpeg
heroAlt: "Spotlight comic. A small friendly AI model wears a graduation cap and holds a badge that says My Field, standing on a small gold desktop computer while the builder claps."
tags:
  - Fine-tuning
  - Models
  - Custom models
---

A general AI knows a little about everything and the deep particulars of almost nothing. I wanted one that knew my own work cold. So on the desk machine, I taught a small model my field, and the result taught me something about how learning really works.

## The plan

I picked a small model, 3 billion in size. Small enough to teach quickly right on my desk.

I did not retrain the whole thing. That is slow and costly. I used a method called LoRA, short for Low-Rank Adaptation. In plain terms, LoRA freezes the big model as it is and clips on two small, trainable pieces that gently steer its behavior. My added pieces were tiny, about 30 million numbers, under 1% of the model, just 120 megabytes on disk. A small patch, not a rebuild.

## Teaching it from my own writing

For lessons, I used my own published articles. From eleven of them, about 38,000 words, I made question-and-answer pairs. The model read a passage and wrote a likely question and answer. That gave me 275 pairs.

Then came the careful part. Some of those pairs made up facts that were not actually in my writing. I threw those out. The honest set was 231 pairs, with 44 held back to test on later.

Training took 69 seconds. Loading the model took longer than teaching it did. On my own desk, in about a minute, the model met my field.

## What changed, in numbers

I tested the model before and after, on the 44 questions it had never seen.

Before, the plain model refused to answer 61% of the time. It hedged. "The articles don't specifically mention that." After the patch, it refused 0% of the time. Not once.

It got more right, twice as many strong answers. It got faster, about six times faster per answer. And it got shorter, from 70 words down to 9. It stopped rambling and started answering.

## The finding that surprised me

Here is the honest twist, and it is the best lesson in this whole story. The patch taught the model how to sound like an expert in my field, but not the exact facts.

I asked it a specific number it had not memorized. It gave a confident, wrong one, in exactly the right shape. As I summed it up: "voice transfers, values don't." It learned that answers in my field are short, that speed is measured in milliseconds, that memory is measured in gigabytes. It learned the words and the tone. It did not learn every exact figure.

That sounds like a failure. It is actually the key to a good design.

## Voice plus facts, not voice alone

Back in story five I had learned to keep my real data close, in a searchable store. That store holds the exact facts. So I stacked the two together. The small patched model supplies the voice and the willingness to answer. The lookup layer supplies the exact facts. Together they make a real expert. The patch and the lookup are not rivals. They are partners.

And here is the part that still delights me. A much larger model, 49 billion, tuned for the same kind of work, actually refused more often than the smaller ones did. Bigger did not mean braver. A tiny patch on a tiny model, taught only my field, dropped refusals all the way to zero. Not by knowing more. By being invited onto ground it understood.

The whole loop, from empty folder to tested results, ran in under 45 minutes on the desk.

## Why this is the heart of Orionfold

This is the third belief, made real. Custom models. Not one giant chatbot that knows a little of everything. A small model, taught one field, run on a machine you own.

This experiment is exactly the road to the model I am proudest of, [Patent Strategist](/models/patent-strategist/), an open model tuned for patent work. Small, sharp, and yours to run.

By now I had spent a year and a half learning the craft, then bringing it home to my own desk. The next step was the biggest one of all. After nearly nine years at Amazon, I left to build this full time, out in the open. That story is next: [Why I folded Orionfold](/story/why-i-folded-orionfold/).
