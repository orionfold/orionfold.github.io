---
title: "Teach the way you teach, every time: a blueprint for Learning Design"
domain: Learning Design
kind: blueprint
role: Learning designers and trainers
hook: "Your course method, your evidence on how people learn, and the questions that pull a method out of an expert."
icon: skill-guided-exercise
tint: "#ffa23e"
order: 2
dek: "You design courses for other people's expertise. Every project starts with the same questions, the same model and the same arguments about what works. This blueprint shows what a Flow Domain for that method would hold, how you would build it with Chat and Skills, and how every client would get the living version. Nothing here is built yet. It is an invitation."
description: "A blueprint for a Flow Domain for learning designers, L&D advisors and trainers. What it would hold, the signals behind it, and how to build it in Flow."
drafted: "2026-10-28"
release: "3.0"
blueprint:
  - name: README
    role: "The front page. Who the Domain is for, what a reader will have at the end, and the path through it."
    chips: [["skill-visual-explainer", "Stepped figure"], ["skill-isometric-figure", "Map of the path"]]
  - n: "1"
    name: Learning Design Method
    role: "Your model, from the first conversation to the last assessment. The steps, the questions you ask at each one, and the checks before you move on."
    chips: [["skill-workflow-path", "Workflow"], ["component-approval-card", "Checklist"]]
  - n: "2"
    name: How People Learn
    role: "The findings you rely on, each with its source. Spacing, practice, feedback, and what you no longer believe."
    chips: [["component-table", "Reference table"], ["component-sources", "Sources"], ["component-callout", "Marked to check"]]
  - n: "3"
    name: Expert Interview Guide
    role: "The questions that pull a method out of a subject matter expert, and a form the reader fills in during the call."
    chips: [["component-form", "Interview form"], ["skill-guided-exercise", "Practice run"]]
  - n: "4"
    name: Course Blueprint Template
    role: "Modules, objectives, practice and assessment on one page. Includes your module on working with AI."
    chips: [["component-table", "Template"], ["skill-roadmap", "Module plan"]]
  - name: Worked Example
    role: "One course blueprint, filled in end to end, with the choices explained."
    chips: [["component-callout", "Worked example"]]
minutes: 8
---

You are the person a company calls when an expert knows something and nobody else can learn it from them. You turn that knowledge into a course. You have done it often enough to have a method. It lives in your head, in old decks and in a folder of templates you copy and rename.

This page is a blueprint for a Flow Domain that carries that method. It is not built. Only one Domain exists today, [AI Consulting](/domains/ai-consulting/), and its launch story is the walkthrough for every step below. The point of this page is to show you what yours could hold, and to ask you to build it.

## The opportunity

Companies spend a lot on learning, and more of it is going outside. US organizations spent about $103 billion on training in 2025. The part that went to outside products and services grew fastest, up 29 percent in a year, according to [Training magazine's 2025 Training Industry Report](https://trainingmag.com/2025-training-industry-report/). At the same time, the money spent per employee fell while the hours per employee rose. ATD's 2026 State of the Industry puts it at [16.7 hours and $846 per employee](https://www.td.org/content/atd-blog/2026-state-of-the-industry-report-indicates-latest-td-trends), down from $1,254 the year before. More learning, less money, and more of it bought from people like you.

AI is already in your field. LinkedIn Learning found that [71 percent of L&D professionals](https://business.linkedin.com/learn/resources/workplace-learning-report) are exploring, experimenting with or using AI in their work. The share of organizations that count AI among their learning tools jumped from 25 to 37 percent in one year, in the same Training magazine report. Yet the leaders who buy learning are not sure their teams can deliver AI skills. In a 2026 survey by 2U, [83 percent](https://2u.com/newsroom/state-of-enterprise-learning-2026-ai-upskilling-research/) called AI capabilities an active priority, and only 26 percent were highly confident their own L&D team could deliver them.

The demand has a deadline. The World Economic Forum expects [59 of every 100 workers](https://www.weforum.org/media/future-of-jobs-report-2025-78-million-new-job-opportunities-by-2030-but-urgent-upskilling-needed-to-prepare-workforces) to need upskilling or reskilling by 2030. In the EU, [Article 4 of the AI Act](https://artificialintelligenceact.eu/article/4/) has asked every company that uses AI to build its staff's AI literacy since February 2025. And the tool many trainers used to package a course method, the custom GPT, [retires on December 11, 2026](https://help.openai.com/en/articles/20001519-custom-gpt-retirement-and-migration-faq). A Domain is plain files in your own GitHub. Nobody can retire it.

## The signals

| Figure | Value | Source |
| --- | --- | --- |
| US spend on training, 2025 | $102.8 billion, up 4.9 percent | source: [Training magazine, 2025 Training Industry Report](https://trainingmag.com/2025-training-industry-report/), published 2025-11-10, checked 2026-10-28 |
| Spend on outside training products and services | $16 billion, up 29 percent in a year | source: [Training magazine, 2025 Training Industry Report](https://trainingmag.com/2025-training-industry-report/), published 2025-11-10, checked 2026-10-28 |
| Learning hours and direct spend per employee, 2025 | 16.7 hours, up from 13.7; $846, down from $1,254 | source: [ATD, 2026 State of the Industry](https://www.td.org/content/atd-blog/2026-state-of-the-industry-report-indicates-latest-td-trends), published 2026-05-19, checked 2026-10-28 |
| L&D professionals exploring or using AI | 71 percent | source: [LinkedIn Learning, 2025 Workplace Learning Report](https://business.linkedin.com/learn/resources/workplace-learning-report), published 2025, checked 2026-10-28 |
| Organizations using AI as a learning tool | 37 percent, up from 25 percent a year before | source: [Training magazine, 2025 Training Industry Report](https://trainingmag.com/2025-training-industry-report/), published 2025-11-10, checked 2026-10-28 |
| US training and development specialists | 472,500 jobs in 2025, growing 11 percent to 2035 | source: [US Bureau of Labor Statistics, Occupational Outlook Handbook](https://www.bls.gov/ooh/business-and-financial/training-and-development-specialists.htm), published 2026-08-27, checked 2026-10-28 |
| Workers who need upskilling or reskilling by 2030 | 59 of every 100 | source: [World Economic Forum, Future of Jobs Report 2025](https://www.weforum.org/media/future-of-jobs-report-2025-78-million-new-job-opportunities-by-2030-but-urgent-upskilling-needed-to-prepare-workforces), published 2025-01-08, checked 2026-10-28 |
| Learning leaders who call AI skills an active priority | 83 percent; 26 percent highly confident their L&D team can deliver | source: [2U with NewtonX, State of Enterprise Learning 2026](https://2u.com/newsroom/state-of-enterprise-learning-2026-ai-upskilling-research/), published 2026-10-08, checked 2026-10-28 |
| EU duty to build AI literacy at work | Applies since 2025-02-02 | source: [EU AI Act, Article 4](https://artificialintelligenceact.eu/article/4/), checked 2026-10-28 |

Each figure measures something narrower than it sounds. Surveys count who answered. Vendor research counts a vendor's view. The job count leaves out independents like you. Read them as a direction, not a forecast.

## What your Domain holds

The figure at the top of this page is the folder as it could sit on GitHub. Six Markdown files. Here is what each one does.

**The README** is the front page. It says who the Domain is for, what a reader will have at the end, and the order to read the documents in. A stepped figure shows your method building up one step at a time. An isometric figure maps the path.

**Learning Design Method** is the heart of it. It is your model, from the first conversation with a client to the last assessment. Each step has the questions you ask, the output you expect, and a checklist a reader ticks before moving on. The checklist is an Approval Card, so a reader can sign it and keep the record.

**How People Learn** is the evidence you lean on. Spacing, retrieval practice, worked examples, feedback. Each finding links to its source. What you have stopped believing goes in too, with the reason. Claims you have not checked are marked, and Flow counts the marks until you answer them.

**Expert Interview Guide** holds the questions that pull a method out of a subject matter expert who cannot explain what they do. It has a form a reader fills in during the call. A Guided Exercise lets a new designer practice the interview on a sample transcript before a real one.

**Course Blueprint Template** is the one-page map a reader fills in for each course. Modules, objectives, practice, assessment. It includes your module on working with AI, because every client now asks for one.

**Worked Example** is one blueprint filled in end to end, with your choices explained. Readers learn more from one finished example than from ten rules.

## How you build it in Flow

The [AI Consulting story](/domains/ai-consulting/) walks every one of these steps on a real screen. Follow it with your own material.

1. **Add an empty folder and choose it.** Chat answers from the folder before any document exists. The walkthrough shows it at [an empty folder, and Chat already in it](/domains/ai-consulting/#an-empty-folder-and-chat-already-in-it).
2. **Ask Chat for the README.** Describe who the Domain is for and what you want a reader to have at the end. Chat writes it in your voice and marks every claim it cannot stand behind. See [a front page, in the author's voice](/domains/ai-consulting/#a-front-page-in-the-authors-voice).
3. **Bring in what you already have.** Your old decks, a shared AI chat where you once listed the learning science you trust, a web page you always cite. New from Web Page turns each into a document with its links kept. See [an old AI chat became a reference](/domains/ai-consulting/#an-old-ai-chat-became-a-reference).
4. **Let Ideas pick a Skill.** Press Suggest on your Method document. Ideas reads the sections and names a Skill for each, a Workflow Path for the steps, a Guided Exercise for the interview practice. A figure or a form waits in Review Changes until you keep it.

![Ideas open beside a README in Flow, offering to run Visual Explainer and Guided Exercise on two sections, each with a sentence on why it fits. Shown on AI Consulting, the only Domain built so far](../../assets/flow/domains/ai-consulting/04-ideas-suggest.webp)

5. **Ask Chat for the next document with your own pages as sources.** The Interview Guide can be written from your Method and your evidence. Repeat until the path is done. See [the next document, from his own pages](/domains/ai-consulting/#the-next-document-from-his-own-pages).
6. **Review every change.** When you cut a step or rename a document, every page that pointed at it follows. See [Review changed the plan, and the source followed](/domains/ai-consulting/#review-changed-the-plan-and-the-source-followed).

## Apply it to a client job

A Domain is for using, not only reading. On a new course project, open the Domain, start a folder for the client and ask Chat to draft the course blueprint from the Template, using the expert interview notes as the source. The Method's checklist tells you what to confirm before the draft goes to the client. When the client corrects something, write the lesson back into the Method. The next project starts from what you learned.

With the Expert Interview Guide open, a client's subject matter expert can read the questions before the call. With the Worked Example beside it, they see what the end looks like. That is a better first meeting than a blank chat.

## Publish it, and keep it current

When the folder is ready, choose Publish and then GitHub Repository. Flow sends the files and nothing else. A reader brings the Domain in with File, then New from GitHub, and the folder's address.

![Publish open on a Domain in Flow, with GitHub Repository chosen and the note that six files were sent. The preview shows the README as the repository will. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/09-published-to-github.webp)

When you learn something and publish again, every reader's copy shows the update as a change they review. They keep their own edits. Nothing is replaced behind their back.

![Flow's update sheet for a Domain a reader brought in, listing the one document that changed and offering Not Now or Update Selected. Shown on AI Consulting](../../assets/flow/domains/ai-consulting/12-update-sheet.webp)

The same source can also become a GitHub Pages site, a PDF, an EPUB, or Word and PowerPoint files for the client's team. Chat on the Domain, and the figures a reader steps through, stay in Flow.

## What it costs

Bringing any Domain into Flow is free on Base. Writing with Chat, and Chat on a Domain, need Flow Pro at $10 a month. Publishing to GitHub needs the Publish add-on too, another $10 a month. There is no fee per Domain, so publish one or twenty for the same price. Any AI you connect follows the terms of that service. Publishing does not bring clients on its own. It gives the clients you earn a living copy of your method.

## Start here

Read the [walkthrough](/domains/ai-consulting/) once, end to end. Then add an empty folder in Flow, name it, and describe your method to Chat in three sentences. The README it writes is the first document of your Domain. If you want to talk it through first, the [Domains page](/domains/) has one email address and four questions.
