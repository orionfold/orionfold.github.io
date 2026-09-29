---
tool: Notion
kind: switch
order: 1
title: "Flow for Notion users: your pages as files on your own Mac"
dek: "Notion keeps your work in its cloud and bills AI by the seat or by credits. Flow keeps each document as a plain Markdown file on your Mac and can run AI on the Mac itself."
line: "Keep your pages as files you own, with AI that can run on your Mac."
updated: 2026-09-28
startWith: investor-update
rows:
  - topic: "Where your work lives"
    them: "Notion stores everything in the cloud. Notion is hosted by AWS, and it keeps backups of your pages on its servers."
    flow: "Each document is a plain Markdown file in a folder on your Mac. Other apps can open the same files. The documents themselves are free to open, edit and save, on any plan."
    path: recurring-client-brief
    source: { label: "Notion Help: Security practices at Notion", href: "https://www.notion.com/help/security-and-privacy", checked: "2026-09-28" }
  - topic: "Where the AI runs"
    them: "Notion AI uses outside AI model providers. Notion says those providers keep no data for Enterprise plan workspaces."
    flow: "Flow Runtime runs open models on the Mac itself. In our investor update walk, the founder's metrics never left the laptop, and the model cost was $0.00. You can also use a hosted model with your own key. Flow names the model and the estimated price first."
    path: investor-update
    source: { label: "Notion pricing", href: "https://www.notion.com/pricing", checked: "2026-09-28" }
  - topic: "What AI costs"
    them: "Full Notion Agent comes with the Business plan, $20 per member a month when paid yearly. Free and Plus get a trial of AI. Custom Agents are free to try, then $10 per 1,000 monthly Notion credits."
    flow: "Flow Pro adds the AI for $10 a month or $96 a year. A run on your Mac adds no model cost. Import and Publish are add-ons to Pro, at $10 a month or $96 a year each."
    path: investor-update
    source: { label: "Notion pricing", href: "https://www.notion.com/pricing", checked: "2026-09-28" }
  - topic: "Working with others"
    them: "Many people can edit the same Notion page at once, and edits and comments show up for everyone right away."
    flow: "Flow is built for one person reviewing AI work. A draft arrives as a proposal with a footnote on each claim. Nothing enters the document until you tick I accept changes."
    path: recurring-client-brief
    source: { label: "Notion Help: Collaborate with people", href: "https://www.notion.com/help/collaborate-with-people", checked: "2026-09-28" }
  - topic: "Taking your work with you"
    them: "A workspace owner can export all pages as Markdown, with databases as CSV files. Notion emails a download link that expires after 7 days. A big export can take up to 30 hours."
    flow: "There is nothing to export. The files are already on your disk. Add Folder opens a folder where it sits, and changes are ordinary file edits."
    path: docs-true-to-code
    source: { label: "Notion Help: Export your content", href: "https://www.notion.com/help/export-your-content", checked: "2026-09-28" }
  - topic: "Where you can use it"
    them: "Notion has desktop apps for Mac and Windows, and it is also on mobile."
    flow: "Flow is a Mac app only. There is no Windows, phone or web version."
    source: { label: "Notion desktop apps", href: "https://www.notion.com/desktop", checked: "2026-09-28" }
notFlow:
  - "Flow has no Notion importer. You export from Notion yourself and open the folder in Flow."
  - "Flow is not a shared team workspace. It does not offer many people editing one page at the same time, the way Notion does."
  - "Flow is a Mac app only. If you need your pages on a phone, on Windows, or in a browser, Notion does that and Flow does not."
  - "Flow does not rebuild Notion databases. Notion exports a database as a CSV file, and we have not tested how those files look in Flow."
  - "The AI features need Flow Pro once your 10 Pro Days are used. Plain Markdown documents stay free."
sources:
  - { label: "Notion Help: Security practices at Notion", href: "https://www.notion.com/help/security-and-privacy", checked: "2026-09-28" }
  - { label: "Notion Help: Back up your Notion data", href: "https://www.notion.com/help/back-up-your-data", checked: "2026-09-28" }
  - { label: "Notion pricing", href: "https://www.notion.com/pricing", checked: "2026-09-28" }
  - { label: "Notion Help: Collaborate with people", href: "https://www.notion.com/help/collaborate-with-people", checked: "2026-09-28" }
  - { label: "Notion Help: Export your content", href: "https://www.notion.com/help/export-your-content", checked: "2026-09-28" }
  - { label: "Notion desktop apps", href: "https://www.notion.com/desktop", checked: "2026-09-28" }
---

## What changes

Notion is good at shared work. Many people can [edit the same page at once](https://www.notion.com/help/collaborate-with-people), and it runs on your desktop and your phone. If your team lives in one workspace together, that is a real strength.

Flow is built for a different job. It is for one person who makes documents with AI and wants to trust them.

The first change is where your work lives. In Notion, [everything is stored in the cloud](https://www.notion.com/help/back-up-your-data). In Flow, each document is a plain Markdown file in a folder on your Mac. Markdown is simple text with a few marks for headings and lists. Any text app can open it. If you stop paying for Flow, the files are still yours, and they still open.

The second change is how AI is paid for. On [Notion's pricing page](https://www.notion.com/pricing), the full Notion Agent comes with the Business plan, and Custom Agents run on credits after a free try. Flow Pro is $10 a month or $96 a year. When the AI runs on your Mac through Flow Runtime, a run costs nothing extra. You can still use a hosted model with your own key. Flow tells you the model and the estimated price before it runs.

The third change is proof. When Flow drafts, the draft comes with a footnote on each claim, and it waits for you. You read the exact words and accept them or throw them away. Flow keeps a record of every run: which model, how many tokens, and what it cost.

## Moving your work

Flow has no Notion importer. The way over is to export and then open the folder.

1. In Notion, a workspace owner can go to Settings, then Workspace, then General, and choose **Export all workspace content**. Pick Markdown & CSV. Notion [exports pages as Markdown and databases as CSV files](https://www.notion.com/help/export-your-content). It emails you a download link that lasts 7 days, and a big export can take up to 30 hours.
2. Unzip the download into a folder on your Mac.
3. In Flow, click **Add Folder** in the sidebar and choose that folder. Flow opens it where it sits. Nothing is copied into a private format.

We have not yet walked a Notion export into Flow ourselves. We do not know yet how its links, pictures and database files will look once they are open. Treat this as a path to try, not one we have proven. Keep your Notion export as a backup until you have checked your own pages.

## The path to start with

Start with [the investor update and the watch](/flow/paths/investor-update/). It is the path that shows the most of what Flow adds. Flow read a metrics workbook and a slide deck into Markdown. A saved Job checked seven sources and found the one that had changed. Then Flow drafted the market section with 11 of 13 sources cited, on the laptop, for $0.00. Nothing entered the update until it was approved.

A note: Import and Publish, which that path uses, are add-ons to Flow Pro. Your 10 Pro Days cover them while you try.
