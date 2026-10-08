import { test, expect } from '@playwright/test';
import { statSync } from 'node:fs';

const topics = ['variables', 'conditionals', 'functions', 'loops', 'strings', 'files', 'lists'];

test('dashboard and all chapter guides are readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Values and their types/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /beginner Python learning platform/ })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Python chapter guides' }).getByRole('link')).toHaveCount(7);
  for (const topic of topics) {
    await page.goto(`/learn/python-${topic}/`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Python ${topic} for beginners`);
    await expect(page.locator('pre code')).not.toBeEmpty();
    await expect(page.locator('ol li')).toHaveCount(8);
    await expect(page.getByRole('link', { name: `Practice Python ${topic} →` })).toHaveAttribute('href', `/?chapter=${topic}#workspace`);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  await context.close();
});

test('crawler endpoints and every canonical page agree on indexable URLs', async ({ request, page }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Sitemap: https://zhuddle.com/sitemap.xml');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toContain('xml');
  const locations = [...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  expect(locations).toEqual(['https://zhuddle.com/', ...topics.map(topic => `https://zhuddle.com/learn/python-${topic}/`)]);
  const titles = new Set();
  for (const url of locations) {
    const response = await page.goto(new URL(url).pathname);
    expect(response.status()).toBe(200);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', url);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow, max-image-preview:large');
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', url);
    const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    expect(schema['@graph'][0].name).toBe('ZHUDDLE');
    expect(schema['@graph'][1].url).toBe(url);
    titles.add(await page.title());
  }
  expect(titles.size).toBe(8);
  expect((await request.get('/learn/python-not-a-chapter/')).status()).toBe(404);
});

test('chapter guide links select a chapter and allow subsequent saved selection', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/learn/python-loops/');
  await page.getByRole('link', { name: 'Practice Python loops →' }).click();
  await expect(page.locator('#chapter-selector')).toContainText('Loops');
  await page.locator('.cm-content').waitFor();
  await page.locator('#chapter-selector').click();
  await page.getByRole('option', { name: /Strings/ }).click();
  await expect(page.locator('#chapter-selector')).toContainText('Strings');
  expect(new URL(page.url()).searchParams.has('chapter')).toBe(false);
  await page.reload();
  await expect(page.locator('#chapter-selector')).toContainText('Strings');
  expect(errors).toEqual([]);
});

test('a direct chapter link works when browser storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage unavailable'); };
    Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); };
  });
  await page.goto('/?chapter=lists');
  await expect(page.locator('#chapter-selector')).toContainText('Lists');
  await expect(page.locator('.cm-content')).toBeVisible();
});

test('reduced motion avoids video downloads and fonts are served locally', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/');
  await page.locator('.cm-content').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('video')).toHaveCount(0);
  expect(requests.some(url => /\.mp4|customer-care\.gif|fonts\.google/.test(url))).toBe(false);
  expect(requests.filter(url => url.includes('.woff2')).length).toBeGreaterThan(0);
  expect(await page.locator('.support-icon img').evaluate(img => img.currentSrc)).toContain('customer-care-still-v1.webp');
});

test('decorative videos only load in view and pause when motion is disabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 844 });
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/');
  await expect(page.locator('video.hero-video')).toHaveClass(/is-playing/);
  expect(await page.locator('video.hero-video').evaluate(video => [video.videoWidth, video.videoHeight])).toEqual([3840, 996]);
  expect(requests.some(url => url.includes('snake-adventure'))).toBe(false);
  await page.locator('.challenge-art').scrollIntoViewIfNeeded();
  await expect(page.locator('video.challenge-video')).toHaveClass(/is-playing/);
  await expect(page.locator('video.hero-video')).toHaveCount(0);
  await page.getByRole('button', { name: 'Animations on', exact: true }).click();
  await expect(page.locator('video')).toHaveCount(0);
});

test('optimized media stays within the page asset budget', () => {
  for (const [file, budget] of [
    ['zhuddle/welcome-poster-hd-v2.webp', 200000],
    ['zhuddle/welcome-banner-hd-v3.mp4', 4250000],
    ['zhuddle/snake-adventure-v2.mp4', 140000],
    ['customer-care-v1.webp', 130000],
  ]) expect(statSync(new URL(`../public/assets/${file}`, import.meta.url)).size, file).toBeLessThan(budget);
});
