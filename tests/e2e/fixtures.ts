import { test as base, expect } from '@playwright/test';

// A production-mode artifact must never make a real service mutation in E2E.
// Page-level fixtures fulfill intentional API requests before this context route.
// Any unmocked external write or provider action is denied and fails the test.
export const test = base.extend<{ serviceWriteGuard: void }>({
  serviceWriteGuard: [async ({ context }, use, testInfo) => {
    const unexpected: string[] = [];
    await context.route('**/*', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
      const providerAction = url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/functions/');
      const providerHost = /(^|\.)(stripe|resend)\.com$/.test(url.hostname);
      const analyticsBeacon = /(^|\.)(google-analytics\.com|googleadservices\.com|doubleclick\.net)$/.test(url.hostname) || (url.hostname.endsWith('facebook.com') && url.pathname.startsWith('/tr'));
      const write = !['GET', 'HEAD', 'OPTIONS'].includes(request.method());
      if (!local && (write || providerAction || providerHost || analyticsBeacon)) {
        // Deliberately omit query/body: failure evidence must not contain tokens
        // or the synthetic email used by an individual fixture.
        unexpected.push(`${request.method()} ${url.origin}${url.pathname}`);
        await route.abort('blockedbyclient');
        return;
      }
      await route.continue();
    });
    await use();
    if (unexpected.length) await testInfo.attach('denied-service-requests', { body: unexpected.join('\n'), contentType: 'text/plain' });
    expect(unexpected, 'Every provider action needs an explicit synthetic route fixture').toEqual([]);
  }, { auto: true }],
});
export { expect };

export type { Page } from "@playwright/test";
