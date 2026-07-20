import assert from 'node:assert/strict';
import { scrubPublicEmails } from '../prepare-relay-demo.mjs';

const sampleAlice = ['alice', 'example.com'].join('@');
const sampleName = ['name', 'example.com'].join('@');
const sampleUpper = ['ALICE', 'EXAMPLE.COM'].join('@');

assert.equal(
  scrubPublicEmails(`${sampleAlice} and ${sampleName}`),
  'alice [at] example [dot] com and name [at] example [dot] com',
);
assert.equal(
  scrubPublicEmails('Contact manav@orionfold.com'),
  'Contact manav@orionfold.com',
);
assert.equal(
  scrubPublicEmails(sampleUpper),
  'ALICE [at] EXAMPLE [dot] COM',
);

console.log('prepare-relay-demo: sample emails scrubbed; public contact preserved');
