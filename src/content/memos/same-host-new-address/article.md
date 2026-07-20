---
title: "Same Host, new address: from a laptop to customer-owned cloud"
date: 2026-07-19
stage: draft
series: "Relay Host & Cells"
summary: "Relay's customer-owned cloud direction moves the same single-Host contract to infrastructure the customer controls. It favors a complete, recoverable Host over premature platform architecture; provider proof remains gated."
tags: ["relay-host", "relay-cell", "cloud", "self-hosting", "deployment", "roadmap"]
difficulty: intermediate
signature: signature.svg
status: draft
---

<!-- DRAFT GATE: provider-specific success, availability, pricing, and general-availability claims require G-085 conformance evidence. -->

## 1. The claim

Moving Relay from a laptop to customer-owned cloud infrastructure should change the address before it changes the product model.

The near-term direction is one customer-controlled Host containing its Host Supervisor, ingress, storage, and managed Cells. It is not a promise to turn Relay into a multi-region platform or to split every layer across services. The same Host and Cell boundaries should work on a capable local machine, a server in the customer's office, or a virtual machine in the customer's cloud account.

This memo is a gated capstone: it describes the accepted architecture direction, not a provider-proven launch claim.

## 2. Why this matters for the Relay operator

Cloud diagrams invite premature complexity. Separate control planes, databases, workload clusters, and global routers can sound scalable before a customer can complete one dependable deployment.

Relay's more useful first promise is smaller: give the customer one understandable Host they own, preserve independent Cells inside it, expose them through deliberate authenticated ingress, and make each Cell recoverable away from that Host. An operator can reason about cost, trust, backup, and failure because those concerns have a physical home.

The model can grow later. It should not require a distributed system merely to earn the word “cloud.”

## 3. Where it sits in the arc

Every earlier memo becomes a constraint here. A [Cell is not a folder](../why-relay-host-cells/article.md). [npm and OCI](../npm-and-cell-image/article.md) remain direct-versus-managed delivery shapes. [Same-Host customers trust the Host administrator](../ten-customers-one-host/article.md). [Managed authority is licensed](../free-cell-licensed-host/article.md), while the runtime remains free. [Recovery leaves the Host](../lose-host-keep-cell/article.md).

A future Fleet Controller may coordinate several Hosts. That future does not justify calling a remote controller the Host or letting one Host Supervisor reach directly into Cells on other machines.

## 4. The journey — move the contract, then prove it

**Begin with one known Host.** Run Relay directly or initialize managed Cells on infrastructure the operator can inspect. Establish identity, storage, ingress, and recovery responsibilities.

**Prepare a customer-owned destination.** Choose a server or virtual machine under the customer's account, with enough compute, storage, and network control for the intended Cells. Cost and capacity remain deployment inputs, not universal promises.

**Install the same control shape.** npm supplies Relay and the Host Supervisor. The Host resolves and verifies the compatible public Cell image by immutable digest. Customer state lives in mounted data and configuration, not inside the image.

**Expose deliberately.** Use the supported private-network or TLS ingress profile, create the first administrator, preserve recovery codes, and reject caller-provided routing identity.

**Prove before promoting.** Run customer-identical conformance for install, license, image acquisition, lifecycle, persistence, ingress, recovery, upgrade, rollback, and uninstall on the selected provider shape. Only accepted evidence can turn this draft into a provider claim.

## 5. Verification — what the cloud gate must establish

The conformance gate must prove more than “the page loaded.” It needs clean installation, immutable artifact verification, managed Cell admission, restart persistence, customer access, export and restore, and failure cleanup without hidden operator state. It must also capture the actual machine shape and observed resource envelope so cost guidance is release-stamped rather than folklore.

That evidence applies to the tested shape. It does not automatically establish every provider, architecture, region, or workload size. The memo remains draft until the owning cloud-conformance goal accepts the relevant proof.

## 6. Tradeoffs and honest gaps

- A single Host is easier to operate but remains one administrative and physical failure domain.
- Customer-owned cloud moves infrastructure responsibility to the customer or their operator; it is not a managed Orionfold service.
- Provider pricing and machine availability change, so any future guidance needs a dated evidence snapshot.
- Distributed databases, remote workload Hosts, multi-Host control, and platform-scale tenancy are future architecture choices, not implied features.
- No recovery-time, recovery-point, uptime, or service-level promise follows from running on a cloud provider.

This restraint is the point of the architecture: earn the next layer from customer evidence rather than from a fashionable diagram.

## 7. What this unlocks

Once one customer-owned Host shape passes conformance, Relay can offer a repeatable deployment path without forking the product into local and cloud editions. Agencies can operate a Host in their own account. Customers who need stronger administrative separation can own their own Host. Later, a Fleet Controller can coordinate multiple proven Hosts while each Host retains local authority over its Cells.

The iterative release path is valuable even before distributed architecture exists: direct Cell, managed local Host, signed public Cell image, paid fulfillment, customer-owned Host conformance, then optional multi-Host coordination.

## 8. Closing

Cloud is an address and an operating responsibility before it is an architecture style.

Relay should first prove that the same honest Host and Cell contract survives the move to infrastructure the customer owns. This memo will move from draft only when that proof exists.

---

_Draft capstone. Provider-success claims remain gated by G-085._
