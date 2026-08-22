---
title: The Fan Spun for Twelve Minutes and Nothing Told Me Why
date: 2026-08-23
summary: "A proofread ran my Mac's fans for twelve minutes and the app said nothing. That is why Flow makes you pick where AI runs, keeps it there, and writes down what it cost."
tags:
  - Orionfold Flow
  - AI-native work
  - Building in public
---

It was the fan that got me, not the bill.

I had asked for a proofread. A short document, nothing dramatic. I went back to what I was doing in another window, and after a minute the Mac started to make that sound. Not the polite sound. The other one. The one that means something is working very hard and has been for a while.

Twelve minutes later it was still going.

I sat there and tried to answer three ordinary questions, and I could not answer any of them. Which model was doing this? Was it running on my machine, or had my text gone somewhere? Was this costing me money right now, and if so, how much?

The app I was using had nothing to say about any of it. So I opened Activity Monitor and squinted at process names, which is like asking your car why it is making a noise and being handed a list of its bolts.

That same morning I found something worse. A model helper still running at 84% of the processor, working away on nothing, with the app that started it already quit. It had been abandoned and left on.

I filed both as urgent against my own product, because by then I was building Flow and this was my problem to fix.

## The question nobody asks you

Yesterday I wrote about the day a proofreader silently reached into a code block and changed the code, and how that one invisible edit set the rule the whole app is built on: text changes only when you type it or approve it.

This is the other half of the same idea, and honestly it is the half people think about less.

Approving a change tells you *what* went into your document. It does not tell you where your document went to get that change.

Most AI tools do not ask you. There is a dropdown in settings with some provider names in it, you pick one, and after that your text leaves your machine whenever the software decides it needs to. If the first attempt fails, it quietly tries another one. You never see the moment your words crossed a line, because nothing in the design treats that as a moment.

I do not think that is malice. The boundary was simply invisible to the people building it. Everything ran in the cloud, so the cloud was just where things ran.

But it is not invisible to you. Some documents you do not mind sending anywhere. Some documents you would lose your job over. The software has no idea which is which, so it should not be the one deciding.

## Four rooms, four doors

So Flow does not ask you to trust a provider. It asks you one question, and it asks it about your whole setup rather than about each model.

Where may work run?

There are four answers, and Flow calls them execution domains. Think of them as four rooms, each with its own door and its own lock.

**Local** is your Mac. The model runs on hardware you already own. Your text does not leave the machine.

**LAN** is another computer on your own network. Your text leaves this Mac, but stays inside your building.

**Cloud prepaid** is a subscription you already pay for. The work runs on someone else's machines, and the cost is already covered by whatever you pay each month.

**Cloud postpaid** is billed per use. The work runs remotely, and the meter is running.

Each has its own switch, separate on purpose. You can permit a subscription you already pay for and refuse the one that bills by the use. That is not an exotic preference. That is most people, once you put the choice in front of them.

Each domain also states plainly what it means, in the app, in words. The Local domain reads "Stays on this Mac. Free, it runs on hardware you have." The LAN domain sits right below it and says the opposite just as plainly: "Leaves this Mac." Nobody has to infer anything from a product name.

Under each domain sit the actual providers, and here is a small design detail I am proud of. A domain gets a switch. A provider gets a checkbox. They look deliberately different, because they are different kinds of decision. Permitting a domain opens a boundary. Enabling a provider is a choice inside a boundary you already opened. The heavier control is for the heavier decision.

One caution, because I would rather say it than let you find out: the LAN domain exists and you can permit it, but no provider ships for it yet. The door is built. There is nothing behind it today.

## The moment I care most about

Here is the rule that made all the rest of it worth building.

**A fallback that would cross a domain stops and asks.**

Say the model on your Mac fails. Maybe it ran out of room, maybe it fell over. Trying a different model on your own machine is plumbing. Flow just does it, because nothing about your situation changed. Your words are still where they were.

Leaving your Mac is not plumbing. That is a decision. So Flow stops and asks you, every time, even in the middle of a run that was going fine a second ago. It will not quietly upgrade its way out of a problem by sending your document somewhere you did not agree to.

That is the difference between a tool that respects a boundary and one that draws it on a settings screen then steps over it when things get inconvenient. A boundary that bends under pressure is a suggestion with good manners.

Before any run that does leave your Mac, Flow shows you what it is about to do: what would be sent, where to, roughly how many bytes, and an estimated cost. It always says the estimate is an estimate, and it names the price list the number came from. And if you cancel, that is a complete stop, reported as a stop. Not an error. Not a failure. You changed your mind, which is allowed.

## Detection is not permission

Flow will look at your machine and find what is already there. Local runtimes you have installed, agent subscriptions you are already signed into, keys sitting in your environment. Eight providers, at the current count. That is what discovery finds today, not a list of partners.

Finding is not enabling. Nothing is switched on because Flow noticed it. It sits in a list, unlocked by nobody, waiting for you.

Two details underneath that I think matter more than they sound.

Flow never reads or copies another app's credentials. If it offers to adopt a key from your environment, it shows you the variable's **name**, never its value. Your key is not something Flow needs to display back at you to prove it found it.

And when a provider cannot be used, Flow lists **every** reason it is blocked, not just the first one it hit. Each reason carries a button that scrolls you to the exact control that fixes it. I have lost too many hours to software that reveals one wall at a time.

## What it costs, before and after, and never a guess

Cost is where most AI tools go soft, and I understand why. A price tag next to a button makes the button feel expensive.

Flow shows it anyway, in three places, treated as three different kinds of fact.

**Before.** There is a sortable table of every model you have connected or could connect. Rates per million words of input and output, and what one request would actually cost. You can resize the request and every row re-prices. Models that run on your Mac show as free, because they are, and I mean that narrowly: no per-use charge is owed for running them. If a model has no published rate, its row shows a dash and says so. It never shows a zero. A zero is a claim. A dash is the truth. Every figure on that table says where it came from.

**During.** There is a readout in the title bar telling you what Flow is using right now. Memory, processor, whole-Mac graphics, and the machine's own heat verdict in plain words: Cool, Warm, Hot, Too hot. Not a temperature. Nobody can act on a temperature. And while a run is going, the readout names the model doing it, so "which model is the fan about" finally has an answer.

**After.** The receipt. This is the part that took the longest and matters the most.

## Recorded to the digit

A receipt records what actually happened. Not what Flow expected, not what it estimated. What happened.

Which model answered. Where it ran. Where the key came from, Flow's own keychain or your environment. If a fallback happened, what it fell back **from**. And when the same model both wrote a change and judged whether the change was good, the receipt says so out loud, because a model marking its own homework is not an independent second opinion and should never be dressed up as one.

The cost is recorded only as observed fact. If the provider reported its own charge, that is the number. If not, Flow prices the actual usage with its own price table, and records which version of that table it used, so the figure still makes sense in a year when rates have moved. If neither is available, the receipt says plainly that the cost is unavailable. An estimate is never written down as a charge. Those are different things and Flow keeps them different.

The arithmetic is exact decimal, not the sort of floating point maths that turns ten cents into 0.10000000001. A real billed run of 105 words in and 149 words out recorded **$0.00425**, and you can reproduce that to the digit.

That number is small and that is the point. Four tenths of a cent. Most software would round it away. But a system honest about four tenths of a cent can be trusted with four hundred dollars, and one that shrugs at the small number has told you what it will do with the big one.

A run on your own Mac records **no** charge at all. Not a zero pretending to be a measurement. Nothing was owed, so nothing is recorded, and in the ledger that is deliberately distinguishable from a run where the cost could not be measured. Those two states look nothing alike, because they are nothing alike.

One thing that never appears in a receipt: your prompt, and your API key. Not by policy. There is structurally nowhere in a receipt for them to go.

## One run, one card

All of a run's receipts gather into a single card.

Select a run in the Receipts timeline and you get one view of everything it did. What was checked. What the evidence concluded. What it cost and on what basis. And the exact before and after fingerprints of the document content, so the change is bound to a specific state of your file and cannot be quietly reattributed later.

Each check on that card carries two separate marks, and I fought with myself over this before deciding they both had to be there. One is the outcome that was stored when the check ran. The other is what that rule would do *today*, shown as a plain pill: "Stops the change", "Warns you", "Needs your acknowledgment".

They are two different facts. A rule you have since made stricter did not retroactively stop anything last Tuesday. Collapsing those into one number would be tidier and would also be a small lie, and small lies in a record are the ones that eventually cost you an argument you should have won.

## The honest cost of running things yourself

I said earlier that a local model is free of per-use charges, and that is true. It is not the same as free.

Your own machine does the work. You hear it. That is the real trade, and I would rather write it down than let the fan tell you later.

So Flow counts the local runs too, at zero, because zero is a measurement. On a real local run, the readout ticked to "Tokens 4.8K in, 3.3K out this session. Spent $0.00" as the run landed. Real work counted, at a genuine nothing.

Here is my favourite capture, because it is the exact scenario I started with. A thirty-billion-parameter model proofreading a 326-word document on my Mac. The readout during the run: memory 52%, processor 52%, graphics 99% across the whole Mac, heat verdict **Cool**, spend $0.00, and the model named in a badge so there was no guessing. After the run finished, the same readout read 52%, 6%, 9%, **Warm**, 485 in and 1.7K out, $0.00.

Two small things in there I keep pointing at. The heat word moved from Cool to Warm *after* the work, which is the machine's own verdict changing rather than a digit ticking. And the graphics figure is labelled "across this whole Mac" in the readout itself, not in a caption underneath it.

That last one is a refusal, and it is worth explaining. macOS does not publicly offer a way to say how much of the graphics chip any one app is using. Activity Monitor gets that number through private interfaces. Flow will not. So Flow reads a whole-Mac figure from a public source, labels it whole-Mac right there in the text, and adds a footnote saying per-model attribution is what macOS does not offer. If macOS ever stops answering, the figure disappears rather than showing you something wrong.

Three separate chances to quietly state a number Flow cannot honestly source. Three refusals. That is the whole character of the thing.

## Make it stop

Knowing what is happening is only half of an answer to a spinning fan. The other half is being able to end it.

A run shows a progress bar with plain words. "Part 2 of 4", not "this usually takes a few seconds", which is the phrase software uses when it has no idea.

Stop truly stops the model. The helper process ends and the fans wind down. It does not just close the window while your Mac keeps computing an answer that nobody will ever read. A stopped run reports "Stopped, nothing in the document was changed", which is a result, not a malfunction.

Pause waits for the current part to finish, and tells you that is what it is doing.

And two runs cannot overlap. While one is in flight the menu waits and the banner owns the Stop button, so a second request can never leave a forgotten helper chewing through memory behind another run's progress bar. That is the 84%-with-the-app-quit bug, closed by design rather than by patching it each time it comes back.

## Why any of this is worth paying for

I will say the awkward part plainly, the same as yesterday.

Running models on your own Mac is part of the subscription. Flow can run a model with no network involved at all, and it would be easier to tell you that once the model lives on your machine the software is free. It is not, and I am not going to say it is.

You are not paying for the words the model produces. Flow never charges for those and never touches your provider bill. You are paying for the layer above the model: the four domains and their locks, the fallback that stops at a boundary instead of stepping over it, the estimate before, the readout during, the receipt after, the exact decimal arithmetic, and the versioned price table that keeps a number meaningful after rates move. That layer costs exactly the same to build whether the model is sitting on your desk or in a data centre. It is also the entire reason the answer is safe to accept.

Ten dollars a month, or ninety-six a year. One licence for one person across as many of your own Macs as you like. And you get a stretch of Pro Days to try it properly, where a day is only spent on a day you actually use the AI.

The documents stay free forever, as they were yesterday and will be next year.

## What I actually wanted

I did not want to be protected from the cloud. I use it. Some work genuinely belongs out there on a machine far better than mine.

What I wanted was to be the one who decided, each time, with enough information to decide well, and a record afterwards that survives my memory of it.

The fan that ran for twelve minutes was not a performance problem. It was an information problem. My machine was working hard on my behalf and had no way to tell me what it was doing, so the only signal that reached me was noise.

Now there is a readout that names the model, four doors that only you can open, a fallback that stops at the edge rather than stepping over it, and a receipt that says $0.00425 and means it.

Tomorrow I will write about search, and how finding the exact passage in a pile of your own documents turns out to be a harder and more interesting problem than it sounds.

Today, though, you can open a folder of your own files and look at what your Mac is actually doing.
