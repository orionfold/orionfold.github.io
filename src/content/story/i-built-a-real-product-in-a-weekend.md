---
title: I built a real product in a weekend
date: 2025-01-28
summary: Over one holiday weekend I built Web Memo, a working browser tool, about 2,400 lines of code. AI wrote most of it. My sense of my own ceiling moved.
hero: ../../assets/story/i-built-a-real-product-in-a-weekend/hero.jpeg
heroAlt: "Three-panel comic of a builder at a home desk turning a weekend idea into a finished app with AI help."
tags:
  - Vibe coding
  - Building in public
---

I had read enough about AI writing code. I wanted to know something simpler. Could I ship a real, finished product with it in two days. So over the December holidays, I tried.

## The thing I built

I built Web Memo, a small add-on for the web browser.

As I read a blog post, a podcast transcript, or an article, I could save it with one click. The AI would read what I saved, write a short summary, and file it under the right project tag on its own. Later I could open a chat and ask questions across everything I had saved under a tag. It was like talking to my own reading.

Two real examples from my own use show what it did. It cut one blog post from 8,370 words down to 168. It cut a long transcript from 19,929 words down to 173. The gist was kept. The noise was gone.

And it stored everything inside the browser itself. No server to run. No hosting bill. It just lived on my machine, which is how I like my tools.

## How it got built

I worked in Cursor, a code editor with AI built in, driving Claude to write the code. I used the Claude API for the summarizing. When it was done, Web Memo was about 2,400 lines of code.

I did not write most of those lines by hand. I described what I wanted. The AI wrote the code. I ran it and tested it. I corrected what was off. Then we went again. Over and over, for a weekend.

## What the weekend taught me

Two habits made it work, and I still use them every day.

First, test more than you read. I stopped carefully reading every line the AI wrote. There were too many, and reading them was slow and dull. Instead I ran the thing and watched what it actually did. The behavior is the truth. The code is just how it got there.

Second, small steps beat big prompts. When I wrote one giant instruction, I got back a tangled mess that was hard to fix. When I asked for one small thing, checked it, then asked for the next small thing, I got a clean build I trusted. Patience, in small pieces, was faster than one big leap.

## The bigger thing I felt

A full, useful product. One person. One weekend. A few years earlier that was a small team and a month of work.

I wrote down a hunch that weekend, and it has only grown since. One day people will not wait for someone like me to add the feature they want. They will simply say what they need, and the software will grow itself to fit. We are not all the way there yet. But that is the direction, and I want to build toward it.

This was my first real "skill beats staff" moment. I do not mean skill instead of people. I mean skill instead of needing more people just to begin. The cost of starting something had fallen to almost nothing.

The weekend proved that AI could build. The next year taught me how to work with it well, which turned out to be harder, and far more interesting, than it sounds. That is where the story goes next: [Vibe coding is not passive](/story/vibe-coding-is-not-passive/).
