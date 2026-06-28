---
title: "The same model, 76% faster, same chip"
metric: "76% faster"
claim: "A 4-bit mode made the same model run 76% faster, 38.8 words a second up from 22.1, while holding about a quarter of the memory, on the same desk box."
dek: "No new chip, no new model. Just a leaner 4-bit mode the chip runs in hardware, and the same model typed 76% faster on a fraction of the memory. Rerun it yourself."
date: 2026-06-28
tags: ["Speed"]
relatedTo: ["headline:76-faster"]
source:
  - label: "The desk box we measured on"
    href: "/dgx-spark/"
  - label: "Built with Orionfold Arena"
    href: "/software/arena/"
verify: "Serve the same 8B model on the same desk box three ways: the convenient default, a compiled default at the same precision, and the 4-bit mode the chip runs in hardware. Send all three the same prompt, time the words a second, and read the memory each one holds while it answers."
# --- provenance (not rendered by the receipts schema, tolerated) ---
recommended: "TensorRT-LLM 1.1 · NVFP4 4-bit engine · trtllm-serve on a DGX Spark"
---

We did not swap the chip or the model. We changed how the model is stored, and it got much faster while taking far less room.

## The test we locked

One model, one desk box, one fixed question. We served the same 8B model three ways and sent each the exact same prompt with greedy decoding and a 200-word ceiling.

The first way is the convenient default: one command, an endpoint on a port, and you are running. The second way compiles that same precision into a tuned engine first. The third way switches to a 4-bit mode, where each weight is packed down to four bits and the chip runs that math in hardware instead of unpacking it first.

We measured the same two things every time: raw typing speed in words a second, and how much memory the model held while it answered.

## What happened

<figure class="fn-diagram" aria-label="One model served three ways on the same desk box. The convenient default runs at 22.1 words a second and holds 11.2 gigabytes. The compiled default runs at 24.6. The 4-bit mode runs at 38.8 words a second and holds only 2.5 gigabytes, the win.">
  <svg viewBox="0 0 900 380" role="img" preserveAspectRatio="xMidYMid meet">
    <g class="fn-diagram__edges">
      <path class="fn-diagram__edge" d="M 210 190 L 300 70" />
      <path class="fn-diagram__edge" d="M 210 190 L 300 190" />
      <path class="fn-diagram__edge fn-diagram__edge--accent" d="M 210 190 L 300 310" />
      <path class="fn-diagram__edge" d="M 460 70 L 600 70" />
      <path class="fn-diagram__edge" d="M 460 190 L 600 190" />
      <path class="fn-diagram__edge fn-diagram__edge--accent" d="M 460 310 L 600 310" />
    </g>
    <g class="fn-diagram__nodes">
      <rect class="fn-diagram__node" x="60"  y="158" width="150" height="64" rx="10" />
      <rect class="fn-diagram__node" x="300" y="40"  width="160" height="60" rx="10" />
      <rect class="fn-diagram__node" x="300" y="160" width="160" height="60" rx="10" />
      <rect class="fn-diagram__node fn-diagram__node--accent" x="300" y="280" width="160" height="60" rx="10" />
      <rect class="fn-diagram__node" x="600" y="40"  width="240" height="60" rx="10" />
      <rect class="fn-diagram__node" x="600" y="160" width="240" height="60" rx="10" />
      <rect class="fn-diagram__node fn-diagram__node--accent" x="600" y="280" width="240" height="60" rx="10" />
    </g>
    <g class="fn-diagram__labels">
      <text class="fn-diagram__label" x="135" y="186" text-anchor="middle">The same</text>
      <text class="fn-diagram__label" x="135" y="204" text-anchor="middle">8B model</text>
      <text class="fn-diagram__label" x="380" y="75"  text-anchor="middle">Convenient default</text>
      <text class="fn-diagram__label" x="380" y="195" text-anchor="middle">Compiled default</text>
      <text class="fn-diagram__label fn-diagram__label--accent" x="380" y="315" text-anchor="middle">4-bit mode</text>
      <text class="fn-diagram__label fn-diagram__label--mono" x="720" y="66"  text-anchor="middle">22.1 words a second</text>
      <text class="fn-diagram__label fn-diagram__label--mono" x="720" y="86"  text-anchor="middle">holds 11.2 GB</text>
      <text class="fn-diagram__label fn-diagram__label--mono" x="720" y="186" text-anchor="middle">24.6 words a second</text>
      <text class="fn-diagram__label fn-diagram__label--mono" x="720" y="206" text-anchor="middle">about the same memory</text>
      <text class="fn-diagram__label fn-diagram__label--mono" x="720" y="306" text-anchor="middle">38.8 words a second</text>
      <text class="fn-diagram__label fn-diagram__label--mono" x="720" y="326" text-anchor="middle">holds only 2.5 GB</text>
    </g>
    <g class="fn-diagram__annotations">
      <text class="fn-diagram__annotation" x="135" y="146" text-anchor="middle">same chip · same prompt</text>
      <text class="fn-diagram__annotation" x="380" y="30"  text-anchor="middle">EASY TO RUN</text>
      <text class="fn-diagram__annotation" x="380" y="150" text-anchor="middle">SAME PRECISION</text>
      <text class="fn-diagram__annotation" x="380" y="270" text-anchor="middle">THE WIN</text>
      <text class="fn-diagram__annotation" x="720" y="358" text-anchor="middle">76% faster · about a quarter of the memory</text>
    </g>
  </svg>
  <figcaption>Same model, same chip, same prompt. The only thing that changed is how the weights are stored, and the 4-bit lane wins on both speed and memory.</figcaption>
</figure>

The convenient default ran at 22.1 words a second. The compiled default, same precision, nudged it to 24.6. The 4-bit mode ran the same model at 38.8 words a second. That is 76% faster than the convenient default, on the same chip, with no change to the job the model does.

Here is the full board.

| How the model was served | Words a second | Memory held |
| --- | --- | --- |
| 4-bit mode (the win) | 38.8 | 2.5 GB |
| Compiled default | 24.6 | engine 8.6 GB |
| Convenient default | 22.1 | 11.2 GB |

The 4-bit mode also held about 2.5 GB while it ran, against 11.2 GB for the convenient default. That is roughly a quarter of the memory for the same answers, which on a single shared box is room for a search index or a second model to sit beside it.

## The honest part

We will not oversell the middle row. Compiling the same precision into a tuned engine only bought about 10 to 15% over the convenient default. That alone was not worth the extra setup. The real jump came from the 4-bit mode, and it came for a specific reason: this chip runs 4-bit math in hardware. On a chip without that, software 4-bit does not give you this win, so the result is tied to the hardware, not a free lunch everywhere.

A 4-bit mode also trims some precision to win the speed and the memory. For the work we run it on the trade held and the answers stayed good, but that is a thing to check on your own task, not assume. The point we stand behind is narrow and real: on this box, the same model went 76% faster and held a quarter of the memory, by changing only how it is stored.

This ran on Orionfold Arena, the local-AI cockpit, on a desk box you can own. [See Arena](/software/arena/).

## Why this can be trusted

We did not change the model or the chip, so the speed cannot be explained by a better model or better hardware. The only thing that varied across the three runs is how the weights are stored, which is exactly the lever the claim is about. We served all three the same prompt with the same decode settings, so the comparison is apples to apples.

We also published the weak result next to the strong one. The compiled-default row barely moved, and we showed it rather than hiding it to make the 4-bit win look bigger. And we named the reason the win exists, which is the chip's hardware 4-bit path, so you can tell whether your own box will see the same jump before you expect it.

## Rerun it

Serve the same 8B model on the same desk box three ways: the convenient default, a compiled default at the same precision, and the 4-bit mode the chip runs in hardware. Send all three the same prompt, time the words a second, and read the memory each one holds while it answers. If your numbers do not match ours, tell us.
