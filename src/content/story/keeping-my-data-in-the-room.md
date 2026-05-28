---
title: Keeping my data in the room
date: 2025-08-25
summary: I built an analyst AI that never sends my work to the cloud. Privacy is not a setting you flip at the end. It is a choice you make in the design.
hero: ../../assets/story/keeping-my-data-in-the-room/hero.jpeg
heroAlt: "Comic. A builder works at a desk inside a warm glowing dome at night while data stays safely in the room."
tags:
  - Privacy
  - Local AI
  - AI Native
---

The faster I built with AI, the more of my work passed through it. Every document, every note, every half-formed idea. One day I stopped and asked a plain question. Where is all of this going?

## A small worry that became a rule

When you use a big AI service, your words usually travel to someone else's computer to be answered. For a quick, throwaway question, that is fine. For my research, my client notes, my private thinking, it is not fine.

I did not want to give up AI to keep my privacy. I wanted both. So I built a setup that gave me both, and I learned a rule while doing it.

## What I built

I made a private analyst AI. It runs on my own laptop, and it reaches out to a cloud model only where I choose to let it.

It had three parts. The first saved any web article to my own machine as plain text. This part was simple and exact, the same every time. The second read my saved text and drew charts and diagrams from it. This part was creative, so I let the AI lead. The third turned those diagrams into clean images.

To test it, I fed it a 9,000-word industry article. It handed back 10 clear visuals. A long, dense read, turned into things I could see at a glance, and none of my work left the room.

## Privacy was a design choice, not a setting

Here is the key move. I picked Amazon Bedrock to run the model because of its written promise. It "doesn't store or log your prompts and completions," and it "doesn't use your prompts and completions to train any AWS models." Compare that to services that say they "may use your content to train our models." Same task. Very different deal for your data.

The point is not which company you trust. The point is that the privacy came from the shape of the system. Local files. A model that does not keep what I send it. I designed the privacy in from the start. I did not bolt it on at the end and hope.

## When to let AI lead, and when not to

Building this taught me a simple split that I still use every day.

If a job is already solved by ordinary software, and it has to be exact every single time, I use a plain, fixed tool. Saving a web page is like this. No AI needed.

If a job is open and creative, where doing it by hand would cost real time and money, I let the AI lead. Turning a wall of text into the right ten pictures is like this.

Knowing which is which keeps the whole system fast, cheap, and trustworthy. You do not point a creative, sometimes-wrong AI at a job that has to be exact.

## Why "in the room" is the whole idea

"Local-first" means your work stays on your own machine by default. To me it is not just a feature. It is respect. Your notes are yours. Your clients' data is theirs. The AI can help without ever taking custody of any of it.

This belief now runs through everything I build at Orionfold. Private by default. The room stays yours.

The next thing I learned was that even a great private agent fails if people cannot reach it the way they like to work: [One agent, three faces](/story/one-agent-three-faces/).
