import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  WORKSHOP_DELIVERY_SCHEMA,
  WORKSHOP_DELIVERY_STAGES,
  parseWorkshopDeliveryManifest,
  workshopStageFiles,
} from "./workshop-delivery.ts";
import {
  WORKSHOP_EDITION_HASH,
  WORKSHOP_EDITION_ID,
  WORKSHOP_EDITION_VERSION,
  WORKSHOP_MOTION_BUNDLE_HASH,
  WORKSHOP_OFFERING_ID,
} from "./workshop-contract.ts";

function manifest() {
  const stages = Object.fromEntries(WORKSHOP_DELIVERY_STAGES.map((id) => [
    id,
    {
      id,
      asset_id: `private-${id}`,
      objective_id: id,
      duration_seconds: 300,
      width: 1920,
      height: 1080,
      files: {
        media: {
          role: "master",
          storage_key: `${WORKSHOP_EDITION_ID}/media/${id}.mp4`,
          sha256: "a".repeat(64),
          size: 100,
          content_type: "video/mp4",
        },
        captions: {
          role: "captions",
          storage_key: `${WORKSHOP_EDITION_ID}/captions/${id}.vtt`,
          sha256: "b".repeat(64),
          size: 20,
          content_type: "text/vtt; charset=utf-8",
        },
        transcript: {
          role: "transcript",
          storage_key: `${WORKSHOP_EDITION_ID}/transcripts/${id}.md`,
          sha256: "c".repeat(64),
          size: 30,
          content_type: "text/markdown; charset=utf-8",
        },
      },
    },
  ]));
  return {
    schema_version: WORKSHOP_DELIVERY_SCHEMA,
    status: "accepted",
    classification: "private-paid",
    offering_id: WORKSHOP_OFFERING_ID,
    edition_id: WORKSHOP_EDITION_ID,
    edition_version: WORKSHOP_EDITION_VERSION,
    edition_hash: WORKSHOP_EDITION_HASH,
    source_bundle_manifest_sha256: WORKSHOP_MOTION_BUNDLE_HASH,
    source_bundle: "accepted-revision-03",
    stages,
  };
}

Deno.test("workshop delivery manifest accepts the exact private edition", () => {
  const parsed = parseWorkshopDeliveryManifest(manifest());
  assertEquals(Object.keys(parsed.stages), [...WORKSHOP_DELIVERY_STAGES]);
  assertEquals(
    workshopStageFiles(parsed, "inspect").media.storage_key,
    `${WORKSHOP_EDITION_ID}/media/inspect.mp4`,
  );
});

Deno.test("workshop delivery manifest rejects identity drift", () => {
  const value = manifest();
  value.edition_hash = "d".repeat(64);
  assertThrows(() => parseWorkshopDeliveryManifest(value), Error, "identity mismatch");
});

Deno.test("workshop delivery manifest rejects missing stages and unsafe paths", () => {
  const missing = manifest();
  delete missing.stages.update;
  assertThrows(() => parseWorkshopDeliveryManifest(missing), Error, "stages mismatch");

  const unsafe = manifest();
  unsafe.stages.inspect.files.media.storage_key =
    `${WORKSHOP_EDITION_ID}/media/../private.mp4`;
  assertThrows(() => parseWorkshopDeliveryManifest(unsafe), Error, "unsafe");
});

Deno.test("workshop delivery manifest rejects duplicate storage keys and unknown stages", () => {
  const duplicate = manifest();
  duplicate.stages.adapt.files.media.storage_key =
    duplicate.stages.inspect.files.media.storage_key;
  assertThrows(() => parseWorkshopDeliveryManifest(duplicate), Error, "duplicated");
  const parsed = parseWorkshopDeliveryManifest(manifest());
  assertThrows(() => workshopStageFiles(parsed, "unknown"), Error, "stage is invalid");
});
