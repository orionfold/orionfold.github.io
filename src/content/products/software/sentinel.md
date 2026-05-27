---
# P6 software rollout #1 (spec §5.5, "Software -> SPONSOR"). Authored from the
# repo README (navam-io/sentinel) + one real canvas screenshot (the repo's only
# product shot, from blogs/visual-first-design/). Sentinel's "usage" is the YAML
# a visual test compiles to, so the usage tab shows that real generated spec.
# Sections are data-gated: hero, chips, install (desktop + backend), usage (the
# YAML), specs, gallery, sponsor, related rail. No benchmark table. Copy is grade
# 3-5, no em-dashes (website-copy-style); jargon glossed inline.
type: software
slug: sentinel
valueProp: Test your AI agents by dragging boxes on a canvas, the way Postman made testing APIs simple. Every test you build saves as clean, shareable text.

chips:
  - label: Type
    value: Desktop app
  - label: Build tests
    value: By dragging boxes
  - label: Saves as
    value: Clean YAML
  - label: Cost
    value: Free and open

install:
  - label: Desktop app
    lang: bash
    code: |
      git clone https://github.com/navam-io/sentinel.git
      cd sentinel/frontend
      npm install
      npm run tauri:dev   # opens the visual canvas
  - label: Backend (Python)
    lang: bash
    code: |
      cd sentinel/backend
      python3 -m venv venv && source venv/bin/activate
      pip install -e ".[dev]"
      uvicorn main:app --reload   # API at http://localhost:8000/docs

usage:
  - label: A test, as text
    lang: yaml
    code: |
      # The canvas writes this for you, but you can edit it by hand too.
      name: "Geography Quiz"
      category: "qa"
      model:
        provider: "openai"
        model: "gpt-5.1"
      inputs:
        - query: "What is the capital of France?"
      assertions:
        - type: "must_contain"
          value: "Paris"
        - type: "max_latency_ms"
          value: 2000

specs:
  - label: Type
    value: Desktop app (Tauri) and browser
  - label: Build tests
    value: A visual canvas or plain YAML
  - label: Works with
    value: Claude and OpenAI
  - label: Built with
    value: React, FastAPI, Python
  - label: License
    value: MIT (free to use)

gallery:
  - src: ../../../assets/projects/sentinel/canvas.png
    alt: The Sentinel visual canvas with a test built from connected boxes and a palette of node types.
    caption: Build a test by dragging boxes and joining them, no code required.

relatedBook: ai-native-business

outbound:
  - label: sentinel on GitHub
    href: https://github.com/navam-io/sentinel
    kind: github

sources:
  - section: overview
    type: github-readme
    ref: navam-io/sentinel
    lastSynced: '2026-05-27'
  - section: gallery
    type: docs-screenshots
    ref: /Users/manavsehgal/Developer/sentinel/blogs/visual-first-design
    lastSynced: '2026-05-27'
---

Sentinel makes testing an AI agent as simple as Postman made testing an API. You build a
test by dragging boxes onto a canvas and joining them, no code needed. Behind the scenes it
writes a clean text file, so your tests are easy to read, share, and track in version
control.

## What you can do

Start from one of 16 ready-made templates across 12 kinds of tests, from simple question
and answer to safety checks and code generation. Drag in the pieces you need, set what a
good answer looks like, then run the test and watch it pass or fail. Prefer to type? Edit
the same test as plain YAML, and the canvas and the text stay in sync both ways.

## How it checks answers

You pick from clear rules: the answer must contain a word, must not contain another, must
match a pattern, must call a tool, or must come back fast enough. Because every test is the
same text every time, results are steady and easy to repeat.

## Who it is for

Researchers, product managers, and safety teams who need to check that an agent behaves,
without writing test code. It runs as a desktop app, so your tests stay on your own machine.
