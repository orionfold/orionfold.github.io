---
title: "A handbook your clients can keep: a blueprint for HR Advisory"
domain: HR Advisory
kind: blueprint
role: HR consultants and fractional people leaders
hook: "Your handbook and policy set, your hiring scorecards, and the compliance calendar your clients ask about."
icon: skill-delegation-map
tint: "#00c0c8"
order: 9
dek: "You write the handbook, run the hiring loop and answer the manager who asks what to do next. The method lives in a Word template, a scorecard spreadsheet and a folder of past emails. This blueprint shows what a Flow Domain for that method would hold, how you would build it with Chat and Skills, and how every client would get the living version. Nothing here is built yet. It is yours to take."
description: "A blueprint for a Flow Domain for HR consultants and fractional people leaders. The employee handbook, hiring scorecards and compliance calendar it would hold."
drafted: "2026-10-29"
release: "3.0"
keywords: ["employee handbook template", "hr policy templates small business", "fractional hr playbook", "structured interview scorecard template", "custom gpt for hr consultants", "hr compliance calendar by state", "onboarding plan template 90 days", "performance review template small business", "workplace investigation procedure template", "compensation bands template"]
blueprint:
  - name: README
    role: "The front page. Who the Domain is for, what a reader will have at the end, and the path through it."
    chips: [["skill-visual-explainer", "Stepped figure"], ["skill-isometric-figure", "Map of the path"]]
  - n: "1"
    name: Handbook and Policy Set
    role: "The handbook as a template, the policies it is made of, the state add-ons, and what switches on at each headcount."
    chips: [["component-table", "Policy set"], ["component-callout", "State add-ons"], ["component-change-summary", "What changed"]]
  - n: "2"
    name: Hiring Method
    role: "The interview loop, the scorecard for each role, who sits on the loop, and the notice you give when a tool helps score."
    chips: [["skill-workflow-path", "Interview loop"], ["skill-scorecard", "Scorecard"], ["component-form", "Rate"]]
  - n: "3"
    name: Onboarding and Review Cycle
    role: "The first 90 days, the check-ins, the review cycle, and the compensation bands that say what a raise is based on."
    chips: [["component-approval-card", "Onboarding checklist"], ["skill-roadmap", "90-day plan"], ["component-chart", "Pay bands"]]
  - n: "4"
    name: Investigations and Compliance Calendar
    role: "How a complaint becomes an investigation with a record, and the calendar of filings, posters and notices by state."
    chips: [["skill-workflow-path", "Investigation steps"], ["component-table", "Calendar"], ["component-sources", "Sources"]]
  - name: Worked Example
    role: "A handbook, a hiring scorecard and an onboarding plan for a made-up client, filled in end to end, with the choices explained."
    chips: [["component-callout", "Worked example"]]
faq:
  - q: "My custom GPT holds my employee handbook template. It retires in December. What do I move it to?"
    a: "A Domain is a folder of plain Markdown files on your own GitHub. Your handbook template, policy set and scorecards become documents in it. Chat answers from those files and says when they do not cover a question. A shared ChatGPT chat can be saved into the folder with its links kept, so the work you did in the GPT is not lost."
  - q: "How do I package my HR consulting method so each client gets their own copy and still gets my updates?"
    a: "You publish the Domain to a GitHub repository and each client brings it in with New from GitHub. When you publish again, Flow tells them an update is waiting and shows what changed, document by document. A document they edited is replaced only if they tick it. Their own staff files stay in their own folder."
  - q: "How do I keep a compliance calendar for clients in four states without redoing it every quarter?"
    a: "New from Web Page turns a state labor department page into a document, with Follow the source switched on. A Job then keeps the calendar table current from those pages and says what it found on each run. On a night when nothing changed it skips. You still review every change before it is kept."
  - q: "What should a structured interview scorecard contain so it holds up if a candidate complains?"
    a: "That is your call as the expert, and the blueprint only gives it a place to live. In Flow the Scorecard Skill draws the scorecard from the competencies your Hiring Method names, and a Rate form records each interviewer's score beside the document. A Decide form records the option chosen and the reason. Whether that record meets a law in a given state is a question for you and counsel."
  - q: "Can an AI answer my clients' manager questions only from my own policies, and say when it does not know?"
    a: "Chat on a Domain searches the folder before each reply and links each fact to the file it came from. When the folder does not say, Chat says so. Chat on a Domain needs Flow Pro at $10 a month. Any model you connect follows the terms of that service."
mock:
  folder: people-method
  client: "Maple Ridge Dental"
  steps:
    - title: "Start the client folder"
      ask: "Start a folder for Maple Ridge Dental and bring in their current handbook and the office manager job description."
      reply: "Two documents added from Word. The handbook has 3 items to check."
      doc: "Maple Ridge Dental handbook (imported)"
      block: "Sources"
      status: "Imported · 3 to check"
    - title: "Ask for the hiring process"
      ask: "Draft the hiring process for the office manager role from the Hiring Method, with a scorecard."
      reply: "Drafted from the Hiring Method, with the stages as a kanban board. 2 claims to check."
      doc: "Office manager hiring process"
      block: "Diagram · Kanban board"
      status: "2 claims to check"
    - title: "Draw the interview loop"
      ask: "Draw the interview loop as a path, with who sits on each interview."
      reply: "Workflow Path drawn in five steps from the process text."
      doc: "Office manager hiring process"
      block: "Workflow Path"
      status: "1 change to review"
    - title: "Review the handbook changes"
      ask: "Show what changed between their old handbook and the new edition."
      reply: "4 sections changed, shown as a diff. The leave policy is new. Keep or revert each."
      doc: "Maple Ridge Dental handbook, 2027 edition"
      block: "Diff"
      status: "4 changes to review"
    - title: "Sign off onboarding"
      ask: "Add the first 90 days as a checklist the practice owner signs."
      reply: "Approval Card added with 9 items and a signature line."
      doc: "Onboarding plan, first 90 days"
      block: "Approval Card · Sign off"
      status: "Waiting for signature"
    - title: "Update the calendar"
      ask: "Add this year’s filing dates to the Compliance Calendar."
      reply: "Added the dates as a calendar heatmap, one cell per day. It waits in Review Changes."
      doc: "Compliance Calendar by State"
      block: "Chart · Calendar heatmap"
      status: "1 change to review"
minutes: 9
---

You write the handbook for a dental group and the hiring loop for a builder. You answer the manager who asks whether a warning has to be in writing. A complaint lands on a Friday and you run the investigation the way you always have. The method is yours, and it works. It lives in a Word template, a scorecard spreadsheet and a compliance calendar you rebuild every January. And in a folder of past emails you search when a client asks the same thing again.

This page is a blueprint for a Flow Domain that carries that method. It is not built. [AI Consulting](/domains/ai-consulting/) is a Domain that exists today, and its launch story is the walkthrough for every step below. This blueprint is yours to take. Build it from your own know-how, put your name on it, and launch it as your Domain. If you do, I would like to hear about it.

## The opportunity

HR consulting in the US is a large, flat market. It brings in about [$29.0 billion a year](https://www.ibisworld.com/united-states/market-size/human-resources-consulting/1423/) and grew 1.4 percent in 2026. The Bureau of Labor Statistics counts [939,700 human resources specialists](https://www.bls.gov/ooh/business-and-financial/human-resources-specialists.htm) and expects about 73,700 openings a year to 2035. Paychex found that [34 percent of leaders](https://www.paychex.com/articles/human-resources/business-leader-priorities-2025) at companies with 5 to 499 employees spend more than 10 hours a week on HR administration, at an average cost of $171,997 a year.

AI has reached the HR function, but unevenly. SHRM found that [39 percent of organizations](https://www.shrm.org/topics-tools/news/ai-hr-2026-from-hype-to-measured-human-centered-impact) use AI in HR, and 60 percent of the largest do. Only about [1 in 3 small organizations](https://www.shrm.org/executive-network/insights/real-impact-of-ai-hr-march-2026-en-insights-forum-recap) have, and just 2 percent use it for compliance. Most of the use is in recruiting, at 27 percent, which is where the new laws land. SHRM counted 19 states with AI workplace laws and found that [57 percent of HR professionals in those states](https://www.shrm.org/topics-tools/news/ai-hr-2026-from-hype-to-measured-human-centered-impact) did not know about them. Meanwhile [92 percent of CHROs](https://www.shrm.org/about/press-room/what-will-work-look-like-in-2026--new-shrm-research-reveals-how-) expect more AI in workforce operations this year.

The rules now have dates. Colorado's rewritten AI law, [SB 26-189](https://www.hrdive.com/news/revamped-colorado-ai-law-targets-consequential-hr-decisions/820425/), applies to hiring and pay decisions made on or after January 1, 2027. An employer must give notice when a tool helps decide, explain its role within 30 days of an adverse decision, and keep records for three years. Pay transparency keeps spreading. [Virginia](https://www.sixfifty.com/resource-library/pay-transparency-laws-by-state/) requires a pay range in every posting from July 1, 2026, Maine from July 29, 2026, and Connecticut from October 1, 2026. Each date is a handbook refresh and a calendar entry for every client. And the custom GPT some consultants loaded their handbook into [retires on December 11, 2026](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq). A Domain is plain files in your own GitHub. Nobody can retire it.

## The signals

| Figure | Value | Source |
| --- | --- | --- |
| US human resources consulting revenue, 2026 | About $29.0 billion, up 1.4 percent; 0.4 percent a year since 2021 | source: [IBISWorld, Human Resources Consulting in the US](https://www.ibisworld.com/united-states/market-size/human-resources-consulting/1423/), published 2026, checked 2026-10-29 |
| US human resources specialists | 939,700 jobs in 2025, growing 6 percent to 2035; about 73,700 openings a year; median pay $75,940 | source: [US Bureau of Labor Statistics, Occupational Outlook Handbook](https://www.bls.gov/ooh/business-and-financial/human-resources-specialists.htm), published 2026-08-27, checked 2026-10-29 |
| Organizations using AI in HR | 39 percent; 60 percent at 5,000 or more employees; recruiting first at 27 percent; 57 percent of HR professionals in the 19 states with AI workplace laws unaware of them | source: [SHRM, The State of AI in HR 2026](https://www.shrm.org/topics-tools/news/ai-hr-2026-from-hype-to-measured-human-centered-impact), published 2026-04-08, checked 2026-10-29 |
| Small organizations using AI in HR | About 1 in 3; only 2 percent of organizations use AI in compliance; 7 of the top 10 HR uses are in recruiting | source: [SHRM Executive Network, The Real Impact of AI in HR](https://www.shrm.org/executive-network/insights/real-impact-of-ai-hr-march-2026-en-insights-forum-recap), published 2026-03-30, checked 2026-10-29 |
| CHRO and HR professional outlook for 2026 | 92 percent of CHROs expect greater AI integration; 57 percent expect more work on reducing bias in AI hiring tools; 72 percent of HR professionals say workers expect more of employers | source: [SHRM, 2026 State of the Workplace and CHRO Priorities](https://www.shrm.org/about/press-room/what-will-work-look-like-in-2026--new-shrm-research-reveals-how-), published 2026-01-08, checked 2026-10-29 |
| Small-business leaders' time on HR administration | 34 percent spend more than 10 hours a week; average cost $171,997 a year; companies with 5 to 499 employees | source: [Paychex, 2025 Priorities for Business Leaders](https://www.paychex.com/articles/human-resources/business-leader-priorities-2025), published 2024-10-04, checked 2026-10-29 |
| Colorado AI law for hiring and pay decisions | SB 26-189 signed May 14, 2026; applies to decisions on or after January 1, 2027; notice, an explanation within 30 days, three-year records, human review on request | source: [HR Dive, Revamped Colorado AI law targets consequential HR decisions](https://www.hrdive.com/news/revamped-colorado-ai-law-targets-consequential-hr-decisions/820425/), published 2026-05-15, checked 2026-10-29 |
| New pay transparency laws in 2026 | Virginia from July 1, 2026; Maine from July 29, 2026 at 10 or more employees; Connecticut from October 1, 2026 | source: [SixFifty, Pay Transparency Laws by State](https://www.sixfifty.com/resource-library/pay-transparency-laws-by-state/), published 2026-09, checked 2026-10-29 |

Each figure measures something narrower than it sounds. Surveys count who answered. Vendor research counts a vendor's view. A market estimate is a model. Read them as a direction, not a forecast.

## What your Domain holds

The figure at the top of this page is the folder as it could sit on GitHub. Six Markdown files. Here is what each one does.

**The README** is the front page. It says who the Domain is for, what a reader will have at the end, and the order to read the documents in. Its front matter carries the questions a manager asks you most, so an empty Chat offers them as buttons. A stepped figure shows a policy becoming a handbook page. An isometric figure maps the path.

**Handbook and Policy Set** is the backbone. The handbook as a template and the policies it is made of. A table lists every policy with who it applies to and the headcount it switches on at. A callout per state holds the add-ons. A Change Summary shows what moved since the last edition.

**Hiring Method** is the loop. Who sits on each interview, what each one asks, and the scorecard for the role. A Workflow Path draws the loop from job description to offer. The Scorecard Skill draws the scorecard from the competencies the role names, and a Rate form lets each interviewer score beside the document. The notice you give when a tool helps score is a section of its own.

**Onboarding and Review Cycle** is the first 90 days and everything after. An Approval Card holds the onboarding checklist, so the owner ticks it, signs it, and the record stays with the hire. A Roadmap Skill draws the 90-day plan. A chart shows the compensation bands, floor to ceiling.

**Investigations and Compliance Calendar** is the part clients call about on a Friday. A Workflow Path draws the investigation from complaint to written record. A table holds the calendar of filings, posters, training and notices by state. Sources shows which state page each row came from and marks a source that changed.

**Worked Example** is a handbook, a hiring scorecard and an onboarding plan for a made-up client, filled in end to end, with the choices explained. One finished handbook teaches more than ten rules about handbooks.

## What Flow does for this work

**Chat answers manager questions from your policies.** A client's manager asks whether a verbal warning needs a record. Chat searches the Domain, answers from the Handbook and Policy Set, and links the policy it used. When your folder does not say, Chat says so instead of guessing.

**A Skill draws the scorecard.** Select the competencies in the Hiring Method and run the Scorecard Skill. It draws the scorecard from what the text says and names anything the text leaves out. A Workflow Path does the same for the investigation, complaint on the left and written record on the right.

**A Form records the hiring decision.** A Rate form on the scorecard records each interviewer's score beside the document. A Decide form at the end of the loop records which candidate was chosen and the reason. Those entries are a record in your own file. Whether they meet a state's notice and record rules is your call, with counsel.

**A Job keeps the calendar current.** Bring a state labor department page in with New from Web Page and choose Follow the source. A Job then keeps the calendar table current from those pages and says what it found on each run. On a night when no page changed, it skips.

**The import checklist catches what a client's Word file hides.** A client sends their old handbook in Word and a pay sheet in Excel. Each comes in as a document, and the Sources tab lists what to check first. Tables to compare with the original, a licence, pictures with no description. Walk Through with Chat takes them one at a time.

**Sources and Change Summary travel with the handbook.** When you hand a client their 2027 edition, Change Summary shows what changed and on which day. Sources shows what each section was made from and flags a state page that moved since. Both print as plain text on a published page.

## How you build it in Flow

The [AI Consulting story](/domains/ai-consulting/) walks every one of these steps on a real screen. Follow it with your own material.

1. **Add an empty folder and choose it.** Chat answers from the folder before any document exists. The walkthrough shows it at [an empty folder, and Chat already in it](/domains/ai-consulting/#an-empty-folder-and-chat-already-in-it).
2. **Ask Chat for the README.** Describe who the Domain is for and what you want a reader to have at the end. Chat writes it in your voice and marks every claim it cannot stand behind. See [a front page, in the author's voice](/domains/ai-consulting/#a-front-page-in-the-authors-voice).
3. **Bring in what you already have.** The handbook template in Word, the scorecard spreadsheet, the state labor page you cite most. New from Web Page turns a page or a shared AI chat into a document with its links kept. See [an old AI chat became a reference](/domains/ai-consulting/#an-old-ai-chat-became-a-reference).
4. **Let Ideas pick a Skill.** Press Suggest on your Hiring Method. Ideas reads the sections and names a Skill for each, a Workflow Path for the interview loop, a Scorecard for the competencies. A figure or a form waits in Review Changes until you keep it.

![Ideas open beside a README in Flow, offering to run Visual Explainer and Guided Exercise on two sections, each with a sentence on why it fits. Shown on AI Consulting, the only Domain built so far](../../assets/flow/domains/ai-consulting/04-ideas-suggest.webp)

5. **Ask Chat for the next document with your own pages as sources.** The Onboarding and Review Cycle can be written from your Hiring Method and a past onboarding plan with the names changed. Repeat until the path is done. See [the next document, from his own pages](/domains/ai-consulting/#the-next-document-from-his-own-pages).
6. **Review every change.** When you merge two policies or rename a document, every page that pointed at it follows. See [Review changed the plan, and the source followed](/domains/ai-consulting/#review-changed-the-plan-and-the-source-followed).

## Apply it to a client job

A Domain is for using, not only reading. Say a made-up dental practice, Maple Ridge Dental, hires you to fix its handbook and fill an office manager role. Open the Domain, start a folder for the client, and drop their old handbook and the job description in from Word. Ask Chat to draft the new edition from the Handbook and Policy Set and to mark every line it is unsure about. Then ask for the hiring process from the Hiring Method. The Scorecard Skill draws the scorecard and each interviewer rates with the form. The Onboarding and Review Cycle gives the owner a 90-day checklist to sign.

When the practice asks a question you had to look up, the answer goes into the client's folder and the lesson goes back into the Domain. A new state date becomes a row in the Compliance Calendar. A junior consultant can read the Handbook and Policy Set on their first day and run their first engagement the way you would.

## Publish it, and keep it current

When the folder is ready, choose Publish and then GitHub Repository. Flow sends the files and nothing else. A reader brings the Domain in with File, then New from GitHub, and the folder's address. Check the repository's visibility first. Your method can be public while every client's handbook, pay sheet and investigation record stays in their own folder on your Mac.

![Publish open on a Domain in Flow, with GitHub Repository chosen and the note that six files were sent. The preview shows the README as the repository will. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/09-published-to-github.webp)

When a rule changes and you publish again, every reader's copy shows the update as a change they review. They keep their own edits. Nothing is replaced behind their back.

![Flow's update sheet for a Domain a reader brought in, listing the one document that changed and offering Not Now or Update Selected. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/12-update-sheet.webp)

The same source can also become a GitHub Pages site, a PDF, an EPUB, or Word and Excel files for a client's team. Chat on the Domain, and the figures a reader steps through, stay in Flow.

## What it costs

Bringing any Domain into Flow is free on Base. Writing with Chat, and Chat on a Domain, need Flow Pro at $10 a month. Publishing to GitHub needs the Publish add-on too, another $10 a month. There is no fee per Domain, so publish one or twenty for the same price. Any AI you connect follows the terms of that service. Publishing does not bring clients on its own. It gives the clients you earn a living copy of your method.

## Start here

Read the [walkthrough](/domains/ai-consulting/) once, end to end. Then add an empty folder in Flow, name it, and describe your HR method to Chat in three sentences. Who your clients are, what you hand them first, and what they call you about after. The README it writes is the first document of your Domain. If you want to talk it through first, the [Domains page](/domains/) has one email address and four questions.
