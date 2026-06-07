---
title: The run I almost wasted
date: 2026-06-07
summary: I built Kepler, a space-math model, on one desktop. Three cheap checks told me the big training run would change nothing. I ran it anyway, and proving them right was the win.
tags:
  - Models
  - Fine-tuning
  - DGX Spark
---

The most expensive line of code in this kind of work is the one that starts a
training run. On my desktop, the NVIDIA DGX Spark, a big run means the machine
is busy for six hours. Everything else I wanted to try that day waits in line
behind it. So before I spend those hours, I want to know what they will buy me.

This is the story of building [Kepler](/models/kepler/), an AI model for space
math, and of the six-hour run I almost wasted on it. The run taught me less
than the three small checks I did first. That was the point.

## A model with no parent

I wanted a model that could answer space questions with real numbers. Ask it
how long a satellite takes to circle Earth at some height, and get a short
chain of work that ends in one number a program can check.

No model like that existed, so I had to build it from scratch. Pick a base
model, write a test, make training examples, and train. And one more choice
that mattered most of all: which kind of training to use.

There are two main roads. The first is plain teaching. You show the model
hundreds of worked examples and it learns to copy the pattern. The second is
practice with a grader. The model tries answers on its own, a scorer grades
each try, and good tries get reinforced. The second road is the famous one.
It is also the slow and costly one. The pull to use it is strong, because hard
problems feel like they deserve it.

## Check one: is the base broken?

Before any training, I scored the raw base model on my test. It got 12.5
percent. Worse, seven problems out of eight never finished. The model thought
and thought and ran out of room before giving any answer at all.

That reading could mean two very different things. Maybe the model rambles but
knows the physics, and teaching will fix it. Or maybe it is truly lost, and I
need a different base. Swapping the base would be expensive, so I ran the
cheapest test I could think of: I put three short worked examples into the
prompt and scored it again.

It jumped to 75 percent. Three examples in the prompt did that. So the model
knew the physics and just needed to learn when to stop talking. The base
stayed. That answer cost me one pass, not one run.

## Check two: did the teaching take?

I made 600 worked problems, every one checked by a program, and taught the
model with plain training. It took eleven minutes. Eleven. The score went from
12.5 percent to 86.4 percent, and not one answer got cut off anymore. One
problem that took the base model 295 seconds of rambling now finished in
under ten, with a clean short chain of work.

For most projects, the story could end here. The model was good, and it was
done before my coffee went cold.

## Check three: is there room for practice?

The expensive practice-with-a-grader run was still on the table. Would it make
Kepler better? There is a way to know without running it. Practice only helps
a model that sometimes gets a problem right and sometimes wrong. If it always
succeeds, there is nothing to learn from. If it always fails, there is no good
try to reinforce. The useful zone is the middle.

So I built a harder test, full of twists the model had not seen, and scored it
family by family. The answer was split. Some kinds of problems came in at 100
percent. Others sat at exactly zero. Almost nothing sat in the middle. The
zeros were not a practice problem. They were a coverage problem, kinds of
problems my 600 examples never showed. The fix for that is more examples,
not six hours of practice.

## I ran it anyway

Here is the twist: I ran the six-hour practice run anyway, on purpose. Not to
make Kepler better. The checks had already told me it would not. I ran it to
test the machinery around the run, the job queue, the budget brakes, the
checkpoints, under a real load where any score movement would be suspicious.

The run was flawless and changed nothing. The score started at 96 percent on
the in-run test and ended exactly there. The system, correctly, picked the
starting model as the winner. My three cheap checks had called it, and the run
shook out a handful of real bugs in my cockpit's gauges along the way. A run
you already know the result of is only worth it when the machinery is the
thing on trial.

## What I keep

Kepler shipped that week, free and open, with [the test set](https://huggingface.co/datasets/Orionfold/Kepler-bench)
that graded it published right next to it. The deeper method notes are in
[the field note](https://ainative.business/field-notes/the-gate-before-the-gpu/)
behind it.

The lesson fits in one line: measure at the gate, spend at the machine. Every
expensive run has a cheap question that predicts it. On one desktop you learn
to ask that question first, because nobody else is paying for the hours.
