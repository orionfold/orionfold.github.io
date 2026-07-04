---
# P4 model page (spec §3, "Model → SPONSOR"). slug = slugify("Saul 7B Instruct")
# = saul-7b-instruct, matching the listing card + roadmap id, so the card routes
# inward and the Sponsor tiers pre-select model:saul-7b-instruct. Facts from the
# donor artifact YAML (saul-7b-instruct-v1-gguf) + the legal-curator field note:
# five GGUF builds, LegalBench mini-eval, Spark throughput. The donor YAML sets no
# recommended_variant, but the test shows Q5_K_M scores best, so we name that.
# TrustBlock fills from the P3 HF snapshot (567 downloads). Copy is grade 3-5,
# jargon glossed; the conversion point is the inline Sponsor tiers.
type: model
slug: saul-7b-instruct
valueProp: Open legal AI model. Reads contracts, filings, and case files fully offline on one desktop, so client matters never leave the room. Free, MIT-licensed.

chips:
  - label: Field
    value: Law
  - label: Runs
    value: Fully offline
  - label: Built on
    value: Saul 7B
  - label: License
    value: MIT, free

install:
  - label: Hugging Face
    lang: bash
    code: huggingface-cli download Orionfold/Saul-7B-Instruct-v1-GGUF
  - label: llama.cpp
    lang: bash
    code: llama-cli -hf Orionfold/Saul-7B-Instruct-v1-GGUF:Q5_K_M

usage:
  - label: Ask a question
    lang: bash
    code: llama-cli -hf Orionfold/Saul-7B-Instruct-v1-GGUF:Q5_K_M -p "Summarize the key duties in a standard non-disclosure agreement."
  - label: Python
    lang: python
    code: |
      from llama_cpp import Llama

      llm = Llama.from_pretrained(
          repo_id="Orionfold/Saul-7B-Instruct-v1-GGUF",
          filename="*Q5_K_M.gguf",
      )
      out = llm("Summarize the key duties in a standard non-disclosure agreement.")
      print(out["choices"][0]["text"])

specs:
  - label: Base model
    value: Equall/Saul-7B-Instruct-v1
  - label: Format
    value: GGUF (ready to run)
  - label: Builds
    value: Q4_K_M · Q5_K_M · Q6_K · Q8_0 · F16
  - label: Best build
    value: Q5_K_M (best test score, about 20 tokens a second on a Spark desktop)
  - label: License
    value: MIT (free to use)

# Five builds on LegalBench, a 50-question legal test, on a Spark desktop. Real
# numbers from the legal-curator field note: Q5_K_M scores best (72%). tok/s
# rounded from the YAML (29.43/20.19/22.39/7.3/10.88).
benchmarks:
  columns: [Build, LegalBench score, Speed on a Spark]
  rows:
    - [Q4_K_M (fastest), '62%', '29 tokens a second']
    - [Q5_K_M (best score), '72%', '20 tokens a second']
    - [Q6_K, '68%', '22 tokens a second']
    - [Q8_0, '66%', '7 tokens a second']
    - [F16 (full size), '68%', '11 tokens a second']

relatedModels:
  - patent-strategist
relatedReading:
  - title: Picking the best legal build by the numbers
    href: https://ainative.business/field-notes/becoming-a-legal-curator-on-spark/
relatedBook: ai-research-on-nvidia-dgx-spark

outbound:
  - label: GGUF files (ready to run)
    href: https://huggingface.co/Orionfold/Saul-7B-Instruct-v1-GGUF
    kind: huggingface

sources:
  - section: overview
    type: hf-card
    ref: Orionfold/Saul-7B-Instruct-v1-GGUF
    lastSynced: '2026-05-26'
  - section: benchmarks
    type: field-notes
    ref: articles/becoming-a-legal-curator-on-spark/
    lastSynced: '2026-05-26'
---

Saul 7B Instruct is an open AI model tuned for legal text. Legal work is full of
careful reading, like contracts, filings, and case files, and much of it is
private. This model reads and answers in private, fully offline, so client
matters never leave the room.

## What it can do

It follows plain instructions on legal tasks: sum up a contract, pull out the
key duties and dates, explain a clause in simple words, or draft a first pass at
a routine document. It is built on Equall's Saul-7B-Instruct, an open model
trained on legal material, and packed into ready-to-run files for a single
desktop.

## How well it works

We scored five builds on LegalBench, a 50-question legal test, on a small Spark
desktop. The Q5_K_M build scored the best at 72 percent while running at about
20 tokens a second. If you want more speed, the Q4_K_M build is faster, at 29
tokens a second, and still scores 62 percent. The table above lists every build.

This is a short test, and it is not legal advice. Use the model as a fast first
reader, and always have a person check its work before it matters.

## How to run it

Download the GGUF files (the ready-to-run format) and run them with llama.cpp on
a Spark-class desktop, a small AI machine with 128 GB of memory. Pick Q5_K_M for
the best answers, or Q4_K_M when you want it faster.
