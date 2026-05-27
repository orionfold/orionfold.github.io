---
# P6 software rollout #1 (spec §5.5, "Software -> SPONSOR"). Authored from the
# repo README (navam-io/moments) + two real screenshots from blog/images/.
# Sections are data-gated: hero, chips, install, specs, gallery, sponsor, related
# rail. No usage tab (the flow is a web dashboard) and no benchmark table. Copy is
# grade 3-5, no em-dashes (website-copy-style); jargon glossed inline.
type: software
slug: moments
valueProp: The AI industry moves fast. Moments reads the flood of news, finds the turning points, and shows how they connect, all on your own computer.
chips:
  - label: Watches
    value: AI industry news
  - label: Finds
    value: The turning points
  - label: Runs
    value: On your computer
  - label: Cost
    value: Free and open

install:
  - label: Set it up
    lang: bash
    code: |
      git clone https://github.com/navam-io/moments.git
      cd moments
      npm install
      cp .env.example .env.local   # add your ANTHROPIC_API_KEY
      npm run dev                  # open http://localhost:3000

specs:
  - label: Built with
    value: Next.js, TypeScript, D3.js
  - label: Thinks with
    value: Claude (the Claude Code SDK)
  - label: Saves to
    value: Plain markdown files you can read
  - label: License
    value: MIT (free to use)

gallery:
  - src: ../../../assets/projects/moments/dashboard.png
    alt: The Moments dashboard showing AI industry signals and key metrics.
    caption: A clear dashboard turns a flood of news into the signals that matter.
  - src: ../../../assets/projects/moments/network.png
    alt: A force-directed graph linking companies and technologies in the AI industry.
    caption: See how companies and technologies connect, and which ones drive the most change.

relatedBook: ai-native-business

outbound:
  - label: moments on GitHub
    href: https://github.com/navam-io/moments
    kind: github

sources:
  - section: overview
    type: github-readme
    ref: navam-io/moments
    lastSynced: '2026-05-27'
  - section: gallery
    type: docs-screenshots
    ref: /Users/manavsehgal/Developer/moments/blog/images
    lastSynced: '2026-05-27'
---

Moments watches the AI business world and pulls out the moments that matter, like a big
funding round, a new partnership, or a rule change. A team of AI agents reads the content,
sorts it, and finds the links between the players, so you see the shape of the industry at
a glance.

## What you can do

Browse a dashboard built in three levels, from a high view for leaders down to the detail
of a single event. See companies and technologies laid out as a web of links, with the
busiest ones standing out, plus charts that track how fast each topic is growing.

## How it works

You point Moments at your own folders of news and notes. It only re-reads what changed, so
updates are fast. Everything is saved as plain markdown files you can open and edit by hand,
and it all runs on your own systems unless you choose to add a cloud AI key.

## Who it is for

Founders, investors, and strategy teams who need to spot a competitor's move months before
it shows up in the market, and builders who want to study how a multi-agent app is put
together.
