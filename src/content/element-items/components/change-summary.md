---
category: components
name: Change Summary
anchor: change-summary
card: component-change-summary
line: What changed in this document lately, in History's words, newest first, with who and which day beside each line and Show in History for the rest.
group: null
order: 10
facts: []
section: Change Summary
shared: false
tint: "#0070f5"
---

It holds nothing of its own, so it is current every time the document opens. `since` sets the first day it reaches back to, and `limit` how many rows it shows.

````markdown
```flowui
component: Change Summary
title: What changed this month
since: 2026-10-01
limit: 5
```
````

![What changed this month: Document version saved, You, 26 Oct, and a Show in History link](../../../assets/flow/elements/components/11-change-summary.webp)
