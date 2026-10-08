import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const chapters = JSON.parse(readFileSync(new URL('../src/data/chapters.json', import.meta.url), 'utf8'));
const loops = chapters.find(c => c.id === 'loops');
const functions = JSON.parse(readFileSync(new URL('../src/data/questions.json', import.meta.url), 'utf8'));
const solutions = JSON.parse(readFileSync(new URL('./solutions.json', import.meta.url), 'utf8'));
const student = {name:'Dropdown Test',untId:'dropdown-test-only'};
const trigger = page => page.locator('#chapter-selector');
const menu = page => page.getByRole('listbox', {name:'Chapters'});
const option = (page, name) => page.getByRole('option', {name, exact:true});
async function choose(page, name) {
  await trigger(page).click();
  await option(page,name).click();
  await expect(menu(page)).toHaveCount(0);
}

test.beforeEach(async ({page}) => {
  await page.addInitScript(student => localStorage.setItem('zhuddle-student-v1',JSON.stringify(student)),student);
});

test('reference states: default Variables, open menu overlay, selected Loops with real lessons', async ({page}, info) => {
  await page.setViewportSize({width:1872,height:1000});
  await page.goto('/');
  await page.locator('.cm-content').waitFor();
  await expect(page.locator('.chapter-picker, .chapter-grid')).toHaveCount(0);
  await expect(trigger(page)).toHaveAccessibleName('Choose chapter. Current: Chapter 02 — Variables');
  await expect(page.locator('.quest-heading h2')).toHaveText('Values and their types');
  await expect(trigger(page)).toHaveAttribute('aria-expanded','false');
  const banner = await page.locator('.welcome-band').boundingBox();
  const course = await page.locator('.course-card').boundingBox();
  const rail = await page.locator('.goals-card').boundingBox();
  expect(Math.abs(banner.y - course.y)).toBeLessThan(2);
  expect(Math.abs(banner.y - rail.y)).toBeLessThan(2);
  const lessonBefore = await page.locator('.mission-list').boundingBox();
  const centerBefore = await page.locator('.quest-surface').boundingBox();
  await page.screenshot({path:info.outputPath('01-variables-closed.png')});
  await trigger(page).click();
  await expect(menu(page)).toBeVisible();
  await expect(menu(page).getByRole('option')).toHaveCount(7);
  await expect(option(page,'Chapter 02: Variables')).toHaveAttribute('aria-selected','true');
  await expect(menu(page).locator('[aria-selected="true"] svg')).toHaveCount(1);
  await expect(option(page,'Chapter 02: Variables')).toBeFocused();
  const anchor = await trigger(page).boundingBox();
  const popup = await menu(page).boundingBox();
  expect(popup.x).toBeCloseTo(anchor.x,0);
  expect(popup.width).toBeCloseTo(anchor.width,0);
  expect(popup.y).toBeCloseTo(anchor.y + anchor.height + 4,0);
  expect(await page.locator('.mission-list').boundingBox()).toEqual(lessonBefore);
  expect(await page.locator('.quest-surface').boundingBox()).toEqual(centerBefore);
  await option(page,'Chapter 05: Loops').hover();
  await page.screenshot({path:info.outputPath('02-variables-open.png')});
  await option(page,'Chapter 05: Loops').click();
  await expect(menu(page)).toHaveCount(0);
  await expect(trigger(page)).toHaveAccessibleName('Choose chapter. Current: Chapter 05 — Loops');
  await expect(trigger(page)).toBeFocused();
  await expect(page.locator('.quest-heading h2')).toHaveText(loops.questions[0].title);
  await expect(page.locator('.cm-content')).toContainText(loops.questions[0].starter);
  await expect(page.locator('.mission-list button')).toHaveCount(8);
  for (const q of loops.questions.filter(q => q.kind === 'code')) {
    await expect(page.locator('.mission-list')).toContainText(q.title);
  }
  await expect(page.locator('.mission-list button').first()).toHaveAttribute('aria-current','step');
  await expect(page.locator('.mission-list button').first().locator('.mission-number')).toHaveText('01');
  await expect(page.locator('.welcome-band .eyebrow')).toContainText('CHAPTER 05');
  await expect(page.locator('.badge-collection')).toContainText('Loops Starter');
  await expect(page.locator('.challenge-copy')).toContainText(loops.questions[1].title.toLowerCase());
  await expect(page.locator('.challenge-card')).toBeVisible();
  await page.locator('.welcome-copy h1').hover();
  await page.screenshot({path:info.outputPath('03-loops-selected.png')});
});

test('keyboard navigation, selection, tabbing, and outside-click dismissal', async ({page}) => {
  await page.goto('/');
  await expect(trigger(page)).toBeEnabled();
  await trigger(page).focus();
  await page.keyboard.press('ArrowDown');
  await expect(option(page,'Chapter 02: Variables')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(option(page,'Chapter 03: Conditionals')).toBeFocused();
  await expect(option(page,'Chapter 02: Variables')).toHaveAttribute('aria-selected','true');
  await page.keyboard.press('Escape');
  await expect(menu(page)).toHaveCount(0);
  await expect(trigger(page)).toBeFocused();
  await expect(page.locator('.quest-heading h2')).toHaveText('Values and their types');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Home');
  await expect(option(page,'Chapter 02: Variables')).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(option(page,'Chapter 08: Lists')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(option(page,'Chapter 02: Variables')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(menu(page)).toHaveCount(0);
  await expect(trigger(page)).toContainText('Variables');
  await expect(page.locator('.quest-heading h2')).toHaveText('Values and their types');
  await trigger(page).click();
  await page.keyboard.press('End');
  await expect(option(page,'Chapter 08: Lists')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(trigger(page)).toContainText('Lists');
  await trigger(page).click();
  await page.keyboard.type('fi');
  await expect(option(page,'Chapter 07: Files')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(trigger(page)).toContainText('Files');
  await page.setViewportSize({width:1440,height:440});
  await trigger(page).click();
  const compactMenu = await menu(page).boundingBox();
  expect(compactMenu.y).toBeGreaterThanOrEqual(62);
  expect(compactMenu.y + compactMenu.height).toBeLessThanOrEqual(440);
  await page.keyboard.press('End');
  const compactOption = await option(page,'Chapter 08: Lists').boundingBox();
  expect(compactOption.y + compactOption.height).toBeLessThanOrEqual(440);
  await page.keyboard.press('Escape');
  await page.setViewportSize({width:1440,height:1000});
  await trigger(page).click();
  await page.keyboard.press('Tab');
  await expect(menu(page)).toHaveCount(0);
  await expect(page.locator('.mission-list button').first()).toBeFocused();
  await trigger(page).click();
  await page.locator('.welcome-copy h1').click();
  await expect(menu(page)).toHaveCount(0);
  await expect(trigger(page)).toContainText('Files');
});

test('switching opens the first lesson while preserving answers, XP, attempts, and reflection', async ({page}) => {
  const fresh = questions => ({version:1,student,active:'C05',code:Object.fromEntries(questions.filter(q=>q.kind==='code').map(q=>[q.id,q.starter])),choices:{},results:{},reflection:'Saved reflection'});
  const fn = fresh(functions);
  fn.code.C01 += '\n# saved Functions draft';
  const savedLoops = fresh(loops.questions);
  savedLoops.code.C01 = solutions.loops.C01;
  savedLoops.choices.M01 = loops.questions.find(q=>q.id==='M01').answer;
  savedLoops.results = {
    C01:{source:savedLoops.code.C01,earned:10,possible:10,attempts:3,checks:[{label:'Saved check',earned:10,possible:10}]},
    M01:{source:savedLoops.choices.M01,earned:2,possible:2,attempts:2,checks:[{label:'Saved check',earned:2,possible:2}]},
  };
  await page.addInitScript(({fn,savedLoops}) => {
    if (localStorage.getItem('dropdown-seeded')) return;
    localStorage.setItem('dropdown-seeded','yes');
    localStorage.setItem('zhuddle-functions-v1',JSON.stringify(fn));
    localStorage.setItem('zhuddle-active-chapter','functions');
    localStorage.setItem('zhuddle-loops-v1',JSON.stringify(savedLoops));
  },{fn,savedLoops});
  await page.goto('/');
  await expect(page.locator('.quest-heading h2')).toHaveText('Return a sum');
  await choose(page,'Chapter 05: Loops');
  await expect(page.locator('.quest-heading h2')).toHaveText(loops.questions[0].title);
  await expect(page.locator('.cm-content')).toContainText('while n > 0:');
  await expect(page.locator('.xp-pill')).toContainText('12 XP');
  await expect(page.locator('.sidebar-progress')).toContainText('2 / 18');
  await expect(page.locator('.console-header')).toContainText('Attempt 3');
  await page.locator('.mission-list button').nth(4).click();
  await choose(page,'Chapter 05: Loops');
  await expect(page.locator('.quest-heading h2')).toHaveText(loops.questions[0].title);
  await choose(page,'Chapter 04: Functions');
  await expect(page.locator('.quest-heading h2')).toHaveText('Toolbox warm-up');
  await expect(page.locator('.cm-content')).toContainText('saved Functions draft');
  await expect(page.locator('.xp-pill')).toContainText('0 XP');
  await choose(page,'Chapter 05: Loops');
  await page.reload();
  await expect(page.locator('.xp-pill')).toContainText('12 XP');
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('zhuddle-loops-v1')));
  expect(restored.results).toEqual(savedLoops.results);
  expect(restored.code).toEqual(savedLoops.code);
  expect(restored.choices).toEqual(savedLoops.choices);
  expect(restored.reflection).toBe('Saved reflection');
  expect(restored.active).toBe('C01');
});

test('mobile drawer keeps a scrollable menu in view, handles Escape, and closes on selection', async ({page},info) => {
  await page.setViewportSize({width:320,height:568});
  await page.goto('/');
  await page.getByRole('button',{name:'Open course menu',exact:true}).click();
  await trigger(page).click();
  await expect(menu(page)).toBeVisible();
  const box = await menu(page).boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(320);
  expect(box.y).toBeGreaterThanOrEqual(56);
  expect(box.y + box.height).toBeLessThanOrEqual(568);
  expect(await menu(page).evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(menu(page)).toHaveCount(0);
  await expect(page.locator('.sidebar')).toBeVisible();
  await expect(trigger(page)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.sidebar')).not.toBeVisible();
  await expect(page.getByRole('button',{name:'Open course menu',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Open course menu',exact:true}).click();
  await trigger(page).click();
  await page.keyboard.press('End');
  await expect(option(page,'Chapter 08: Lists')).toBeFocused();
  const last = await option(page,'Chapter 08: Lists').boundingBox();
  expect(last.y + last.height).toBeLessThanOrEqual(568);
  await page.screenshot({path:info.outputPath('mobile-menu.png')});
  await page.keyboard.press('Enter');
  await expect(page.locator('.sidebar')).not.toBeVisible();
  await expect(menu(page)).toHaveCount(0);
  await expect(page.locator('#workspace')).toBeFocused();
  await expect(page.locator('.quest-heading h2')).toHaveText('Index and mutate');
  await expect(page.locator('.welcome-band .eyebrow')).toContainText('CHAPTER 08');
  for (const width of [320,390,700,768,1024,1440]) {
    await page.setViewportSize({width,height:844});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),`overflow at ${width}`).toBe(true);
  }
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:info.outputPath('mobile-lesson.png'),fullPage:true});
});
