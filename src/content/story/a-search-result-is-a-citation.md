---
title: A Search Result Is a Citation, Not a Guess
date: 2026-08-25
summary: "My search result highlighted the wrong paragraph. That is why Flow re-checks every passage byte for byte when you click, and why a 50-page document is four reviews, not a refusal."
tags:
  - Orionfold Flow
  - AI-native work
  - Building in public
---

I clicked a search result and it took me to the wrong paragraph.

Not a wrong file. The right file, opened to roughly the right area, with a highlight sitting confidently over four lines that had nothing to do with what I searched for. I had edited that document two days earlier and added a section near the top. Everything below slid down, and the result had not moved with it.

The bad part is not that it was wrong. Software is wrong all the time. The bad part is that it looked exactly as right as a correct result. Same highlight, same colour, same scroll-into-view animation. Nothing distinguished "here is your passage" from "here is where your passage used to live."

I sat with that a while, because I had been about to quote it.

## What a search result is actually promising

When you search your own notes and click a result, the software makes you a promise: the words you asked about are here, at this spot, in this file. That is a citation, the same promise a footnote makes in a book. And a footnote pointing at the wrong page is worse than none at all, because a missing one makes you check, while a wrong one makes you stop checking.

A citation that drifts does not fail loudly. It fails by looking fine. It gets copied into a proposal, a board update, a letter to people who trust you, and the error travels with your name on it. You did not make it up. You believed your own tool, the one thing you are supposed to be able to do.

Most editor search works the way mine did that afternoon. It records where a match was, usually as a line number, and later scrolls you back there. It is not lying. It does not know your document changed underneath it. A line number is a coordinate on a map, and the ground moved.

So I wrote down the rule I wanted.

**A search result should be verified against the file at the moment you open it, or it should say so.**

Not "usually verified." Not "verified for files we think are unchanged." Verified when you click, or honestly downgraded. Three outcomes you can tell apart, never a silent wrong highlight.

## Byte for byte, at the moment you click

Every result carries an anchor into the exact bytes you wrote. When you click, Flow does not simply scroll. It goes back to the file as it exists right now, cuts out the passage the anchor points at, and compares that text character by character against what it stored when it found the match. Identical? Then it highlights it. That is the good case, and the common one.

If the file changed, Flow does not shrug and highlight the old spot anyway. It runs the search again against the current bytes and takes the nearest surviving match, so passages that moved get found again. That is the second case, the one my old tool got wrong.

And if the passage is gone, because you deleted or rewrote it, Flow says so. It does not pick something nearby that is roughly the right shape. There is no worse behaviour available to a citation tool than confidently pointing at a stranger.

One more refusal in the same family, small enough most people will never notice. If you delete a note, its result can never quietly redirect you to a same-named file in another folder. Two files called `notes.md` are not the same file, and no amount of convenience is worth pretending they are.

## The other thing a match can be

There is a second confusion hiding in search. A file can match your query because its **name** matches, or because its **contents** match. Those are different claims. "There is a file called budget-2026" and "this file says something about budget-2026" are not the same fact. One is evidence, the other a signpost.

In Flow they are kept apart structurally. The thing representing content evidence cannot be built out of a filename hit, so it is not a rule someone has to remember in a code review. A file's name can take you to the file. It cannot become proof of what the file says.

## Twenty-two milliseconds, and why I measured it at all

None of this matters if search is slow, because slow search does not get used. You go back to scrolling and guessing, and a tool you avoid protects nothing.

So there is a performance gate, written as code rather than a note in a document. It runs against a generated library of 10,000 notes on an Apple-silicon Mac, and if any budget fails, it exits with an error and the build fails.

Measured on that 10,000-note library, text search came back at 22.3 milliseconds at the 95th percentile, median 13.8. The app's own budget is 200 milliseconds, so it sits under its own ceiling by nine times. That is faster than you can notice. The results are simply there.

Editing a note does not throw the work away either. Re-indexing after an edit to a 100 KB note measured 82.3 milliseconds at the 95th percentile, so working on a big document does not quietly rebuild everything behind you. The first full index of all 10,000 notes took 1.1 seconds, 13.8 times faster than before I optimised it, and results stream in while it works.

One honest note: those come from a generated 10,000-note library on one Mac. That is a measurement, not a guarantee, and your library is not that library.

Here is the part I am proud of. The benchmark does not only time the search. It takes every result, goes back to the real source file, cuts the passage out again, and compares it byte for byte. If any anchor does not still yield the identical text, the gate fails.

That matters more than the speed. Speed is easy to buy if you are willing to be wrong occasionally, and a fast search returning stale citations would sail through a timing test. Tying the checks together means the app cannot get quicker by getting looser. The gate asks both at once: was it fast, and was it true?

## Deterministic, which is a plain word once you unpack it

Search gives you up to 100 results, and they come back in the same order every time.

That sounds like a shrug until you think about why it might not be true. Search work happens in pieces that finish at slightly different moments depending on what else your Mac is doing. If order depends on which finished first, the same query typed twice gives two different lists, and you cannot tell a colleague "it is the third one down."

So ordering is fixed by rules, not by timing. Same query, same order, on a busy Mac or an idle one.

Typo tolerance is published and bounded in the same spirit. Four to seven characters allows one typo. Eight or more allows two. Below four, fuzziness does not apply at all, so a short exact search stays exact. I could have made this adaptive and clever. Clever would mean you never quite know whether you searched for what you searched for.

## It knows what you have not saved yet

If you have a document open and have typed into it without saving, Flow's search knows those words. Open editor buffers are indexed live and win over whatever is on disk. You are not searching a photograph of your work from four minutes ago. You are searching your work.

The same index serves everything: all your open folders at once, the sidebar and the full search tab without restarting your session, and the quick-capture window, which uses that same index and ranking rather than a staler copy. One index, one set of answers, everywhere.

When Flow cannot cover something, it says so. Skipped notes are listed with the reason, and the cache size is visible. The index is disposable, derived data: your Markdown files are the only authority, rebuilding never touches a document, and if the two disagree, your files win, because they are the thing that is real.

All of it runs on your Mac. Exact search is local and deterministic. An optional "Related" layer uses Apple's on-device sentence embeddings to surface notes about the same thing without sharing your words. It measured 438 milliseconds at the 95th percentile against its own 500 millisecond budget, though that timing used a stand-in model, so it measures the machinery, not how good the matches are. Related results sit **underneath** the exact ones, never replace them, and can be switched off. Nothing goes over the network, the raw text of your notes is not stored in the Related cache, and the Settings pane says both in plain words.

## The document that was too big to help with

Now the other half, the same idea wearing different clothes.

Until recently, if you asked Flow's AI to improve a document longer than about 16,000 characters, roughly 2,700 words, it refused. Flatly. Not great, but refusing was the *second* worst option. The worst is what most tools do: quietly cut your long document to the part that fits, work on that piece, and hand back an answer describing the survivor. Nothing tells you. The output reads like an assessment of your whole document because it is written in the voice of one. You approve it, and the last thirty pages were never read.

That is the invisible edit problem moved one room over. So the question was never "how do we let bigger documents through." It was "how do we handle a long document without pretending we read more of it than we did."

## Four reviews, not one refusal

Your 50-page document is not too big. It is four reviews.

Flow plans it as ordered parts following your document's own structure rather than counting characters and cutting. Boundaries fall only between top-level blocks: a split never lands inside a code block, inside front matter, or inside any protected region. The parts plus the protected spans put the document back together byte for byte, and that is a tested invariant rather than a hope. If it stopped being true, the tests would fail before you saw it.

Then you review each part on its own, with its own exact change, its own evidence, its own receipt. There is no whole-document verdict computed from a fraction of it, because that number would be a fiction and there is nowhere in Flow for it to live. Instead you get a count a person can check: "You approved 3 of 4 parts. Everything else stays exactly as written."

No truncation is structural, not a promise. Every request to the model carries exactly its part's bytes, and the save refuses unless the document still holds exactly the text that was sent. If your document changed while you reviewed, the save does not go through on stale ground.

The obvious objection is that models keep advertising they can read more at once, so why not widen the window and let the whole document through? Because I measured it, and it is a trap. How much a model can genuinely use runs at well under half of what it advertises, and quality degrades sharply past roughly half of that. It is worse on structured text, the kind with headings and lists and code, which is exactly what you would want a long-document feature for. So "just make it bigger" does not fail with an error. It fails by getting quietly worse in the middle, where you cannot see it. A loud "runs in 4 parts" beats a silent quality collapse.

One boundary I need to state plainly, because blurring it would be convenient. Splitting a long document into parts is currently a local-model capability. Hosted models still decline documents past one window, so on a cloud provider the long-document path is not open to you yet. I would rather write that sentence than let you find it on a deadline.

## Answered before the menu closes

Open the Agency menu and it already tells you: "Improves this document in about 2 parts." That is computed on your Mac before you choose anything, with zero network calls. An action that cannot be split says "Too long to check at once" right there in the menu, before you pick it rather than after a wait. No spinner, then a wall.

The word "about" is deliberate and stays. The exact split is computed when the run starts, so the menu gives you an honest estimate rather than a number dressed up as a fact.

Then you review in any order. Parts appear as a strip of chips you can approve, decline, or skip. Skipping leaves a part waiting, with no penalty and no nagging.

The batch button is my favourite piece of restraint here. "Approve remaining" appears only **after** you have individually approved at least one part, so bulk trust is earned by seeing what the run actually does. Even then, each batched part gets its own save and its own receipt. Batching is a convenience for your hands, not a shortcut through the record.

Close the review halfway through and it parks. Reopen it and you continue where you left off. Protected regions are reported as protected, not silently skipped: if Flow did not touch your code block, it says so, rather than letting the coverage count imply it looked.

## What the probes actually showed

Two real runs, so this is not just architecture talk. A 26,202-character document planned into 2 parts. Approving part 1 fixed its 64 paragraphs on disk and left the other 43 untouched, and the boundary fell exactly between blocks, as designed.

A 60,807-character document planned into 4 parts, seeded with 16 deliberate errors. Approving one part out of order took it to 12, and only that part's sections changed. No helpful sweep through the neighbouring text.

On scale: parsing and planning was measured through 620,000 characters, about 90,000 words, at roughly half a second, with no cliff. It stays linear all the way through. Two caveats belong with that number. It measures analysis and planning, not how long a model takes to generate anything, so it is not end-to-end AI speed. And typing latency in a document that size is a known open issue I have not fixed, so I make no claims about the editor at 90,000 words.

One more thing that only shows up if you run this on your own machine. A long part on a 26-billion-parameter local model legitimately takes one to two minutes. Flow's original 60-second timeout, inherited from talking to servers, was killing local runs partway through generation. Not a model problem. My default was wrong about which world it was in. Measured, then raised to 10 minutes.

## The words on the screen

Small thing, but load-bearing. The interface says "parts" and "sections." It does not say chunk, segment, context window, or tokens, and a check in the repository enforces that vocabulary so it cannot drift back as features are added in a hurry.

Those are not simpler versions of the real words. For your purposes they *are* the real words. "This document runs in 4 parts" is a fact about your document. "This exceeds the context window" is a fact about a machine you did not buy.

## Why any of this is worth paying for

Same awkward paragraph as the last two days, and it stays awkward on purpose. Running models on your own Mac is part of the subscription. Flow can do the whole long-document flow with no network involved, and it would be an easier sentence to write if I said that once the model is on your machine the software is free. It is not, and I am not going to say it is.

You are not paying for the words the model produces. You are paying for the layer around it: anchors re-checked byte for byte at the moment you click, a benchmark that fails the build when a citation drifts, a plan that follows your document's structure instead of a character count, a save that refuses on stale text, per-part receipts, and a coverage line that counts instead of scoring. That layer costs the same to build whether the model sits on your desk or in a data centre, and it is the entire reason the output is safe to accept.

Ten dollars a month, or ninety-six a year. One licence for one person across as many of your own Macs as you like. And you get a stretch of Pro Days to try it properly, where a day is only spent on a day you use the AI.

Reading, writing, searching, organising and exporting stay free forever. Search sits on the document side of that line, so the byte-verified return-to-source I have spent this whole piece on costs you nothing, permanently. Not a hook. Just where the line falls.

## What I actually wanted

I did not want a faster search. I already had one. It was fast and it was wrong, and speed made the wrongness arrive sooner.

What I wanted was to click a result and quote it without going back to check, and to ask for help with a long document and know how much was really read. Both come down to the same stubborn thing: the tool should tell you what it actually did, including when that was less than you hoped.

A citation that drifts is worse than no citation. A review covering three parts out of four is worth having, as long as it says three out of four.

Tomorrow I will write about why the fastest model on your Mac is probably not the one you picked.

Today, though, you can open a folder of your own files, search it, and click a result knowing it was checked at the moment you clicked.
