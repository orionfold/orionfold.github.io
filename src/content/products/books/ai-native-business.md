---
# P2 pilot — the book shape (spec §3, "Book → BUY"). Exercises the book-only
# sections the software smoke entry can't: the BookContents table of contents
# and the BuyBox conversion point (price read from the CATALOG SSOT by lookup
# key, never hardcoded). The 14-chapter / 4-part list is the real one, pulled
# from books/ainative/_build/manifest.json; chapter subtitles are rewritten to
# grade 3-5 with no em-dashes (website-copy-style). Hero is the real book cover.
type: book
slug: ai-native-business
valueProp: A free book on running a business with AI agents, the software helpers that do the work for you. Fourteen short chapters take you from the first idea to a working system, in about a two hour read.

# Books resolve the hero from frontmatter (the route does not glob a poster).
hero: ../../../assets/book/ai-native-business-book.jpg
heroAlt: The AI Native Business book cover, a deep blue cover with a star map and the title in white.

chips:
  - label: Length
    value: 14 chapters
  - label: Parts
    value: 4 parts
  - label: Read time
    value: About 2 hours
  - label: Price
    value: Free to read

# Real table of contents (books/ainative/_build/manifest.json). Subtitles simplified.
chapters:
  - number: 1
    part: 'Part 1 · The Blueprint'
    title: From Hierarchy to Intelligence
    subtitle: Why the old way of running a company is about to break.
  - number: 2
    part: 'Part 1 · The Blueprint'
    title: The AI Native Blueprint
    subtitle: From a rough idea to a design you can build.
  - number: 3
    part: 'Part 2 · The Factory'
    title: The Refinery
    subtitle: Turn a goal into clear, ordered work.
  - number: 4
    part: 'Part 2 · The Factory'
    title: The Forge
    subtitle: Run many tasks at once without losing track.
  - number: 5
    part: 'Part 2 · The Factory'
    title: Blueprints
    subtitle: Build flows that run step by step.
  - number: 6
    part: 'Part 2 · The Factory'
    title: The Arena
    subtitle: Set the work to run on a schedule.
  - number: 7
    part: 'Part 3 · The Network'
    title: Institutional Memory
    subtitle: Give the whole team one shared memory.
  - number: 8
    part: 'Part 3 · The Network'
    title: The Swarm
    subtitle: Many AI helpers working together.
  - number: 9
    part: 'Part 3 · The Network'
    title: The Governance Layer
    subtitle: Keep it safe and honest as it grows.
  - number: 10
    part: 'Part 4 · The Vision'
    title: The World Model
    subtitle: See the whole business at a glance.
  - number: 11
    part: 'Part 4 · The Vision'
    title: The Machine That Builds Machines
    subtitle: A system that helps build itself.
  - number: 12
    part: 'Part 4 · The Vision'
    title: The Road Ahead
    subtitle: What the real examples tell us about what is next.
  - number: 13
    part: 'Part 4 · The Vision'
    title: The Wealth Manager
    subtitle: One founder builds a real app in a single day.
  - number: 14
    part: 'Part 4 · The Vision'
    title: The Meta Program
    subtitle: Using the system to build the system.

relatedModels: [patent-strategist]
relatedBook: ai-research-on-nvidia-dgx-spark
relatedReading:
  - title: Why I folded Orionfold
    href: /story/why-i-folded-orionfold/

outbound:
  - label: Read online
    href: https://ainative.business/book
    kind: site

sources:
  - section: chapters
    type: book-manifest
    ref: books/ainative/_build/manifest.json
    lastSynced: '2026-05-26'
  - section: overview
    type: url
    ref: https://ainative.business/book
    lastSynced: '2026-05-26'
---

AI Native Business is a short, practical book about running a company where AI
agents do the heavy lifting. Agents are software helpers you can hand a job to,
and they carry it out for you. The book shows how to put them to work, step by
step, with real code behind every idea.

## What you will learn

It starts with why the old way of organizing a company is breaking, then walks
you through a working design: how to turn a goal into clear tasks, run many of
them at once, build flows that run on their own, and give the whole team one
shared memory. By the end you have seen a real business that helps build itself.

## Who it is for

Founders, builders, and small teams who want to use AI as more than a chat box.
You can read the whole thing free online. If you want a copy to keep and read
offline, the PDF and EPUB bundle is yours for a one time price.
