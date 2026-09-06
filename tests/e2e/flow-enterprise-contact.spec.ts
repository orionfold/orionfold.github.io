import { buildSync } from 'esbuild';
import { expect, test, type Page } from './fixtures';

const fixtureEndpoint = 'http://127.0.0.1:4325/functions/v1/flow-enterprise-request';
const synthetic = {
  name: 'Website Test', email: 'manav@orionfold.com', company: 'Example Company',
  requirements: 'Twenty Mac users need shared purchasing and deployment guidance.',
  licenses: 20, heardAbout: 'A colleague', website: '',
};

// Exercise the actual controller with an explicit isolated build configuration.
// Explicit enabled and disabled fixtures remain valid before and after hosted activation.
// Strip page scripts only in this fixture so a second disabled controller cannot
// bind to the same form. Every request stays on a fulfilled loopback endpoint.
async function controllerFixture(page: Page, enabled = true) {
  const bundle = buildSync({
    entryPoints: ['src/scripts/flow-enterprise-contact.ts'], bundle: true,
    platform: 'browser', format: 'iife', write: false,
    define: { 'import.meta.env': JSON.stringify({
      PUBLIC_SERVICE_MODE: 'staging',
      PUBLIC_SUPABASE_FUNCTIONS_BASE: 'http://127.0.0.1:4325/functions/v1',
      PUBLIC_WORKSHOP_MEDIA_BASE: 'http://127.0.0.1:4325/storage/v1/object/public/workshop-public',
      PUBLIC_FLOW_ENTERPRISE_CONTACT_ENABLED: String(enabled),
    }) },
  }).outputFiles[0].text;
  await page.route('http://127.0.0.1:4325/flow/', async route => {
    const response = await route.fetch();
    const html = (await response.text())
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
      .replace(/<p\b[^>]*class="flow-enterprise-unavailable"[^>]*>[\s\S]*?<\/p>/, '')
      .replace('</body>', `<script>${bundle}</script></body>`);
    await route.fulfill({ response, body: html });
  });
}
async function openAndFill(page: Page) {
  await page.goto('/flow/');
  await page.getByRole('button', { name: 'Enterprise contact', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Contact name', { exact: true }).fill(synthetic.name);
  await page.getByLabel('Email', { exact: true }).fill(synthetic.email);
  await page.getByLabel('Company', { exact: true }).fill(synthetic.company);
  await page.getByLabel('Requirements details', { exact: true }).fill(synthetic.requirements);
  await page.getByLabel('Number of licenses', { exact: true }).fill(String(synthetic.licenses));
  await page.getByLabel(/Where did you hear about us/).fill(synthetic.heardAbout);
}

test('pricing owns the right actions and the unactivated form never sends', async ({ page }) => {
  await controllerFixture(page, false);
  await page.setViewportSize({ width: 390, height: 844 });
  const requests: string[] = [];
  page.on('request', request => { if (request.url().includes('flow-enterprise-request')) requests.push(request.method()); });
  await page.goto('/flow/');
  await expect(page.locator('[data-cta-placement="plan-download"],.ls-plan-download')).toHaveCount(0);
  await expect(page.locator('[data-plan="base"] [data-flow-download="flow-living-documents"]')).toHaveCount(1);
  await expect(page.locator('[data-plan="base"]')).toContainText('For Mac OS. Base is free forever. 10 Pro days included. No credit card to use.');
  await expect(page.locator('[data-plan="pro"]')).toContainText('Or pay in-app when ready.');
  const trigger = page.getByRole('button', { name: 'Enterprise contact', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel('Contact name', { exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Send requirements', exact: true })).toBeDisabled();
  await page.locator('#flow-enterprise-form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await expect(page.locator('#flow-enterprise-error')).toContainText('Online enquiries are not available yet.');
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(requests).toEqual([]);
});

test('enterprise validation, double-submit protection and uncertain retry keep one request identity', async ({ page }) => {
  await controllerFixture(page);
  const requests: Record<string, unknown>[] = [];
  let releaseFirst: (() => void) | undefined;
  await page.route(fixtureEndpoint, async route => {
    requests.push(route.request().postDataJSON());
    if (requests.length === 1) {
      await new Promise<void>(resolve => { releaseFirst = resolve; });
      await route.abort('failed');
    } else await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, requestId: requests.at(-1)!.requestId, notificationStatus: 'sent' }) });
  });
  await openAndFill(page);
  await page.getByLabel('Number of licenses', { exact: true }).fill('0');
  await page.getByRole('button', { name: 'Send requirements', exact: true }).click();
  await expect(page.getByLabel('Number of licenses', { exact: true })).toBeFocused();
  expect(requests).toHaveLength(0);
  await page.getByLabel('Number of licenses', { exact: true }).fill('20');
  await page.getByRole('button', { name: 'Send requirements', exact: true }).click();
  await expect.poll(() => requests.length).toBe(1);
  await expect(page.getByRole('button', { name: 'Saving requirements…', exact: true })).toBeDisabled();
  await page.locator('#flow-enterprise-form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(requests).toHaveLength(1);
  releaseFirst!();
  await expect(page.locator('#flow-enterprise-error')).toBeVisible();
  await expect(page.getByLabel('Requirements details', { exact: true })).toHaveValue(synthetic.requirements);
  await page.getByRole('button', { name: 'Send requirements', exact: true }).click();
  await expect(page.locator('#flow-enterprise-success')).toHaveText('Your requirements are saved. We’ll follow up by email.');
  expect(requests).toHaveLength(2);
  expect(requests[1].requestId).toBe(requests[0].requestId);
  expect(requests[1]).toMatchObject(synthetic);
  expect(Object.keys(requests[1]).sort()).toEqual(['requestId', ...Object.keys(synthetic)].sort());
  await expect(page.locator('#flow-enterprise-name')).toHaveValue('');
});

test('a mismatched receipt preserves data and an edited retry gets a new request ID', async ({ page }) => {
  await controllerFixture(page);
  const requests: Record<string, unknown>[] = [];
  await page.route(fixtureEndpoint, async route => {
    requests.push(route.request().postDataJSON());
    const latest = requests.at(-1)!;
    await route.fulfill({ status: requests.length === 1 ? 200 : 202, contentType: 'application/json', body: JSON.stringify({
      success: true, requestId: requests.length === 1 ? '00000000-0000-4000-8000-000000000000' : latest.requestId, notificationStatus: 'pending',
    }) });
  });
  await openAndFill(page);
  await page.getByRole('button', { name: 'Send requirements', exact: true }).click();
  await expect(page.locator('#flow-enterprise-error')).toContainText('could not be confirmed as saved');
  await expect(page.getByLabel('Company', { exact: true })).toHaveValue(synthetic.company);
  await page.getByLabel('Number of licenses', { exact: true }).fill('21');
  await page.getByRole('button', { name: 'Send requirements', exact: true }).click();
  await expect(page.locator('#flow-enterprise-success')).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[1].requestId).not.toBe(requests[0].requestId);
  expect(requests[1].licenses).toBe(21);
  await expect(page.locator('#flow-enterprise-success')).not.toContainText('email delivered');
});
