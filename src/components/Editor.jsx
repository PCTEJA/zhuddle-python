import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";

const extensions = [python()];
export default function Editor({ value, onChange, disabled }) {
  return (
    <CodeMirror
      value={value}
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
