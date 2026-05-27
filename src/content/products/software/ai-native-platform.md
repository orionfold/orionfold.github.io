---
# P1 smoke entry (spec §5.2 "one smoke entry to prove the render"). Deliberately
# maximal: it populates every software-applicable section so the adaptive engine
# is exercised end to end. P2 authors the real one-of-each pilot (this entry's
# copy/screenshots/benchmarks get curated then). The book-only sections (BuyBox,
# BookContents) are proven by P2's book entry.
type: software
slug: ai-native-platform
valueProp: Run AI helpers on your own computer, hand them work, and watch every step. No cloud, and your data never leaves your machine.

chips:
  - label: Runs
    value: On your computer
  - label: Setup
    value: A few minutes
  - label: Cost
    value: Free and open
  - label: Works with
    value: Local + cloud models

install:
  - label: pip
    lang: bash
    code: pip install ainative
  - label: uv
    lang: bash
    code: uv add ainative

usage:
  - label: Run a task
    lang: bash
    code: ainative run "summarize my notes"
  - label: Python
    lang: python
    code: |
      from ainative import Agent

      agent = Agent()
      agent.run("summarize my notes")

specs:
  - label: Runs on
    value: macOS, Linux, Windows
  - label: Language
    value: Python 3.10+
  - label: Models
    value: Local and cloud
  - label: License
    value: Open source

benchmarks:
  columns: [Task, On your laptop, In the cloud]
  rows:
    - [Summarize a page, 12s, 4s]
    - [Search your files, 3s, 2s]
    - [Draft a plan, 20s, 8s]

gallery:
  - src: ../../../assets/platform/ai-native-platform.png
    alt: The AI Native Platform screen showing a task running step by step.
    caption: Hand the platform a task and watch each step as it runs.
  - src: ../../../assets/neosignal/neosignal-models.png
    alt: A model intelligence view comparing AI models side by side.
    caption: See how models, chips, and clouds stack up before you pick one.

testimonials:
  - quote: I run everything on my own laptop now. It is fast, and nothing leaves my machine.
    author: A early user
    role: Indie builder
  - quote: The cost tracker alone paid for the time it took to set up.
    author: A small team lead
    role: Two person studio

relatedModels: [patent-strategist]
relatedBook: ai-native-business
relatedReading:
  - title: Shipping models from one small desktop
    href: /story/shipping-models-from-one-small-desktop/

outbound:
  - label: AI Native Platform docs
    href: https://ainative.business/docs/
    kind: docs
  - label: navam-io on GitHub
    href: https://github.com/navam-io
    kind: github

sources:
  - section: overview
    type: github-readme
    ref: navam-io/ainative
    lastSynced: '2026-05-26'
  - section: gallery
    type: docs-screenshots
    ref: /Users/manavsehgal/Developer/ainative/docs
    lastSynced: '2026-05-26'
---

The AI Native Platform is one place to run AI on your own computer. You hand it a
task, and it does the work for you with the models you choose, local or cloud.

## What you can do

Build flows that run step by step, set them on a schedule, and watch the work as
it goes. The platform tracks what each run costs, so you always know the price
before you scale up. Everything runs on your machine, so your data stays with you.

## Who it is for

Builders who want the power of AI without sending their files to someone else's
server. Start small with one task, then grow into full flows when you are ready.
