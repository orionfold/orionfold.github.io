---
title: "One number you can actually check"
metric: "Checkable answer"
claim: "Kepler returns one clear, checkable number for a space-math problem, not a paragraph you have to interpret."
dek: "For math, the right shape of answer is a number you can verify, not prose. Kepler returns the number, so you can check it cold."
date: 2026-06-26
tags: ["Reasoning"]
relatedTo: ["matrix:returns-one-checkable-number:kepler"]
source:
  - label: "Kepler: space-math model"
    href: "/models/kepler/"
verify: "Pose a space-math problem with a known answer. Check that the model returns one clear number you can verify against the known result, not a paragraph you have to decode."
---

For a math question, the most honest answer is the kind you can mark right or wrong without arguing about it.

## The test we locked

Give the model a space-math problem that has one correct numeric answer. A passing model returns that one clear number, in a form you can check against a known result. A paragraph you have to interpret to extract a number is a weaker answer, even when the number is buried in it correctly.

## What happened

Kepler returns one checkable number for these problems. You can take that number and verify it against the known answer directly, with no interpretation step in between.

This is the star on the "returns one checkable number" row. Kepler is the model that earns it; the worked problems live on Kepler's page.

## The honest part

A clean number can still be the wrong number. Returning a checkable answer is not the same as returning a correct one every time. What it removes is the ambiguity, you can tell at a glance whether it is right, instead of decoding prose to find out.

## Rerun it

Pose a space-math problem with a known answer. Check that the model returns one clear number you can verify against the known result, not a paragraph you have to decode.
