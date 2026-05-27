---
# P6 software rollout #1 (spec §5.5, "Software -> SPONSOR"). Authored from the
# repo README (navam-io/memo) + two real product screenshots from images/.
# Sections are data-gated: hero, chips, install (clone + build), usage (go fully
# local with Ollama), specs, gallery, sponsor tiers, related rail. No benchmark
# table (a browser tool has no measured numbers to quote). Copy is grade 3-5,
# no em-dashes (website-copy-style); jargon is glossed inline.
type: software
slug: memo
valueProp: Save anything you find online, then ask questions about it later. Pick the AI you trust, even a private one that runs on your own machine.

chips:
  - label: Runs in
    value: Chrome
  - label: Works with
    value: 4 AI helpers
  - label: Your data
    value: Stays local
  - label: Cost
    value: Free and open

install:
  - label: Clone and build
    lang: bash
    code: |
      git clone https://github.com/navam-io/memo.git
      cd memo
      npm install
      npm run build
  - label: Load in Chrome
    lang: bash
    code: |
      # 1. Open chrome://extensions/
      # 2. Turn on Developer mode (top right)
      # 3. Click "Load unpacked" and pick the memo folder

usage:
  - label: Go fully private
    lang: bash
    code: |
      # Install Ollama, then pull a local model.
      # Pick it in Memo's settings to keep every chat on your machine.
      ollama pull llama3.1

specs:
  - label: Runs on
    value: Chrome (Manifest V3)
  - label: Works with
    value: Claude, GPT, Gemini, and Ollama
  - label: Storage
    value: On your machine, sync is optional
  - label: License
    value: MIT (free to use)

gallery:
  - src: ../../../assets/projects/memo/chat.png
    alt: The Memo side panel showing a chat about saved content with source links.
    caption: Ask questions about everything you saved, with links back to the source.
  - src: ../../../assets/projects/memo/library.png
    alt: A list of saved memos with AI-written summaries and tags.
    caption: Each capture is summarized and tagged for you, so it is easy to find again.

relatedModels: [patent-strategist]
relatedBook: ai-native-business
relatedReading:
  - title: Picking open models over closed
    href: /story/picking-open-models-over-closed/

outbound:
  - label: memo on GitHub
    href: https://github.com/navam-io/memo
    kind: github

sources:
  - section: overview
    type: github-readme
    ref: navam-io/memo
    lastSynced: '2026-05-27'
  - section: gallery
    type: docs-screenshots
    ref: /Users/manavsehgal/Developer/memo/images
    lastSynced: '2026-05-27'
---

Memo is a Chrome add-on that turns your browsing into a chat. You click to save an
article, a product page, or even a YouTube video, and Memo keeps it for you. Later
you can ask questions about everything you saved and get answers in plain words.

## What you can do

Point and click to grab any part of a page, and Memo writes a short summary and
suggests tags so you never have to file things by hand. YouTube videos come in with
their transcripts too. Then you chat: ask "what did I save about React?" and Memo
answers using only your own saved notes, with a link back to each source.

## Your AI, your choice

Memo works with four AI helpers: Claude, GPT, Gemini, or Ollama. Ollama runs a model
right on your own computer, so for private work nothing ever leaves your machine. Your
saved content lives on your computer by default, with no tracking and no analytics.

## Who it is for

Anyone who finds great things online and loses them. Researchers, shoppers, and
lifelong learners turn a pile of bookmarks into a knowledge base they can actually
talk to.
