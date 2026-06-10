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
# 2026-06-07: operator folded the upstream arena-control-plane article (jobs
# board / dispatcher, same product per operator) into this page; gallery now 13
# shots (11 light-theme re-captures + 2 curated control-plane shots).
# 2026-06-10 re-sync: upstream article grew three features (guarded lane
# lifecycle / LaneTruth, measured benches in the eval drawer, Advisor
# proof cards on Cortex) tied to the Orionfold Advisor launch; body + 3 new
# shots added (gallery now 16). Control-plane screenshots 08-11 upstream are
# NOT backed by any article feature yet, so they were skipped (curate, don't
# dump).
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
    value: A quality-versus-speed chart that marks the best trade-offs in orange
  - label: Browse the shelf
    value: Every model in one grid, each with a full card before you spend GPU time
  - label: Try and test
    value: Chat with any model, score an answer against a gold answer, or duel two side by side
  - label: Jobs board
    value: Queue a re-test of any model, or let the board catch a leaderboard drop and queue a confirming re-test by itself
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
    detail: >-
      The cockpit is the screen you keep open. The live instrument rail reads the machine's
      state, a strip counts what you have built, your best scored runs sit in a ticker, and
      a feed shows what happened recently. None of it ever shows a private prompt, because
      the feed reads only safe metadata.
  - src: ../../../assets/projects/arena/telemetry-rail.png
    alt: The live readout rail showing GPU use, heat, shared memory, speed, wait time, the active model, and hosted spend, each over a small bar chart of recent peaks.
    caption: The instrument strip on every page. Each readout keeps a small chart of its recent peaks.
    detail: >-
      On a Spark the chip and the system share one 128 GB pool of memory, so watching that
      number is how you avoid running out before it happens. Each readout keeps a small bar
      chart of its recent peaks, so you see the trend and not just the moment. The speed
      readouts light up the second a model starts answering.
  - src: ../../../assets/projects/arena/leaderboard.png
    alt: The Arena leaderboard, with models ranked into groups, medals on the top three, and colored score bars showing how good each number is.
    caption: Your models ranked from real results, built from a safe slice that never shares your prompts.
    detail: >-
      The leaderboard is the Arena's memory. Models rank in groups per test, medals on the
      top three, and every new chat or compare folds into a live section as you work. It is
      built from a safe slice that exports only scores, never a prompt or an answer, so you
      can publish the board and keep your data.
  - src: ../../../assets/projects/arena/efficiency-frontier.png
    alt: A chart of answer quality against speed for every model build, with the best trade-off line drawn in orange.
    caption: Quality against speed on one chart. The orange line is the set worth shipping.
    detail: >-
      Each model build is one dot on a chart of quality against speed. The orange line marks
      the builds where you cannot gain more quality without giving up speed. Choosing what
      to ship stops being an argument and becomes a point you can put a finger on.
  - src: ../../../assets/projects/arena/models.png
    alt: The models browser, a grid of every model you can run, with filters for kind and license on each card.
    caption: Your whole shelf in one grid. Filter it, then chat or compare with one click.
    detail: >-
      Every model you can run sits in one grid, filterable by kind and license. Each card is
      a launch point: one click to chat with the model, one more to send it into a duel.
  - src: ../../../assets/projects/arena/model-detail.png
    alt: A model detail page with what the model is for, a table of its shrunk builds with the best one marked, its known weak spots, and its own quality-versus-speed curve.
    caption: The full card on any model, including which build is the sweet spot, before you spend GPU time.
    detail: >-
      The full story on one model before you spend any GPU time: what it is for, the table
      of its shrunk builds with the sweet spot marked, where it is known to slip, and its
      own quality-versus-speed curve.
  - src: ../../../assets/projects/arena/chat.png
    alt: The chat screen with a streamed answer from the loaded model, a fold-away reasoning trace, and a live words-per-second readout.
    caption: Talk to the warm model, a local file, or a hosted one, and watch the speed as it answers.
    detail: >-
      Talk to the model that is already warm and loaded, a local file booted on demand, or a
      hosted one. Answers stream with full formatting, reasoning folds out of the way, and
      the words-per-second readout runs live while it types.
  - src: ../../../assets/projects/arena/eval-drawer.png
    alt: The eval drawer listing the real test sets a model was measured on, ready to send a real test question straight into the chat.
    caption: Pull a real test, send it from the chat, and score the answer against a gold answer.
    detail: >-
      The gap between chatting with a model and testing it closes here. Open the drawer,
      pull the exact test the model was measured on, and send a real question straight into
      the conversation. The known-good answer sits beside the live one, and a scorer grades
      it on the spot.
  - src: ../../../assets/projects/arena/eval-bench-drawer.png
    alt: The eval drawer with a saved test set picked, showing 89 measured questions with filters by family, ready to replay in the chat.
    caption: Saved test sets keep their exact questions and settings. Pick a row and the chat replays the very thing the scores measured.
    detail: >-
      A saved test set keeps everything it was measured with: the questions, the system
      rules, even whether the model was allowed to think out loud first. Pick one of the
      measured rows and the chat replays that exact setup, scored the moment the answer
      lands.
  - src: ../../../assets/projects/arena/compare.png
    alt: The compare screen showing two models answering the same question side by side, with cards for quality, speed, wait time, length, and cost.
    caption: Put any two models head to head and read the trade in plain numbers.
    detail: >-
      Pick any two models and watch them answer the same question side by side. Plain cards
      call the winner on quality, speed, wait time, length, and cost, each over a small
      chart of the session. A local model against a hosted one is a fair fight here, and the
      cost card shows the local answer cost zero.
  - src: ../../../assets/projects/arena/command-palette.png
    alt: The command palette open over the cockpit, a search box that finds any model, article, or action from a few typed letters.
    caption: One keystroke opens a search over everything. Jump to a model or fire a test without the mouse.
    detail: >-
      One keystroke opens a search box over the whole cockpit. Type a few letters to jump to
      any model, fire a chat, or set up a duel, all without touching the mouse.
  - src: ../../../assets/projects/arena/jobs-board.png
    alt: The jobs board, with the live readout rail on top, a banner calling out a leaderboard drop, a form to queue a re-test, and four columns of jobs marked queued, running, done, and failed.
    caption: The control plane. Queue a re-test of any model, or let the board catch a score drop and confirm it by itself.
    detail: >-
      This is where the cockpit starts work instead of just recording it. Type a model and a
      test set to queue a re-test by hand, or press scan and the board diffs the leaderboard
      against its last baseline and queues a confirming re-test for any score that slipped.
      One job runs at a time, so the queue can never blow past the shared memory.
  - src: ../../../assets/projects/arena/board-columns.png
    alt: A close-up of the four job columns, with done cards showing the measured score and the number of questions, and a failed card explaining why it failed.
    caption: Every job tells its own story. Done cards carry the score; failed cards say why.
    detail: >-
      Every job card tells its own story. It names what kind of work it is and what
      triggered it, you or the board itself. Done cards carry the measured score and how
      many questions were graded; a failed card says exactly why, so you never have to open
      a log.
  - src: ../../../assets/projects/arena/lanetruth-guarded.png
    alt: The serving screen showing the one running model marked active, above a guarded launch form that checks memory first and asks before stopping the old model.
    caption: One model runs at a time. Starting a new one checks memory first and asks before it stops the old one.
    detail: >-
      Only one model fits in the shared memory at a time, and this screen enforces that
      visibly. Starting a model runs every safe check first: the recipe, the file, the
      memory math. A doomed launch never tears a working model down, and a stop is verified,
      not assumed.
  - src: ../../../assets/projects/arena/advisor-proof-cards.png
    alt: Four proof cards for the Orionfold Advisor on the memory pane, showing a pre-flight check passing 8 of 8, the knowledge pack and its checks, routing costs, and a publish verdict marked promoted.
    caption: A model's whole promotion case on one screen, each card read straight from saved proof files.
    detail: >-
      The memory pane renders a model's whole promotion case as read-only cards: the pre-
      flight gate, the knowledge pack with its checks, what each routing setup costs, and
      the publish verdict with its nine gates. The cards only read saved proof files, so the
      cockpit shows the evidence instead of restating it.
  - src: ../../../assets/projects/arena/lab.png
    alt: The Lab screen, a board of what has shipped, what is next, and what is being explored, with a timeline drawn from the build history.
    caption: The tool talks about itself. A living board of shipped, next, and exploring.
    detail: >-
      The tool talks about itself. A living board tracks what has shipped, what is queued
      next, and what is being explored, beside a timeline mined from the real commit
      history.

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
    lastSynced: '2026-06-10'
  - section: gallery
    type: docs-screenshots
    ref: manavsehgal/ainative-business.github.io:products/orionfold-arena/screenshots/
    lastSynced: '2026-06-10'
  - section: overview
    type: url
    ref: https://raw.githubusercontent.com/manavsehgal/ainative-business.github.io/main/products/arena-control-plane/product.md
    lastSynced: '2026-06-10'
  - section: gallery
    type: docs-screenshots
    ref: manavsehgal/ainative-business.github.io:products/arena-control-plane/screenshots/
    lastSynced: '2026-06-10'
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
  best trade-offs in orange. Quality here means how well the model answers; the orange line
  is the set where you cannot get more quality without giving up speed.
- **Try and test in one place.** Chat with any model, pull the exact test it was measured on,
  and score its answer against a gold answer without leaving the chat. Or put two models head
  to head and read the trade in plain cards: quality, speed, wait time, length, and cost,
  each with a small chart of how it moved across the session.
- **Replay the real test.** A saved test set keeps everything it was measured with: the
  questions, the system rules, even whether the model was allowed to think out loud first.
  Pick a row and the chat replays that exact setup, and a scorer grades the answer the
  moment it lands. No judge model is needed.
- **Swap models safely.** Only one model fits in the shared memory at a time, so the cockpit
  now starts and stops the serving model itself, with guard rails. It checks memory first,
  asks before it stops the old model, and waits until the new one is warm and answering.
- **Read a model's whole case.** The memory pane shows proof cards for a model on its way to
  being published: the pre-flight check, the knowledge pack it answers from, what each
  routing setup costs, and the final verdict. Each card reads from saved proof files, so the
  cockpit shows the evidence instead of restating it.
- **Put the cockpit to work.** A jobs board lets the Arena start work, not just record it.
  Type a model and a test set, press queue, and a re-test runs on your Spark. The job's card
  moves from queued to running to done, with the measured score on it. Press scan and the
  board compares your leaderboard to its last saved state; if a score slipped, it queues a
  confirming re-test by itself. A failed job says why, right on the card. One job runs at a
  time, so the board never blows past the Spark's shared memory.
- **Move without the mouse.** One keystroke opens a search box over the whole cockpit. Type a
  few letters to jump to any model, fire a chat, or set up a duel.

Jargon, in plain words: a *GGUF* is just a packaged model file you can run on your own
machine. To *quantize* a model is to shrink it so it runs faster, and the chart shows what
you trade away when you do. *Throughput* is how many words a second the model can produce.

## It keeps growing

Arena shipped as fourteen screens and 125 tests in about fifteen hours of work, with the AI
agent doing the typing. It did not stop there. In the days after launch six more screens
landed, and the tool now measures 17,515 lines of code and 135 tests. One part, a memory
pane that indexes your own notes and checks how well it can find them again, grew into its
own product, [Orionfold Cortex](/software/cortex/), with its own page. The jobs board, the
control plane, came together in one afternoon of about two and a half hours, adding
1,762 lines and 35 tests of its own, and shipped inside fieldkit v0.16.0, the first
packaged Arena release.

The newest proof of the cockpit is [Orionfold Advisor](/advisor/), a governed local AI
advisor that launched in June 2026. Its whole promotion case ran through these screens:
every model swap went through the guarded serving screen, all 89 of its measured test
questions are replayable from the eval drawer, and its proof cards sit on the memory pane.
The cockpit did not just record that launch. It was the instrument it happened on.

## Private by design

Nothing you type is uploaded, and nothing you compare phones home, unless you deliberately
pick a hosted model. The whole thing is a tool you could run on a plane.

## Built on fieldkit

Arena is a thin cockpit over the [fieldkit](/software/fieldkit/) toolbox and a year of real
research. fieldkit serves the models, runs the tests, and scores the answers; Arena gives
that work a screen. Because the parts already existed, the whole cockpit came together in a
day. The honest version of that story is the better one: the cockpit is the sum of a lot of
compounding work, not a fresh start.
