---
# New model rollout 2026-06-07 (the Kepler release wave). Authored from the
# Hugging Face model card (Orionfold/Kepler-GGUF) + the methods article "The
# Gate Before the GPU" (ainative.business/field-notes/the-gate-before-the-gpu/).
# Every number is a measured run copied exactly from the card: the quant ladder
# on astro-bench v0.1 (n=44, boxed-answer verifier, ±2% tolerance) and the
# matched-budget frontier comparison (84.1% vs Haiku 97.7% / Gemini Flash-Lite
# 95.5%, ~166 vs ~460-490 output tokens). The card is honest about weak spots
# (multi-burn transfers, inverse period problems), so the page is too. A model
# has no first-party screenshots, so the page is gallery-less and the code tabs
# carry it. Copy grade 3-5, no em-dashes, jargon glossed (website-copy-style).
type: model
slug: kepler
valueProp: An open AI model for space math. Ask it an orbit question and it shows short work that ends in one number you can check. It runs fully offline on a small desktop, for free.

chips:
  - label: Field
    value: Space math
  - label: Runs
    value: Fully offline
  - label: Built on
    value: Qwen3 8B
  - label: License
    value: Apache-2.0, free

# Get the weights (the model files). HuggingFace CLI or straight from llama.cpp.
install:
  - label: Hugging Face
    lang: bash
    code: huggingface-cli download Orionfold/Kepler-GGUF model-Q8_0.gguf --local-dir ./models/kepler
  - label: llama.cpp
    lang: bash
    code: llama-cli -hf Orionfold/Kepler-GGUF:Q8_0

# Run it. A local server with an OpenAI-style API, or straight from Python.
usage:
  - label: Serve it locally
    lang: bash
    code: |
      # A small server on your own machine. Anything that talks to
      # OpenAI-style APIs can now talk to Kepler instead.
      llama-server -m ./models/kepler/model-Q8_0.gguf \
        -c 4096 -ngl 99 --host 0.0.0.0 --port 8080
  - label: Python
    lang: python
    code: |
      from llama_cpp import Llama

      llm = Llama(
          model_path="./models/kepler/model-Q8_0.gguf",
          n_ctx=4096, n_gpu_layers=99, chat_format="chatml",
      )
      out = llm.create_chat_completion(messages=[{
          "role": "user",
          "content": "A satellite circles Earth 550 km up. What is its "
                     "orbital period in minutes? Give your final answer "
                     "as \\boxed{value unit}.",
      }])
      print(out["choices"][0]["message"]["content"])

specs:
  - label: Base model
    value: Qwen/Qwen3-8B
  - label: Taught with
    value: 600 worked space problems, every one checked by a program
  - label: Format
    value: GGUF (ready to run)
  - label: Builds
    value: Q4_K_M · Q5_K_M · Q6_K · Q8_0
  - label: Best build
    value: Q8_0 (8.2 GB, keeps almost all the quality)
  - label: License
    value: Apache-2.0 (free to use)

# The real per-build scores from the model card: the 44-question held-out space
# test (astro-bench v0.1), answers checked by a program to within 2 percent.
benchmarks:
  columns: [Build, Size, Right answers (44-question test)]
  rows:
    - [Q4_K_M, 4.7 GB, '75.0%']
    - [Q5_K_M, 5.5 GB, '75.0%']
    - [Q6_K, 6.3 GB, '84.1%']
    - [Q8_0, 8.2 GB, '88.6%']

relatedReading:
  - title: The story of the run that built it
    href: /story/the-run-i-almost-wasted/
  - title: How we picked the training method
    href: https://ainative.business/field-notes/the-gate-before-the-gpu/
  - title: The 44-question test set
    href: https://huggingface.co/datasets/Orionfold/Kepler-bench
relatedBook: ai-research-on-nvidia-dgx-spark

outbound:
  - label: GGUF files (ready to run)
    href: https://huggingface.co/Orionfold/Kepler-GGUF
    kind: huggingface
  - label: Kepler-bench (the test set)
    href: https://huggingface.co/datasets/Orionfold/Kepler-bench
    kind: huggingface

sources:
  - section: overview
    type: hf-card
    ref: Orionfold/Kepler-GGUF
    lastSynced: '2026-06-07'
  - section: benchmarks
    type: hf-card
    ref: Orionfold/Kepler-GGUF
    lastSynced: '2026-06-07'
---

Kepler is an open AI model for space math. That field is called orbital
mechanics, the math of how things move in space, like a satellite circling
Earth. Ask Kepler one of those questions and it shows a short chain of work,
then ends with one clear number you can check.

## What it can do

It answers word problems about orbits, speeds, and travel between planets. It
is built on Qwen3 8B, a strong small model, and taught with 600 worked space
problems. A checking program graded every one of those problems, so the model
learned from answers that were known to be right.

The teaching also fixed a bad habit. The base model would think forever and
run out of room before giving an answer. Kepler answers every time, never gets
cut off, and uses about a third of the words big cloud models spend on the
same question.

## How well it works

We score it on a held-out test of 44 space problems it never saw in training.
A program checks each answer to within 2 percent. The best build gets 88.6
percent right, and the full ladder is in the table above.

We also ran the same test against small frontier cloud models, with the same
rules for everyone. Kepler got 84.1 percent on that run. Claude Haiku 4.5 got
97.7 and Gemini Flash-Lite got 95.5. That is the honest read: the cloud models
are still better at the hardest multi-step problems. But Kepler runs on your
own desk, free, private, and offline, and it answers in 166 words of work on
average where the cloud models spend close to 500.

## Where it falls short

Two kinds of problems trip it up: two-burn transfers, the maneuvers that move
a craft between two orbits, and working backward from an orbit time to a
height. Treat its answers there as a first draft and check the number. We say
this plainly because the test set that found these gaps is public too.

## How to run it

Download the Q8_0 build, an 8.2 GB file, and run it with llama.cpp on a
Spark-class desktop, a small AI machine with 128 GB of memory. LM Studio and
Ollama load the same file with no extra setup. If memory is tight, the smaller
builds still work, they just miss more of the hardest problems.
