---
title: "Answers that name their exact source"
metric: "Cite or refuse"
claim: "Our models answer from your documents and name the exact source, or they refuse. They do not paraphrase from memory and hope."
dek: "A good answer you cannot trace is still a guess. These models point at the line they used, so you can check it."
date: 2026-06-26
tags: ["Trust"]
relatedTo: ["matrix:gives-exact-source-citations:advisor", "matrix:gives-exact-source-citations:patent"]
source:
  - label: "Advisor: grounded answers with citations"
    href: "/software/advisor/"
  - label: "Patent Strategist: cited legal reasoning"
    href: "/models/patent-strategist/"
verify: "Ask a question whose answer lives in one known line of your documents. Check that the model points at that line. Then ask one whose answer is not in the documents, and check that it refuses instead of inventing a source."
---

An answer you cannot trace is a guess wearing a confident voice. The test here is whether the model will show its work.

## The test we locked

Give the model a set of documents and a question. A passing answer must do one of two things: point at the exact source line it used, or refuse because the answer is not in the documents. Paraphrasing from memory with no source is a fail, even when the paraphrase happens to be right.

## What happened

Both Advisor and the Patent Strategist answer this way. When the answer is in the documents, they name the source so you can open it and check. When it is not, they refuse rather than fill the gap with something that sounds right.

This is the star on the "gives exact source citations" row for both models. The full numbers and the run live on each model's own page.

## The honest part

Citing a source is not the same as the source being correct. The model points you at the line; reading it is still your job. What this removes is the worst failure, an answer with no trail at all, where you cannot tell a real fact from a smooth invention.

## Rerun it

Ask a question whose answer lives in one known line of your documents, and check that the model points at that line. Then ask one whose answer is not in the documents, and check that it refuses instead of inventing a source.
