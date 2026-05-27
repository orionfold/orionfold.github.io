---
# P7 software rollout #2 (spec §5.5, "Software -> SPONSOR"). Authored from the
# repo README + WORKFLOW.md (Developer/neocash) and three real screenshots from
# docs/screenshots/. Honesty note: NeoCash keeps your DATA local (in the browser),
# but the thinking is done by Claude, so the page says so plainly and does not
# claim a local AI model. Copy is grade 3-5, no em-dashes, jargon glossed inline.
type: software
slug: neocash
valueProp: A money helper that runs in your browser and walks you through taxes, saving, and investing. Your financial details never leave your machine.

chips:
  - label: Runs in
    value: Your browser
  - label: Helpers
    value: 5 money experts
  - label: Your data
    value: Stays on your machine
  - label: Cost
    value: Free and open

install:
  - label: Clone and run
    lang: bash
    code: |
      git clone https://github.com/manavsehgal/neocash.git
      cd neocash
      cp .env.example .env.local   # add your Anthropic API key here
      npm install
      npm run dev

usage:
  - label: Start with sample data
    lang: bash
    code: |
      # Open http://localhost:3000
      # Click your profile (bottom left) and choose "Load Sample Data"
      # to explore with ready-made chats, goals, and insights.

specs:
  - label: Built with
    value: Next.js (a web app you run yourself)
  - label: Your data
    value: Stays in your browser, no account needed
  - label: The thinking
    value: Done by Claude (you add your own Anthropic key)
  - label: Helpers
    value: Tax, investing, budget, estate, and a general guide
  - label: License
    value: Apache 2.0 (free to use)

gallery:
  - src: ../../../assets/projects/neocash/chat.png
    alt: A NeoCash chat answering a budget question with a table and clear next steps.
    caption: Ask a money question in plain words and get an answer you can act on.
  - src: ../../../assets/projects/neocash/dashboard.png
    alt: A goal dashboard showing balance, progress to target, and a checklist.
    caption: Each goal fills in its own dashboard from your chats, with no forms to type.
  - src: ../../../assets/projects/neocash/signals.png
    alt: A list of signals that link insights from one chat to a goal in another.
    caption: NeoCash spots a win in one chat and points it at a goal somewhere else.

relatedModels: [finance-chat]
relatedBook: ai-native-business
relatedReading:
  - title: Picking open models over closed
    href: /story/picking-open-models-over-closed/

outbound:
  - label: Visit NeoCash
    href: https://neocash.io
    kind: site
  - label: NeoCash on GitHub
    href: https://github.com/manavsehgal/neocash
    kind: github

sources:
  - section: overview
    type: github-readme
    ref: manavsehgal/neocash
    lastSynced: '2026-05-27'
  - section: gallery
    type: docs-screenshots
    ref: /Users/manavsehgal/Developer/neocash/docs/screenshots
    lastSynced: '2026-05-27'
---

NeoCash is a money helper that lives in your web browser. You chat with it the way you
would text a friend who is good with money, and it walks you through taxes, saving,
investing, debt, insurance, and planning what you leave behind. Your numbers stay on
your own machine, so nothing private is sent away to a company.

## Five experts in one chat

Behind the chat are five helpers, each good at one thing: a tax advisor, an investing
analyst, a budget planner, an estate planner, and a general guide for everything else.
When your question matches one of them, that expert steps in and a small tag shows you
who is answering. You never have to pick the right one yourself.

## Goals that fill themselves in

Set a goal, like building an emergency fund, and NeoCash gives it a dashboard. As you
chat, the dashboard updates on its own with your balance, how close you are, and the
next steps to take. There are no forms to fill. It even links a win from one chat to a
goal in another, so a tax refund can quietly point itself at your savings target.

## Private by design

Your chats, your goals, and your uploaded files all stay in your browser. There are no
accounts and no one watching. The thinking is done by Claude, so you add your own key
once and you are set.
