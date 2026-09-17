import { buildSync } from 'esbuild';
import { expect, test, type Page } from './fixtures';

const endpoint = 'http://127.0.0.1:4325/functions/v1/flow-living-documents-signup';
const formSelector = '[data-living-documents-form]';
const consent = 'Send me Flow updates, Living Documents Jobs, and the AI Native Newsletter. Up to one email a week. Unsubscribe any time.';

// Render the built form with its real controller, synthetic loopback transport,
// and an explicit gate. No request may reach an external email provider.
async function formFixture(page: Page, enabled = true) {
  const bundle = buildSync({ entryPoints: ['src/scripts/living-documents-signup.ts'], bundle: true, platform: 'browser', format: 'iife', write: false }).outputFiles[0].text;
  await page.route('http://127.0.0.1:4325/manifesto/**', async route => {
    const response = await route.fetch();
    const html = (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
      .replace(/(<form[^>]*data-living-documents-form[^>]*>)/, tag => tag.replace(/data-endpoint="[^"]*"/, `data-endpoint="${endpoint}"`).replace(/data-service-enabled="[^"]*"/, `data-service-enabled="${enabled}"`))
      .replace('</body>', `<script>${bundle}</script></body>`);
    await route.fulfill({ response, body: html });
  });
  await page.goto('/manifesto/?utm_source=browser-fixture');
  // Mirror Astro's gate-controlled button for this explicitly configured fixture.
  await page.locator(formSelector+' button[type=submit]').evaluate((button: HTMLButtonElement, on) => { button.disabled = !on; }, enabled);
}

test('new opt-in requires the full unchecked consent and preserves one identity on uncertain retry', async ({ page }) => {
  const requests: Record<string, unknown>[] = [];
  let releaseFirst: (() => void) | undefined;
  await page.route(endpoint, async route => {
    requests.push(route.request().postDataJSON());
    if (requests.length === 1) {
      await new Promise<void>(resolve => { releaseFirst = resolve; });
      await route.abort('failed');
    } else await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'If confirmation is needed and this address can receive updates, a confirmation email will arrive shortly.' }) });
  });
  await formFixture(page);
  const form = page.locator(formSelector);
  const optin = form.locator('input[name=consent]');
  const button = form.locator('button[type=submit]');
  await expect(optin).not.toBeChecked();
  await expect(form).toContainText(consent);
  await form.locator('input[name=email]').fill('reader@example.com');
  await button.click();
  await expect(form.locator('[data-signup-error]')).toContainText('Please confirm');
  expect(requests).toHaveLength(0);
  await optin.check();
  await button.click();
  await expect.poll(() => requests.length).toBe(1);
  await expect(button).toBeDisabled();
  await form.dispatchEvent('submit');
  expect(requests).toHaveLength(1);
  releaseFirst!();
  await expect(form.locator('[data-signup-error]')).toBeVisible();
  await expect(optin).toBeChecked();
  await expect(form.locator('input[name=email]')).toHaveValue('reader@example.com');
  await button.click();
  await expect(form.locator('[data-signup-success]')).toContainText('If confirmation is needed');
  expect(requests).toHaveLength(2);
  expect(requests[1].requestId).toBe(requests[0].requestId);
  expect(requests[1]).toMatchObject({ email: 'reader@example.com', offer: 'flow-living-documents-v1', consent_text: consent, consent_accepted: true, source: 'manifesto-living-documents', attribution: { utm_source: 'browser-fixture' } });
  await expect(optin).not.toBeChecked();
  await expect(form.locator('input[name=email]')).toHaveValue('');
});

test('disabled new opt-in remains inert even if submit is dispatched', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => { if (request.url() === endpoint) requests.push(request.method()); });
  await formFixture(page, false);
  const form = page.locator(formSelector);
  await expect(form.locator('button[type=submit]')).toBeDisabled();
  await form.dispatchEvent('submit');
  await expect(form.locator('[data-signup-error]')).toHaveText('Email updates are not available yet.');
  expect(requests).toHaveLength(0);
});

test('confirmation entry removes its token and waits for an explicit native POST', async ({ page }) => {
  const token = 'a'.repeat(64);
  const requests: { method: string; token: string | null }[] = [];
  await page.route('https://orionfold.supabase.co/functions/v1/flow-living-documents-confirm', async route => {
    const request = route.request();
    requests.push({ method: request.method(), token: new URLSearchParams(request.postData() ?? '').get('token') });
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Synthetic confirmation received</h1>' });
  });
  await page.goto(`/flow/confirm/?token=${token}`);
  await expect(page).toHaveURL('http://127.0.0.1:4325/flow/confirm/');
  await expect(page.locator('[data-living-confirmation-copy]')).toHaveText('Confirm your subscription to the updates listed in your email.');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');
  await expect(page.locator('script[src^="https:"]')).toHaveCount(0);
  expect(requests).toHaveLength(0);
  await page.getByRole('button', { name: 'Confirm subscription', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Synthetic confirmation received' })).toBeVisible();
  expect(requests).toEqual([{ method: 'POST', token }]);
});
