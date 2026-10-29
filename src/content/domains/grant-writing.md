---
title: "From funder fit to final report: a blueprint for Grant Writing"
domain: Grant Writing
kind: blueprint
role: "Grant writers and nonprofit fundraising consultants"
hook: "Your funder register, your proposal template by section, and the boilerplate your clients keep asking for."
icon: skill-workflow-path
tint: "#1f3b84"
order: 11
dek: "You write proposals for several nonprofits at once. Each one needs a need statement, a logic model and a budget narrative by a deadline a funder set. Your method lives in a spreadsheet, a folder of old proposals and your own memory. This blueprint shows what a Flow Domain for that method would hold, how you would build it with Chat and Skills, and how every client would get the living version. Nothing here is built yet. It is yours to take."
description: "A grant writing blueprint for a Flow Domain. A funder register, a proposal template by section, a boilerplate library, a reporting calendar and how to build it."
drafted: "2026-10-29"
release: "3.0"
keywords: ["grant proposal template", "grant writing process checklist", "logic model template", "custom gpt for grant writers", "nonprofit boilerplate library", "funder research spreadsheet", "grant fit scoring rubric", "grant reporting calendar template", "budget narrative template", "grant readiness checklist"]
blueprint:
  - name: README
    role: "The front page. Who the Domain is for, what a reader will have at the end, and the path through it."
    chips: [["skill-visual-explainer", "Stepped figure"], ["skill-isometric-figure", "Map of the path"]]
  - n: "1"
    name: Funder Fit Method
    role: "How you find funders, keep the research register, and score fit before anyone writes a word."
    chips: [["skill-register", "Funder register"], ["skill-scorecard", "Fit score"], ["component-form", "Go or no-go"]]
  - n: "2"
    name: Proposal Template by Section
    role: "The need statement, logic model, methods, evaluation and budget narrative, in the order a reviewer reads them."
    chips: [["skill-workflow-path", "Proposal path"], ["component-diagram", "Logic model"], ["component-table", "Section template"]]
  - n: "3"
    name: Boilerplate Library Standard
    role: "How the client's mission, programs, numbers and leadership are kept, dated, and marked when they go stale."
    chips: [["component-sources", "Sources"], ["component-callout", "Marked to check"], ["component-change-summary", "What changed"]]
  - n: "4"
    name: Reporting Calendar and Post-Award Report
    role: "Every report due to every funder, what each must contain, and the report template that answers it."
    chips: [["component-chart", "Timeline"], ["component-approval-card", "Submission checklist"], ["component-form", "Report intake"]]
  - name: Worked Example
    role: "A funder register, one full proposal and one post-award report for a made-up client, filled in end to end."
    chips: [["component-callout", "Worked example"]]
faq:
  - q: "What replaces my custom GPT for grant writing when custom GPTs retire?"
    a: "A Domain is a folder of plain Markdown files in your own GitHub. Chat answers from that folder and links each fact to its file. A shared ChatGPT chat imports as a document with its links kept, so the instructions and examples you gave a GPT can come along. Nobody can retire a folder you own."
  - q: "How do I build a boilerplate library for a nonprofit that tells me when a fact is out of date?"
    a: "Each boilerplate paragraph lives as a document with its sources listed. Sources marks a source that changed since the paragraph was written, and History says when. You or Chat can mark any claim to check, and the document's badge counts the marks until they are resolved."
  - q: "Can Flow watch a funder's guidelines page and tell me when it changes?"
    a: "Yes, within limits. New from Web Page brings the guidelines in as a document, and Follow the source reads the page again on each Jobs run. Changes come in where you have not edited, and the watch says what it found. Flow honours robots.txt and never runs the page's scripts."
  - q: "Can my nonprofit clients use the Domain without paying for Flow?"
    a: "Bringing any Domain into Flow is free on Base, so a client can read your method, step through the figures and fill the forms. Chat on the Domain needs Flow Pro at $10 a month. You need the Publish add-on to send the Domain to GitHub."
  - q: "Does a client's proposal leave my Mac when I use Chat on it?"
    a: "Only if you choose a model that runs elsewhere. Before a run leaves your Mac, Flow shows the Leaves this Mac sheet with what goes and where, and asks. Stays on this Mac keeps a run local. Any AI you connect follows the terms of that service."
mock:
  folder: grant-method
  client: "Riverbend Reading Room"
  steps:
    - title: "Start the client folder"
      ask: "Start a folder for Riverbend Reading Room and bring in their last funded proposal and their 990."
      reply: "Folder started. Two documents imported, each with a checklist to settle."
      doc: "Riverbend Reading Room / README"
      block: "Folder"
      status: "Imported · 3 to check"
    - title: "Draft the need statement"
      ask: "Draft the need statement for the Harbor Trust youth literacy grant from the Proposal Template."
      reply: "Drafted from the template and the boilerplate, 2 claims to check."
      doc: "Harbor Trust proposal / Need statement"
      block: "Callout"
      status: "2 claims to check"
    - title: "Draw the logic model"
      ask: "Draw the logic model for the after-school reading program from the methods section."
      reply: "A flowchart of the logic model is waiting in Review Changes, built only from what the section says."
      doc: "Harbor Trust proposal / Logic model"
      block: "Diagram · Flowchart"
      status: "1 change to review"
    - title: "Check fit and keep"
      ask: "What does the Funder Register say about Harbor Trust's deadline and fit?"
      reply: "Fit is strong and the deadline is in the register, last checked this month."
      doc: "Funder Research Register"
      block: "Register"
      status: "Kept"
    - title: "Director signs off"
      ask: "Open the submission checklist so the executive director can sign."
      reply: "The Approval Card is open. One signature records the submission."
      doc: "Harbor Trust proposal / Submission checklist"
      block: "Approval Card · Sign off"
      status: "Signed off"
    - title: "Publish the update"
      ask: "Publish the boilerplate update to GitHub."
      reply: "I can't publish from Chat. Check visibility first, then choose Publish. Readers will see 1 changed document."
      doc: "Proposal Template by Section"
      block: "Publish · GitHub Repository"
      status: "6 files sent"
minutes: 9
---

You write grants for several nonprofits at once, and every one of them is on a deadline somebody else set. One client needs a letter of inquiry by Friday. Another needs a full proposal with a need statement, a logic model and a budget narrative that explains every line. Your funder research lives in a spreadsheet. Your best paragraphs live in old proposals you search by memory. The method lives in your head.

This page is a blueprint for a Flow Domain that carries that method. It is not built. Only one Domain exists today, [AI Consulting](/domains/ai-consulting/), and its launch story is the walkthrough for every step below. This blueprint is yours to take. Build it from your own method, put your name on it, and launch it as your Domain. If you do, I would like to hear about it.

## The opportunity

The money is there and it is still growing. Americans gave [$617.2 billion](https://candid.org/blogs/philanthropy-trends-giving-usa/) to nonprofits in 2025, up 5.7 percent, and foundations gave $117.15 billion of it. In the 2026 State of Grantseeking survey, [93.5 percent](https://grantstation.com/sites/default/files/imageLibrary/SoG/2026/Key%20Findings%20The%202026%20State%20of%20Grantseeking%20Report.pdf) of organisations applied to private foundations, and the median largest award was $90,000. More than half said one or two people secured that award. One of those people is often you.

AI is already in the work. Instrumentl found drafting proposals is the most common use of AI among grant professionals, at [46 percent](https://www.instrumentl.com/blog/ai-grant-writing). Of those using it, 71 percent said they could write and submit a proposal in under a week. Across the sector, [92 percent](https://virtuous.org/blog/2026-nonprofit-ai-adoption-report/) of nonprofits now use AI in some form. Yet only 7 percent report a major improvement to their mission, and 81 percent use it ad hoc without writing down what works. The tool is in. The method is not written down.

The rules are moving under everyone. The 2024 revision of the Uniform Guidance raised the de minimis indirect rate from [10 to 15 percent](https://neh.gov/grants/manage/2024-Revisions-to-2-CFR-200) for awards issued on or after October 1, 2024. On August 7, 2025, [Executive Order 14332](https://www.whitehouse.gov/presidential-actions/2025/08/improving-oversight-of-federal-grantmaking/) put every new federal funding notice under senior appointee review and told agencies to write them in plain language. Meanwhile [84 percent](https://nff.org/insights/survey-us-nonprofits-at-critical-point-as-funding-for-community-needs-falters/) of nonprofits with government funding expect cuts, which sends more of them to the same foundations. The Bureau of Labor Statistics expects about [10,000 openings](https://www.bls.gov/ooh/business-and-financial/fundraisers.htm) for fundraisers a year, so your method will keep being taught to someone new. And the custom GPT some grant writers loaded with their boilerplate and past proposals [retires on December 11, 2026](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq). A Domain is plain files in your own GitHub. Nobody can retire it.

## The signals

| Figure | Value | Source |
| --- | --- | --- |
| US charitable giving, 2025 | $617.2 billion, up 5.7 percent; foundations gave $117.15 billion, 19 percent of the total | source: [Candid, Key takeaways from Giving USA on 2025 philanthropy trends](https://candid.org/blogs/philanthropy-trends-giving-usa/), published 2026-07-07, checked 2026-10-29 |
| Grantseeking benchmarks, 2025 | 1,354 organisations; 93.5 percent applied to private foundations; median largest award $90,000; 59.1 percent say one or two people secured it; lack of time or staff the top obstacle at 17 percent | source: [GrantStation, The 2026 State of Grantseeking Report](https://grantstation.com/sites/default/files/imageLibrary/SoG/2026/Key%20Findings%20The%202026%20State%20of%20Grantseeking%20Report.pdf), published 2026-04, checked 2026-10-29 |
| US fundraisers | 140,900 jobs in 2025, growing 6 percent to 2035; about 10,000 openings a year; median pay $72,550 | source: [US Bureau of Labor Statistics, Occupational Outlook Handbook](https://www.bls.gov/ooh/business-and-financial/fundraisers.htm), published 2026-08-27, checked 2026-10-29 |
| Grant professionals using AI | Drafting proposals the top use at 46 percent; 71 percent of AI users submit a proposal in under a week; over 300 surveyed | source: [Instrumentl, How Nonprofits Are or Aren't Using AI](https://www.instrumentl.com/blog/ai-grant-writing), published 2024-12-10, checked 2026-10-29 |
| Nonprofits using AI | 92 percent in some form; 7 percent report major mission impact; 81 percent use it ad hoc without documenting what works; 346 surveyed in December 2025 | source: [Virtuous, The 2026 Nonprofit AI Adoption Report](https://virtuous.org/blog/2026-nonprofit-ai-adoption-report/), published 2026-02-16, checked 2026-10-29 |
| Nonprofits expecting government funding cuts | 84 percent of those with government funding; 36 percent ended 2024 in deficit; 2,206 surveyed | source: [Nonprofit Finance Fund, 2025 State of the Nonprofit Sector Survey](https://nff.org/insights/survey-us-nonprofits-at-critical-point-as-funding-for-community-needs-falters/), published 2025-06-17, checked 2026-10-29 |
| Uniform Guidance 2024 revision | De minimis indirect rate 10 to 15 percent; single audit threshold $750,000 to $1 million; awards issued on or after 2024-10-01 | source: [National Endowment for the Humanities, 2024 Revisions to 2 CFR 200](https://neh.gov/grants/manage/2024-Revisions-to-2-CFR-200), published 2024-06-25, checked 2026-10-29 |
| Executive Order 14332 | Signed 2025-08-07; new funding notices need senior appointee approval and plain language; grants must permit termination for convenience | source: [The White House, Improving Oversight of Federal Grantmaking](https://www.whitehouse.gov/presidential-actions/2025/08/improving-oversight-of-federal-grantmaking/), published 2025-08-07, checked 2026-10-29 |

Each figure measures something narrower than it sounds. Surveys count who answered. Vendor research counts a vendor's view. A market estimate is a model. Read them as a direction, not a forecast.

## What your Domain holds

The figure at the top of this page is the folder as it could sit on GitHub. Six Markdown files. Here is what each one does.

**The README** is the front page. It says who the Domain is for, what a reader will have at the end, and the order to read the documents in. A stepped figure shows a funder prospect becoming a submitted proposal. An isometric figure maps the path.

**Funder Fit Method** is where every engagement starts. How you find funders and what goes into the funder research register. Funder, program, deadline, what they gave last year, who the program officer is, and when you last checked. A Register Skill draws it. A Scorecard turns your fit questions into a score a client can see. A Go or no-go form records the decision and the reason.

**Proposal Template by Section** is the backbone. Need statement, goals and objectives, logic model, methods, evaluation plan, budget narrative and sustainability plan, in the order a reviewer reads them. A Workflow Path draws the proposal from the funder's notice on the left to the submitted file on the right. The logic model is a Diagram, so inputs, activities, outputs and outcomes sit in boxes a client can follow. A table holds the question each section must answer.

**Boilerplate Library Standard** is how the client's standard paragraphs are kept honest. Mission, history, each program, the numbers served, the board, the audited financials. Every paragraph lists its sources. A claim nobody has confirmed is marked to check, and Flow counts the marks until you answer them. A Change Summary shows a client what changed in their boilerplate and when.

**Reporting Calendar and Post-Award Report** is what a client forgets until a funder writes. A timeline chart shows every report due to every funder. A submission checklist is an Approval Card, so the executive director signs before anything goes out and the record stays with the proposal. A report intake form collects the outcomes and spending a post-award report needs.

**Worked Example** is a funder register, one full proposal and one post-award report for a made-up client, filled in end to end. A reader learns more from one finished proposal than from ten rules.

## What Flow does for this work

**Chat answers from the folder.** The README carries the questions a reader might ask. What goes in a budget narrative. When is the next report due. An empty Chat offers them as buttons, and every answer links to the document it came from.

**A Register Skill draws the funder research register.** You describe how you track prospects in the Fit Method, and the Skill draws the register from that text. It uses only what the text says and names what is missing. It waits in Review Changes until you keep it.

**A Form records the go or no-go.** The Fit Method ends with a Decide form. The client picks a funder from the register, chooses go or no-go, and writes the reason. Flow records the option and the reason, so it is still there when the funder comes round again.

**A Job keeps the funder's rules current.** Bring a funder's guidelines page in with New from Web Page and choose Follow the source. Each Jobs run reads the page again and brings changes in where you have not edited. The watch says what it found.

**The import checklist settles a client's old files.** A client's last funded proposal comes in from Word, their budget from Excel with its tables kept, and their 990 from PDF. Each gets a short checklist in Sources, and Walk Through with Chat takes the open items one at a time.

**Sources and Change Summary travel with the proposal.** A finished proposal shows what it was made from, and marks a source that changed since. After the yearly boilerplate refresh, the Change Summary on each proposal says which paragraph moved.

**A door for your own agents.** With Flow Pro, Settings opens a door for the Claude Code or Codex you run in Terminal, as Read or Read and propose. Your agent can read the Domain's reading order and propose a draft post-award report. It arrives in Review Changes under the agent's name.

## How you build it in Flow

The [AI Consulting story](/domains/ai-consulting/) walks every one of these steps on a real screen. Follow it with your own material.

1. **Add an empty folder and choose it.** Chat answers from the folder before any document exists. The walkthrough shows it at [an empty folder, and Chat already in it](/domains/ai-consulting/#an-empty-folder-and-chat-already-in-it).
2. **Ask Chat for the README.** Describe who the Domain is for and what you want a reader to have at the end. Chat writes it in your voice and marks every claim it cannot stand behind. See [a front page, in the author's voice](/domains/ai-consulting/#a-front-page-in-the-authors-voice).
3. **Bring in what you already have.** The funder spreadsheet, a funded proposal with the client's name changed, the funder guidelines page you cite most. New from Web Page turns a page or a shared AI chat into a document with its links kept. See [an old AI chat became a reference](/domains/ai-consulting/#an-old-ai-chat-became-a-reference).
4. **Let Ideas pick a Skill.** Press Suggest on your Fit Method document. Ideas reads the sections and names a Skill for each, a Register for the funder list, a Workflow Path for the proposal. A figure or a form waits in Review Changes until you keep it.

![Ideas open beside a README in Flow, offering to run Visual Explainer and Guided Exercise on two sections, each with a sentence on why it fits. Shown on AI Consulting, the only Domain built so far](../../assets/flow/domains/ai-consulting/04-ideas-suggest.webp)

5. **Ask Chat for the next document with your own pages as sources.** The Proposal Template can be written from your Fit Method and the funded proposal you brought in. Repeat until the path is done. See [the next document, from his own pages](/domains/ai-consulting/#the-next-document-from-his-own-pages).
6. **Review every change.** When you merge two sections of the template or rename the register, every page that pointed at it follows. See [Review changed the plan, and the source followed](/domains/ai-consulting/#review-changed-the-plan-and-the-source-followed).

## Apply it to a client job

A Domain is for using, not only reading. Say a small reading program signs you to win its first foundation grant. Open the Domain, start a folder for the client, and drop in their last proposal, their budget and their 990. Ask Chat to score the funders on their list against the Fit Method, then draft the need statement from the Proposal Template and the client's boilerplate. Chat marks every number it cannot stand behind, and you confirm each one from the 990. A Skill draws the logic model from the methods section. The executive director ticks the submission checklist and signs. When the award letter comes, the report dates go into the Reporting Calendar.

When the funder asks a question you did not expect, the answer goes into the Boilerplate Standard, and the lesson goes back into the Fit Method. A new associate can read the Fit Method and the Template on their first day and take a client from prospect to submission the way you would.

## Publish it, and keep it current

When the folder is ready, choose Publish and then GitHub Repository. Flow sends the files and nothing else. A reader brings the Domain in with File, then New from GitHub, and the folder's address. Check the repository's visibility first. Your method can be public while every client's proposals, budgets and 990s stay in their own folder on your Mac.

![Publish open on a Domain in Flow, with GitHub Repository chosen and the note that six files were sent. The preview shows the README as the repository will. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/09-published-to-github.webp)

When a rule changes and you publish again, every reader's copy shows the update as a change they review. They keep their own edits. Nothing is replaced behind their back.

![Flow's update sheet for a Domain a reader brought in, listing the one document that changed and offering Not Now or Update Selected. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/12-update-sheet.webp)

The same source can also become a GitHub Pages site, a PDF, an EPUB, or Word and Excel files for a client's team. Chat on the Domain, and the figures a reader steps through, stay in Flow.

## What it costs

Bringing any Domain into Flow is free on Base. Writing with Chat, and Chat on a Domain, need Flow Pro at $10 a month. Publishing to GitHub needs the Publish add-on too, another $10 a month. There is no fee per Domain, so publish one or twenty for the same price. Any AI you connect follows the terms of that service. Publishing does not bring clients on its own. It gives the clients you earn a living copy of your method.

## Start here

Read the [walkthrough](/domains/ai-consulting/) once, end to end. Then add an empty folder in Flow, name it, and tell Chat in three sentences how you take a client from funder research to a submitted proposal. The README it writes is the first document of your Domain. If you want to talk it through first, the [Domains page](/domains/) has one email address and four questions.
