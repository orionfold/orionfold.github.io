---
title: Nineteen skills that draw your document's case for you
feature: "Elements ▸ Skills: nineteen methods — Decision Brief, Option Comparison, Scorecard, Opportunity Map, Value Model, Roadmap, Delegation Map, Register, Scenario Model, Architecture Diagram, Landscape Map, System Explainer, Visual Explainer, Isometric Figure, Field-Notes Diagram, Guided Exercise, Workflow Path, Product Mock and Path Card — each checking your text before it runs, each result waiting in Review Changes"
persona: Consultants, founders and operators whose documents argue something — a decision, a plan, how a system works, what a product does — and who would rather show it than say it
drafted: "2026-10-26"
build: Orionfold Flow review build elements-1 (dev, main d43eb7f2), macOS 26.6, MacBook Pro M3 Max 36 GB, window 1512×949; walked 2026-10-26 13:57–14:29 PDT by the agent in an away session, one Flow instance; the live run on Claude Code with the Claude subscription
data: Harbor Close Plan, a fictional plan written for this walk, and the Flow Guide's Skills Gallery, whose passages and numbers are fictional teaching examples. The account row is painted over in every full-window shot.
dek: A skill is a method Flow applies to a passage. It reads what you selected and draws the answer as a decision brief, a comparison table, a roadmap, a register, a map or an animated figure you step through. Elements ▸ Skills lists all nineteen, each with a drawing in its own colour. Before a skill runs, its sheet checks that your text has what the method needs. In this walk one skill ran live on a plan, by way of an idea, and came back in about 50 seconds with a figure drawn exactly to scale. The Skills Gallery shows what every other skill draws from a short passage.
hero: ../../assets/flow/elements/skills/01-skills-section.webp
heroAlt: "The Elements panel with the Skills section open over the plan: Architecture Diagram, Decision Brief, Delegation Map, Field-Notes Diagram, Guided Exercise, Isometric Figure, Landscape Map, Opportunity Map, Option Comparison, Path Card and Product Mock, each with a coloured drawing"
source: orionfold-flow articles/22-elements-skills/ARTICLE.md
order: 3
category: Skills
summary: Nineteen skills that turn a passage into a decision brief, a roadmap, a register or a figure you step through.
cardShot: 01-skills-section
release: "3.0"
draft: false
---

## What Flow does

**Select a paragraph, press a skill, and Flow draws its case as the brief, the table, the timeline or the figure.**
Orionfold Flow ships nineteen skills, listed in Elements (⌘5) under **Skills**. Each turns one kind of passage into the form that reader needs. A discussion of choices becomes a decision brief with a decision tree. A list of initiatives becomes a value-and-effort map. Dated work becomes a roadmap, and a layered system becomes an isometric figure you can press. A recurring piece of work becomes a path from files in to deliverables out. Before anything runs, the skill's sheet counts whether your text has what the method needs, such as separate points, numbers or a date, and recommends **Cancel** when it doesn't. The result is placed right after the paragraph you selected and waits in **Review Changes**. What a skill draws is saved in the document as text, so it opens anywhere and prints when you publish. Ideas can choose the skill for you, section by section.

## The answer first

1. **Select the passage the skill should read.** With nothing selected, it reads the whole document.
2. **Press ⌘5 and press the skill's card under Skills.** Or let **Ideas** (⌘3) suggest one per section and press the idea.
3. **Read the sheet.** It shows what the skill will read, its steps, and a check of what your text has: *46 words to read · 5 numbers to work with*. Press **Run Skill** when it says *Ready to run*.
4. **Review the result** in **Review Changes**. A figure that builds in steps has **Previous**, **Play** and **Next** under it. Keep it, or discard it.
5. **Open the Flow Guide's Skills Gallery** to see every skill's passage and what it drew, grouped by the question your text asks. The groups are Decide, Plan, Explain, Present.

## The job

A plan that says "three options, here are the costs" asks the reader to build the comparison in their head. A paragraph about who hands what to whom asks them to draw the flowchart. Most people know the form their argument wants, such as a table, a timeline or a map. Few have the time to draw it in another tool and keep it in step with the text. A skill draws it from the text you already wrote, in a form Flow keeps as part of the document.

## A skill, run on a real section

![The Field-Notes Diagram sheet: Your selection · 46 words, then the skill, then A figure, in Review Changes; six steps from Find the numbers and the point to Title it with the point; Ready to run, 46 words to read, 5 numbers to work with; Cost included in a subscription you already pay for; Run Skill](../../assets/flow/elements/skills/02-skill-sheet.webp)

On *Harbor Close Plan*, Ideas suggested **Field-Notes Diagram** for the section *Where the time goes*. Pressing the idea selected the section and opened the skill's sheet. It showed its six steps, and a check that found *5 numbers to work with*. Every skill opens the same sheet when you press its card yourself.

![Review Changes with the field-notes figure at step 2 of 2: Reconciliation 140 hours, Chasing 96 hours highlighted in teal, Drafting 48 hours, Review 28 hours, and the caption CHASING RECEIPTS: 96 OF 312 HOURS](../../assets/flow/elements/skills/03-review.webp)

The figure arrived in **Review Changes** about 50 seconds later, after the section it read. Each bar is its number drawn to scale, and the number the passage stresses is the one in colour.

![The plan in Source view, dark mode: the figure is a fenced block of text — figure skill: field-notes-diagram, then the SVG with its title, description and styles](../../assets/flow/elements/skills/04-figure-as-text-dark.webp)

Kept, the figure is a block of text in the Markdown file. It is a `figure` fence holding the drawing, with its title and a description a screen reader can say. It travels with the document and redraws in dark mode.

![Workflow Path's last step in dark mode: CSV, PDF and XLSX files into Reconcile, the ledger with mismatches flagged, then Send to a PDF summary and an updated ledger](../../assets/flow/elements/skills/05-workflow-path-dark.webp)

## The numbers

| Figure | Value | Status and source |
| --- | --- | --- |
| Skills in Elements | 19 | verified: the panel's list |
| Skills that draw a figure you step through or press | 7 (System Explainer, Visual Explainer, Isometric Figure, Field-Notes Diagram, Workflow Path, Product Mock, Path Card) | verified: each SKILL.md's `output: [figure]` |
| Field-Notes Diagram, idea press to Review | about 50 s | verified: clock 13:59:13 to 14:00:03 |
| Numbers the sheet found in the section | 5 | verified: the sheet |
| Bars drawn to scale | widths = hours ÷ 140 × 300 | verified: the saved figure's text |
| Cost of the live run | $0 extra, on the Claude subscription | verified: the sheet's cost and route lines |
| Gallery passages and drawings | 19, one per skill | verified: the Skills Gallery pages, shot 14:11–14:14 |
| Machine | MacBook Pro M3 Max, 36 GB, macOS 26.6 | verified |
