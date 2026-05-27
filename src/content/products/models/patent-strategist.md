---
# P2 pilot — the model shape (spec §3, "Model → SPONSOR"). The model slug is
# slugify(title) = patent-strategist, so findRecords returns BOTH NeMo builds
# (the GGUF files + the LoRA adapter) that share the title; the page speaks for
# the model as a whole and points builders at each build in Resources. Facts are
# the real ones from the donor artifact YAMLs (patent-strategist-v3-nemo-gguf +
# patent-strategist-bench-v0.1): Spark throughput, perplexity, and the seven-shape
# bench results. Copy is grade 3-5 with patent jargon glossed (website-copy-style);
# the conversion point is the inline Sponsor tiers (SponsorBlock), pre-selected to
# model:patent-strategist so a sponsorship traces back to this work.
type: model
slug: patent-strategist
valueProp: An open AI model that reasons about patents, the legal cover for inventions. It runs fully offline on a small desktop, so your ideas and filings never leave the room.

chips:
  - label: Field
    value: Patents
  - label: Runs
    value: Fully offline
  - label: Built on
    value: DeepSeek R1 8B
  - label: License
    value: Apache-2.0, free

# Get the weights (the model files). HuggingFace CLI or straight from llama.cpp.
install:
  - label: Hugging Face
    lang: bash
    code: huggingface-cli download Orionfold/patent-strategist-v3-nemo-GGUF
  - label: llama.cpp
    lang: bash
    code: llama-cli -hf Orionfold/patent-strategist-v3-nemo-GGUF:Q5_K_M

# Run it. A quick prompt at the terminal, or from Python.
usage:
  - label: Ask a question
    lang: bash
    code: llama-cli -hf Orionfold/patent-strategist-v3-nemo-GGUF:Q5_K_M -p "Walk through claim construction for a Markush group."
  - label: Python
    lang: python
    code: |
      from llama_cpp import Llama

      llm = Llama.from_pretrained(
          repo_id="Orionfold/patent-strategist-v3-nemo-GGUF",
          filename="*Q5_K_M.gguf",
      )
      out = llm("Walk through claim construction for a Markush group.")
      print(out["choices"][0]["text"])

specs:
  - label: Base model
    value: DeepSeek-R1-0528-Qwen3-8B
  - label: Made with
    value: NVIDIA NeMo toolkit
  - label: Format
    value: GGUF (ready to run) and LoRA adapter
  - label: Builds
    value: Q4_K_M · Q5_K_M · Q6_K · Q8_0
  - label: Best build
    value: Q5_K_M (about 35 tokens a second on a Spark desktop)
  - label: License
    value: Apache-2.0 (free to use)

# The reasoning proof, from the 200-question Patent Strategist Bench. Three setups:
# closed = no help, with search = it looks things up, with the exact source = it is
# handed the right rule. (Real results: D-mcq, D-irac, overall — bench v0.1.)
benchmarks:
  columns: [What we tested, No help, With search, Given the source]
  rows:
    - [Patent-law multiple choice, '63%', '85%', '95%']
    - [Office-action structure, '100%', '100%', '100%']
    - [All tasks together, '40%', '49%', '54%']

relatedReading:
  - title: How we tested it before training
    href: https://ainative.business/field-notes/patent-strategist-v1-baseline-on-spark/
  - title: Two ways to train it, and which one won
    href: https://ainative.business/field-notes/patent-strategist-bakeoff-unsloth-vs-nemo-framework/
  - title: The 200 question test set
    href: https://huggingface.co/datasets/Orionfold/patent-strategist-bench-v0.1
relatedBook: field-notes

outbound:
  - label: GGUF files (ready to run)
    href: https://huggingface.co/Orionfold/patent-strategist-v3-nemo-GGUF
    kind: huggingface
  - label: LoRA adapter (for builders)
    href: https://huggingface.co/Orionfold/patent-strategist-v3-nemo
    kind: huggingface

sources:
  - section: overview
    type: hf-card
    ref: Orionfold/patent-strategist-v3-nemo-GGUF
    lastSynced: '2026-05-26'
  - section: benchmarks
    type: hf-card
    ref: Orionfold/patent-strategist-bench-v0.1
    lastSynced: '2026-05-26'
---

Patent Strategist is an open AI model tuned to reason about patents. A patent is
the legal cover that protects an invention, and the work around it, like writing
claims and answering the patent office, is slow, careful, and full of private
client text. This model does that reasoning fully offline, so none of that text
ever leaves your machine.

## What it can do

It helps with the day to day of patent work: shaping the claims that define an
invention, drafting replies to the patent office that point to the right rule,
weighing how close earlier inventions are, and thinking through licensing deals.
It is built on DeepSeek R1, a strong reasoning model, and made smaller and
sharper with NVIDIA's NeMo toolkit so it fits on a single small desktop.

## How well it works

We scored it on our own 200-question test set, in three setups: with no help,
with the ability to look things up, and when handed the exact rule it needs. On
multiple-choice patent law it climbs from 63 to 95 percent as it gets more help,
and it nails the structure of an office-action reply every time. The numbers
above tell the full story.

It is not perfect. A couple of made-up rule citations slipped in from the
training data, so treat it as a sharp first draft and always check its sources.

## How to run it

Download the GGUF files (the ready-to-run format) and run them with llama.cpp on
a Spark-class desktop, a small AI machine with 128 GB of memory. The Q5_K_M
build is the sweet spot: about 35 tokens a second, with quality close to the
largest build. Builders who want to fold the patent skill into their own model
can grab the LoRA adapter, a small training patch, instead.
