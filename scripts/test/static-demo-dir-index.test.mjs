import assert from 'node:assert/strict';
import { rewriteStaticDemoIndex } from '../../src/lib/static-demo-dir-index.mjs';

assert.equal(rewriteStaticDemoIndex('/relay/demo/'), '/relay/demo/index.html');
assert.equal(rewriteStaticDemoIndex('/relay/demo/workflows/?lane=triage'), '/relay/demo/workflows/index.html?lane=triage');
assert.equal(rewriteStaticDemoIndex('/arena/demo/models/'), '/arena/demo/models/index.html');
assert.equal(rewriteStaticDemoIndex('/relay/demo/relay-demo/boot.js'), '/relay/demo/relay-demo/boot.js');
assert.equal(rewriteStaticDemoIndex('/relay/docs/'), '/relay/docs/');
assert.equal(rewriteStaticDemoIndex(undefined), undefined);

console.log('static-demo-dir-index: all assertions passed');
