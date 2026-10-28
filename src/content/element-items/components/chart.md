---
category: components
name: Chart
anchor: chart
card: component-chart
line: "A chart drawn in place from a readable body. It takes the chart's type, title, rows and which field goes on which axis."
group: null
order: 4
facts: []
section: Chart
shared: false
tint: "#0070f5"
---

Its plain twin is a ` ```chart ` block, and the chart kinds article lists all 54 kinds.

````markdown
```flowui
component: Chart
chart:
  chartType: Bar Chart
  title: Accounts by quarter
  data:
    - {label: Q2, value: 402}
    - {label: Q3, value: 418}
  semantic_types: {label: Category, value: Amount}
  encodings:
    x: {field: label}
    y: {field: value}
```
````

![The Accounts by quarter bar chart: Q2 402, Q3 418](../../../assets/flow/elements/components/05-chart.webp)
