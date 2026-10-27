---
category: components
name: Diff
anchor: diff
card: component-diff
line: Exact changes, drawn the way Review Changes draws them, red for removed and green for added.
group: null
order: 7
facts: []
section: Diff
shared: false
tint: "#0070f5"
---

Its plain twin is a ` ```diff ` block.

````markdown
```flowui
component: Diff
title: What the refresh changed
diff: |
  @@ -12,2 +12,2 @@
  -Active accounts: 402
  +Active accounts: 418
```
````

![What the refresh changed: Active accounts 402 struck in red, 418 added in green](../../../assets/flow/elements/components/08-diff.webp)
