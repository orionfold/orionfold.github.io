---
title: "Write a book by chatting with Flow: one idea to a finished ebook in 54 minutes"
path: An idea to an ebook, through Flow Chat
persona: Authors starting from a blank page
drafted: "2026-10-05"
build: "Orionfold Flow 2.2 review build ebook-rewalk-1 (dev, main b9b50009, walked before the 2.2 cut), macOS 26.6, MacBook Pro M3 Max 36 GB, window 1512×949; walked 2026-10-05 12:02–12:56 PDT. An AI agent beside Flow drafted the Chat messages, and we typed them in."
data: "The book's subject, *Agents and Harness*, is our own, written in an empty test folder, never real client work. The account email is painted over in every shot. The cover shows the author's name, with their OK."
dek: "We started with an empty folder, one question, and a Claude subscription we already pay for. Fifty-four minutes later we had a three-chapter ebook of about 7,800 words. It was researched on the web, every claim has a footnote, and it has a picture per chapter and a cover. Every step happened in Flow, and almost every step was one sentence typed into Flow Chat. The walk also found nine things to fix. They are listed at the end, and none of them stopped the book."
hero: ../../assets/flow/paths/write-a-book-in-flow-chat/01-blank-folder-ready.webp
heroAlt: An empty folder selected, and Flow Chat asking what to write in it
source: orionfold-flow articles/15-chat-ebook-rewalk/ARTICLE.md
order: 0
featured: false
draft: false
chip: Chat
summary: One idea in. A researched three-chapter ebook out, with footnotes, pictures and a cover, built one sentence at a time in Flow Chat. You keep or undo every change.
stat:
  value: 54 min
  label: Empty folder to finished EPUB
steps:
  - Tell Chat the idea, get the outline
  - Brief, expand and review each chapter
  - Add pictures and a cover, publish the EPUB
cardShot: 10-the-book-put-together
receipt:
  - label: Empty folder to final EPUB
    value: 54 minutes
    evidence: verified
  - label: Book
    value: 3 chapters, about 7,800 words
    evidence: verified
  - label: Writing and research
    value: Claude subscription you already pay for
    evidence: verified
  - label: Pictures and cover, through OpenRouter
    value: $0.17 for 5 runs
    evidence: verified
titleLocked: true
bodyLocked: true
release: "2.2"
onHome: false
---

## The short version

**Now you can research and write a short book just by talking to it. And you can keep or undo every change.**

Flow Chat sits beside your document in Orionfold Flow 2.2. It makes and edits notes in the folder you are working in. It searches the web. And it starts Flow's own actions on the right chapter, like *Research Brief* and *Expand with Sources*.

Nothing those actions write is kept until you say yes in Review. Every Chat reply has an Undo button.

In our walk, one message turned an idea into the book's home page and outline in under half a minute. Two or three more messages per chapter gave us a research plan, a draft with sources, and a finished chapter. The writing ran on a Claude subscription we already pay for. The pictures and the cover cost $0.17 in all.

> "I told it what the book was about, and it kept asking me what was true."
> *What this path promises, in our words. Not a customer quote.*

## How to do it

In Flow, a book is just a folder of notes. With Flow Chat you build it one sentence at a time.

1. **Open an empty folder** and click it in the sidebar. Chat's header now reads *Chat · your folder*.
2. **Tell Chat your idea.** Ask for a README, a home note for the book, with the title, a subtitle, your idea quoted, and an outline. Ask it not to make or run anything else yet.
3. **For each chapter, say:** "Create chapter N, "title", as its own note from the README's outline, and turn it into a research brief." Open the brief in Review and approve it.
4. **Then say:** "Expand the chapter with its sources." Read the draft in Review. Check its dates and links. Approve it.
5. **Put the book together** with one more message: set the chapter order, turn the README into the introduction, and take the working notes out of each chapter.
6. **Add pictures** with one message that gives each chapter a subject. Then choose File ▸ Publish Folder… ▸ EPUB ▸ Cover ▸ Generate…, and press **Save EPUB…**. EPUB is the ebook file that Apple Books and most ebook readers open.

## The job

An author has a question big enough for a short book, *Agents and Harness*. That is all they have. No notes, no sources, no outline.

The usual way takes a browser full of tabs, a notes app, a word processor, and a tool to make the ebook. The author carries everything from one to the next by hand. This walk asks a simple question: can every step happen in Flow? The research, the writing, the checking, the pictures, and the book.

## Step one: an empty folder, with Chat beside it

The sidebar holds two folders. One is the Flow Guide, which comes with Flow. The other is *Agents and Harness*, and it is empty.

Clicking *Agents and Harness* moves Chat there, even while the Guide's Welcome page is still open. The panel reads *Chat · Agents and Harness* and asks, "What should we write in Agents and Harness?" It says it can make, edit and rename notes in that folder, and that every change can be undone.

Under the message box, Chat names the model it will use: *Claude Code › Claude subscription*. That is a plan the author already pays for.

We changed one setting first, because a book needs longer passes than a short note. Settings ▸ Documents ▸ Expand with Sources ▸ **Words added** sets how much each expansion adds. *Recommended* grows with the passage: "four times a short one, up to 1,200 more words for a long one." The fixed choices are about 300, 600, 900 and 1,200 words. We chose *About 1,200 words*. New Jobs start from this length too.

![Settings ▸ Documents: Words added, set to About 1,200 words](../../assets/flow/paths/write-a-book-in-flow-chat/02-settings-words-added.webp)

## Step two: the idea, in one message

The first message did not ask for a chapter. It told Chat what the book is about and where the idea came from. Then it asked for one note to hold all that: a README with the title, a one-line subtitle, the idea quoted word for word, and a three-chapter outline. It ended, "Don't create the chapters or run anything yet."

No *Leaves this Mac* sheet came up for the Claude Code route. Chat showed *Writing with Claude Code* and a running clock.

![The idea, sent as one message](../../assets/flow/paths/write-a-book-in-flow-chat/03-the-idea-in-one-message.webp)

In about 25 seconds *(assumed: from the two shots' times, not a receipt)*, `README.md` was in the folder and open in its own tab. It held 188 words. The outline turned the idea's three threads into three chapters: *What Agents Actually Did*, *Ten Harnesses Compared*, and *Model or Harness*.

The quote is the idea's first sentence, not the whole message, and Chat said so plainly. It quoted the part "from 'AI agents are getting out of control' to 'the harness that runs it'", and used the rest to write the outline and the line about who the book is for. Nothing else was made or run.

![The book's home note, with the reply that explains it](../../assets/flow/paths/write-a-book-in-flow-chat/04-the-book-home-note.webp)

## Step three: chapter one becomes a research brief

A research brief is the plan a chapter is written from. The second message asked for one: "Create chapter 1, "What Agents Actually Did", as its own note from the README's outline, and turn it into a research brief."

Chat made the note, holding just its title, and started Flow's *Research Brief* on it. A small card above the document named the route, *Claude Code | Claude subscription*, and showed each step as it happened. It searched the web for "Hugging Face OpenAI agent incident 2026". It searched the open folders for "agent incident". Web search worked through Claude Code, not only through an API key.

About a minute and a half later *(assumed: from the message time and the review file's time)*, the brief was waiting in Review. It added 734 words to a 5-word note, marked *Run by Claude Code* and *Proposed*.

The brief holds:

- a working argument
- the idea, under "The person's idea, in their own words"
- five numbered parts of scope
- the sources to prefer
- honesty rules: every claim dated and linked, and say plainly what could not be read
- a Sources table, starting with the two organizations' own public statements

![The brief in Review, every added line highlighted](../../assets/flow/paths/write-a-book-in-flow-chat/05-the-brief-in-review.webp)

Two things slowed us here. Both are filed.

First, the review did not jump to the front when it was ready (#925). Flow keeps Chat in front on purpose, so a reply is not pulled away while you read it. Your cue is the *Document review ready* banner and *1 change to review* in the toolbar.

Second, the chapter link on Chat's *Ready in Review* row opened the still-empty note, not its review (#926). Until that is fixed, use the banner's *Review* button.

## Step four: Expand with Sources, then review

We kept the brief. Its row in Chat changed to *Kept*, with Undo still beside it.

The third message was the shortest: "Expand What Agents Actually Did with its sources." Chat said what would happen. It would write the six sections under *Draft*, using the brief and the two sources in its table, and we would review it before anything was kept. It also told us what to check: a date and a link on every claim, and each incident marked as real use, a test, or training.

The run card lists what the run reads as it goes. It searched the open folders for "agent incident" and "reward hacking". It read *S11-replit*, a saved record of Replit incidents that comes with the Flow Guide's *Competitor Watch* sample. Note that "your folders" means every open folder, not only the book's.

![Expand with Sources at work: the brief kept, the run reading as it goes](../../assets/flow/paths/write-a-book-in-flow-chat/06-expand-reads-as-it-goes.webp)

About two minutes after the message *(assumed: message time to review time)*, the draft was in Review: 2,184 words added or removed on a 729-word note, *Run by Claude Code*. The *Draft* section alone came to about 2,240 words *(verified: counted from the proposal)*. That is nearly twice the *About 1,200 words* we set.

It reads as a dated timeline built from the two public statements, with a footnote on every line. It is also honest about its limits. It says "the 21 July statement itself has not been read for this draft." It says the outside review by METR and Redwood Research "has not been read, and this conclusion should be revisited once it has."

![The expansion in Review: a dated timeline, every line footnoted](../../assets/flow/paths/write-a-book-in-flow-chat/07-the-draft-in-review.webp)

We kept it. Chapter one now stood at 2,923 words. Its last section, *Where "out of control" overreaches*, makes the point the book needs. The record supports "one lab's agents, in an evaluation with key safeguards switched off." It does not show agents in everyday use doing the same.

![Chapter one, kept](../../assets/flow/paths/write-a-book-in-flow-chat/08-chapter-one-kept.webp)

The Replit paragraph is good material, drawn from the saved incident record in the Guide. Its footnote was the one thing to fix before publishing. It linked to the note's file inside the app's own folder, not to the public Replit page the note records. That link would not open in an ebook or on anyone else's Mac (#927). One Chat message fixed it later.

## Step five: chapters two and three

Chapter two asked for a little more up front: "Create chapter 2, "Ten Harnesses Compared", as its own note from the README's outline, and turn it into a research brief. Search the web for each harness's own documentation and put one link per harness in its Sources table."

A harness is the tool that runs an AI agent and sets its limits, like Claude Code, Codex or Gemini CLI. Chat wrote a ten-row Sources table into the note. For each harness it picked the page closest to the controls the idea named: Claude Code's permissions, Codex's approvals and security, Gemini CLI's sandboxing. It also said what it had not done. It "only saw their search summaries, not the full pages." The brief arrived in Review on top of that table and kept all ten rows. This time the quote was an exact piece of the idea's own words.

The brief named its own gap: nothing in Sources yet on audit logs or cost limits. We ran Expand with Sources anyway, and the draft handled the gap the way the brief asked. Its side-by-side table says *Not documented* wherever the docs say nothing, 18 times in the chapter *(verified: counted)*. It also sets apart the two frameworks, LangGraph and CrewAI, where every control is something "the developer builds". We kept it: 3,177 words, cited to the ten documentation pages.

![Ten harnesses, six controls, and "Not documented" where the docs say nothing](../../assets/flow/paths/write-a-book-in-flow-chat/09-ten-harnesses-side-by-side.webp)

Chapter three used the same two messages, with one addition. Its Sources table starts with links to the first two chapters, so it can trace each incident from chapter one to the harnesses in chapter two.

Its brief came back with a sharper argument than either earlier chapter. Better harness defaults "would have stopped or contained most of them, but they would not have removed the model behaviours underneath (reward hacking, persistence, collusion)."

Chat's own reply caught a flaw before we did: "the note's front matter appears twice at the top" (#928). Front matter is the small block of settings at the top of a note. We kept the brief and the draft. The chapter scores each incident as model, harness, both, or *cannot tell*.

## Step six: put the book together, then add pictures

One message turned three notes into a book: "Put the book together: remove the extra copy of the front matter at the top of Model or Harness; give What Agents Actually Did, Ten Harnesses Compared and Model or Harness book order 1, 2 and 3; and rewrite the README as the book's introduction…"

The reply listed four edits, one row each, each with Undo. The README became a 491-word introduction, with a paragraph and a link for each finished chapter. Chat also noticed that chapters one and two had lost their `#` title line and offered to add it back. One more sentence did.

![The book put together: four edits, one reply](../../assets/flow/paths/write-a-book-in-flow-chat/10-the-book-put-together.webp)

The pictures took one message, with a subject for each chapter. That matters: a picture asked for by chapter name alone just draws the name. Three runs, one after another, each placed after its chapter's opening paragraph. They cost $0.10 in all *(verified: the three receipts, $0.0336 each, as OpenRouter reported)*.

![Chapter three's picture: tracing an incident back to the model or the harness](../../assets/flow/paths/write-a-book-in-flow-chat/11-chapter-three-picture.webp)

The cover comes from Flow itself, not from Chat. File ▸ Publish Folder… ▸ EPUB ▸ Cover ▸ **Generate…** opens a *Book Cover* sheet with Title, Subtext, Author and Image. Flow letters the first three onto the cover exactly as you type them. Only the Image description goes to the picture model. One more paid run, $0.0336 *(verified: its receipt)*, and the preview opened on the new cover.

![The cover, in the EPUB preview beside the Publish panel](../../assets/flow/paths/write-a-book-in-flow-chat/12-the-cover.webp)

## Step seven: publish, then take the scaffolding out

**Save EPUB…** wrote the book in a second: cover, title page, introduction, contents page, three chapters, and a closing page. 1.07 MB.

Reading it back showed what a working folder looks like as a book. Every chapter still opened with its research brief. Its *Sources* and *Draft* headings sat in the contents next to the real sections.

One more message fixed that: "Turn the three chapters from working notes into book chapters. In each one, remove the Working argument line and the whole Research brief section, take away the Draft heading so its sections become the chapter's own, and move the Sources table to the end of the chapter. Don't change any of the drafted text or its footnotes."

We also redrew chapter one's picture ($0.0336) and saved the EPUB again. 1.17 MB. Each chapter is now six or seven numbered sections and a Sources table, and every link goes to a public page *(verified: the EPUB read back, 12:57)*.

## The numbers

| | | |
| --- | --- | --- |
| Empty folder to final EPUB | 54 minutes, 12:02–12:56 PDT | verified (journal timestamps) |
| Chat messages | about 13 | assumed (journal rows; one redraw message not recorded word for word) |
| Book | introduction 491 words; chapters 2,452, 2,532 and 2,830 words | verified (the EPUB's text, counted) |
| Sources | 3, 10 and 13 footnoted sources per chapter, each a public page | verified (the EPUB read back) |
| Writing and research runs | Claude Code on a Claude subscription, *Included* | verified (run cards); extra cost assumed $0 |
| Pictures and cover | 5 runs on OpenRouter, $0.168 | verified (five receipts, as OpenRouter reported) |
| Time to a brief or a draft | about 25 s (README) to 2 min (a chapter draft) | assumed (shot and file times, not receipts) |
| Steps that needed anything outside Flow | 0 | verified (journal); an AI agent watching drafted the messages, and we typed them into Chat |

## What the walk found

We fixed nothing during the walk. We just wrote things down. Nine issues are filed for the release after 2.2. Each one is a caveat here, not a reason to hold the page.

- **#925, #926** A review that Chat started does not come to the front when it is ready, and Chat's link to it is not always right: one row opened the empty note, another opened Review. Use the banner's *Review* button.
- **#927** A draft cited a Guide note by its file location instead of the public page the note records. One Chat message replaced it.
- **#928** A research brief doubled a chapter's front matter. Chat noticed and removed it when asked.
- **#929** Reopening Chat in a long conversation shows its first message, not the newest reply.
- **#930, #931** In the EPUB, each footnote breaks onto three lines. And a chapter's *Sources for this section* can look empty in a reader that hides footnotes until you tap them.
- **#932** The name on the cover does not reach the book's author field or title page.
- **#923** Chat can suggest an action on a note that has already left the folder.

## What is not done yet

- **The PDF.** We saved the EPUB only. The PDF comes from the same Publish panel, *PDF*, and the same book.
- **The sources it could not read.** Every chapter says what it could not read: OpenAI's technical report and its 21 July statement, and the METR and Redwood Research review. A second Expand pass, once those pages can be fetched, should bring them in.
- **Audit logs and cost limits.** Chapter two marks them *Not documented* for most harnesses. A web search for those pages, then a second pass, would close the gap.
