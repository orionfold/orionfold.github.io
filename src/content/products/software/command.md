---
# P6 software rollout #1 (spec §5.5, "Software -> SPONSOR"). Authored from the
# repo README (navam-io/command) + two real screenshots from images/. Command is
# a pip-installed CLI, so it has a rich install + usage flow (unlike the GUI apps).
# Sections are data-gated: hero, chips, install (pip + init), usage (ask + go
# local), specs, gallery, sponsor, related rail. No benchmark table. relatedModels
# includes patent-strategist because Command can run our open models locally via
# Ollama. Copy is grade 3-5, no em-dashes (website-copy-style).
type: software
slug: command
valueProp: Bring fast, private AI right into your terminal. Run more than 15 models, including ones on your own laptop, with three simple commands.

chips:
  - label: Runs in
    value: Your terminal
  - label: Models
    value: 15+ across 7 hosts
  - label: Privacy
    value: Local-first
  - label: Install
    value: pip

install:
  - label: pip
    lang: bash
    code: |
      pip install -U command
      cmnd init   # copy the config and quick-start samples
      cmnd id     # show the model in use

usage:
  - label: Ask anything
    lang: bash
    code: ask "How old is the oldest pyramid?"
  - label: Go fully local
    lang: bash
    code: |
      # Point Command at a model running on your own machine.
      cmnd config ask provider ollama
      cmnd config ask model llama
      ask "Summarize these notes for me"

specs:
  - label: Install
    value: pip (Python 3.12+)
  - label: Models
    value: 15+ across 7 hosts
  - label: Hosts
    value: Claude, OpenAI, Google, Groq, Ollama, and more
  - label: Works with
    value: VS Code, Obsidian, and plain markdown

gallery:
  - src: ../../../assets/projects/command/workflow.png
    alt: The Command terminal showing a streamed answer formatted as markdown.
    caption: Ask a question and watch the answer stream into your terminal, nicely formatted.
  - src: ../../../assets/projects/command/compare.png
    alt: Two terminals side by side running the same prompt on different models.
    caption: Run the same prompt on different models side by side to see how they compare.

relatedModels: [patent-strategist]
relatedBook: ai-native-business
relatedReading:
  - title: Picking open models over closed
    href: /story/picking-open-models-over-closed/
  - title: Shipping models from one small desktop
    href: /story/shipping-models-from-one-small-desktop/

outbound:
  - label: command on GitHub
    href: https://github.com/navam-io/command
    kind: github

sources:
  - section: overview
    type: github-readme
    ref: navam-io/command
    lastSynced: '2026-05-27'
  - section: gallery
    type: docs-screenshots
    ref: /Users/manavsehgal/Developer/command/images
    lastSynced: '2026-05-27'
---

Command turns your terminal into a fast, personal AI app. No browser tabs, no extra apps,
no switching back and forth. You type `ask` and a question, and the answer streams right
into your terminal, with tables and code laid out cleanly.

## What you can do

Reach more than 15 models from 7 hosts, from Claude and GPT to private models running on
your own laptop. Swap models with one short command, so you can use a fast cheap one for
quick questions and a stronger one for hard work. Save your tasks and prompts as plain
markdown, then run models over them right inside VS Code or Obsidian.

## Your privacy, your rules

Run everything on your own machine with Ollama and nothing leaves your laptop. There is no
tracking and no analytics, your API keys stay in a local file, and you decide what gets
saved and where.

## Who it is for

Writers, researchers, and builders who live in the terminal and want AI that is fast,
private, and fully theirs. Get going with three commands, then tune it as much as you like
through one config file.
