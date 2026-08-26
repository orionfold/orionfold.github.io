---
title: The Search Result That Moved
date: 2026-08-25
summary: "I clicked the right search result and landed on the wrong paragraph. The file had changed, but the old highlight still looked certain."
hero: ../../assets/story/a-search-result-is-a-citation/hero.jpg
heroAlt: "A researcher follows a blue evidence trail through a sunlit archive to the document's current source."
tags:
  - Orionfold Flow
  - AI-native work
  - Building in public
---

I clicked a search result and it took me to the wrong paragraph.

Not the wrong file. The right file, opened near the right place, with four unrelated lines highlighted as if they were the passage I had searched for.

I had added a section near the top two days earlier. Everything below moved. The old result had not.

The dangerous part was not that the result was wrong. Software is wrong all the time. The dangerous part was that it looked exactly like a correct result. Same highlight. Same scroll. Same confidence.

I had been about to quote it.

For a few seconds I tried to make the error harmless. I knew the document. I would probably have noticed the quotation was off. Then I imagined the same result in a research note I had not opened for six months, or a client file written with someone else. The visual confidence would have done its job before my memory had a chance.

The search had found the right passage once. By the time I clicked, that fact was history.

## A result is a citation

When you search your own work and click a result, the software makes a promise: these words are here, in this file, now.

That is a citation. A footnote pointing to the wrong page is worse than no footnote because the missing one makes you check. The wrong one makes you stop checking.

A stale search result can move into a proposal, a board update, or a letter under your name. You did not invent the passage. You trusted your own tool.

The old search behavior had stored where the match was. A line number is a coordinate on a map. My edit moved the ground.

The obvious repair was to update stored line numbers whenever a document changed. That sounds simple until the same folder is open in two editors, a file is renamed outside the app, or a sync tool replaces it while search results remain on screen. Keeping a coordinate current becomes a second system trying to shadow the file.

I wanted the file itself to settle the question.

So I wrote a rule for Flow:

**Verify the passage against the current file when the result is opened, or say that it cannot be verified.**

Not when the index was built. Not when the query ran. At the moment the result becomes evidence.

## Check the words again

Each Flow result carries an anchor to the text that matched.

When you click, Flow reads the file as it exists at that moment and compares the anchored passage with the text found during search. If the bytes match, Flow highlights it.

If the file changed and the passage moved, Flow searches the current text again and opens the nearest surviving match.

If the passage is gone, Flow says it is gone. It does not highlight nearby text because it looks close enough.

Those outcomes need to look different. A verified passage can wear the confident highlight. A recovered passage can explain that it moved. A missing passage should stop rather than decorate unrelated words.

A deleted note cannot redirect to a same-named file in another folder. Two files called `notes.md` are still two different files. Identity belongs to the file, not the convenience of its name.

Filename matches and content matches remain separate as well. A name can take you to a file. It cannot become evidence of what the file says.

These distinctions add friction only when something changed. Most of the time, the result opens exactly where expected. The verification becomes visible when certainty would otherwise be false.

That is the right place for friction. A warning on every result trains people not to read warnings. A visible difference only when the source no longer supports the old result tells you something worth knowing.

## Fast enough to trust

Correct search that feels slow becomes search people avoid. They return to opening folders by hand, or they trust the first plausible answer from somewhere else.

Flow's search gate runs against a generated library of 10,000 notes. On one measured Mac, text search returned in 22.3 milliseconds at the 95th percentile. The first full index took 1.1 seconds.

Those numbers describe one generated library on one Mac. They are not a promise about every folder. The product gate is the more important part: each result is checked against its source text, and the gate fails if the anchor does not return the identical passage.

Speed and correctness are tested together. Flow cannot get faster by accepting stale citations.

Results are ordered by fixed rules, not by which search worker finishes first. The same query produces the same order. Typo tolerance is bounded: one typo for four to seven characters, two for eight or more, and none below four.

Those limits are intentionally ordinary. A fuzzy search that treats every short word as approximate can return a large, impressive cloud of possibilities. It also makes it harder to explain why a result appeared. Search should help me find my words, not improvise a new relationship between them.

Open, unsaved text participates too. If I type a phrase into a document but have not saved it yet, that live buffer wins over the older bytes on disk. Search should describe the work in front of me, not the last version the file system saw.

The index is disposable. Markdown files remain the authority. Rebuilding the index never changes a document.

That hierarchy matters because indexes are useful precisely because they are derived. They can be optimized, discarded, and rebuilt. The source cannot become subordinate to the shortcut used to find it.

## Certainty has a source

The moved result changed how I think about AI answers too.

An AI system can produce a clear summary of documents and still leave a person unable to return to the sentence that supports it. Fluency makes that gap easy to overlook. The answer sounds complete, so the path back to the source begins to feel optional.

It is not optional when the work matters.

Flow's Agency can use search to gather evidence for a proposed change, but the search result does not become true because a model selected it. The passage still has to resolve against the current file. Evidence should remain something a person can open, read in context, and challenge.

The same principle applies after a proposal is made. If the source document changes before approval, the earlier proposal does not inherit authority over the newer text. The work returns to a state where the source can be checked again.

This is not a promise that every conclusion will be right. Search can miss a relevant note. A model can misunderstand a passage. I can still make a poor judgment after reading good evidence.

The narrower promise is more valuable: when Flow shows a passage as the source, that passage is still present where the product says it is. The interface does not spend certainty it has not earned.

## The moment that matters

I did not need a more elaborate search screen. I needed the click to mean something.

The result list can be quick, fuzzy, ranked, and useful. At the moment I choose a passage, the tool must return to the source and earn the highlight.

That is a small design decision with a large effect. It lets search become part of serious work rather than a shortcut I verify by hand every time.

I still check important quotations. No software removes judgment. But checking now begins with the current words rather than a confident marker left behind by an older version of the file.

The document moved. The index could be rebuilt. The source remained the authority.

The file changed. The search result moved with it.
