---
# P5 — the second book page (spec §5.5-5.6). The DGX Spark / Field Notes running
# log. Same shape as the P2 ai-native-business pilot, but bigger: a 53-chapter /
# 8-part real table of contents pulled from books/dgx-spark/_build/manifest.json,
# part names from book.yml, the long technical chapter titles/subtitles rewritten
# to grade 3-5 with no em-dashes and inline glosses for jargon (website-copy-
# style). Word count (~145k) verified from the rendered prose, not the manifest.
# Hero is the real book cover; books resolve the hero from this frontmatter.
type: book
slug: ai-research-on-nvidia-dgx-spark
valueProp: A growing field journal of real AI research run on one desktop machine, the NVIDIA DGX Spark. Fifty three chapters in eight parts, every lesson backed by code you can run yourself. Free to read online.

# Books resolve the hero from frontmatter (the route does not glob a poster).
hero: ../../../assets/book/ai-research-dgx-spark-book.jpg
heroAlt: The AI Research on NVIDIA DGX Spark book cover, a black cover with a glowing gold brain made of network nodes and circuit lines, the title in gold and white.

chips:
  - label: Length
    value: 53 chapters
  - label: Parts
    value: 8 parts
  - label: Size
    value: About 145,000 words
  - label: Price
    value: Free to read

# Real table of contents (books/dgx-spark/_build/manifest.json; part names from
# book.yml). Titles stripped of em-dashes and simplified; subtitles rewritten to
# one plain sentence each, with jargon glossed on first use.
chapters:
  - number: 1
    part: 'Part 1 · Foundations'
    title: Setting up the Spark for solo AI work
    subtitle: Why the tools you work through matter more on day one than the model itself.
  - number: 2
    part: 'Part 1 · Foundations'
    title: One machine, three ways to build on it
    subtitle: The same setup opens three paths, and this chapter walks you to the top of each.
  - number: 3
    part: 'Part 1 · Foundations'
    title: What it takes to retrain a giant model
    subtitle: Three ways to fine-tune a 100B model (adjust a ready model on your own data), and how much memory each one needs.
  - number: 4
    part: 'Part 1 · Foundations'
    title: What the research agent really built, in plain words
    subtitle: A full day of automated work for two cents of power, and why training a model from scratch is rarely worth it.
  - number: 5
    part: 'Part 1 · Foundations'
    title: The real memory cost of serving a model
    subtitle: Why the bill at answer time is set by how many users and how long the prompt, not by model size.
  - number: 6
    part: 'Part 2 · Inference and retrieval'
    title: Your first model server on the Spark
    subtitle: Running NVIDIA's ready-to-run Llama 3.1 8B, and what the speed number does not tell you.
  - number: 7
    part: 'Part 2 · Inference and retrieval'
    title: Your own space of meaning
    subtitle: A local service that turns text into numbers so the computer can find related ideas fast.
  - number: 8
    part: 'Part 2 · Inference and retrieval'
    title: Where the meaning lives
    subtitle: Storing those numbers in a plain database so you can search them in milliseconds.
  - number: 9
    part: 'Part 2 · Inference and retrieval'
    title: Three services, one answer
    subtitle: Letting the model look things up before it answers, the simple way. This is what people call RAG.
  - number: 10
    part: 'Part 2 · Inference and retrieval'
    title: Better ways to look things up
    subtitle: Four search methods on one set of notes, and which one finds the right page.
  - number: 11
    part: 'Part 2 · Inference and retrieval'
    title: A bigger model, the same gaps
    subtitle: Testing an 8B, a 49B, and a 70B model on one setup, and why a bigger model alone did not fix the misses.
  - number: 12
    part: 'Part 2 · Inference and retrieval'
    title: A safety gate before the model speaks
    subtitle: One rule layer with three jobs, guarding private data, house style, and safe code.
  - number: 13
    part: 'Part 2 · Inference and retrieval'
    title: Teaching a model to explore at answer time
    subtitle: A small add-on that helps the model reach wider for an answer without costing more compute.
  - number: 14
    part: 'Part 2 · Inference and retrieval'
    title: Six fixes hiding behind two
    subtitle: A change that looked like two patches turned into six, and the score it reached once they all landed.
  - number: 15
    part: 'Part 2 · Inference and retrieval'
    title: Three shapes of the same trick
    subtitle: Where that answer-time add-on helps a lot, a little, or not at all.
  - number: 16
    part: 'Part 3 · Training and pretraining'
    title: A real training framework against a hand-built script
    subtitle: Same model, same steps, and what a proper framework gives back in speed and memory.
  - number: 17
    part: 'Part 3 · Training and pretraining'
    title: Finding the fastest training settings
    subtitle: Sixteen setups swept to find the peak, landing at about 14,000 text pieces trained per second.
  - number: 18
    part: 'Part 3 · Training and pretraining'
    title: When real data beats random data
    subtitle: Feeding real text instead of noise, and how little it slows the training down.
  - number: 19
    part: 'Part 3 · Training and pretraining'
    title: How a small machine saves a big cloud bill
    subtitle: Test a hundred ideas on the desk for about a dollar of power, then rent the big machine only for the winner.
  - number: 20
    part: 'Part 4 · Fine-tuning and alignment'
    title: Teaching a model your own voice
    subtitle: 231 of your own question-and-answer pairs and a short, cheap retrain, and what it changes.
  - number: 21
    part: 'Part 4 · Fine-tuning and alignment'
    title: Copying the research agent's taste
    subtitle: Training a small model on the agent's past choices, and where it falls short.
  - number: 22
    part: 'Part 4 · Fine-tuning and alignment'
    title: Building the training gym ourselves
    subtitle: A workbench, 200 tasks, and the lift a small retrain earned over the plain model.
  - number: 23
    part: 'Part 4 · Fine-tuning and alignment'
    title: Closing the loop the first retrain could not
    subtitle: A reward signal that teaches the agent to stop once the job is actually done.
  - number: 24
    part: 'Part 4 · Fine-tuning and alignment'
    title: When the practice score lies
    subtitle: A method that looks great in practice but slips on fresh, held-out tasks.
  - number: 25
    part: 'Part 4 · Fine-tuning and alignment'
    title: Smarter limits on a long task
    subtitle: A training tweak that pays more attention to the turns that actually taught the agent something.
  - number: 26
    part: 'Part 4 · Fine-tuning and alignment'
    title: Knowing where a model stands before you train it
    subtitle: Three test settings that bracket a model's ceiling on one machine, no cluster needed.
  - number: 27
    part: 'Part 4 · Fine-tuning and alignment'
    title: The trainer was fine, the data was not
    subtitle: Three confident wrong guesses, and the cheap bug in the data that caused all of them.
  - number: 28
    part: 'Part 4 · Fine-tuning and alignment'
    title: A faster trainer that fits the same memory
    subtitle: Six checks that prove a leaner training tool holds the same memory budget end to end.
  - number: 29
    part: 'Part 4 · Fine-tuning and alignment'
    title: Two trainers, one job, a 26% gap
    subtitle: The same recipe through two tools, and which one trained faster and wrote longer answers.
  - number: 30
    part: 'Part 5 · Agentic systems'
    title: The sandbox cost that was not the problem
    subtitle: Running a safe, walled-off agent next to a plain one on the same model, and where the real cost turned out to be.
  - number: 31
    part: 'Part 5 · Agentic systems'
    title: Turning the research stack into a tool
    subtitle: Wrapping the look-it-up chain so any coding session can use it as a grounded helper.
  - number: 32
    part: 'Part 5 · Agentic systems'
    title: Rules before the agent edits code
    subtitle: Five checks sit between what the agent proposes and any change it is allowed to make.
  - number: 33
    part: 'Part 5 · Agentic systems'
    title: The overnight loop that edits its own trainer
    subtitle: Fifty rounds of a model improving its own training code while you sleep, for seven cents of power.
  - number: 34
    part: 'Part 5 · Agentic systems'
    title: Reading the agent's paper trail
    subtitle: How keeping a simple log of past tries made the next try far more useful.
  - number: 35
    part: 'Part 6 · Observability and evaluation'
    title: Scoring the research stack
    subtitle: 44 held-out questions, and which setup actually earned the points.
  - number: 36
    part: 'Part 6 · Observability and evaluation'
    title: Was the agent working or stalling?
    subtitle: Putting real numbers on how often the agent just repeated itself.
  - number: 37
    part: 'Part 6 · Observability and evaluation'
    title: One test, two ways to fail
    subtitle: Two models on the same hard test, both scoring zero for completely different reasons.
  - number: 38
    part: 'Part 7 · Deployment and distribution'
    title: The 4-bit trick that beats the rest
    subtitle: Why a newer way of shrinking the numbers, not just smaller numbers, is the real speed win on this chip.
  - number: 39
    part: 'Part 7 · Deployment and distribution'
    title: Five finance model builds, measured
    subtitle: Packaging a finance model five ways and scoring each on speed, size, and a finance test.
  - number: 40
    part: 'Part 7 · Deployment and distribution'
    title: Five legal model builds, measured
    subtitle: The same five-way test for a legal model, with a law-exam score for each build.
  - number: 41
    part: 'Part 7 · Deployment and distribution'
    title: Five security model builds, measured
    subtitle: The same for a cyber-security model, where the smallest build came out on top.
  - number: 42
    part: 'Part 7 · Deployment and distribution'
    title: Five medical model builds, measured
    subtitle: The same for a medical-reasoning model, with a clear study-helper-not-a-doctor note.
  - number: 43
    part: 'Part 8 · Field Kit toolkit reference'
    title: capabilities
    subtitle: A clear map of what the Spark can do, with the memory math built in.
  - number: 44
    part: 'Part 8 · Field Kit toolkit reference'
    title: nim
    subtitle: A tidy client for talking to the model server, with retries and size checks.
  - number: 45
    part: 'Part 8 · Field Kit toolkit reference'
    title: rag
    subtitle: The look-it-up pipeline, taking in notes, finding the right ones, then answering from them.
  - number: 46
    part: 'Part 8 · Field Kit toolkit reference'
    title: eval
    subtitle: The scoring tools, including tests, judges, and a checker for when a model refuses to answer.
  - number: 47
    part: 'Part 8 · Field Kit toolkit reference'
    title: training
    subtitle: The building blocks for retraining a model on the Spark.
  - number: 48
    part: 'Part 8 · Field Kit toolkit reference'
    title: lineage
    subtitle: A simple log that records what each training try learned.
  - number: 49
    part: 'Part 8 · Field Kit toolkit reference'
    title: quant
    subtitle: The tool that shrinks a model and measures what you trade away for the smaller size.
  - number: 50
    part: 'Part 8 · Field Kit toolkit reference'
    title: publish
    subtitle: The pieces that push a finished model to HuggingFace with a full report card.
  - number: 51
    part: 'Part 8 · Field Kit toolkit reference'
    title: command line tool
    subtitle: Quick checks and small benchmarks without writing any code.
  - number: 52
    part: 'Part 8 · Field Kit toolkit reference'
    title: viz
    subtitle: Branded charts and tables for the research notebooks.
  - number: 53
    part: 'Part 8 · Field Kit toolkit reference'
    title: notebook
    subtitle: A runtime that runs the same notebook on the Spark or on a free cloud GPU.

# Inward cross-sell. The models are the ones this book actually built and
# measured, so each related link is honest; relatedBook flips internal now that
# both book pages exist (resolveRelated handles it).
relatedModels: [patent-strategist, securityllm, saul-7b-instruct, finance-chat, ii-medical-8b]
relatedBook: ai-native-business
relatedReading:
  - title: My first model on a desktop
    href: /story/my-first-model-on-a-desktop/
  - title: Access first, models second
    href: /story/access-first-models-second/

outbound:
  - label: Read online
    href: https://ainative.business/field-notes
    kind: site

sources:
  - section: chapters
    type: book-manifest
    ref: books/dgx-spark/_build/manifest.json
    lastSynced: '2026-05-26'
  - section: overview
    type: url
    ref: https://ainative.business/field-notes
    lastSynced: '2026-05-26'
---

AI Research on NVIDIA DGX Spark is a running log of real AI research, all done on
one small desktop machine. The DGX Spark is tiny but very powerful, so you can
push local AI a long way with no cloud bill and no shared servers. Every chapter
is a working note from the bench, and every claim is backed by code that runs.

## What you will learn

You start by setting the machine up for everyday work, then build a system that
can look things up before it answers (so it stays grounded in your own notes).
From there you train and retrain models, run an agent that improves its own
training code overnight, and measure the results in plain numbers. The last part
is a reference for Field Kit, the small Python toolkit that ties it all together.

## Who it is for

Builders and researchers who want to run serious AI on hardware they own, not
rent. You do not need a cluster or a big budget. You can read the whole thing
free online. If you want a copy to keep and read offline, the PDF and EPUB bundle
is yours for a one time price.
