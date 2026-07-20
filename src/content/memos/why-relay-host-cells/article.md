---
title: "A folder is not a tenant: why Relay has Hosts and Cells"
date: 2026-07-19
stage: review
series: "Relay Host & Cells"
summary: "Relay separates work organization from operational isolation: folders organize one Relay, while each Cell is a complete instance on a Host. That distinction makes customer boundaries, recovery, and responsibility legible."
tags: ["relay-host", "relay-cell", "architecture", "isolation", "multi-customer"]
difficulty: beginner
signature: signature.svg
status: review
---

## 1. The claim

A folder can separate a customer in a menu. It cannot separate that customer's database, secrets, recovery history, or runtime fate.

That is why Relay uses two infrastructure words. A **Host** is one laptop, workstation, server, or virtual machine that owns local compute, storage, networking, and administration. A **Cell** is one complete Relay instance on that Host, with its own state and operational identity. Customers, projects, and folders live *inside* a Cell. They organize work; they do not become security boundaries by being renamed.

This is not architecture for architecture's sake. It is a refusal to promise isolation that a sidebar cannot provide.

## 2. Why this matters for the Relay operator

Imagine an agency starts with one customer folder. A second customer arrives, then another. The folders look separate, so it is tempting to call the workspace multi-tenant. But the machine administrator can still reach the process and storage beneath every folder. A bad migration, full disk, or misplaced secret can still affect the whole instance.

Relay makes the consequential choice explicit. Keep related work together in one Cell when one organization can reasonably share an administrator and operational fate. Create separate Cells when customers need independent data roots, identity, logs, limits, backups, or recovery lineage. Use separate Hosts when customers must not trust the same Host administrator.

The naming gives an operator a truthful answer to a customer question: “What, exactly, is separate?”

## 3. Where it sits in the arc

This is the pillar memo for the *Relay Host & Cells* series. The rest of the series follows the model through delivery, commercial rights, trust, recovery, and deployment.

The hierarchy is deliberately small:

> A future Fleet Controller may coordinate several Hosts. Each Host Supervisor controls only the Cells on its own machine. Each Cell contains its own customers, projects, and folders.

The **Host Supervisor** is therefore not a Fleet Controller. It is local control for local Cells. Calling a remote controller “the Host” would erase the actual machines that hold customer state.

## 4. The journey — from folder to honest boundary

**Notice the organizing surface.** A project or folder makes work easier to find inside one Relay instance. Start there when the work shares an owner and trust boundary.

**Ask what must fail independently.** If a customer needs a separate database, secret root, access identity, limits, logs, or recovery history, the requirement has moved beyond organization.

**Create a Cell boundary.** A managed Cell receives its own data and configuration. Stopping or recovering that Cell is a named lifecycle action rather than an accidental consequence of manipulating a shared folder.

**Name the Host administrator.** Cells on the same Host are isolated operational units, but they still trust the person or system administering that Host. Containers do not make the Host administrator disappear.

**Split the Host when trust demands it.** Put a customer on another machine or virtual machine when that customer cannot accept the shared administrator. A future Fleet Controller could coordinate both Hosts without pretending they became one Host.

## 5. Verification — follow the state, not the label

The test for a real Cell boundary is concrete. Does the instance have its own database and files? Its own identity and secrets? Its own recovery lineage? Can the Host name, start, stop, export, and recover it without selecting another customer's folder?

The accepted Host contract answers yes for managed Cells. It also stores only content-free control records at the Host layer; customer prompts, documents, model output, credentials, and raw runtime errors remain inside the Cell. That does not turn the Host into a hostile-administrator boundary. It does make the operational separation inspectable.

The language itself is part of the verification. A “customer,” “project,” or “folder” must never be used as a synonym for Cell. “Host” must never be used as a synonym for a future cross-machine controller.

## 6. Tradeoffs and honest gaps

- Separate Cells consume more runtime and storage than folders inside one Cell.
- Same-Host Cells still trust the Host administrator and share the Host's physical failure domain.
- A Host Supervisor is local-only. Multi-Host coordination belongs to a future Fleet Controller and is not a shipped promise.
- Stronger isolation may require separate virtual machines or hardware, not a more confident marketing adjective.

The model deliberately chooses a higher operational floor in exchange for a boundary that customers can understand and operators can recover.

## 7. What this unlocks

Once the boundary is honest, later decisions become simpler. The [delivery memo](../npm-and-cell-image/article.md) can explain why a managed Host pulls a sealed Cell image. The [trust memo](../ten-customers-one-host/article.md) can state what isolation does and does not mean. The [fulfillment memo](../free-cell-licensed-host/article.md) can charge for management authority without charging for the runtime. The [recovery memo](../lose-host-keep-cell/article.md) can define a portable unit worth recovering.

Most importantly, an operator can grow from one personal Cell to many customer Cells without silently changing the meaning of “separate.”

## 8. Closing

A folder is a useful promise about organization. A Cell is a useful promise about operational identity. A Host is the machine and administrator those Cells ultimately trust.

Relay keeps the words separate because customers deserve to know which promise they are buying—and which promise still requires another machine.

---

_Series pillar. Continue with **One Relay, two delivery shapes**._
