---
title: A spec at breakfast, an app by lunch
date: 2025-12-04
summary: With Kiro I turned three sentences into a 24,000-line app, about four hours of my time. The spec did the heavy lifting, and speed became a skill.
hero: ../../assets/story/a-spec-at-breakfast-an-app-by-lunch/hero.jpeg
heroAlt: "Four-panel comic. A builder writes three sentences at breakfast, the plan fans out into tasks, an app fills the screen by noon, then the builder leans back by the finished app."
tags:
  - Spec-driven
  - Vibe coding
  - Building in public
---

Back in story three, my big lesson was that small steps beat big prompts. A year later a tool named Kiro turned that lesson into a method, and I watched three sentences become a working app.

## The problem with just talking to AI

When you build by chatting with AI, it is easy to lose the thread. You ask, it builds, you ask again, and soon nobody, not you and not the AI, can say exactly what the thing is supposed to do. My "small steps" habit helped. But it was still me, holding the whole plan in my head.

Spec-driven development fixes that. A spec is a written plan: what we are building, what counts as done, and the list of tasks to get there. Kiro writes the spec first, then the code. The plan comes before the build, on purpose.

## Three sentences to a working app in an hour

I gave Kiro a tiny vision, about three sentences, for an app to help new users get good at a tool. Then I watched it work.

It wrote 12 clear requirements. It turned those into more than 60 checks for "is this done right." It even wrote 50 correctness properties. A correctness property, as Kiro put it, is "a characteristic or behavior that should hold true across all valid executions." In plain words, the things that must always stay true, no matter what the user does.

Then it broke the whole build into 32 tasks. I ran the first four, and I had a working app. In about an hour.

I have tried many code tools over the years. I wrote this at the time and I meant it: "Nothing gets to this level of structured, traceable outcome this early in the project." I could follow any line of code back to its task, back to a requirement, back to the original idea. Nothing was floating loose.

## Then I let it run for a day

An hour was a toy. So I pointed Kiro at something real and gave it a full day.

In 24 hours it produced about 24,000 lines of code. The app was not a demo. It had real sign-in for many users, a dashboard, a test suite that checked its own work, a live chat run by several agents at once, and learning modules. The task list grew from 32 to 36 as it found work it had missed, which I actually liked. It was honest about its own gaps.

Here is the number that still stuns me. My own time across that whole day was about four hours. The rest, the machine carried.

## Why this was not just faster typing

The speed did not come from the AI typing quickly. It came from the spec. Because the plan was clear and split into clean parts, the work could run in parallel and stay on track. I was not re-explaining myself every hour. I had said it once, well, up front.

And it cost me less to run. As I wrote then, it was the "least cognitive load of all coding agents I have used so far." Less holding things in my head. More trust in the plan.

## The lesson that ties Act II together

Look at what this year taught me. Vibe coding is real work, judgment at speed. Keep your data in the room. Meet each person at the door that fits them. And plan first, in a spec the AI can follow, so speed becomes something you can repeat.

Put together, that is a craft. Not magic. A craft you can learn.

Up to here I had been building mostly in the cloud, on rented machines. The next chapter is where I brought it all home, onto a small computer on my own desk, and went deep: [Access first, models second](/story/access-first-models-second/).
