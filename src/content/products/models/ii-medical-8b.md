---
# P4 model page (spec §3, "Model → SPONSOR"). slug = slugify("II-Medical 8B") =
# ii-medical-8b, matching the listing card + roadmap id, so the card routes inward
# and the Sponsor tiers pre-select model:ii-medical-8b. Facts from the donor
# artifact YAML (ii-medical-8b-gguf) + the medical-curator field note: five GGUF
# builds, MedMCQA mini-eval, Spark throughput. The base model is a reasoning
# recipe (it works toward an answer step by step). TrustBlock fills from the P3 HF
# snapshot (420 downloads). Copy is grade 3-5, jargon glossed; conversion = inline
# Sponsor tiers. We are clear it is a study helper, never a doctor.
type: model
slug: ii-medical-8b
valueProp: An open AI model for medical questions and clinical text. It runs fully offline on a small desktop, so patient details never leave the clinic.

chips:
  - label: Field
    value: Medicine
  - label: Runs
    value: Fully offline
  - label: Built on
    value: II-Medical 8B
  - label: License
    value: Apache-2.0, free

install:
  - label: Hugging Face
    lang: bash
    code: huggingface-cli download Orionfold/II-Medical-8B-GGUF
  - label: llama.cpp
    lang: bash
    code: llama-cli -hf Orionfold/II-Medical-8B-GGUF:Q5_K_M

usage:
  - label: Ask a question
    lang: bash
    code: llama-cli -hf Orionfold/II-Medical-8B-GGUF:Q5_K_M -p "Explain the difference between Type 1 and Type 2 diabetes."
  - label: Python
    lang: python
    code: |
      from llama_cpp import Llama

      llm = Llama.from_pretrained(
          repo_id="Orionfold/II-Medical-8B-GGUF",
          filename="*Q5_K_M.gguf",
      )
      out = llm("Explain the difference between Type 1 and Type 2 diabetes.")
      print(out["choices"][0]["text"])

specs:
  - label: Base model
    value: Intelligent-Internet/II-Medical-8B
  - label: Format
    value: GGUF (ready to run)
  - label: Builds
    value: Q4_K_M · Q5_K_M · Q6_K · Q8_0 · F16
  - label: Best build
    value: Q5_K_M (about 36 tokens a second on a Spark desktop)
  - label: License
    value: Apache-2.0 (free to use)

# Five builds on MedMCQA, a 50-question medical exam test, on a Spark desktop.
# Real numbers from the medical-curator field note: Q5_K_M scores best (52%),
# above the full size build. tok/s rounded from the YAML (43.57/36.36/32.8/28.42/15.94).
benchmarks:
  columns: [Build, MedMCQA score, Speed on a Spark]
  rows:
    - [Q4_K_M, '42%', '44 tokens a second']
    - [Q5_K_M (best pick), '52%', '36 tokens a second']
    - [Q6_K, '46%', '33 tokens a second']
    - [Q8_0, '48%', '28 tokens a second']
    - [F16 (full size), '48%', '16 tokens a second']

relatedModels:
  - patent-strategist
relatedReading:
  - title: A reasoning model, measured on a desktop
    href: https://ainative.business/field-notes/becoming-a-medical-curator-on-spark/
relatedBook: ai-research-on-nvidia-dgx-spark

outbound:
  - label: GGUF files (ready to run)
    href: https://huggingface.co/Orionfold/II-Medical-8B-GGUF
    kind: huggingface

sources:
  - section: overview
    type: hf-card
    ref: Orionfold/II-Medical-8B-GGUF
    lastSynced: '2026-05-26'
  - section: benchmarks
    type: field-notes
    ref: articles/becoming-a-medical-curator-on-spark/
    lastSynced: '2026-05-26'
---

II-Medical 8B is an open AI model for medical questions and clinical text. It
runs fully offline on a small desktop, so patient details never leave the
clinic.

## What it can do

It answers health and medical questions, explains conditions and terms in plain
words, and works through clinical text step by step. It is built on
Intelligent-Internet's II-Medical-8B, which learned to reason its way to an
answer rather than just guess, and it is packed into ready-to-run files for a
single desktop.

## How well it works

We scored five builds on MedMCQA, a 50-question medical exam test, on a small
Spark desktop. The Q5_K_M build scored the best at 52 percent, above the
full-size build, while running at about 36 tokens a second. The table above
shows every build.

This is a short test, and the model is a study and drafting helper, not a
doctor. It can be wrong, so never use it to make a real medical decision. Always
check with a qualified clinician.

## How to run it

Download the GGUF files (the ready-to-run format) and run them with llama.cpp on
a Spark-class desktop, a small AI machine with 128 GB of memory. The Q5_K_M
build is the sweet spot here: the best score and a healthy 36 tokens a second.
