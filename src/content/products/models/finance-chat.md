---
# P4 model page (spec §3, "Model → SPONSOR"). slug = slugify("Finance Chat") =
# finance-chat, matching the listing card + roadmap id, so the card routes inward
# and the Sponsor tiers pre-select model:finance-chat. Facts from the donor
# artifact YAML (finance-chat-gguf) + the gguf-publisher field note: five GGUF
# builds, FinanceBench mini-eval (a strict exact-number test, scores are low and
# we say so), Spark throughput. License is "free" (no model license key in the
# YAML, same as models.ts). TrustBlock fills from the P3 HF snapshot (503
# downloads). Copy is grade 3-5, jargon glossed; conversion = inline Sponsor tiers.
type: model
slug: finance-chat
valueProp: An open AI model for finance and money questions in plain chat. It runs fully offline on a small desktop, so account details and deal terms never leave your machine.

chips:
  - label: Field
    value: Finance
  - label: Runs
    value: Fully offline
  - label: Built on
    value: AdaptLLM finance-chat
  - label: License
    value: Free to use

install:
  - label: Hugging Face
    lang: bash
    code: huggingface-cli download Orionfold/finance-chat-GGUF
  - label: llama.cpp
    lang: bash
    code: llama-cli -hf Orionfold/finance-chat-GGUF:Q4_K_M

usage:
  - label: Ask a question
    lang: bash
    code: llama-cli -hf Orionfold/finance-chat-GGUF:Q4_K_M -p "Explain the difference between gross margin and net margin."
  - label: Python
    lang: python
    code: |
      from llama_cpp import Llama

      llm = Llama.from_pretrained(
          repo_id="Orionfold/finance-chat-GGUF",
          filename="*Q4_K_M.gguf",
      )
      out = llm("Explain the difference between gross margin and net margin.")
      print(out["choices"][0]["text"])

specs:
  - label: Base model
    value: AdaptLLM/finance-chat
  - label: Format
    value: GGUF (ready to run)
  - label: Builds
    value: Q4_K_M · Q5_K_M · Q6_K · Q8_0 · F16
  - label: Best build
    value: Q4_K_M (about 31 tokens a second on a Spark desktop)
  - label: License
    value: Free to use

# Five builds on FinanceBench, a strict 50-question test that only counts an
# exact number as right, on a Spark desktop. Scores are low (14-18%) and that is
# the honest weak spot. tok/s rounded from the YAML (31.09/26.95/23.86/8.87/11.51).
benchmarks:
  columns: [Build, FinanceBench score, Speed on a Spark]
  rows:
    - [Q4_K_M (fastest), '14%', '31 tokens a second']
    - [Q5_K_M, '16%', '27 tokens a second']
    - [Q6_K, '16%', '24 tokens a second']
    - [Q8_0, '18%', '9 tokens a second']
    - [F16 (full size), '18%', '12 tokens a second']

relatedModels:
  - patent-strategist
relatedReading:
  - title: Shrinking a model with almost no quality loss
    href: https://ainative.business/field-notes/becoming-a-gguf-publisher-on-spark/
relatedBook: ai-research-on-nvidia-dgx-spark

outbound:
  - label: GGUF files (ready to run)
    href: https://huggingface.co/Orionfold/finance-chat-GGUF
    kind: huggingface

sources:
  - section: overview
    type: hf-card
    ref: Orionfold/finance-chat-GGUF
    lastSynced: '2026-05-26'
  - section: benchmarks
    type: field-notes
    ref: articles/becoming-a-gguf-publisher-on-spark/
    lastSynced: '2026-05-26'
---

Finance Chat is an open AI model for money and finance questions in plain chat.
It runs fully offline on a small desktop, so account numbers, deal terms, and
other private figures never leave your machine.

## What it can do

It talks through finance ideas in simple words: what a margin is, how a balance
sheet fits together, or what a term in a deal means. It is built on AdaptLLM's
finance-chat, an open model trained on finance text, and packed into ready-to-run
files for a single desktop.

## How well it works

We scored five builds on FinanceBench, a strict 50-question test that only
counts an exact number as right. The scores are low, 14 to 18 percent, and this
is the honest weak spot: the model is good at explaining finance in words, but
not at pulling exact figures out of a filing. So use it to learn and to draft,
and check every number yourself. One nice find from our testing: the Q8_0 build
matches the full-size model almost exactly while taking far less space.

## How to run it

Download the GGUF files (the ready-to-run format) and run them with llama.cpp on
a Spark-class desktop, a small AI machine with 128 GB of memory. The Q4_K_M
build is the fastest, at about 31 tokens a second, and a good place to start.
