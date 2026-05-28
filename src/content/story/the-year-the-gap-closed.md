---
title: The year the gap closed
date: 2024-11-12
summary: In late 2024 I watched the AI tool stack collapse into the model itself. The first sign that one person could build what used to take a team.
hero: ../../assets/story/the-year-the-gap-closed/hero.jpeg
heroAlt: "Two-panel comic at a sunset stadium. In 2023 a runner labeled CLOSED leads a smaller runner labeled OPEN by a wide margin. In 2024 the two hit the finish tape side by side under a blue star constellation. A banner reads: The year the gap closed."
tags:
  - Open models
  - AI Native
  - Cost
---

I keep a list of the tools I need to build an AI app. In 2023 that list kept getting longer. In late 2024 it started getting shorter. This story is about that turn, because it changed who gets to build.

## The tower of tools

When I started building with AI, putting one good feature together felt like stacking a tower.

There was a well known map of the field from the investors at a16z. In 2023 it showed about 30 tool providers across 12 groups. You needed something to store memory, something to search your documents, something to chain steps together, something to watch it all run. To ship one smart feature, I bolted a dozen of these pieces together.

It worked. But a tower wobbles. Every piece was one more thing that could break, one more bill, one more part to learn.

## Then the tower started to shrink

A year later the same map had grown to over 70 providers across 14 groups. More choices on paper. But underneath, something else was happening. The models were swallowing the stack.

Frontier models are the biggest, most capable AI. By late 2024 they could do jobs that used to need separate tools. GPT-4 Turbo could hold a small book in mind at once. Claude 3 could read and reason over long text. A new model called o1 could think through a problem step by step instead of blurting the first answer. The model did more, so I needed less around it.

I tested this. I built a working AI setup on AWS with just three parts: one service to host the model, one to run small bits of code, one to store data. Three boxes, not thirty. The tower had folded into the model.

## Open models showed up to the table

The other shift was quieter and, to me, bigger.

Open models are AI you can download and run yourself, for free. For a long time they trailed far behind the paid, locked kind. By late 2024 that was no longer true. Meta's Llama 3 was a real choice, not a toy. There was even a version tuned to write code. For the first time, a small team or a single person could pick an open model and not feel like they had settled for less.

The gap between the paid, closed AI and the free, open AI was still there. But I could feel it closing.

## Why a shrinking stack changes who builds

Here is the part that does not make headlines.

When building needs thirty tools and a big cloud bill, you need a team and a budget to match. When building needs three boxes and a model that does most of the work, you need a clear head and a free weekend.

The usual AI story is about the models getting smarter. The story that mattered to me was the work getting smaller. Fewer moving parts means fewer people. Fewer people means one builder can ship something real.

So I changed how I worked. I stopped trying to master the whole tower. I started betting that the model would take over one more job every few months, and I built thin around it. Each time the model grew, I deleted a tool I no longer needed.

That bet has paid off every single quarter since.

## What broke next

I thought the big shift of the moment was capability. I was about to learn the real shift was price.

A few weeks later a model called DeepSeek showed up and did frontier-level thinking for about a tenth of the cost, small enough to run on my own machine. That is the next story: [Frontier reasoning at a tenth of the cost](/story/frontier-reasoning-at-a-tenth-of-the-cost/).
