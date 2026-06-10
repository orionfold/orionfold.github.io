---
# P7 software rollout #2 (spec §5.5, "Software -> SPONSOR"). Authored from the
# fieldkit README + module docs (GitHub manavsehgal/ai-field-notes, fieldkit/) and
# the marketing page (ainative.business/fieldkit/). 2026-06-03 re-sync: fieldkit is
# now 18 modules — agent harness, Arena cockpit + cost +
# budget planes, the Cortex memory layer, lineage, and the RLVR reward/rl training
# loop all landed after the first authoring. 2026-06-07 re-sync: v0.30.0 on PyPI
# (released 2026-06-06; still 18 modules). v0.23-v0.30 were the Arena cockpit
# growth wave (guardrail settings, lane truth, run identity, operator-armed SFT
# dispatch) — that surface is documented on the arena page; here only the version
# moved. 2026-06-10 re-sync: v0.31.0 on PyPI (released 2026-06-07; still 18
# modules). v0.31 = guarded lane launch + teardown (the cockpit starts/stops the
# serving model itself) + the demo recorder behind the public Arena demo; body
# bullet extended, version bumped. fieldkit's package source (pyproject, src/,
# CHANGELOG at 0.31.0) now lives in the ainative-business.github.io repo, so the
# readme source ref points there; the ai-field-notes clone's fieldkit/ README is
# frozen at v0.2.0. NOTE the local mac clone of
# ai-field-notes is stale (work moved to the Spark); pull README/docs from GitHub,
# and treat PyPI + the live /fieldkit/ page as the version/capability truth (the
# in-repo README lags releases). This is the strongest inward
# funnel of the batch: fieldkit is the toolbox from the DGX Spark research, so the
# RelatedRail points at the Field Notes book (Buy) and Patent Strategist (built
# with it). No first-party screenshots ship; the package makes charts at run time,
# so the page is gallery-less and the code tabs carry it. Copy is grade 3-5, no
# em-dashes, jargon (RAG, fine-tune, quantize) glossed in plain words.
type: software
slug: fieldkit
valueProp: A free Python toolbox of the patterns we proved on one small AI desktop. Search your own files, test models, fine-tune them, and ship them. Take only the parts you need.

chips:
  - label: Language
    value: Python
  - label: Install
    value: pip
  - label: Proven on
    value: DGX Spark
  - label: License
    value: Free (Apache 2.0)

install:
  - label: Install from pip
    lang: bash
    code: |
      pip install fieldkit

usage:
  - label: Check if a model fits
    lang: bash
    code: |
      # Will this model fit on the desktop, with this much context?
      # fieldkit does the memory math and tells you straight.
      fieldkit feasibility llama-3.1-70b --ctx 4096 --batch 32 --dtype fp8
  - label: Search your own files
    lang: python
    code: |
      from fieldkit.nim import NIMClient
      from fieldkit.rag import Document, Pipeline

      # Talk to a model running on your own machine, search your notes,
      # then answer using only what was found.
      with NIMClient(base_url="http://localhost:8000/v1",
                     model="meta/llama-3.1-8b-instruct") as gen, \
           Pipeline(embed_url="http://localhost:8001/v1",
                    pgvector_dsn="postgresql://spark:spark@localhost:5432/vectors",
                    generator=gen) as pipe:
          pipe.ensure_schema()
          pipe.ingest([Document(id=1, text="The DGX Spark has 128 GB of memory")])
          print(pipe.ask("How much memory does the Spark have?")["answer"])
  - label: Open the cockpit
    lang: bash
    code: |
      # fieldkit also ships the Orionfold Arena cockpit.
      # One command brings it up in your browser.
      pip install "fieldkit[arena]"
      fieldkit arena up

specs:
  - label: Language
    value: Python 3.11 or newer
  - label: Install
    value: pip install fieldkit (from PyPI)
  - label: Proven on
    value: An NVIDIA DGX Spark desktop, 128 GB of memory
  - label: Covers
    value: Search, testing, fine-tuning, shrinking, publishing, agents, memory, and a cockpit
  - label: Size
    value: 18 modules at version 0.31; take one import at a time
  - label: License
    value: Apache 2.0 (free to use)

relatedModels: [patent-strategist]
relatedBook: ai-research-on-nvidia-dgx-spark
relatedReading:
  - title: My first model on a desktop
    href: /story/my-first-model-on-a-desktop/

outbound:
  - label: fieldkit on GitHub
    href: https://github.com/manavsehgal/ai-field-notes/tree/main/fieldkit
    kind: github
  - label: Read the fieldkit guide
    href: https://ainative.business/fieldkit/
    kind: docs
  - label: fieldkit on PyPI
    href: https://pypi.org/project/fieldkit/
    kind: site

sources:
  - section: overview
    type: github-readme
    ref: manavsehgal/ainative-business.github.io (fieldkit subfolder)
    lastSynced: '2026-06-10'
  - section: usage
    type: url
    ref: https://ainative.business/fieldkit/
    lastSynced: '2026-06-10'
---

fieldkit is a free box of Python tools for building with AI. We made it while doing real
AI research on one small desktop, the NVIDIA DGX Spark, and packed in every pattern that
worked. You do not have to take the whole box. Pull in just the one part you need and
leave the rest.

## What is in the box

Eighteen pieces now, and they cover the whole job, end to end:

- **Search your own files.** Point it at your notes or documents and ask questions. It
  finds the right parts first, then answers from them. People call this RAG, which just
  means "look it up, then answer."
- **Talk to a local model.** A simple, reliable way to send questions to an AI model
  running on your own machine.
- **Test and grade.** Run checks on a model and score how well it does, even using one
  AI to grade another.
- **Fine-tune.** Teach a model a new skill by training it on your own examples.
- **Shrink to run faster.** Make a model smaller so it runs quicker, and measure what
  you traded away. The trade is called quantizing.
- **Publish.** Build a clean model card and ship the model to HuggingFace for others.
- **Run an agent.** Install, set up, and protect an AI agent on your own machine, and
  route each kind of question to the right model for the job.
- **Drive it all from one screen.** The parts behind [Orionfold Arena](/software/arena/):
  the cockpit itself, a job queue, a spending brake, and a cost ledger. The cockpit can
  now start and stop the serving model too, with a memory check first and a confirm step
  before the old model is stopped.
- **Remember and recall.** The memory layer behind [Orionfold Cortex](/software/cortex/):
  index your notes, stamp where every fact came from, and check that a rebuilt index can
  still find its answers.
- **Let the model train itself.** A training loop where your own tests are the score. The
  model practices, the tests grade each try, and a hard gate makes sure a worse version is
  never the one that gets kept.

There are smaller helpers too, for drawing charts, running notebooks, and keeping a tidy
record of every experiment you try.

## Proven, not promised

Every tool here ran on a real desktop doing real work, not in a slide deck. The same kit
built and shipped our open models, and it now powers the Arena cockpit and the Cortex
memory layer too. So when you reach for a piece, you are reaching for something that
already earned its keep.
