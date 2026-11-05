import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const snapshot = readFileSync('backups/delta-reign.csv', 'utf8');

test('Delta Reign has a local logo, progress, and a complete read-only fallback', async ({ page }) => {
  await page.route('https://ekyngjwtoxvkqfalxebm.supabase.co/**', route => route.fulfill({
    status: 503, contentType: 'application/json', body: '{}',
  }));
  await page.route('https://api.tcgdex.net/**', route => route.abort());
  await page.route('https://api.pokemontcg.io/**', route => route.abort());
  await page.route('**/backups/*.csv', route => route.fulfill({
    status: 200, contentType: 'text/csv', body: snapshot,
  }));
  await page.goto('/index.html');
  const tile = page.locator('[data-group="mega"] a[href="tracker.html?set=delta-reign"]');
  const logo = tile.getByRole('img', { name: 'Delta Reign', exact: true });
  await expect(logo).toBeVisible();
  await expect(logo).toHaveAttribute('src', /assets\/logos\/delta-reign\.png$/);
  await expect.poll(() => logo.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
  await expect(tile).toContainText('ME06');
  await expect(tile).toContainText('0 / 234 owned');
  await tile.click();
  await expect(page.locator('.item')).toHaveCount(234);
  await expect(page.locator('.qtyedit')).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Search cards' }).fill('Heracross');
  await expect(page.locator('.item')).toHaveCount(2);
});
