---
# P7 software rollout #2 (spec §5.5, "Software -> SPONSOR"). Authored from the
# repo README/AGENTS (Developer/openvolo) and three real app screenshots from the
# repo root. OpenVolo ships on npm and runs as one command (npx), so install is a
# single line. Data stays local in SQLite; AI drafting is done by Claude. Copy is
# grade 3-5, no em-dashes, jargon glossed inline.
type: software
slug: openvolo
valueProp: Keep your contacts and posts for X, LinkedIn, and Gmail in one place on your own computer. AI helpers draft your messages and sort your outreach for you.

chips:
  - label: Start with
    value: npx openvolo
  - label: Connects
    value: X, LinkedIn, Gmail
  - label: Your data
    value: Stays on your machine
  - label: Cost
    value: Free and open

install:
  - label: One command
    lang: bash
    code: |
      # The first run sets up a small database in ~/.openvolo
      # and opens the app at http://localhost:3000
      npx openvolo

usage:
  - label: Connect and sync
    lang: bash
    code: |
      # 1. Run it
      npx openvolo
      # 2. Open http://localhost:3000, go to Settings, and sign in
      #    to X, LinkedIn, or Gmail (one secure login each).
      # 3. Open Contacts and click Sync to pull in your people.

specs:
  - label: How it runs
    value: One command opens a web app on your machine
  - label: Your data
    value: A local database in ~/.openvolo, keys kept encrypted
  - label: Connects
    value: X, LinkedIn, and Gmail (you sign in once each)
  - label: The drafting
    value: Done by Claude
  - label: Needs
    value: Node 20 or newer
  - label: License
    value: Apache 2.0 (free to use)

gallery:
  - src: ../../../assets/projects/openvolo/ai-assist.png
    alt: The OpenVolo compose screen with an AI assist panel drafting a post.
    caption: Ask for a draft and the AI panel writes one you can edit and send.
  - src: ../../../assets/projects/openvolo/adapt.png
    alt: A post being reshaped from X to LinkedIn with the longer format applied.
    caption: Write once, then let it reshape the post to fit each network.
  - src: ../../../assets/projects/openvolo/compose.png
    alt: The compose dialog for a new post before any text is added.
    caption: One place to write for X, LinkedIn, and Gmail.

relatedBook: ai-native-business
relatedReading:
  - title: Building in public
    href: /story/building-in-public/

outbound:
  - label: Visit OpenVolo
    href: https://openvolo.com
    kind: site
  - label: OpenVolo on GitHub
    href: https://github.com/navam-io/openvolo
    kind: github

sources:
  - section: overview
    type: github-readme
    ref: navam-io/openvolo
    lastSynced: '2026-05-27'
  - section: gallery
    type: docs-screenshots
    ref: /Users/manavsehgal/Developer/openvolo
    lastSynced: '2026-05-27'
---

OpenVolo is a contact book and posting helper for X, LinkedIn, and Gmail, and it all
runs on your own computer. It pulls your followers, connections, and email contacts
into one list, then helps you reach out, draft messages, and keep track of who is who.
Your contacts and your drafts stay on your machine.

## One list, no duplicates

Connect X, LinkedIn, and Gmail once each, and OpenVolo gathers your people into a
single list. If the same person shows up on more than one network, it spots that and
keeps one clean entry instead of three. Each contact gets a simple score that tells you
how complete their details are.

## AI that drafts and reshapes

Ask the built-in helper for a draft and it writes one for you, in your voice, ready to
edit. Wrote it for X but want to post it to LinkedIn too? One click reshapes it to fit
the longer format. The helper can also sort and search your contacts when you ask it in
plain words.

## Set it and let it run

OpenVolo can run small jobs for you on a schedule, like keeping contacts fresh or
finding new people to follow, so the busywork happens on its own. Everything sits in a
small database on your machine, and your logins are kept locked away.
