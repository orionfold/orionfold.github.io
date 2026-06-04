---
# New software rollout: Orionfold Cortex (2026-06-03). The Arena memory layer
# turned into its own product upstream (cockpit Knowledge tab rebranded Cortex,
# route /arena/cortex/, plus a /cortex/ landing + sidecar-less demo). Authored
# from the canonical product article in the ainative.business GitHub repo
# (manavsehgal/ainative-business.github.io, products/orionfold-cortex/product.md)
# and 7 of its 8 real screenshots (08-catalog-page.png dropped: a tall full-page
# web capture, not a product UI shot). The mac checkout is stale (work moved to
# the Spark), so the sources map points at the GitHub repo. RelatedRail funnels
# inward: Arena (the parent cockpit), the privacy story, and the DGX Spark book
# (Buy). Recall numbers are exact from the article; never round them. Copy is
# grade 3-5, no em-dashes, jargon (index, recall, provenance) glossed in plain
# words.
type: software
slug: cortex
valueProp: A second brain on your own desktop. It indexes your notes, grades its own memory against real questions, and refuses any rebuild that makes recall worse. Free, and nothing leaves your machine.

chips:
  - label: Language
    value: Python
  - label: Run it
    value: fieldkit arena up
  - label: Proven on
    value: DGX Spark
  - label: License
    value: Free and local

install:
  - label: Install from pip
    lang: bash
    code: |
      pip install "fieldkit[arena]"

usage:
  - label: Open the memory pane
    lang: bash
    code: |
      # Start the Arena cockpit on your Spark. Cortex is its memory pane.
      # Point it at your notes, then rebuild, score, and query from one screen.
      fieldkit arena up

specs:
  - label: What it is
    value: A memory layer for your own notes that you can drive, inspect, and trust
  - label: Coverage you can read
    value: How much of your corpus is indexed, how much is stale, and how many facts carry a source stamp, as numbers on one screen
  - label: Rebuild from one screen
    value: One click queues a re-index and a scoring run; you watch both move across a jobs board
  - label: The recall gate
    value: Every rebuild is scored against a fixed set of real questions; a rebuild that finds fewer answers is flagged, not shipped
  - label: Ask with a trust filter
    value: Plain-language questions come back as cited passages, each tagged by how much you can trust its source
  - label: Measured, not promised
    value: Found the right passage in its top five 40.91% of the time, and the right note 72.73% of the time, over 44 real questions
  - label: Private
    value: Documents, chunks, and questions stay on your machine; only scores are ever shared
  - label: Built on
    value: The fieldkit toolbox (memory, arena, harness, eval)

gallery:
  - src: ../../../assets/projects/cortex/knowledge-baseline.png
    alt: The Cortex pane before its first rebuild, showing a degraded index with a plain warning instead of made-up numbers.
    caption: Day one, honestly shown. Before the first rebuild, Cortex says the index is not ready.
  - src: ../../../assets/projects/cortex/rebuild-queued.png
    alt: The Cortex pane with a rebuild queued, showing the re-index job and its scoring job waiting in line.
    caption: One click queues the rebuild, with a scoring run chained right behind it.
  - src: ../../../assets/projects/cortex/jobs-board.png
    alt: The jobs board mid-rebuild, with the re-index running at 94 percent GPU and the scoring job already done.
    caption: Watch the work move. The re-index runs hot while the score lands beside it.
  - src: ../../../assets/projects/cortex/after-rebuild.png
    alt: The Cortex dashboard after a rebuild, showing 100 percent coverage and a source stamp on all 313 indexed chunks.
    caption: After the rebuild, coverage and source stamps are numbers you can read, not guesses.
  - src: ../../../assets/projects/cortex/rag-query.png
    alt: The query console answering a plain-language question with cited passages, each tagged by the trust level of its source.
    caption: Ask in plain words, get cited passages back, each tagged by how much to trust it.
  - src: ../../../assets/projects/cortex/recall-gate.png
    alt: The recall gate after a second scoring run, comparing recall against the last run and showing a promote verdict.
    caption: The gate at work. A rebuild is only promoted when its recall holds up.
  - src: ../../../assets/projects/cortex/standup.png
    alt: The morning standup report listing what ran overnight, with zero regressions, zero failures, and a drained queue.
    caption: The morning report. What ran, what regressed (nothing), and what it spent.

relatedBook: ai-research-on-nvidia-dgx-spark
relatedReading:
  - title: "Orionfold Arena: the cockpit Cortex lives in"
    href: /software/arena/
  - title: Keeping my data in the room
    href: /story/keeping-my-data-in-the-room/
  - title: The cockpit for my models
    href: /story/the-cockpit-for-my-models/

outbound:
  - label: Read the Cortex story
    href: https://ainative.business/products/orionfold-cortex/
    kind: site
  - label: How Cortex caught its first bug
    href: https://ainative.business/field-notes/the-machine-manages-its-own-memory/
    kind: site
  - label: fieldkit on GitHub
    href: https://github.com/manavsehgal/ai-field-notes
    kind: github

sources:
  - section: overview
    type: url
    ref: https://raw.githubusercontent.com/manavsehgal/ainative-business.github.io/main/products/orionfold-cortex/product.md
    lastSynced: '2026-06-03'
  - section: gallery
    type: docs-screenshots
    ref: manavsehgal/ainative-business.github.io:products/orionfold-cortex/screenshots/
    lastSynced: '2026-06-03'
---

Orionfold Cortex is a second brain for your own notes, running on your own desktop. It
grew out of [Orionfold Arena](/software/arena/), where it started as the cockpit's memory
pane. Point it at a folder of notes and it builds an index: a fast lookup table that lets
you ask questions in plain words and get back the right passages, with a citation for each
one. All of it runs on the machine under your desk, and none of it leaves.

## Why it exists

An index of your notes is the easiest thing to let rot. You build it once, it works, and
then the notes grow, a rebuild quietly drops a tenth of them, and nothing tells you. The
number that matters, "does a question still find its answer," stays invisible until the
day it fails you. Cortex makes that number something you can see, chart, and gate on one
screen.

## What you can do

- **Read the health of your memory.** One screen shows how much of your corpus is indexed,
  how much has gone stale, and how many facts carry a stamp saying where they came from.
  No guessing.
- **Rebuild without a script.** One click queues a re-index and a scoring run behind it.
  You watch both move across a jobs board while the machine does the work.
- **Trust the gate.** Every rebuild scores itself against a fixed set of real questions
  with known answers. If the new index finds fewer of them than the old one did, it is
  flagged instead of shipped. A worse memory never replaces a better one quietly.
- **Ask with a trust filter.** Type a question in plain words and get cited passages back.
  Each one is tagged by how much you can trust its source, so a number measured on your
  own machine is never silently mixed up with a claim someone made on the internet.

Jargon, in plain words: an *index* is a fast lookup table over your notes. *Recall* is the
share of questions where the index finds the right passage. *Provenance* just means "where
a fact came from," and Cortex stamps it on every piece it stores.

## Honest numbers

On its first measured run, over 49 articles split into 313 pieces, Cortex found the right
passage in its top five answers 40.91% of the time, and the right note 72.73% of the time,
across 44 real questions. Those are the true numbers for the simple baseline it runs
today, with no extra ranking step yet. They are printed on the product, not rounded up.

The first real run also caught a real bug: a missing one-line import that eight unit tests
had slept through, because they all used a stand-in instead of the real code. Driving the
tool through its own screen found it in minutes. That is the whole idea: a memory you
operate, not a black box you hope still works.

## Private by design

Your documents, the index, and your questions all stay on your machine. Only aggregate
scores are ever shared, and only if you publish them.

## Built on fieldkit

Cortex is a thin surface over the [fieldkit](/software/fieldkit/) toolbox: the memory
module owns the index and the source stamps, the Arena control plane runs the jobs, and
the same test machinery that grades our models grades the index. The parts already
existed; Cortex is what you get when you point them at each other and add the one missing
piece, a memory that grades itself.
