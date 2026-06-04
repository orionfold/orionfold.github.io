---
# New software rollout: Orionfold Arena (spec §5.5, "Software -> SPONSOR").
# Authored from the canonical product article in the ainative.business GitHub repo
# (manavsehgal/ainative-business.github.io, products/orionfold-arena/product.md)
# and its 11 real cockpit screenshots. The mac checkout is stale (work moved to
# the Spark), so the sources map points at the GitHub repo. Arena is the cockpit
# over the fieldkit toolbox and the five published models, so the RelatedRail is a
# strong inward funnel: the five models it scores + the DGX Spark book (Buy). The
# live demo gets a prominent hero/sticky button (demoHref on the SSOT entry), so it
# is NOT buried in the outbound rail. Copy is grade 3-5, no em-dashes, jargon
# (GGUF, quantize, throughput) glossed in plain words.
type: software
slug: arena
valueProp: Run, compare, and score AI models on your own desktop. Live speed and memory, a private board, two side by side. Free, and nothing leaves your machine.

chips:
  - label: Language
    value: Python
  - label: Run it
    value: fieldkit arena up
  - label: Proven on
    value: DGX Spark
  - label: License
    value: Free and local

install:
  - label: Install from pip
    lang: bash
    code: |
      pip install "fieldkit[arena]"

usage:
  - label: Open the cockpit
    lang: bash
    code: |
      # Start the Arena on your Spark and open it in a browser.
      # It reads your own models, your benches, and your past results.
      fieldkit arena up

specs:
  - label: What it is
    value: A single-screen cockpit to run, compare, and score local AI models
  - label: Live readouts
    value: GPU use, heat, memory, and speed, each with a small chart of its recent peaks
  - label: Leaderboard
    value: Your models ranked from real results, folding in every new chat and test, with no private text shared
  - label: Pick what to ship
    value: A quality-versus-speed chart that marks the best trade-offs in gold
  - label: Browse the shelf
    value: Every model in one grid, each with a full card before you spend GPU time
  - label: Try and test
    value: Chat with any model, score an answer against a gold answer, or duel two side by side
  - label: Move fast
    value: A command palette opens with one keystroke and jumps anywhere
  - label: Private
    value: Runs on your own machine; nothing is uploaded unless you choose a hosted model
  - label: Built on
    value: The fieldkit toolbox (arena, eval, harness, memory, nim, notebook)

gallery:
  - src: ../../../assets/projects/arena/cockpit.png
    alt: The Orionfold Arena cockpit on one screen, with a live readout strip across the top, a count of what you have built, your top scored runs, and a recent activity feed.
    caption: One home screen. Live machine readouts up top, your best runs, and what happened recently.
  - src: ../../../assets/projects/arena/telemetry-rail.png
    alt: The live readout rail showing GPU use, heat, shared memory, speed, wait time, the active model, and hosted spend, each over a small bar chart of recent peaks.
    caption: The instrument strip on every page. Each readout keeps a small chart of its recent peaks.
  - src: ../../../assets/projects/arena/leaderboard.png
    alt: The Arena leaderboard, with models ranked into groups, medals on the top three, and colored score bars showing how good each number is.
    caption: Your models ranked from real results, built from a safe slice that never shares your prompts.
  - src: ../../../assets/projects/arena/efficiency-frontier.png
    alt: A chart of answer quality against speed for every model build, with the best trade-off line drawn in gold.
    caption: Quality against speed on one chart. The gold line is the set worth shipping.
  - src: ../../../assets/projects/arena/models.png
    alt: The models browser, a grid of every model you can run, with filters for kind and license on each card.
    caption: Your whole shelf in one grid. Filter it, then chat or compare with one click.
  - src: ../../../assets/projects/arena/model-detail.png
    alt: A model detail page with what the model is for, a table of its shrunk builds with the best one marked, its known weak spots, and its own quality-versus-speed curve.
    caption: The full card on any model, including which build is the sweet spot, before you spend GPU time.
  - src: ../../../assets/projects/arena/chat.png
    alt: The chat screen with a streamed answer from the loaded model, a fold-away reasoning trace, and a live words-per-second readout.
    caption: Talk to the warm model, a local file, or a hosted one, and watch the speed as it answers.
  - src: ../../../assets/projects/arena/eval-drawer.png
    alt: The eval drawer listing the real test sets a model was measured on, ready to send a real test question straight into the chat.
    caption: Pull a real test, send it from the chat, and score the answer against a gold answer.
  - src: ../../../assets/projects/arena/compare.png
    alt: The compare screen showing two models answering the same question side by side, with cards for quality, speed, wait time, length, and cost.
    caption: Put any two models head to head and read the trade in plain numbers.
  - src: ../../../assets/projects/arena/command-palette.png
    alt: The command palette open over the cockpit, a search box that finds any model, article, or action from a few typed letters.
    caption: One keystroke opens a search over everything. Jump to a model or fire a test without the mouse.
  - src: ../../../assets/projects/arena/lab.png
    alt: The Lab screen, a board of what has shipped, what is next, and what is being explored, with a timeline drawn from the build history.
    caption: The tool talks about itself. A living board of shipped, next, and exploring.

# Inward cross-sell. Arena is the cockpit over the five published models and the
# DGX Spark book it grew from, so every related link is honest.
relatedModels: [patent-strategist, securityllm, saul-7b-instruct, finance-chat, ii-medical-8b]
relatedBook: ai-research-on-nvidia-dgx-spark
relatedReading:
  - title: "Orionfold Cortex: the Arena memory layer"
    href: /software/cortex/
  - title: The cockpit for my models
    href: /story/the-cockpit-for-my-models/
  - title: My first model on a desktop
    href: /story/my-first-model-on-a-desktop/

outbound:
  - label: Read the Arena story
    href: https://ainative.business/products/orionfold-arena/
    kind: site
  - label: fieldkit on GitHub
    href: https://github.com/manavsehgal/ai-field-notes
    kind: github

sources:
  - section: overview
    type: url
    ref: https://raw.githubusercontent.com/manavsehgal/ainative-business.github.io/main/products/orionfold-arena/product.md
    lastSynced: '2026-06-03'
  - section: gallery
    type: docs-screenshots
    ref: manavsehgal/ainative-business.github.io:products/orionfold-arena/screenshots/
    lastSynced: '2026-06-03'
---

Orionfold Arena is a single screen for running, comparing, and scoring the AI models on
your own desktop. Open it on an NVIDIA DGX Spark and you see the machine's live readouts,
every model you have built, the tests those models were measured on, and a private board
that ranks them from your own results. All of it runs on the machine under your desk, and
none of it leaves.

## Why it exists

If you build models on a Spark, you end up with a shelf of them and nowhere to drive them
from. Picking one meant remembering a long command. Comparing two meant a terminal and a
notebook. Knowing which small build was the good one meant digging up notes you wrote weeks
ago. Arena turns that shelf into a control room. Chat with the model that is already warm
and loaded, set two of them against each other, score an answer against a known-good answer,
and read one chart to decide which build is worth shipping.

## What you can do

- **Watch the machine.** A live strip across the top shows how hard the chip is working, how
  hot it is, how much of the shared 128 GB of memory is in use, and how fast answers come
  back. Each readout keeps a small bar chart of its recent peaks, so you see the trend and
  not just the moment. On a Spark the chip and the system share one pool of memory, so
  watching that number is how you avoid running out before it happens.
- **Browse your shelf.** Every model you can run sits in one grid, filterable by kind and
  license. Each model has a full card: what it is for, which shrunk build is the sweet spot,
  where it is known to slip, and its own quality-versus-speed curve. You read the whole
  story before you spend a second of GPU time.
- **Rank your models.** The board ranks your models from real results and folds in every new
  chat and test as you go. Each row carries a badge that says whether the number came from
  your Spark or a hosted model. It is built from a safe slice that shares only scores, never
  your prompts or the model's replies, so you can publish the board and keep your data.
- **Pick what to ship.** One chart plots quality against speed for every build and draws the
  best trade-offs in gold. Quality here means how well the model answers; the gold line is
  the set where you cannot get more quality without giving up speed.
- **Try and test in one place.** Chat with any model, pull the exact test it was measured on,
  and score its answer against a gold answer without leaving the chat. Or put two models head
  to head and read the trade in plain cards: quality, speed, wait time, length, and cost,
  each with a small chart of how it moved across the session.
- **Move without the mouse.** One keystroke opens a search box over the whole cockpit. Type a
  few letters to jump to any model, fire a chat, or set up a duel.

Jargon, in plain words: a *GGUF* is just a packaged model file you can run on your own
machine. To *quantize* a model is to shrink it so it runs faster, and the chart shows what
you trade away when you do. *Throughput* is how many words a second the model can produce.

## It keeps growing

Arena shipped as fourteen screens and 125 tests in about fifteen hours of work, with the AI
agent doing the typing. It did not stop there. In the days after launch six more screens
landed, and the tool now measures 17,515 lines of code and 135 tests. The newest part is a
memory pane that indexes your own notes and checks how well it can find them again. That
pane grew into its own product, [Orionfold Cortex](/software/cortex/), with its own page.

## Private by design

Nothing you type is uploaded, and nothing you compare phones home, unless you deliberately
pick a hosted model. The whole thing is a tool you could run on a plane.

## Built on fieldkit

Arena is a thin cockpit over the [fieldkit](/software/fieldkit/) toolbox and a year of real
research. fieldkit serves the models, runs the tests, and scores the answers; Arena gives
that work a screen. Because the parts already existed, the whole cockpit came together in a
day. The honest version of that story is the better one: the cockpit is the sum of a lot of
compounding work, not a fresh start.
