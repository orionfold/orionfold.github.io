---
title: Fifty-four ways to draw your numbers, and what each one needs
feature: "Elements' chart and diagram kinds: open a chart or diagram and the sidebar lists every kind Flow draws, grouped by the question it answers, each with what data gets you there; a press switches the chart with its data kept, or says what the kind needs"
persona: Anyone who has data in a document and isn't sure which chart tells its story
drafted: "2026-10-26"
build: Orionfold Flow review build elements-1 (dev, main d43eb7f2), macOS 26.6, MacBook Pro M3 Max 36 GB, window 1512×949; walked 2026-10-26 14:06–14:44 PDT by the agent in an away session, one Flow instance; no model runs
data: The Flow Guide's Charts Gallery, whose exhibits are fictional teaching samples. The file the walk switched was reverted and read back byte-identical. The account row is painted over in every full-window shot.
dek: "Open a chart in Flow and the Elements panel turns into a catalogue of every kind Flow draws: 34 chart kinds in four groups named for the question each answers, and 20 diagram kinds when the open block is a diagram. Each card has a drawing of its shape and one line, and the kind on screen carries a check. In this walk a bar chart became a lollipop chart in one press with its data kept. A candlestick, which this data can't make, was refused with a sentence saying what it needs. No model is involved. The switch happens on your Mac at once."
hero: ../../assets/flow/elements/chart-kinds/01-kinds-panel.webp
heroAlt: "A bar chart open in its editor beside the Elements panel: Comparison and ranking with Bar chart checked, then Change over time; the editor's header reads a two-column table — one category column, one number column — with up to a dozen rows"
source: orionfold-flow articles/23-elements-chart-kinds/ARTICLE.md
order: 4
category: Chart and diagram kinds
summary: Fifty-four chart and diagram kinds, each with the data it takes. Switch kinds and keep your data, on your Mac, with no model involved.
cardShot: 01-kinds-panel
release: "3.0"
draft: false
---

## What Flow does

**Every chart Flow can draw is one press away, and Flow tells you which ones your data can make.**
Open any chart or diagram in Orionfold Flow and the sidebar's Elements panel lists the kinds by question: **Comparison and ranking**, **Change over time**, **Composition and flow**, **Distribution and relationship**, and **Diagrams**. Each card shows the shape, says what the kind shows, and, when you rest on it, what data gets you there. Press a kind and the chart redraws with your data kept. If your data can't take that kind, the chart stays as it was, and the card and the editor say what the kind needs. You can start from Flow's example, or keep yours. **Format ▸ Chart Type** lists the same kinds for the keyboard.

## The answer first

1. **Open a chart or diagram in its editor**: hover it in the document and press **Open in the gallery**, or insert one from **Elements ▸ Chart**.
2. **Press ⌘5.** Elements lists the kinds for that block, grouped by question, with the current one checked.
3. **Rest the pointer on a kind**, or reach it with the arrow keys, to read what data it takes.
4. **Press it** (or Return). The chart redraws with your data. Press **Apply** to keep it or **Revert** to go back.
5. **If the kind can't use your data**, the card says *Your data doesn't fit it*, and the editor names what the kind needs and offers **Start from the example** or **Keep mine**.

## The job

A table of numbers can become a dozen pictures, and most of them mislead. Bars where a line belongs hide the trend. A pie with nine slices hides the shares. A histogram of three values shows nothing. Choosing well means knowing what each kind is for and what shape of data it expects. That knowledge usually lives in a style guide nobody opens. Flow puts it on the card, next to the chart.

## Switch, with your data kept

![The same chart redrawn as a lollipop chart: thin stems with dots, Q3 in the accent colour; Lollipop chart now carries the check; the header reads the same two-column table as a bar chart, but with many rows or long labels](../../assets/flow/elements/chart-kinds/02-switched-to-lollipop.webp)

Pressing **Lollipop chart** redrew the five quarters as stems and dots, Q3 still in the accent colour. The check moved, and the editor's header changed to the new kind's need. *It wanted the same two-column table as a bar chart, but with many rows or long labels*.

![Candlestick chart pressed: the chart stays a lollipop, the card reads Your data doesn't fit it; the pane offers the example in orange, and above the axis pickers: Your data doesn't fit a candlestick chart: it needs a table of date, open, high, low and close, with Start from the example and Keep mine](../../assets/flow/elements/chart-kinds/03-candlestick-refused.webp)

Pressing **Candlestick chart** on the same data changed nothing. The card turned orange, *Your data doesn't fit it; the pane offers the example*, and the editor said exactly why. *It needs a table of date, open, high, low and close*. **Keep mine** and **Revert** left the file as it was; read back afterwards, it was byte for byte the Guide's original.

## The numbers

| Figure | Value | Status and source |
| --- | --- | --- |
| Chart kinds, with a chart open | 34, in four groups (8, 10, 6, 10) | verified: the panel's list, read 14:40–14:42 |
| Diagram kinds, with a diagram open | 20 | verified: the panel's list, read 14:43–14:44 |
| Switch from bar to lollipop | one press, data kept | verified: the editor's kind read *Lollipop chart* after the press |
| A kind the data can't take | refused, chart unchanged, what it needs named | verified: the card's value and the editor's line, 14:09 |
| File after Keep mine and Revert | byte-identical to the Guide's | verified: git hash `458a2114…` on both |
| Model calls to switch a kind | none | assumed: the switch showed no route or cost line and finished at once |
| Machine | MacBook Pro M3 Max, 36 GB, macOS 26.6 | verified |
