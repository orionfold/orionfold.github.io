import { expect, test } from '@playwright/test';

const accessEndpoint = 'https://orionfold.supabase.co/functions/v1/workshop-access';
const transcript = `# Module Inspect

## Transcript

### Read the process boundary

00:00:00.000–00:00:10.000

Trace the owned input before changing the workflow.

Sources: source:marketing-line-memo, source:relay-workshop-api
`;

test('production workshop stays locked without an access token', async ({ page }) => {
  await page.goto('/training/relay-operator-workshop/workspace/');
  await expect(page.locator('.workshop-lock')).toBeVisible();
  await expect(page.locator('.workshop-shell')).toBeHidden();
  await expect(page.locator('video')).toHaveCount(7);
  await expect(page.locator('video').first()).toBeHidden();
});

test('verified inbox access opens the workspace and signs only the selected lesson', async ({ page }) => {
  const requests: Array<Record<string, unknown>> = [];
  await page.route(accessEndpoint, async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;
    requests.push(body);
    const stage = body.stage;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(stage
        ? {
            ok: true,
            stage,
            expiresIn: 900,
            assets: {
              media: { url: `https://workshop-assets.example/${stage}.mp4` },
              captions: { url: `https://workshop-assets.example/${stage}.vtt` },
              transcript: { url: `https://workshop-assets.example/${stage}.md` },
            },
          }
        : {
            ok: true,
            manifestUrl: 'https://workshop-assets.example/delivery-manifest.json',
            workspacePath: '/training/relay-operator-workshop/workspace/',
            stages: ['inspect', 'adapt', 'govern', 'run', 'retain', 'proof', 'update'],
            expiresIn: 900,
          }),
    });
  });
  await page.route('https://workshop-assets.example/**', async (route) => {
    const url = route.request().url();
    if (url.endsWith('.md')) {
      await route.fulfill({ status: 200, contentType: 'text/markdown', body: transcript });
      return;
    }
    if (url.endsWith('.vtt')) {
      await route.fulfill({ status: 200, contentType: 'text/vtt', body: 'WEBVTT\n' });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'video/mp4', body: '' });
  });

  await page.goto('/training/relay-operator-workshop/access/#t=customer-test-token');
  await expect(page.locator('#access-status')).toContainText('Access verified');
  await expect(page.locator('#manifest-link')).toHaveAttribute(
    'href',
    '/training/relay-operator-workshop/workspace/',
  );
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('');
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('of-workshop-access-token')))
    .toBe('customer-test-token');

  await page.locator('#manifest-link').click();
  await expect(page.locator('.workshop-lock')).toBeHidden();
  await expect(page.locator('.workshop-shell')).toBeVisible();
  await page.locator('[data-stage-target="inspect"]').click();

  const inspectVideo = page.locator('video[data-private-stage="inspect"]');
  await expect(inspectVideo).toBeVisible();
  await expect(inspectVideo.locator('source')).toHaveAttribute(
    'src',
    'https://workshop-assets.example/inspect.mp4',
  );
  expect(requests.filter((request) => request.stage === 'inspect')).toHaveLength(1);
  expect(requests.some((request) => request.stage === 'adapt')).toBe(false);

  await page.locator('[data-private-stage="inspect"][data-workshop-transcript]').click();
  await expect(page.getByRole('heading', { name: 'Module Inspect' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Marketing Line operating memo/ })).toBeVisible();
});
