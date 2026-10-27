---
category: components
name: Diagram
anchor: diagram
card: component-diagram
line: A diagram drawn from its text, in Mermaid's language.
group: null
order: 5
facts: []
section: Diagram
shared: false
tint: "#0371f5"
---

Its plain twin is a ` ```mermaid ` block.

````markdown
```flowui
component: Diagram
title: How the brief is made
diagram: |
  flowchart LR
    A[Client figures] --> B[Brief] --> C[Sign-off]
```
````

![How the brief is made: three boxes, Client figures, Brief, Sign-off, joined by arrows](../../../assets/flow/elements/components/06-diagram.webp)
