let engine;
async function initialize() {
  importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
  const py = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/' });
  const response = await fetch('/grader.py');
  if (!response.ok) throw new Error('The exercise checker could not be loaded. Please retry.');
  py.runPython(await response.text());
  const [chapterGrader, chapterChecks] = await Promise.all([
    fetch('/chapter-grader.py'), fetch('/chapter-checks.json'),
  ]);
  if (!chapterGrader.ok || !chapterChecks.ok) throw new Error('Chapter checks could not be loaded. Please retry.');
  py.runPython(await chapterGrader.text());
  py.globals.set('chapter_manifest_json', await chapterChecks.text());
  py.runPython('chapter_manifest = json.loads(chapter_manifest_json)');
  return py;
}
self.onmessage = async ({ data }) => {
  try {
    if (!engine) engine = initialize();
    const py = await engine;
    if (data.type === 'init') return self.postMessage({ type: 'ready' });
    py.globals.set('question_id', data.qid);
    py.globals.set('student_code', data.source);
    py.globals.set('chapter_id', data.chapterId || 'functions');
    const result = JSON.parse(py.runPython('json.dumps(_evaluate_chapter(chapter_id, question_id, student_code, chapter_manifest))'));
    self.postMessage({ type: 'result', id: data.id, chapterId: data.chapterId, result });
  } catch (error) {
    engine = null;
    self.postMessage({ type: 'error', id: data.id, message: String(error.message || error) });
  }
};
