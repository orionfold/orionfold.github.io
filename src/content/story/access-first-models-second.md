---
title: Access first, models second
date: 2026-04-21
summary: On day one with my desktop AI machine I did not pick a model. I set up how I reach it. Models change every six months. Good access lasts for years.
hero: ../../assets/story/access-first-models-second/hero.jpeg
heroAlt: "Two-panel comic. On the left a builder is stuck choosing from a wall of model names. On the right the same builder ships happily with one gold desktop AI."
tags:
  - Local AI
  - AI Native
  - Pragmatism
---

A small silver box arrived on my desk. Inside was a computer that could train and run its own AI, no cloud needed. The obvious first move was to pick a model and run it. I did the opposite, and it turned out to be one of the best calls I have made.

## The machine

The box is a DGX Spark. It is a compact desktop, about the size of a small book, and it costs around $4,000. It holds 128 gigabytes of shared memory, which is a lot. It is one pool of memory that both the chip and the AI draw from, and it is enough to run, and even teach, real AI right on your desk.

## The trap I avoided

Everyone's first-day story is the same. Unbox the machine, run a model, post the speed. I almost did that too. Then I asked a colder question. What here will still matter in a year?

Not the model. As I wrote at the time, "models are fungible, every six months there's a new state-of-the-art you swap in." The best model today gets replaced by spring. If I built my whole setup around one model, I would be rebuilding it twice a year, forever.

What lasts is access. How I reach the machine. How my AI helpers do work on it. How that work turns into something I can publish. Those choices pile up over time, and they are painful to undo later. So I spent day one on those, not on models.

## What I set up first

I installed four things before I ran a single model. In plain words:

- A fast remote screen, so I could drive the desktop from my laptop with almost no lag, under 30 milliseconds. The machine could sit in a closet and still feel like it was right in front of me.
- My AI coding helper running on the desktop itself, not on my laptop. It works where the files live, so there are no slow trips back and forth.
- A way for my helpers to use a web browser on their own, so an agent could log into a dashboard and grab a screenshot the way a person would.
- Safe sandboxes, walled-off play areas where an agent can run commands without any risk to the main system.

All of it took about six hours of focused work, spread across a week.

## Why this is a principle, not a chore

Here is the lesson, and it is the title. Access first, models second.

The access layer is what actually sets your pace. How fast you can ship. How much your AI helpers can do on their own. How quickly you find out whether something worked. For one person, those are the real bottlenecks, far more than which model is popular this month.

Models are guests. They arrive and they leave. The house is the access you build around them. Build the house well, and you can welcome any guest.

With the house finally ready, I ran my first model. What happened next surprised me, in good ways and honest ones: [My first model on a desktop](/story/my-first-model-on-a-desktop/).
