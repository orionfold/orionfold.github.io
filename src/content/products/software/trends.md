---
# P6 software rollout #1 (spec §5.5, "Software -> SPONSOR"). Authored from the
# repo README (navam-io/trends) + two real screenshots from blog/images/. Trends
# has a public live demo, so outbound carries BOTH the demo (site) and the repo
# (github), and the hero CTA points at the demo. Sections are data-gated: hero,
# chips, install, specs, gallery, sponsor, related rail. No usage tab (the flow is
# a web wizard) and no benchmark table. Copy is grade 3-5, no em-dashes.
type: software
slug: trends
valueProp: "Point a team of AI agents at the fast-moving market, and get back a clear plan: what is coming, what your business needs, and whether to build it or buy it."

chips:
  - label: For
    value: Business teams
  - label: Runs
    value: A team of AI agents
  - label: Answers
    value: Build, buy, or partner
  - label: Try it
    value: Live demo

install:
  - label: Run it yourself
    lang: bash
    code: |
      git clone https://github.com/navam-io/trends.git
      cd trends
      npm install
      cp .env.local.example .env.local   # add your ANTHROPIC_API_KEY
      npm run dev                        # open http://localhost:3000

specs:
  - label: Built with
    value: Next.js 15, tRPC, TypeScript
  - label: Thinks with
    value: Claude (Anthropic)
  - label: Works in
    value: Three steps, trends to needs to solutions
  - label: License
    value: MIT (free to use)

gallery:
  - src: ../../../assets/projects/trends/intelligence.png
    alt: The Trends dashboard showing market trend cards with confidence scores.
    caption: Start with trends shaped for your industry, each with a confidence score.
  - src: ../../../assets/projects/trends/solutions.png
    alt: A solutions view comparing build, buy, and partner options for a business need.
    caption: For each need, weigh build against buy against partner, with cost and risk.

relatedBook: ai-native-business

outbound:
  - label: Try the live demo
    href: https://trends.vercel.app
    kind: site
  - label: trends on GitHub
    href: https://github.com/navam-io/trends
    kind: github

sources:
  - section: overview
    type: github-readme
    ref: navam-io/trends
    lastSynced: '2026-05-27'
  - section: gallery
    type: docs-screenshots
    ref: /Users/manavsehgal/Developer/trends/blog/images
    lastSynced: '2026-05-27'
---

Trends turns the noisy market into a clear technology plan. Instead of one AI answering
one question, it runs a team of AI agents that each look at a different angle, then show
their thinking step by step so you can trust the result.

## What you can do

Work through three steps. First, see the trends that matter for your industry, each with
a score for how sure the AI is and where the claim came from. Next, a short guided chat
helps you turn a trend into the real needs of your business. Last, you compare your
options for each need: build it yourself, buy a tool, or partner, with rough cost and risk
laid out side by side.

## How it thinks

Every agent shows its reasoning and how confident it is, and it points to its sources. If
it does not know something, it says so rather than making up an answer.

## Who it is for

Technology and business leaders who have to decide what to adopt next and want more than a
generic recommendation. You can try the live demo in your browser, or run the whole thing
yourself with your own AI key.
