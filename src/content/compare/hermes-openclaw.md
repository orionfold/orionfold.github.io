---
tool: Hermes Agent and OpenClaw
kind: pair
order: 6
title: "Flow with Hermes Agent or OpenClaw: the agent does the work, the document waits for you"
dek: "Running a general agent across your chat apps and tools? When its work is a document for a client, Flow is where that document can wait for your review. We have not walked either agent with Flow. This page compares their own docs with our Codex walk."
line: "Let the agent work across your tools. Review its documents in Flow."
updated: 2026-10-27
startWith: review-agents
rows:
  - topic: "What it is for"
    them: "Both are free, open-source agents under the MIT licence. Hermes Agent works in chat apps like Telegram, Slack and WhatsApp, in a terminal and in a desktop app. OpenClaw runs on your own hardware and works in more than 20 chat apps, a Mac app and a browser panel."
    flow: "Flow is a Mac app for documents: briefs, memos, pricing pages. Each one is a Markdown file in a folder you choose, with a review step and a History."
    path: review-agents
    source: { label: "OpenClaw docs", href: "https://docs.openclaw.ai/", checked: "2026-10-27" }
  - topic: "Which AI it uses"
    them: "Both can run open models on your own machine, use an API key, or sign in with a ChatGPT account for Codex."
    flow: "Flow can run open models on the Mac, Claude Code or Codex on the plan you already have, or a hosted model with your key. In our Codex walk, the sheet said Included and Flow charged nothing."
    path: review-agents
    source: { label: "Hermes Agent docs: Providers", href: "https://hermes-agent.nousresearch.com/docs/integrations/providers", checked: "2026-10-27" }
  - topic: "Asking before it acts"
    them: "Hermes asks about risky commands. By default a second AI model judges the risk, and manual mode always asks you. On OpenClaw's gateway hosts, commands run with no prompts by default. You can switch it to an allow list or to ask every time."
    flow: "Before an agent run starts, one sheet names the agent, the folder it may work in, and the cost. Its answer comes back as a proposal. In our Codex walk, the file on disk did not change until we approved."
    path: review-agents
    source: { label: "OpenClaw docs: Exec approvals", href: "https://docs.openclaw.ai/tools/exec-approvals", checked: "2026-10-27" }
  - topic: "Keeping it in a box"
    them: "Hermes can run commands on your computer or inside Docker, SSH or cloud sandboxes. OpenClaw's sandbox is off by default, and you can turn it on to run sessions in Docker, Podman or over SSH."
    flow: "When Flow runs a model itself, it can only propose changes to the document. With Full access, an outside agent uses its own settings and can change files Flow does not see. Flow's sheet says so."
    path: review-agents
    source: { label: "OpenClaw docs: Sandboxing", href: "https://docs.openclaw.ai/gateway/sandboxing", checked: "2026-10-27" }
  - topic: "Seeing what changed"
    them: "The Hermes desktop app has a review pane that shows file changes and lets you revert or commit them in a Git project. OpenClaw's browser panel shows file changes side by side or in one column."
    flow: "Exact changes shows each line the agent added or removed in the document, and nothing enters it until you tick I accept changes. In our Codex walk, that was three lines on a 239-word page."
    path: review-agents
    source: { label: "Hermes Agent docs: Desktop app", href: "https://hermes-agent.nousresearch.com/docs/user-guide/desktop", checked: "2026-10-27" }
  - topic: "Keeping the record"
    them: "Hermes keeps every session's messages in a local database you can search. OpenClaw keeps an audit ledger of actions and outcomes for 30 days. It does not store prompts or file names, and its docs say a missing row proves nothing."
    flow: "History keeps every saved version of a document, with the receipt of the run that made it and the model's name. In our walk, a version written from a terminal was marked as the work of an outside writer."
    path: review-agents
    source: { label: "OpenClaw docs: Provenance", href: "https://docs.openclaw.ai/start/why-openclaw/provenance", checked: "2026-10-27" }
  - topic: "Where you can use it"
    them: "Hermes has desktop apps for Mac and Windows and runs in a terminal on Linux. OpenClaw has apps for Mac, Windows, Linux, iOS and Android. Both also work through chat apps."
    flow: "Flow is a Mac app only. There is no Windows, phone or web version, and it does not work through chat apps."
    source: { label: "Hermes Agent", href: "https://hermes-agent.nousresearch.com/", checked: "2026-10-27" }
notFlow:
  - "We have not walked Hermes Agent or OpenClaw with Flow. This page sets their own docs beside what we saw on our Codex walk."
  - "Flow is not a general agent. It does not run in chat apps or work across your other tools."
  - "Flow has no built-in link to Hermes or OpenClaw. Having one of them write into a folder Flow has open is an idea we have not tested."
  - "With Full access, an outside agent runs with its own settings. Flow controls only what Flow itself does, and records what the agent reports, not what Flow watched."
  - "Flow is a Mac app only, and agent runs need Flow Pro once your 10 Pro Days are used."
sources:
  - { label: "Hermes Agent", href: "https://hermes-agent.nousresearch.com/", checked: "2026-10-27" }
  - { label: "Hermes Agent docs: Security", href: "https://hermes-agent.nousresearch.com/docs/user-guide/security", checked: "2026-10-27" }
  - { label: "Hermes Agent docs: Providers", href: "https://hermes-agent.nousresearch.com/docs/integrations/providers", checked: "2026-10-27" }
  - { label: "Hermes Agent docs: Sessions", href: "https://hermes-agent.nousresearch.com/docs/user-guide/sessions", checked: "2026-10-27" }
  - { label: "Hermes Agent docs: Desktop app", href: "https://hermes-agent.nousresearch.com/docs/user-guide/desktop", checked: "2026-10-27" }
  - { label: "OpenClaw docs", href: "https://docs.openclaw.ai/", checked: "2026-10-27" }
  - { label: "OpenClaw docs: Exec approvals", href: "https://docs.openclaw.ai/tools/exec-approvals", checked: "2026-10-27" }
  - { label: "OpenClaw docs: Sandboxing", href: "https://docs.openclaw.ai/gateway/sandboxing", checked: "2026-10-27" }
  - { label: "OpenClaw docs: Provenance", href: "https://docs.openclaw.ai/start/why-openclaw/provenance", checked: "2026-10-27" }
  - { label: "OpenClaw docs: Control UI", href: "https://docs.openclaw.ai/web/control-ui", checked: "2026-10-27" }
---

## Why pair them

**The job.** Say you run a general agent for your business. It answers in your chat apps, works across your tools, and some of what it makes is a document: a weekly report, a client memo, a proposal. [Hermes Agent](https://hermes-agent.nousresearch.com/) and [OpenClaw](https://docs.openclaw.ai/) are both free, open source and able to run on your own machine.

**The moment.** Then the document is about to go to a client. Before it does, you want to read exactly what the agent wrote, and know which model wrote it.

**Your choices.** You can rely on the agent's own controls. Hermes asks about risky commands, and its [desktop app](https://hermes-agent.nousresearch.com/docs/user-guide/desktop) shows file changes in a Git project. OpenClaw can [ask before each command](https://docs.openclaw.ai/tools/exec-approvals), run in a [sandbox](https://docs.openclaw.ai/gateway/sandboxing) and keep an [audit ledger](https://docs.openclaw.ai/start/why-openclaw/provenance). You can keep the documents in Git and read each change there. Or you can have Flow hold the document while you review it. If the agent's own review already works for you, keep it.

**What breaks.** In both agents, approvals are about commands, not the words in a document. Once a command is allowed, it can change files. OpenClaw's own docs say its ledger never stores file names, and that a missing row proves nothing. For a client memo, you still need to read the change itself.

Flow is for that last step. In Flow, a document's AI changes arrive as a proposal, shown line by line, and wait for your yes. History keeps each version and names who wrote it.

## How they could work together

We have not walked this. Here is the split we would test, and where the proof stops.

1. **Let the agent do the wide work.** Research, messages, tools and scheduled jobs stay with Hermes or OpenClaw.
2. **Keep the document in a Flow folder.** The memo or report lives as a Markdown file in a folder Flow has open.
3. **Review the document in Flow.** When Flow runs an agent itself, as in our [Codex walk](/flow/paths/review-agents/), the change waits in Review until you approve it. A change written from outside Flow shows in History as the work of an outside writer. We have not yet seen this with Hermes or OpenClaw.

## The path to start with

Start with [review what your agents wrote](/flow/paths/review-agents/). It was walked with Codex, not with Hermes or OpenClaw. It shows the consent sheet, the line-by-line review and History on a real run, and it lists what we did not test.
