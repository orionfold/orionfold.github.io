---
tool: Obsidian
kind: switch
order: 2
title: "Flow for Obsidian users: same Markdown files, documents that do work"
dek: "A brief you redo every month? Keep your Markdown files and your vault. Flow adds Jobs that redo the routine part, and every AI change waits for your yes."
line: "Keep your Markdown files. Add documents that redo their own routine work."
updated: 2026-10-27
startWith: recurring-client-brief
rows:
  - topic: "Where your notes live"
    them: "Obsidian stores notes as Markdown plain text files in a vault. A vault is a folder on your own computer, with its subfolders."
    flow: "The same idea. Flow works on folders of Markdown files on your Mac, with no import step and no private format. Add Folder opens a folder where it sits."
    path: docs-true-to-code
    source: { label: "Obsidian Help: How Obsidian stores data", href: "https://obsidian.md/help/data-storage", checked: "2026-09-28" }
  - topic: "What it costs"
    them: "The Obsidian app is free, with no sign-up. Sync is $4 per user a month paid yearly, or $5 monthly. Publish is $8 per site a month paid yearly, or $10 monthly."
    flow: "Reading, writing and saving Markdown in Flow is free. Flow Pro adds the AI for $10 a month or $96 a year. Import and Publish are add-ons to Pro, at $10 a month or $96 a year each."
    path: recurring-client-brief
    source: { label: "Obsidian pricing", href: "https://obsidian.md/pricing", checked: "2026-10-27" }
  - topic: "Links between notes"
    them: "Obsidian links notes with double square brackets. Its Backlinks and Graph view plugins show how notes connect."
    flow: "Flow also has wiki links and backlinks. We have not yet checked Flow against a real Obsidian vault."
    source: { label: "Obsidian Help: Link notes", href: "https://obsidian.md/help/link-notes", checked: "2026-09-28" }
  - topic: "Adding new abilities"
    them: "Community plugins, built by other users, add features. Obsidian starts in Restricted Mode, so no plugin code runs until you turn it off. It scans every plugin version for malware and security problems."
    flow: "Jobs, drafting with sources, import and publish are built into Flow. When AI changes a document, the change shows line by line and waits for you to keep or revert it."
    path: campaign-with-proof
    source: { label: "Obsidian Help: Plugin security", href: "https://obsidian.md/help/plugin-security", checked: "2026-10-27" }
  - topic: "Where you can use it"
    them: "Obsidian runs on Windows, Mac and Linux, and on iOS and Android."
    flow: "Flow is a Mac app only. If you work on Windows, Linux or a phone too, Obsidian fits that and Flow does not."
    source: { label: "Obsidian download", href: "https://obsidian.md/download", checked: "2026-10-27" }
notFlow:
  - "We have not opened an Obsidian vault in Flow yet. We do not know how your plugins' extra syntax, embeds or settings will look there."
  - "Flow does not run Obsidian plugins. Whatever a plugin does for you today, check that Flow does it before you move."
  - "Flow is a Mac app only. There is no Windows, Linux or phone version."
  - "The AI features need Flow Pro once your 10 Pro Days are used. Markdown stays free."
sources:
  - { label: "Obsidian Help: How Obsidian stores data", href: "https://obsidian.md/help/data-storage", checked: "2026-09-28" }
  - { label: "Obsidian pricing", href: "https://obsidian.md/pricing", checked: "2026-10-27" }
  - { label: "Obsidian Help: Link notes", href: "https://obsidian.md/help/link-notes", checked: "2026-09-28" }
  - { label: "Obsidian Help: Backlinks", href: "https://obsidian.md/help/plugins/backlinks", checked: "2026-09-28" }
  - { label: "Obsidian Help: Graph view", href: "https://obsidian.md/help/plugins/graph", checked: "2026-09-28" }
  - { label: "Obsidian Help: Community plugins", href: "https://obsidian.md/help/community-plugins", checked: "2026-10-27" }
  - { label: "Obsidian Help: Plugin security", href: "https://obsidian.md/help/plugin-security", checked: "2026-10-27" }
  - { label: "Obsidian download", href: "https://obsidian.md/download", checked: "2026-10-27" }
---

## What changes

**The job.** Say you send a client a brief every month. It takes the latest figures from their files, says what moved, and shows where each claim came from. Obsidian is a good home for that note. Your notes are [plain Markdown files in a folder on your own computer](https://obsidian.md/help/data-storage), the app is [free](https://obsidian.md/pricing), and it runs on almost every device you own.

**The moment.** Then next month's files arrive, and the brief is due again. The figures need collecting again. You have to find what changed. Every sentence with a number in it needs checking against the new files.

**Your choices.** You can keep doing it by hand in Obsidian. You can add plugins or templates to do part of it. You can paste the files into an AI chat and check what comes back. Or you can move just this one brief into Flow and keep Obsidian for everything else. If what you do today works well enough, keep it.

**What breaks.** The hard part is not writing the brief. It is redoing it. That means finding the files that changed, collecting the figures again, and checking that each claim still matches its source. That is the part Flow takes on.

## What Flow adds

In Flow, a document can carry Jobs. A Job is a short, plain-text instruction at the top of the file, like "collect the figures from these files" or "draft this section from these sources." You press Run and the Jobs redo the routine part. In our walk, the steps that need no AI finished in under half a second. The draft ran on an open model on the Mac through Flow Runtime, for $0.00.

Nothing the AI writes goes straight into your file. It arrives as a proposal. You see the exact lines that would change, with a footnote on each claim, and you keep it or throw it away. Flow also keeps a History of each saved version and who wrote it, whether you, a Job, or another app.

Owning your files is not the difference. Obsidian already gives you that, and Flow agrees. Plugins are not the difference either. Obsidian [starts in Restricted Mode](https://obsidian.md/help/plugin-security), so no plugin code runs until you allow it, and it scans every plugin version. The difference is the redo. A document does its own routine work again, then waits for your yes.

## Moving your work

Because both apps use Markdown files on disk, there should be very little to move. In Flow, click **Add Folder** in the sidebar and choose your vault's folder. Flow opens it where it sits. It does not copy or convert your files.

We have to be plain about this part. We have not walked an Obsidian vault in Flow yet. Obsidian links notes with [double square brackets](https://obsidian.md/help/link-notes), and Flow reads wiki links and backlinks too. But a real vault often holds plugin syntax, embeds and settings that Flow has never seen. We do not know yet how those will look.

There is a safe way to try it. Make a copy of your vault, or pick one small folder, and open that in Flow first. Keep using Obsidian for everything else until you have checked your own notes.

## The path to start with

Start with [the recurring client brief](/flow/paths/recurring-client-brief/). It shows the thing Obsidian users most often build by hand, a document you remake every month. In our walk, Flow read a client's files into Markdown, then drafted 265 words with a footnote on every sentence in 43 seconds, on the laptop, for $0.00. The next month, new files went in and Run was pressed. The figures table redrew in under half a second, and a new cited draft followed in 45 seconds.

That path uses Import and Publish, which are add-ons to Flow Pro. Your 10 Pro Days cover them while you try.
