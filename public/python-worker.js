let engine;
async function initialize() {
  importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
  const py = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/' });
  const response = await fetch('/grader.py');
  if (!response.ok) throw new Error('The exercise checker could not be loaded. Please retry.');
  py.runPython(await response.text());
  return py;
}
self.onmessage = async ({ data }) => {
  try {
    if (!engine) engine = initialize();
    const py = await engine;
    if (data.type === 'init') return self.postMessage({ type: 'ready' });
    py.globals.set('question_id', data.qid);
    py.globals.set('student_code', data.source);
    const result = JSON.parse(py.runPython('json.dumps(_evaluate(question_id, student_code))'));
    self.postMessage({ type: 'result', id: data.id, result });
  } catch (error) {
    engine = null;
    self.postMessage({ type: 'error', id: data.id, message: String(error.message || error) });
  }
};
