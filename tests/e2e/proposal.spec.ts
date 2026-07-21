import { expect, test, type Page } from '@playwright/test';

const consultingRequestEndpoint = 'https://orionfold.supabase.co/functions/v1/consulting-request';

const proposalSnapshot = {
  lines: [{
    id: 'consulting-10',
    label: 'Founder-led consulting · up to 10 hours',
    term: 'Requested initial cap · $350/hour',
    amountCents: 350000,
    includes: 'Remote training, application guidance, and deployment support.',
  }],
  listSubtotalCents: 350000,
  savingsCents: 10180,
  estimatedFinalSubtotalCents: 339820,
  effectiveSavingsBasisPoints: 291,
  termsVersion: 'consulting-request-2026-07-20-r2',
  savingsFormulaVersion: 'domestic-ach-wire-2026-07-20-r1',
  legalIdentity: {
    name: 'Orionfold LLC',
    postalAddress: '2108 N St Ste N, Sacramento, CA 95816',
    email: 'manav@orionfold.com',
  },
};

async function completeProposalForm(page: Page) {
  await page.locator('.cap-card').filter({ hasText: '10 hours' }).click();
  await page.getByLabel('Full name').fill('Website Test');
  await page.getByLabel('Business email').fill('manav@orionfold.com');
  await page.getByLabel('Company name').fill('Orionfold LLC');
  await page.getByLabel('What outcome do you want?').fill('Validate the customer proposal confirmation and recovery flow.');
}

async function enableMockedProductionSubmission(page: Page) {
  await page.locator('#consulting-builder').evaluate((element) => {
    (element as HTMLElement).dataset.localPreview = 'false';
  });
}

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

for (const theme of ['light', 'dark'] as const) {
  test(`proposal calculator and sticky summary work in ${theme} theme`, async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.addInitScript((value) => localStorage.setItem('of-theme', value), theme);
    await page.goto('/proposal/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const sticky = page.locator('#proposal-sticky-summary');
    await expect(sticky).toBeVisible();
    await expect(page.locator('#sticky-savings')).toHaveText('$0.00');
    await expect(page.locator('#sticky-final')).toHaveText('$0.00');
    await expect(page.locator('#summary-subtotal')).toHaveText('$0.00');

    const productCard = page.locator('[data-offer-card="proof-founding"]');
    const productCheckbox = productCard.locator('input[name="selectedOffers"]');
    await productCard.click({ position: { x: 16, y: 16 } });
    await expect(productCheckbox).toBeChecked();
    await expect(page.locator('#sticky-selection-summary')).not.toHaveText(/select a consulting/i);
    await expect(page.locator('#summary-lines > div')).toHaveCount(1);
    await expect(page.locator('#summary-subtotal')).not.toHaveText('$0.00');
    await expect(page.locator('#sticky-savings')).not.toHaveText('$0.00');
    await expect(page.locator('#sticky-final')).not.toHaveText('$0.00');
    const productOnlyTotal = await page.locator('#sticky-final').textContent();

    const tenHourCard = page.locator('.cap-card').filter({ hasText: '10 hours' });
    await tenHourCard.click();
    await expect(tenHourCard.locator('input[name="consultingHours"]')).toBeChecked();
    await expect(page.locator('#summary-lines > div')).toHaveCount(2);
    await expect(page.locator('#sticky-final')).not.toHaveText(productOnlyTotal ?? '');

    await productCard.click({ position: { x: 16, y: 16 } });
    await expect(productCheckbox).not.toBeChecked();
    await expect(page.locator('#summary-lines > div')).toHaveCount(1);
    await expect(page.locator('#sticky-selection-summary')).toContainText(/10-hour/);

    expect(runtimeErrors).toEqual([]);
  });
}

test('proposal sticky summary remains on-screen at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('of-theme', 'light'));
  await page.goto('/proposal/');
  await page.locator('[data-offer-card="proof-founding"]').click({ position: { x: 16, y: 16 } });

  const sticky = page.locator('#proposal-sticky-summary');
  await expect(sticky).toHaveClass(/is-visible/);
  await expect.poll(async () => {
    const box = await sticky.boundingBox();
    return box ? Math.ceil(box.y + box.height) : Number.POSITIVE_INFINITY;
  }).toBeLessThanOrEqual(844);
  const box = await sticky.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  await expect(page.locator('#sticky-final')).not.toHaveText('$0.00');
});

test('successful proposal submission confirms the customer copy was emailed', async ({ page }) => {
  await page.route(consultingRequestEndpoint, async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        proposalNumber: 'OFP-20260721-TEST0001',
        proposalVersion: 1,
        requestState: 'pending_review',
        bindingStatus: 'non_binding_request',
        notificationStatus: 'sent',
        customerConfirmationStatus: 'sent',
        snapshot: proposalSnapshot,
      }),
    });
  });
  await page.goto('/proposal/');
  await enableMockedProductionSubmission(page);
  await completeProposalForm(page);
  await page.getByRole('button', { name: 'Submit proposal request' }).click();

  await expect(page.locator('#form-message')).toContainText('confirmation copy was emailed to manav@orionfold.com');
  await expect(page.locator('#form-message')).toContainText('does not mean the request is accepted or scheduled');
  await expect(page.getByRole('button', { name: 'Request stored' })).toBeDisabled();
});

test('delayed customer confirmation retries the exact request without duplicating identity', async ({ page }) => {
  const requestBodies: unknown[] = [];
  let attempt = 0;
  await page.route(consultingRequestEndpoint, async (route) => {
    requestBodies.push(route.request().postDataJSON());
    attempt += 1;
    await route.fulfill({
      status: attempt === 1 ? 201 : 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        replay: attempt > 1,
        proposalNumber: 'OFP-20260721-TEST0002',
        proposalVersion: 1,
        requestState: 'pending_review',
        bindingStatus: 'non_binding_request',
        notificationStatus: 'sent',
        customerConfirmationStatus: attempt === 1 ? 'delayed' : 'sent',
        snapshot: proposalSnapshot,
      }),
    });
  });
  await page.goto('/proposal/');
  await enableMockedProductionSubmission(page);
  await completeProposalForm(page);
  await page.getByRole('button', { name: 'Submit proposal request' }).click();

  const retry = page.getByRole('button', { name: 'Retry confirmation email' });
  await expect(page.locator('#form-message')).toContainText('confirmation email was delayed');
  await expect(retry).toBeEnabled();
  await retry.click();

  await expect(page.locator('#form-message')).toContainText('confirmation copy was emailed to manav@orionfold.com');
  await expect(page.getByRole('button', { name: 'Request stored' })).toBeDisabled();
  expect(requestBodies).toHaveLength(2);
  expect(requestBodies[1]).toEqual(requestBodies[0]);
});
