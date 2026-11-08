---
title: Review only what needs you
path: Your turn
persona: People who review recurring updates to living documents
drafted: '2026-11-07'
build: Flow 4.0.0 (4383), isolated arm64 Release bundle from 0a584a48, macOS 26.6, 1512 × 949 pt, walked by Codex at 21:32–21:34 PST
data: A fictional design team’s Delivery Brief and its local JSON report
dek: A saved Job refreshed a number in our delivery brief. Your turn brought us straight to the changed line and cleared the review after we kept it.
hero: ../../assets/flow/paths/your-turn/01-review-changes.webp
heroAlt: Review Changes and Your turn show the waiting decision and highlight the refreshed table with Keep and Revert beside it
source: orionfold-flow articles/27-your-turn/ARTICLE.md
order: -1
featured: false
draft: false
chip: Your turn
summary: A Job refreshed one number in a brief. Your turn took us to that exact line, we pressed Keep, and nothing else was waiting. You sign off on what changes.
stat:
  value: 1 Keep
  label: and the review queue was empty
steps:
- Open Your turn (⌘7)
- See the exact change
- Press Keep or Revert
cardShot: 01-review-changes
receipt:
- label: Waiting review
  value: 1 update, then none
  evidence: verified
- label: Changed figure
  value: Delivered went from 4 to 5
  evidence: verified
- label: Model cost
  value: $0.00
  evidence: verified
- label: Resolve and Automate
  value: Checked in a separate Pro release review
  evidence: verified
beat: You sign off
startInstructions: In Flow 4, open Your turn (⌘7) and choose a document under Reviews. Use Exact changes, then press Keep or Revert.
release: '4.0'
onHome: false
bodyLocked: true
titleLocked: true
---

**Flow puts waiting decisions together and takes you to the exact change.** A Job can refresh a figure from the same source every week. Your turn shows which documents have something to decide and lets you handle the routine updates with rules you can inspect. AI does the routine part. You sign off.

> “Take me to the part I need to decide. I’ve already read the rest of the brief.”
> *Illustrative scenario.*

## Decide a change

1. Open **Your turn** (⌘7). Open the document under **Reviews**.
2. In **Review Changes**, select the table change and use **Exact changes** to compare the old and new line.
3. Press **Keep** or **Revert**. The queue updates when you decide.

The brief’s **Redraw from data** Job read the saved delivery report. Client review moved from four delivered to five, with six still planned. We kept the applied table change, and Your turn returned to **Nothing needs you**.

![Exact changes showing the removed and added Client review rows](../../assets/flow/paths/your-turn/02-exact-change.webp)

## Handle the familiar updates

In Flow Pro, **Resolve** keeps the eligible updates shown as ready at the time you press it. **Automate** explains what each rule would keep and what still needs you. Use it to inspect and refine a rule before deciding what to do. When Flow learns a rule, it offers **Undo** for the rule.

## Evidence

| What we checked | Result |
| --- | --- |
| Waiting review | Verified. One table update appeared, then the queue cleared after the manual Keep. |
| Changed figure | Verified in Exact changes. Delivered went from 4 to 5. Planned stayed at 6. |
| Model cost | Verified. The local refresh and manual decision used no model and showed $0.00 in session spend. |
| Resolve and Automate | Verified separately on the accepted Pro release review. The shots show the queue and manual review. |
