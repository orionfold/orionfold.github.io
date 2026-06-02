---
# Third book page (publish-book-to-store, 2026-06-01). The AI Native Platform
# walkthrough: the operator's manual for the open-source ainative platform. Same
# shape as the ai-native-business and dgx-spark book pages. The 21-chapter /
# 5-part table of contents is the real one, pulled from
# books/field-manual/_build/manifest.json with part names from _quarto.yml; the
# stylized "Where the X Becomes Y" subtitles are rewritten to grade 3-5 plain
# sentences with no em-dashes and jargon glossed on first use (website-copy-
# style). Word count (~115k) from `wc -w` on the rendered chapters. Hero is the
# real book cover; books resolve the hero from this frontmatter.
type: book
slug: ai-native-platform
valueProp: An operator's walkthrough of the open platform that runs AI agents, the software helpers that do the work for you, on your own computer. Twenty one chapters in five parts, from the shop floor to every API call. Free to read online.

# Books resolve the hero from frontmatter (the route does not glob a poster).
hero: ../../../assets/book/ai-native-platform-book.jpg
heroAlt: The AI Native Platform book cover, a dark blue cover with a glowing stack of layered cubes made of network nodes and circuit lines, the title in bright cyan and white.

chips:
  - label: Length
    value: 21 chapters
  - label: Parts
    value: 5 parts
  - label: Size
    value: About 115,000 words
  - label: Price
    value: Free to read

# Real table of contents (books/field-manual/_build/manifest.json; part names
# from _quarto.yml). The original subtitles are stylized "Where the X Becomes Y"
# lines; each is rewritten to one plain sentence, with jargon glossed on first use.
chapters:
  - number: 1
    part: 'Part 1 · Orientation'
    title: The Shop Floor
    subtitle: A first look at the whole platform, and how a plan turns into the real work the agents do.
  - number: 2
    part: 'Part 1 · Orientation'
    title: The Five Station Tour
    subtitle: A quick tour of the five main parts, so the words in the rest of the book make sense.
  - number: 3
    part: 'Part 2 · Running the Factory'
    title: Task Execution
    subtitle: How a single job, written on a card, gets picked up and run by an agent.
  - number: 4
    part: 'Part 2 · Running the Factory'
    title: Workflows and Blueprints
    subtitle: How to chain many jobs into one flow that runs step by step.
  - number: 5
    part: 'Part 2 · Running the Factory'
    title: The World Model
    subtitle: The shared memory of files and tables that every agent can read and write.
  - number: 6
    part: 'Part 2 · Running the Factory'
    title: Schedules and the Heartbeat
    subtitle: How to set work to start on a clock, so the platform keeps running on its own.
  - number: 7
    part: 'Part 2 · Running the Factory'
    title: Chat as a Posture
    subtitle: How a plain chat with you can hand the agents new work at any time.
  - number: 8
    part: 'Part 3 · The Intelligence Layer'
    title: Profiles
    subtitle: How each agent gets its own role, voice, and rules to follow.
  - number: 9
    part: 'Part 3 · The Intelligence Layer'
    title: Memory and Handoffs
    subtitle: How an agent keeps what it learned, and passes a job cleanly to the next one.
  - number: 10
    part: 'Part 3 · The Intelligence Layer'
    title: Monitoring and Cost
    subtitle: How to watch every run and see what it costs before you scale up.
  - number: 11
    part: 'Part 4 · The API in Depth'
    title: The Task API
    subtitle: The web calls (an API, the way one program asks another to do something) that create and run one task from your own code.
  - number: 12
    part: 'Part 4 · The API in Depth'
    title: The Workflow API
    subtitle: The calls that build and start a flow of many steps.
  - number: 13
    part: 'Part 4 · The API in Depth'
    title: The Schedule API
    subtitle: The calls that set work to run on a timer.
  - number: 14
    part: 'Part 4 · The API in Depth'
    title: The Trigger API
    subtitle: The calls that start work when something changes, like a new file or message.
  - number: 15
    part: 'Part 4 · The API in Depth'
    title: The Tables API
    subtitle: The calls that read and write the shared tables of data.
  - number: 16
    part: 'Part 4 · The API in Depth'
    title: The Document API
    subtitle: The calls that hand files to an agent so it can use them in its work.
  - number: 17
    part: 'Part 4 · The API in Depth'
    title: The Conversation API
    subtitle: The calls that send and stream a back and forth chat with an agent.
  - number: 18
    part: 'Part 4 · The API in Depth'
    title: The Profile API
    subtitle: The calls that set up and change an agent's role and rules.
  - number: 19
    part: 'Part 4 · The API in Depth'
    title: The Memory, Handoff, and Notification APIs
    subtitle: The calls that save memory, pass work along, and send an alert when something needs you.
  - number: 20
    part: 'Part 5 · The Factory as a Whole'
    title: The Factory, Put Back Together
    subtitle: All the pieces working as one, shown as a small business that runs itself.
  - number: 21
    part: 'Part 5 · The Factory as a Whole'
    title: The Endpoint Reference
    subtitle: A full list of every API call across the nine parts of the platform, for quick lookup.

# Inward cross-sell. The platform is the floor this whole site is built on, so the
# business book (the why) and a couple of build-log stories are the honest links.
relatedBook: ai-native-business
relatedReading:
  - title: One agent, three faces
    href: /story/one-agent-three-faces/
  - title: A spec at breakfast, an app by lunch
    href: /story/a-spec-at-breakfast-an-app-by-lunch/

outbound:
  - label: Read online
    href: https://ainative.business/platform
    kind: site

sources:
  - section: chapters
    type: book-manifest
    ref: books/field-manual/_build/manifest.json
    lastSynced: '2026-06-01'
  - section: overview
    type: url
    ref: https://ainative.business/platform
    lastSynced: '2026-06-01'
---

AI Native Platform is the operator's manual for the open platform that runs AI
agents on your own computer. Agents are software helpers you hand a job to, and
they carry it out for you. This book walks you across the whole platform, one
piece at a time, with real code behind every step. The platform is free to
install, free to use, and free to fork.

## What you will learn

You start on the shop floor, where a plan turns into a day's work, then learn how
a single task runs, how to chain tasks into a flow, and how to set that flow on a
schedule so it runs on its own. From there you give each agent its own role and
memory, watch every run and its cost, and finally call every part of the platform
from your own code through its full API (the set of web calls one program uses to
ask another to do something). The last part puts the whole factory back together
as a small business that runs itself.

## Who it is for

Builders who want to run AI agents on hardware they own, not rent, and wire them
into their own tools. You do not need a cluster or a big budget. You can read the
whole thing free online. If you want a copy to keep and read offline, the PDF and
EPUB bundle is yours for a one time price.
