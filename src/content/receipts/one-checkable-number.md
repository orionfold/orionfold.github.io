---
title: "One number you can actually check"
metric: "38 of 44 checked"
claim: "Kepler returns one clear number for a space-math problem, the kind a small program can mark right or wrong. On a frozen test of 44 problems it got 38 right."
dek: "For math, the right shape of answer is a number you can verify, not prose. Kepler returns the number, a checker compares it to the known answer, and on a locked test it passed 38 of 44. Rerun it yourself."
date: 2026-06-28
tags: ["Reasoning"]
relatedTo: ["matrix:returns-one-checkable-number:kepler", "headline:checkable-number"]
source:
  - label: "Kepler: space-math model"
    href: "/models/kepler/"
  - label: "Built with Orionfold Arena"
    href: "/arena/"
verify: "Pose a space-math problem with a known answer. Have the model return one boxed number, then run a small checker that pulls out that number, fixes the units, and compares it to the known result within a tolerance. Score it pass or fail with no human judgment in the loop."
# --- provenance (not rendered by the receipts schema, tolerated) ---
recommended: "Kepler, a numeric astrodynamics reasoner, on a DGX Spark"
---

For a math question, the most honest answer is the kind you can mark right or wrong without arguing about it.

## The test we locked

We gave the model space-math problems that each have one correct numeric answer. A passing answer is one clear number, boxed, in a form a small program can pull out and check. A paragraph you have to read and interpret to find a number is a weaker answer, even when the right number is buried in it.

What makes this checkable is the grader. Each problem is built from a known equation, so the correct answer is simply that equation evaluated on the given inputs. The grader pulls the model's boxed number out of its answer, fixes the units, and compares it to that known result within a small tolerance. There is no human deciding whether it was close enough, and no opinion in the loop.

## What happened

| What we checked | The result |
| --- | --- |
| Answers in a checkable form (one boxed number) | All of them |
| Right answers on the locked test | 38 of 44 |
| Human judgment needed to grade | None |

Kepler returns one checkable number for these problems. On a frozen set of 44 problems, the grader marked 38 of them correct, with no person in the loop deciding. You can take any of those numbers and verify it against the known answer yourself.

This is the star on the "returns one checkable number" row. Kepler is the model that earns it, and the worked problems live on Kepler's page.

## The honest part

A clean number can still be the wrong number. Returning a checkable answer is not the same as returning a correct one every time, and Kepler missed 6 of the 44. What the checkable form removes is the ambiguity. You can tell at a glance whether an answer is right, instead of decoding prose to find out.

We will also name the soft spot in the method. A grader that accepts any number within a small tolerance is a surface check, and a surface check can be gamed or can pass a number that is right by luck. It deserves harder, adversarial testing before anyone leans on it as the only gate. The receipt here is narrow and real: the answers come in a form a program can grade, and on a locked test most of them held up.

This ran on Orionfold Arena, the local-AI cockpit, on a desk box you can own. [See Arena](/arena/).

## Why this can be trusted

The grading was done by a program, not by us, so the 38 of 44 is not a number we talked ourselves into. The test was a fixed set of problems with known answers, and the grader is a plain function: pull the boxed number, fix the units, compare within tolerance. Anyone can run the same set and the same grader and get the same count.

We published the misses too. Six of the 44 were wrong, and we said so next to the wins rather than reporting only the passes. And we flagged that a tolerance-based grader is a surface check, so you know exactly how much weight the number can carry.

## Rerun it

Pose a space-math problem with a known answer. Have the model return one boxed number, then run a small checker that pulls out that number, fixes the units, and compares it to the known result within a tolerance. Score it pass or fail with no human judgment in the loop. If your numbers do not match ours, tell us.
