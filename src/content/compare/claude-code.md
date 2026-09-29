---
tool: Claude Code
kind: pair
order: 3
title: "Flow with Claude Code: your agent writes, you review, the record stays"
dek: "Claude Code is a strong agent for code and files. Flow is where the documents it helps write can wait for your review and keep a history. We walked this path with Codex; Claude Code on it is not yet verified by us."
line: "Use Claude Code for the work. Use Flow to review the documents and keep the record."
updated: 2026-09-28
startWith: review-agents
rows:
  - topic: "What it is for"
    them: "Claude Code is an agentic coding tool. It reads your codebase, edits files, runs commands, and works with git. It runs in the terminal, in code editors, in a desktop app and in the browser."
    flow: "Flow is a Mac app for documents: pricing pages, READMEs, client memos, briefs. Each one is a Markdown file in a folder you choose, with a review step and a History."
    path: review-agents
    source: { label: "Claude Code docs: Overview", href: "https://code.claude.com/docs/en/overview", checked: "2026-09-28" }
  - topic: "Asking before a change"
    them: "Claude Code has permission settings. In its Manual mode it asks before it edits or writes a file, and before most shell commands."
    flow: "Before an agent run starts, one sheet names the agent, the folder it may work in, and the cost. Its answer comes back as a proposal, shown line by line. In our Codex walk, the file on disk did not change until we approved."
    path: review-agents
    source: { label: "Claude Code docs: Configure permissions", href: "https://code.claude.com/docs/en/permissions", checked: "2026-09-28" }
  - topic: "Going back"
    them: "Claude Code checkpoints let you rewind its own file edits in a session. They do not track files changed by shell commands, and the docs say to keep using git for lasting history."
    flow: "History keeps every saved version of a document, with the receipt of the run that made it. It names the model and marks a version written from outside Flow as the work of an outside writer."
    path: review-agents
    source: { label: "Claude Code docs: Checkpointing", href: "https://code.claude.com/docs/en/checkpointing", checked: "2026-09-28" }
  - topic: "What you pay"
    them: "Claude Code is included in the Claude Pro plan ($17 a month paid yearly, or $20 monthly) and in Max plans (from $100 a month)."
    flow: "Flow can run Claude Code on the plan you already have, so Flow adds no second AI bill for that run. We saw this with Codex, where Flow charged nothing. We have not yet verified the Claude Code route on this path."
    path: review-agents
    source: { label: "Claude pricing", href: "https://claude.com/pricing", checked: "2026-09-28" }
  - topic: "Work on files outside a project"
    them: "Claude Code works directly with git. It stages changes, writes commit messages and opens pull requests."
    flow: "Plenty of writing never goes through a pull request. Flow's 2.0 release notes say that when Claude Code changes a document Flow has open, Flow shows it as Changed by Claude Code, with Keep and Revert. We have not yet watched this happen on a walked path."
    source: { label: "Claude Code docs: Overview", href: "https://code.claude.com/docs/en/overview", checked: "2026-09-28" }
notFlow:
  - "Flow is not a coding agent and does not replace Claude Code. It works beside it."
  - "We have not verified Claude Code on the review path. On our Mac it showed as not yet verified in Flow's settings, so the walk used Codex."
  - "With Full access, Claude Code runs with your own settings. Flow's own sheet says the agent can read and change files Flow does not see, and Flow records what the agent reports, not what Flow watched."
  - "Flow does not check your docs against your code. It proofreads and drafts prose, and you approve each change."
  - "Flow is a Mac app only, and agent runs need Flow Pro once your 10 Pro Days are used."
sources:
  - { label: "Claude Code docs: Overview", href: "https://code.claude.com/docs/en/overview", checked: "2026-09-28" }
  - { label: "Claude Code docs: Configure permissions", href: "https://code.claude.com/docs/en/permissions", checked: "2026-09-28" }
  - { label: "Claude Code docs: Checkpointing", href: "https://code.claude.com/docs/en/checkpointing", checked: "2026-09-28" }
  - { label: "Claude pricing", href: "https://claude.com/pricing", checked: "2026-09-28" }
---

## Why pair them

Claude Code is very good at its job. It [reads a whole project, edits files and runs commands](https://code.claude.com/docs/en/overview), and it asks before it acts in its [Manual mode](https://code.claude.com/docs/en/permissions). For code, you also have git and pull requests, so every change can be read before it ships.

A lot of the writing an agent helps with is not code. A pricing page, a README, a client memo, a changelog. Those often go from the agent straight into the file, and you only find out what changed if you go and look.

Flow puts a review step in between. You still use Claude Code. Flow is where the document lives, where the agent's change waits for you, and where the record of who wrote what is kept.

## How they work together

This is how it went on our walk, where we used Codex. The steps are the same for any agent Flow supports, but we have not run them with Claude Code yet.

1. **Pick the agent and the folder.** In Flow's model switcher you pick your subscription. Flow lists Claude Code and Codex, signed in on your Mac, on the plans you already have.
2. **Read the terms first.** Before the run starts, one sheet names the agent, the folder it may work in, and the cost. For a subscription run, the cost reads *Included*. Nothing runs until you press Allow Once.
3. **Review the exact lines.** The agent's answer arrives as a proposal. *Exact changes* shows each added and removed line. On our walk, the file on disk kept its old version until we approved.
4. **Keep the record.** History shows the run, the checks it passed, and the model that did the work.

One more thing we measured: the agent sent 21,831 tokens in to proofread a 239-word page. Tokens are the small pieces of text a model reads and writes. An agent carries its own working notes, not just your page. On a pay-per-token key, that extra is what you pay for. On a plan you already have, Flow adds no second meter for the run.

Be clear on one point. With Full access, the agent uses its own settings, and Flow says so in the sheet: it can read and change files Flow does not see. Flow controls only what Flow itself does. Choose the folder with that in mind.

## The path to start with

Start with [review what your agents wrote](/flow/paths/review-agents/). It is the one path built for people who already use a coding agent. It shows the consent sheet, the line-by-line review, and History, all on a real run. It also says plainly what we did not see: Claude Code on the same path, which is still to be verified.
