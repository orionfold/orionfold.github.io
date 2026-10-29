---
title: "A redline your client can read: a blueprint for Contract Review"
domain: Contract Review
kind: blueprint
role: "Lawyers and contract specialists who review agreements for clients"
hook: "Your issues list, your clause playbook with its fallbacks, and the redline memo your clients actually read."
icon: skill-option-comparison
tint: "#00b8d8"
order: 8
dek: "You read other people's paper for a living. A vendor MSA on Monday, SaaS terms on Tuesday, an NDA an hour before a call. Your playbook lives in a Word file and in your head, and every memo starts from a blank page. This blueprint shows what a Flow Domain for that method would hold, how you would build it with Chat and Skills, and how every client would get the living version. Nothing here is built yet. It is yours to take."
description: "A contract review blueprint for a Flow Domain. The issues list, clause playbook and redline memo it would hold, the signals behind it, and how to build it."
drafted: "2026-10-29"
release: "3.0"
keywords: ["contract review checklist template", "clause playbook template", "contract playbook", "contract negotiation playbook", "legal custom gpt alternative", "contract review knowledge base", "redline summary memo template", "fallback positions playbook", "msa review checklist", "contract risk rating template"]
blueprint:
  - name: README
    role: "The front page. Who the Domain is for, what a reader will have at the end, and the path through it."
    chips: [["skill-visual-explainer", "Stepped figure"], ["skill-isometric-figure", "Map of the path"]]
  - n: "1"
    name: Issues List Method
    role: "How you read a draft, in what order, and what earns a place on the issues list before the redline starts."
    chips: [["skill-workflow-path", "Workflow"], ["component-table", "Issues list"], ["component-callout", "Marked to check"]]
  - n: "2"
    name: Clause Playbook
    role: "For each clause, the wording you ask for, the fallbacks you accept in order, and the point where the client walks."
    chips: [["component-table", "Playbook table"], ["skill-option-comparison", "Positions compared"], ["component-callout", "Walk-away"]]
  - n: "3"
    name: Redline Memo Guide
    role: "How a finished redline becomes a memo a business owner reads in five minutes, with a risk rating and a decision to make."
    chips: [["skill-scorecard", "Risk rating"], ["skill-visual-explainer", "Stepped figure"], ["component-form", "Decide form"]]
  - n: "4"
    name: Closing and Obligations Register
    role: "What must be true before signatures, and the dates and duties that live on after them."
    chips: [["component-approval-card", "Closing checklist"], ["skill-register", "Obligations register"]]
  - name: Worked Example
    role: "A vendor MSA for a made-up client, reviewed end to end, from issues list to signed closing checklist, with the choices explained."
    chips: [["component-callout", "Worked example"]]
faq:
  - q: "I have a clause playbook in a Word file with fallback positions. How do I turn it into something my clients can use without me on every call?"
    a: "Bring the Word file into Flow and it becomes a document with its tables kept. Ask Chat to split it into the Playbook and the Memo Guide, and mark what it cannot stand behind. Publish the folder to GitHub, and a client brings it in with New from GitHub. Chat on the Domain answers their question from your pages and says when the pages do not say."
  - q: "My custom GPT holds my contract review checklist and my playbook. It retires in December. What do I move it to?"
    a: "A Domain is plain Markdown files in a GitHub repository you own. Save the GPT's shared chat as a document with its links kept, or paste its knowledge files in as Word or PDF. The method lives in files you can read, edit and publish again. Nobody can retire it."
  - q: "Is it ethical to run a client's contract through an AI tool, and what do I have to tell the client?"
    a: "Ask your bar. ABA Formal Opinion 512 names competence, confidentiality, communication and fees as the duties in play. Flow shows a Leaves this Mac sheet before a run leaves your Mac and says what goes where. Stays on this Mac keeps a run local, and every change waits in Review Changes until you keep it."
  - q: "Does the client's contract have to leave my Mac for Chat to read it?"
    a: "Not by default. Before any run leaves your Mac, Flow shows what goes and where, and asks. A pin picks one model, and Stays on this Mac keeps the run local. Any AI you connect follows the terms of that service, so read them the way you would read a vendor's DPA."
  - q: "What does it cost to publish one Domain for my clients?"
    a: "Bringing any Domain into Flow is free on Base. Writing with Chat, and Chat on a Domain, need Flow Pro at $10 a month. Publishing to GitHub needs the Publish add-on too, another $10 a month. There is no fee per Domain, so publish one or twenty for the same price."
mock:
  folder: contract-review-method
  client: "Larkspur Robotics"
  steps:
    - title: "Start the client folder"
      ask: "Start a folder for Larkspur Robotics and bring in the vendor's MSA from Word."
      reply: "The MSA is in as a document. Tables kept. 3 items to check before you rely on it."
      doc: "Vendor MSA, imported"
      block: "Folder"
      status: "Imported · 3 to check"
    - title: "Ask for the issues list"
      ask: "Read the MSA against the Clause Playbook and draft the issues list."
      reply: "Issues list drafted, 11 ranked. The redline shows as a Diff against the vendor’s draft. 2 claims to check."
      doc: "Issues list"
      block: "Diff"
      status: "2 claims to check"
    - title: "Compare the fallbacks"
      ask: "Compare our three positions on the liability cap for the memo."
      reply: "Option Comparison drawn from the Playbook. Waiting in Review Changes."
      doc: "Redline memo"
      block: "Option Comparison"
      status: "1 change to review"
    - title: "Rate the risk and keep"
      ask: "Rate the whole agreement the way the Memo Guide says."
      reply: "Scorecard drawn. Medium, driven by the cap and the auto-renewal."
      doc: "Redline memo"
      block: "Scorecard"
      status: "Kept"
    - title: "Client decides"
      ask: "Add the decide form so the client picks accept, push back, or walk."
      reply: "Decide form added under the rating. The reason is recorded with it."
      doc: "Redline memo"
      block: "Form · Decide"
      status: "Decision recorded"
    - title: "Sign off the closing"
      ask: "Open the closing checklist for the signed MSA."
      reply: "Checklist ready. Tick, type your name, press Sign off."
      doc: "Closing checklist"
      block: "Approval Card · Sign off"
      status: "Signed off"
minutes: 9
---

You read other people's paper for a living. A vendor MSA lands on Monday. That is the master agreement that sets the terms for everything after it. SaaS terms land on Tuesday, and an NDA an hour before a call. You read each one the same way, build the issues list, mark the redline, and write the client a memo that says what matters and what to do. Your playbook, the wording you ask for and the fallbacks you accept for every clause, lives in a Word file you last cleaned up two years ago. The rest lives in your head and in the margin comments of old redlines.

This page is a blueprint for a Flow Domain that carries that method. It is not built. Only one Domain exists today, [AI Consulting](/domains/ai-consulting/), and its launch story is the walkthrough for every step below. This blueprint is yours to take. Build it from your own know-how, put your name on it, and launch it as your Domain. If you do, I would like to hear about it.

## The opportunity

The legal market is large, and contract work is where the value leaks. US law firms bring in about [$422 billion a year](https://www.ibisworld.com/united-states/industry/law-firms/1389/), and the Bureau of Labor Statistics counts [863,700 lawyers](https://www.bls.gov/ooh/legal/lawyers.htm) with about 28,700 openings a year through 2035. On the client side, World Commerce and Contracting finds that poor contracting erodes [almost 9 percent of annual revenue](https://info.worldcc.com/contract-management-aug-2025) at the average business. Almost 90 percent of business users find contracts hard or impossible to understand. The memo you write is the part they can understand.

AI arrived in the profession faster than the method to use it. Thomson Reuters found organizations using generative AI went from [22 to 40 percent](https://www.thomsonreuters.com/en/institute/reports/2026-ai-in-professional-services-report) in a year, and only 18 percent track whether it pays. Among legal organizations, active use went from [14 to 26 percent](https://www.thomsonreuters.com/en/press-releases/2025/april/from-incubation-to-integration-generative-ai-adoption-nearly-doubles-as-professional-services-reach-crossroads), and 48 percent of law firms had no formal policy. Clio found only [8 percent of solo practitioners and 4 percent of small firms](https://www.clio.com/about/press/legal-trends-solo-small-law-firms-2025/) had adopted AI widely, while over 80 percent of legal professionals expected their use to grow. The tools are in. What most reviewers do not have is their playbook written down where a tool, a client or a new hire can read it.

Clients and regulators are both moving. Almost [one-third of corporate legal professionals](https://www.thomsonreuters.com/en-us/posts/legal/future-of-professionals-law-firms-paper-2026) say they are reconsidering outside firms that cannot show AI-enabled value within a year. The ABA issued [Formal Opinion 512](https://www.americanbar.org/news/abanews/aba-news-archives/2024/07/aba-issues-first-ethics-guidance-ai-tools/) on July 29, 2024, its first ethics opinion on generative AI, and it turns on four old duties. Competence, confidentiality, communication, and reasonable fees. And the custom GPT some reviewers loaded their playbook into [retires on December 11, 2026](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq). A Domain is plain files in your own GitHub. Nobody can retire it.

## The signals

| Figure | Value | Source |
| --- | --- | --- |
| US law firm revenue, 2026 | About $422.4 billion, projected up 8.1 percent | source: [IBISWorld, Law Firms in the US](https://www.ibisworld.com/united-states/industry/law-firms/1389/), published 2026-07, checked 2026-10-29 |
| US lawyers | 863,700 jobs in 2025, growing 5 percent to 2035; about 28,700 openings a year | source: [US Bureau of Labor Statistics, Occupational Outlook Handbook](https://www.bls.gov/ooh/legal/lawyers.htm), published 2026-08-27, checked 2026-10-29 |
| Value lost to poor contracting | Almost 9 percent of annual revenue on average; best performers about 3 percent, worst 15 percent or more; 39 percent believe their contracts are effective | source: [World Commerce and Contracting, Contract Management: An Overlooked Driver of Business Agility and Financial Performance](https://info.worldcc.com/contract-management-aug-2025), published 2025-08, checked 2026-10-29 |
| Organizations using generative AI, professional services | 40 percent in 2026, up from 22 percent; 18 percent track return on investment | source: [Thomson Reuters Institute, 2026 AI in Professional Services Report](https://www.thomsonreuters.com/en/institute/reports/2026-ai-in-professional-services-report), published 2026, checked 2026-10-29 |
| Legal organizations actively using generative AI | 26 percent in 2025, up from 14 percent in 2024; 48 percent of law firms lack a formal policy | source: [Thomson Reuters, Generative AI adoption nearly doubles as professional services reach crossroads](https://www.thomsonreuters.com/en/press-releases/2025/april/from-incubation-to-integration-generative-ai-adoption-nearly-doubles-as-professional-services-reach-crossroads), published 2025-04-15, checked 2026-10-29 |
| Corporate legal clients and outside firms | Almost one-third reconsidering firms that cannot show AI-enabled value within 12 months; more than one-third of professionals use unapproved AI | source: [Thomson Reuters Institute, Future of Professionals Report 2026, law firms paper](https://www.thomsonreuters.com/en-us/posts/legal/future-of-professionals-law-firms-paper-2026), published 2026-07-21, checked 2026-10-29 |
| Solo and small firms with wide AI adoption | 8 percent of solo practitioners, 4 percent of small firms; over 80 percent expect AI use to increase | source: [Clio, 2025 Legal Trends for Solo and Small Law Firms](https://www.clio.com/about/press/legal-trends-solo-small-law-firms-2025/), published 2025-05-08, checked 2026-10-29 |
| First ABA ethics opinion on generative AI | Formal Opinion 512, 15 pages, on competence, confidentiality, communication and fees | source: [American Bar Association, ABA issues first ethics guidance on a lawyer's use of AI tools](https://www.americanbar.org/news/abanews/aba-news-archives/2024/07/aba-issues-first-ethics-guidance-ai-tools/), published 2024-07-29, checked 2026-10-29 |

Each figure measures something narrower than it sounds. Surveys count who answered. Vendor research counts a vendor's view. A market estimate is a model. Read them as a direction, not a forecast.

## What your Domain holds

The figure at the top of this page is the folder as it could sit on GitHub. Six Markdown files. Here is what each one does.

**The README** is the front page. It says who the Domain is for, what a reader will have at the end, and the order to read the documents in. A stepped figure shows a draft becoming a memo. An isometric figure maps the path.

**Issues List Method** is the backbone. How you read a draft, in what order, and what earns a place on the issues list before the redline starts. A Workflow Path draws the read, with the draft on the left and the ranked issues list on the right. The list is a table. What you have not confirmed is marked to check, and Flow counts the marks until you clear them.

**Clause Playbook** is the method most reviewers keep in their head. For each clause, the wording you ask for, the fallbacks you accept in order, and the point where the client walks. It is a table, one row per clause. An Option Comparison Skill draws the positions side by side when a client needs to see why the second fallback is still fine. A callout holds the walk-away, so nobody misses it.

**Redline Memo Guide** is the craft. How a finished redline becomes a memo a business owner reads in five minutes. What goes first, what to leave out, and how to say a liability cap is bad without a lecture. A Scorecard Skill draws the risk rating from the clauses that drive it. A stepped figure shows how the memo is built from the issues list. A Decide form lets the client choose accept, push back, or walk, and records the reason beside the memo.

**Closing and Obligations Register** is what must be true before signatures, and what lives on after them. The closing checklist is an Approval Card. You tick it, type your name, press Sign off, and the record stays with the deal. A Register Skill draws the obligations after signing, with renewal dates, notice windows and who owes what.

**Worked Example** is a vendor MSA for a made-up client, reviewed end to end, from issues list to signed closing checklist, with the choices explained. A reader learns more from one finished review than from ten rules.

## What Flow does for this work

**Chat answers from the Playbook, not from the internet.** An empty Chat offers four of the README's questions as buttons. "What is our fallback on a liability cap?" Chat searches the folder, answers from the passages it finds, and links each answer to the page it came from. When the Playbook does not say, Chat says so.

**A Skill draws the risk rating you already give.** Select the memo's rating section and run Scorecard. It draws the rating from the clauses the text names and nothing else. Option Comparison does the same for the fallbacks on a cap, three positions in one figure a client can hold up.

**A Decide form records the client's call.** Under the memo sits a form with one button. The client picks accept, push back, or walk, and types the reason. Flow records the option and the reason beside the memo.

**A Job keeps your ethics section current.** Bring your bar's generative AI guidance page in with New from Web Page and choose Follow the source. The Memo Guide holds a short section on what you tell clients about tools and billing, and a Job keeps it current from that source. When the guidance changes, the next run redrafts the section and waits for your review.

**Bring In All reads a model clause set in one go.** When a trade body publishes its model clauses chapter by chapter, Flow offers Bring In All and reads them into a new folder with a README in the author's order. Your Playbook can then cite the model wording by page.

**A client's Word or PDF comes in with a checklist beside it.** The vendor's MSA arrives in Word. Bring it in and its tables stay tables. The Sources tab lists what to settle before you rely on it. Walk Through with Chat takes the items one at a time.

**Sources and Change Summary show the client what the memo was made from.** A memo built from the Playbook, the issues list and the client's draft carries a Sources element that lists all three and marks any that changed since. A Change Summary shows what moved on the second turn, who changed it and which day. The client sees the method behind the memo.

## How you build it in Flow

The [AI Consulting story](/domains/ai-consulting/) walks every one of these steps on a real screen. Follow it with your own material.

1. **Add an empty folder and choose it.** Chat answers from the folder before any document exists. The walkthrough shows it at [an empty folder, and Chat already in it](/domains/ai-consulting/#an-empty-folder-and-chat-already-in-it).
2. **Ask Chat for the README.** Describe who the Domain is for and what you want a reader to have at the end. Chat writes it in your voice and marks every claim it cannot stand behind. See [a front page, in the author's voice](/domains/ai-consulting/#a-front-page-in-the-authors-voice).
3. **Bring in what you already have.** The playbook Word file from two years ago, a past redline memo with the client's name changed, the bar guidance page you cite in engagement letters. New from Web Page turns a page or a shared AI chat into a document with its links kept. See [an old AI chat became a reference](/domains/ai-consulting/#an-old-ai-chat-became-a-reference).
4. **Let Ideas pick a Skill.** Press Suggest on your Issues List Method. Ideas reads the sections and names a Skill for each, a Workflow Path for the read, a Register for the obligations after signing. A figure or a form waits in Review Changes until you keep it.

![Ideas open beside a README in Flow, offering to run Visual Explainer and Guided Exercise on two sections, each with a sentence on why it fits. Shown on AI Consulting, the only Domain built so far](../../assets/flow/domains/ai-consulting/04-ideas-suggest.webp)

5. **Ask Chat for the next document with your own pages as sources.** The Redline Memo Guide can be written from your Playbook and three past memos. Repeat until the path is done. See [the next document, from his own pages](/domains/ai-consulting/#the-next-document-from-his-own-pages).
6. **Review every change.** When you merge two fallbacks or rename a document, every page that pointed at it follows. See [Review changed the plan, and the source followed](/domains/ai-consulting/#review-changed-the-plan-and-the-source-followed).

## Apply it to a client job

A Domain is for using, not only reading. Larkspur Robotics, a made-up client, sends you a vendor's MSA. Start a folder for Larkspur in the Domain and bring the Word file in. Ask Chat to read it against the Clause Playbook and draft the issues list the way the Issues List Method says, with every clause it is unsure about marked to check. Run Option Comparison on the liability cap, draft the memo from the Redline Memo Guide, run Scorecard on the rating, and add the Decide form. Larkspur picks push back, with the reason. After the third turn the cap lands on your second fallback, the closing checklist gets signed, and the Register holds the renewal date and the notice window.

Then the lesson goes back into the Domain. The vendor's wording on breach notice was better than your fallback, so the Playbook gets a row. A new associate can read the Method and the Playbook on their first day and review their first NDA the way you would. That is the training problem answered one person at a time.

## Publish it, and keep it current

When the folder is ready, choose Publish and then GitHub Repository. Flow sends the files and nothing else. A reader brings the Domain in with File, then New from GitHub, and the folder's address. Check the repository's visibility first. Your method can be public while every client's draft, redline and memo stays in their own folder on your Mac.

![Publish open on a Domain in Flow, with GitHub Repository chosen and the note that six files were sent. The preview shows the README as the repository will. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/09-published-to-github.webp)

When a rule changes and you publish again, every reader's copy shows the update as a change they review. They keep their own edits. Nothing is replaced behind their back.

![Flow's update sheet for a Domain a reader brought in, listing the one document that changed and offering Not Now or Update Selected. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/12-update-sheet.webp)

The same source can also become a GitHub Pages site, a PDF, an EPUB, or Word and Excel files for a client's team. Chat on the Domain, and the figures a reader steps through, stay in Flow.

## What it costs

Bringing any Domain into Flow is free on Base. Writing with Chat, and Chat on a Domain, need Flow Pro at $10 a month. Publishing to GitHub needs the Publish add-on too, another $10 a month. There is no fee per Domain, so publish one or twenty for the same price. Any AI you connect follows the terms of that service. Publishing does not bring clients on its own. It gives the clients you earn a living copy of your method.

## Start here

Read the [walkthrough](/domains/ai-consulting/) once, end to end. Then add an empty folder in Flow, name it, and describe how you review a contract to Chat in three sentences. What you read first, what goes on the issues list, and what the memo must say. The README it writes is the first document of your Domain. If you want to talk it through first, the [Domains page](/domains/) has one email address and four questions.
