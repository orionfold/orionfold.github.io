---
# Model detail page for Advisor (slug = slugify("Advisor") = advisor, the id
# models.astro/roadmap use, so the flagship listing card routes inward and the
# Sponsor tiers pre-select model:advisor). Facts are the real ones from the HF
# card (Orionfold/Advisor-GGUF): NVIDIA Nemotron 4B base, Q4_K_M promoted lane
# (~2.6 GB, ~70 tok/s on Spark, byte-identical bench to Q8_0). The proof numbers
# (18/21 vs 8/21, 9 trick questions refused, 0 secrets leaked) are the published
# refuse-test on /proof and /software/advisor/ (src/data/proof.ts) — kept exact.
# This page is about the MODEL (run it yourself); the OFFER (cockpit + model +
# Cortex) lives at /software/advisor/, which this page links to. Copy grade 3-5
# with jargon glossed (website-copy-style).
type: model
slug: advisor
valueProp: A small open AI model that answers from your own notes and files and names the exact source. When the answer is not in your notes, it says so instead of making one up. It runs fully offline on a desktop you own.

chips:
  - label: Field
    value: Grounded answers
  - label: Runs
    value: Fully offline
  - label: Built on
    value: NVIDIA Nemotron 4B
  - label: License
    value: NVIDIA Nemotron Open, free

# Get the weights (the model files). HuggingFace CLI or straight from llama.cpp.
install:
  - label: Hugging Face
    lang: bash
    code: huggingface-cli download Orionfold/Advisor-GGUF
  - label: llama.cpp
    lang: bash
    code: llama-cli -hf Orionfold/Advisor-GGUF:Q4_K_M

# Run it. A quick prompt at the terminal, or from Python.
usage:
  - label: Ask a question
    lang: bash
    code: llama-cli -hf Orionfold/Advisor-GGUF:Q4_K_M -p "Using only the notes I gave you, what did we decide about pricing, and which note says so?"
  - label: Python
    lang: python
    code: |
      from llama_cpp import Llama

      llm = Llama.from_pretrained(
          repo_id="Orionfold/Advisor-GGUF",
          filename="*Q4_K_M.gguf",
      )
      out = llm("Using only the notes I gave you, what did we decide about pricing, and which note says so?")
      print(out["choices"][0]["text"])

specs:
  - label: Base model
    value: NVIDIA-Nemotron-3-Nano-4B
  - label: Size
    value: 4B (small enough for a desktop)
  - label: Format
    value: GGUF (ready to run)
  - label: Best build
    value: Q4_K_M (about 2.6 GB, about 70 tokens a second on a Spark desktop)
  - label: License
    value: NVIDIA Nemotron Open Model License (free to use)

# The published refuse test from /proof. A locked 21-question test our 4B Advisor
# took against a model eight times bigger. Exact numbers from src/data/proof.ts —
# do NOT round or invent (receipt-honesty rule). The point: bigger is not safer.
benchmarks:
  columns: [Model, Score on the locked test, Made-up answers, Trick questions refused]
  rows:
    - [Our Advisor (4B, ours), '18 of 21', '0', '9 of 9']
    - [A model 8x bigger, '8 of 21', '3', 'fewer']

relatedModels:
  - patent-strategist
relatedReading:
  - title: See the receipts and rerun the test
    href: /proof/
relatedBook: ai-native-business

outbound:
  - label: Get the model as an offer (cockpit + Advisor + memory)
    href: /software/advisor/
    kind: site
  - label: GGUF files (ready to run)
    href: https://huggingface.co/Orionfold/Advisor-GGUF
    kind: huggingface

sources:
  - section: overview
    type: hf-card
    ref: Orionfold/Advisor-GGUF
    lastSynced: '2026-06-24'
  - section: benchmarks
    type: file
    ref: src/data/proof.ts
    lastSynced: '2026-06-24'
---

Advisor is a small open AI model that answers from the notes and files you give
it. It does two things most models will not. First, it names the exact source
for its answer, so you can check it. Second, when the answer is not in your
notes, it says so instead of making one up. It does all of this fully offline on
a desktop you own, so your private notes never leave the room.

## What it can do

You hand Advisor a set of your own notes, files, or records. You ask a question.
It answers in plain words and points at the exact note the answer came from. If
your notes do not hold the answer, it tells you that plainly. It is built on
NVIDIA's Nemotron 4B, a small open model, and packed into ready-to-run files so
it starts fast on a single desktop.

## Why "it says so" matters

Most big models will give you a confident answer even when they are guessing.
That is the dangerous part: a made-up answer that sounds sure. Advisor is tuned
the other way. It would rather refuse than guess, and it shows its source when it
does answer. For sensitive work, a clean "I do not have that" beats a confident
wrong answer every time.

## How well it works

We wrote a hard test of 21 questions and locked it before training, so we could
not cheat. Our 4B Advisor scored 18 of 21. A model eight times bigger scored 8 of
21 and made up 3 fake answers. We also slipped in 9 trick questions meant to pull
a secret out of the model or bait it into guessing. Advisor refused all 9 and
leaked nothing. The table above has the numbers. You can rerun the whole test
yourself on the [proof page](/proof/).

This is one locked test, not a promise about every question. Treat Advisor as a
careful helper that shows its work, and still check anything that matters.

## How to run it

Download the GGUF files (the ready-to-run format) and run them with llama.cpp on
a Spark-class desktop, a small AI machine with 128 GB of memory. Start with the
Q4_K_M build: it is about 2.6 GB, runs around 70 tokens a second, and scores the
same as the full-size build on our test. If you would rather have the whole
setup done for you, with a cockpit and memory built in, that is the
[Advisor offer](/software/advisor/).
