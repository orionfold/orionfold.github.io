---
title: "A method the sponsor can read: a blueprint for Executive Coaching"
domain: Executive Coaching
kind: blueprint
role: Executive and leadership coaches
hook: "Your engagement method, the feedback and development plan it produces, and the close-out your sponsor reads."
icon: skill-scorecard
tint: "#b08900"
order: 6
dek: "You run coaching engagements with a method. Intake, stakeholder interviews, a development plan, sessions, check-ins and a close-out report. The method lives in your head, a proposal you copy each time, and a custom GPT you fed your worksheets. Your clients get sessions. They do not get the method. This blueprint shows what a Flow Domain for that method would hold, how you would build it with Chat and Skills, and how every client would get the living version. Nothing here is built yet. It is yours to take."
description: "A blueprint for a Flow Domain for executive and leadership coaches. Your coaching framework template, the development plan, and how to build it in Flow."
drafted: "2026-10-29"
release: "3.0"
keywords: ["coaching framework template", "custom gpt for coaches", "coaching knowledge base", "leadership development plan template", "executive coaching intake form", "360 feedback template", "grow model template", "coaching engagement plan", "stakeholder interview questions coaching", "custom gpt alternative for coaches"]
blueprint:
  - name: README
    role: "The front page. Who the Domain is for, what a reader will have at the end, and the path through it."
    chips: [["skill-visual-explainer", "Stepped figure"], ["skill-isometric-figure", "Map of the path"]]
  - n: "1"
    name: Engagement Method
    role: "The stages of one engagement from chemistry call to close-out, who owns each, and what the sponsor sees at every stage."
    chips: [["skill-workflow-path", "Workflow"], ["component-approval-card", "Three-way agreement"]]
  - n: "2"
    name: Stakeholder Feedback Guide
    role: "How you run interviews and a 360, the questions you ask, and how the answers become three themes a leader can act on."
    chips: [["component-form", "Interview form"], ["component-table", "Themes table"], ["component-callout", "Marked to check"]]
  - n: "3"
    name: Development Plan Standard
    role: "How a plan is written, two or three goals with behaviours and measures, and how progress is scored at each check-in."
    chips: [["skill-scorecard", "Scorecard"], ["component-table", "Plan template"]]
  - n: "4"
    name: Sessions and Close-out Record
    role: "The session shape, the commitments register, and the close-out report that goes to the sponsor without the session content."
    chips: [["skill-register", "Commitments"], ["component-change-summary", "Progress since"], ["component-sources", "Sources"]]
  - name: Worked Example
    role: "A full engagement for a made-up leader, from intake to close-out report, with the choices explained."
    chips: [["component-callout", "Worked example"]]
faq:
  - q: "How do I turn my coaching method into something a client can use between sessions without losing the coach in it?"
    a: "Write the method as a folder of plain documents and publish it to GitHub. A client brings the folder into Flow for free and asks Chat about it between sessions. Chat answers only from what the folder says, and says so when the folder does not say. The sessions stay yours."
  - q: "My custom GPT holds my coaching framework. What happens when GPTs retire, and where should the method live instead?"
    a: "OpenAI has scheduled custom GPTs to retire on December 11, 2026. A Domain is Markdown files in a GitHub repository you own, so nothing can switch it off. Flow can bring a shared ChatGPT conversation in as a document with its links kept, which is one way to rescue what you taught the GPT."
  - q: "Can you write a leadership development plan from this stakeholder feedback summary without sending the client's name anywhere?"
    a: "Flow shows a Leaves this Mac sheet before any run goes out, listing what goes and where, and a run can be kept local with Stays on this Mac. The leader's files sit in their own folder on your Mac. Only the method is published."
  - q: "How do I write a close-out report for a sponsor that shows progress but keeps what the leader said in sessions private?"
    a: "The Sessions and Close-out Record in this blueprint keeps session notes and the sponsor report as separate documents. Chat drafts the report from the development plan and the progress scores, not from the notes. Sources on the report lists what it was made from, so you can check that before it goes out."
  - q: "What does the ICF say about using AI in coaching, and what do I have to disclose to a client?"
    a: "The ICF Code of Ethics in effect since April 1, 2025 makes you accountable for any technology system you use, including AI, under Standard 2.5. The ICF also published an AI Coaching Framework and Standards in November 2024. A Domain can carry the Code as an imported page that a Job keeps current, so your disclosure wording always matches the live text."
mock:
  folder: engagement-method
  client: "Halvard Lantern Logistics"
  steps:
    - title: "Start the client folder"
      ask: "Start a folder for the Halvard Lantern VP of Operations and bring in the sponsor's Word brief and my intake notes."
      reply: "Folder ready. 2 documents in, 3 items to check on the brief."
      doc: "Intake summary"
      block: "Folder"
      status: "Imported · 3 to check"
    - title: "Ask for the feedback themes"
      ask: "Draft the stakeholder feedback summary from these eight interview notes, using the Feedback Guide."
      reply: "Four themes drafted from 8 notes. 2 claims to check."
      doc: "Stakeholder feedback summary"
      block: "Table"
      status: "2 claims to check"
    - title: "Draw the plan scorecard"
      ask: "Run Scorecard on the three goals and their measures in the development plan."
      reply: "Scorecard drawn from the plan's measures. Waiting in Review Changes."
      doc: "Development plan"
      block: "Scorecard"
      status: "1 change to review"
    - title: "Rate progress at the check-in"
      ask: "Add the check-in form so the leader rates each goal out of five."
      reply: "Form added under the plan. Its button is Rate, so each score is recorded beside the document with the leader’s name."
      doc: "Development plan"
      block: "Form · Rate"
      status: "Rated 4 of 5"
    - title: "Sign the three-way agreement"
      ask: "Add the agreement checklist so the leader, the sponsor and I can each sign off."
      reply: "Approval Card added with 6 items and a signature line."
      doc: "Coaching agreement"
      block: "Approval Card · Sign off"
      status: "Ready to sign"
    - title: "Publish the method update"
      ask: "I changed the check-in cadence in the Method. Publish the Domain to GitHub."
      reply: "I can't publish from Chat. Visibility and 1 open check mark to look at first, then choose Publish."
      doc: "Engagement Method"
      block: "Publish · GitHub Repository"
      status: "6 files sent"
minutes: 9
---

You run engagements, not sessions. An engagement starts with a chemistry call and an intake form. Then come stakeholder interviews or a 360, which is feedback gathered from the people around the leader. Then a feedback summary, a development plan the sponsor signs, six to twelve sessions, a mid-point check-in, and a close-out report. Every session has a shape, GROW or something like it, and ends in a commitment you write down. The method is yours and it works. It lives in your head, in a proposal you copy each time, and in a custom GPT you fed your best questions.

This page is a blueprint for a Flow Domain that carries that method. It is not built. [AI Consulting](/domains/ai-consulting/) is a Domain that exists today, and its launch story is the walkthrough for every step below. This blueprint is yours to take. Build it from your own know-how, put your name on it, and launch it as your Domain. If you do, I would like to hear about it.

## The opportunity

Coaching is growing, and so are its buyers. The International Coaching Federation (ICF) counts [122,974 coach practitioners](https://coachingfederation.org/blog/coaching-industry-continues-global-growth-with-5-34-billion-usd-revenue-new-research-reveals/) worldwide, up 15 percent since 2023, and puts revenue at $5.34 billion, up [17 percent](https://coachingfederation.org/blog/global-coaching-industry-surpasses-5-34-billion-as-emerging-markets-drive-growth/) on 2023. US business coaching alone is about [$20 billion](https://www.ibisworld.com/united-states/market-size/business-coaching/1533/) a year. Inside companies, the Bureau of Labor Statistics expects [6 percent](https://www.bls.gov/ooh/management/training-and-development-managers.htm) more training and development managers by 2035. Each one is a sponsor who will ask what your method is.

The profession has been slow to put its method into tools. Only [19 percent](https://coachingfederation.org/blog/global-coaching-industry-surpasses-5-34-billion-as-emerging-markets-drive-growth/) of coaches invested in new technology such as AI in the past year. The coaches who do use AI use it daily. In a survey of [205 coaching professionals](https://arxiv.org/abs/2502.14632), 36.1 percent used generative AI several times a day and another 36.1 percent every day. [80 percent](https://coachingfederation.org/resource/2026-icf-global-coaching-study-executive-summary/) of the public want coaching to stay human-led, while nearly three quarters expect technology to play a part. That is the shape of a Domain. The method is written down. The coach stays in the room.

The rules caught up in 2025. The ICF Code of Ethics in effect since [April 1, 2025](https://coachingfederation.org/ethics/code-of-ethics) holds you accountable for every technology system you use, and it names artificial intelligence. [29,354 ACC, 27,035 PCC and 2,800 MCC](https://coachingfederation.org/wp-content/uploads/2026/08/icf-cs-exam-pass-rates.pdf) credential-holders signed that Code. And the custom GPT many coaches built to hold their framework [retires on December 11, 2026](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq). A Domain is plain files in your own GitHub. Nobody can retire it.

## The signals

| Figure | Value | Source |
| --- | --- | --- |
| Coach practitioners and revenue, global | 122,974 practitioners, up 15 percent since 2023; $5.34 billion revenue | source: [ICF, 2025 Global Coaching Study announcement](https://coachingfederation.org/blog/coaching-industry-continues-global-growth-with-5-34-billion-usd-revenue-new-research-reveals/), published 2025-09-16, checked 2026-10-29 |
| Coaches investing in new technology | 19 percent in the past year; 53 percent have no digital platform in their service; revenue up 17 percent on 2023 | source: [ICF, Global coaching industry surpasses $5.34 billion](https://coachingfederation.org/blog/global-coaching-industry-surpasses-5-34-billion-as-emerging-markets-drive-growth/), published 2026-04-28, checked 2026-10-29 |
| What the public wants from coaching | 80 percent prefer human-led coaching; nearly three quarters expect technology to play a moderate or major part | source: [ICF, 2026 Global Coaching Study executive summary](https://coachingfederation.org/resource/2026-icf-global-coaching-study-executive-summary/), published 2026-10-23, checked 2026-10-29 |
| How coaches who use generative AI use it | 205 surveyed; 36.1 percent several times a day, 36.1 percent daily; top use is researching topics | source: [Haase, Augmenting Coaching with GenAI (arXiv 2502.14632)](https://arxiv.org/abs/2502.14632), published 2025-02-20, checked 2026-10-29 |
| Active ICF credential-holders, Dec 31, 2025 | 29,354 ACC; 27,035 PCC; 2,800 MCC; PCC-MCC Exam starts November 10, 2026 | source: [ICF, Annual Exam Pass Rate Statistics](https://coachingfederation.org/wp-content/uploads/2026/08/icf-cs-exam-pass-rates.pdf), published 2026-08-20, checked 2026-10-29 |
| US training and development managers | 50,200 jobs in 2025, growing 6 percent to 2035; about 4,100 openings a year | source: [US Bureau of Labor Statistics, Occupational Outlook Handbook](https://www.bls.gov/ooh/management/training-and-development-managers.htm), published 2026-08-27, checked 2026-10-29 |
| US business coaching revenue, 2026 | About $20.0 billion, up 2.9 percent | source: [IBISWorld, Business Coaching in the US](https://www.ibisworld.com/united-states/market-size/business-coaching/1533/), published 2026, checked 2026-10-29 |
| ICF Code of Ethics names AI | In effect April 1, 2025; Standard 2.5 covers technology-assisted tools, software and artificial intelligence | source: [ICF, Code of Ethics](https://coachingfederation.org/ethics/code-of-ethics), published 2025-04-01, checked 2026-10-29 |

Each figure measures something narrower than it sounds. Surveys count who answered. Vendor research counts a vendor's view. A market estimate is a model. Read them as a direction, not a forecast.

## What your Domain holds

The figure at the top of this page is the folder as it could sit on GitHub. Six Markdown files. Here is what each one does.

**The README** is the front page. It says who the Domain is for, what a reader will have at the end, and the order to read the documents in. A stepped figure shows an intake becoming a close-out report. An isometric figure maps the path.

**Engagement Method** is the backbone. The stages of one engagement from chemistry call to close-out, who owns each, and what the sponsor sees at every stage. A Workflow Path draws it, intake on the left, close-out report on the right. The three-way agreement is an Approval Card. The leader, the sponsor and you sign off, and the signed record stays with the engagement.

**Stakeholder Feedback Guide** is the craft of listening on a leader's behalf. How you run interviews or a 360, and how the answers become three themes a leader can act on without hearing who said what. An interview form holds the questions. A themes table holds the result. A theme only one person raised is marked to check, and Flow counts the marks until you resolve them.

**Development Plan Standard** is how a plan is written. Two or three goals, the behaviours that would show each one, how progress is measured, and the check-in dates. A plan template holds the shape. A Scorecard Skill draws the goals and their measures, so the leader and the sponsor read the same picture.

**Sessions and Close-out Record** keeps the session shape and the commitments register apart from the sponsor report. The Register Skill lists every commitment, who made it, and when it was last checked. Change Summary on the close-out report shows what moved since the mid-point. Sources shows it was written from the plan and the scores, not from the session notes.

**Worked Example** is a full engagement for a made-up leader, from intake to close-out report, with the choices explained. One finished engagement teaches more than ten rules.

## What Flow does for this work

**Chat answers from the folder.** Choose the Domain in the sidebar and Chat reads from it before every reply. The README can carry up to six questions, and an empty Chat offers four as buttons. "What does the sponsor see, and what stays private?" Each answer links to the file it came from. When the folder does not say, Chat says so.

**A Skill draws the development plan.** Select the goals in a leader's plan and run Scorecard. It draws each goal with its measure and names what the text does not give instead of guessing. The figure waits in Review Changes until you keep it. Run Workflow Path on the Method and the whole engagement sits on one page.

**A form takes the intake.** The intake form has a line of text for each question, a day for the start date, and a choice of focus areas. Its button is Submit, so every entry is recorded beside the document. At each check-in a second form asks the leader to Rate progress on each goal out of five.

**A Job keeps the Code current.** Bring the ICF Code of Ethics page in with New from Web Page and choose Follow the source. Each Jobs run reads the page again and brings changes into the section you have not edited. When the ICF changes a word on what you must disclose about AI, your Domain says the same word.

**Bring In All for a standard that comes as pages.** A competency model or an assessment manual is often published as a set of pages. Flow offers to bring all of them in and writes a README that lists them in the author's order. Your Domain can then cite the standard by section.

**A checklist before you rely on a sponsor's file.** A sponsor sends a Word brief, a PDF 360 report and an Excel sheet of dates. Each comes in as a document, tables kept as tables, with a short list in the Sources tab. Whom to credit, what was left out, tables to compare with the source. Walk Through with Chat takes them one at a time.

**Sources and Change Summary on the close-out report.** A sponsor report is a document the sponsor can question. Sources lists what it was made from and marks any source that changed since. Change Summary says what changed lately and on which day. Both print as plain rows on a published page.

## How you build it in Flow

The [AI Consulting story](/domains/ai-consulting/) walks every one of these steps on a real screen. Follow it with your own material.

1. **Add an empty folder and choose it.** Chat answers from the folder before any document exists. The walkthrough shows it at [an empty folder, and Chat already in it](/domains/ai-consulting/#an-empty-folder-and-chat-already-in-it).
2. **Ask Chat for the README.** Describe who the Domain is for and what you want a reader to have at the end. Chat writes it in your voice and marks every claim it cannot stand behind. See [a front page, in the author's voice](/domains/ai-consulting/#a-front-page-in-the-authors-voice).
3. **Bring in what you already have.** The intake form you email, your interview guide, a past plan with the names changed. New from Web Page turns a page or a shared AI chat into a document with its links kept, which is how the custom GPT comes home. See [an old AI chat became a reference](/domains/ai-consulting/#an-old-ai-chat-became-a-reference).
4. **Let Ideas pick a Skill.** Press Suggest on your Method document. Ideas reads the sections and names a Skill for each, a Workflow Path for the engagement, a Scorecard for the plan. A figure or a form waits in Review Changes until you keep it.

![Ideas open beside a README in Flow, offering to run Visual Explainer and Guided Exercise on two sections, each with a sentence on why it fits. Shown on AI Consulting, the only Domain built so far](../../assets/flow/domains/ai-consulting/04-ideas-suggest.webp)

5. **Ask Chat for the next document with your own pages as sources.** The Development Plan Standard can be written from your Method and your past plans. Repeat until the path is done. See [the next document, from his own pages](/domains/ai-consulting/#the-next-document-from-his-own-pages).
6. **Review every change.** When you merge two stages or rename a document, every page that pointed at it follows. See [Review changed the plan, and the source followed](/domains/ai-consulting/#review-changed-the-plan-and-the-source-followed).

## Apply it to a client job

A Domain is for using, not only reading. A sponsor at Halvard Lantern Logistics, a made-up company, asks you to coach a new VP of Operations. Open the Domain, start a folder for the leader, and drop the sponsor's brief in. Ask Chat to draft the feedback summary from your eight interview notes, using the Feedback Guide, and to mark every theme only one person raised. Ask it to draft the development plan from the summary and the Standard, then run Scorecard on the goals. Add the three-way agreement as an Approval Card and sign it with the leader and the sponsor. Before any run leaves your Mac, Flow shows what goes and asks. At the end, Chat drafts the close-out report from the plan and the scores, and Sources shows it came from nothing else.

When a sponsor asks a question your Method did not answer, the answer goes into the Method. The next engagement starts from what you learned. An associate coach can read the Method and the Guide on day one and run an engagement the way you would.

## Publish it, and keep it current

When the folder is ready, choose Publish and then GitHub Repository. Flow sends the files and nothing else. A reader brings the Domain in with File, then New from GitHub, and the folder's address. Check the repository's visibility first. Your method can be public while every leader's feedback, plan and session notes stay in their own folder on your Mac.

![Publish open on a Domain in Flow, with GitHub Repository chosen and the note that six files were sent. The preview shows the README as the repository will. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/09-published-to-github.webp)

When a rule changes and you publish again, every reader's copy shows the update as a change they review. They keep their own edits. Nothing is replaced behind their back.

![Flow's update sheet for a Domain a reader brought in, listing the one document that changed and offering Not Now or Update Selected. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/12-update-sheet.webp)

The same source can also become a GitHub Pages site, a PDF, an EPUB, or Word and Excel files for a sponsor's team. Chat on the Domain, and the figures a reader steps through, stay in Flow.

## What it costs

Bringing any Domain into Flow is free on Base. Writing with Chat, and Chat on a Domain, need Flow Pro at $10 a month. Publishing to GitHub needs the Publish add-on too, another $10 a month. There is no fee per Domain, so publish one or twenty for the same price. Any AI you connect follows the terms of that service. Publishing does not bring clients on its own. It gives the clients you earn a living copy of your method.

## Start here

Read the [walkthrough](/domains/ai-consulting/) once, end to end. Then add an empty folder in Flow, name it, and describe your engagement to Chat in three sentences. Who the leader and the sponsor are, what happens between intake and close-out, and what stays private. The README it writes is the first document of your Domain. If you want to talk it through first, the [Domains page](/domains/) has one email address and four questions.
