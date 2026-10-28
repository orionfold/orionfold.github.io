---
category: components
name: Bento
anchor: bento
card: component-bento
line: Bento holds two or more, two across at most, and stacks when the column is narrow.
group: null
order: 14
facts: []
section: Section, Hero and Bento
shared: true
tint: "#0170f5"
---

**Section** groups components under a title. **Hero** holds exactly two, side by side at every width. A chart beside the figures it rests on stays a pair even in a narrow window. **Bento** holds two or more, two across at most, and stacks when the column is narrow.

````markdown
```flowui
component: Hero
components:
  - component: Chart
    chart:
      chartType: Line Chart
      title: Weekly mentions rose through September
      data:
        - {week: "2026-09-07", mentions: 120}
        - {week: "2026-09-14", mentions: 134}
        - {week: "2026-09-21", mentions: 151}
      semantic_types: {week: Category, mentions: Amount}
      encodings:
        x: {field: week}
        y: {field: mentions}
  - component: Table
    title: Figures
    rows:
      - {Figure: Assistants tracked, Value: 14}
      - {Figure: New this week, Value: 2}
```
````

![A Hero: the Weekly mentions line chart on the left and the Figures table on the right, side by side](../../../assets/flow/elements/components/13-section-hero-and-bento.webp)

Composed, they read as one panel. Below, a **Section** titled *Before you sign* holds a warning and a **Bento** with the picture and the month's table.

![The composed example: a Section titled Before you sign, holding the provisional-figures warning, then the desk picture and the This month table two across](../../../assets/flow/elements/components/14-one-composed-example.webp)
