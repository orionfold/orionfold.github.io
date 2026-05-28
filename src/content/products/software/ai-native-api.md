---
# P7 software rollout #2 (spec §5.5, "Software -> SPONSOR"). Authored from the
# platform's own API docs (ainative.business/docs/api/, source in
# Developer/ainative-business.github.io/src/pages/docs/api/). No first-party
# product screenshots for an API, so this page ships gallery-less (the adaptive
# template omits the section); the install + usage code tabs carry it instead.
# Accuracy fix: the docs document 26 areas / 120+ calls, not "27 groups" — the
# SSOT card was corrected to match. Copy is grade 3-5, no em-dashes, jargon glossed.
type: software
slug: ai-native-api
valueProp: Drive the whole platform with code. Your own apps can start tasks, read the results, and run everything through plain web calls.

chips:
  - label: Style
    value: REST over HTTP
  - label: Calls
    value: 120+
  - label: Areas
    value: '26'
  - label: Runs
    value: On your machine

install:
  - label: Your first call
    lang: bash
    code: |
      # Ask the platform to run a task. It answers right away with a task id.
      curl -X POST http://localhost:3000/api/tasks \
        -H "Content-Type: application/json" \
        -d '{"title":"Summarize this week of sales","assignedAgent":"claude-code"}'

usage:
  - label: Run a task end to end
    lang: ts
    code: |
      // 1. Create a task. It comes back with an id.
      const res = await fetch("http://localhost:3000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Draft a blog post", assignedAgent: "claude-code" }),
      });
      const task = await res.json();

      // 2. Move it to the queue, then start it. The call returns at once.
      await fetch(`http://localhost:3000/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "queued" }),
      });
      await fetch(`http://localhost:3000/api/tasks/${task.id}/execute`, { method: "POST" });

      // 3. Read the result once it is done.
      const out = await fetch(`http://localhost:3000/api/tasks/${task.id}/output`);
      console.log(await out.json());

specs:
  - label: Style
    value: REST over HTTP, JSON in and out
  - label: Web address
    value: http://localhost:3000 (your own machine)
  - label: Sign-in
    value: Uses the AI keys you set in Settings
  - label: Size
    value: More than 120 calls across 26 areas
  - label: Live updates
    value: Watch a task's logs stream as it runs

relatedReading:
  - title: AI Native Platform
    href: /software/ai-native-platform/
  - title: Building in public
    href: /story/building-in-public/
relatedBook: ai-native-business

outbound:
  - label: Read the API docs
    href: https://ainative.business/docs/api/
    kind: docs
  - label: Platform docs
    href: https://ainative.business/docs/
    kind: docs

sources:
  - section: overview
    type: url
    ref: https://ainative.business/docs/api/
    lastSynced: '2026-05-27'
  - section: usage
    type: url
    ref: https://ainative.business/docs/api/tasks
    lastSynced: '2026-05-27'
---

The AI Native API lets your own programs drive the AI Native Platform. Anything you
can do by hand in the app, your code can do too: start a task, hand it to an agent,
check how it is going, and read the result. You talk to it with plain web calls, the
same kind of request a web page makes, so any language that can reach the internet can
use it.

## What you can reach

The platform is split into 26 areas, with more than 120 calls in total. You can manage
tasks and projects, build step-by-step workflows, set schedules that run on their own,
pick which agent and which AI model does the work, and even watch what each run costs.
There are calls for documents, tables, settings, and saved backups too, so a small app
of your own can lean on the whole platform.

## Fire and forget

When you start a task, the API answers straight away and lets the agent work in the
background. You do not sit and wait. If you want to follow along, open the task's log
stream and the lines arrive live as the agent does its job. When it finishes, one more
call hands you the finished result.

## It stays on your machine

The API runs where the platform runs, on your own computer. It uses the AI keys you
already set in the app's Settings, so there is no extra login and your work never has
to leave your machine.
