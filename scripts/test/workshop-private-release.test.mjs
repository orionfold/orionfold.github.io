import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import {
  EXPECTED_STAGES,
  prepareWorkshopPrivateRelease,
  safeRelativePath,
  WORKSHOP_EDITION_HASH,
  WORKSHOP_EDITION_ID,
} from '../prepare-workshop-private-release.mjs';

const expectedManifest = '8'.repeat(64);
const assetIds = {
  inspect: 'private-module-inspect',
  adapt: 'private-module-adapt',
  govern: 'private-module-govern',
  run: 'private-module-run',
  retain: 'private-module-retain',
  proof: 'private-proof-cut',
  update: 'private-edition-update',
};

const rolePaths = (stage) => ({
  master: `media/${stage}.mp4`,
  captions: `captions/${stage}.vtt`,
  transcript: `transcripts/${stage}.md`,
});

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'workshop-private-release-'));
  const bundle = join(root, 'accepted-bundle');
  const out = join(root, 'out');
  const files = [];
  const assets = [];
  for (const stage of EXPECTED_STAGES) {
    const paths = rolePaths(stage);
    for (const [role, path] of Object.entries(paths)) {
      const content = `${stage}:${role}\n`;
      await mkdir(join(bundle, path.split('/')[0]), { recursive: true });
      await writeFile(join(bundle, path), content);
      files.push({
        role,
        path,
        sha256: createHash('sha256').update(content).digest('hex'),
        size: Buffer.byteLength(content),
      });
    }
    assets.push({
      asset_id: assetIds[stage],
      objective_id: ['proof', 'update'].includes(stage) ? stage : stage,
      classification: 'private',
      width: 1920,
      height: 1080,
      duration_seconds: 300,
      files: paths,
    });
  }
  const manifest = {
    status: 'accepted',
    manifest_sha256: expectedManifest,
    private_public_boundary: { classification: 'private' },
    assets,
    files,
  };
  await writeFile(join(bundle, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return { root, bundle, out, manifest };
}

test('safeRelativePath rejects absolute and traversal paths', () => {
  assert.equal(safeRelativePath('media/lesson.mp4'), 'media/lesson.mp4');
  for (const path of ['/media/lesson.mp4', '../lesson.mp4', 'media/../lesson.mp4', 'media\\lesson.mp4']) {
    assert.throws(() => safeRelativePath(path), /Unsafe bundle path/);
  }
});

test('prepares a deterministic customer-safe delivery manifest', async () => {
  const sample = await fixture();
  try {
    const result = await prepareWorkshopPrivateRelease({
      bundleDir: sample.bundle,
      outDir: sample.out,
      expectedManifestSha256: expectedManifest,
    });
    assert.equal(result.verifiedFiles, 21);
    assert.deepEqual(Object.keys(result.deliveryManifest.stages).sort(), [...EXPECTED_STAGES].sort());
    assert.equal(result.deliveryManifest.edition_id, WORKSHOP_EDITION_ID);
    assert.equal(result.deliveryManifest.edition_hash, WORKSHOP_EDITION_HASH);
    const serialized = await readFile(result.outputPath, 'utf8');
    assert.doesNotMatch(serialized, new RegExp(sample.root));
    assert.doesNotMatch(serialized, /provider|spend|operator-review|contact-sheet/i);
    assert.match(serialized, new RegExp(`${WORKSHOP_EDITION_ID}/media/inspect.mp4`));

    const repeated = await prepareWorkshopPrivateRelease({
      bundleDir: sample.bundle,
      outDir: sample.out,
      expectedManifestSha256: expectedManifest,
    });
    assert.equal(repeated.deliverySha256, result.deliverySha256);
  } finally {
    await rm(sample.root, { recursive: true, force: true });
  }
});

test('fails closed on a changed accepted file', async () => {
  const sample = await fixture();
  try {
    await writeFile(join(sample.bundle, 'media/inspect.mp4'), 'changed\n');
    await assert.rejects(
      prepareWorkshopPrivateRelease({
        bundleDir: sample.bundle,
        outDir: sample.out,
        expectedManifestSha256: expectedManifest,
      }),
      /Accepted file verification failed/,
    );
  } finally {
    await rm(sample.root, { recursive: true, force: true });
  }
});
