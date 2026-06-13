---
# P2 software pilot (spec §3, "Software → SPONSOR"; began as the P1 smoke entry).
# It is the homepage software deep-link target (/software/ai-native-platform/),
# so curating this entry doubles as the software shape of the one-of-each pilot.
# Sections are data-gated, so it exercises the full software scroll: hero, code
# tabs, gallery (real screenshots), specs, narrative, sponsor tiers. No benchmark
# table here — we have no measured platform numbers to quote, and the engine just
# omits the section. Copy is grade 3-5 (website-copy-style).
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

gallery:
  - src: ../../../assets/platform/ai-native-platform.png
    alt: The AI Native Platform screen showing a task running step by step.
    caption: Hand the platform a task and watch each step as it runs.
  - src: ../../../assets/neosignal/neosignal-models.png
    alt: A model intelligence view comparing AI models side by side.
    caption: See how models, chips, and clouds stack up before you pick one.

relatedModels: [patent-strategist]
relatedBook: ai-native-business
relatedReading:
  - title: My first model on a desktop
    href: /story/my-first-model-on-a-desktop/

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
    ref: /Users/manavsehgal/orionfold/ainative/docs
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
