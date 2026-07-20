---
title: "One Relay, two delivery shapes: npm and the Cell image"
date: 2026-07-19
stage: review
series: "Relay Host & Cells"
summary: "npm and the Relay Cell image carry the same product release for different operating jobs: npm supports a direct Cell and installs Host control, while OCI gives a managed Host a sealed, repeatable Cell runtime."
tags: ["relay-host", "relay-cell", "npm", "oci", "containers", "distribution"]
difficulty: intermediate
signature: signature.svg
status: review
---

## 1. The claim

Relay does not have a “laptop edition” and a different “cloud edition.” It has one release delivered in two shapes for two operating jobs.

The npm package is the direct path: it installs Relay's command line and application, can run a personal unmanaged Cell, and supplies the separately invoked Host Supervisor. The Relay Cell image is the managed path: a Host pulls an immutable, signed Linux runtime and runs one image instance per managed Cell.

The distinction is **direct versus managed**, not local versus cloud.

## 2. Why this matters for the Relay operator

Two artifacts can look like two products. They are not. An operator can run the npm path on a laptop or a cloud virtual machine. A managed Host can run Cell images on a sufficiently capable laptop or on a server. The machine's address changes; the delivery responsibility does not.

The difference is closure. npm expects a compatible operating system, Node runtime, native libraries, dependency installation, and process administration around it. The Cell image carries a pinned Linux runtime closure—application, runtime, native production files, base system, ownership, and container metadata—so the Host can create repeatable Cells from a verified digest.

Comparing only compressed package sizes therefore answers the wrong question. The fair comparison is a complete installed npm environment against a complete OCI runtime.

## 3. Where it sits in the arc

The [pillar memo](../why-relay-host-cells/article.md) defines the topology. This memo explains how software reaches it.

The npm package owns the human-facing entry and local control surface. The public Cell image owns the sealed managed runtime. A common release manifest binds the npm and supervisor compatibility contract to an exact image digest. The image never starts the Host Supervisor and has no Host-or-Cell switch.

That separation keeps control outside the workload it controls.

## 4. The journey — choose the operating job

**Start directly.** A person who wants Relay on one machine can run an unmanaged Cell through npm. No container image or managed-Host authority is required.

**Decide to manage Cells.** When the operator needs named lifecycle, independent data roots, capacity admission, export, and recovery across customer instances, they initialize the Host Supervisor delivered through npm.

**Resolve one exact release.** The Host reads the signed release contract and selects an immutable Cell image digest compatible with the installed supervisor.

**Pull and verify.** The Host retrieves the public image and verifies release identity independently from commercial licensing. A license is not a registry password, and a registry signature is not a Host entitlement.

**Run repeatably.** Each managed Cell starts from the same sealed runtime while mounting its own data and configuration. Shared image layers can be cached; customer state remains outside the image.

## 5. Verification — three proofs, no substitution

Managed operation crosses three different gates. A commercial license answers whether the operator may perform managed Host actions and within which limits. An OCI signature and digest answer whether the bytes came from the authorized Relay release workflow. Registry access answers whether a principal may pull from that repository.

Each proof has one job. The intended Cell repository is public, so normal acquisition needs no customer registry secret. The Host still verifies the immutable digest and release evidence. Paid authority is checked separately before lifecycle admission.

This separation prevents a public image from accidentally granting paid Host rights and prevents a commercial license from being misused as an image credential.

## 6. Tradeoffs and honest gaps

- OCI carries more bytes because it includes a pinned Linux runtime closure; npm delegates those dependencies to the target machine.
- Managed Cells require an OCI-compatible container engine and operational capacity on the Host.
- The public image makes the runtime obtainable, not the paid Host product generally available.
- Multi-architecture publication proves supported image variants, not every cloud provider or machine configuration.

The extra artifact earns its cost only when repeatable managed Cells matter. A personal direct Cell does not need it.

## 7. What this unlocks

The two-shape model preserves a gentle start while leaving room for disciplined operations. A solo user keeps the direct npm experience. An agency can add the local Host Supervisor without changing products. A customer-owned server can pull the same signed Cell runtime without sending application data to Orionfold.

The [fulfillment memo](../free-cell-licensed-host/article.md) explains why both runtime shapes can remain free while managed authority is licensed. The [cloud capstone](../same-host-new-address/article.md) explains why moving the same Host contract to a different address is a deployment change, not a new edition.

## 8. Closing

npm is the adaptable installation path. OCI is the sealed workload path. Both carry Relay; neither is shorthand for laptop or cloud.

One release, two delivery shapes, and a manifest that keeps them honest.

---

_Next: **Ten customers, one Host**._
