---
title: "A plan your clients can follow: a blueprint for Financial Planning"
domain: Financial Planning
kind: blueprint
role: Financial planners and wealth advisors
hook: "Your discovery questions, the plan you build from them, and the annual review that keeps it alive."
icon: skill-value-model
tint: "#6b7f19"
order: 12
dek: "You ask every new household the same questions, build the same plan, and sit down with them every year to check it. The questions live in a Word file. The plan lives in your planning software. The way you explain a Roth conversion lives in your head. This blueprint shows what a Flow Domain for that method would hold, how you would build it with Chat and Skills, and how every client would get the living version. Nothing here is built yet. It is yours to take."
description: "A blueprint for a Flow Domain for financial planners and RIA advisors. The financial plan template, the process checklist, the signals, and how to build it."
drafted: "2026-10-29"
release: "3.0"
keywords: ["financial plan template for advisors", "financial planning process checklist", "ria compliance checklist", "custom gpt for financial advisors", "client education library for advisors", "investment policy statement template", "annual client review agenda", "financial planning discovery questionnaire", "cfp seven step process", "advisor knowledge base for clients"]
blueprint:
  - name: README
    role: "The front page. Who the Domain is for, what a reader will have at the end, and the path through it."
    chips: [["skill-visual-explainer", "Stepped figure"], ["skill-isometric-figure", "Map of the path"]]
  - n: "1"
    name: Planning Process Method
    role: "The seven steps of the financial planning process as your firm runs them, who owns each, and what must be true before a plan is presented."
    chips: [["skill-workflow-path", "Workflow"], ["component-approval-card", "Plan delivery checklist"]]
  - n: "2"
    name: Discovery Questionnaire
    role: "The questions you ask a household in the first two meetings, in the order you ask them, and the documents you collect."
    chips: [["component-form", "Intake form"], ["skill-guided-exercise", "Goals exercise"]]
  - n: "3"
    name: Plan Structure and Review Agenda
    role: "The sections of the plan, from cash flow to the investment policy statement, and the agenda for the annual review."
    chips: [["component-table", "Plan outline"], ["skill-scenario-model", "Retirement scenarios"], ["component-chart", "Projection chart"]]
  - n: "4"
    name: Client Education and Compliance Standard
    role: "How an explainer for clients is written and sourced, and the compliance checks it must pass before it goes out."
    chips: [["component-sources", "Sources"], ["component-callout", "Marked to check"], ["skill-register", "Compliance register"]]
  - name: Worked Example
    role: "A full plan and a first annual review for a made-up household, filled in end to end, with the choices explained."
    chips: [["component-callout", "Worked example"]]
faq:
  - q: "How do I turn my financial planning process into a written playbook my associate planners follow the same way I do?"
    a: "Write it as a folder of plain documents, one per step of your process. In Flow, Chat answers an associate's question from that folder and links each answer to the page it came from. A Workflow Path Skill draws the steps so a new planner sees the whole path before the first meeting."
  - q: "What should an annual client review agenda include, and how do I keep it the same across every household?"
    a: "Put the agenda in one document in the Domain and start every review from it. A Form on that page can record what was covered and what changed for the household. When you improve the agenda and publish again, every client's copy shows the change and they choose whether to take it."
  - q: "Can I build a custom GPT with my firm's planning method, and what happens when custom GPTs are retired?"
    a: "A custom GPT is a saved configuration that lives on one company's servers. A Flow Domain is plain Markdown files in your own GitHub. Chat on the Domain in Flow answers from those files, and nobody can retire them. Chat on a Domain needs Flow Pro."
  - q: "What goes in an investment policy statement for a household?"
    a: "The purpose of the money, the target mix of stocks, bonds and cash, the rebalancing rule, what the planner may do without asking, and when it is reviewed. In this blueprint it is a section of the Plan Structure document, with a Table for the target mix. The Worked Example shows one filled in."
  - q: "How do I keep client education explainers in line with the SEC marketing rule?"
    a: "Give every explainer the same standard. Each claim links to its source. Anything not yet confirmed is marked to check, and Flow counts the marks until you clear them. A Register Skill keeps the list of checks each piece must pass before it goes out. Flow does not give compliance advice. It keeps your checks visible."
mock:
  folder: planning-method
  client: "The Maplewood household"
  steps:
    - title: "Start the household folder"
      ask: "Start a folder for the Maplewood household and bring in their discovery questionnaire and last year's tax return."
      reply: "The household’s discovery answers came in through the form. 2 files in, 3 items on the import checklist."
      doc: "Maplewood discovery questionnaire"
      block: "Form · Submit"
      status: "Submitted"
    - title: "Ask for the plan draft"
      ask: "Draft the Maplewood cash flow and retirement projection sections from the Plan Structure guide."
      reply: "Both sections drafted from the guide, with a line chart of cash flow to age 90. 2 claims to check."
      doc: "Maplewood financial plan"
      block: "Chart · Line"
      status: "2 claims to check"
    - title: "Draw the retirement scenarios"
      ask: "Run Scenario Model on the retirement projection for retiring at 62, 65 and 67."
      reply: "Three scenarios drawn from the projection table, waiting in Review Changes."
      doc: "Maplewood financial plan"
      block: "Scenario Model"
      status: "1 change to review"
    - title: "Review what changed"
      ask: "Show me what changed in the plan since the first draft."
      reply: "Review shows the 4 edits as a diff, all in the tax section. Keep or revert each."
      doc: "Maplewood financial plan"
      block: "Diff"
      status: "4 edits kept"
    - title: "Sign off the delivery checklist"
      ask: "Open the plan delivery checklist so I can sign it before Thursday's meeting."
      reply: "Approval Card ready. 9 items, your name goes at the bottom."
      doc: "Plan delivery checklist"
      block: "Approval Card · Sign off"
      status: "Signed, 1 record"
    - title: "The client's update arrives"
      ask: "What changed in the Domain since the Maplewoods brought it in?"
      reply: "One document changed, the Review Agenda, with the 2026 contribution limits. The household’s copy shows it as an update to review."
      doc: "Plan Structure and Review Agenda"
      block: "Update · 1 document"
      status: "Update available"
minutes: 9
---

You meet a new household and ask the questions you have asked for fifteen years. What do you own. What do you owe. When do you want to stop working. You gather their statements, their tax return, their policies and the will they have not updated since the first child. You build the plan. Cash flow, net worth, a retirement projection with three scenarios, tax, insurance, estate, and an investment policy statement. A year later you sit down with them again and work through the annual review agenda. The method lives in your head, in a questionnaire you wrote in Word, and in a planning software template nobody else in the firm can run without you.

This page is a blueprint for a Flow Domain that carries that method. It is not built. Only one Domain exists today, [AI Consulting](/domains/ai-consulting/), and its launch story is the walkthrough for every step below. This blueprint is yours to take. Build it from your own know-how, put your name on it, and launch it as your Domain. If you do, I would like to hear about it.

## The opportunity

The advice business keeps growing and stays small. The Investment Adviser Association counts [16,544 advisers](https://www.investmentadviser.org/iaatoday/press-release/2026-investment-adviser-industry-snapshot-shows-continued-growth-in-demand-for-adviser-services/) managing $176.8 trillion for 73.7 million clients, and 92.8 percent of those firms have 100 or fewer people. CFP Board reports a record [107,529 CFP professionals](https://www.cfp.net/news/2026/01/cfp-board-reports-record-growth-in-cfp-professionals-and-exam-candidates-in-2025), with 6,709 new ones in a single year. The Bureau of Labor Statistics expects about [17,100 openings a year](https://www.bls.gov/ooh/business-and-financial/personal-financial-advisors.htm) for personal financial advisors through 2035, many of them in firms where the method is one person's.

AI is already in the office. Schwab found [63 percent of independent RIAs](https://pressroom.aboutschwab.com/press-releases/press-release/2026/Schwab-Study-Reveals-RIA-AI-Adoption-More-Than-Doubles---But-Most-Firms-Still-in-Early-Stages/default.aspx) use AI tools, more than double the share in 2023, mostly for meeting notes and email. The Financial Planning Standards Board asked 8,095 planners and found [83 percent](https://fpsb.org/news/new-global-research-explores-ais-growing-role-in-financial-planning-and-the-value-of-professional-advice/) expect AI to help them serve clients better, up from 78 percent a year earlier. The tools take notes. What most firms do not have is the method written down where the tools can read it and a client can read it too.

The method also has to outlive the planner. Cerulli expects [more than 100,000 advisors](https://www.cerulli.com/arc-newsletter-q1-2025) to retire within ten years, with 41.4 percent of the assets. A quarter of them are unsure of their succession plan. The rules keep moving under the plan, too. The SEC updated its [marketing rule FAQ](https://www.sec.gov/rules-regulations/staff-guidance/division-investment-management-frequently-asked-questions/marketing-compliance-frequently-asked-questions) on March 19, 2025, on when a gross figure may be shown. The IRS set the [2026 401(k) limit at $24,500](https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500), and every plan's numbers change again next November. And the custom GPT some planners used to hold their method [retires on December 11, 2026](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq). A Domain is plain files in your own GitHub. Nobody can retire it.

## The signals

| Figure | Value | Source |
| --- | --- | --- |
| US personal financial advisors | 299,400 jobs in 2025, growing 1 percent to 2035; about 17,100 openings a year; median pay $105,070 | source: [US Bureau of Labor Statistics, Occupational Outlook Handbook](https://www.bls.gov/ooh/business-and-financial/personal-financial-advisors.htm), published 2026-08-27, checked 2026-10-29 |
| CFP professionals in the US | 107,529 at the end of 2025, up 4.3 percent; 6,709 new, a record | source: [CFP Board, Record Growth in CFP Professionals and Exam Candidates in 2025](https://www.cfp.net/news/2026/01/cfp-board-reports-record-growth-in-cfp-professionals-and-exam-candidates-in-2025), published 2026-01-15, checked 2026-10-29 |
| Investment advisers, assets and clients | 16,544 advisers; $176.8 trillion, up 22.3 percent; 73.7 million clients; 92.8 percent of firms with 100 or fewer employees | source: [Investment Adviser Association, 2026 Investment Adviser Industry Snapshot](https://www.investmentadviser.org/iaatoday/press-release/2026-investment-adviser-industry-snapshot-shows-continued-growth-in-demand-for-adviser-services/), published 2026-06-03, checked 2026-10-29 |
| Independent RIAs using AI tools | 63 percent, more than double 2023; mostly notetaking and email; 533 firms surveyed | source: [Schwab Advisor Services, RIA AI Adoption More Than Doubles](https://pressroom.aboutschwab.com/press-releases/press-release/2026/Schwab-Study-Reveals-RIA-AI-Adoption-More-Than-Doubles---But-Most-Firms-Still-in-Early-Stages/default.aspx), published 2026-01-22, checked 2026-10-29 |
| Planners who expect AI to help them serve clients better | 83 percent in 2026, up from 78 percent; 8,095 planners in 37 territories | source: [FPSB, 2026 Impact of AI on Financial Planning](https://fpsb.org/news/new-global-research-explores-ais-growing-role-in-financial-planning-and-the-value-of-professional-advice/), published 2026-10-07, checked 2026-10-29 |
| Advisors expected to retire within ten years | More than 100,000; 37.4 percent of headcount and 41.4 percent of assets; 26 percent unsure of their succession plan | source: [Cerulli Associates, ARC Newsletter Q1 2025](https://www.cerulli.com/arc-newsletter-q1-2025), published 2025-01-14, checked 2026-10-29 |
| SEC marketing rule FAQ on extracted performance | Gross figures allowed only with the whole portfolio's gross and net shown at least as prominently | source: [SEC Division of Investment Management, Marketing Compliance FAQ](https://www.sec.gov/rules-regulations/staff-guidance/division-investment-management-frequently-asked-questions/marketing-compliance-frequently-asked-questions), published 2025-03-19, checked 2026-10-29 |
| 2026 retirement contribution limits | 401(k) $24,500; IRA $7,500; catch-up at 50 $8,000; catch-up at 60 to 63 $11,250 | source: [IRS, 401(k) limit increases to $24,500 for 2026](https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500), published 2025-11-13, checked 2026-10-29 |

Each figure measures something narrower than it sounds. Surveys count who answered. Vendor research counts a vendor's view. A market estimate is a model. Read them as a direction, not a forecast.

## What your Domain holds

The figure at the top of this page is the folder as it could sit on GitHub. Six Markdown files. Here is what each one does.

**The README** is the front page. It says who the Domain is for, what a reader will have at the end, and the order to read the documents in. A stepped figure shows a household's answers becoming a plan. An isometric figure maps the path.

**Planning Process Method** is the backbone. The seven steps of the financial planning process as your firm runs them, who owns each, and what must be true before a plan is presented. A Workflow Path draws it. The plan delivery checklist is an Approval Card, so the record of who checked what stays with the plan.

**Discovery Questionnaire** is the first two meetings. The questions you ask a household, in the order you ask them, and the documents you collect alongside. The questionnaire is a Form, so a household can answer it in the Reader. A Guided Exercise walks a couple through ranking their goals before they ever see a projection.

**Plan Structure and Review Agenda** is the plan itself. The sections in order, from cash flow and net worth to the retirement projection, tax, insurance, estate, and the investment policy statement. A Table holds the plan outline and the target mix. A Scenario Model Skill draws retire-at-62, 65 and 67 from the projection. A Chart shows the projection. The document ends with the annual review agenda, so the review starts from the plan it checks.

**Client Education and Compliance Standard** is how a one-page explainer on Roth conversions or Social Security timing gets written, sourced and dated. Every claim links to its source. What you have not confirmed is marked, and Flow counts the marks until you answer them. A Register Skill keeps the checks each piece must pass before it goes out.

**Worked Example** is a full plan and a first annual review for a made-up household, filled in end to end, with the choices explained. A new planner learns more from one finished plan than from ten rules.

## What Flow does for this work

**Chat answers from the folder.** The README names up to six questions a reader will ask. An associate planner opens Chat with no document open and sees those questions as buttons. Each answer links to the page it came from. When the folder does not say, Chat says so, instead of guessing at a tax rule.

**A Skill draws the retirement scenarios.** Select the projection table in a client's plan and run Scenario Model. It draws the cases the text names, retiring at 62, 65 or 67, and names what is missing instead of inventing a return. The figure waits in Review Changes until you keep it. A Workflow Path does the same for the seven steps in the Method.

**A Form takes the discovery answers.** The Discovery Questionnaire is a Form with text, numbers, dates and choices. A household fills it in the Reader and presses Submit, and every entry is recorded beside the document. The plan delivery checklist is an Approval Card. You tick the items, type your name and press Sign off. One signed record stays with the plan.

**A Job keeps the limits table current.** Bring the IRS limits page in with New from Web Page and choose Follow the source. A Job then keeps the contribution limits table in the Review Agenda current from that page. On a night when nothing changed it skips without calling a model. Every November the new numbers arrive as a change you review.

**A client's Excel comes in with a checklist.** A household's budget spreadsheet or a PDF statement comes in as a document, tables still tables. A short list in Sources says what to check before you rely on it. On the finished plan, Sources shows what it was made from, and Change Summary shows what changed this week and who changed it.

**A door for your own agents.** With Flow Pro, Settings opens a door for the Claude Code or Codex you run in Terminal. The agent can read the Domain's reading order, search its documents, and propose a draft that arrives in Review Changes under its name. Flow itself sends nothing anywhere.

## How you build it in Flow

The [AI Consulting story](/domains/ai-consulting/) walks every one of these steps on a real screen. Follow it with your own material.

1. **Add an empty folder and choose it.** Chat answers from the folder before any document exists. The walkthrough shows it at [an empty folder, and Chat already in it](/domains/ai-consulting/#an-empty-folder-and-chat-already-in-it).
2. **Ask Chat for the README.** Describe who the Domain is for and what you want a reader to have at the end. Chat writes it in your voice and marks every claim it cannot stand behind. See [a front page, in the author's voice](/domains/ai-consulting/#a-front-page-in-the-authors-voice).
3. **Bring in what you already have.** The discovery questionnaire from Word, a past plan with the household's details removed, and the IRS limits page you cite every year. New from Web Page turns a page or a shared AI chat into a document with its links kept. See [an old AI chat became a reference](/domains/ai-consulting/#an-old-ai-chat-became-a-reference).
4. **Let Ideas pick a Skill.** Press Suggest on your Method document. Ideas reads the sections and names a Skill for each, a Workflow Path for the seven steps, a Register for the compliance checks. A figure or a form waits in Review Changes until you keep it.

![Ideas open beside a README in Flow, offering to run Visual Explainer and Guided Exercise on two sections, each with a sentence on why it fits. Shown on AI Consulting, the only Domain built so far](../../assets/flow/domains/ai-consulting/04-ideas-suggest.webp)

5. **Ask Chat for the next document with your own pages as sources.** The Plan Structure can be written from your Method and the old plan you brought in. Repeat until the path is done. See [the next document, from his own pages](/domains/ai-consulting/#the-next-document-from-his-own-pages).
6. **Review every change.** When you merge two discovery questions or rename a document, every page that pointed at it follows. See [Review changed the plan, and the source followed](/domains/ai-consulting/#review-changed-the-plan-and-the-source-followed).

## Apply it to a client job

A Domain is for using, not only reading. Take the Maplewood household, a made-up couple in their late fifties. Start a folder for them and bring in their discovery answers and last year's return. Ask Chat to draft the cash flow and retirement sections from the Plan Structure, and to mark every line it is unsure about. Run Scenario Model for three retirement ages. The Method's delivery checklist tells you what to confirm before the plan goes out, and you sign it.

A year later the review starts from the Review Agenda in the same folder. When the Maplewoods ask about a Roth conversion, the explainer comes from the Client Education Standard, with its sources and its marks. The question goes into the Register, and the lesson goes back into the Standard. A new associate can read the Method and the Questionnaire on their first day and run a first meeting the way you would.

## Publish it, and keep it current

When the folder is ready, choose Publish and then GitHub Repository. Flow sends the files and nothing else. A reader brings the Domain in with File, then New from GitHub, and the folder's address. Check the repository's visibility first. Your method can be public while every household's statements, returns and plan stay in their own folder on your Mac.

![Publish open on a Domain in Flow, with GitHub Repository chosen and the note that six files were sent. The preview shows the README as the repository will. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/09-published-to-github.webp)

When a rule changes and you publish again, every reader's copy shows the update as a change they review. They keep their own edits. Nothing is replaced behind their back.

![Flow's update sheet for a Domain a reader brought in, listing the one document that changed and offering Not Now or Update Selected. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/12-update-sheet.webp)

The same source can also become a GitHub Pages site, a PDF, an EPUB, or Word and Excel files for a client's team. Chat on the Domain, and the figures a reader steps through, stay in Flow.

## What it costs

Bringing any Domain into Flow is free on Base. Writing with Chat, and Chat on a Domain, need Flow Pro at $10 a month. Publishing to GitHub needs the Publish add-on too, another $10 a month. There is no fee per Domain, so publish one or twenty for the same price. Any AI you connect follows the terms of that service. Publishing does not bring clients on its own. It gives the clients you earn a living copy of your method.

## Start here

Read the [walkthrough](/domains/ai-consulting/) once, end to end. Then add an empty folder in Flow, name it, and describe your planning process to Chat in three sentences. The README it writes is the first document of your Domain. If you want to talk it through first, the [Domains page](/domains/) has one email address and four questions.
