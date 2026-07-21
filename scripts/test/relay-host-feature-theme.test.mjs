import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const component = readFileSync(
  new URL('../../src/components/product/RelayHostBox.astro', import.meta.url),
  'utf8',
);
const homepage = readFileSync(new URL('../../src/pages/index.astro', import.meta.url), 'utf8');
const relayPage = readFileSync(new URL('../../src/pages/relay/index.astro', import.meta.url), 'utf8');

assert.match(homepage, /<RelayHostBox placement="home"\s*\/>/, 'homepage uses the shared Relay Host feature');
assert.match(relayPage, /<RelayHostBox\s*\/>/, 'Relay overview uses the shared Relay Host feature');
assert.match(component, /id: 'settings-host-deployment'/, 'feature uses the current themed Host deployment capture');
assert.match(component, /data-relay-shot/, 'deployment capture participates in resolved theme switching');
assert.match(component, /data-shot-light-src=\{deploymentShot\.light\.src\}/, 'light mode uses the optimized light capture');
assert.match(component, /data-shot-dark-src=\{deploymentShot\.dark\.src\}/, 'dark mode uses the optimized dark capture');
assert.match(component, /--host-canvas-bg: #eff9f8/, 'feature defines a light canvas by default');
assert.match(component, /:global\(html\[data-theme='dark'\]\) \.relay-host-feature__canvas/, 'feature retains a scoped dark override');
assert.doesNotMatch(component, /import relayHostDeployment/, 'feature no longer pins the legacy dark-only screenshot');

console.log('relay-host-feature-theme: shared homepage and Relay placements honor the resolved theme');
