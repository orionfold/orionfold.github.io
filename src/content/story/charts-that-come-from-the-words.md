---
title: The Chart That Stayed Wrong
date: 2026-08-26
summary: "The numbers changed, but the chart I had pasted into the document stayed wrong for six weeks. Nobody noticed because it still looked finished."
hero: ../../assets/story/charts-that-come-from-the-words/hero.jpg
heroAlt: "A creative director conducts written pages as they transform into charts beside a cracked stale graphic."
tags:
  - Orionfold Flow
  - AI-native work
  - Building in public
---

Someone pointed at a bar in a document I had written and asked where the number came from.

I could not answer.

I had built the chart in a spreadsheet, exported it as a picture, and pasted the picture into the document. That was six weeks earlier. Since then, the spreadsheet had moved and the numbers had been corrected twice.

The picture kept showing the old shape. It looked as finished and confident as it had on the day I made it.

Nobody noticed.

That is the part that stayed with me. A wrong sentence often starts an argument because people read sentences closely. A wrong chart can sit in the middle of a page looking like evidence. Its polish protects it from the question it most needs.

I searched for the source and found a file called `chart-v3-FINAL.png`. That was where the trail ended.

The chart had once been right. The document gave me no way to know when it stopped being right or which numbers had produced it.

## The chart had become a photograph

The failure was not simply bad housekeeping. It was the way the tools were arranged.

The numbers lived in one file. The picture lived in another. The document held a copy of the picture. Nothing connected the three except my memory.

When the data changed, no error appeared. The document still opened. The chart stayed crisp. The gap between the picture and the truth widened quietly.

I have seen the same arrangement in board decks, client proposals, and hiring plans. A chart is made for a moment, exported, and treated as finished. Later the surrounding words are edited with care while the image remains untouched because it no longer looks editable.

The picture has become a photograph of an earlier decision.

I wanted the opposite arrangement: numbers inside the document, readable as text, with the picture drawn from those words every time the document opens.

Not synchronized. Derived.

Synchronization asks two artifacts to keep agreeing. Derivation leaves only one source of truth. If the chart is made from the words, it cannot be older than the words.

## The picture is in the file

In Flow, a chart begins as a fenced block of plain text. It names the chart, its title, source, and rows of labelled numbers.

```
chartType: Bar Chart
title: Enterprise carried the quarter
source: Finance close, 6 August 2026
```

The data follows in the same block.

That text is the chart. It is not a pointer to a service or a cached picture. Flow reads it and draws the result on the Mac, offline.

Correct a number and the chart changes because there is no second artifact waiting to be refreshed. The question that stopped me in the meeting now has an answer in the same place as the picture: here is the number, here is its label, and here is the source I wrote beside it.

Flow draws 34 chart types and 20 diagram types this way. Bars, lines, scatter plots, waterfalls, heatmaps, timelines, flowcharts, and sequence diagrams share one visual system. The variety matters less than the contract: every picture comes from source a person can read.

Open the file in another editor and the source remains there. You may lose Flow's rendered view, but you do not lose the title, source, labels, or numbers.

The document degrades into a document.

That sentence became a useful design test. If a visual needs a private database or a service account to remain intelligible, the file is not carrying enough of its own meaning. A durable document should survive the tool that made it pleasant to view.

## AI can propose the shape

There is still a useful role for AI. A page of prose may contain a comparison that would be clearer as a table, or a sequence that would make more sense as a diagram.

Flow can turn selected text into a proposed table or visual. That is an AI action, so it follows the same approval path as a rewrite.

The proposal does not replace the selected lines. It adds a fenced block after them. You can inspect the source and approve or decline it before the file changes.

That placement matters. The original words remain available while I decide whether the visual clarifies them. The model cannot hide an omission behind a polished chart and remove the passage that would reveal it.

If the result cannot be drawn, Flow does not show a broken proposal. If demo data is needed to explain a chart type, the data is labelled as invented.

After approval, the ongoing relationship is ordinary and local. Edit the words. See the picture. No model is needed to keep the two together.

That boundary keeps AI in the useful role. It may help choose a representation. It does not become the hidden owner of the artifact.

It also means the chart can be reviewed like any other part of the document. The proposed source is visible before the image earns its finished appearance. Approval applies to the numbers and labels, not merely to whether the rendering looks attractive.

## Beauty without opacity

I used to think the chart was the polished part and the data was scaffolding.

The six-week mistake reversed that.

The source is the durable part. The picture is a view.

That does not require the view to look technical or unfinished. Flow gives the rendered document most of the screen. Charts, tables, diagrams, and images belong inside the work, not in a small preview surrounded by the application's controls.

The visual can be beautiful without becoming opaque.

In fact, showing the document at full scale makes errors easier to feel. A bar that is too tall attracts attention. A label that does not fit reveals a weak category name. A diagram with too many branches tells me the argument may be too complicated. Presentation becomes another way of reading the source.

But the source remains one click away. I can move from impression to inspection without leaving the document or hunting for the spreadsheet that may have produced it.

This is different from embedding an image and keeping the data nearby as a courtesy. The rendered chart has no independent life. It is always the current interpretation of the text in the file.

## The answer beside the bar

Now, when someone asks where a bar came from, the answer sits in the same file, beside the chart, in words and numbers I can inspect.

That does not guarantee the number is correct. I can type the wrong value. The source I cite can be mistaken. A readable error is still an error.

What changes is the path to correction. The number can be challenged, traced, edited, and reviewed without reconstructing a lost production process. The picture changes with it because the picture was never a separate claim.

An error that stays connected to its source can be found and repaired. A polished artifact without a source can only be replaced or believed.

The chart that stayed wrong for six weeks could not survive in that arrangement. There is no stale picture to trust and no `FINAL` filename standing in for provenance.

If Flow vanished tomorrow, the document would still hold the source. Another editor could show the labels and numbers even if it could not draw the same chart. The work would remain open to inspection.

That is what I wanted when the question came across the table. Not a more impressive visual. An answer I could defend.

The picture is redrawn from the work.
