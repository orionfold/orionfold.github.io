---
title: "A close your clients can read: a blueprint for Accounting Advisory"
domain: Accounting Advisory
kind: blueprint
role: Accounting and tax advisors
hook: "Your monthly close, the plain-English note that explains it, and the research notes your clients ask for."
icon: skill-register
tint: "#ff3252"
order: 5
dek: "You close the books for dozens of clients and answer the questions that come after. The close is a method. The explanation is a craft. Both live in your head and in a folder of past emails. This blueprint shows what a Flow Domain for that method would hold, how you would build it with Chat and Skills, and how every client would get the living version. Nothing here is built yet. It is yours to take."
description: "A monthly close and client advisory playbook as a Flow Domain blueprint for accounting firms and CPAs. What it holds, the signals, and how to build it in Flow."
drafted: "2026-10-28"
release: "3.0"
blueprint:
  - name: README
    role: "The front page. Who the Domain is for, what a reader will have at the end, and the path through it."
    chips: [["skill-visual-explainer", "Stepped figure"], ["skill-isometric-figure", "Map of the path"]]
  - n: "1"
    name: Monthly Close Method
    role: "The steps of your close, who owns each, and the checks that must pass before the books are called done."
    chips: [["skill-workflow-path", "Workflow"], ["component-approval-card", "Close checklist"]]
  - n: "2"
    name: Close Explanation Guide
    role: "How you turn a finished close into a note a business owner reads in five minutes. What goes first, what to leave out."
    chips: [["component-table", "Template"], ["skill-visual-explainer", "Stepped figure"]]
  - n: "3"
    name: Research Note Standard
    role: "How a tax or accounting research note is written, sourced and dated, and the questions that go to a specialist."
    chips: [["component-sources", "Sources"], ["component-callout", "Marked to check"], ["component-form", "Request form"]]
  - n: "4"
    name: Issues and Decisions Register
    role: "Open questions per client, who owns each, and when it was last checked."
    chips: [["skill-register", "Register"], ["component-table", "Table"]]
  - name: Worked Example
    role: "A close note and a research note for a made-up client, filled in end to end, with the choices explained."
    chips: [["component-callout", "Worked example"]]
keywords: ["monthly close checklist template", "client advisory services playbook", "CAS playbook template", "tax research memo template", "accounting firm knowledge base", "custom GPT for accountants alternative", "close explanation for clients", "accounting advisory toolkit", "CPA firm process documentation", "AI for accounting firms"]
faq:
  - q: "Can I give every client a plain-English note on their close each month?"
    a: "Yes. The Close Explanation Guide holds the shape of the note. After a close, Chat drafts it from the Guide and the month's tables, and marks every line it is unsure about. You confirm against the Method's checklist and send it. The next month starts from the same Guide."
  - q: "How do I keep tax research notes current when the IRS changes a page?"
    a: "Bring the page in with New from Web Page and choose Follow the source. Each Jobs run reads it again and brings changes in where you have not edited. Your Research Note Standard cites the current page, and Sources marks a source that changed since the note was written."
  - q: "Does client data leave my Mac?"
    a: "Client statements stay in that client's folder on your Mac. Before any run leaves the Mac, Flow shows what goes and where and asks. Publishing is a separate step you take yourself, and it sends only the Domain's files. The Domain holds the method, never a client's numbers."
  - q: "Does a Flow Domain replace the custom GPT I built for client questions?"
    a: "It is a different shape. A GPT is a chat inside one service, and OpenAI retires custom GPTs on December 11, 2026. A Domain is files in your own GitHub. Chat on it in Flow answers from your Standard and your Register and links each fact to its file."
  - q: "What does it cost to publish an accounting advisory Domain?"
    a: "Bringing a Domain in is free on Base. Writing with Chat needs Flow Pro at $10 a month. Publishing to GitHub needs the Publish add-on, another $10 a month. There is no fee per Domain. Skills are free on every plan."
mock:
  folder: close-method
  client: "Juniper Bakery"
  steps:
    - title: "Start the month"
      ask: "Start a folder for Juniper Bakery and bring in the March statements from Excel."
      reply: "Added March Statements. The P&L and balance sheet came across as tables. 2 items to check before you rely on them."
      doc: "March Statements"
      block: "Table"
      status: "Imported · 2 to check"
    - title: "Run the close checklist"
      ask: "Add the close checklist from the Monthly Close Method."
      reply: "Added the checklist as an Approval Card. Eleven checks, each with its owner. Tick them and sign in the Reader."
      doc: "March Close"
      block: "Approval Card · Sign off"
      status: "11 checks open"
    - title: "Explain the close"
      ask: "Draft the close note from the Close Explanation Guide, with a cash bridge from February to March."
      reply: "Drafted March Close Note. Cash fell while profit rose, and a waterfall chart shows the four steps that explain it. 2 claims marked to check."
      doc: "March Close Note"
      block: "Chart · Waterfall"
      status: "2 claims to check"
    - title: "Draw the numbers"
      ask: "Run Field-Notes Diagram on the cash paragraph."
      reply: "Field-Notes Diagram drew the four numbers to size, with the inventory build in colour. It waits in Review Changes."
      doc: "March Close Note"
      block: "Field-Notes Diagram"
      status: "1 change to review"
    - title: "Answer the question"
      ask: "They asked if the new oven is a repair or an improvement. Draft a research note from the Standard."
      reply: "Drafted Research Note. Two sources cited, the question that goes to a specialist named. 1 claim marked to check."
      doc: "Research Note"
      block: "Sources"
      status: "1 claim to check"
    - title: "Log it in the Register"
      ask: "Add the oven question to the Issues and Decisions Register with today's date."
      reply: "Added the row. Owner, status and last checked are filled. It waits in Review Changes."
      doc: "Issues and Decisions Register"
      block: "Register"
      status: "1 change to review"
minutes: 10
---

You close the books for dozens of businesses and then answer the questions that come after. Why did cash drop when profit rose. What does the new deduction mean for us. Can we treat this as a repair. The close is a method you repeat every month. The explanation is a craft you have practiced for years. Both live in your head, in a checklist someone started in 2019, and in a folder of past emails you search when a client asks the same thing again.

This page is a blueprint for a Flow Domain that carries that method and that craft. It is not built. Only one Domain exists today, [AI Consulting](/domains/ai-consulting/), and its launch story is the walkthrough for every step below. This blueprint is yours to take. Build it from your own know-how, put your name on it, and launch it as your Domain. If you do, I would like to hear about it.

## The opportunity

The accounting market is large and slow. US accounting services bring in about [$158 billion a year](https://www.ibisworld.com/united-states/market-size/accounting-services/1398/) and grew under 2 percent in 2026. Inside that slow market, one part is moving fast. Client advisory services grew [17 percent](https://www.cpa.com/news/aicpa-and-cpacom-benchmark-survey-client-advisory-services-cas-practices-report-17-growth) at the median practice in 2023, and the practices surveyed by CPA.com and the AICPA expected to double that revenue over three years. The growth is in explaining and advising, not in the close itself.

AI arrived in firms faster than almost anywhere else. Thomson Reuters found firm-level use of generative AI among tax firms went from [8 percent in 2024 to 34 percent in 2026](https://www.thomsonreuters.com/en-us/posts/innovation/the-real-ai-story-in-tax-and-audit-isnt-adoption-its-impact/). Wolters Kluwer's 2025 survey found the share of firms using AI jumped from [9 to 41 percent](https://www.accountex.co.uk/insight/2025/10/08/wolters-kluwer-releases-its-2025-future-ready-accountant-report-highlighting-key-trends-in-the-global-tax-accounting-industry/) in one year. Karbon's 2027 report puts firms using at least one AI tool at [86.7 percent](https://karbonhq.com/resources/accounting-technology-report-2027-karbon/). The tools are in. What most firms do not have is a written way of using them that a new hire or a client can read.

The people to do the work are getting scarcer. Accounting degrees fell [6.6 percent](https://www.aicpa-cima.com/professional-insights/download/2025-trends-report) in a year, and new CPA exam candidates fell by a third, from 42,626 to 28,082. The Bureau of Labor Statistics still expects [1.6 million accountants and auditors](https://www.bls.gov/ooh/business-and-financial/accountants-and-auditors.htm) to be needed in 2035, with about 115,000 openings a year. The 2026 filing season was the first to carry the 2025 tax law, with a new form and about [164 million returns](https://www.irs.gov/newsroom/irs-announces-first-day-of-2026-filing-season-online-tools-and-resources-help-with-tax-filing) to explain to the people who filed them. And the custom GPT some advisors used to package their know-how [retires on December 11, 2026](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq). A Domain is plain files in your own GitHub. Nobody can retire it.

## The signals

| Figure | Value | Source |
| --- | --- | --- |
| US accounting services revenue, 2026 | About $158.4 billion, up 1.8 percent | source: [IBISWorld, Accounting Services in the US](https://www.ibisworld.com/united-states/market-size/accounting-services/1398/), published 2026, checked 2026-10-28 |
| Client advisory services, median growth | 17 percent in 2023; 99 percent expected over three years | source: [CPA.com and AICPA, CAS Benchmark Survey](https://www.cpa.com/news/aicpa-and-cpacom-benchmark-survey-client-advisory-services-cas-practices-report-17-growth), published 2024-12-09, checked 2026-10-28 |
| Tax firms using generative AI at firm level | 34 percent in 2026, 21 in 2025, 8 in 2024 | source: [Thomson Reuters Institute, 2026 AI in Professional Services Report](https://www.thomsonreuters.com/en-us/posts/innovation/the-real-ai-story-in-tax-and-audit-isnt-adoption-its-impact/), published 2026-04-16, checked 2026-10-28 |
| Firms using AI, global | 41 percent in 2025, up from 9 percent; 72 percent of users weekly | source: [Wolters Kluwer, 2025 Future Ready Accountant](https://www.accountex.co.uk/insight/2025/10/08/wolters-kluwer-releases-its-2025-future-ready-accountant-report-highlighting-key-trends-in-the-global-tax-accounting-industry/), published 2025-10-08, checked 2026-10-28 |
| Firms using at least one AI tool | 86.7 percent | source: [Karbon, The State of Technology in Accounting 2027](https://karbonhq.com/resources/accounting-technology-report-2027-karbon/), published 2026-10-26, checked 2026-10-28 |
| US accountants and auditors | 1,595,200 jobs in 2025, growing 5 percent to 2035; about 115,300 openings a year | source: [US Bureau of Labor Statistics, Occupational Outlook Handbook](https://www.bls.gov/ooh/business-and-financial/accountants-and-auditors.htm), published 2026-08-27, checked 2026-10-28 |
| Accounting degrees and new CPA exam candidates | 55,152 degrees, down 6.6 percent; 28,082 candidates, down from 42,626 | source: [AICPA, 2025 Trends Report](https://www.aicpa-cima.com/professional-insights/download/2025-trends-report), published 2025-10-27, checked 2026-10-28 |
| Returns expected in the 2026 filing season | About 164 million, with a new Schedule 1-A | source: [IRS, first day of the 2026 filing season](https://www.irs.gov/newsroom/irs-announces-first-day-of-2026-filing-season-online-tools-and-resources-help-with-tax-filing), published 2026-01-08, checked 2026-10-28 |

Each figure measures something narrower than it sounds. Surveys count who answered. Vendor research counts a vendor's view. A market estimate is a model. Read them as a direction, not a forecast.

## What your Domain holds

The figure at the top of this page is the folder as it could sit on GitHub. Six Markdown files. Here is what each one does.

**The README** is the front page. It says who the Domain is for, what a reader will have at the end, and the order to read the documents in. A stepped figure shows a close becoming a note. An isometric figure maps the path.

**Monthly Close Method** is the backbone. The steps of your close, who owns each, and the checks that must pass before the books are called done. The checklist is an Approval Card, so the record of who closed what stays with the month.

**Close Explanation Guide** is the craft. How you turn a finished close into a note a business owner reads in five minutes. What goes first, what to leave out, how to say that cash fell while profit rose without a lecture. A template holds the shape. A stepped figure shows how the note is built from the numbers.

**Research Note Standard** is how a tax or accounting question becomes an answer a client can rely on. How the note is written, what it cites, how it is dated, and which questions go to a specialist instead. Every claim links to its source. What you have not confirmed is marked, and Flow counts the marks until you answer them. A form lets a client ask a question in the shape you need.

**Issues and Decisions Register** keeps the open questions per client, who owns each, and when it was last checked. A Register Skill draws it. It is the end of searching old emails.

**Worked Example** is a close note and a research note for a made-up client, filled in end to end, with the choices explained. A reader learns more from one finished note than from ten rules.

## What Flow does for this work

**Chat answers from your Standard and your Register.** With the Domain chosen, Chat searches your documents before it replies and links each fact to its file. Ask *How do we treat a repair?* and the answer comes from the Research Note Standard, with the section named. A new hire gets the same answer you would give. When your documents are silent, Chat says so.

**The close checklist is signed in the document.** The Monthly Close Method ends in an Approval Card. Eleven checks, each with its owner. The person who closes ticks them, types their name and presses **Sign off**. Flow writes one signed record beside the month, and History lists it. Change the checklist later and the card asks for a new signature. The old record stays.

**A Job keeps a cited IRS page current.** Bring the page in with New from Web Page and choose *Follow the source*. Each Jobs run reads it again and brings changes in where you have not edited. On a quiet week the Job skips without calling a model. A Sources block on every research note marks a source that changed since the note was written.

**Field-Notes Diagram draws the month's numbers to size.** Select the paragraph that explains why cash fell while profit rose, and run the Skill. It draws the four numbers as bars, each to its size and printed beside it, with the one the paragraph stresses in colour. A business owner reads it in ten seconds. It waits in Review Changes until you keep it.

**A Form takes a client's question in your shape.** The Research Note Standard ends in a Form. What they want to know, what it is for, when they need it, and a checklist of what to attach. Its button is **Submit**, so the request is recorded beside the document with their name and the day. Nothing arrives in an email thread you have to search later.

**A Register that draws itself.** The Issues and Decisions Register is drawn by the Register Skill from the open questions in the text. Each row has an owner, a status and when it was last checked. Chat adds a row when a question comes in and updates it when you answer. It is the end of searching old emails.

**Your agents can draft the note.** With Flow Pro, Settings ▸ General ▸ Your agents opens the folder to the Claude Code or Codex you run in Terminal. It can read the Guide and the month's tables and propose the close note. The proposal lands in Review Changes under its name. You decide what the client reads.

## How you build it in Flow

The [AI Consulting story](/domains/ai-consulting/) walks every one of these steps on a real screen. Follow it with your own material.

1. **Add an empty folder and choose it.** Chat answers from the folder before any document exists. The walkthrough shows it at [an empty folder, and Chat already in it](/domains/ai-consulting/#an-empty-folder-and-chat-already-in-it).
2. **Ask Chat for the README.** Describe who the Domain is for and what you want a reader to have at the end. Chat writes it in your voice and marks every claim it cannot stand behind. See [a front page, in the author's voice](/domains/ai-consulting/#a-front-page-in-the-authors-voice).
3. **Bring in what you already have.** The close checklist from 2019, a past client note with the names changed, the IRS page you cite most. New from Web Page turns a page or a shared AI chat into a document with its links kept. See [an old AI chat became a reference](/domains/ai-consulting/#an-old-ai-chat-became-a-reference).
4. **Let Ideas pick a Skill.** Press Suggest on your Method document. Ideas reads the sections and names a Skill for each, a Workflow Path for the close, a Register for the open questions. A figure or a form waits in Review Changes until you keep it.

![Ideas open beside a README in Flow, offering to run Visual Explainer and Guided Exercise on two sections, each with a sentence on why it fits. Shown on AI Consulting, the only Domain built so far](../../assets/flow/domains/ai-consulting/04-ideas-suggest.webp)

5. **Ask Chat for the next document with your own pages as sources.** The Explanation Guide can be written from your Method and your past notes. Repeat until the path is done. See [the next document, from his own pages](/domains/ai-consulting/#the-next-document-from-his-own-pages).
6. **Review every change.** When you merge two checks or rename a document, every page that pointed at it follows. See [Review changed the plan, and the source followed](/domains/ai-consulting/#review-changed-the-plan-and-the-source-followed).

## Apply it to a client job

A Domain is for using, not only reading. After a close, open the Domain, start a folder for the client and drop the month's statements in as tables. Ask Chat to draft the close note from the Guide, and to mark every line it is unsure about. The Method's checklist tells you what to confirm before the note goes out. When a client asks a question you had to research, the answer goes in the Register, and the lesson goes back into the Standard. Next month starts from what you learned.

A new hire can read the Method and the Guide on their first day and close their first month the way you would. That is the staffing problem answered one person at a time.

## Publish it, and keep it current

When the folder is ready, choose Publish and then GitHub Repository. Flow sends the files and nothing else. A reader brings the Domain in with File, then New from GitHub, and the folder's address. Check the repository's visibility first. Your method can be public while every client's statements stay in their own folder on your Mac.

![Publish open on a Domain in Flow, with GitHub Repository chosen and the note that six files were sent. The preview shows the README as the repository will. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/09-published-to-github.webp)

When a rule changes and you publish again, every reader's copy shows the update as a change they review. They keep their own edits. Nothing is replaced behind their back.

![Flow's update sheet for a Domain a reader brought in, listing the one document that changed and offering Not Now or Update Selected. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/12-update-sheet.webp)

The same source can also become a GitHub Pages site, a PDF, an EPUB, or Word and Excel files for a client's team. Chat on the Domain, and the figures a reader steps through, stay in Flow.

## What it costs

Bringing any Domain into Flow is free on Base. Writing with Chat, and Chat on a Domain, need Flow Pro at $10 a month. Publishing to GitHub needs the Publish add-on too, another $10 a month. There is no fee per Domain, so publish one or twenty for the same price. Any AI you connect follows the terms of that service. Publishing does not bring clients on its own. It gives the clients you earn a living copy of your method.

## Start here

Read the [walkthrough](/domains/ai-consulting/) once, end to end. Then add an empty folder in Flow, name it, and describe your close to Chat in three sentences. The README it writes is the first document of your Domain. If you want to talk it through first, the [Domains page](/domains/) has one email address and four questions.
