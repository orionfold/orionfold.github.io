---
title: The Day I Stopped Trusting Invisible Edits
date: 2026-08-22
summary: "My Mac's built-in AI quietly rewrote the inside of a code block. No diff, no approval, no record. That one silent edit is why I spent a year building Flow, and why it ships today."
tags:
  - Orionfold Flow
  - AI-native work
  - Building in public
---

There is a particular kind of quiet that follows a mistake you cannot see.

I was working on a note. An ordinary one, the kind that piles up when you are building something: half a decision, half a reminder, a fragment of code pasted in so I would not lose it. I ran the proofreader that comes free with my Mac. It did what proofreaders do. It fixed my typing.

It also reached inside a fenced code block and changed the code.

The comment had read `// recieve teh value`. Two typos, the honest kind you make at speed. What came back read `// Receive the value`. Corrected. Capitalized. Correct English and, in that context, entirely wrong. Code is not prose. Inside a code fence, a typo is data. Fixing it is not a courtesy. It is corruption.

Here is the part that kept me up. Nothing told me. No diff appeared. No approval was asked. No record was kept. If I had not happened to look at that exact block, that change would have travelled into whatever the note became, and I would have carried it forward believing I had written it.

I checked whether I had misconfigured something. Apple publishes a way for an app to protect ranges of text from Writing Tools, and I wanted to believe I had simply failed to call it. I set up the test properly and watched. Across five invocations on a correctly configured text view, that protection was never called at all. I reproduced the underlying failure outside my app too, straight from the macOS menu, so I could be sure I was not looking at my own bug. The same trivial prompt failed four times out of five. With a reused session, six out of six.

I want to be careful here, because it would be easy and cheap to turn this into a complaint about one company. That is not the story. The story is a design assumption that has quietly spread across almost every AI feature shipped in the last two years, and it goes like this: *the model is probably right, so just apply the change.*

That assumption is fine when the stakes are a text message. It is not fine when the document is a client proposal, a board update, a shareholder letter, a hiring plan, or a piece of code. It is not fine when your name is on it.

## What I actually wanted

I did not want less AI. I want a great deal of AI. Over the past year I have shipped more work than in any comparable stretch of my career, and almost none of it happened without a model somewhere in the loop.

What I wanted was to stay the author.

There is a difference between a tool that does your work and a tool that proposes work you accept. The first one saves you time and quietly takes your judgment. The second one saves you time and hands your judgment back, sharpened. Everything I have built since that afternoon comes from insisting on the second shape.

So the rule I set was narrow enough to be testable:

**The only ways text changes in Flow are an edit you typed, or a change you approved.**

Not "usually." Not "for important documents." The only ways. If a rule has exceptions, it is not a rule, it is a preference, and preferences do not survive a deadline.

The first consequence was uncomfortable. It meant switching off the operating system's own Writing Tools inside my app. Not hiding it, not warning about it. Off. A rewrite that lands with no diff, no approval and no record is not a feature I can wrap safely. It is a hole in the floor. You do not put a rug over a hole in the floor.

## The diff is the product

Once I stopped thinking of AI as something that edits your document and started thinking of it as something that *proposes* an edit, the whole shape of the app fell out.

Every AI action in Flow arrives as a proposal. You see the exact change, down to the character. You see what evidence supports it and, just as importantly, what it does not. You see which checks ran. Then you approve or you reject, and either way that decision is recorded.

That last clause carries more weight than it first appears. An approval nobody wrote down is just a feeling you had on a Tuesday. Six weeks later, when someone asks why a paragraph in a board update says what it says, "I think the AI suggested it and it looked right" is not an answer anyone can use. A record is.

I did not arrive at this because I love bureaucracy. I arrived at it because I kept losing arguments with myself. I would look at a document I had produced with AI help and genuinely not remember which parts were mine. That is a strange and slightly hollow feeling, and I do not think enough people are naming it. Approving each change fixes it, not through discipline, but through structure.

## What it turns out I was really building

For a long time I described Flow as a Markdown editor with AI in it. That description is accurate and almost completely useless, in the way that describing a car as a chair with wheels is accurate.

Flow is roughly ninety percent document and ten percent machinery. When you open it you are looking at your own writing, rendered properly, on your own Mac, from ordinary Markdown files in ordinary folders you already have. There is no database to import into and no cloud to sync with before you can read your own words. If Flow disappeared tomorrow, every file would still be sitting exactly where it was, readable in any text editor written in the last forty years.

That is not nostalgia. It is the only arrangement where the promise underneath everything else can be true.

**Your documents are free forever. The AI is what you pay for.**

Reading, writing, searching, organizing, exporting: all of it is free, permanently, with no account and no expiry. Not a trial that turns into a wall. Not a free tier that quietly becomes read-only when you stop paying. Free.

I can make that promise cleanly because of how the app is built. There is exactly one place in the entire product where a permission is checked, and it sits above the part that talks to models. Everything past that line is the subscription. Everything else is yours. It is not a list of decisions scattered through a codebase that might drift apart over the years. It is one line, in one place.

Which means if you subscribe and later stop, here is precisely what happens: the AI stops. That is the whole list. No document locks. No read-only mode. No export wall. No watermark. Your files stay open and editable, because they were only ever your files.

## The part I expect to be argued with

Local models are part of the subscription too.

I know how that sounds. Flow can run models directly on your Mac, with no network involved, and it would be an easier sell to say that once the model is yours the software is free. Several people have told me to say exactly that. It would be false, so I am not going to.

What you pay for is not the words the model produces. Flow never charges for those and never touches your provider bill. What you pay for is everything around the model: the routing that picks which one runs, the tools it is allowed to use, the approval step, and the receipt it writes. That layer costs the same to build whether the model is on your machine or on someone else's, and it is the entire reason the output is safe to accept.

I would rather lose a sale to that sentence than earn one by blurring it and issue a refund in a week.

## What today is

Flow is out. You can download it and open a folder of your own files right now, and the whole document side works forever without paying anyone.

If you want the AI, it is ten dollars a month, or ninety-six a year if you would rather pay once and forget about it. One licence covers one person across as many of your own Macs as you like. Nobody counts your machines.

And you get a stretch of Pro access to try properly before deciding. Not a countdown that burns while you are on holiday: a day is only spent on a day you actually use the AI. Use it hard for a week, ignore it for a month, come back and your remaining days are still there waiting.

I built this because a machine changed my work without telling me and I could not prove what it had done. Nothing in Flow can do that to you. Every change arrives as a proposal, in your hands, with a record.

That is the whole idea. The rest is details, and I will spend this week on them: where the AI actually runs and what it costs, how search finds the exact passage, why the fastest model on your Mac is probably not the one you picked, and what happens to a document that is far too long to fit anywhere.

One a day. Starting tomorrow.

Today, though, you can just open it.
