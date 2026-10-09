import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const chapters = JSON.parse(readFileSync(new URL('../src/data/chapters.json', import.meta.url), 'utf8'));
const chapter = chapters.find(c => c.id === 'variables');
const source = 'message = "Hello, Zhuddle"\nprint(mesage)';
const reply = { provider: 'groq', summary: 'You’re close! Check the name on line 2.', diagnostics: [{ line: 2, message: 'You defined message, but used mesage. Match the spelling before running again.' }] };
async function seed(page, { failure = true, ai = true } = {}) {
  await page.addInitScript(({ chapter, source, failure, ai }) => {
    localStorage.setItem('zhuddle-motion', 'off');
    localStorage.setItem('zhuddle-ai-help', ai ? 'on' : 'off');
    localStorage.setItem('zhuddle-active-chapter', 'variables');
    const student = { name: 'Test Learner', untId: 'private-test-id' };
    localStorage.setItem('zhuddle-student-v1', JSON.stringify(student));
    localStorage.setItem('zhuddle-variables-v1', JSON.stringify({ version: 1, student, active: 'C01', choices: {}, reflection: '', code: { ...Object.fromEntries(chapter.questions.filter(q => q.kind === 'code').map(q => [q.id, q.starter])), C01: source }, results: failure ? { C01: { source, earned: 0, possible: 10, attempts: 1, error: "NameError: name 'mesage' is not defined", errorLine: 2, stdout: '', checks: Array.from({ length: 5 }, () => ({ label: 'Check the variable name.', earned: 0, possible: 2 })) } } : {} }));
  }, { chapter, source, failure, ai });
}
test('failed checks annotate the editor; edits clear stale feedback and never change scores', async ({ page }) => {
  await seed(page);
  let payload;
  await page.route('**/api/assistant', route => { payload = route.request().postDataJSON(); return route.fulfill({ json: reply }); });
  await page.goto('/');
  await expect(page.locator('.coach-tag')).toHaveText('AI · GROQ');
  await expect(page.locator('.cm-coach-line')).toContainText('print(mesage)');
  expect(JSON.stringify(payload)).not.toContain('private-test-id');
  expect(payload.mode).toBe('review');
  await page.getByRole('button', { name: /L2 You defined/ }).click();
  await expect(page.locator('.cm-content')).toBeFocused();
  await expect(page.locator('.xp-pill')).toContainText('0 XP');
  await page.locator('.editor-frame').scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.qa/ai-code-coach-desktop.png', fullPage: false });
  await page.locator('.cm-content').press('End');
  await page.keyboard.insertText(' # edited');
  await expect(page.locator('.cm-coach-line')).toHaveCount(0);
  await expect(page.locator('.coach-diagnostics')).toHaveCount(0);
});
test('late responses cannot annotate a different mission or edited source', async ({ page }) => {
  await seed(page);
  let release;
  await page.route('**/api/assistant', async route => { await new Promise(resolve => { release = resolve; }); await route.fulfill({ json: reply }); });
  await page.goto('/');
  await expect(page.locator('.coach-footnote')).toContainText('Finding');
  await page.getByRole('button', { name: 'Next mission', exact: true }).click();
  release();
  await expect(page.locator('.coach-diagnostics')).toHaveCount(0);
  await expect(page.locator('.cm-coach-line')).toHaveCount(0);
});
test('AI off persists and provider failures retain real Python line feedback', async ({ page }) => {
  await seed(page);
  await page.route('**/api/assistant', route => route.fulfill({ status: 429, json: { error: 'busy' } }));
  await page.goto('/');
  await expect(page.locator('.coach-footnote')).toContainText('AI is busy');
  await expect(page.locator('.cm-coach-line')).toContainText('print(mesage)');
  await page.getByRole('switch', { name: 'Automatic AI code help' }).click();
  await expect(page.locator('.cm-coach-line')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('zhuddle-ai-help'))).toBe('off');
});
test('guide answers, points to downloads, and completes all five tour steps', async ({ page }) => {
  await seed(page, { failure: false });
  await page.route('**/api/assistant', route => route.fulfill({ json: { provider: 'groq', message: 'Open Achievements to download your notebook and grade report.', action: 'downloads', label: 'Show downloads' } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Zhuddle Guide' }).click();
  await expect(page.getByLabel('Ask about Zhuddle')).toBeFocused();
  await page.screenshot({ path: '.qa/ai-guide-desktop.png' });
  await page.getByLabel('Ask about Zhuddle').fill('Where is my notebook?');
  await page.getByRole('button', { name: 'Send question' }).click();
  await page.getByRole('button', { name: 'Show downloads', exact: true }).click();
  await expect(page.locator('.guide-spotlight')).toBeVisible();
  await expect(page.locator('.finish-panel')).toBeVisible();
  await page.getByRole('button', { name: 'Got it', exact: true }).click();
  await page.getByRole('button', { name: /Show me around/ }).click();
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('.guide-tour-top')).toContainText(`${i + 1} OF 5`);
    await expect(page.locator('.guide-spotlight')).toBeVisible();
    await page.getByRole('button', { name: i === 4 ? 'Ready to explore' : 'Next', exact: true }).click();
  }
  await expect(page.locator('.guide-panel')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open Zhuddle Guide' })).toBeFocused();
});
test('mobile guide and built-in fallback fit the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, { failure: false });
  await page.route('**/api/assistant', route => route.fulfill({ status: 503, json: { error: 'not configured' } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Zhuddle Guide' }).click();
  await page.getByRole('button', { name: 'Choose a chapter', exact: true }).click();
  await expect(page.locator('.guide-fallback')).toBeVisible();
  const bounds = await page.locator('.guide-panel').boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(844);
  await page.screenshot({ path: '.qa/ai-guide-mobile.png' });
  await page.getByRole('button', { name: 'Show chapter selector', exact: true }).click();
  await expect(page.locator('.guide-spotlight')).toBeVisible();
  await page.screenshot({ path: '.qa/ai-tour-mobile.png' });
});
