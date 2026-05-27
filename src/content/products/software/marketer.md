---
# P6 software rollout #1 (spec §5.5, "Software -> SPONSOR"). Authored from the
# repo README (navam-io/marketer). No gallery: the repo no longer ships product
# screenshots (only test/coverage artifacts), and the spec locks "no net-new asset
# generation in v1" -- so the adaptive template omits the gallery rather than
# fake one. The page is still full: hero, chips, install, specs, body, sponsor,
# related rail. No usage tab (the daily flow is point-and-click, not a command);
# no benchmark table. Copy is grade 3-5, no em-dashes (website-copy-style).
type: software
slug: marketer
valueProp: Turn one article into ready-to-post updates for every social site. The AI writes the drafts, you copy, paste, and post. No logins to set up.

chips:
  - label: Makes
    value: Social posts
  - label: From
    value: Any article link
  - label: Workflow
    value: Copy and paste
  - label: Runs
    value: On your computer

install:
  - label: Set it up
    lang: bash
    code: |
      git clone https://github.com/navam-io/marketer.git
      cd marketer
      npm install --legacy-peer-deps
      cp .env.example .env   # add your ANTHROPIC_API_KEY
      npm run db:push
      npm run dev            # open http://localhost:3000

specs:
  - label: Built with
    value: Next.js 15, React, TypeScript
  - label: Writes with
    value: Claude (Anthropic)
  - label: Saves to
    value: A local database on your machine
  - label: Posts to
    value: Any social site, no logins needed

relatedBook: ai-native-business
relatedReading:
  - title: Building in public, week one
    href: /story/building-in-public-week-one/

outbound:
  - label: marketer on GitHub
    href: https://github.com/navam-io/marketer
    kind: github

sources:
  - section: overview
    type: github-readme
    ref: navam-io/marketer
    lastSynced: '2026-05-27'
---

Marketer helps a small team keep up a social media presence without a marketing
department. You give it the link to an article you wrote, and the AI turns it into
posts shaped for each site: a longer one for LinkedIn, a short one for X, a quick
intro for a blog. You pick the tone, then review every word.

## How it works

Paste a link and Marketer pulls out the clean text, with the ads and menus stripped
away. Claude then drafts posts for the sites you choose. Each draft lands on a simple
board with four columns, from "to do" to "posted," that you drag cards across. When a
post is ready, you click copy, paste it into the real site, and publish it yourself.

## Why copy and paste

There are no logins to wire up and no tokens to refresh. Because you post by hand, you
always see the final version before it goes live, it works with any site, and a change
on their end never breaks your flow. Everything you write stays in a database on your
own computer.

## Who it is for

Founders and small teams who want steady, on-brand posts without hiring help or handing
their accounts to a tool.
