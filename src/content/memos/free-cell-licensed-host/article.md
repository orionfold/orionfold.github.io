---
title: "Free Cell, licensed Host: what customers actually pay for"
date: 2026-07-19
stage: review
series: "Relay Host & Cells"
summary: "Relay Core, the direct Cell path, and the public Cell image remain free. A Host license pays for managed lifecycle authority within signed capacity; Packs remain a separate content entitlement."
tags: ["relay-host", "relay-cell", "licensing", "pricing", "fulfillment", "open-source"]
difficulty: beginner
signature: signature.svg
status: review
---

## 1. The claim

Customers do not pay to unlock Relay's engine or to download a Cell image. They pay when they want one Host to exercise managed authority over Cells within signed limits.

That division keeps three products distinct. **Relay Core** is the free application and direct unmanaged Cell path. The **Relay Cell image** is a free, signed OCI distribution of Core. **Relay Host** is the licensed right to create and manage Cells through the Host Supervisor. Paid **Packs** are maintained application content and do not imply Host rights.

## 2. Why this matters for the Relay operator

Container distribution often gets confused with commerce: private registry, paid image, pull token. Relay deliberately avoids that coupling. The intended Cell image is public because authenticity and paid authority are different questions.

An operator can inspect or run a direct Cell without a Host license. Downloading a signed image does not grant managed lifecycle actions. Buying a Host license does not become a Docker password. Installing a Pack does not increase managed Cell capacity.

The separation makes fulfillment understandable and failure safer. Losing commerce connectivity cannot reach into a running Cell merely because its bytes once came from a registry.

## 3. Where it sits in the arc

The [delivery memo](../npm-and-cell-image/article.md) names the three proofs: commercial entitlement, artifact authenticity, and registry access. This memo explains the customer promise behind them.

The accepted launch contract is scoped and customer-protective. Running, stopped, and retained managed Cells consume capacity. Direct unmanaged Cells, standalone exported archives, and permanently purged Cells do not. Exporting a backup alone does not silently free a slot; an explicit verified export-and-release or purge transition does.

Capacity is admission policy, not a kill switch.

## 4. The journey — from free use to managed authority

**Run Relay directly.** A person can use the free application as one unmanaged Cell without spending Host capacity.

**Choose managed operations.** An operator who wants named customer Cells, lifecycle controls, capacity accounting, and recovery installs a signed Host license through Relay's existing license flow.

**Verify offline.** The Host Supervisor verifies the license signature, term, product grant, licensee, local Host claim, and capacity without turning the license into an online session.

**Admit a lifecycle action.** Before creating resources, the supervisor checks commercial eligibility and physical capacity, then resolves and verifies the compatible public Cell image.

**Upgrade by replacing proof.** More capacity requires a newly signed license. Installing it changes future admission immediately; it does not rebuild or mutate existing Cells.

## 5. Verification — watch what happens at the edges

The strongest licensing test is expiry. A lapse blocks new Cells and routine feature upgrades. Existing Cells remain running or startable, stoppable, exportable, recoverable, rollback-capable, and purgeable. Compatible critical security updates remain available. Recovery is never held hostage.

At capacity, a new operation fails before it allocates a path, port, volume, network, Host record, or customer state. Existing Cells are not disturbed. A one-Host entitlement may move to a replacement machine for the same licensee after the prior claim is retired; transfer to another organization requires reissue.

These are executable product rules, not pricing-page prose.

## 6. Tradeoffs and honest gaps

- Host is still pre-release until the Website purchase and customer-identical fulfillment gate is accepted. This memo describes the accepted contract, not current general availability.
- Public image access does not imply support, an uptime promise, or managed service.
- Offline licensing favors customer continuity but requires explicit transfer and audit procedures.
- Packs and Host rights remain separate even when a future Website bundle presents them together.

No public price is asserted here. Commerce owns the offer and public wording once its release gate passes.

## 7. What this unlocks

The model creates a useful ladder. Learn and run one direct Cell for free. Add paid Host authority when customer operations need managed lifecycle. Add Packs when maintained domain applications save work. Keep the Cell runtime recoverable and obtainable independently of either commercial entitlement.

The [trust memo](../ten-customers-one-host/article.md) explains what managed density does and does not protect. The [recovery memo](../lose-host-keep-cell/article.md) shows why lapse cannot be allowed to strand customer state.

## 8. Closing

Free describes the runtime. Licensed describes the authority to manage a group of Cells. Signed describes the evidence that software or permission is authentic.

Those are separate properties. Relay keeps them separate so a purchase adds operational leverage without turning customer continuity into rent.

---

_Next: **Lose the Host, keep the Cell**._
