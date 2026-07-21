import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('a previously visited tracker shell reloads while offline', async ({ page, context }) => {
  await page.route('https://docs.google.com/**', route => route.fulfill({
    status: 200,
    contentType: 'text/csv',
    body: 'Group,Card,Number,Variant,Source,Status,Price,Have,Image\nTest,Pikachu,1/1,Regular,,,,TRUE,',
  }));

  const tracker='/tracker.html?set=stellar-crown';
  await page.goto(tracker, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => navigator.serviceWorker.ready);

  // Reload once under service-worker control so the exact query-string
  // navigation is in the runtime shell cache, then prove it survives offline.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });

  await expect(page.locator('.backlink')).toHaveText(/All sets/);
  await expect(page.locator('#fallbackName')).toHaveText('Stellar Crown');
  await context.setOffline(false);
});
