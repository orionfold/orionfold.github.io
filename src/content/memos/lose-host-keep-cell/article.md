---
title: "Lose the Host, keep the Cell"
date: 2026-07-19
stage: review
series: "Relay Host & Cells"
summary: "A Relay Cell can leave a failed Host as a customer-owned encrypted recovery bundle containing the state needed to rebuild it. The customer keeps the key, verifies the bundle, and practices restoration."
tags: ["relay-host", "relay-cell", "recovery", "backup", "ownership", "resilience"]
difficulty: intermediate
signature: signature.svg
status: review
---

## 1. The claim

Customer ownership is incomplete if it ends when a laptop, virtual machine, or disk fails.

Relay can package one complete Cell into a versioned, encrypted recovery bundle stored away from its Host. The bundle carries the Cell's live-safe database backup, administrator access state, files, settings, license rows, and local secret root. The customer holds the recovery key; Orionfold does not receive or retain it.

The portable unit is the Cell, not the Host.

## 2. Why this matters for the Relay operator

A backup checkbox can create false comfort. A file may exist but use the wrong key, omit a secret root, contain an inconsistent database, or fail only when the original Host is already gone.

Relay treats create, verify, drill, restore, and prune as separate named operations. A bundle is authenticated and content-complete. Verification checks it without changing live state. A drill extracts and validates it in an isolated temporary location. Restore refuses to overwrite a running Cell and rebuilds related state together.

Recovery therefore becomes a practiced customer capability rather than an operator's hopeful memory.

## 3. Where it sits in the arc

The [pillar memo](../why-relay-host-cells/article.md) defines a Cell as the operational identity worth preserving. The [trust memo](../ten-customers-one-host/article.md) explains why several Cells may share a Host while keeping independent state. Recovery completes that story by letting one Cell leave the shared failure domain.

The Host Supervisor's capacity rules recognize that distinction. Retaining a Cell keeps its slot. A verified export-and-release can free the slot because the recovery artifact and receipt establish a deliberate handoff. A plain backup copy does not mutate managed inventory.

## 4. The journey — prepare before the Host fails

**Create a separate key.** Generate a strong recovery key outside both the Cell data directory and the bundle destination. If the customer loses it, Orionfold cannot recreate it.

**Choose a separate destination.** Point recovery at customer-owned removable or separately mounted storage. Placing bundles beside the Cell preserves neither independence nor useful disaster recovery.

**Create and verify.** Package a live-safe snapshot, authenticate its contents, and write a content-free receipt. Verify the result while the source Cell is still healthy.

**Run a drill.** Decrypt and inspect the archive in a disposable environment. Practice with the stored key and the intended recovery operator, not only with the person who built the original Host.

**Restore to emptiness.** After loss, restore into a missing or empty destination with the same Cell identity. Start the rebuilt Cell only after version and content validation succeeds.

## 5. Verification — prove the shadow path

The recovery path checks wrong keys, wrong Cell identities, incompatible future versions, missing files, and non-empty destinations as named failures. Database state, access state, files, settings, license data, and the local secret root move together so one recovered component does not invalidate another.

The operator should preserve the content-free receipt and compare the recovered Cell's identity and application state. A periodic drill is stronger evidence than the age of the latest bundle alone.

Relay intentionally makes no recovery-time, recovery-point, replication, cloud-durability, or service-level promise for the customer-selected destination. The software can prove its bundle; only the customer can prove the surrounding storage and operating practice.

## 6. Tradeoffs and honest gaps

- Customer-held encryption means lost keys are genuinely unrecoverable.
- A bundle stored on the same failing disk is not meaningful Host-loss protection.
- Verification proves package integrity, not the durability of the external storage provider.
- A successful local drill does not establish a universal recovery time or availability guarantee.

Ownership transfers responsibility as well as control. Relay makes the responsibilities visible instead of hiding them behind a hosted-service promise it does not offer.

## 7. What this unlocks

A customer can replace a failed Host, move a Cell under a new administrator, or keep an exit artifact outside the operator's machine. License lapse cannot block that safety path. An operator can release capacity only after a verified recovery checkpoint exists, without deleting the evidence needed to rebuild the customer.

The [cloud capstone](../same-host-new-address/article.md) uses this recovery contract as part of a future customer-owned deployment journey. Changing an address is operationally useful only when the state can survive the move.

## 8. Closing

The Host is where a Cell runs. It is not where the customer's right to recover must end.

Keep the key apart. Keep the bundle apart. Verify while the source is healthy. Then losing a Host can remain an infrastructure event instead of becoming loss of the business system inside it.

---

_Next: **Same Host, new address**._
