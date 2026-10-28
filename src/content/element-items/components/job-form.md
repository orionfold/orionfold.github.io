---
category: components
name: Job Form
anchor: job-form
card: component-job-form
line: A Form whose button sets up a Job for this document.
group: null
order: 2
facts: []
section: Job Form
shared: false
tint: "#0170f5"
---

Its choices come from the document itself. `options: sections` offers its headings, `options: blocks` its charts and tables, `options: files` the files beside it. The lists follow the document as you edit it. The new Job waits in Review Changes until you keep it.

````markdown
```flowui
component: Form
title: Keep a section current
fields:
  - {label: Section to keep current, bind: section, type: choice, options: sections}
  - {label: Sources, bind: sources, type: multi-choice, options: files}
  - {label: Monthly budget in dollars, bind: budget, type: number, min: 0, max: 20}
  - {label: Last day, bind: until, type: date}
decision: {label: Set up the Job, action: update}
writes:
  jobs:
    - kind: expand-with-sources
      section: "{section}"
      sources: "{sources}"
      until: "{until}"
```
````

![The Keep a section current form drawn in the Reader: a section choice, a list of the folder's files as sources, a monthly budget stepper and a Last day date](../../../assets/flow/elements/components/03-job-form.webp)
