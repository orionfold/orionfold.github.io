---
title: The Chart That Was Wrong for Six Weeks
date: 2026-08-26
summary: "A chart I pasted in once went stale the day the numbers changed, and nobody noticed for six weeks. Flow draws the picture from the words in your file, so the two can never drift apart."
tags:
  - Orionfold Flow
  - AI-native work
  - Building in public
---

Someone asked me a question about a bar chart in a document I had written, and I could not answer it.

The question was simple. One bar looked too tall. Where did that number come from?

I knew the answer used to live somewhere. I had built that chart in a spreadsheet, exported it as a picture, and dropped the picture into the document. That was six weeks earlier. Since then the spreadsheet had moved, the numbers underneath it had been corrected twice, and the picture in my document had gone on showing the old shape the whole time, looking exactly as confident as it did on day one.

Nobody noticed. That is the part that bothers me. A wrong sentence gets caught, because people read sentences and argue with them. A wrong chart just sits there being a chart. It has the look of a fact.

So I went looking for the source, and I found a file called `chart-v3-FINAL.png`. That is where the trail ended.

## The picture and the words had come apart

I want to name the real problem, because it is not sloppiness.

Every document tool I have used treats a chart as an object you paste in. The numbers live in one place. The picture lives in another. The document holds the picture. Those three things are joined by nothing except your memory of having joined them.

The moment any one of them changes, the other two do not know. There is no error. Nothing turns red. The document keeps rendering, the picture keeps looking crisp, and the gap between what the picture says and what is true just widens quietly week by week.

I have watched this happen to a board deck, a client proposal and a hiring plan. The pattern is always the same. The chart was right once.

What I wanted was the opposite arrangement. I wanted the numbers to live inside the document, in words I could read, and the picture to be drawn from them every time the document is opened. Not synced. Not refreshed. Derived. If the picture is drawn from the words, the picture cannot be older than the words. There is no version of the file where they disagree.

That is what I built.

## What a chart looks like in Flow

Open a document in Flow and you might see a bar chart across the page, with a title, a subtitle, a note about where the data came from, and one bar in the accent colour because it is the one that matters.

Now switch to the text of the same document and look at the same spot. There is no picture there. There is a small block of plain text that reads a bit like a list:

```
chartType: Bar Chart
title: Enterprise carried the quarter
subtitle: Revenue by segment, $k
source: Finance close, 6 October 2026
highlight: Q3
```

Then the rows of data, each one a short line with a label and a number.

That is the whole chart. That is not a pointer to a chart, or a link to a chart service, or a cached copy of a chart. It is the chart. Flow reads those lines and draws the picture, on your Mac, with no network involved.

Which means the question I could not answer six weeks late now answers itself in about two seconds. Where did that number come from? It is written in the document, four lines above the bar, in the same file, and you can change it by typing.

Correct a number and the picture is different the next moment. Not because something noticed and updated. Because the picture was never a separate thing that could fall behind.

There are thirty four kinds of chart Flow draws this way. Bars, lines, areas, scatter plots, histograms, waterfalls, pies, donuts, heatmaps, boxplots, Gantt charts and a couple of dozen more. You pick one by writing its name. You do not learn a chart language, and you do not hand-build a picture out of shapes. You say `Bar Chart` and give it rows.

Next to those sit twenty more kinds of diagram: flowcharts, sequence diagrams, state diagrams, timelines, mindmaps, org-shaped trees, entity relationship maps. Fifty four kinds of picture in total, all drawn in place, all offline, all in one house style so a document does not look like it was assembled from four different decades.

And here is the part I care about most. If you send that file to someone who has never heard of Flow, they still get the whole thing. Not a broken image box. Not a placeholder. They get the plain text, which is readable on its own, because it was written to be read: a title, a source, and rows of labelled numbers. The document degrades into a document, which is the only sort of degrading I trust.

## The gallery that made me finally believe it

While I was building this I wrote a single document that holds one example of every chart and every diagram Flow can draw. Every entry says what shape of source material gets you there, then shows the plain text, then shows the picture.

It is the longest document in the app. It is also, I think, the most convincing thing in it, and not for the reason I expected.

I expected it to be convincing because fifty four is a big number. It is not that. It is convincing because you can scroll through a wall of finished, professional-looking charts and then look at the text they came from and see that there is nothing hidden. No binary blobs. No embedded objects. No app-shaped format that only Flow can open. Just words and numbers, laid out plainly, that happen to be enough to draw a picture with.

Flow ships that gallery to you. When you first open the app you do not land on a blank page with a blinking cursor. You land in a folder of twenty seven finished documents and thirteen pictures, about two megabytes in total, all working with no network and no AI set up at all. There is a business review that reads like it went to a board, the research underneath it, an investment memo, a client proposal, a press release, a resume, a trip planner. Plus the chart catalogue, and a companion catalogue of twenty five kinds of document with what each one is actually for.

They are ordinary Markdown files in an ordinary folder. Edit them. Rename them. Delete the ones you find useless. The app does not put them back, and it does not mind.

I did not build that folder as a tutorial. The test I set myself was harsher and simpler than that: would a working professional be pleased to have produced this? A tutorial explains a feature. I wanted documents somebody would want to have written.

## Tables, and the small violence most editors do to them

Charts are the showy half. Tables are the half I use every single day, and they are where I spent a surprising amount of my year.

Markdown tables are lovely to read and genuinely miserable to edit. You are typing between pipe characters, counting columns by eye, and one stray keystroke turns a tidy grid into a row of nonsense.

So Flow gives every table a real grid. Click a table, or press a keystroke, and a proper spreadsheet-style grid opens beside your document. Select a cell and type to replace it. Press Return and you step down a row. Numbers down the side select rows, column titles select columns, and a bar above the grid holds the whole text of a long value so you can see what you are editing.

I need to be exact about one thing, because it would be easy to oversell. There are no formulas. That bar above the grid edits text, it does not calculate. Flow is not trying to be a spreadsheet. It is trying to make editing a table in your document feel like it should have felt all along.

The bit I am genuinely proud of is invisible, and it is about respect for your file.

When you change one cell, most Markdown editors rewrite the entire table. They take your table apart, decide how a table ought to be spaced, and write a new one back. Your compact table becomes a padded one. Your padded one becomes something else. Nothing you typed is exactly where you left it.

Flow changes one cell. The edit reaches your file as a splice of exactly that cell and nothing else. A table you wrote tight stays tight. A table you wrote with spaces around every value keeps every one of those spaces, character for character. Right-aligned columns stay right-aligned because you wrote them that way, and a column where you never asked for alignment never quietly acquires it.

If you keep your documents in version control, you already know why this matters. The record of a one-cell edit should be one cell. When it is the whole table instead, the history stops being useful, and after a few months nobody can tell a typo fix from a rewrite.

Some things simply cannot happen, by construction. The header row cannot be deleted. The last column cannot be removed. Type a pipe character inside a cell and it stays inside that cell instead of splitting your table in half.

And the grid is not a copy of your table. It is the same document, seen a second way. Edit the text and the grid shows it. Edit the grid and the text changes. There is no import, no conversion, no hidden second version to get out of step. Saving works exactly as it does anywhere else.

That design paid a debt I had been carrying for months. Notes with a lot of tables used to stutter when you scrolled them. On a note with seven tables, the work of keeping the grid and the text lined up cost about 213 milliseconds every time the editor refreshed. That is a fifth of a second, over and over, which reads to your hands as the app being tired. It is now under 2 milliseconds. Same feature. Same file. The stutter is gone.

## Pictures, and one line of Markdown

The third thing you put in a real document is a photograph. A whiteboard. A screenshot. A room.

For a long time Flow was bad at this, and I did not notice, which is its own small lesson. When I finally went and counted, my own real business documents held zero images. Ten days of marketing, product, sales and research work, not one picture in any of it. Not because I did not want pictures. Because the only way in was to type a file path by hand, and nobody does that.

So now you hover a picture in your document and open a gallery. The picture is drawn large, its description is editable underneath, and beneath that sits every image in your folder, with the document's own pictures first. Click a different one and it swaps in.

The collection is your folder. Not a library Flow keeps somewhere. Nothing is uploaded, nothing is indexed into an app database, nothing is copied into a private store. The folder is the collection, which is why it is already full of your things the first time you open it.

Bringing a new picture in is a copy, never a move. Drop one or paste one and Flow writes it into an assets folder alongside your work. The original stays exactly where it was. Two files with the same name and different contents do not overwrite each other, they get numbered.

And a swap rewrites one line of your document. I checked this the way you check anything you intend to claim: by comparing the file before and after. A picture swap changed one line. An alt-text edit changed one line. Opening the gallery and browsing through every image in the folder changed zero bytes, because looking at something is not editing it and the file should not have to take my word for that.

I should say what the gallery does not do, since it would be easy to let you assume more. It does not crop, resize or filter. It writes no sizes and no alignment, because plain Markdown has none, and Flow will not invent private syntax that other editors cannot read. It does not fetch pictures from the web. And there is no AI in it at all. It proposes nothing and writes no descriptions. If there is alt text under your picture, you typed it.

## The ninety percent

Here is the sentence that took me longest to arrive at, and it is really the point of the whole app.

Flow is roughly ninety percent rendered document and ten percent chrome.

Chrome is my word for the machinery. Toolbars, panes, buttons, panels, the software's own furniture. Most tools I have used are the other way round. You are looking at an application that happens to contain a bit of your work, in a small window, surrounded by everything the application would like you to notice.

Open Flow and you are looking at your own artifact. The chart is your chart, drawn full width. The table is your table. The photograph is at the size it should be. It looks like the thing you are trying to produce, because it is the thing you are trying to produce.

That is not decoration. It changes what you can catch. A document that looks like a document gets read like a document, which means you notice the sentence that does not follow, and the bar that is too tall, before somebody else does.

And all of that costs nothing, forever.

This is worth being blunt about, because I have seen people assume the opposite. The charts, the diagrams, the table grid, the picture gallery, the whole folder of finished documents you land in, reading, writing, searching, organising, exporting: all of it is the document half of Flow, and the document half is free with no account and no expiry. Drawing a picture from your own numbers is not an AI feature. There is no model involved. Your Mac reads the words in your file and draws.

What you pay for is the AI that writes and edits the text. Ten dollars a month, or ninety six a year. That layer works the way I described earlier this week: every change arrives as an exact diff you approve, with a record of what ran, where it ran, and what it cost. Local models are part of that subscription too, and I am not going to pretend otherwise, because what you are paying for is not the words a model produces but the routing, the approval and the receipt around it.

There is a place where the two halves meet, and it is my favourite small piece of design in the app. Flow can turn selected lines of text into a table for you, and turn a table back into paragraphs. Those are AI actions, so they arrive as a proposal you approve like anything else. But the review does not show you what the model claims it did. It reads the proposed table itself and tells you what is actually there: three columns named Name, Role and City, three rows, one for each of the three lines you selected. When it goes the other way it checks whether every value from your table actually turned up in the prose, and names the ones that did not.

That is the difference between a summary and a check. One is a model describing its own work. The other is the app looking at the result and reporting it. I will take the second one every time.

## What I actually wanted

I did not want prettier documents, although I will take them.

I wanted the picture and the words to be the same object, so that they cannot come apart while I am not looking. Six weeks is a long time for a chart to be wrong in a document with my name on it, and the worst part was never the error. It was that I had no way of knowing, and no way of finding out afterwards where the number had come from.

Now the number is in the file. The chart is drawn from the number. The table keeps the shape I typed, down to the spaces. The picture is a file in my folder that any other program can open. And what I am looking at while I work is my own artifact rather than an application's idea of one.

If Flow vanished tomorrow, every one of those documents would still be sitting in an ordinary folder, readable in any text editor written in the last forty years, charts and all, because the charts were only ever words.

That is the only arrangement I trust with work I have to defend.
