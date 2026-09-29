---
tool: Codex
kind: pair
order: 4
title: "Flow with Codex: your agent proposes, you decide, the record stays"
dek: "Codex does the work on the ChatGPT plan you already have. Flow makes its edits to your documents wait for your review, line by line, and keeps a record of every run."
line: "Run Codex on your plan. Review its edits in Flow before they touch the file."
updated: 2026-09-28
startWith: review-agents
rows:
  - topic: "What it is for"
    them: "Codex reads, edits and runs code. It works in the ChatGPT desktop app, a command line tool, a code editor extension, on the web and in the cloud."
    flow: "Flow is a Mac app for documents. Each one is a Markdown file in a folder you choose, with a review step and a History."
    path: review-agents
    source: { label: "Codex docs: Overview", href: "https://learn.chatgpt.com/docs", checked: "2026-09-28" }
  - topic: "What it may do on its own"
    them: "In its default Auto setting, Codex can read files, make edits and run commands in the workspace without asking. It asks before it edits outside the workspace or uses the network."
    flow: "When Codex runs from a Flow action, its answer comes back as a proposal. The run took 27 seconds. In our walk, the file on disk kept its old version until we approved."
    path: review-agents
    source: { label: "Codex docs: Agent approvals and security", href: "https://learn.chatgpt.com/docs/agent-approvals-security", checked: "2026-09-28" }
  - topic: "What you pay"
    them: "Codex is included in the ChatGPT Free, Go, Plus, Pro, Business, Edu and Enterprise plans. You can also use an API key, which is charged at API rates."
    flow: "Flow ran Codex on our ChatGPT plan. The consent sheet said Included, and Flow charged nothing for the run."
    path: review-agents
    source: { label: "Codex docs: Pricing", href: "https://learn.chatgpt.com/docs/pricing", checked: "2026-09-28" }
  - topic: "Seeing what changed"
    them: "Codex can review code changes and fix issues as part of its work."
    flow: "Flow's review shows the exact lines Codex changed. In our walk that was three: a comma and two spelling fixes. Everything else was marked unchanged."
    path: review-agents
    source: { label: "Codex docs: Overview", href: "https://learn.chatgpt.com/docs", checked: "2026-09-28" }
  - topic: "Keeping the record"
    them: "Codex runs in a sandbox that decides what it can reach. The approval setting decides when it stops and asks you."
    flow: "History recorded the run, the checks it passed, and the model that did the work, codex-cli/subscription. The version we wrote earlier from a terminal was marked as the work of an outside writer."
    path: review-agents
    source: { label: "Codex docs: Agent approvals and security", href: "https://learn.chatgpt.com/docs/agent-approvals-security", checked: "2026-09-28" }
notFlow:
  - "Flow is not a coding agent and does not replace Codex. It works beside it."
  - "With Full access, Codex runs with your own settings. Flow's sheet says the agent can read and change files Flow does not see, and Flow records what the agent reports, not what Flow watched."
  - "Flow does not check your docs against your code. It proofreads and drafts prose, and you approve each change."
  - "We have not yet watched Flow catch a change Codex made from a terminal. The release notes say it shows up for review, but our walk did not test it."
  - "Flow is a Mac app only, and agent runs need Flow Pro once your 10 Pro Days are used."
sources:
  - { label: "Codex docs: Overview", href: "https://learn.chatgpt.com/docs", checked: "2026-09-28" }
  - { label: "Codex docs: Agent approvals and security", href: "https://learn.chatgpt.com/docs/agent-approvals-security", checked: "2026-09-28" }
  - { label: "Codex docs: Pricing", href: "https://learn.chatgpt.com/docs/pricing", checked: "2026-09-28" }
---

## Why pair them

Codex is fast and it is everywhere you work: the [ChatGPT desktop app, the command line, your code editor and the web](https://learn.chatgpt.com/docs). It comes with [most ChatGPT plans](https://learn.chatgpt.com/docs/pricing), so many people already pay for it.

By default, Codex [can read, edit and run commands in your workspace without asking](https://learn.chatgpt.com/docs/agent-approvals-security). That is what makes it quick. For code, git and pull requests give you a place to read each change. For a pricing page, a README or a client memo, there is often nothing between the agent and the file.

Flow gives those documents a review step and a record. Codex still does the work. Flow is where the change waits for you.

## How they work together

This is the walk we ran, with Codex on our own ChatGPT plan.

1. **Pick Codex.** In Flow's model switcher we chose *Codex subscription*. If you have the ChatGPT desktop app but never installed the Codex command line tool, Flow's release notes say it finds the Codex that comes with the app.
2. **Read the terms first.** Before anything ran, one sheet named the agent (Codex), the folder it could work in, and the cost: *Included in a subscription you already pay for*. Nothing ran until we pressed Allow Once.
3. **Review the exact lines.** 26.7 seconds later, the proposal was waiting. *Exact changes* showed three edited lines on a 239-word page. The file on disk kept its old version until we ticked *I accept changes* and approved.
4. **Keep the record.** History showed the run, its checks, and the model, `codex-cli/subscription`.

One number is worth knowing. Codex sent 21,831 tokens in to proofread that 239-word page. Tokens are the small pieces of text a model reads and writes. An agent carries its own working notes, not just your page. On a pay-per-token key, that extra is what you pay for, about ten cents a pass at top-tier prices. On a plan you already have, the plan absorbs it, and Flow adds no second meter.

One caution. With Full access, Codex uses its own settings. Flow's sheet says so: the agent can read and change files Flow does not see. Flow controls only what Flow itself does, so choose the folder with care.

## The path to start with

Start with [review what your agents wrote](/flow/paths/review-agents/). It is the walk above, step by step, with every screen. It shows the consent sheet, the line-by-line review, and History on a real Codex run. It also lists what we did not test, so you know where the proof stops.
