---
title: "Ten customers, one Host: isolation with an honest trust boundary"
date: 2026-07-19
stage: review
series: "Relay Host & Cells"
summary: "Managed Cells give customers independent Relay state and lifecycle on one Host, while honestly retaining trust in that Host's administrator. Containers improve operations; they do not erase machine-level authority."
tags: ["relay-host", "relay-cell", "isolation", "trust", "security", "agency"]
difficulty: intermediate
signature: signature.svg
status: review
---

## 1. The claim

Many customer Cells can share one Host without sharing one Relay database. They cannot share that Host without sharing trust in its administrator.

That sentence is the useful middle ground between two bad claims: “they are only folders” and “containers make every customer a hostile tenant.” Relay's managed Cell model gives each customer a complete operational instance. It does not pretend the machine owner has lost machine-level authority.

## 2. Why this matters for the Relay operator

Agencies need density. A separate physical server for every small customer is expensive and cumbersome. A single shared Relay workspace, however, entangles data, secrets, recovery, upgrades, and failure handling.

Managed Cells let an operator place several independent instances on one appropriately controlled Host. Each Cell has its own data root, identity, secrets, logs, limits, and recovery lineage. The Host Supervisor names and manages them without storing customer content in its own control records.

This is meaningful isolation for operations. It is not protection from a malicious or compromised Host administrator. Customers who require that protection need separate machines or virtual machines under an acceptable administrative boundary.

## 3. Where it sits in the arc

The [pillar memo](../why-relay-host-cells/article.md) separates Cells from folders. The [delivery memo](../npm-and-cell-image/article.md) explains how each managed Cell receives a sealed runtime. This memo names the trust that remains.

The Host Supervisor accepts strict manifests rather than arbitrary paths or mutable image tags. It derives safe Cell roots and private local networks, rejects caller-supplied routing identity, and records named content-free failures. These controls reduce accidental crossover and make lifecycle actions auditable.

They do not move the root of trust outside the Host.

## 4. The journey — add customers without hiding trust

**Establish the Host.** Choose the laptop, server, or virtual machine and name who administers it. That person or organization is part of every same-Host Cell's trust boundary.

**Create a Cell per required boundary.** Give each customer that needs independent state its own Cell identity and data root. Keep projects and folders inside that Cell for organization.

**Admit before allocating.** The supervisor checks signed capacity and physical limits before it allocates a port, path, volume, network, or customer record. Refusal leaves existing Cells undisturbed.

**Expose deliberately.** Local access, private-network access, and internet ingress have different authentication and forwarding requirements. Caller-provided customer or Cell headers never choose the destination.

**Split when the trust answer changes.** If a customer cannot trust the shared Host administrator or failure domain, move that Cell to a separate Host. Do not rename the original arrangement “strong tenancy.”

## 5. Verification — inspect boundaries and failure paths

A boundary is credible when its shadow paths are specified. A stopped or retained Cell still counts because its recoverable state still occupies managed capacity. A full Host refuses a new Cell before creating partial resources. A lapsed license prevents expansion but does not stop, strand, or block recovery of existing Cells.

Ingress also fails closed. A Cell-side hostname or path assertion identifies the intended instance; arbitrary caller headers do not. Host receipts contain reason codes rather than customer prompts, documents, credentials, or raw model output.

Finally, recovery belongs to the Cell. A customer-owned encrypted bundle can leave the Host entirely, which means operational independence is more than a runtime label.

## 6. Tradeoffs and honest gaps

- Same-Host Cells share machine capacity and a physical failure domain.
- The Host administrator can ultimately control local runtime and storage; this architecture does not claim hostile-admin isolation.
- Container isolation is one layer, not a substitute for operating-system hardening, access control, backups, and customer agreement.
- A future Fleet Controller may coordinate Hosts, but no current claim turns one Host Supervisor into a distributed control plane.

The honest boundary may sell less magic. It gives customers a better basis for consent.

## 7. What this unlocks

An agency can match deployment cost to customer requirements. Related customers who accept one administrator can receive independent Cells on one Host. Regulated or separately administered customers can receive separate Hosts. The application model remains the same in both cases.

The [recovery memo](../lose-host-keep-cell/article.md) shows how customer ownership survives Host loss. The [cloud capstone](../same-host-new-address/article.md) carries this same trust analysis onto customer-owned infrastructure without upgrading it into an unsupported platform claim.

## 8. Closing

Good isolation language says both what is separate and who remains trusted.

Relay Cells separate application state and lifecycle. The Host administrator remains trusted. When that is not acceptable, change the Host—not the adjective.

---

_Next: **Free Cell, licensed Host**._
