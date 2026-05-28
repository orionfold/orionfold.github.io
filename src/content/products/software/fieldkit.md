---
# P7 software rollout #2 (spec §5.5, "Software -> SPONSOR"). Authored from the
# fieldkit README + 12 module docs (Developer/ai-field-notes/fieldkit) and the
# marketing page (ainative.business/fieldkit/). This is the strongest inward
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

specs:
  - label: Language
    value: Python 3.11 or newer
  - label: Install
    value: pip install fieldkit (from PyPI)
  - label: Proven on
    value: An NVIDIA DGX Spark desktop, 128 GB of memory
  - label: Covers
    value: Search, testing, fine-tuning, shrinking, and publishing
  - label: License
    value: Apache 2.0 (free to use)

relatedModels: [patent-strategist]
relatedBook: field-notes
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
    ref: manavsehgal/ai-field-notes (fieldkit subfolder)
    lastSynced: '2026-05-27'
  - section: usage
    type: url
    ref: https://ainative.business/fieldkit/
    lastSynced: '2026-05-27'
---

fieldkit is a free box of Python tools for building with AI. We made it while doing real
AI research on one small desktop, the NVIDIA DGX Spark, and packed in every pattern that
worked. You do not have to take the whole box. Pull in just the one part you need and
leave the rest.

## What is in the box

The pieces cover the whole job, end to end:

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

There are smaller helpers too, for drawing charts, running notebooks, and keeping a tidy
record of every experiment you try.

## Proven, not promised

Every tool here ran on a real desktop doing real work, not in a slide deck. The same kit
built and shipped our open models. So when you reach for a piece, you are reaching for
something that already earned its keep.
