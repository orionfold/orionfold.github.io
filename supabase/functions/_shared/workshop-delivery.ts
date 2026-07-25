import {
  WORKSHOP_EDITION_HASH,
  WORKSHOP_EDITION_ID,
  WORKSHOP_EDITION_VERSION,
  WORKSHOP_MOTION_BUNDLE_HASH,
  WORKSHOP_OFFERING_ID,
} from "./workshop-contract.ts";

export const WORKSHOP_DELIVERY_SCHEMA = "orionfold-workshop-delivery-v1";
export const WORKSHOP_DELIVERY_STAGES = [
  "inspect",
  "adapt",
  "govern",
  "run",
  "retain",
  "proof",
  "update",
] as const;
export type WorkshopDeliveryStage = typeof WORKSHOP_DELIVERY_STAGES[number];
export type WorkshopDeliveryRole = "media" | "captions" | "transcript";

export interface WorkshopDeliveryFile {
  role: "master" | "captions" | "transcript";
  storage_key: string;
  sha256: string;
  size: number;
  content_type: string;
}

export interface WorkshopDeliveryManifest {
  schema_version: string;
  status: "accepted";
  classification: "private-paid";
  offering_id: string;
  edition_id: string;
  edition_version: string;
  edition_hash: string;
  source_bundle_manifest_sha256: string;
  source_bundle: string;
  stages: Record<WorkshopDeliveryStage, {
    id: WorkshopDeliveryStage;
    asset_id: string;
    objective_id: string;
    duration_seconds: number;
    width: number;
    height: number;
    files: Record<WorkshopDeliveryRole, WorkshopDeliveryFile>;
  }>;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("workshop delivery manifest is invalid");
  }
  return value as Record<string, unknown>;
}

function exactKeys(actual: string[], expected: readonly string[], label: string) {
  const left = [...actual].sort().join(",");
  const right = [...expected].sort().join(",");
  if (left !== right) throw new Error(`${label} mismatch`);
}

function safeStorageKey(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith(`${WORKSHOP_EDITION_ID}/`)) {
    throw new Error("workshop delivery storage key is invalid");
  }
  if (value.includes("\\") || value.includes("//") || value.split("/").includes("..")) {
    throw new Error("workshop delivery storage key is unsafe");
  }
  return value;
}

export function parseWorkshopDeliveryManifest(input: unknown): WorkshopDeliveryManifest {
  const manifest = object(input);
  if (
    manifest.schema_version !== WORKSHOP_DELIVERY_SCHEMA ||
    manifest.status !== "accepted" ||
    manifest.classification !== "private-paid" ||
    manifest.offering_id !== WORKSHOP_OFFERING_ID ||
    manifest.edition_id !== WORKSHOP_EDITION_ID ||
    manifest.edition_version !== WORKSHOP_EDITION_VERSION ||
    manifest.edition_hash !== WORKSHOP_EDITION_HASH ||
    manifest.source_bundle_manifest_sha256 !== WORKSHOP_MOTION_BUNDLE_HASH
  ) {
    throw new Error("workshop delivery identity mismatch");
  }
  if (typeof manifest.source_bundle !== "string" || !manifest.source_bundle) {
    throw new Error("workshop source bundle is missing");
  }

  const stages = object(manifest.stages);
  exactKeys(Object.keys(stages), WORKSHOP_DELIVERY_STAGES, "workshop delivery stages");
  const seen = new Set<string>();
  for (const stageId of WORKSHOP_DELIVERY_STAGES) {
    const stage = object(stages[stageId]);
    if (
      stage.id !== stageId ||
      typeof stage.asset_id !== "string" ||
      typeof stage.objective_id !== "string" ||
      typeof stage.duration_seconds !== "number" ||
      stage.duration_seconds <= 0 ||
      stage.width !== 1920 ||
      stage.height !== 1080
    ) {
      throw new Error(`workshop delivery stage is invalid: ${stageId}`);
    }
    const files = object(stage.files);
    exactKeys(Object.keys(files), ["media", "captions", "transcript"], `${stageId} files`);
    for (const role of ["media", "captions", "transcript"] as const) {
      const file = object(files[role]);
      const expectedRole = role === "media" ? "master" : role;
      const storageKey = safeStorageKey(file.storage_key);
      if (
        file.role !== expectedRole ||
        typeof file.sha256 !== "string" ||
        !/^[a-f0-9]{64}$/.test(file.sha256) ||
        typeof file.size !== "number" ||
        !Number.isSafeInteger(file.size) ||
        file.size < 1 ||
        typeof file.content_type !== "string" ||
        !file.content_type
      ) {
        throw new Error(`workshop delivery file is invalid: ${stageId}/${role}`);
      }
      if (seen.has(storageKey)) throw new Error("workshop delivery storage key is duplicated");
      seen.add(storageKey);
    }
  }
  return manifest as unknown as WorkshopDeliveryManifest;
}

export function workshopStageFiles(
  manifest: WorkshopDeliveryManifest,
  stage: string,
): Record<WorkshopDeliveryRole, WorkshopDeliveryFile> {
  if (!WORKSHOP_DELIVERY_STAGES.includes(stage as WorkshopDeliveryStage)) {
    throw new Error("workshop stage is invalid");
  }
  return manifest.stages[stage as WorkshopDeliveryStage].files;
}
