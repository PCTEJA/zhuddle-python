import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const read = file => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const additions = read('../src/data/chapters.json');
const functions = { id:'functions', number:'04', title:'Functions', source:'https://www.py4e.com/html3/04-functions', questions:read('../src/data/questions.json') };
const chapters = [...additions, functions].sort((a,b) => a.number.localeCompare(b.number));
const solutions = read('./solutions.json');
const checks = read('../public/chapter-checks.json');
const student = { name:'Chapter QA', untId:'chapter-test-only' };
async function choose(page, chapter) {
  await expect(page.locator('#chapter-selector')).toBeAttached();
  if (!await page.locator('#chapter-selector').isVisible()) {
    await page.getByRole('button', {name:'Open course menu', exact:true}).click();
  }
  await page.locator('#chapter-selector').click();
  await page.getByRole('option', {name:`Chapter ${chapter.number}: ${chapter.title}`, exact:true}).click();
  await expect(page.locator('#chapter-selector')).toContainText(chapter.title);
  await expect(page.getByRole('listbox', {name:'Chapters'})).toHaveCount(0);
}
async function edit(page, value) {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(value);
}
function savedState(chapter, complete=false) {
  const state = {version:1,student,active:'C01',code:{},choices:{},results:{},reflection:''};
  for (const q of chapter.questions) {
    const source = q.kind === 'code' ? solutions[chapter.id]?.[q.id] || q.starter : q.answer;
    (q.kind === 'code' ? state.code : state.choices)[q.id] = source;
    if (complete) state.results[q.id] = {source,earned:q.points,possible:q.points,attempts:1,stdout:'',error:null,
      checks: q.kind === 'code'
        ? (checks[chapter.id]?.[q.id]?.cases || Array.from({length:5},(_,i)=>({label:`Function check ${i+1} passed.`}))).map(c=>({label:c.label,earned:2,possible:2}))
        : [{label:`Correct. ${q.explanation || q.title}`,earned:2,possible:2}]};
  }
  return state;
}

test('legacy Functions progress survives chapter switches, edits, reloads, and student reset', async ({page}) => {
  const legacy = savedState(functions);
  const q = functions.questions.find(q => q.id === 'M01');
  legacy.results.M01 = {source:q.answer,earned:2,possible:2,checks:[{label:'Correct',earned:2,possible:2}]};
  await page.addInitScript(saved => {
    if (!localStorage.getItem('qa-initialized')) {
      localStorage.setItem('zhuddle-functions-v1', JSON.stringify(saved));
      localStorage.setItem('zhuddle-active-chapter', 'functions');
      localStorage.setItem('qa-initialized','yes');
    }
  }, legacy);
  await page.goto('/');
  await expect(page.locator('.xp-pill')).toContainText('2 XP');
  const variables = additions.find(c => c.id === 'variables');
  await choose(page, variables);
  await expect(page.locator('.xp-pill')).toContainText('0 XP');
  await expect(page.locator('.profile-button')).toContainText('Chapter');
  await edit(page, 'whole = 17\n# variables-only draft');
  await page.getByRole('button',{name:'Let’s try it',exact:true}).click();
  const mcq = variables.questions.find(q => q.id === 'M01');
  const option = mcq.options.find(o => o.letter === mcq.answer);
  await page.getByRole('radio',{name:`${option.letter} ${option.text}`,exact:true}).check();
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
  await expect(page.locator('.xp-pill')).toContainText('2 XP');
  await page.getByRole('button',{name:'Achievements',exact:true}).click();
  await page.getByLabel('A moment to reflect').fill('Variables reflection only');
  await choose(page, additions.find(c => c.id === 'loops'));
  await expect(page.locator('.xp-pill')).toContainText('0 XP');
  await expect(page.locator('.cm-content')).not.toContainText('variables-only');
  await choose(page, variables);
  await page.reload();
  await expect(page.locator('#chapter-selector')).toHaveAccessibleName('Choose chapter. Current: Chapter 02 — Variables');
  await expect(page.locator('.xp-pill')).toContainText('2 XP');
  await page.getByRole('navigation',{name:'Coding missions'}).getByRole('button').first().click();
  await expect(page.locator('.cm-content')).toContainText('variables-only draft');
  await page.getByRole('button',{name:'Achievements',exact:true}).click();
  await expect(page.getByLabel('A moment to reflect')).toHaveValue('Variables reflection only');
  await expect(page.getByRole('button',{name:'Download certificate',exact:true})).toBeDisabled();
  await choose(page, functions);
  await expect(page.locator('.xp-pill')).toContainText('2 XP');
  await expect(page.locator('.cm-content')).toContainText('character_count');
  await expect(page.locator('.cm-content')).not.toContainText('variables-only');
  await page.getByRole('button',{name:'New student',exact:true}).click();
  await expect(page.locator('dialog')).toContainText('all seven chapters');
  await page.getByRole('button',{name:'Start fresh',exact:true}).click();
  await expect(page.locator('.xp-pill')).toContainText('0 XP');
  await choose(page, variables);
  await expect(page.locator('.xp-pill')).toContainText('0 XP');
  await expect(page.locator('.cm-content')).not.toContainText('variables-only');
  await expect(page.getByRole('button',{name:'Join the quest',exact:true})).toBeVisible();
});

test('real browser Python passes all 48 new missions and isolates files between runs', async ({page}) => {
  test.setTimeout(180000);
  await page.goto('/');
  const failures = await page.evaluate(async solutions => {
    const worker = new Worker('/python-worker.js');
    let id = 0;
    const send = task => new Promise((resolve,reject) => {
      const timer = setTimeout(() => reject(new Error('Python worker timed out')), 90000);
      worker.onmessage = ({data}) => {
        clearTimeout(timer);
        if (data.type === 'error') reject(new Error(data.message)); else resolve(data);
      };
      worker.onerror = e => { clearTimeout(timer); reject(new Error(e.message)); };
      worker.postMessage(task);
    });
    const failures = [];
    try {
      await send({type:'init'});
      for (const [chapterId, answers] of Object.entries(solutions)) {
        for (const [qid,source] of Object.entries(answers)) {
          const data = await send({type:'run',id:++id,chapterId,qid,source});
          if (data.chapterId !== chapterId || data.result.earned !== 10 || data.result.error) failures.push({chapterId,qid,result:data.result});
        }
      }
      const repeat = await send({type:'run',id:++id,chapterId:'files',qid:'C08',source:solutions.files.C08});
      if (repeat.result.earned !== 10) failures.push(repeat);
    } finally { worker.terminate(); }
    return failures;
  }, solutions);
  expect(failures).toEqual([]);
});

test('seven chapters export distinct PDFs and notebooks, with independent completion locks', async ({page}, testInfo) => {
  const saved = Object.fromEntries(chapters.map(c => [c.id,savedState(c,true)]));
  await page.addInitScript(({saved}) => {
    for (const [id,state] of Object.entries(saved)) localStorage.setItem(`zhuddle-${id}-v1`, JSON.stringify(state));
  }, {saved});
  await page.goto('/');
  const filenames = new Set();
  for (const chapter of chapters) {
    await choose(page, chapter);
    await page.getByRole('button',{name:'Achievements',exact:true}).click();
    await expect(page.locator('.results-title')).toContainText(chapter.title.toUpperCase());
    await expect(page.locator('.completion-count')).toContainText('18/18');
    for (const [button,suffix] of [['Download certificate','Certificate'],['Download grade report','Grade_Report']]) {
      const pending = page.waitForEvent('download');
      await page.getByRole('button',{name:button,exact:true}).click();
      const download = await pending;
      const filename = download.suggestedFilename();
      expect(filename).toBe(`ZHUDDLE_Chapter_${chapter.number}_${chapter.title}_${suffix}_${student.untId}.pdf`);
      expect(filenames.has(filename)).toBe(false);
      filenames.add(filename);
      const bytes = readFileSync(await download.path());
      expect(bytes.subarray(0,4).toString()).toBe('%PDF');
      expect(bytes.toString('latin1')).toContain(`Chapter ${chapter.number}: ${chapter.title}`);
      await download.saveAs(testInfo.outputPath(filename));
    }
    const pending = page.waitForEvent('download');
    await page.getByRole('button',{name:'Download my notebook',exact:true}).click();
    const notebook = JSON.parse(readFileSync(await (await pending).path(),'utf8'));
    expect(notebook.metadata.zhuddle.chapterId).toBe(chapter.id);
    expect(notebook.metadata.zhuddle.complete).toBe(18);
    expect(notebook.cells[0].source).toContain(chapter.source);
    const response = await page.request.get(`/ZHUDDLE_${chapter.title}_Quest.ipynb`);
    expect(response.ok()).toBe(true);
    expect((await response.json()).nbformat).toBe(4);
  }
  const variables = additions.find(c => c.id === 'variables');
  await choose(page, variables);
  await edit(page, '# Edited since the check');
  await page.getByRole('button',{name:'Achievements',exact:true}).click();
  await expect(page.getByRole('button',{name:'Download certificate',exact:true})).toBeDisabled();
  await expect(page.locator('.completion-count')).toContainText('17/18');
  await choose(page, functions);
  await page.getByRole('button',{name:'Achievements',exact:true}).click();
  await expect(page.getByRole('button',{name:'Download certificate',exact:true})).toBeEnabled();
});

test('chapter source links, responsive selection, real grading, and switching during a run', async ({page}, testInfo) => {
  await page.addInitScript(student => localStorage.setItem('zhuddle-student-v1', JSON.stringify(student)), student);
  await page.goto('/');
  const variables = additions.find(c => c.id === 'variables');
  await choose(page, variables);
  await edit(page, solutions.variables.C01);
  await page.getByRole('button',{name:'Run & check',exact:true}).click();
  await expect(page.locator('.result-heading')).toContainText('10/10 XP',{timeout:95000});
  await expect(page.locator('.xp-pill')).toContainText('10 XP');
  await edit(page, 'while True:\n    pass');
  await page.getByRole('button',{name:'Run & check',exact:true}).click();
  await choose(page, functions);
  await expect(page.locator('.xp-pill')).toContainText('0 XP');
  await expect(page.locator('.check-results')).toHaveCount(0);
  for (const chapter of additions) {
    await choose(page, chapter);
    await expect(page.locator('.source-note a')).toHaveAttribute('href',chapter.reading);
    await expect(page.locator('.chapter-heading')).toContainText(chapter.title);
  }
  await choose(page, variables);
  await page.screenshot({path:testInfo.outputPath('chapters-desktop.png'),fullPage:true});
  for (const width of [1280,1024,768,390,320]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),`overflow at ${width}`).toBe(true);
  }
  await page.setViewportSize({width:390,height:844});
  await choose(page, additions.find(c => c.id === 'files'));
  await expect(page.locator('.quest-heading')).toContainText('Count lines in a file');
  await page.screenshot({path:testInfo.outputPath('chapters-mobile.png'),fullPage:true});
});
