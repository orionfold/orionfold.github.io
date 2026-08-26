---
title: The Edit I Never Approved
date: 2026-08-22
summary: "A proofreader quietly changed code inside my note. That silent edit became Flow's first rule: AI may propose a change, but only you can save it."
hero: ../../assets/story/the-day-i-stopped-trusting-invisible-edits/hero.jpg
heroAlt: "A writer reviews glowing revisions from a paper while holding a physical approval control in a rain-lit studio."
tags:
  - Orionfold Flow
  - AI-native work
  - Building in public
---

There is a particular kind of quiet that follows a mistake you cannot see.

I was proofreading an ordinary working note, the kind that accumulates while I am building something. It held half a decision, half a reminder, and a fragment of code pasted in so I would not lose it. I asked the proofreader on my Mac to clean up the writing.

It reached inside the code block and changed the code.

The comment had read `// recieve teh value`. Two typos, made at speed. What came back read `// Receive the value`.

Correct English. Wrong edit.

Inside a code fence, a typo can be data. Fixing it without asking is not a courtesy. It is a change to the thing I am building.

Nothing told me. There was no diff, no approval, and no record. I happened to notice because I looked at that exact line. If I had not, the change would have travelled into whatever the note became. I would have carried it forward believing I had written it.

That was the moment I stopped thinking about AI as a better autocomplete. The question was no longer whether the model was right. The question was how software could make authorship invisible and still call the result assistance.

## I tried to prove myself wrong

The Mac provides a way for an app to mark ranges that Writing Tools should leave alone. I wanted this to be my mistake. A bad configuration would have been easier to fix than a bad assumption.

So I built a small test, configured the text view correctly, and watched for the protection call. Across five runs, the call never arrived. I reproduced the underlying behavior outside Flow from the macOS menu as well. In that test, the same small task failed four times out of five. Reusing the session failed six times out of six.

Those are dated development observations, not a claim about every Mac or every version of macOS. They were enough to settle one product decision for me.

This was not really a complaint about a particular feature. It exposed an assumption that appears across AI software: if the model is probably right, apply the change and let the person keep moving.

That can feel magical in a text message. It feels different in a client proposal, a board update, a shareholder letter, a hiring plan, or a piece of code. The more polished the result looks, the easier it is to forget that a decision occurred.

I did not want less AI. I had already seen how much more work I could finish with a model in the loop. I wanted to remain the author of that work.

## The rule

There is a useful difference between a tool that edits your work and a tool that proposes an edit. The first saves time by taking a decision. The second saves time while leaving the decision with you.

So I wrote one rule:

**Text changes in Flow only when you type the edit or approve the proposal.**

Not usually. Not only for important files. A rule with exceptions becomes a preference, and preferences do not survive a deadline.

That meant Flow could not simply wrap an invisible rewrite in a friendlier screen. An AI action had to produce a proposed change. The proposal had to show the exact before and after text. It had to stay separate from the file until a person chose what happened next.

Approval is not a polite button displayed after the real work has already happened. Until you approve, the file on disk has not changed.

That distinction also changes failure. If the document moves while you are reviewing, Flow does not force the proposal onto newer text. The proposal belongs to the state it was made from. Stale ground stops the save. You can return to the document, understand what changed, and ask again.

The model is still allowed to be ambitious. It can draft, restructure, translate, search, and refine. The boundary is not about making AI timid. It is about keeping a suggestion visibly different from a decision.

## The diff is the product

For a while I described Flow as a Markdown editor with AI. That is accurate and misses the point.

The product is the distance between a suggestion and an accepted change.

You can see that distance in the diff. You can read the proposed words before they become your words. You can see the evidence and checks attached to the run, and where the work ran. You approve, decline, or leave it waiting.

I did not arrive at this because I enjoy ceremony. I arrived at it because memory is a poor audit trail.

Six weeks later, “I think the AI changed that paragraph” is not useful. It does not tell you what the paragraph said before, why the new version looked better, or whether the source changed after the proposal was made. A revision you can inspect and restore does.

After approval, History shows the saved revision. The receipt records what ran without storing your prompt or API key. The record is not there to make ordinary writing feel regulated. It is there so an important question has somewhere better to land than your memory of a Tuesday afternoon.

This structure protects small decisions too. Declining a proposal is not a failed run. Leaving one unresolved is not consent. Closing a review is not the same as saving it. Each state says what actually happened.

The code-block mistake taught me that confidence is not the same as authority. A perfectly fluent change can still be the wrong change to make.

## The file underneath

The approval rule would mean less if Flow also owned the only readable copy of the document.

Flow works with ordinary Markdown files in folders you choose. Reading, writing, searching, organizing, and exporting do not depend on an AI subscription. If Flow disappeared, the files would still be yours and another editor could open them.

That is not a side benefit. Open files make approval meaningful.

You are not choosing between accepting the AI's version and losing access to the work. You can compare the proposal with a source you control. You can refuse the change. You can leave with the document, its readable history, and no proprietary format standing between you and what you wrote.

The file is the durable artifact. AI is a visitor with useful suggestions.

Once I saw the product that way, many later decisions became simpler. A search result should return to the current source before claiming a passage is still there. A chart should be redrawn from readable data rather than survive as a detached picture. A route should not cross from a local model to the cloud because a fallback found it convenient. Each is the same argument at a different scale: the software must not quietly replace a fact or decision that belongs to you.

## What I was really trying to keep

I used to look at AI-assisted work and wonder which sentences were mine.

That feeling is hard to name. The document looks finished, but your relationship to it is thin. You did not quite write it. You did not quite review it. You mostly watched it arrive.

Flow is my answer to that feeling.

Authorship does not require doing every mechanical step yourself. A conductor does not play every instrument. A director does not operate every camera. What matters is that the consequential choices remain visible and that the final work carries a decision you can stand behind.

AI can move quickly. It can find alternatives I would not have considered and turn a rough thought into something worth reviewing. Flow lets it do that work without pretending the result became mine before I chose it.

The code-block mistake gave me the rule. The rule gave the product its shape.

AI proposes. You review. Only approval changes the file.
