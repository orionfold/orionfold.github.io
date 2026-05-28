---
title: The glue tax, and the kit that pays it
date: 2026-06-05
summary: Every AI project, I kept rewriting the same boring plumbing. I named it the glue tax. So I built fieldkit, an open kit of 12 tested parts, to stop paying it.
tags:
  - fieldkit
  - Software
  - Building in public
hero: ../../assets/story/the-glue-tax/hero.jpeg
heroAlt: "Three-panel comic in a warm workshop. A tired builder glues the same parts by hand, a tall tower of repeated glue-tax parts looms over them, then they open a tidy blue toolbox of ready-made modules. A banner reads: Pay down the glue tax."
---

After enough AI projects, I noticed I was paying a tax. Not money. Time. The same boring plumbing, rewritten from scratch, every single project. I gave it a name, the glue tax, and then I built a kit to stop paying it.

## What the glue tax is

The glue is the dull stuff between the interesting parts. Things like retry logic (what to do when a call fails, so you try again instead of crashing). Context math (working out how much text actually fits in the model). Database setup for storing your documents. Scorecards for testing whether the AI did well.

None of it is the point of your project. All of it has to be there anyway. And it adds up. As I wrote when I named it, the glue tax is "retry logic, context-window math, pgvector schemas, and eval rubrics; token bills inflated by overflow and missing backoff; brittle copy-paste lifted from a half-dozen articles per project."

That last part is the worst of it. You end up copying half-broken snippets out of old blog posts and gluing them together by hand. Every time.

## So I gathered the patterns into one kit

While writing my build log, I kept solving the same problems over and over. So I collected the tested patterns into one open Python package and called it fieldkit. It distills 24 of my articles into 12 small parts you can use.

Each part does one job. There is one for memory math, one for talking to a local model, one for searching your own documents, one for scoring the AI, one for teaching a model, one for tracking experiments, one for shrinking models, one for sharing them, and a few more for everyday work.

It is free and open. One line installs it: `pip install fieldkit`. Then a single import does the work that used to take about 250 lines of fiddly setup. You write the one line that matters, not the fifty that do not.

## Tested where it counts

Here is the part I care about most. Every pattern in the kit was tested on the same little desk machine from story nine. The taglines say it plainly: "verified-on-Spark," "build with verified patterns." It is not a pile of code that looks right. It is a pile of code that actually runs, because I ran it.

## Why this is "open software" made real

This is the second of the four levers from the last big story, open software, turned into something you can hold.

The point of open tools is not only that they are free. It is that the boring, solved parts get shared once, so nobody has to rebuild them. You spend your time on the new, interesting part of your problem, the part only you can do. The glue is a tax. An open kit pays it down, for everyone at once.

The whole tagline fits on one line: ship AI features faster, cheaper, with less glue. You can see it on the [fieldkit page](/software/fieldkit/).

The kit came straight out of writing things down, over and over, until the patterns were clear. Which brings me to the books: [A book you can read free and run](/story/a-book-you-can-read-free-and-run/).
