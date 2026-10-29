---
title: "Decisions your clients can read: a blueprint for Software Architecture"
domain: Software Architecture
kind: blueprint
role: "Fractional CTOs and architecture consultants"
hook: "Your review checklist, the decision records behind each diagram, and the debt register clients ask for."
icon: skill-architecture-diagram
tint: "#6959f0"
order: 13
dek: "You review systems for startups that cannot yet afford a full-time CTO. You draw the diagrams, write the decision records and keep the debt register. The method lives in a checklist, a slide deck and a custom GPT that retires in December. This blueprint shows what a Flow Domain for that method would hold, how you would build it with Chat and Skills, and how every client would get the living version. Nothing here is built yet. It is yours to take."
description: "A blueprint for a Flow Domain for software architecture consultants and fractional CTOs. Your review checklist, ADRs and debt register as living files."
drafted: "2026-10-29"
release: "3.0"
keywords: ["architecture decision record template", "software architecture review checklist", "fractional cto playbook", "technical due diligence checklist", "c4 diagram template", "custom gpt for software architects", "technical debt register template", "cloud cost model template", "team topology template", "architecture knowledge base for clients"]
blueprint:
  - name: README
    role: "The front page. Who the Domain is for, what a reader will have at the end, and the path through it."
    chips: [["skill-visual-explainer", "Stepped figure"], ["skill-isometric-figure", "Map of the path"]]
  - n: "1"
    name: Architecture Review Method
    role: "The steps of your review, the context and container diagrams you draw first, and the checklist that must pass before findings go out."
    chips: [["skill-workflow-path", "Review path"], ["component-diagram", "C4 context"], ["component-approval-card", "Review checklist"]]
  - n: "2"
    name: Decision Record Standard
    role: "How an architecture decision record is written, what it cites, how it is numbered, and when a decision is superseded instead of changed."
    chips: [["skill-decision-brief", "Decision brief"], ["component-sources", "Sources"], ["component-callout", "Marked to check"]]
  - n: "3"
    name: Debt and Cost Register
    role: "The technical debt register and the cloud cost model side by side, each item with an owner, a size and a date last checked."
    chips: [["skill-register", "Register"], ["skill-scenario-model", "Cost scenarios"], ["component-chart", "Spend chart"]]
  - n: "4"
    name: Team and Diligence Guide
    role: "How you shape a team topology note and a technical due diligence report, and the intake questions a founder or investor answers first."
    chips: [["skill-delegation-map", "Team map"], ["skill-scorecard", "Diligence scorecard"], ["component-form", "Intake form"]]
  - name: Worked Example
    role: "A review report, two decision records and a debt register for a made-up client, filled in end to end, with the choices explained."
    chips: [["component-callout", "Worked example"]]
faq:
  - q: "How do I turn my architecture review checklist into something a client's team can run without me?"
    a: "Write the checklist as an Approval Card inside your Review Method document. A reader ticks each item, types their name and presses Sign off. Flow keeps one signed record beside the document. When you change the checklist later, the card asks for a new signature and keeps the old one."
  - q: "What should go in an ADR template so a new engineer reads the reasons, not just the decision?"
    a: "Keep the shape most teams know. Title, status, context, decision, consequences. In a Domain, the Decision Record Standard holds that shape and the Decision Brief Skill draws a record from a passage of notes. Every claim the record cannot stand behind is marked to check, and Sources lists where each fact came from."
  - q: "My custom GPT held my technical due diligence method. What do I replace it with before December?"
    a: "A Domain is a folder of plain Markdown files on your Mac, published to a GitHub repository you own. Chat answers from the folder and links each answer to its file. A shared ChatGPT chat can be brought in as a document with its links kept, so the instructions and examples you wrote for the GPT are not lost."
  - q: "How do I keep a client's technical debt register current after the engagement ends?"
    a: "Give the register a Job. Each run reads its sources, such as the team's own notes or an exported issue list brought in as a table, and redrafts the rows from what they say now. The client reviews each change before it lands. A document can cap what its Jobs spend in a month."
  - q: "Can I publish my fractional CTO playbook as a repo my clients bring in and still keep each client's code private?"
    a: "Yes. Publish sends only the Domain's own documents and pictures to the repository you name. A client brings the Domain in with New from GitHub and works in their own folder on their Mac. Their diagrams, bills and code never leave that folder, and Flow itself sends nothing anywhere."
mock:
  folder: review-method
  client: "Lantern Bicycle Co."
  steps:
    - title: "Start the client folder"
      ask: "Start a folder for Lantern Bicycle and bring in their container diagram and last month's cloud bill as a table."
      reply: "Folder ready. The container diagram came in as an Image with a description to write, and the cloud bill as a table. 3 import items to check."
      doc: "Lantern Bicycle, Review Notes"
      block: "Image"
      status: "Imported · 3 to check"
    - title: "Ask for the review report"
      ask: "Draft the architecture review report for Lantern Bicycle from the Review Method and these notes."
      reply: "Drafted from the Method, with a C4 context diagram of the system. 4 claims to check."
      doc: "Lantern Bicycle, Architecture Review Report"
      block: "Diagram · C4 context"
      status: "4 claims to check"
    - title: "Draw the review path"
      ask: "Run Workflow Path on the Review Method so their lead engineer sees intake to findings in one figure."
      reply: "Workflow Path drawn in five steps, waiting in Review Changes."
      doc: "Architecture Review Method"
      block: "Workflow Path"
      status: "1 change to review"
    - title: "Record the decision"
      ask: "Write ADR 007 from the Decision Record Standard for moving the job queue off the main database."
      reply: "ADR 007 drafted with context, decision and two trade-offs."
      doc: "ADR 007, Queue off the main database"
      block: "Decision Brief"
      status: "Kept"
    - title: "Sign off the checklist"
      ask: "Add the review checklist as an Approval Card so the lead engineer can sign before findings go out."
      reply: "Approval Card added. Sign off writes one record beside the report."
      doc: "Lantern Bicycle, Architecture Review Report"
      block: "Approval Card · Sign off"
      status: "Awaiting signature"
    - title: "Publish the update"
      ask: "Publish the Domain so Lantern's team gets the new rows in the Debt and Cost Register guide."
      reply: "I can't publish from Chat. Check visibility, dates and 1 open check first, then choose Publish."
      doc: "README"
      block: "Publish · GitHub Repository"
      status: "6 files sent"
minutes: 9
---

You carry the shape of a dozen systems in your head. Monday is an architecture review for a seed-stage startup. Thursday is a technical due diligence report an investor wants by Friday. In between you draw context and container diagrams, write decision records, and update a technical debt register nobody else opens. The method lives in a checklist in Notion, a slide deck from your last firm, and a custom GPT you trained on your own ADRs. Each new client gets a copy, and each copy drifts.

This page is a blueprint for a Flow Domain that carries that method. It is not built. Only one Domain exists today, [AI Consulting](/domains/ai-consulting/), and its launch story is the walkthrough for every step below. This blueprint is yours to take. Build it from your own know-how, put your name on it, and launch it as your Domain. If you do, I would like to hear about it.

## The opportunity

The money is moving fast and someone has to decide what it buys. Worldwide IT spending is expected to reach [$6.37 trillion in 2026](https://www.gartner.com/en/newsroom/press-releases/2026-07-27-gartner-forecasts-worldwide-it-spending-to-grow-14-point-2-percent-in-2026-totaling-6-point-37-trillion), up 14.2 percent, with software alone at $1,468 billion. The Bureau of Labor Statistics counts [1.9 million software developers, QA analysts and testers](https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm) in the US, with about 106,100 openings a year. The people who lead them are fewer and cost more. [Computer and information systems managers](https://www.bls.gov/ooh/management/computer-and-information-systems-managers.htm) earn a median of $175,140, and the role is growing 16 percent over ten years. A startup that cannot pay that salary hires you by the day. That is the fractional market.

AI changed what a day of engineering produces. Stack Overflow found [84 percent of developers](https://survey.stackoverflow.co/2025/ai) use or plan to use AI tools, yet 46 percent distrust the accuracy of what those tools write. DORA put use at [90 percent](https://blog.google/technology/developers/dora-report-2025/) and found only 24 percent trust the output a lot. DORA calls AI a mirror and a multiplier. More code arrives sooner, so the decisions about shape and cost matter more. Flexera estimates [29 percent of cloud spend](https://www.flexera.com/blog/finops/cloud-cost-management-trends/) is wasted, and 85 percent of respondents call cost their top challenge. CNCF found [82 percent of container users](https://www.cncf.io/announcements/2026/01/20/kubernetes-established-as-the-de-facto-operating-system-for-ai-as-production-use-hits-82-in-2025-cncf-annual-cloud-native-survey/) run Kubernetes in production, and the top challenge is culture, not tooling. Your review names both in writing.

Rules are arriving with dates on them. The EU Cyber Resilience Act applies in full from [11 December 2027](https://eur-lex.europa.eu/eli/reg/2024/2847/oj/eng), and its reporting duties for exploited vulnerabilities start on 11 September 2026. Every product with digital elements sold into the EU will need a written handle on its parts and its fixes. A client will ask where that is written down. And the custom GPT you trained on your ADRs and your diligence checklist [retires on December 11, 2026](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq). A Domain is plain files in your own GitHub. Nobody can retire it.

## The signals

| Figure | Value | Source |
| --- | --- | --- |
| Worldwide IT spending, 2026 | $6.37 trillion, up 14.2 percent; software $1,468 billion, up 15.5 percent | source: [Gartner, Gartner Forecasts Worldwide IT Spending to Grow 14.2% in 2026](https://www.gartner.com/en/newsroom/press-releases/2026-07-27-gartner-forecasts-worldwide-it-spending-to-grow-14-point-2-percent-in-2026-totaling-6-point-37-trillion), published 2026-07-27, checked 2026-10-29 |
| US software developers, QA analysts and testers | 1,905,400 jobs in 2025, growing 10 percent to 2035; about 106,100 openings a year | source: [US Bureau of Labor Statistics, Occupational Outlook Handbook, Software Developers](https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm), published 2026-08-27, checked 2026-10-29 |
| US computer and information systems managers | 685,800 jobs in 2025, growing 16 percent to 2035; about 53,500 openings a year; median pay $175,140 | source: [US Bureau of Labor Statistics, Occupational Outlook Handbook, Computer and Information Systems Managers](https://www.bls.gov/ooh/management/computer-and-information-systems-managers.htm), published 2026-08-27, checked 2026-10-29 |
| Developers using or planning to use AI tools | 84 percent in 2025, up from 76 percent; 46 percent distrust accuracy, 33 percent trust it, 3 percent highly | source: [Stack Overflow, 2025 Developer Survey, AI](https://survey.stackoverflow.co/2025/ai), published 2025-07, checked 2026-10-29 |
| Software professionals using AI at work | 90 percent, up 14 percent on the prior year, from nearly 5,000 respondents; 24 percent trust it a lot or a great deal | source: [Google, Inside our 2025 DORA report](https://blog.google/technology/developers/dora-report-2025/), published 2025-09-23, checked 2026-10-29 |
| Estimated cloud waste | 29 percent of IaaS and PaaS spend; cost is the top challenge for 85 percent; 58 percent run generative AI as a public cloud service | source: [Flexera, Cloud cost management trends from the 2026 State of the Cloud](https://www.flexera.com/blog/finops/cloud-cost-management-trends/), published 2026-09-02, checked 2026-10-29 |
| Kubernetes in production among container users | 82 percent in 2025, up from 66 percent in 2023; culture change is the top challenge for 47 percent | source: [CNCF, 2025 Annual Cloud Native Survey announcement](https://www.cncf.io/announcements/2026/01/20/kubernetes-established-as-the-de-facto-operating-system-for-ai-as-production-use-hits-82-in-2025-cncf-annual-cloud-native-survey/), published 2026-01-20, checked 2026-10-29 |
| EU Cyber Resilience Act, Regulation (EU) 2024/2847 | Reporting duties apply from 11 September 2026; the Regulation applies in full from 11 December 2027 | source: [EUR-Lex, Regulation (EU) 2024/2847, Article 71](https://eur-lex.europa.eu/eli/reg/2024/2847/oj/eng), published 2024-11-20, checked 2026-10-29 |

Each figure measures something narrower than it sounds. Surveys count who answered. Vendor research counts a vendor's view. A market estimate is a model. Read them as a direction, not a forecast.

## What your Domain holds

The figure at the top of this page is the folder as it could sit on GitHub. Six Markdown files. Here is what each one does.

**The README** is the front page. It says who the Domain is for, what a reader will have at the end, and the order to read the documents in. A stepped figure shows a system becoming a review, then a plan. An isometric figure maps the path.

**Architecture Review Method** is the backbone. The steps of your review, the diagrams you draw before you judge anything, and the checklist that must pass before findings go out. A Workflow Path draws the review from intake to report. A Diagram holds the C4 context view as text. The checklist is an Approval Card, so the record of who signed stays with the report.

**Decision Record Standard** is the craft. How an architecture decision record is written, what it cites, how it is numbered, and when a decision is superseded instead of edited. A Decision Brief draws a record from a page of notes. Every fact links to its source. What you have not confirmed is marked, and Flow counts the marks.

**Debt and Cost Register** keeps the technical debt and the cloud spend side by side, because one usually explains the other. A Register draws it, each row with an owner, a size and a date last checked. A Scenario Model shows three ways the bill could go. A chart shows spend by service.

**Team and Diligence Guide** is how you write the two notes clients ask for most. The team topology note says which teams exist, which should, and who to hire next. The due diligence report is what an investor reads before a deal. A Delegation Map draws the teams. A Scorecard rates the system against your headings. An intake form asks the first questions before the clock starts.

**Worked Example** is a review report, two decision records and a debt register for a made-up client, filled in end to end, with the choices explained. A reader learns more from one finished review than from ten rules.

## What Flow does for this work

**Chat answers from the folder, with the README's questions.** The README carries up to six questions, such as "What does a review cover?" An empty Chat offers four of them as buttons. A client's lead engineer presses one and gets an answer linked to the page it came from. When the folder does not say, Chat says so.

**A Skill named for the review itself.** Run Workflow Path on the Review Method and the figure shows intake, diagrams, checklist, findings and plan in five steps. Run Register on the Debt and Cost Register and the rows come with owners and dates. Every drawing waits in Review Changes until you keep it.

**The review checklist is signed in the document.** The Approval Card holds your checklist. The lead engineer ticks each item, types a name and presses **Sign off**. Flow writes one signed record beside the report. Tighten the checklist next quarter and the card asks for a new signature. The old record stays, and Publish prints the card with its ticks.

**A Job keeps the cost model current.** The Register's spend chart can be a Job. Each run asks only for its rows, from the bill the client brings in as a table or a price page brought in with New from Web Page and *Follow the source*. On a night when nothing changed, it skips without calling a model.

**Sources and Change Summary on the due diligence report.** An investor wants to know what a finding rests on and what changed since the last draft. Sources lists what the report was made from and marks a source that changed since. Change Summary says what moved, who moved it and on which day. A published page carries both as plain rows.

**A door for your own agents.** With Flow Pro, Settings ▸ General ▸ Your agents opens the folder to the Claude Code or Codex you already run against a client's repository. It can read the Standard, search the Method and propose an ADR. The proposal lands in Review Changes under the agent's name. Flow itself sends nothing anywhere.

## How you build it in Flow

The [AI Consulting story](/domains/ai-consulting/) walks every one of these steps on a real screen. Follow it with your own material.

1. **Add an empty folder and choose it.** Chat answers from the folder before any document exists. The walkthrough shows it at [an empty folder, and Chat already in it](/domains/ai-consulting/#an-empty-folder-and-chat-already-in-it).
2. **Ask Chat for the README.** Describe who the Domain is for and what you want a reader to have at the end. Chat writes it in your voice and marks every claim it cannot stand behind. See [a front page, in the author's voice](/domains/ai-consulting/#a-front-page-in-the-authors-voice).
3. **Bring in what you already have.** The review checklist from Notion, three past ADRs with the client's name changed, the C4 review page you point people to. New from Web Page turns a page or a shared AI chat into a document with its links kept. See [an old AI chat became a reference](/domains/ai-consulting/#an-old-ai-chat-became-a-reference).
4. **Let Ideas pick a Skill.** Press Suggest on your Review Method. Ideas reads the sections and names a Skill for each, a Workflow Path for the review, a Register for the debt. A figure or a form waits in Review Changes until you keep it.

![Ideas open beside a README in Flow, offering to run Visual Explainer and Guided Exercise on two sections, each with a sentence on why it fits. Shown on AI Consulting, the only Domain built so far](../../assets/flow/domains/ai-consulting/04-ideas-suggest.webp)

5. **Ask Chat for the next document with your own pages as sources.** The Decision Record Standard can be written from your Method and the three ADRs. Repeat until the path is done. See [the next document, from his own pages](/domains/ai-consulting/#the-next-document-from-his-own-pages).
6. **Review every change.** When you merge two checklist items or rename the Register, every page that pointed at it follows. See [Review changed the plan, and the source followed](/domains/ai-consulting/#review-changed-the-plan-and-the-source-followed).

## Apply it to a client job

A Domain is for using, not only reading. Say a made-up e-bike rental startup, Lantern Bicycle Co., asks for a review before its next round. Open the Domain, start a folder for Lantern, and drop in their container diagram and last month's cloud bill as a table. Ask Chat to draft the review report from the Review Method and to mark every line it is unsure about. The checklist tells you what to confirm before the findings go out, and the lead engineer signs it. Moving the job queue off the main database becomes ADR 007, written to the Decision Record Standard. The debt you found goes into the Register with an owner and a date.

When the investor's questions arrive, the Team and Diligence Guide gives the report its shape. A question you had to research goes back into the Guide as a new section, and the next client starts from what you learned. A new engineer at Lantern can read the Method and the Standard on day one and write their first ADR the way you would. That is the bus factor answered one person at a time.

## Publish it, and keep it current

When the folder is ready, choose Publish and then GitHub Repository. Flow sends the files and nothing else. A reader brings the Domain in with File, then New from GitHub, and the folder's address. Check the repository's visibility first. Your method can be public while every client's diagrams, bills and code stay in their own folder on your Mac.

![Publish open on a Domain in Flow, with GitHub Repository chosen and the note that six files were sent. The preview shows the README as the repository will. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/09-published-to-github.webp)

When a rule changes and you publish again, every reader's copy shows the update as a change they review. They keep their own edits. Nothing is replaced behind their back.

![Flow's update sheet for a Domain a reader brought in, listing the one document that changed and offering Not Now or Update Selected. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/12-update-sheet.webp)

The same source can also become a GitHub Pages site, a PDF, an EPUB, or Word and Excel files for a client's team. Chat on the Domain, and the figures a reader steps through, stay in Flow.

## What it costs

Bringing any Domain into Flow is free on Base. Writing with Chat, and Chat on a Domain, need Flow Pro at $10 a month. Publishing to GitHub needs the Publish add-on too, another $10 a month. There is no fee per Domain, so publish one or twenty for the same price. Any AI you connect follows the terms of that service. Publishing does not bring clients on its own. It gives the clients you earn a living copy of your method.

## Start here

Read the [walkthrough](/domains/ai-consulting/) once, end to end. Then add an empty folder in Flow, name it, and describe your review method to Chat in three sentences. The README it writes is the first document of your Domain. If you want to talk it through first, the [Domains page](/domains/) has one email address and four questions.
