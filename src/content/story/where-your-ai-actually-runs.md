---
title: The Fan Was the Only Status Light
date: 2026-08-23
summary: "A proofread ran my Mac hard for twelve minutes, but the app could not tell me which model was working or where my document had gone."
hero: ../../assets/story/where-your-ai-actually-runs/hero.jpg
heroAlt: "A creator routes a glowing document path between four execution chambers, stopping it at a bright boundary."
tags:
  - Orionfold Flow
  - AI-native work
  - Building in public
---

It was the fan that got me, not the bill.

I had asked for a proofread. A short document, nothing that should have turned the afternoon into an engineering investigation. After a minute, the Mac began making the sound that means something is working very hard.

Twelve minutes later it was still going.

I could not answer three ordinary questions. Which model was doing this? Was it running on my Mac, or had my text gone somewhere else? Was it costing money?

The app had nothing to say. I opened Activity Monitor and squinted at process names, which is like asking a car why it is making a noise and being handed a list of bolts.

That morning I found a model helper still using most of a processor after the app that started it had quit. It was working on nothing, for nobody. Closing the window had ended my view of the work, but not the work itself.

The fan was the only status light.

I did not mind that the computer was busy. I minded that software had made three decisions involving my document, my machine, and possibly my money without giving me a sentence I could understand.

## Where may this work run?

Approving a change tells you what enters a document. It does not tell you where the document went to get that change.

Many AI tools hide that decision in a provider setting. Pick a service once and text leaves the machine whenever the app needs it. If one route fails, another may take over. The boundary is treated as plumbing.

It is not plumbing when the document is a client proposal, a board update, a private research note, or the first version of an idea you are not ready to share.

Some documents can go anywhere. Others should never leave the room. The software cannot know which kind is in front of you, so it should not be the one silently deciding.

Flow asks a more useful question: **Where may this work run?**

There are four execution domains:

- Local, on this Mac.
- LAN, on another machine on your network.
- Cloud prepaid, through a service you already subscribe to.
- Cloud postpaid, where usage is billed.

Each domain has its own switch and a plain statement of locality and cost. The heavier control belongs to the heavier decision: enabling a provider inside an allowed domain is different from opening the boundary itself.

Flow may discover providers already available to you, but discovery never enables them. Finding an Ollama model or an active Claude subscription is an observation. Permission is a decision.

That distinction felt almost pedantic until I considered the alternative. Software that can detect a credential, model, or signed-in service can easily behave as if detection were consent. It is not. A key present in an environment says what is technically possible. It does not say what may happen to this document.

## A fallback may not move the boundary

The rule I care about most appears when something goes wrong.

**A fallback that would cross an execution domain stops and asks.**

If one local model fails and another allowed local model can do the work, Flow can stay inside the same boundary. If the next route would leave your Mac, the run pauses. The error does not silently become permission.

That is when consent matters most. A smooth run rarely tempts software to improvise. A failure does. The fastest recovery is often to send the work to a larger remote model and keep moving. It is also the moment when a boundary is easiest to step over while calling the result helpful.

Before a remote run, Flow shows what would be sent, where it would run, and the estimated cost when a published price is available. An estimate remains labelled as an estimate. Cancel is a complete stop.

The route is then fixed for that run. Flow does not begin locally and finish somewhere else because another provider looked more convenient halfway through.

This is deliberately less clever than invisible routing. Predictability is the feature. A route you can understand before the work begins is more useful than an optimal route you discover afterwards.

## Before, during, after

The fan incident exposed an information gap, so I designed the answer around three moments.

Before a run, Flow shows the route and any estimated charge. You can see whether the work stays on the Mac, moves across your network, uses a subscription you already have, or enters a metered service.

During a local run, the title bar names the model and shows the Mac's memory, processor, whole-Mac graphics activity, and thermal state in plain words. macOS does not provide a public per-model graphics figure, so Flow labels that reading as whole-Mac activity. If the public measurement is unavailable, the number disappears.

That qualification matters. A precise-looking number with the wrong scope would repeat the problem in a more attractive form. “Whole-Mac graphics” is less impressive than pretending to know exactly what one model consumed. It is also true.

After an approved run, the receipt records the model, provider, execution domain, cost basis, checks, evidence, and saved change. A prompt and API key have no field in that record.

These are three different kinds of fact. An estimate before the run never becomes a recorded charge after it. A local run can record that no charge was owed. An unavailable cost remains unavailable.

In one billed test, 105 words in and 149 words out recorded $0.00425. The small number is useful because it proves the decimal arithmetic is exact and the basis can be reproduced. Most software would round four tenths of a cent away. I wanted the record to say what happened rather than make the event look tidier.

The point is not that the run was cheap. It is that the estimate, the observed usage, and the final cost remain distinct. A receipt should survive the moment in which it was generated.

## Make it stop

Knowing what is happening is only half the answer to a spinning fan. The other half is being able to end it.

Stop ends the model process. It does not merely close the review while work continues in the background. A stopped run reports that it stopped and that nothing in the document changed.

Pause waits for the current part to finish and says so. That is a smaller promise than an instant pause, but it matches what the runtime can actually do.

Two Agency runs cannot overlap. While one is active, it owns the progress and Stop controls. A second request cannot hide the first behind another progress bar. That closes the path that left the abandoned helper chewing through my Mac after its app was gone.

These details are not performance polish. They define whether the person or the process is in charge. A Stop button that leaves the model running is only a way to stop looking.

The same principle applies to the route. If I stop a local run, Flow does not reinterpret the interruption as a reason to try the cloud. If a run cannot continue inside the boundary I approved, the correct result is not silent success. It is a visible stop and a new decision.

## What the fan was saying

The twelve-minute proofread was not only a performance problem. It was an authority problem. My machine was working hard with my document, and the software had not told me what it was doing.

I still use local models. I also use cloud models. The point is not to declare one virtuous and the other suspect. Different work deserves different machines.

What I wanted was to be the person who decides, with enough information to decide well and a record afterwards that does not depend on memory. That means the boundary is visible before the run, fixed during it, and written down after it.

The fan can still spin. Now the title bar names why. The route says where. The receipt says what happened. And Stop means stop.

The machine is allowed to work hard. It is no longer allowed to work mysteriously.
