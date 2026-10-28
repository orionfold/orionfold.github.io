---
title: "From transcripts to a decision, your way: a blueprint for Research Synthesis Starter"
domain: Research Synthesis Starter
kind: blueprint
role: Market research and insights consultants
hook: "Your way of turning interviews into evidence a client can decide on, with the standards you hold yourself to."
icon: skill-decision-brief
tint: "#cb10d5"
order: 3
dek: "You take forty transcripts and hand back one decision. The method is yours, the coding frame is yours, and the standards you work to are in your head and a dozen past reports. This blueprint shows what a Flow Domain for that method would hold, how you would build it with Chat and Skills, and how every client would get the living version. Nothing here is built yet. It is an invitation."
description: "A blueprint for a Flow Domain for market research and insights consultants. The documents it would hold, the market signals behind it, and how to build, apply and publish it in Flow, with the AI Consulting Starter walkthrough as the guide."
drafted: "2026-10-28"
release: "3.0"
blueprint:
  - name: README
    role: "The front page. Who the Domain is for, what a reader will have at the end, and the path through it."
    chips: [["skill-visual-explainer", "Stepped figure"], ["skill-isometric-figure", "Map of the path"]]
  - n: "1"
    name: Synthesis Method
    role: "From raw transcripts to themes to evidence. The steps, what counts as a finding, and the checks before a claim reaches a client."
    chips: [["skill-workflow-path", "Workflow"], ["component-approval-card", "Quality checklist"]]
  - n: "2"
    name: Standards and AI Rules
    role: "The code points you follow, how you disclose AI and synthetic data, and what you will not do."
    chips: [["component-sources", "Sources"], ["component-table", "Rules table"], ["component-callout", "Marked to check"]]
  - n: "3"
    name: Discussion Guide and Coding Frame
    role: "The questions you ask, and the frame you code answers with. A form a reader fills in per interview."
    chips: [["component-form", "Interview form"], ["component-table", "Coding frame"]]
  - n: "4"
    name: Decision Brief Template
    role: "What the client is deciding, the options, the evidence for each, and a recommendation with its sources."
    chips: [["skill-decision-brief", "Decision brief"], ["skill-option-comparison", "Options side by side"]]
  - name: Worked Example
    role: "One brief built from a past study, with names and numbers changed and the choices explained."
    chips: [["component-callout", "Worked example"]]
minutes: 8
---

You are the person a client calls when they have a decision to make and the answer is in what customers say. You run the interviews, or you read the transcripts someone else ran, and you hand back evidence a leadership team can act on. You have a method for it. It is in your head, in a coding frame you keep adapting, and in the standards you hold to without ever writing them down.

This page is a blueprint for a Flow Domain that carries that method. It is not built. Only one Domain exists today, [AI Consulting Starter](/domains/ai-consulting-starter/), and its launch story is the walkthrough for every step below. The point of this page is to show you what yours could hold, and to ask you to build it.

## The opportunity

The insights industry is big and still growing. ESOMAR puts the world total at about [$165 billion in 2025](https://dataandinsights.com.au/global-market-research-report-2026/), up 6.4 percent. The growth is not even. In 2024, research software grew more than twice as fast as classic research services, [11.5 percent against 4.8](https://researchworld.com/articles/inside-the-153bn-insights-industry). In the US, the Insights Association found the industry reached [$89.3 billion](https://www.insightsassociation.org/News/Industry-News/ArticleID/2650/U-S-Insights-Analytics-Industry-Reaches-89-3-Billion-as-AI-and-Technology-Reshape-the-Market) in 2025, with research technology now close to half of it. The money is moving toward tools. The judgment still has to come from somewhere.

AI is already in every researcher's hands. Qualtrics found that [95 percent of researchers](https://www.qualtrics.com/articles/strategy-research/market-research-trends/) use or experiment with AI, and that use of AI built into research software is rising while use of general chatbots is falling. Two in three research suppliers now put generative AI straight into what they deliver, according to [GreenBook's 2025 GRIT Business Outlook](https://www.greenbook.org/insights/artificial-intelligence-and-machine-learning/the-sea-change-insights-from-the-2025-grit-business-outlook). The same report found fewer buyers expect their leadership to raise research budgets. Clients want more insight for the same money, and they want to know how the AI was used.

That is why the rules changed. In June 2025 the [ICC/ESOMAR International Code](https://www.einpresswire.com/article/825277849/esomar-announces-major-update-to-the-icc-esomar-international-code-to-reflect-ai-and-emerging-technology) got its biggest revision in almost a decade, with rules for AI, synthetic data and synthetic personas for the first time. A researcher who can show their method, their standards and their disclosure in one place has an answer ready. And the custom GPT many consultants used to package a method [retires on December 11, 2026](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq). A Domain is plain files in your own GitHub. Nobody can retire it.

## The signals

| Figure | Value | Source |
| --- | --- | --- |
| World insights industry, 2025 | About $165 billion, up 6.4 percent | source: [ESOMAR, Global Market Research 2026](https://dataandinsights.com.au/global-market-research-report-2026/), published 2026, checked 2026-10-28 |
| Research software against research services, 2024 growth | 11.5 percent against 4.8 percent | source: [ESOMAR Research World, Inside the $153bn Insights Industry](https://researchworld.com/articles/inside-the-153bn-insights-industry), published 2025-11-04, checked 2026-10-28 |
| US insights and analytics industry, 2025 | $89.3 billion, up 7.8 percent; research technology close to half | source: [Insights Association, 2026 State of U.S. Insights and Analytics](https://www.insightsassociation.org/News/Industry-News/ArticleID/2650/U-S-Insights-Analytics-Industry-Reaches-89-3-Billion-as-AI-and-Technology-Reshape-the-Market), published 2026-08-10, checked 2026-10-28 |
| US market research analysts | 952,700 jobs in 2025, growing 7 percent to 2035 | source: [US Bureau of Labor Statistics, Occupational Outlook Handbook](https://www.bls.gov/ooh/business-and-financial/market-research-analysts.htm), published 2026-08-27, checked 2026-10-28 |
| Researchers who use or experiment with AI | 95 percent; AI built into research software used by 66 percent, up from 62 | source: [Qualtrics, The 4 Market Research Trends Shaping 2026](https://www.qualtrics.com/articles/strategy-research/market-research-trends/), published 2025-11-14, checked 2026-10-28 |
| Researchers planning to use AI agents within a year | From 15 percent today to 44 percent | source: [Qualtrics, How Agentic AI is Rebuilding Market Research](https://www.qualtrics.com/articles/strategy-research/agentic-ai-market-research/), published 2026-05-11, checked 2026-10-28 |
| Suppliers who put generative AI into deliverables | 67 percent; buyers expecting budget support fell from 65 to 34 percent | source: [GreenBook, The Sea Change, 2025 GRIT Business Outlook](https://www.greenbook.org/insights/artificial-intelligence-and-machine-learning/the-sea-change-insights-from-the-2025-grit-business-outlook), published 2025-06-18, checked 2026-10-28 |
| Global research code revised for AI and synthetic data | June 2025, backed by more than 60 associations | source: [ESOMAR and ICC, International Code update](https://www.einpresswire.com/article/825277849/esomar-announces-major-update-to-the-icc-esomar-international-code-to-reflect-ai-and-emerging-technology), published 2025-06-25, checked 2026-10-28 |

Each figure measures something narrower than it sounds. Surveys count who answered. Vendor research counts a vendor's view. Stated plans are not adoption. Read them as a direction, not a forecast.

## What your Domain holds

The figure at the top of this page is the folder as it could sit on GitHub. Six Markdown files. Here is what each one does.

**The README** is the front page. It says who the Domain is for, what a reader will have at the end, and the order to read the documents in. A stepped figure shows your method from transcript to decision. An isometric figure maps the path.

**Synthesis Method** is the heart of it. How you go from raw transcripts to codes, from codes to themes, and from themes to findings a client can act on. What counts as a finding and what is only a quote. A quality checklist a reader ticks before any claim reaches a client, kept as an Approval Card so the sign-off stays on record.

**Standards and AI Rules** is where you put the code points you follow, the way you disclose AI and synthetic data in a report, and the things you will not do. Each rule links to its source. What you have not settled yet is marked, and Flow counts the marks until you answer them.

**Discussion Guide and Coding Frame** holds the questions you ask and the frame you code answers with. A form lets a reader log one interview at a time. The frame is a table they can extend for a new study.

**Decision Brief Template** is the shape of what you hand back. What the client is deciding, the options, the evidence for each, and a recommendation with its sources. A Decision Brief Skill draws it. An Option Comparison puts the choices side by side on the facts that tell them apart.

**Worked Example** is one brief from a past study with names and numbers changed, and the choices explained. A reader learns more from one finished brief than from ten rules.

## How you build it in Flow

The [AI Consulting Starter story](/domains/ai-consulting-starter/) walks every one of these steps on a real screen. Follow it with your own material.

1. **Add an empty folder and choose it.** Chat answers from the folder before any document exists. The walkthrough shows it at [an empty folder, and Chat already in it](/domains/ai-consulting-starter/#an-empty-folder-and-chat-already-in-it).
2. **Ask Chat for the README.** Describe who the Domain is for and what you want a reader to have at the end. Chat writes it in your voice and marks every claim it cannot stand behind. See [a front page, in the author's voice](/domains/ai-consulting-starter/#a-front-page-in-the-authors-voice).
3. **Bring in what you already have.** Your coding frame, a past report with the client's details removed, the code of conduct page you cite. New from Web Page turns a page or a shared AI chat into a document with its links kept. See [an old AI chat became a reference](/domains/ai-consulting-starter/#an-old-ai-chat-became-a-reference).
4. **Let Ideas pick a Skill.** Press Suggest on your Method document. Ideas reads the sections and names a Skill for each, a Workflow Path for the steps, a Decision Brief for the template. A figure or a form waits in Review Changes until you keep it.

![Ideas open beside a README in Flow, offering to run Visual Explainer and Guided Exercise on two sections, each with a sentence on why it fits. Shown on AI Consulting Starter, the only Domain built so far](../../assets/flow/domains/ai-consulting-starter/04-ideas-suggest.webp)

5. **Ask Chat for the next document with your own pages as sources.** The Standards document can be written from your Method and the code you follow. Repeat until the path is done. See [the next document, from his own pages](/domains/ai-consulting-starter/#the-next-document-from-his-own-pages).
6. **Review every change.** When you merge two steps or rename a document, every page that pointed at it follows. See [Review changed the plan, and the source followed](/domains/ai-consulting-starter/#review-changed-the-plan-and-the-source-followed).

## Apply it to a client job

A Domain is for using, not only reading. On a new study, open the Domain, start a folder for the client and drop the transcripts in. Ask Chat to code them against your frame, and to flag every passage it is not sure about. The Method's checklist tells you what to confirm before a finding goes in the brief. When the client pushes back on a theme, write what you learned back into the Method. The next study starts from what you learned.

With the Standards document open, you can answer the question every buyer now asks. How was AI used, and what did a person check. The answer is in your Domain, dated, and the same for every client.

## Publish it, and keep it current

When the folder is ready, choose Publish and then GitHub Repository. Flow sends the files and nothing else. A reader brings the Domain in with File, then New from GitHub, and the folder's address.

![Publish open on a Domain in Flow, with GitHub Repository chosen and the note that six files were sent. The preview shows the README as the repository will. Shown on AI Consulting Starter](../../assets/flow/domains/ai-consulting-starter/09-published-to-github.webp)

When you refine the coding frame and publish again, every reader's copy shows the update as a change they review. They keep their own edits. Nothing is replaced behind their back.

![Flow's update sheet for a Domain a reader brought in, listing the one document that changed and offering Not Now or Update Selected. Shown on AI Consulting Starter](../../assets/flow/domains/ai-consulting-starter/12-update-sheet.webp)

The same source can also become a GitHub Pages site, a PDF, an EPUB, or Word and PowerPoint files for the client's team. Chat on the Domain, and the figures a reader steps through, stay in Flow.

## What it costs

Bringing any Domain into Flow is free on Base. Writing with Chat, and Chat on a Domain, need Flow Pro at $10 a month. Publishing to GitHub needs the Publish add-on too, another $10 a month. There is no fee per Domain, so publish one or twenty for the same price. Any AI you connect follows the terms of that service. Publishing does not bring clients on its own. It gives the clients you earn a living copy of your method.

## Start here

Read the [walkthrough](/domains/ai-consulting-starter/) once, end to end. Then add an empty folder in Flow, name it, and describe your method to Chat in three sentences. The README it writes is the first document of your Domain. If you want to talk it through first, the [Domains page](/domains/) has one email address and four questions.
