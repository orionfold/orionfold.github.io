---
title: "A risk register your clients can read: a blueprint for Cybersecurity Advisory"
domain: Cybersecurity Advisory
kind: blueprint
role: "Virtual CISOs and security consultants"
hook: "Your assessment method, the policies and risk register that follow it, and the board report that explains it."
icon: skill-roadmap
tint: "#ad7c5a"
order: 7
dek: "You are the security leader for ten or twenty companies that cannot hire one. You assess each against NIST CSF 2.0 or CIS Controls, write the policies, keep the risk register, and explain it all to a board in twenty minutes. The method is yours. It lives in a folder of templates, a spreadsheet and a custom GPT. This blueprint shows what a Flow Domain for that method would hold, how you would build it with Chat and Skills, and how every client would get the living version. Nothing here is built yet. It is yours to take."
description: "A blueprint for a Flow Domain for vCISOs and security consultants. The vCISO playbook, policy set, risk register and board report it holds, and how to build it."
drafted: "2026-10-29"
release: "3.0"
keywords: ["vciso playbook template", "cybersecurity policy templates for small business", "risk register template", "nist csf 2.0 risk assessment template", "soc 2 readiness checklist", "incident response plan template small business", "tabletop exercise template", "board cybersecurity report template", "custom gpt alternative for security consultants", "vciso client knowledge base"]
blueprint:
  - name: README
    role: "The front page. Who the Domain is for, what a reader will have at the end, and the path through it."
    chips: [["skill-visual-explainer", "Stepped figure"], ["skill-isometric-figure", "Map of the path"]]
  - n: "1"
    name: Risk Assessment Method
    role: "How you assess a client against NIST CSF 2.0 or CIS Controls, the questions you ask, and how a score is earned."
    chips: [["skill-workflow-path", "Workflow"], ["skill-scorecard", "Maturity scorecard"], ["component-form", "Intake form"]]
  - n: "2"
    name: Policy Set and Risk Register
    role: "The policies every client needs, in your words, and the register that holds each risk, its owner and its treatment."
    chips: [["skill-register", "Risk register"], ["component-table", "Policy index"], ["component-approval-card", "Policy sign-off"]]
  - n: "3"
    name: Remediation Roadmap and Board Report
    role: "How findings become an ordered plan by quarter, and how that plan becomes a report a director reads in ten minutes."
    chips: [["skill-roadmap", "Roadmap"], ["component-chart", "Risk trend"], ["skill-decision-brief", "Board brief"]]
  - n: "4"
    name: Incident Response Plan and Tabletop
    role: "Who does what when something goes wrong, the escalation path, and the tabletop exercise that proves the plan works."
    chips: [["skill-guided-exercise", "Tabletop"], ["component-diagram", "Escalation flow"], ["component-callout", "Marked to check"]]
  - name: Worked Example
    role: "An assessment, a register and a board report for a made-up dental group, filled in end to end, with the choices explained."
    chips: [["component-callout", "Worked example"]]
faq:
  - q: "I run a vCISO practice. How do I turn my risk assessment method into something each client can read and use without me on every call?"
    a: "Write the method as a folder of Markdown documents and publish it to GitHub from Flow. A client brings the folder in with New from GitHub, reads the README, and asks Chat questions that are answered from your pages. You stay the author. The folder answers the routine questions so your calls can be about decisions."
  - q: "My custom GPT holds my policy templates and my NIST CSF 2.0 assessment questions. What do I move it to before it retires?"
    a: "Save the GPT's shared chats as documents with New from Web Page, and bring its knowledge files in as Word, Excel or PDF. Those become the first drafts of your Domain. A Domain is plain files in a GitHub repository you own. Nothing in it depends on a vendor keeping a feature alive."
  - q: "How do I keep a client's risk register and remediation roadmap current without emailing a new spreadsheet every month?"
    a: "The register is a table in the client's folder, drawn by the Register Skill from the assessment. A Job can keep that table current from the sources you name, and each run asks only for its rows. When you publish the Domain again, the client sees the change as an update to review. Their own edits stay."
  - q: "Can an AI assistant answer only from my own security method and show which document each answer came from?"
    a: "Chat on a Domain searches the folder before each reply and links each fact to its file. A From this folder row lists the documents it used. When the folder does not say, Chat says so instead of guessing. Before any run leaves your Mac, Flow shows what goes where and asks."
  - q: "How do I give a client a living incident response plan that updates when I change the method, but keeps their edits?"
    a: "Publish the plan as part of the Domain. The client's copy checks for a newer version at launch and every six hours. An untouched document is replaced. One they edited is updated only if they tick it, and edits in different places are both kept. Nothing changes until they choose."
mock:
  folder: vciso-method
  client: "Lanternfield Dental"
  steps:
    - title: "Start the client folder"
      ask: "Start a folder for Lanternfield Dental and bring in their current policies and the Microsoft 365 security export."
      reply: "Added 3 files. The Microsoft 365 export came across as tables. 2 items to check before you rely on them."
      doc: "Lanternfield Intake"
      block: "Table"
      status: "Imported · 2 to check"
    - title: "Draft the risk assessment"
      ask: "Draft the NIST CSF 2.0 risk assessment for Lanternfield from the Method and the intake answers."
      reply: "Drafted Risk Assessment across six functions, with a radar chart of the scores. 4 claims marked to check."
      doc: "Risk Assessment"
      block: "Chart · Radar"
      status: "4 claims to check"
    - title: "Draw the roadmap"
      ask: "Run Roadmap on the remediation section and order it by risk score."
      reply: "Roadmap drew 3 quarters and 11 items. It waits in Review Changes."
      doc: "Remediation Roadmap"
      block: "Roadmap"
      status: "1 change to review"
    - title: "Draw the register and keep"
      ask: "Run Register on the findings and keep the roadmap."
      reply: "Kept. Register drew 14 risks with owner and treatment, and the board report section followed."
      doc: "Remediation Roadmap"
      block: "Register"
      status: "Kept, 0 open"
    - title: "Owner signs the policies"
      ask: "Add the policy sign-off card for the practice owner, one line per policy."
      reply: "Added an Approval Card with 8 policies and a signature line."
      doc: "Policy Set"
      block: "Approval Card · Sign off"
      status: "Awaiting signature"
    - title: "The client’s update arrives"
      ask: "What changed since the client brought the Domain in?"
      reply: "The Policy Set changed. The client’s copy shows an update to review. Nothing changes until they choose."
      doc: "README"
      block: "Update · 1 document"
      status: "Update available"
minutes: 9
---

You are the security leader for ten or twenty companies that could never hire one. For each you run an assessment against NIST CSF 2.0 or CIS Controls. You write the policy set, keep the risk register, and order the fixes into a remediation roadmap. Once a quarter you stand in front of a board and explain it in twenty minutes. Once a year you run a tabletop exercise and hope the plan holds. The method is yours. It lives in Word templates, a twelve-tab spreadsheet, and a custom GPT you loaded with your policies last spring.

This page is a blueprint for a Flow Domain that carries that method. It is not built. Only one Domain exists today, [AI Consulting](/domains/ai-consulting/), and its launch story is the walkthrough for every step below. This blueprint is yours to take. Build it from your own know-how, put your name on it, and launch it as your Domain. If you do, I would like to hear about it.

## The opportunity

Security spending keeps growing. Gartner expects worldwide spending on information security to reach [$240 billion in 2026](https://www.gartner.com/en/newsroom/press-releases/2025-07-29-gartner-forecasts-worldwide-end-user-spending-on-information-security-to-total-213-billion-us-dollars-in-2025), up 12.5 percent. IBM puts the global average cost of a data breach at [$4.99 million](https://www.ibm.com/reports/data-breach) in 2026, a record. Verizon's 2026 report found that [31 percent of breaches](https://www.verizon.com/business/resources/executivebriefs/dbir-2026-executive-summary.pdf) now start with an exploited software flaw. Ransomware is in 48 percent. In small and mid-size businesses, a third party is involved in 55 percent.

The work is moving to people like you. Cynomi's 2025 survey found that [67 percent of MSPs and MSSPs](https://www.helpnetsecurity.com/2025/07/31/vciso-services-adoption-2025/) now offer vCISO services, up from 21 percent a year earlier. The people to do the work are scarce. The Bureau of Labor Statistics expects jobs for information security analysts to grow [21 percent](https://www.bls.gov/ooh/computer-and-information-technology/information-security-analysts.htm) from 2025 to 2035, with about 14,100 openings a year. ISC2's 2025 study found [95 percent of teams](https://www.isc2.org/insights/2025/12/2025-isc2-cybersecurity-workforce-study) report a skills gap, and 59 percent call it critical or significant. A written method a client can follow is worth more each year.

The standards have moved toward governance. NIST CSF 2.0, released [February 26, 2024](https://www.nist.gov/news-events/news/2024/02/nist-releases-version-20-landmark-cybersecurity-framework), added a Govern function and now speaks to every organization, with quick-start guides for small businesses. Public companies must report a material incident to the SEC within [four business days](https://www.sec.gov/newsroom/press-releases/2023-139) and describe their risk management in the annual report. And the custom GPT you loaded with your policy templates [retires on December 11, 2026](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq). A Domain is plain files in your own GitHub. Nobody can retire it.

## The signals

| Figure | Value | Source |
| --- | --- | --- |
| Worldwide information security spending, 2026 | About $240 billion, up 12.5 percent; security services about $92.8 billion | source: [Gartner, Forecasts Worldwide End-User Spending on Information Security to Total $213 Billion in 2025](https://www.gartner.com/en/newsroom/press-releases/2025-07-29-gartner-forecasts-worldwide-end-user-spending-on-information-security-to-total-213-billion-us-dollars-in-2025), published 2025-07-29, checked 2026-10-29 |
| Global average cost of a data breach | $4.99 million in 2026, up 12 percent, a record; AI-enabled breaches $6 million | source: [IBM, Cost of a Data Breach Report 2026](https://www.ibm.com/reports/data-breach), published 2026-07-29, checked 2026-10-29 |
| How breaches start | 31 percent from exploited vulnerabilities; ransomware in 48 percent, up from 44; third party in 48 percent of all breaches and 55 percent of SMB breaches | source: [Verizon, 2026 Data Breach Investigations Report Executive Summary](https://www.verizon.com/business/resources/executivebriefs/dbir-2026-executive-summary.pdf), published 2026-05, checked 2026-10-29 |
| US information security analysts | 192,900 jobs in 2025, growing 21 percent to 2035; about 14,100 openings a year; median pay $129,180 | source: [US Bureau of Labor Statistics, Occupational Outlook Handbook](https://www.bls.gov/ooh/computer-and-information-technology/information-security-analysts.htm), published 2026-08-27, checked 2026-10-29 |
| Skills gaps in security teams | 95 percent report at least one; 59 percent call it critical or significant, up from 44 in 2024; AI the top skills need at 41 percent | source: [ISC2, 2025 Cybersecurity Workforce Study](https://www.isc2.org/insights/2025/12/2025-isc2-cybersecurity-workforce-study), published 2025-12-04, checked 2026-10-29 |
| MSPs and MSSPs offering vCISO services | 67 percent in 2025, up from 21 percent; 81 percent use AI or automation; 79 percent see high SMB demand | source: [Help Net Security, Cynomi 2025 State of the Virtual CISO](https://www.helpnetsecurity.com/2025/07/31/vciso-services-adoption-2025/), published 2025-07-31, checked 2026-10-29 |
| NIST CSF 2.0 released | February 26, 2024; new Govern function; for all organizations; small-business quick-start guides | source: [NIST, NIST Releases Version 2.0 of Landmark Cybersecurity Framework](https://www.nist.gov/news-events/news/2024/02/nist-releases-version-20-landmark-cybersecurity-framework), published 2024-02-26, checked 2026-10-29 |
| SEC cyber disclosure rules | Material incidents on Form 8-K within four business days; risk management and board oversight in the annual report | source: [SEC, SEC Adopts Rules on Cybersecurity Risk Management, Strategy, Governance, and Incident Disclosure](https://www.sec.gov/newsroom/press-releases/2023-139), published 2023-07-26, checked 2026-10-29 |

Each figure measures something narrower than it sounds. Surveys count who answered. Vendor research counts a vendor's view. A market estimate is a model. Read them as a direction, not a forecast.

## What your Domain holds

The figure at the top of this page is the folder as it could sit on GitHub. Six Markdown files. Here is what each one does.

**The README** is the front page. It says who the Domain is for, what a reader will have at the end, and the order to read the documents in. A stepped figure shows an assessment becoming a board report. An isometric figure maps the path.

**Risk Assessment Method** is the backbone. How you assess a client against NIST CSF 2.0 or CIS Controls, the questions you ask, and how a score is earned. A Workflow Path draws the engagement from intake to findings. A Scorecard holds the score per function. An intake form gathers a client's first answers before you arrive.

**Policy Set and Risk Register** is the paper that outlives the engagement. Every policy a client needs, in your words, indexed by standard clause in a table. A Register Skill draws the risk register from the findings, each risk with an owner, a score and a treatment. An Approval Card lets the owner sign the policy set.

**Remediation Roadmap and Board Report** is the craft. How findings become an ordered plan by quarter, and how that plan becomes a report a director reads in ten minutes. A Roadmap Skill draws the plan. A chart shows the risk score by quarter. A Decision Brief shapes the one choice the board must make.

**Incident Response Plan and Tabletop** is what the client reaches for on the worst day. Who does what, the escalation flow drawn as a diagram, and when the four-business-day clock starts for a public company. A Guided Exercise turns your tabletop scenario into a form the client's team works through. What you have not confirmed is marked, and Flow counts the marks.

**Worked Example** is an assessment, a register and a board report for a made-up dental group, filled in end to end, with the choices explained. One finished board report teaches more than ten rules.

## What Flow does for this work

**Chat answers from the Method, and says when it cannot.** A client asks what MFA means for their email, or whether a vendor questionnaire needs a SOC 2 report. Chat searches the folder, answers from your pages, and links each fact to its file. When the folder does not say, Chat says so.

**A Skill named Register draws the risk register.** Select the findings of a finished assessment and run Register. It draws each risk, its owner and its treatment into one table and waits in Review Changes. A finding with no owner is named as missing, not guessed.

**An Approval Card for the policy sign-off.** The policy set ends in a checklist, one line per policy. The practice owner ticks each one, types their name and presses Sign off. Flow writes one signed record beside the document. When you revise a policy next year, the card asks for a new signature and keeps the old record.

**A Job keeps the vulnerability section current.** Bring CISA's Known Exploited Vulnerabilities page in with New from Web Page and choose Follow the source. Each Jobs run reads the page again and redrafts the section at about its own length. On a night when nothing changed, it skips without calling a model.

**Bring In All for the standard you assess against.** When a page lists the pages of one standard, Flow offers Bring In All. It reads them one at a time into a new folder with a README in the author's order. Your Method can then cite the clause, and Chat can quote it.

**The import checklist for a client's Word, Excel or PDF.** A client sends old policies in Word and a Microsoft 365 security export in Excel. The Sources tab lists what to check before you rely on them, and Walk Through with Chat takes the open items one at a time.

**Sources and Change Summary on the board report.** A Sources element says what the report was made from and marks a source that changed since. A Change Summary says what changed lately, who changed it and on which day. A director who asks why the score moved finds the answer on the page.

## How you build it in Flow

The [AI Consulting story](/domains/ai-consulting/) walks every one of these steps on a real screen. Follow it with your own material.

1. **Add an empty folder and choose it.** Chat answers from the folder before any document exists. The walkthrough shows it at [an empty folder, and Chat already in it](/domains/ai-consulting/#an-empty-folder-and-chat-already-in-it).
2. **Ask Chat for the README.** Describe who the Domain is for and what you want a reader to have at the end. Chat writes it in your voice and marks every claim it cannot stand behind. See [a front page, in the author's voice](/domains/ai-consulting/#a-front-page-in-the-authors-voice).
3. **Bring in what you already have.** The assessment questionnaire in Word, the risk register spreadsheet, and the shared chats from your custom GPT. New from Web Page turns a page or a shared AI chat into a document with its links kept. See [an old AI chat became a reference](/domains/ai-consulting/#an-old-ai-chat-became-a-reference).
4. **Let Ideas pick a Skill.** Press Suggest on your Method document. Ideas reads the sections and names a Skill for each. A Workflow Path for the engagement, a Register for the findings. A figure or a form waits in Review Changes until you keep it.

![Ideas open beside a README in Flow, offering to run Visual Explainer and Guided Exercise on two sections, each with a sentence on why it fits. Shown on AI Consulting, the only Domain built so far](../../assets/flow/domains/ai-consulting/04-ideas-suggest.webp)

5. **Ask Chat for the next document with your own pages as sources.** The Roadmap and Board Report can be written from your Method and two past board decks with the names removed. Repeat until the path is done. See [the next document, from his own pages](/domains/ai-consulting/#the-next-document-from-his-own-pages).
6. **Review every change.** When you merge two policies or rename the Register, every page that pointed at it follows. See [Review changed the plan, and the source followed](/domains/ai-consulting/#review-changed-the-plan-and-the-source-followed).

## Apply it to a client job

A Domain is for using, not only reading. A new client signs, a dental group with four offices. Open the Domain, start a folder for them, and drop in their old policies and the security export as tables. Ask Chat to draft the assessment from the Method and the intake, and to mark every claim it is unsure about. Run Register on the findings and Roadmap on the remediation section. The Policy Set goes to the owner with an Approval Card. The Board Report is drafted from the roadmap. Before the quarter ends, the Incident Response Plan is theirs and the tabletop has been run once.

What you learn goes back into the Domain. The question the owner asked twice becomes one of the README's questions. The finding you had not seen becomes a row in the Method. A new hire can read the Method and the Policy Set on their first day and run their first assessment the way you would. That is the skills gap answered one person at a time.

## Publish it, and keep it current

When the folder is ready, choose Publish and then GitHub Repository. Flow sends the files and nothing else. A reader brings the Domain in with File, then New from GitHub, and the folder's address. Check the repository's visibility first. Your method can be public while every client's assessment, register and incident plan stays in their own folder on your Mac.

![Publish open on a Domain in Flow, with GitHub Repository chosen and the note that six files were sent. The preview shows the README as the repository will. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/09-published-to-github.webp)

When a rule changes and you publish again, every reader's copy shows the update as a change they review. They keep their own edits. Nothing is replaced behind their back.

![Flow's update sheet for a Domain a reader brought in, listing the one document that changed and offering Not Now or Update Selected. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/12-update-sheet.webp)

The same source can also become a GitHub Pages site, a PDF, an EPUB, or Word and Excel files for a client's team. Chat on the Domain, and the figures a reader steps through, stay in Flow.

## What it costs

Bringing any Domain into Flow is free on Base. Writing with Chat, and Chat on a Domain, need Flow Pro at $10 a month. Publishing to GitHub needs the Publish add-on too, another $10 a month. There is no fee per Domain, so publish one or twenty for the same price. Any AI you connect follows the terms of that service. Publishing does not bring clients on its own. It gives the clients you earn a living copy of your method.

## Start here

Read the [walkthrough](/domains/ai-consulting/) once, end to end. Then add an empty folder in Flow, name it, and describe your assessment method to Chat in three sentences. Which standard you assess against, what a client has at the end, and what the board sees. The README it writes is the first document of your Domain. If you want to talk it through first, the [Domains page](/domains/) has one email address and four questions.
