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

async function captureConfirmationEvents(page: Page) {
  await page.addInitScript(() => {
    const analytics = window as typeof window & { __confirmationEvents: unknown[][]; gtag: (...args: unknown[]) => void };
    analytics.__confirmationEvents = [];
    analytics.gtag = (...args: unknown[]) => analytics.__confirmationEvents.push(args);
  });
}
async function confirmationEvents(page: Page) {
  return page.evaluate(() => (window as typeof window & { __confirmationEvents: unknown[][] }).__confirmationEvents);
}

for (const width of [1440, 390]) {
  test(`Flow confirmation returns to the familiar dismissing bar at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install({ time: new Date('2026-09-17T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-09-17T12:00:01Z'));
    await captureConfirmationEvents(page);
    await page.goto('/');
    await page.evaluate(async () => { await document.fonts.ready; });
    const slot = page.locator('#nav-notice-slot');
    const navigation = page.locator('#main-nav');
    await expect(page.locator('#magnet-bar')).toBeVisible();
    const originalSlot = await slot.boundingBox();
    const originalNav = await navigation.boundingBox();
    await page.evaluate(() => localStorage.setItem('of-flow-bar-dismissed', '1'));
    await page.goto('/?living-documents-confirmed=1&utm_source=email');
    await page.evaluate(async () => { await document.fonts.ready; });
    const bar = page.locator('#confirm-bar');
    await expect(bar).toBeVisible();
    await expect(bar.locator('#confirm-bar-text')).toHaveText('Thanks for subscribing to the Flow email newsletter.');
    await expect(bar.locator('#confirm-bar-detail')).toBeHidden();
    await expect(bar.locator('#confirm-bar-cta')).toBeHidden();
    await expect(page.locator('#magnet-bar')).toBeHidden();
    await expect(page.locator('#magnet-bar')).toHaveAttribute('aria-hidden', 'true');
    const activeSlot = await slot.boundingBox();
    const activeNav = await navigation.boundingBox();
    expect(Math.abs(activeSlot!.height - originalSlot!.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(activeNav!.y - originalNav!.y)).toBeLessThanOrEqual(1);
    const noticeText = await bar.locator('p').boundingBox();
    const notice = await bar.boundingBox();
    expect(noticeText!.y).toBeGreaterThanOrEqual(notice!.y);
    expect(noticeText!.y + noticeText!.height).toBeLessThanOrEqual(notice!.y + notice!.height);
    expect(await page.evaluate(() => localStorage.getItem('of-flow-bar-dismissed'))).toBeNull();
    await expect(page.locator('[data-living-confirmation-form]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Confirm subscription', exact: true })).toHaveCount(0);
    await expect(page).toHaveURL('http://127.0.0.1:4325/?utm_source=email');
    expect(await confirmationEvents(page)).toEqual([['event', 'confirmed_lead', { offer: 'flow-living-documents-v1', form_source: 'manifesto-living-documents' }]]);
    expect(await page.evaluate(() => sessionStorage.getItem('of-confirm-welcome'))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem('of-confirm-welcome-dismissed'))).toBeNull();
    await page.clock.runFor(7900);
    await expect(bar).toBeVisible();
    await page.clock.runFor(200);
    await expect(bar).toBeHidden();
    await expect(page.locator('#magnet-bar')).toBeVisible();
    await expect(page.locator('#magnet-bar')).not.toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#magnet-bar a')).toHaveAttribute('href', /flow-downloads\/Orionfold-Flow\.dmg/);
    const restoredSlot = await slot.boundingBox();
    const restoredNav = await navigation.boundingBox();
    expect(Math.abs(restoredSlot!.height - activeSlot!.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(restoredNav!.y - activeNav!.y)).toBeLessThanOrEqual(1);
    // Registration must survive initial suppression by a confirmation notice.
    await page.locator('#magnet-bar-close').click();
    await expect(page.locator('#magnet-bar')).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('of-flow-bar-dismissed'))).toBe('1');
    await page.reload();
    await expect(bar).toBeHidden();
    expect(await confirmationEvents(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
  });
}

test('already and failed Flow links show a closable bar without new-lead measurement', async ({ page }) => {
  await captureConfirmationEvents(page);
  for (const state of ['already', 'error']) {
    await page.goto(`/?living-documents-confirmed=${state}`);
    const bar = page.locator('#confirm-bar');
    await expect(bar).toBeVisible();
    await expect(bar.locator('#confirm-bar-text')).toHaveText(state === 'already' ? "You're already subscribed to the Flow email newsletter." : "That confirmation link didn't work.");
    await expect(bar.locator('#confirm-bar-cta')).toBeHidden();
    expect(await confirmationEvents(page)).toEqual([]);
    const before = await page.locator('#main-nav').boundingBox();
    await bar.getByRole('button', { name: 'Dismiss', exact: true }).click();
    await expect(bar).toBeHidden();
    await expect(page.locator('#magnet-bar')).toBeVisible();
    const after = await page.locator('#main-nav').boundingBox();
    expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(1);
    await expect(page).toHaveURL('http://127.0.0.1:4325/');
  }
});

test('an already-issued Jobs site link confirms by GET and returns home without a third click', async ({ page }) => {
  const token = 'a'.repeat(64);
  const requests: { method: string; token: string | null }[] = [];
  await page.route('https://orionfold.supabase.co/functions/v1/flow-living-documents-confirm?*', async route => {
    const request = route.request();
    requests.push({ method: request.method(), token: new URL(request.url()).searchParams.get('token') });
    await route.fulfill({ status: 303, headers: { location: 'http://127.0.0.1:4325/?living-documents-confirmed=1' } });
  });
  await captureConfirmationEvents(page);
  await page.goto(`/flow/confirm/?token=${token}`);
  await expect(page).toHaveURL('http://127.0.0.1:4325/');
  await expect(page.locator('#confirm-bar')).toBeVisible();
  await expect(page.locator('#confirm-bar-text')).toHaveText('Thanks for subscribing to the Flow email newsletter.');
  await expect(page.getByRole('button', { name: 'Confirm subscription', exact: true })).toHaveCount(0);
  expect(requests).toEqual([{ method: 'GET', token }]);
  expect(await confirmationEvents(page)).toEqual([['event', 'confirmed_lead', { offer: 'flow-living-documents-v1', form_source: 'manifesto-living-documents' }]]);
});

test('legacy confirmation acknowledgement does not enter the Living Documents measurement path', async ({ page }) => {
  await captureConfirmationEvents(page);
  await page.goto('/?confirmed=already');
  await expect(page.locator('#confirm-toast')).toBeVisible();
  await expect(page.locator('#confirm-toast-text')).toHaveText("You're already on the list.");
  expect(await confirmationEvents(page)).toEqual([]);
  expect(await page.evaluate(() => sessionStorage.getItem('of-living-documents-confirmed'))).toBeNull();
});
