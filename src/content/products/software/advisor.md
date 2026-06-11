---
# New software rollout: Orionfold Advisor (graduated from the roadmap overlay
# 2026-06-10, the day it shipped publicly upstream). Authored from the canonical
# product article in the ainative.business GitHub repo
# (manavsehgal/ainative-business.github.io, products/orionfold-advisor/product.md)
# and 6 of its 7 real cockpit screenshots (05-lanetruth-promoted skipped: an
# ultra-wide skinny banner that reads poorly at card size and already appears on
# the arena page as lanetruth-guarded.png). All numbers (18/21 vs 8/21, 182
# sources, ~21 minute training run, $0.0033 routing bill, nine gates) are exact
# from the article; nothing invented. Copy is grade 3-5, no em-dashes, jargon
# (corpus, fine-tune, retrieval) glossed in plain words. The RelatedRail points
# inward at the stack it rides: Arena (cockpit), Cortex (memory), fieldkit
# (toolbox), and the DGX Spark book (Buy).
type: software
slug: advisor
valueProp: A local AI advisor over your own documents. Every answer names its exact source. What your documents cannot support, it refuses. Every check it passed is a receipt you can re-run.

chips:
  - label: Runs on
    value: NVIDIA DGX Spark
  - label: Model
    value: A 4B fine-tune, about 12 GB
  - label: Get it
    value: Free on Hugging Face
  - label: Cockpit
    value: Orionfold Arena

specs:
  - label: What it is
    value: A governed local AI advisor over a pack of your own documents
  - label: Citations
    value: Every claim names the exact source it came from; a vague citation counts as a failure
  - label: Refusals
    value: Questions the documents cannot support get a refusal, not a guess, even trick questions
  - label: Trained, not prompted
    value: A small trained model scored 18 of 21 on frozen trick questions; a much bigger prompted model scored 8
  - label: Routing
    value: A rule-based router can ask a hosted model for help, on an allow list with a dollar cap; private questions never leave
  - label: Receipts
    value: Every gate on the way to serving is a saved file a script can re-verify
  - label: The corpus
    value: A swappable pack of 182 sources with a fingerprint and its own recall checks
  - label: Built on
    value: Orionfold Arena, Orionfold Cortex, and the fieldkit toolbox

gallery:
  - src: ../../../assets/projects/advisor/preflight.png
    alt: The Advisor pre-flight card in the cockpit, showing an 8 question citation and refusal check with every row passing against the running model.
    caption: The gate as a button. Eight questions run against the live model, pass or fail per row.
    detail: >-
      Before any model earns a training hour, it must pass this gate: eight questions that
      check exact citations and clean refusals, run against the live model with one click.
      Two well-known base models failed right here, before any time was spent training them.
      The shot shows the winning model passing 8 of 8.
  - src: ../../../assets/projects/advisor/corpus-pack.png
    alt: The corpus pack card, showing 182 sources, the pack's fingerprint, two green recall checks, and the training handoffs built from it.
    caption: What the Advisor knows is a sealed pack, not a folder of files. The card shows its fingerprint and its checks.
    detail: >-
      The Advisor's knowledge is a sealed pack of 182 sources with a fingerprint, not a
      loose folder of files. The card shows the pack's two recall checks and the training
      sets built from it, so you can trace the chain from what the Advisor knows to what the
      model was trained on. Swap in a different pack and the same checks re-run.
  - src: ../../../assets/projects/advisor/routing-cost.png
    alt: The routing and cost card, showing three setups that each scored 28 of 28, with bills from zero dollars to a third of a cent, and zero private questions sent out.
    caption: Every hosted call has a price tag and a verdict. Private questions are blocked from leaving at all.
    detail: >-
      The Advisor can ask a bigger hosted model for help, but only on rules: an allow list,
      a dollar cap, and never for private questions. Each measured setup shows its score and
      its bill. Local-only scored 28 of 28 for free; with the frontier in the loop it scored
      28 of 28 for a third of a cent.
  - src: ../../../assets/projects/advisor/publish-receipt.png
    alt: The publish receipt card, marked promoted, with nine green gate chips and a drawer explaining why this model won and why the others were rejected.
    caption: Promotion is a script that reads the evidence, not an announcement. Nine gates, each backed by a saved file.
    detail: >-
      Promotion is not an announcement here, it is a script that reads the saved evidence.
      The card shows the winning model, nine green gates each backed by a named file, and
      why every other candidate was rejected. Run the script again any time; if the evidence
      stops supporting a claim, it fails.
  - src: ../../../assets/projects/advisor/eval-drawer.png
    alt: The eval drawer with the Advisor test set picked, showing 89 measured questions with filters by family, ready to replay in the chat.
    caption: All 89 measured questions are pickable in chat, and each replays the exact setup it was scored with.
    detail: >-
      All 89 measured test questions ship with the product. Pick any row and the chat
      replays the exact setup it was scored with, system rules included. What you see in
      chat is what the published numbers measured, not a friendlier version of it.
  - src: ../../../assets/projects/advisor/refusal-scored.png
    alt: A live chat where the Advisor refuses a question about private operator state, cites nothing, and is scored 100 percent by an automatic checker the moment the answer lands.
    caption: A refusal you can score as it happens. No judge model, just a strict checker.
    detail: >-
      Ask the Advisor about private operator state and it refuses, citing nothing. A strict
      checker grades the refusal the moment it lands, with no judge model in the loop. This
      live row scored 100 percent at the wire.

relatedBook: ai-research-on-nvidia-dgx-spark
relatedReading:
  - title: "Orionfold Arena: the cockpit it runs in"
    href: /software/arena/
  - title: "Orionfold Cortex: the memory layer behind it"
    href: /software/cortex/
  - title: "fieldkit: the toolbox underneath"
    href: /software/fieldkit/

outbound:
  - label: Advisor model on Hugging Face
    href: https://huggingface.co/Orionfold/Advisor-GGUF
    kind: huggingface
  - label: Advisor test set on Hugging Face
    href: https://huggingface.co/datasets/Orionfold/Advisor-bench
    kind: huggingface
  - label: Read the Advisor story
    href: https://ainative.business/products/orionfold-advisor/
    kind: site
  - label: The receipts on GitHub
    href: https://github.com/manavsehgal/ainative-business.github.io/tree/main/evidence/orionfold-advisor
    kind: github

sources:
  - section: overview
    type: url
    ref: https://raw.githubusercontent.com/manavsehgal/ainative-business.github.io/main/products/orionfold-advisor/product.md
    lastSynced: '2026-06-11'
  - section: gallery
    type: docs-screenshots
    ref: manavsehgal/ainative-business.github.io:products/orionfold-advisor/screenshots/
    lastSynced: '2026-06-11'
---

Orionfold Advisor is a local AI advisor that answers from your own body of documents. It
runs on one NVIDIA DGX Spark, a small AI desktop, and it is more than a model. It is a
working unit: a small trained model, a search layer that finds the right sources, a
rule-based router with a spending cap, a swappable pack of documents, and the
[Orionfold Arena](/software/arena/) cockpit as its control room.

Ask it a question and it answers from what it found, naming the exact source every claim
came from. Ask it something its documents do not cover, or something about private
operator state, and it refuses, with no sources cited. It holds that line even when the
question arrives dressed up as an urgent exception, a roleplay, or an instruction to cite
the wrong thing.

## Why it exists

The hard part of an assistant over your documents was never smooth answers. It is answers
you can check. An answer with a vague citation cannot be audited. A confident answer to a
question the documents cannot support is worse. The Advisor treats both as failures you
can measure, then trains them away. A citation must name a source that was really
retrieved; calling it "Source 2" counts as a miss. And the refusal test questions were
frozen before training started, so the score cannot flatter itself.

## Trained, not prompted

The most important measurement of the build: on a frozen set of trick questions, a big
30B model with a carefully written instruction sheet scored 8 of 21, and on three of
those it made up private-looking information. The small 4B model that was trained for
the job scored 18 of 21, refused all 9 of the questions it should have refused, and made
nothing up. The training run itself took about 21 minutes on the Spark.

That is the lesson in one line: the trained model carries the discipline, not the
prompt. And it is only cheap to learn when training, serving, and testing all live on
one machine.

## What you can do

- **Ask with receipts.** Every answer names the exact sources it used. You can follow
  each claim back to the document it came from.
- **Trust the refusals.** Questions the documents cannot support get a plain refusal.
  The refusal behavior was scored against trick questions written to break it.
- **Watch the bill.** A rule-based router can ask a bigger hosted model for help, but
  only from an allow list, under a dollar cap, and never for questions about private
  state. One measured setup scored 28 of 28 for exactly $0. Another scored 28 of 28
  for a third of a cent.
- **Swap the corpus.** What the Advisor knows is a sealed pack: 182 sources, a
  fingerprint, and its own recall checks. Swap in a different pack and the same checks
  re-run. That swap was proven on a test pack, not just promised.
- **Re-run the proof.** Every gate on the way to serving is a saved file. A script reads
  them all and only then declares the model promoted. Run it again any time; if the
  evidence stops backing a claim, the script fails.

Jargon, in plain words: a *corpus* is just the pile of documents the Advisor reads. To
*fine-tune* is to train a model further on your own examples. *Retrieval* means finding
the right passages first, then answering only from them.

## The build, measured

The Advisor went from a written plan to a promoted, serving model in two days, about 30
hours of wall-clock across 31 commits. The order of work is the story: the test
questions were frozen first, the search layer was gated next, candidate models had to
pass a pre-flight before a single training hour was spent, and promotion at the end was
a script reading receipts. Twice the gates caught a real problem before it shipped: once
when a rebuild let the test's own paperwork leak into the search index, and once when
the first training pass quietly made refusals worse. Both have numbers attached because
the frozen tests could not be bent.

The agent did the typing: 10 sessions, 871 turns, 118.9 million tokens processed with
97.4 percent served from cache, about 4,300 lines of new harness code, and 54 tests,
all driven on Claude Fable 5.

## Built on the stack

The Advisor is a thin new layer over tools that already earned their keep. Search rides
[Orionfold Cortex](/software/cortex/). The control room is [Orionfold
Arena](/software/arena/), which gained the Advisor's proof cards, its replayable test
drawer, and the guarded model-swap screen during this build. Training, shrinking, and
publishing ride the [fieldkit](/software/fieldkit/) toolbox. The model is free on
Hugging Face, the test set is published next to it, and every receipt quoted here is in
the public repo.
