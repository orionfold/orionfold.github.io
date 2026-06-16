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
# shots added (gallery now 16).
# 2026-06-11 re-sync: upstream retook 4 shots against the live cockpit
# (cockpit, leaderboard, frontier, models; the old ones showed scrollbars)
# and ran an orphan-screenshot audit. The control-plane article gained a
# "What the board grew into" section, so the 5 shots we skipped on 06-10
# are now article-backed and placed here (train-dispatch, build-spine,
# reward-gauge, guardrails, standup; gallery now 21). Skipped upstream
# 02-dispatch-and-regression (overlaps our jobs-board shot). Leaderboard +
# frontier copy updated for the advisor-first display layer and the violet
# flagship diamond.
# 2026-06-15 re-sync (upstream v0.34 premium/onboarding wave): refreshed body
# (welcome first-run + bring-your-own-cloud-key + Compare horizontal bars + the
# v0.34 third-arc build stats); 14 gallery shots recaptured in the new
# blue-indigo+gold palette + 2 new (welcome, settings-cloud-key; gallery now 23,
# welcome is the fixed-CTA snapshot); embedded the guided-onboarding TUI replay
# (asciinema cast) in the "It starts at the install" section.
type: software
slug: arena
valueProp: Run, compare, score, and train AI models on your own desktop. Live speed and memory, a private board, an overnight jobs loop. Free, and nothing leaves your machine.

# Edition split (Arena Field Edition launch, 2026-06): the free, open Arena above
# stays the page's spine; the paid Field Edition renders as an additive block
# (FieldEditionBox.astro), price + proof from the catalog SSOT, behind the
# ARENA_FIELD_EDITION_LIVE launch flag.
fieldEdition: true

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
    value: Queue a re-test, a pre-training smoke test, or a full training run; the board also catches a leaderboard drop and queues a confirming re-test by itself
  - label: Overnight loop
    value: A cron drains the queue while you sleep and a morning report shows what ran, what slipped, and what it spent; nothing publishes until you promote it
  - label: Move fast
    value: A command palette opens with one keystroke and jumps anywhere
  - label: Private
    value: Runs on your own machine; nothing is uploaded unless you choose a hosted model
  - label: Built on
    value: The fieldkit toolbox (arena, eval, harness, memory, nim, notebook)

gallery:
  - src: ../../../assets/projects/arena/welcome.png
    alt: The Arena welcome screen, a navy to gold hero that reads Welcome to your Arena and Meet your AI Researcher, with the real count of what is loaded and three questions to try.
    caption: The first screen on your first run. It greets your Researcher, says what is loaded, and offers three questions to try.
    detail: >-
      A first-run screen you see once. It greets you as your AI Researcher, states what is
      actually loaded, 182 sources broken into 647 searchable pieces, and offers three
      questions to try. The third asks what is not in your notes, so in one turn you watch the
      model say plainly when it does not know. A small link in the top bar brings the screen
      back any time.
  - src: ../../../assets/projects/arena/cockpit.png
    alt: The Orionfold Arena cockpit on one screen, with a live readout strip across the top, a count of what you have built, your top scored runs, the model now serving, and a recent activity feed.
    caption: One home screen. Live machine readouts up top, your best runs, the model now serving, and what happened recently.
    detail: >-
      The cockpit is the screen you keep open. The live instrument rail reads the machine's
      state, a strip counts what you have built, your best scored runs sit in a ticker, the
      model now serving is named, and a feed shows what happened recently. None of it ever
      shows a private prompt, because the feed reads only safe metadata.
  - src: ../../../assets/projects/arena/telemetry-rail.png
    alt: The live readout rail showing GPU use, heat, shared memory, speed, wait time, the active model, and hosted spend, each over a small bar chart of recent peaks.
    caption: The instrument strip on every page. Each readout keeps a small chart of its recent peaks.
    detail: >-
      On a Spark the chip and the system share one 128 GB pool of memory, so watching that
      number is how you avoid running out before it happens. Each readout keeps a small bar
      chart of its recent peaks, so you see the trend and not just the moment. The speed
      readouts light up the second a model starts answering.
  - src: ../../../assets/projects/arena/leaderboard.png
    alt: The Arena leaderboard with the flagship Advisor group at the top, each row carrying a plain-language name, small pills for its role and the frozen test it passed, and the raw run id printed under the name.
    caption: The flagship Advisor group leads the board. Plain names and small pills up top, the raw run id kept under every name.
    detail: >-
      The leaderboard is the Arena's memory. Models rank in groups per test, medals on the
      top three, and every new chat or compare folds into a live section as you work. The
      house model gets a friendly display, not a thumb on the scale: the Advisor group
      renders first with plain-language names and small pills for each row's role and the
      frozen test its score came from, while the raw run id stays printed under the name.
      Easy to read, impossible to mistake for different data. The board is built from a
      safe slice that exports only scores, never a prompt or an answer, so you can publish
      it and keep your data.
  - src: ../../../assets/projects/arena/efficiency-frontier.png
    alt: A chart of answer quality against speed for every model build, with the best trade-off line drawn in orange and the flagship Advisor build marked as a violet diamond sitting on that line.
    caption: Quality against speed on one chart. The orange line is the set worth shipping; the violet diamond is the flagship, sitting right on it.
    detail: >-
      Each model build is one dot on a chart of quality against speed. The orange line marks
      the builds where you cannot gain more quality without giving up speed. The flagship
      Advisor build gets its own mark, a violet diamond drawn above the line so it never
      hides among the dots, and here it sits on the frontier itself. Choosing what to ship
      stops being an argument and becomes a point you can put a finger on.
  - src: ../../../assets/projects/arena/models.png
    alt: The models browser, a grid of every model you can run, with the Advisor, Kepler, and Cortex cards in view and a measured speed printed on each recommended build.
    caption: Your whole shelf in one grid, with a measured speed on each recommended build. Filter it, then chat or compare with one click.
    detail: >-
      Every model you can run sits in one grid, filterable by kind and license. Each card is
      a launch point: one click to chat with the model, one more to send it into a duel. The
      recommended build on a card carries its measured speed, read from real runs on the
      machine, not a brochure number.
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
    alt: The compare screen showing two models answering the same question side by side, with cards for quality, speed, wait time, length, and cost, each drawing a bar for both models on a shared scale.
    caption: Put any two models head to head and read the trade in plain numbers.
    detail: >-
      Pick any two models and watch them answer the same question side by side. Plain cards
      call the winner on quality, speed, wait time, length, and cost. Each card draws a bar
      for both models on the same scale, so the bigger number makes the longer bar and the
      gap reads at a glance. A local model against a hosted one is a fair fight here, and the
      cost card shows the local answer cost zero.
  - src: ../../../assets/projects/arena/command-palette.png
    alt: The command palette open over the cockpit, a search box that finds any model, article, or action from a few typed letters.
    caption: One keystroke opens a search over everything. Jump to a model or fire a test without the mouse.
    detail: >-
      One keystroke opens a search box over the whole cockpit. Type a few letters to jump to
      any model, fire a chat, or set up a duel, all without touching the mouse.
  - src: ../../../assets/projects/arena/settings-cloud-key.png
    alt: The Arena settings screen with a cloud key form that finds a key already on your machine or lets you paste one, beside a line saying your key stays on this machine.
    caption: Local first. Add your own cloud key only if you want one, and it never leaves your machine.
    detail: >-
      Your Researcher runs locally and needs no cloud key. This screen finds a key already
      set on your machine, or lets you paste one and save it. Until a key exists, the long
      list of cloud models and the spend readout stay hidden, so a fresh setup shows only the
      local model you own. A key you add is written to a private file the cockpit reads on
      your machine, and it is only ever sent to the cloud service when you actually run a
      cloud model.
  - src: ../../../assets/projects/arena/jobs-board.png
    alt: The jobs board, with the live readout rail on top, three dispatch forms to queue work, and four columns of jobs marked queued, running, done, and failed, with the queue idle and the resident Advisor model live on the rail.
    caption: The control plane. Queue a re-test of any model, or let the board catch a score drop and confirm it by itself.
    detail: >-
      This is where the cockpit starts work instead of just recording it. Type a model and a
      test set to queue a re-test by hand, or press scan and the board diffs the leaderboard
      against its last baseline and queues a confirming re-test for any score that slipped.
      One job runs at a time, so the queue can never blow past the shared memory.
  - src: ../../../assets/projects/arena/board-columns.png
    alt: A close-up of the four job columns. The queued and running columns are idle, done cards show real lane work like a model torn down with memory freed or a model brought live on its port, and a failed card explains a guarded launch that refused before acting.
    caption: Every job tells its own story. Done cards show the work that finished; failed cards say exactly why a job refused or stopped.
    detail: >-
      Every job card tells its own story. It names what kind of work it is and what
      triggered it, you or the board itself. A done card shows what the job actually did,
      like freeing memory when a model is torn down or bringing one live on its port. A
      failed card says exactly why it stopped, like a launch refused because another model
      was still resident, so you never have to open a log.
  - src: ../../../assets/projects/arena/train-dispatch.png
    alt: The grown jobs board with three dispatch slots above the four columns, one to re-test a model, one to start a reinforcement run, and one to start a fine-tune run from a recipe file.
    caption: The board grew from one job kind to three. Re-test a model, start a reinforcement run, or start a fine-tune run from a recipe.
    detail: >-
      The board's biggest growth is what it can start. Next to the original re-test slot,
      one slot starts a reinforcement run that trains a model against a reward, and another
      takes a recipe file and starts a fine-tune run as a job. All three kinds drain through
      the same four columns, one at a time, so the queue still respects the machine's shared
      memory.
  - src: ../../../assets/projects/arena/build-spine.png
    alt: The build pipeline pane showing the Advisor model's whole build as a spine of stage cards, scout, bench, corpus, fine-tune, smoke-test, serve, and reinforce, with a strip above naming the frozen test behind each score.
    caption: A whole model build as one spine. Each stage card carries its receipts, and the strip pins which frozen test scored what.
    detail: >-
      When training jobs belong to one model being built end to end, the Build pane lines
      them up as a spine: scouted, tested, fed its documents, fine-tuned, smoke-tested,
      served, and reinforced. Each stage is a card with its own saved proof, and the strip
      above pins exactly which frozen test produced each score, so a number is never
      separated from the test that made it.
  - src: ../../../assets/projects/arena/reward-gauge.png
    alt: The reward pane, one gauge in its ready state before any training run, with a note that the starting score will land here once a preflight check or a run reports.
    caption: The same test that scores the leaderboard is the reward a training run chases. One gauge watches both, and a gate holds promotion until the signal is clean.
    detail: >-
      The reward pane makes the training loop visible. The same scorer that grades the
      leaderboard is the reward signal a training run tries to raise, so one gauge shows
      the starting score, the live reward as the run trains, and a gate that holds
      promotion until the signal is clean. Here it sits ready before any run, waiting for
      the first preflight check or run to report. The pane only watches; it never starts work.
  - src: ../../../assets/projects/arena/guardrails.png
    alt: The settings screen for cloud test guardrails, a per-run cost cap and a stall timer that lock in when a job is sent, above a table of the paid cloud models the cap covers.
    caption: Paid cloud work gets bounds. A cost cap and a stall timer lock in the moment a job is sent.
    detail: >-
      Sending work to paid cloud models earned the board guardrails. A per-run cost cap and
      a stall timer lock onto the job the moment it is sent, the fix for a real cloud test
      that once hung for hours quietly running up a bill. Local runs on your own machine
      stay unguarded and free, because the bounds exist exactly where the meter does.
  - src: ../../../assets/projects/arena/standup.png
    alt: The morning standup report, forty-six jobs ran overnight, zero scores slipped, eight failed honestly, the queue drained, and total spend was about seven cents of a five dollar cap.
    caption: The overnight loop's report card. What ran, what slipped, what failed, and what it spent, waiting for you to review and promote.
    detail: >-
      The overnight layer landed as Standup, a read-only morning report of what the queue
      ran while you slept. The loop only stages work, it never publishes it: it drains the
      queue, runs the jobs, and stops at this gate for you to review and promote. Forty-six
      jobs, zero slipped scores, eight honest failures, and about seven cents of spend
      against a five dollar cap is what a delegated night looks like.
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
    lastSynced: '2026-06-15'
  - section: gallery
    type: docs-screenshots
    ref: manavsehgal/ainative-business.github.io:products/orionfold-arena/screenshots/
    lastSynced: '2026-06-16'
  - section: overview
    type: url
    ref: https://raw.githubusercontent.com/manavsehgal/ainative-business.github.io/main/products/arena-control-plane/product.md
    lastSynced: '2026-06-11'
  - section: gallery
    type: docs-screenshots
    ref: manavsehgal/ainative-business.github.io:products/arena-control-plane/screenshots/
    lastSynced: '2026-06-16'
  - section: onboard-cast
    type: file
    ref: manavsehgal/ainative-business.github.io:public/products/orionfold-arena/casts/onboard.cast
    lastSynced: '2026-06-15'
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

## It starts at the install

The first time you set Arena up, it walks you through every step in your terminal: it checks your machine, helps you grab a free access key, shows a plain list of what it is downloading, and gives you something to read while it works. When it is done, your AI Researcher is already warm and ready. Here is that walkthrough, replayed:

::asciinema{src="/arena/casts/onboard.cast" poster="/arena/casts/17-onboard-1-preflight.svg" cols=100 rows=20 idle=2 speed=1.4 alt="The guided Arena onboarding flow, replayed in the terminal" title="Arena guided onboarding, replayed"}

## Your first run

The first time the cockpit opens, a welcome screen greets you as your AI Researcher. It tells
you what is actually loaded, 182 sources broken into 647 searchable pieces, and gives you
three questions to try. The third one asks what is not in your notes, so in a single turn you
watch the model say plainly when it does not know an answer. You see this screen once. A small
link in the top bar brings it back any time you want it.

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
  your Spark or a hosted model. The flagship group reads like a product, not a lab log:
  plain-language names, small pills for each row's role and the frozen test behind its
  score, and the raw run id kept under every name so a friendly label can never hide which
  data it points at. It is built from a safe slice that shares only scores, never your
  prompts or the model's replies, so you can publish the board and keep your data.
- **Pick what to ship.** One chart plots quality against speed for every build and draws the
  best trade-offs in orange. Quality here means how well the model answers; the orange line
  is the set where you cannot get more quality without giving up speed. The flagship build
  is marked with a violet diamond so you can always find it among the dots.
- **Try and test in one place.** Chat with any model, pull the exact test it was measured on,
  and score its answer against a gold answer without leaving the chat. Or put two models head
  to head and read the trade in plain cards: quality, speed, wait time, length, and cost. Each
  card draws a bar for both models on the same scale, so the bigger number makes the longer bar
  and the gap reads at a glance.
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
- **Train from the same board.** The board now starts training, not just testing. A
  smoke-test slot answers "is this base model worth training?" with a small twenty-row test
  before any long run, and a training slot launches a full run from a recipe file. When the
  runs belong to one model being built end to end, a Build pane lines them up as a spine of
  stage cards, each with its saved proof, so the whole build reads as one story.
- **Watch the reward.** The same scorer that grades the leaderboard is the reward a training
  run tries to raise. One gauge shows the starting score, the live reward as the run trains,
  and a gate that holds promotion until the signal is clean.
- **Cap what cloud work can spend.** A per-run cost cap and a stall timer lock onto a paid
  cloud job the moment it is sent, so a hung test can never quietly run up a bill. Local runs
  stay free and unguarded, because the bounds live exactly where the meter does.
- **Wake up to a report.** An overnight loop drains the queue while you sleep, then stops. A
  morning report says what ran, what slipped, what failed, and what it spent. Nothing is
  published until you review and promote it.
- **Bring your own cloud key.** Your Researcher is local first and needs no cloud key. The
  settings screen finds a key already set on your machine, or lets you paste one and save it.
  Until you add a key, the long list of cloud models and the spend readout stay hidden, so a
  fresh setup shows only the local model you own. A key you add is written to a private file
  the cockpit reads on your machine, and it is only ever sent to the cloud service when you
  actually run a cloud model.
- **Move without the mouse.** One keystroke opens a search box over the whole cockpit. Type a
  few letters to jump to any model, fire a chat, or set up a duel.
- **See how it was built.** A Lab board shows what has shipped, what is queued from the plan,
  and what is being explored, next to a timeline of the build drawn from the commit history.
  Your own private notes live here too, and they sit on the never-share list, so they stay off
  the public board.

Jargon, in plain words: a *GGUF* is just a packaged model file you can run on your own
machine. To *quantize* a model is to shrink it so it runs faster, and the chart shows what
you trade away when you do. *Throughput* is how many words a second the model can produce.

## It keeps growing

Arena shipped as fourteen screens and 125 tests in about fifteen hours of work, spread over
one day and an overnight, with the AI agent doing the typing. The numbers are mined from the
build itself, not guessed: about 12,733 lines of code written, across 12 work sessions and
1,130 turns with the agent. Almost all of it was cheap to do, because the agent re-read the
same growing code from a cache instead of from scratch: of the 233 million pieces of text
it processed, 228 million, about 98 in 100, came from that cache, so fresh writing was only a
small slice. Claude Opus 4.7 wrote every line of the launch; Opus 4.8 is the daily driver now.

It did not stop there. In the days after launch six more screens landed, and the tool now
measures 17,515 lines of code and 135 tests. One part, a memory pane that indexes your own
notes and checks how well it can find them again, grew into its own product,
[Orionfold Cortex](/software/cortex/), with its own page. The jobs board, the control plane,
came together in one afternoon of about two and a half hours, adding 1,762 lines and 35 tests
of its own, and shipped inside fieldkit v0.16.0, the first packaged Arena release.

A third pass made the cockpit feel finished. A new blue and gold look replaced the first
orange one across every screen. A welcome screen now greets you on your first run, the cloud
models stay hidden until you bring your own key, and the install became the guided walkthrough
you see at the top of this page. The tour above is that newer cockpit.

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
research. Each part of fieldkit does one job, and Arena just gives that job a screen: one part
is the small server and database behind the cockpit, one runs the tests and scores the answers
that fill the eval drawer and the board, one produced the runs the board ranks, one boots and
reaches the models for chat and compare, and one ships the runnable notebook on every model
page. The data is real too: the board ranks models you actually published, the
quality-versus-speed chart plots numbers measured in real write-ups, and the eval drawer
serves the exact tests those models were scored on. Because the parts and the data already
existed, the whole cockpit came together in a day. The honest version of that story is the
better one: the cockpit is the sum of a lot of compounding work, not a fresh start.
