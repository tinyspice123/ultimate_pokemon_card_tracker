import { chromium } from '@playwright/test';

const siteUrl = new URL(process.env.SITE_URL || 'https://tinyspice123.github.io/ultimate_pokemon_card_tracker/');
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome' });
const page = await browser.newPage({ serviceWorkers: 'allow' });
const errors = [];

page.on('pageerror', error => errors.push(`page error: ${error.message}`));
page.on('console', message => {
  // Some catalogue images intentionally fall through after a provider 404.
  // Keep application console errors actionable without treating those
  // expected image fallbacks as an outage.
  if (message.type() === 'error' && !message.text().includes('Failed to load resource'))
    errors.push(`console error: ${message.text()}`);
});

try {
  await page.goto(new URL('index.html', siteUrl).href, { waitUntil: 'networkidle' });
  const setCount = await page.locator('.setcard').count();
  if (!setCount) throw new Error('The production home page displayed no sets.');

  await page.goto(new URL('tracker.html?set=stellar-crown', siteUrl).href, { waitUntil: 'domcontentloaded' });
  await page.locator('.item').first().waitFor({ state: 'visible', timeout: 20_000 });

  const workerResponse = await page.request.get(new URL('sw.js', siteUrl).href);
  if (!workerResponse.ok()) throw new Error(`Service worker returned HTTP ${workerResponse.status()}.`);
  if ((await workerResponse.text()).includes('shell-__BUILD_VERSION__'))
    throw new Error('Production service worker still contains the build-version placeholder.');

  const backupResponse = await page.request.get(new URL('backups/stellar-crown.csv', siteUrl).href);
  if (!backupResponse.ok()) throw new Error(`Production backup returned HTTP ${backupResponse.status()}.`);
  if (!(await backupResponse.text()).includes('Card')) throw new Error('Production backup is not recognizable CSV.');

  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Production smoke test passed with ${setCount} configured sets.`);
} finally {
  await browser.close();
}
