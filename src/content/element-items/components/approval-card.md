---
category: components
name: Approval Card
anchor: approval-card
card: component-approval-card
line: A checklist a person ticks and signs off.
group: null
order: 0
facts: []
section: Approval Card
shared: false
tint: "#0170f5"
---

Signing writes one record beside the document; the document's text never changes.

````markdown
```flowui
component: Approval Card
title: Delivery acceptance
items:
  - Figures reconciled
  - Brief delivered as PDF
decision: {label: Sign off, action: sign-off}
```
````

Drawn: the title, a box per item, and a **Sign off** button.

![The Handbook's Components page in the Reader with Elements open: the Approval Card section and its card — Delivery acceptance, two unticked items, a Sign off button](../../../assets/flow/elements/components/01-approval-card.webp)
