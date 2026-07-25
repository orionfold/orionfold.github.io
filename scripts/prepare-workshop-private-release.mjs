#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, join, posix, resolve } from 'node:path';

export const DELIVERY_SCHEMA_VERSION = 'orionfold-workshop-delivery-v1';
export const WORKSHOP_EDITION_ID = 'relay-operator-workshop-2026-07-founding';
export const WORKSHOP_EDITION_VERSION = '2026.07';
export const WORKSHOP_EDITION_HASH =
  '669d04da5d429d937e7f94c46eafbd1903e3016655c6555285ef39871137a966';
export const EXPECTED_STAGES = ['inspect', 'adapt', 'govern', 'run', 'retain', 'proof', 'update'];

const CONTENT_TYPES = {
  master: 'video/mp4',
  captions: 'text/vtt; charset=utf-8',
  transcript: 'text/markdown; charset=utf-8',
};

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) throw new Error(`Unexpected argument: ${arg}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
    args[arg.slice(2)] = value;
    index += 1;
  }
  return args;
}

export function safeRelativePath(value) {
  if (typeof value !== 'string' || !value || value.startsWith('/') || value.includes('\\')) {
    throw new Error(`Unsafe bundle path: ${String(value)}`);
  }
  const normalized = posix.normalize(value);
  if (normalized !== value || normalized === '..' || normalized.startsWith('../')) {
    throw new Error(`Unsafe bundle path: ${value}`);
  }
  return normalized;
}

export async function sha256File(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

function stageId(asset) {
  if (asset.asset_id === 'private-proof-cut') return 'proof';
  if (asset.asset_id === 'private-edition-update') return 'update';
  if (asset.asset_id?.startsWith('private-module-') && EXPECTED_STAGES.includes(asset.objective_id)) {
    return asset.objective_id;
  }
  throw new Error(`Unrecognized customer asset: ${asset.asset_id}`);
}

function fileRecord(filesByPath, editionId, role, path) {
  const safePath = safeRelativePath(path);
  const source = filesByPath.get(safePath);
  if (!source || source.role !== role) throw new Error(`Missing ${role} record for ${safePath}`);
  return {
    role,
    storage_key: `${editionId}/${safePath}`,
    sha256: source.sha256,
    size: source.size,
    content_type: CONTENT_TYPES[role],
  };
}

export async function prepareWorkshopPrivateRelease({
  bundleDir,
  outDir,
  expectedManifestSha256,
}) {
  if (!bundleDir || !outDir || !expectedManifestSha256) {
    throw new Error('bundleDir, outDir, and expectedManifestSha256 are required');
  }
  const sourceRoot = resolve(bundleDir);
  const sourceManifestPath = join(sourceRoot, 'manifest.json');
  const sourceManifest = JSON.parse(await readFile(sourceManifestPath, 'utf8'));
  if (sourceManifest.status !== 'accepted') throw new Error('Motion bundle is not accepted');
  if (sourceManifest.private_public_boundary?.classification !== 'private') {
    throw new Error('Motion bundle is not classified private');
  }
  if (sourceManifest.manifest_sha256 !== expectedManifestSha256) {
    throw new Error(`Motion manifest mismatch: ${sourceManifest.manifest_sha256}`);
  }

  const files = sourceManifest.files;
  if (!Array.isArray(files)) throw new Error('Motion manifest files are missing');
  const filesByPath = new Map();
  for (const file of files) {
    const path = safeRelativePath(file.path);
    if (filesByPath.has(path)) throw new Error(`Duplicate Motion file path: ${path}`);
    if (!/^[a-f0-9]{64}$/.test(file.sha256) || !Number.isSafeInteger(file.size) || file.size < 1) {
      throw new Error(`Invalid Motion file receipt: ${path}`);
    }
    filesByPath.set(path, file);
  }

  const assets = sourceManifest.assets;
  if (!Array.isArray(assets) || assets.length !== EXPECTED_STAGES.length) {
    throw new Error(`Expected ${EXPECTED_STAGES.length} customer assets`);
  }

  const stages = {};
  const deliveryFiles = [];
  for (const asset of assets) {
    if (asset.classification !== 'private') throw new Error(`Asset is not private: ${asset.asset_id}`);
    const id = stageId(asset);
    if (stages[id]) throw new Error(`Duplicate stage: ${id}`);
    const stageFiles = {
      media: fileRecord(filesByPath, WORKSHOP_EDITION_ID, 'master', asset.files?.master),
      captions: fileRecord(filesByPath, WORKSHOP_EDITION_ID, 'captions', asset.files?.captions),
      transcript: fileRecord(filesByPath, WORKSHOP_EDITION_ID, 'transcript', asset.files?.transcript),
    };
    stages[id] = {
      id,
      asset_id: asset.asset_id,
      objective_id: asset.objective_id,
      duration_seconds: asset.duration_seconds,
      width: asset.width,
      height: asset.height,
      files: stageFiles,
    };
    deliveryFiles.push(...Object.values(stageFiles));
  }

  const actualStages = Object.keys(stages).sort();
  const expectedStages = [...EXPECTED_STAGES].sort();
  if (JSON.stringify(actualStages) !== JSON.stringify(expectedStages)) {
    throw new Error(`Stage mismatch: ${actualStages.join(',')}`);
  }

  for (const file of deliveryFiles) {
    const relative = file.storage_key.slice(`${WORKSHOP_EDITION_ID}/`.length);
    const sourcePath = join(sourceRoot, relative);
    const [details, sha256] = await Promise.all([stat(sourcePath), sha256File(sourcePath)]);
    if (details.size !== file.size || sha256 !== file.sha256) {
      throw new Error(`Accepted file verification failed: ${relative}`);
    }
  }

  const deliveryManifest = {
    schema_version: DELIVERY_SCHEMA_VERSION,
    status: 'accepted',
    classification: 'private-paid',
    offering_id: 'relay-operator-workshop',
    edition_id: WORKSHOP_EDITION_ID,
    edition_version: WORKSHOP_EDITION_VERSION,
    edition_hash: WORKSHOP_EDITION_HASH,
    source_bundle_manifest_sha256: expectedManifestSha256,
    source_bundle: basename(sourceRoot),
    stages,
  };
  const serialized = `${JSON.stringify(deliveryManifest, null, 2)}\n`;
  const deliverySha256 = createHash('sha256').update(serialized).digest('hex');
  await mkdir(resolve(outDir), { recursive: true });
  const outputPath = join(resolve(outDir), 'delivery-manifest.json');
  await writeFile(outputPath, serialized, { mode: 0o600 });
  return {
    outputPath,
    deliverySha256,
    deliveryManifest,
    verifiedFiles: deliveryFiles.length,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const result = await prepareWorkshopPrivateRelease({
    bundleDir: args.bundle,
    outDir: args.out,
    expectedManifestSha256: args['expected-manifest'],
  });
  process.stdout.write(`${JSON.stringify({
    output: result.outputPath,
    sha256: result.deliverySha256,
    verified_files: result.verifiedFiles,
    stages: Object.keys(result.deliveryManifest.stages),
  }, null, 2)}\n`);
}
