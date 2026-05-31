---
# P4 model page (spec §3, "Model → SPONSOR"). slug = slugify("SecurityLLM") =
# securityllm, the same id models.astro/roadmap use, so the listing card routes
# inward and the Sponsor tiers pre-select model:securityllm. Facts are the real
# ones from the donor artifact YAML (securityllm-gguf) + the field-notes article
# (becoming-a-cyber-curator-on-spark): five GGUF builds, CyberMetric mini-eval,
# Spark throughput. The TrustBlock fills in from the P3 HF snapshot (525 downloads).
# Copy is grade 3-5 with jargon glossed (website-copy-style); the conversion point
# is the inline Sponsor tiers (SponsorBlock).
type: model
slug: securityllm
valueProp: An open AI model for cyber security work, like spotting threats and writing up what they mean. It runs fully offline on a small desktop, so sensitive details never leave your network.

chips:
  - label: Field
    value: Cyber security
  - label: Runs
    value: Fully offline
  - label: Built on
    value: ZySec SecurityLLM
  - label: License
    value: Apache-2.0, free

# Get the weights (the model files). HuggingFace CLI or straight from llama.cpp.
install:
  - label: Hugging Face
    lang: bash
    code: huggingface-cli download Orionfold/SecurityLLM-GGUF
  - label: llama.cpp
    lang: bash
    code: llama-cli -hf Orionfold/SecurityLLM-GGUF:Q4_K_M

# Run it. A quick prompt at the terminal, or from Python.
usage:
  - label: Ask a question
    lang: bash
    code: llama-cli -hf Orionfold/SecurityLLM-GGUF:Q4_K_M -p "Explain how a SQL injection attack works and how to stop it."
  - label: Python
    lang: python
    code: |
      from llama_cpp import Llama

      llm = Llama.from_pretrained(
          repo_id="Orionfold/SecurityLLM-GGUF",
          filename="*Q4_K_M.gguf",
      )
      out = llm("Explain how a SQL injection attack works and how to stop it.")
      print(out["choices"][0]["text"])

specs:
  - label: Base model
    value: ZySec-AI/SecurityLLM
  - label: Format
    value: GGUF (ready to run)
  - label: Builds
    value: Q4_K_M · Q5_K_M · Q6_K · Q8_0 · F16
  - label: Best build
    value: Q4_K_M (about 48 tokens a second on a Spark desktop)
  - label: License
    value: Apache-2.0 (free to use)

# Five builds scored on CyberMetric, a 50-question security quiz, on a Spark
# desktop. Real numbers from the cyber-curator field note: the small fast build
# scores highest. tok/s rounded from the YAML (47.66/39.95/34.96/30.34/17.45).
benchmarks:
  columns: [Build, CyberMetric score, Speed on a Spark]
  rows:
    - [Q4_K_M (best pick), '40%', '48 tokens a second']
    - [Q5_K_M, '38%', '40 tokens a second']
    - [Q6_K, '36%', '35 tokens a second']
    - [Q8_0, '36%', '30 tokens a second']
    - [F16 (full size), '34%', '17 tokens a second']

relatedModels:
  - patent-strategist
relatedReading:
  - title: Why the smallest build scored best
    href: https://ainative.business/field-notes/becoming-a-cyber-curator-on-spark/
relatedBook: ai-research-on-nvidia-dgx-spark

outbound:
  - label: GGUF files (ready to run)
    href: https://huggingface.co/Orionfold/SecurityLLM-GGUF
    kind: huggingface

sources:
  - section: overview
    type: hf-card
    ref: Orionfold/SecurityLLM-GGUF
    lastSynced: '2026-05-26'
  - section: benchmarks
    type: field-notes
    ref: articles/becoming-a-cyber-curator-on-spark/
    lastSynced: '2026-05-26'
---

SecurityLLM is an open AI model tuned for cyber security. Security work means
finding weak spots, reading attack reports, and explaining what a threat does
and how to stop it. A lot of that text is sensitive, so this model does its
thinking fully offline, and nothing leaves your network.

## What it can do

It answers security questions in plain words, sums up threat reports, and walks
through how an attack works and how to defend against it. It is built on
ZySec-AI's SecurityLLM, an open model already trained on security material, and
packed into ready-to-run files so it starts fast on a single desktop.

## How well it works

We scored five builds on CyberMetric, a 50-question security quiz, on a small
Spark desktop. The surprise: the smallest, fastest build (Q4_K_M) scored the
best at 40 percent and ran at about 48 tokens a second. The full-size build was
both slower and a touch behind. So the cheap build is the one to run. The table
above has every build.

These scores come from a short quiz, not a full audit. Treat the model as a fast
helper for security questions, and always check its answers against trusted
sources before you act.

## How to run it

Download the GGUF files (the ready-to-run format) and run them with llama.cpp on
a Spark-class desktop, a small AI machine with 128 GB of memory. Start with the
Q4_K_M build: it is the fastest here and scored highest on our test.
