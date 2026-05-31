---
title: The cockpit for my models
date: 2026-05-29
summary: I had a shelf of models on one desktop and no way to drive them. In fifteen hours I built a cockpit to run, compare, and score them, all on that desk.
hero: ../../assets/story/the-cockpit-for-my-models/hero.jpeg
heroAlt: "Three-panel painted comic. A builder looks overwhelmed at a shelf full of glowing AI model boxes and a tangle of terminal windows, then sketches a single dashboard beside a glowing gold desktop computer, then sits back happy at one screen with live dials, a leaderboard, and two models racing, under a blue star constellation. A banner reads One cockpit for every model."
tags:
  - Tools
  - Local AI
  - Agentic coding
---

By late May I had a problem that looked like a win. I had built and published a shelf of AI models on one small desktop, the NVIDIA DGX Spark. A reasoning model for patents. A legal one, a cyber one, a medical one, a finance one. I had written more than fifty notes full of real numbers about how they did. What I did not have was a single place to run any of it.

Picking a model to try meant remembering a long command. Comparing two meant opening a terminal and a notebook. Figuring out which small build was the good one meant digging up a note I wrote weeks earlier. I had a shelf of artifacts and no front door.

## The itch

The thing a desktop gives you that a rented cloud model never will is a closed loop. The model, the tests it was scored on, the machine it runs on, and the results all live in one place you own. I had the loop. I just had no cockpit over it.

So I decided to build one. One screen where I could see the machine working, see every model I had made, and read a board that ranked them from my own results. I gave myself a day.

## The unglamorous start

The first slice was on purpose not pretty. A bare page with a spec and an empty ranking table, dropped into the reading layout I already had. In my own note at the time I called it crap. But it did the one thing that mattered: it proved the data could flow. The tests, the past runs, and the model files could all be read into one page. Once I could see that, the rest was downhill.

From there each new screen was a thin shell over work that already existed. That is the whole trick, so let me say it plainly. I was not building from nothing. I was putting a face on a year of work.

- The live readouts sit on top of the Spark's own counters.
- The ranking board sits on top of a safe slice of my results.
- The chat and the head-to-head sit on top of the model that was already loaded.
- The scoring drawer sits on top of the tests my models were already measured on.

## What it became

A day and an overnight later it was fourteen screens with its own flight-deck look. Here is what I can do with it now.

I can watch the machine. A strip across the top shows how hard the chip is working, how hot it is, how much of the shared memory is in use, and how fast answers are coming back. On a Spark the chip and the system share one pool of memory, so watching that one number is how I avoid running out before it happens.

I can see which model wins. The board ranks my models from real results, and folds in every new chat and test as I go. The clever part is that it is built from a safe slice that shares only the scores, never my prompts or the model's replies. So I can show the board in public and still keep my data.

I can decide what to ship. One chart plots quality against speed for every build, and draws the best trade-offs in gold. To shrink a model so it runs faster is called quantizing, and the chart shows exactly what you give up when you do it. Ship a point on the gold line and you know the trade you made. The chart is a place I point at, not an argument I have.

And I can try and test in one place. I chat with the model that is warm and loaded, pull the exact test it was scored on, and grade its answer against a known-good answer without leaving the chat. Or I put two models head to head and read the trade in plain numbers: quality, speed, wait time, length, and cost. The test is one drawer away from the chat, not a separate pipeline.

## The build, measured

I do not want to round this up, because the honest version is the better story.

About fifteen and a half hours of real clock time, across one day and an overnight. Around 12,700 lines of code that I wrote with the help of an AI agent. 125 tests, written alongside the features, not bolted on after. The agent did the typing across twelve work sessions and more than a thousand turns.

Here is the part that makes this affordable. Of all the text the model read while it worked, about 98 in 100 came from a cheap cache, not fresh thinking. The agent could hold the whole growing codebase in its head and spend new effort only on the new work. That is the quiet reason building at this pace does not cost a fortune.

## Why it was a day, not a month

It was buildable in a day because almost none of it was built from scratch. The cockpit is a thin surface over [fieldkit](/software/fieldkit/), the open toolbox I had been growing all year, and over the models and notes this work had already produced. fieldkit serves the models, runs the tests, and scores the answers. The Arena just gave that work a screen.

And the data was real on day one. The board ranked real models. The quality-versus-speed chart plotted numbers from real tests. The scoring drawer served the exact tests those models were measured on. The cockpit had real rows from the start because the slow work of filling them happened over the year before. That is the leverage, and it is truer and more useful than a from-nothing claim. The cockpit is the sum of compounding work, not a fresh start.

## Private on purpose

Nothing I type is uploaded. Nothing I compare phones home, unless I deliberately pick a hosted model. The whole thing is a tool I could run on a plane. That is not a feature I bolted on. It is what you get for free when the model, the data, and the machine all live under your own desk.

## The point I keep coming back to

The tool is nice. But the method is the thing worth taking with you. A solo builder on one desktop, driving a capable AI agent over a toolbox that already does the hard parts, can go from an idea to a tested, fourteen-screen tool in a day. Point that same loop at your own shelf of models, and it works for you too.

You can try the cockpit yourself in the [Arena](/software/arena/), and there is a live demo you can click through without installing anything. The models it drives came from the work in the [DGX Spark book](/books/ai-research-on-nvidia-dgx-spark/), if you want to see where the shelf came from.
