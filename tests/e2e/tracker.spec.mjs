import { test, expect } from '@playwright/test';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const SHEET = [
  'Group,Card,Number,Variant,Source,Status,Price,Have,Image',
  'Test Group,Pikachu,1/100,Standard,Playwright,,£1,TRUE,',
  'Test Group,Eevee,2/100,Standard,Playwright,,£2,FALSE,',
].join('\n');
const TEST_IMAGE = path.resolve('public/assets/icon-192.png');

async function mockTrackerData(page, highResolutionDelay = 0) {
  await page.route('https://ekyngjwtoxvkqfalxebm.supabase.co/rest/v1/pokemon_cards**', route => route.fulfill({
    status: 404,
    contentType: 'application/json',
    body: JSON.stringify({message:'Test uses the snapshot fallback'}),
  }));
  await page.route('**/backups/stellar-crown.csv', route => route.fulfill({
    status: 200,
    contentType: 'text/csv',
    body: SHEET,
  }));
  await page.route('https://images.pokemontcg.io/**', async route => {
    if (highResolutionDelay && route.request().url().includes('_hires.png'))
      await delay(highResolutionDelay);
    await route.fulfill({ status: 200, contentType: 'image/png', path: TEST_IMAGE });
  });
}

test.beforeEach(async ({ page }) => {
  await mockTrackerData(page);
  await page.goto('/tracker.html?set=stellar-crown', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.item')).toHaveCount(2);
});

test('loads data and filters cards', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Search cards' }).fill('Eevee');
  await expect(page.locator('.item')).toHaveCount(1);
  await expect(page.locator('.item .nm')).toHaveText('Eevee');
});

test('authorized Google account can update a database quantity', async ({ page }) => {
  await page.unroute('https://ekyngjwtoxvkqfalxebm.supabase.co/rest/v1/pokemon_cards**');
  await page.addInitScript(() => localStorage.setItem('pokemon-tracker:supabase-session', JSON.stringify({
    access_token:'test-access',refresh_token:'test-refresh',expires_at:4102444800,
  })));
  await page.route('https://ekyngjwtoxvkqfalxebm.supabase.co/auth/v1/user', route => route.fulfill({
    status:200,contentType:'application/json',body:JSON.stringify({
      id:'00000000-0000-0000-0000-000000000001',email:'collection-owner',
    }),
  }));
  let savedQuantity=null;
  await page.route('https://ekyngjwtoxvkqfalxebm.supabase.co/rest/v1/pokemon_cards**', async route => {
    if(route.request().method()==='PATCH'){
      savedQuantity=route.request().postDataJSON().quantity;
      await route.fulfill({status:204,body:''});
      return;
    }
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([
      {id:'pikachu',group_name:'Test Group',card_name:'Pikachu',collector_number:'1/100',
        variant:'Standard',source:'Database',price:'£1',status:'',image_url:'',quantity:1},
      {id:'eevee',group_name:'Test Group',card_name:'Eevee',collector_number:'2/100',
        variant:'Standard',source:'Database',price:'£2',status:'',image_url:'',quantity:0},
    ])});
  });

  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('.qtyedit')).toHaveCount(2);
  await page.locator('.qtyedit button[data-delta="1"]').first().click();
  await expect(page.locator('.qtyedit output').first()).toHaveText('2');
  expect(savedQuantity).toBe(2);
});

test('uses the repository snapshot and displays a warning when Supabase is unavailable', async ({ page }) => {
  await page.unroute('**/backups/stellar-crown.csv');
  await page.route('**/backups/stellar-crown.csv', route => route.fulfill({
    status: 200,
    contentType: 'text/csv',
    body: SHEET.replaceAll('Playwright','Packaged backup'),
  }));

  await page.goto('/tracker.html?set=stellar-crown', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.item')).toHaveCount(2);
  await expect(page.locator('#dataBanner')).toBeVisible();
  await expect(page.locator('#dataBanner')).toContainText('repository snapshot');
  await expect(page.locator('.item .src').first()).toHaveText('Packaged backup');
});

test('explains when neither database nor snapshot can be loaded', async ({ page }) => {
  await page.unroute('**/backups/stellar-crown.csv');
  await page.route('**/backups/stellar-crown.csv', route => route.fulfill({status:404}));

  await page.goto('/tracker.html?set=stellar-crown', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#notice')).toBeVisible();
  await expect(page.locator('#notice')).toContainText('Collection data is temporarily unavailable');
  await expect(page.locator('#notice')).toContainText('Test uses the snapshot fallback');
  await expect(page.locator('#notice')).toContainText('database snapshot');
});

test('builds marketplace searches from the card details', async ({ page }) => {
  const item=page.locator('.item').first();
  const ebay=item.locator('[data-market="ebay"]');
  const cardmarket=item.locator('[data-market="cardmarket"]');
  await expect(ebay).toHaveAttribute('target','_blank');
  await expect(ebay).toHaveAttribute('rel','noopener noreferrer');
  expect(new URL(await ebay.getAttribute('href')).searchParams.get('_nkw'))
    .toBe('Pikachu 1/100');
  expect(new URL(await cardmarket.getAttribute('href')).searchParams.get('searchString'))
    .toBe('Pikachu SCR 1');

  await page.locator('#viewSel').selectOption('table');
  await expect(page.locator('.listtable [data-market="ebay"]')).toHaveCount(2);
});

test('centres the lightbox across the viewport', async ({ page }) => {
  await page.locator('.item').first().locator('img').click();
  const lightbox = page.getByRole('dialog', { name: 'Card image viewer' });
  await expect(lightbox).toBeVisible();

  const box = await lightbox.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(Math.abs(box.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(box.width - viewport.width)).toBeLessThanOrEqual(1);
});

test('hides the previous image while the next one loads', async ({ page }) => {
  await page.unroute('https://images.pokemontcg.io/**');
  await mockTrackerData(page, 400);

  await page.locator('.item').first().locator('img').click();
  const image = page.locator('#lbImg');
  await expect(image).not.toHaveClass(/loading/);
  await page.keyboard.press('Escape');

  await page.locator('.item').nth(1).locator('img').click();
  await expect(image).toHaveClass(/loading/);
  await expect(image).toBeHidden();
  await expect(image).not.toHaveClass(/loading/);
  await expect(image).toBeVisible();
});
