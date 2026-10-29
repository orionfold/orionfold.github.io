---
title: "A voice your clients can keep: a blueprint for Content Strategy"
domain: Content Strategy
kind: blueprint
role: Content strategists and marketing consultants
hook: "Your brand voice guide, the messaging map behind it, and the briefs and calendar your writers work from."
icon: skill-landscape-map
tint: "#00cb48"
order: 15
dek: "You give every client a voice, a messaging map, a calendar and a stack of briefs. The method is yours. It lives in a Google Doc, a spreadsheet and a custom GPT you trained on the style guide. This blueprint shows what a Flow Domain for that method would hold, how you would build it with Chat and Skills, and how every client would get the living version. Nothing here is built yet. It is yours to take."
description: "A blueprint for a Flow Domain for content strategists. The brand voice guide, content strategy template, briefs and calendar it would hold, and how to build it."
drafted: "2026-10-29"
release: "3.0"
keywords: ["brand voice guide template", "content style guide", "content strategy template", "editorial calendar template", "content brief template", "content audit template", "messaging framework template", "content pillars template", "custom gpt for brand voice alternative", "content marketing playbook"]
blueprint:
  - name: README
    role: "The front page. Who the Domain is for, what a reader will have at the end, and the path through it."
    chips: [["skill-visual-explainer", "Stepped figure"], ["skill-isometric-figure", "Map of the path"]]
  - n: "1"
    name: Brand Voice and Style Guide
    role: "The voice traits, the tone for each situation, the word list, and the do and do not examples a writer follows."
    chips: [["component-table", "Voice and tone table"], ["component-callout", "Do and do not"], ["skill-guided-exercise", "Voice check"]]
  - n: "2"
    name: Audience and Messaging Map
    role: "Who the client sells to, the stages a buyer passes through, and the claim and proof for each stage."
    chips: [["skill-landscape-map", "Audience map"], ["component-table", "Messaging table"]]
  - n: "3"
    name: Pillar Plan and Editorial Calendar
    role: "The content audit, the pillars the client wants to own, and the calendar that turns them into a quarter of work."
    chips: [["skill-register", "Audit register"], ["skill-roadmap", "Quarter plan"], ["component-chart", "Calendar"]]
  - n: "4"
    name: Brief and Review Standard
    role: "The brief a writer gets, the checklist a draft must pass, and the monthly report that says what the work did."
    chips: [["component-form", "Brief form"], ["component-approval-card", "Review checklist"], ["component-sources", "Sources"]]
  - name: Worked Example
    role: "A voice guide, a messaging map, one brief and one monthly report for a made-up client, filled in end to end."
    chips: [["component-callout", "Worked example"]]
faq:
  - q: "How do I turn my brand voice guide into something AI writing tools actually follow?"
    a: "Put the guide in a folder with your messaging map and briefs, and choose that folder before you ask Chat for a draft. Chat searches the folder first and answers from the passages it finds, linking each fact to its file. When the guide does not say, Chat says so instead of guessing."
  - q: "Custom GPTs are retiring. How do I move my brand voice GPT somewhere I control?"
    a: "Save a shared chat from the GPT as a document with New from Web Page. The instructions and sample posts become plain Markdown files in a folder on your Mac. Publish that folder to your own GitHub and nobody can retire it."
  - q: "What should a B2B content brief template include?"
    a: "The goal, the reader, the angle, the outline, the sources to cite, and the word count. In a Domain the brief is a Form. A writer fills it in the Reader or on a published page, and Submit records every entry beside the document."
  - q: "Can my client sign off a draft inside the Domain?"
    a: "Yes. The review checklist is an Approval Card. The client ticks each item, types their name and presses Sign off, and Flow writes one signed record beside the document. If you edit the checklist later the card asks for a new signature and keeps the old record."
  - q: "How do I keep a client's style guide, messaging map and calendar in sync when their product changes?"
    a: "Edit the messaging map and ask Chat to carry the change into the guide and the calendar. Chat reads the other documents and makes the changes in the same reply, and every change waits in Review Changes. When you publish again, each client's copy shows the update as a change they review."
mock:
  folder: voice-method
  client: "Larkspur Fastening Co."
  steps:
    - title: "Start the client folder"
      ask: "Start a folder for Larkspur Fastening and bring in their old brand guide PDF and last quarter's blog posts."
      reply: "Brought in 2 files. The folder lists both with their dates. 3 import items to check."
      doc: "Larkspur brand guide (imported)"
      block: "Folder"
      status: "Imported · 3 to check"
    - title: "Draft the voice guide"
      ask: "Write Larkspur's brand voice and style guide from the Domain's guide and their old PDF."
      reply: "Drafted the voice guide, with the tone-by-situation table. 2 claims to check about their tagline."
      doc: "Larkspur Brand Voice and Style Guide"
      block: "Table"
      status: "2 claims to check"
    - title: "Draw the quarter plan"
      ask: "Draw the Q1 pillar plan and editorial calendar from the audit."
      reply: "Roadmap drawn. 3 pillars, 12 pieces, waiting in Review Changes."
      doc: "Larkspur Pillar Plan and Editorial Calendar"
      block: "Roadmap"
      status: "1 change to review"
    - title: "Draw the calendar"
      ask: "Draw the editorial calendar for the quarter from the pillar plan."
      reply: "Added a gantt chart of what publishes when and where. 12 pieces over 13 weeks. It waits in Review Changes."
      doc: "Larkspur Audience and Messaging Map"
      block: "Chart · Gantt"
      status: "4 edits waiting"
    - title: "Client signs off the brief"
      ask: "Add the review checklist to the first brief so Larkspur's marketing lead can sign it."
      reply: "Approval Card added with 6 checks."
      doc: "Brief 01, torque spec explainer"
      block: "Approval Card · Sign off"
      status: "Awaiting sign off"
    - title: "Publish the update"
      ask: "Publish the Domain update to GitHub."
      reply: "I can't publish from Chat. Check the repository's visibility and the 1 open check mark first, then choose Publish."
      doc: "README"
      block: "Publish · GitHub Repository"
      status: "6 files sent"
minutes: 9
---

You give every client a voice. You write the brand voice and style guide, the audience and messaging map, the content audit and the pillar plan. Then the work turns monthly. A calendar, a brief for each piece, a review pass on every draft, and a report on what the work did. The method is yours and you repeat it for each client. It lives in a Google Doc, a spreadsheet, and a custom GPT you trained on the style guide and ten sample posts.

This page is a blueprint for a Flow Domain that carries that method. It is not built. Only one Domain exists today, [AI Consulting](/domains/ai-consulting/), and its launch story is the walkthrough for every step below. This blueprint is yours to take. Build it from your own know-how, put your name on it, and launch it as your Domain. If you do, I would like to hear about it.

## The opportunity

Marketing budgets are flat. Gartner's 2026 survey puts them at [7.8 percent of company revenue](https://www.gartner.com/en/newsroom/press-releases/2026-05-11-gartner-2026-cmo-spend-survey-finds-cmos-allocate-15-point-3-percent-of-marketing-budgets-to-ai-but-only-30-percent-are-ready-to-scale-ai-capabilities), with 15.3 percent of that budget going to AI. Only 30 percent of those leaders say they are ready to scale it. The money is moving toward tools. The methods that make the tools useful are still in people's heads.

AI is already in every content team. The Content Marketing Institute found [95 percent of B2B marketers](https://contentmarketinginstitute.com/b2b-research/b2b-content-marketing-trends-research) use AI applications, but among those using it for content only 39 percent say content performance improved. HubSpot's 2026 survey puts [86.4 percent of marketing teams](https://blog.hubspot.com/marketing/inbound-marketing-data) on AI, and 62.7 percent say more unique, human-centered content is needed to compete. Ahrefs found [87 percent](https://ahrefs.com/blog/content-marketing-statistics) of marketers use AI for content creation. The tools write. What most teams lack is a voice guide the tools can be held to.

The rules tightened too. Google named [scaled content abuse](https://developers.google.com/search/blog/2024/03/core-update-spam-policies) a spam policy on March 5, 2024, and said automation including generative AI is spam when its main purpose is ranking. The FTC's [rule on fake reviews and testimonials](https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials), announced August 14, 2024, covers AI-generated ones. A review checklist has to catch both. And the custom GPT many strategists trained on a brand voice [retires on December 11, 2026](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq). Enterprise workspaces stopped creating new ones on October 26, 2026. A Domain is plain files in your own GitHub. Nobody can retire it.

## The signals

| Figure | Value | Source |
| --- | --- | --- |
| Marketing budget as a share of company revenue, 2026 | 7.8 percent, up from 7.7; 15.3 percent of budget to AI; 30 percent ready to scale AI | source: [Gartner, 2026 CMO Spend Survey](https://www.gartner.com/en/newsroom/press-releases/2026-05-11-gartner-2026-cmo-spend-survey-finds-cmos-allocate-15-point-3-percent-of-marketing-budgets-to-ai-but-only-30-percent-are-ready-to-scale-ai-capabilities), published 2026-05-11, checked 2026-10-29 |
| B2B marketers whose organizations use AI applications | 95 percent; of those using AI for content, 39 percent say performance improved; 97 percent have a content strategy | source: [Content Marketing Institute, B2B Content and Marketing Trends: Insights for 2026](https://contentmarketinginstitute.com/b2b-research/b2b-content-marketing-trends-research), published 2025-10-08, checked 2026-10-29 |
| Marketing teams using AI | 86.4 percent; 62.7 percent say more human-centered content is needed | source: [HubSpot, 2026 State of Marketing](https://blog.hubspot.com/marketing/inbound-marketing-data), published 2026-04, checked 2026-10-29 |
| Marketers using AI for content creation | 87 percent of 879 surveyed; 80 percent review AI content by hand | source: [Ahrefs, Content Marketing Statistics](https://ahrefs.com/blog/content-marketing-statistics), published 2025-12-22, checked 2026-10-29 |
| US market research analysts and marketing specialists | 952,700 jobs in 2025, growing 7 percent to 2035; about 82,000 openings a year | source: [US Bureau of Labor Statistics, Occupational Outlook Handbook](https://www.bls.gov/ooh/business-and-financial/market-research-analysts.htm), published 2026-08-27, checked 2026-10-29 |
| US writers and authors | 140,300 jobs in 2025, little or no change to 2035; about 11,900 openings a year | source: [US Bureau of Labor Statistics, Occupational Outlook Handbook](https://www.bls.gov/ooh/media-and-communication/writers-and-authors.htm), published 2026-08-27, checked 2026-10-29 |
| Google's scaled content abuse policy | Named March 5, 2024; automation including generative AI is spam when its main purpose is ranking | source: [Google Search Central, March 2024 core update and new spam policies](https://developers.google.com/search/blog/2024/03/core-update-spam-policies), published 2024-03-05, checked 2026-10-29 |
| FTC rule on fake reviews and testimonials | Announced August 14, 2024; covers AI-generated fake reviews; civil penalties for knowing violators | source: [Federal Trade Commission, Final Rule Banning Fake Reviews and Testimonials](https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials), published 2024-08-14, checked 2026-10-29 |

Each figure measures something narrower than it sounds. Surveys count who answered. Vendor research counts a vendor's view. A market estimate is a model. Read them as a direction, not a forecast.

## What your Domain holds

The figure at the top of this page is the folder as it could sit on GitHub. Six Markdown files. Here is what each one does.

**The README** is the front page. It says who the Domain is for, what a reader will have at the end, and the order to read in. A stepped figure shows a messaging map becoming a published piece. An isometric figure maps the path.

**Brand Voice and Style Guide** is the voice written down. Three or four voice traits. A table of tone by situation, so a launch post and an apology read like the same company. The word list and the formatting rules. A callout of do and do not pairs. A Guided Exercise lets a new writer test a paragraph against the guide.

**Audience and Messaging Map** is who the client sells to and what to say to them. A Landscape Map draws the personas and the stages a buyer passes through. A table holds the claim and the proof for each stage, so no writer invents a benefit.

**Pillar Plan and Editorial Calendar** is the quarter of work. The content audit is a Register, one row per published piece with a verdict. The pillars and the pieces under them are a Roadmap. The calendar is a Chart, a gantt of what publishes when and where.

**Brief and Review Standard** is how a piece gets made and approved. The brief is a Form, with the goal, the reader, the angle, the outline, the sources and the word count. The review checklist is an Approval Card, with the voice check, the claim check and the disclosure check on it. What nobody has confirmed is marked until it is. The monthly report has a section here too.

**Worked Example** is a voice guide, a messaging map, one brief and one monthly report for a made-up client, filled in end to end, with the choices explained. A reader learns more from one finished brief than from ten rules.

## What Flow does for this work

**Chat answers from the folder.** The README carries up to six questions, such as "What is our tone for a pricing change?" An empty Chat offers four of them as buttons. Before each reply Chat searches the folder and answers from what it finds, linking each fact to its file. When the guide does not say, Chat says so.

**A Skill draws the quarter plan.** Select the pillar section and run Roadmap. The Skill draws the quarter from what the text says and names what is missing. It waits in Review Changes until you keep it. Run Register on the audit and every published piece becomes a row with its verdict.

**A Form takes the brief.** The brief template is a Form in the Standard. A writer fills in the reader, the angle and the word count, presses Submit, and every entry is recorded beside the document. The same Form works on a published page, so a client's own writer can file a brief there.

**An Approval Card is the review pass.** The checklist your approvers already use becomes a card a reader ticks. The client's marketing lead types their name and presses Sign off, and Flow writes one signed record beside the draft. Add a check for the FTC rule later and the card asks for a new signature. The old record stays.

**A Job keeps the policy section current.** Bring in Google's spam policies page with New from Web Page and choose Follow the source. Each Jobs run reads the page again and brings changes in where you have not edited. The checklist's search policy check then points at a section that is never a year old. A Job can keep the monthly report's chart the same way.

**Bring In All for a style manual.** When a client's style standard is a documentation set online, Flow offers Bring In All and reads the pages into a folder with a README in the author's order. A client's old brand guide PDF comes in as a document with a checklist beside it in Sources. Walk Through with Chat takes the open items one at a time.

**Sources and Change Summary on every deliverable.** A voice guide carries Sources, so a client sees what it was made from and whether a source changed since. Change Summary says what changed, who and which day. Your own Claude Code or Codex can read the Domain and propose a document through Settings ▸ General ▸ Your agents. The proposal arrives in Review Changes under the agent's name.

## How you build it in Flow

The [AI Consulting story](/domains/ai-consulting/) walks every one of these steps on a real screen. Follow it with your own material.

1. **Add an empty folder and choose it.** Chat answers from the folder before any document exists. The walkthrough shows it at [an empty folder, and Chat already in it](/domains/ai-consulting/#an-empty-folder-and-chat-already-in-it).
2. **Ask Chat for the README.** Describe who the Domain is for and what you want a reader to have at the end. Chat writes it in your voice and marks every claim it cannot stand behind. See [a front page, in the author's voice](/domains/ai-consulting/#a-front-page-in-the-authors-voice).
3. **Bring in what you already have.** The style guide from your best engagement with the client's name changed, the brief template, and a shared chat from the brand voice GPT you built. New from Web Page turns a page or a shared AI chat into a document with its links kept. See [an old AI chat became a reference](/domains/ai-consulting/#an-old-ai-chat-became-a-reference).
4. **Let Ideas pick a Skill.** Press Suggest on your Pillar Plan document. Ideas reads the sections and names a Skill for each, a Roadmap for the quarter, a Register for the audit. A figure or a form waits in Review Changes until you keep it.

![Ideas open beside a README in Flow, offering to run Visual Explainer and Guided Exercise on two sections, each with a sentence on why it fits. Shown on AI Consulting, the only Domain built so far](../../assets/flow/domains/ai-consulting/04-ideas-suggest.webp)

5. **Ask Chat for the next document with your own pages as sources.** The Brief and Review Standard can be written from your Voice Guide and your Messaging Map. Repeat until the path is done. See [the next document, from his own pages](/domains/ai-consulting/#the-next-document-from-his-own-pages).
6. **Review every change.** When you merge two tone rows or rename a document, every page that pointed at it follows. See [Review changed the plan, and the source followed](/domains/ai-consulting/#review-changed-the-plan-and-the-source-followed).

## Apply it to a client job

A Domain is for using, not only reading. Say a made-up client, Larkspur Fastening Co., signs for a quarter. Start a folder for Larkspur and bring in their old brand guide PDF and last quarter's posts. Ask Chat to draft their Brand Voice and Style Guide from the Domain's guide and the PDF, and to mark every claim it is unsure about. Fill in the Audience and Messaging Map from the kickoff call. Run the audit as a Register, then ask for the Pillar Plan and Editorial Calendar as a Roadmap. The first brief goes out as a Form. The first draft passes the Approval Card, signed by Larkspur's marketing lead.

At month end the report section tells Larkspur what published and what it did. When the card catches a claim the product cannot back, the lesson goes into the Messaging Map, and the next brief starts from what you learned. A junior strategist can read the Voice Guide and the Standard on their first day and write a brief the way you would.

## Publish it, and keep it current

When the folder is ready, choose Publish and then GitHub Repository. Flow sends the files and nothing else. A reader brings the Domain in with File, then New from GitHub, and the folder's address. Check the repository's visibility first. Your method can be public while every client's voice guide, messaging map and unpublished drafts stay in their own folder on your Mac.

![Publish open on a Domain in Flow, with GitHub Repository chosen and the note that six files were sent. The preview shows the README as the repository will. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/09-published-to-github.webp)

When a rule changes and you publish again, every reader's copy shows the update as a change they review. They keep their own edits. Nothing is replaced behind their back.

![Flow's update sheet for a Domain a reader brought in, listing the one document that changed and offering Not Now or Update Selected. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/12-update-sheet.webp)

The same source can also become a GitHub Pages site, a PDF, an EPUB, or Word and Excel files for a client's team. Chat on the Domain, and the figures a reader steps through, stay in Flow.

## What it costs

Bringing any Domain into Flow is free on Base. Writing with Chat, and Chat on a Domain, need Flow Pro at $10 a month. Publishing to GitHub needs the Publish add-on too, another $10 a month. There is no fee per Domain, so publish one or twenty for the same price. Any AI you connect follows the terms of that service. Publishing does not bring clients on its own. It gives the clients you earn a living copy of your method.

## Start here

Read the [walkthrough](/domains/ai-consulting/) once, end to end. Then add an empty folder in Flow, name it, and describe your method to Chat in three sentences. Who you write for, what a client gets in the first month, and the one rule every draft must pass. The README it writes is the first document of your Domain. If you want to talk it through first, the [Domains page](/domains/) has one email address and four questions.
