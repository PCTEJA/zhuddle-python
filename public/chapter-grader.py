"""Five fresh, bounded Python checks per chapter mission.

This is a practice checker, not a security boundary. It runs in a disposable
web worker; temporary files and namespaces are rebuilt for each test case.
"""
import builtins
import copy
import os
import tempfile


class _LimitedOutput(io.StringIO):
    def write(self, value):
        if self.tell() + len(value) > 16000:
            raise RuntimeError('Output limit reached. Check what your loop prints.')
        return super().write(value)


def _same(actual, expected):
    if isinstance(expected, dict) and '$type' in expected:
        return actual is getattr(builtins, expected['$type'])
    if type(expected) is float:
        return type(actual) in (int, float) and math.isclose(actual, expected, rel_tol=1e-9, abs_tol=1e-9)
    if type(actual) is not type(expected):
        return False
    if isinstance(expected, list):
        return len(actual) == len(expected) and all(_same(a, b) for a, b in zip(actual, expected))
    return actual == expected


def _same_output(actual, expected):
    # Accept equivalent numeric formatting, without ignoring missing/extra lines.
    actual_lines, expected_lines = actual.strip().splitlines(), expected.strip().splitlines()
    if len(actual_lines) != len(expected_lines):
        return False
    for a, b in zip(actual_lines, expected_lines):
        if a.rstrip() == b.rstrip():
            continue
        aa, bb = a.split(), b.split()
        if len(aa) != len(bb):
            return False
        for x, y in zip(aa, bb):
            if x == y:
                continue
            try:
                if not math.isclose(float(x), float(y), rel_tol=1e-9, abs_tol=1e-9):
                    return False
            except ValueError:
                return False
    return True


def _meets_requirement(tree, requirement):
    kind, name = requirement.split(':', 1)
    if kind in ('node', 'no-node'):
        found = any(type(n).__name__ == name for n in ast.walk(tree))
    elif kind in ('call', 'no-call'):
        found = _called(tree, name)
    else:
        found = any(isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute) and n.func.attr == name for n in ast.walk(tree))
    return not found if kind.startswith('no-') else found


def _requirement_feedback(requirement):
    kind, name = requirement.split(':', 1)
    if 'call' in kind:
        return ('Do not call ' if kind.startswith('no-') else 'Use ') + name + '() as requested.'
    if 'method' in kind:
        return ('Do not use ' if kind.startswith('no-') else 'Use ') + '.' + name + '() as requested.'
    concepts = {'For':'a for loop', 'While':'a while loop', 'If':'an if statement',
                'Try':'try/except', 'Break':'break', 'Continue':'continue', 'And':'and',
                'Or':'or', 'Not':'not', 'Is':'is', 'Subscript':'indexing', 'Slice':'slicing',
                'Set':'a set', 'SetComp':'a set comprehension', 'Dict':'a dictionary', 'DictComp':'a dictionary comprehension'}
    return ('Do not use ' if kind.startswith('no-') else 'Use ') + concepts.get(name, name) + ' as requested.'


def _run_case(compiled, case):
    output = _LimitedOutput()
    inputs = iter(case.get('inputs', []))
    def read_input(prompt=''):
        try:
            return str(next(inputs))
        except StopIteration:
            raise EOFError('No more test input. Stop when you read the sentinel.')
    def finish(code=0):
        raise SystemExit(code)
    opened = []
    def practice_open(*args, **kwargs):
        handle = open(*args, **kwargs)
        opened.append(handle)
        return handle
    ns = copy.deepcopy(case.get('given', {}))
    ns.update(__name__='__student__', __builtins__={**vars(builtins), 'input':read_input, 'open':practice_open, 'exit':finish, 'quit':finish})
    error = None
    error_line = None
    previous = os.getcwd()
    with tempfile.TemporaryDirectory(prefix='zhuddle-') as folder:
        try:
            os.chdir(folder)
            for name, contents in case.get('files', {}).items():
                with open(name, 'w', encoding='utf-8') as fixture:
                    fixture.write(contents)
            try:
                with _bounded(), contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
                    exec(compiled, ns)
            except SystemExit as exc:
                if exc.code not in (None, 0):
                    error = 'Program exited with status ' + str(exc.code)
            except BaseException as exc:
                error = type(exc).__name__ + ': ' + str(exc)
                error_line = _error_line(exc)
            passed = error is None
            details = []
            for key, expected in case.get('expected', {}).items():
                if key not in ns or not _same(ns[key], expected):
                    passed = False
                    shown = expected['$type'] if isinstance(expected, dict) and '$type' in expected else repr(expected)
                    details.append(f'Expected {key} = {shown}.')
            if 'stdout' in case and not _same_output(output.getvalue(), case['stdout']):
                passed = False
                details.append('Expected output: ' + repr(case['stdout']))
            for name, expected in case.get('written', {}).items():
                try:
                    with open(name, encoding='utf-8') as result_file:
                        contents = result_file.read()
                    if contents != expected:
                        passed = False
                        details.append(f'Check the contents of {name}.')
                except OSError:
                    passed = False
                    details.append(f'Create {name} and close it after writing.')
            return passed, output.getvalue(), error, ' '.join(details), error_line
        finally:
            for handle in opened:
                handle.close()
            os.chdir(previous)


def _evaluate_chapter(chapter_id, qid, source, manifest):
    if chapter_id == 'functions':
        return _evaluate(qid, source)
    spec = manifest.get(chapter_id, {}).get(qid)
    if not spec:
        raise ValueError('Unknown chapter or coding mission. Reload and try again.')
    checks, output, error = [], '', None
    error_line = None
    try:
        tree = ast.parse(source)
        compiled = compile(tree, '<' + chapter_id + ':' + qid + '>', 'exec')
        missing = [r for r in spec['requires'] if not _meets_requirement(tree, r)]
    except (SyntaxError, ValueError) as exc:
        compiled, missing = None, []
        error = type(exc).__name__ + ': ' + str(exc)
        error_line = _error_line(exc)
    for index, group in enumerate(spec['cases']):
        passed, detail = compiled is not None and not missing, ''
        if compiled is not None:
            for variant_index, case in enumerate(group.get('variants', [group])):
                ok, stdout, failure, feedback, failure_line = _run_case(compiled, case)
                if index == 0 and variant_index == 0:
                    output = stdout
                if failure and error is None:
                    error = failure
                    error_line = failure_line
                passed = passed and ok
                if not ok and not detail:
                    detail = failure or feedback
        if missing:
            detail = ' '.join(_requirement_feedback(r) for r in missing)
        checks.append(dict(label=group['label'] + (' ' + detail if detail else ''), earned=2 if passed else 0, possible=2))
    return dict(sourceId=qid, source=source, stdout=output, error=error, errorLine=error_line, checks=checks,
                earned=sum(c['earned'] for c in checks), possible=10)
