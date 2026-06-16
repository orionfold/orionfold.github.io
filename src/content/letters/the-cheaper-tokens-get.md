---
title: "The cheaper tokens get, the more you pay"
edition: "June 2026"
date: 2026-06-16
dek: "The price of an AI token is falling fast. Company AI bills are going up anyway. Here is why, and what one desk on your own does about it."
---

Here is a puzzle from the AI world right now. The price of a single AI token, the small unit you pay for every word a model reads or writes, is falling faster than almost anything in the history of tech. And yet the AI bills that companies pay are going *up*. Both are true at the same time, and the gap between them is the whole reason I build what I build.

## Prices are crashing

The investment firm Andreessen Horowitz gave the price drop a name: LLMflation. By their measure, the cost of running a model of equal skill falls about ten times every year. The same quality that cost sixty dollars per million tokens in late 2021 costs about six cents today. That is a one-thousand-fold drop in three years [1]. Wonderful news, on its face.

## Bills are climbing anyway

Now look at the bills. Menlo Ventures, which surveys large companies on what they actually spend, found that money spent calling AI models jumped from 3.5 billion dollars to 8.4 billion in just six months, and that running models in production has passed training as the main cost [2]. So the price per token fell through the floor, and total spending more than doubled. How can both happen?

The answer is the new way we use AI. Old AI answered one question at a time. The new kind, the "agent" kind, works on its own across many steps. It reads files, runs tools, checks its own work, and tries again. One task now burns ten or a hundred times the tokens it used to. So even as each token gets cheaper, you use so many more that the bill goes up, not down.

Economists have a name for this, from a coal study back in 1865. It is called Jevons paradox: make a thing cheaper, and people use so much more of it that they end up spending more. AI tokens are a textbook case.

It is not just theory. This month, TechCrunch reported that Uber spent its entire 2026 AI coding budget by April, with token use per developer up about eighteen times in nine months [3]. The meter just keeps running.

## I watched this from the inside

For almost nine years I helped build the cloud that sends those bills. The model is simple, and for the seller it is wonderful: you rent, you never own, and the meter never stops. Every experiment, every retry, every step an agent takes is another charge. So teams do the natural thing. They play it safe. They run fewer tests. They hold back the very thing that makes AI good, which is trying many things and learning from the ones that fail.

That is the trap I left to fix.

## The other way

Put the work on a box you own. Mine sits on my desk and draws about as much power as a desk lamp. On it, a failed experiment costs a fraction of a penny, not a line on a cloud invoice. One night my box ran fifty experiments by itself, and forty-two of them failed. The whole run cost about two cents. When failure is that cheap, you stop playing safe and start finding the things careful people miss.

There is no per-token meter, because there is no meter at all. You pay once for the box, and then you run all you want. And because the work never leaves the desk, your private data never goes out to a service that keeps a copy.

I will not oversell it. The giant hosted models are still smarter than my small ones, and I am happy to say so. But for the jobs most companies actually need, answer from your own documents, cite the source, refuse cleanly, return one number you can check, my small models have the proven version. They run on a box with no meter. You pay once. Failure is free. Your data stays in the room.

The cheaper tokens get, the more the cloud will sell you. The way out is not a cheaper meter. It is no meter.

## Sources

1. Andreessen Horowitz, "Welcome to LLMflation," by Guido Appenzeller. [a16z.com/llmflation-llm-inference-cost](https://a16z.com/llmflation-llm-inference-cost/)
2. Menlo Ventures, "2025 Mid-Year LLM Market Update." [menlovc.com/perspective/2025-mid-year-llm-market-update](https://menlovc.com/perspective/2025-mid-year-llm-market-update/)
3. TechCrunch, "The token bill comes due: inside the industry scramble to manage AI's runaway costs," June 2026. [techcrunch.com](https://techcrunch.com/2026/06/05/the-token-bill-comes-due-inside-the-industry-scramble-to-manage-ais-runaway-costs/)
