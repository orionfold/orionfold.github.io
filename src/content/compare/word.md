---
tool: Word
kind: pair
order: 7
title: "Flow with Word: check the work in Flow, share it in Word"
dek: "A weekly status built from a vendor's Word file, a PDF and your notes? Read them on your Mac, draft the status with AI that waits for your yes, then hand the team a Word file. Copilot in Word is strong too; this page says where each one fits."
line: "Draft and check the status in Flow. Share it as a Word file."
updated: 2026-10-27
startWith: status-from-what-you-have
rows:
  - topic: "What it is for"
    them: "Word is a word processor. Copilot in Word can draft new text, rewrite and refine it, and summarize or answer questions about a long document."
    flow: "Flow is a Mac app for documents kept as Markdown files. It brings Word files in, drafts from your own files, and publishes back to Word."
    path: status-from-what-you-have
    source: { label: "Microsoft Support: Welcome to Copilot in Word", href: "https://support.microsoft.com/en-us/word/welcome-to-copilot-in-word", checked: "2026-10-27" }
  - topic: "Writing from your own files"
    them: "Copilot can draft from a file you pick: type / and choose the file. When you ask, it adds citations to the files it used."
    flow: "In our status walk, Flow read a vendor's Word update and a sprint review PDF on the Mac, and checked 16 figures against the PDF's own page."
    path: status-from-what-you-have
    source: { label: "Microsoft Support: Draft and add content with Copilot in Word", href: "https://support.microsoft.com/en-us/word/copilot/draft-and-add-content-with-copilot-in-word", checked: "2026-10-27" }
  - topic: "Checking what the AI wrote"
    them: "You read Copilot's draft, then keep it, discard it, try again or refine it. For an edit, you choose Replace, Insert below or Regenerate."
    flow: "The AI's text arrives as a proposal, shown line by line. Nothing enters the document until you tick I accept changes. History keeps each saved version and the run that made it."
    path: status-from-what-you-have
    source: { label: "Microsoft Support: Edit with Copilot in Word", href: "https://support.microsoft.com/en-US/Word/edit-with-copilot-in-word", checked: "2026-10-27" }
  - topic: "Where the AI runs"
    them: "On Microsoft 365 business plans, Microsoft says prompts and responses are not used to train the models, and they stay inside the Microsoft 365 service."
    flow: "In our walk, Ask and Summarize ran on an open model on the laptop, about 6 seconds each, for $0.00. The attachments were read with On this Mac, so nothing left the Mac."
    path: status-from-what-you-have
    source: { label: "Microsoft 365 Copilot Business pricing and FAQ", href: "https://www.microsoft.com/en-us/copilot/pricing/business", checked: "2026-10-27" }
  - topic: "What it costs"
    them: "Microsoft 365 Personal is $9.99 a month or $99.99 a year, with AI credits and limits on Copilot use. Microsoft 365 Premium is $19.99 a month or $199.99 a year, with more Copilot use."
    flow: "Flow Pro adds the AI for $10 a month or $96 a year. A run on your Mac adds no model cost. Import and Publish are add-ons to Pro, at $10 a month or $96 a year each."
    path: status-from-what-you-have
    source: { label: "Microsoft 365 plans with Copilot for individuals", href: "https://www.microsoft.com/en-us/microsoft-365-copilot/pricing/individuals", checked: "2026-10-27" }
  - topic: "Working with others"
    them: "Many people can edit the same Word document at once when it is saved in OneDrive or SharePoint. Track Changes shows each edit for review."
    flow: "Flow is built for one person reviewing AI work. When the status is approved, Publish writes a Word file the team can open and edit in Word."
    path: status-from-what-you-have
    source: { label: "Microsoft Support: Document collaboration and co-authoring", href: "https://support.microsoft.com/en-us/office/document-collaboration-and-co-authoring-ee1509b4-1f6e-401e-b04a-782d26f564a4", checked: "2026-10-27" }
  - topic: "Where you can use it"
    them: "Copilot works in Word on Windows, Mac, the web and iPad, and on iPhone and Android phones."
    flow: "Flow is a Mac app only. There is no Windows, phone or web version."
    source: { label: "Microsoft Support: Copilot in Word on mobile devices", href: "https://support.microsoft.com/en-us/office/copilot-in-word-on-mobile-devices-6b578cc5-5c45-47a9-9cf6-06c4b51cbc87", checked: "2026-10-27" }
notFlow:
  - "Flow is not a word processor and does not replace Word. It has no Track Changes, page layout tools or live co-editing."
  - "A Word file comes into Flow as plain Markdown text. We have imported simple files with headings, paragraphs and lists. We have not tested comments, tracked changes or complex layouts."
  - "Flow is built for one person reviewing AI work. If your team edits one document together, Word does that and Flow does not."
  - "Flow is a Mac app only. Its AI features need Flow Pro once your 10 Pro Days are used, and Import and Publish are add-ons to Pro."
sources:
  - { label: "Microsoft Support: Welcome to Copilot in Word", href: "https://support.microsoft.com/en-us/word/welcome-to-copilot-in-word", checked: "2026-10-27" }
  - { label: "Microsoft Support: Draft and add content with Copilot in Word", href: "https://support.microsoft.com/en-us/word/copilot/draft-and-add-content-with-copilot-in-word", checked: "2026-10-27" }
  - { label: "Microsoft Support: Edit with Copilot in Word", href: "https://support.microsoft.com/en-US/Word/edit-with-copilot-in-word", checked: "2026-10-27" }
  - { label: "Microsoft Support: Copilot in Word on mobile devices", href: "https://support.microsoft.com/en-us/office/copilot-in-word-on-mobile-devices-6b578cc5-5c45-47a9-9cf6-06c4b51cbc87", checked: "2026-10-27" }
  - { label: "Microsoft 365 plans with Copilot for individuals", href: "https://www.microsoft.com/en-us/microsoft-365-copilot/pricing/individuals", checked: "2026-10-27" }
  - { label: "Microsoft 365 Copilot Business pricing and FAQ", href: "https://www.microsoft.com/en-us/copilot/pricing/business", checked: "2026-10-27" }
  - { label: "Microsoft Support: Document collaboration and co-authoring", href: "https://support.microsoft.com/en-us/office/document-collaboration-and-co-authoring-ee1509b4-1f6e-401e-b04a-782d26f564a4", checked: "2026-10-27" }
---

## Why pair them

**The job.** Say you send the team a status every week. It comes from a vendor's update in Word, a sprint review PDF and your own stand-up notes. Word is where the team reads it. Many people can [edit one document at once](https://support.microsoft.com/en-us/office/document-collaboration-and-co-authoring-ee1509b4-1f6e-401e-b04a-782d26f564a4), and [Copilot in Word](https://support.microsoft.com/en-us/word/welcome-to-copilot-in-word) can draft, rewrite and summarize.

**The moment.** Then the week ends, and the status is due again. The files hold vendor terms, numbers that are not public yet, and who is blocked. You have to read them all, pull out what changed, and get it right.

**Your choices.** You can write it by hand in Word. You can ask Copilot to [draft from the files you pick](https://support.microsoft.com/en-us/word/copilot/draft-and-add-content-with-copilot-in-word), with citations when you ask for them. Or you can read the files and draft the status in Flow, then hand the team a Word file. If Copilot already does this well for you, keep it.

**What breaks.** Confidential files and a hosted AI do not always mix. Some teams cannot send vendor terms or early numbers to a cloud model at all. And the draft still has to be checked against the files before it goes out.

Flow is for that part. It reads the files on your Mac, drafts with a model that can run on the Mac itself, and waits for your yes. Word is still where the team reads and edits the result.

## How they work together

This is the walk we ran, on a laptop.

1. **Bring the files in.** File ▸ Import read the vendor's Word update in seconds and the sprint review PDF in under four, both with *On this Mac*. Flow checked 16 figures against the PDF's own page.
2. **Ask and summarize on the Mac.** Ask answered "what changed this week" in about 5 seconds. Summarize turned 259 words of notes into a six-point status in about 6 seconds. Both ran on an open model through Flow Runtime, for $0.00.
3. **Approve it.** The status arrived as a proposal. Nothing entered the document until we ticked *I accept changes* and pressed *Approve & Save*.
4. **Hand the team a Word file.** Publish wrote a 6.6 KB Word file with a real bulleted list. From there, the team works in Word as usual.

## The path to start with

Start with [this week's status from the files you already have](/flow/paths/status-from-what-you-have/). It is the walk above, with every screen. For a longer Word job, [manuscript to book](/flow/paths/manuscript-to-book/) brings Word chapters in, proofreads them on the Mac, and binds them into an EPUB.

That path uses Import and Publish, which are add-ons to Flow Pro. Your 10 Pro Days cover them while you try.
