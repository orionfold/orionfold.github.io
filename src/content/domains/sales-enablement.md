---
title: "A sales method that outlasts you: a blueprint for Sales Enablement"
domain: Sales Enablement
kind: blueprint
role: Fractional sales leaders and enablement consultants
hook: "Your ideal customer profile, your discovery call guide, and the deal scorecard your reps run each week."
icon: skill-path-card
tint: "#216b40"
order: 14
dek: "You walk into a company that sells by accident and leave it selling on purpose. The ideal customer profile, the discovery call guide, the deal scorecard and the weekly pipeline review live in your kickoff deck and in the heads of the reps you trained. When the engagement ends, the slides stay and the habit fades. This blueprint shows what a Flow Domain for that method would hold, how you would build it with Chat and Skills, and how every client would get the living version. Nothing here is built yet. It is yours to take."
description: "A blueprint for a Flow Domain carrying a sales enablement playbook for fractional sales leaders. What it holds, the signals behind it, how to build it."
drafted: "2026-10-29"
release: "3.0"
keywords: ["sales playbook template", "sales enablement framework", "discovery call guide template", "deal review scorecard", "custom gpt for sales teams alternative", "battlecard template", "ideal customer profile template", "meddicc qualification checklist", "sales onboarding plan template", "pipeline review cadence"]
blueprint:
  - name: README
    role: "The front page. Who the Domain is for, what a reader will have at the end, and the path through it."
    chips: [["skill-visual-explainer", "Stepped figure"], ["skill-isometric-figure", "Map of the path"]]
  - n: "1"
    name: Ideal Customer and Qualification
    role: "Who you sell to, who you walk away from, and the checks a deal must pass before it is called real."
    chips: [["component-table", "ICP table"], ["skill-scorecard", "Qualification scorecard"]]
  - n: "2"
    name: Discovery Call Guide
    role: "The questions a rep asks in order, what a good answer sounds like, and how a new rep practices before a live call."
    chips: [["skill-workflow-path", "Call flow"], ["skill-guided-exercise", "Role play"], ["component-approval-card", "Ramp checklist"]]
  - n: "3"
    name: Deal Review and Pipeline Cadence
    role: "The scorecard every deal review runs, the weekly pipeline agenda, and what moves a deal from one stage to the next."
    chips: [["skill-scorecard", "Deal scorecard"], ["component-form", "Deal review form"], ["skill-register", "Pipeline register"]]
  - n: "4"
    name: Objection Library and Battlecards
    role: "Every common objection with the answer that has worked, and one page per competitor that stays current."
    chips: [["component-table", "Objection table"], ["skill-option-comparison", "Battlecard"], ["component-sources", "Sources"]]
  - name: Worked Example
    role: "A made-up client taken from first lost-deal note to a signed ramp checklist, with the choices explained."
    chips: [["component-callout", "Worked example"]]
faq:
  - q: "How do I turn my sales playbook into something my client's reps actually use after I leave?"
    a: "Publish the Domain to GitHub and the client brings it into Flow with New from GitHub. Their reps ask Chat from the Domain and get answers linked to your Discovery Call Guide and your scorecard, not to memory. When you improve the method and publish again, every reader sees the update as a change they review. The habit stays because the document stays."
  - q: "My team built a custom GPT for discovery calls. What do we do when custom GPTs retire?"
    a: "OpenAI retires custom GPTs on December 11, 2026. A Domain is a different shape. It is plain Markdown files in your own GitHub, and Chat on it in Flow answers from those files and links each fact to its source. A shared ChatGPT chat can be saved as a document with its links kept, so the work you put into the GPT is not lost."
  - q: "Can an AI score a deal against MEDDICC from the rep's call notes without making things up?"
    a: "The Scorecard Skill draws from what the notes say and names what is missing rather than guessing. If no economic buyer is named, the card says so. Chat marks any claim it cannot stand behind, and the document counts those marks until you resolve them. Every drawn card waits in Review Changes before it is kept."
  - q: "How do I keep competitor battlecards current when their pricing page changes?"
    a: "Bring the competitor's page in with New from Web Page and choose Follow the source. A Job can keep the pricing table on the battlecard current from that page, and each run asks only for its rows. On a week with no change it skips without calling a model. Sources on the battlecard marks a source that changed since the card was written."
  - q: "Does my client's pipeline data leave my Mac if I use AI on it?"
    a: "The client's deals live in that client's folder on your Mac. Before any run leaves the Mac, Flow shows what goes and where and asks. Stays on this Mac keeps a run local. Publishing is a separate step you take yourself, and it sends only the Domain's files, never a client's pipeline."
mock:
  folder: sales-method
  client: "Harbor Lantern Software"
  steps:
    - title: "Start the client folder"
      ask: "Start a folder for Harbor Lantern and bring in their last twelve lost-deal notes from Word."
      reply: "Added 12 documents. Names and dates came across. 3 items to check before you rely on them."
      doc: "Lost-deal notes, imported"
      block: "Folder"
      status: "Imported · 3 to check"
    - title: "Draft the customer profile"
      ask: "Draft Harbor Lantern's ideal customer profile from the Ideal Customer and Qualification guide and these notes."
      reply: "Drafted the profile with a quadrant chart of the twelve lost deals. Nine fall outside the profile. 2 claims marked to check."
      doc: "Ideal Customer Profile, Harbor Lantern"
      block: "Chart · Quadrant"
      status: "2 claims to check"
    - title: "Score the open deals"
      ask: "Run Scorecard on the three deals in the pipeline register against the qualification checks."
      reply: "Scorecard drawn. One deal has no economic buyer named, so that row says missing. It waits in Review Changes."
      doc: "Deal Review, week 3"
      block: "Scorecard"
      status: "1 change to review"
    - title: "Keep it and log the risk"
      ask: "Keep the scorecard and mark the Brightwater deal at risk in the pipeline register."
      reply: "Kept. The register row shows at risk, with today's date and the owner."
      doc: "Pipeline Register"
      block: "Register"
      status: "Kept · 1 open check"
    - title: "Sign off the ramp"
      ask: "Open the new rep's 30-day ramp checklist from the Discovery Call Guide for sign off."
      reply: "Checklist open as an Approval Card. Four of six items ticked. It is waiting for a name."
      doc: "Rep Onboarding, 30-day checklist"
      block: "Approval Card · Sign off"
      status: "Waiting for sign off"
    - title: "Publish the new objection"
      ask: "Publish the Domain with the new price objection to GitHub."
      reply: "I can't publish from Chat. Check the repository's visibility and the 1 open mark first, then choose Publish."
      doc: "Objection Library and Battlecards"
      block: "Publish · GitHub Repository"
      status: "6 files sent"
minutes: 9
---

You walk into a company that sells by accident and your job is to leave it selling on purpose. In the first month you write the ideal customer profile. Then the discovery call guide, the deal review scorecard, the weekly pipeline review, the objection library and a battlecard for each competitor. You train the reps, sit in on calls, and run the Monday pipeline meeting until they can run it without you. The method lives in your kickoff deck, in a Notion page nobody opens after month three, and in your head.

This page is a blueprint for a Flow Domain that carries that method. It is not built. Only one Domain exists today, [AI Consulting](/domains/ai-consulting/), and its launch story is the walkthrough for every step below. This blueprint is yours to take. Build it from your own know-how, put your name on it, and launch it as your Domain. If you do, I would like to hear about it.

## The opportunity

Spending on packaged sales know-how is growing fast. The sales enablement platform market was about [$4.21 billion in 2025](https://www.mordorintelligence.com/industry-reports/sales-enablement-platform-market) and is modelled to reach $12.35 billion by 2031. The two largest vendors in that market, Highspot and Seismic, became [one company under the Seismic name](https://www.highspot.com/en-au/seismic-merger/) in August 2026. A playbook inside a vendor's platform has an owner who can change.

The people who run the method are many and the coaching is thin. The Bureau of Labor Statistics counts [650,100 sales managers](https://www.bls.gov/ooh/management/sales-managers.htm) in 2025, with about 47,300 openings a year, and [1,571,400 wholesale and manufacturing sales representatives](https://www.bls.gov/ooh/sales/wholesale-and-manufacturing-sales-representatives.htm), with about 123,400 openings a year. Salesforce's survey of 4,050 sales professionals found [87 percent of sales organizations use some form of AI](https://www.salesforce.com/news/stories/state-of-sales-report-announcement-2026/). Yet sellers spend only 40 percent of their time selling, 46 percent rarely get feedback on their calls, and 47 percent do not get enough roleplay. The tools are in. The written method that makes coaching possible is not.

The fractional model is how that coaching reaches small companies. Vendux puts the number of fractional sales leaders in the US and Canada at [approaching 9,000](https://www.vendux.org/proven-by-the-numbers), on assignments that average 9.7 months at $11,732 a month. Each one leaves a method behind and knows how fast it fades. Gartner found [69 percent of B2B buyers](https://www.gartner.com/en/newsroom/press-releases/2026-05-20-gartner-survey-finds-sixty-nine-percent-of-b-two-b-buyers-turn-to-sales-reps-to-validate-ai-generated-insights) prefer to validate AI-generated insights with a sales rep, so what the rep says on the call matters more, not less. The FCC's consent revocation rules took effect on [April 11, 2025](https://www.fcc.gov/document/tcpa-rules-revoking-consent-unwanted-robocallsrobotexts), so a rep who texts a prospect after they said stop is now a legal problem. And the custom GPT some teams built to hold their discovery questions [retires on December 11, 2026](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq). A Domain is plain files in your own GitHub. Nobody can retire it.

## The signals

| Figure | Value | Source |
| --- | --- | --- |
| Sales enablement platform market | $4.21 billion in 2025, $5.04 billion in 2026, modelled at $12.35 billion by 2031; SMEs the fastest growing segment | source: [Mordor Intelligence, Sales Enablement Platform Market Size and Share](https://www.mordorintelligence.com/industry-reports/sales-enablement-platform-market), published 2026-09-11, checked 2026-10-29 |
| US sales managers | 650,100 jobs in 2025, growing 4 percent to 2035; about 47,300 openings a year | source: [US Bureau of Labor Statistics, Occupational Outlook Handbook, Sales Managers](https://www.bls.gov/ooh/management/sales-managers.htm), published 2026-08-27, checked 2026-10-29 |
| US wholesale and manufacturing sales representatives | 1,571,400 jobs in 2025, little or no change to 2035; about 123,400 openings a year | source: [US Bureau of Labor Statistics, Occupational Outlook Handbook, Wholesale and Manufacturing Sales Representatives](https://www.bls.gov/ooh/sales/wholesale-and-manufacturing-sales-representatives.htm), published 2026-08-27, checked 2026-10-29 |
| AI use and coaching gaps in sales teams | 87 percent of sales organizations use some form of AI; sellers spend 40 percent of time selling; 46 percent rarely get feedback on calls; 47 percent lack roleplay; 4,050 surveyed | source: [Salesforce, State of Sales report, seventh edition](https://www.salesforce.com/news/stories/state-of-sales-report-announcement-2026/), published 2026-02-03, checked 2026-10-29 |
| B2B buyers who validate AI insights with a rep | 69 percent; 645 buyers surveyed August to September 2025 | source: [Gartner, Survey Finds 69% of B2B Buyers Turn to Sales Reps to Validate AI-Generated Insights](https://www.gartner.com/en/newsroom/press-releases/2026-05-20-gartner-survey-finds-sixty-nine-percent-of-b-two-b-buyers-turn-to-sales-reps-to-validate-ai-generated-insights), published 2026-05-20, checked 2026-10-29 |
| Fractional sales leaders, US and Canada | Approaching 9,000; assignments average 9.7 months; $11,732 a month or $225 an hour; based on over 1,000 assignments | source: [Vendux, Proven by the Numbers, 2025 State of Fractional Sales Leadership Report](https://www.vendux.org/proven-by-the-numbers), published 2026-01, checked 2026-10-29 |
| TCPA consent revocation rules | Effective April 11, 2025; a stop, cancel or unsubscribe by any reasonable method must be honoured | source: [FCC, Public Notice DA-24-1068, Effective Date for TCPA Rules on Revoking Consent](https://www.fcc.gov/document/tcpa-rules-revoking-consent-unwanted-robocallsrobotexts), published 2024-10-11, checked 2026-10-29 |
| Highspot and Seismic merger | Complete; Highspot and Seismic are one company under the Seismic name | source: [Highspot, Highspot and Seismic merger](https://www.highspot.com/en-au/seismic-merger/), published 2026-08-18, checked 2026-10-29 |

Each figure measures something narrower than it sounds. Surveys count who answered. Vendor research counts a vendor's view. A market estimate is a model. Read them as a direction, not a forecast.

## What your Domain holds

The figure at the top of this page is the folder as it could sit on GitHub. Six Markdown files. Here is what each one does.

**The README** is the front page. It says who the Domain is for, what a reader will have at the end, and the order to read the documents in. A stepped figure shows a lead becoming a qualified deal. An isometric figure maps the path.

**Ideal Customer and Qualification** is where selling on purpose starts. Who you sell to, by size, industry and the problem they have. Who you walk away from. Then the checks a deal must pass before it is called real. MEDDICC is one such set, seven checks that run from the buyer's metrics to the competition. Or use your own. An ICP table holds the profile. A Scorecard Skill draws the qualification checks so a rep can score a deal against them.

**Discovery Call Guide** is the craft. The questions a rep asks in order, and what a good answer sounds like. A Workflow Path draws the call from first question to next step. A Guided Exercise lets a new rep practice it as a form before a live call. The 30-day ramp checklist is an Approval Card, so the record of who signed off a new rep stays with the rep.

**Deal Review and Pipeline Cadence** is the Monday meeting written down. The scorecard every deal review runs and what moves a deal to the next stage. A Scorecard Skill draws the deal scorecard. A Form takes the rep's answers and records the forecast decision with its reason. A Register Skill draws the pipeline, one row per deal, with an owner, a stage and when it was last reviewed.

**Objection Library and Battlecards** is what the rep reaches for on the call. Every common objection with the answer that has worked, in a table. One page per competitor, drawn by Option Comparison, with where they win, where you win and what to say. Every claim about a competitor links to its source, and what you have not confirmed is marked until you answer it.

**Worked Example** is a made-up client taken from the first lost-deal note to a signed ramp checklist, with the choices explained. A reader learns more from one finished deal review than from ten rules.

## What Flow does for this work

**Chat answers from your Guide and your Library.** With the Domain chosen, Chat searches your documents before it replies and links each fact to its file. A rep asks *What do I say when they want a discount before the demo?* and the answer comes from the Objection Library, with the row named. When your documents are silent, Chat says so.

**Scorecard draws the deal review.** Select a rep's notes on a deal and run the Scorecard Skill against the qualification checks. It scores each check from what the notes say and names what is missing rather than guessing. No economic buyer named means the row says so. The card waits in Review Changes until you keep it.

**A Form records the review decision.** The Deal Review document ends in a Form. The deal, the stage, the next step, a date, and one of three options for the forecast. Its button is **Decide**, so the option and the reason are recorded beside the document with the manager's name and the day.

**A Job keeps a battlecard current.** Bring a competitor's pricing page in with New from Web Page and choose *Follow the source*. A Job keeps the pricing table on the battlecard current from that page, and each run asks only for its rows. On a quiet week it skips without calling a model. Sources on the battlecard marks a source that changed since the card was written.

**A client's old material comes in with a checklist.** The lost-deal notes in Word, the pipeline export from Excel, the kickoff deck in PowerPoint. Each comes in as a document and tables stay tables. A short checklist sits beside each one in the Sources tab, and the ribbon says *Imported · 3 to check* until you settle it. Walk Through with Chat takes the items one at a time.

**Your agents can propose the profile.** With Flow Pro, Settings ▸ General ▸ Your agents opens the folder to the Claude Code or Codex you run in Terminal. It can read the Qualification guide and the lost-deal notes and propose an ideal customer profile, which lands in Review Changes under its name. You decide what the client's reps read.

## How you build it in Flow

The [AI Consulting story](/domains/ai-consulting/) walks every one of these steps on a real screen. Follow it with your own material.

1. **Add an empty folder and choose it.** Chat answers from the folder before any document exists. The walkthrough shows it at [an empty folder, and Chat already in it](/domains/ai-consulting/#an-empty-folder-and-chat-already-in-it).
2. **Ask Chat for the README.** Describe who the Domain is for and what you want a reader to have at the end. Chat writes it in your voice and marks every claim it cannot stand behind. See [a front page, in the author's voice](/domains/ai-consulting/#a-front-page-in-the-authors-voice).
3. **Bring in what you already have.** The kickoff deck from your last engagement with the client's name removed, the shared ChatGPT chat where you worked out your objection answers. New from Web Page turns a page or a shared AI chat into a document with its links kept. See [an old AI chat became a reference](/domains/ai-consulting/#an-old-ai-chat-became-a-reference).
4. **Let Ideas pick a Skill.** Press Suggest on your Discovery Call Guide. Ideas reads the sections and names a Skill for each, a Workflow Path for the call, a Guided Exercise for the practice section. A figure or a form waits in Review Changes until you keep it.

![Ideas open beside a README in Flow, offering to run Visual Explainer and Guided Exercise on two sections, each with a sentence on why it fits. Shown on AI Consulting, the only Domain built so far](../../assets/flow/domains/ai-consulting/04-ideas-suggest.webp)

5. **Ask Chat for the next document with your own pages as sources.** The Deal Review and Pipeline Cadence can be written from your Qualification guide and the deck you brought in. Repeat until the path is done. See [the next document, from his own pages](/domains/ai-consulting/#the-next-document-from-his-own-pages).
6. **Review every change.** When you merge two qualification checks or rename a document, every page that pointed at it follows. See [Review changed the plan, and the source followed](/domains/ai-consulting/#review-changed-the-plan-and-the-source-followed).

## Apply it to a client job

A Domain is for using, not only reading. On the first day of an engagement, open the Domain, start a folder for the client and bring in their lost-deal notes and pipeline export. Ask Chat to draft the client's ideal customer profile from the Qualification guide and those notes. In week two, run Scorecard on each open deal from the reps' call notes. The Deal Review form takes their answers before Monday. When a rep hears an objection the Library does not cover, the answer goes into the Library, and the question that found it goes back into the Discovery Call Guide. The next engagement starts from what you learned.

A new rep can read the Qualification guide and the Discovery Call Guide on their first day. They practice the call as an exercise on their second, and sign their 30-day checklist the way you would. That is the ramp problem answered one rep at a time.

## Publish it, and keep it current

When the folder is ready, choose Publish and then GitHub Repository. Flow sends the files and nothing else. A reader brings the Domain in with File, then New from GitHub, and the folder's address. Check the repository's visibility first. Your method can be public while every client's pipeline, call notes and deal reviews stay in their own folder on your Mac.

![Publish open on a Domain in Flow, with GitHub Repository chosen and the note that six files were sent. The preview shows the README as the repository will. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/09-published-to-github.webp)

When a rule changes and you publish again, every reader's copy shows the update as a change they review. They keep their own edits. Nothing is replaced behind their back.

![Flow's update sheet for a Domain a reader brought in, listing the one document that changed and offering Not Now or Update Selected. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/12-update-sheet.webp)

The same source can also become a GitHub Pages site, a PDF, an EPUB, or Word and Excel files for a client's team. Chat on the Domain, and the figures a reader steps through, stay in Flow.

## What it costs

Bringing any Domain into Flow is free on Base. Writing with Chat, and Chat on a Domain, need Flow Pro at $10 a month. Publishing to GitHub needs the Publish add-on too, another $10 a month. There is no fee per Domain, so publish one or twenty for the same price. Any AI you connect follows the terms of that service. Publishing does not bring clients on its own. It gives the clients you earn a living copy of your method.

## Start here

Read the [walkthrough](/domains/ai-consulting/) once, end to end. Then add an empty folder in Flow, name it, and describe your sales method to Chat in three sentences. The README it writes is the first document of your Domain. If you want to talk it through first, the [Domains page](/domains/) has one email address and four questions.
