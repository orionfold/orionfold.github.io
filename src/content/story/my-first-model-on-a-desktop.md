---
title: My first model on a desktop
date: 2026-04-22
summary: I ran my first model on a small computer on my desk. 52 milliseconds to the first word, no cloud, no per-use bill. It felt like a local function, not a service.
hero: ../../assets/story/my-first-model-on-a-desktop/hero.jpeg
heroAlt: "Three-panel comic. A builder runs one command, gets a first word in 52 milliseconds, and a small gold desktop AI glows with a blue constellation of icons."
tags:
  - DGX Spark
  - Local AI
  - Personal devices
---

Then I ran my first model on the machine. One command. A few seconds later I was talking to an AI that lived entirely on my desk. No cloud. No account. No meter running. I want to tell you exactly how that felt, the good parts and the awkward ones.

## One command, one model

I used a NIM, which is NVIDIA's tidy package for running a model. It bundles everything, the model, the settings, the little server, into one box. One command starts it, and you have a working AI you can talk to. No fiddly setup.

The model was Llama 3.1 in its 8 billion size, squeezed down with a trick called FP8. FP8 stores each number in 8 bits instead of 16, which roughly halves the size. So the model took about 8 gigabytes instead of 16, and ran happily inside the desktop's memory.

## The number that changed how it felt

People love to quote tokens per second, the speed an AI produces words. Mine held steady at about 24.8 per second. That is roughly 18 words a second, three to four times faster than you read. A full paragraph in about ten seconds.

But the number that actually changed how it felt was smaller and quieter. 52 milliseconds. That was the gap between hitting enter and the first word appearing. A cloud service usually adds a quarter-second to two and a half seconds before it even starts. At 52 milliseconds, the AI did not feel like a service I was calling across the internet. It felt like a function inside my own program. Instant. Mine.

And it simply stayed on. No per-word bill. No cold-start tax each session. After the first setup, a restart took under two minutes, and then it was just there, all the time.

## The honest part

Here is what the glossy launch videos skip. Fast does not mean correct.

I asked the little model for a one-line piece of code to compute a number in a famous sequence. It handed back a line that was confidently, completely wrong. As I wrote then, "every part of that line is wrong." It looked like an answer. It was not one.

For comparison, a much bigger model, 123 billion, running on the same desk, took about 26 seconds, three times slower, and got it right on the first try.

I did not hide this. Most writing about small models would rather not face the trade. I wanted to, so I wrote plainly, "this blog can." Speed and smarts pull against each other, and pretending they do not helps no one.

## What I actually learned about owning the machine

The lesson was not "small models are bad." It was about roles.

A model on your own desk is wonderful for the jobs where being close and private matters most. Searching your own notes. Long experiments that would run up a scary cloud bill. A helper wired right into your editor, answering in a blink. For those, owning it wins easily.

But for jobs where being exactly right matters more than being fast, you reach for a bigger model. So I started treating the little local model as infrastructure, not arbiter. Plumbing I lean on for speed and privacy, not the final judge of hard, exact questions.

The big shift, the one that became a belief I now build on, was this. A personal AI device changes the math. When the brains sit on your desk, run all the time, cost nothing per use, and answer in 52 milliseconds, you stop rationing your AI. You just use it, freely, all day. That is the whole case for personal devices.

There was one more thing this little desk could do that the cloud always made hard. It could learn my field: [Teaching a small model my field](/story/teaching-a-small-model-my-field/).
