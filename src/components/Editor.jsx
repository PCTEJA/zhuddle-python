import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { useEffect, useMemo, useRef, useState } from 'react';
import { EditorView, Decoration } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { setDiagnostics, lintGutter } from '@codemirror/lint';

const markLines = StateEffect.define();
const coachLines = StateField.define({
  create: () => Decoration.none,
  update(value, transaction) {
    if (transaction.docChanged) return Decoration.none;
    const effect = transaction.effects.find(e => e.is(markLines));
    return effect ? Decoration.set(effect.value.map(pos => Decoration.line({ class: 'cm-coach-line' }).range(pos)), true) : value;
  },
  provide: field => EditorView.decorations.from(field),
});
export default function Editor({ value, onChange, disabled, diagnostics = [], focusLine }) {
  const editor = useRef(null);
  const [ready, setReady] = useState(null);
  const extensions = useMemo(() => [python(), lintGutter(), coachLines], []);
  useEffect(() => {
    const view = editor.current;
    if (!view) return;
    const valid = diagnostics.filter(d => Number.isInteger(d.line) && d.line >= 1 && d.line <= view.state.doc.lines);
    const marks = valid.map(d => {
      const line = view.state.doc.line(d.line);
      return { from: line.from, to: line.to, severity: 'warning', message: d.message, source: 'Code Coach' };
    });
    view.dispatch(setDiagnostics(view.state, marks));
    view.dispatch({ effects: markLines.of([...new Set(marks.map(m => view.state.doc.lineAt(m.from).from))]) });
  }, [diagnostics, value, ready]);
  useEffect(() => {
    const view = editor.current;
    if (!view || !focusLine || focusLine.line > view.state.doc.lines) return;
    const line = view.state.doc.line(focusLine.line);
    view.dispatch({ selection: { anchor: line.from, head: line.to }, effects: EditorView.scrollIntoView(line.from, { y: 'center' }) });
    view.focus();
  }, [focusLine, ready]);
  return (
    <CodeMirror
      value={value}
      onCreateEditor={view => { editor.current = view; setReady(view); }}
      onChange={onChange}
      extensions={extensions}
      theme="dark"
      height="320px"
      editable={!disabled}
      aria-label="Python code editor"
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        autocompletion: false,
        highlightActiveLine: true,
      }}
    />
  );
}
