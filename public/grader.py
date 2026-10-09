import ast, contextlib, io, json, math, sys


def _error_line(exc):
    if isinstance(exc, SyntaxError):
        return exc.lineno
    line = None
    trace = exc.__traceback__
    while trace:
        # Only student frames, never the checker or a library's source lines.
        if trace.tb_frame.f_code.co_filename.startswith('<C') or ':' in trace.tb_frame.f_code.co_filename and trace.tb_frame.f_code.co_filename.startswith('<'):
            line = trace.tb_lineno
        trace = trace.tb_next
    return line


@contextlib.contextmanager
def _bounded():
    # A trace budget catches accidental infinite Python loops, not hostile code.
    count = 0
    previous = sys.gettrace()
    def trace(frame, event, arg):
        nonlocal count
        if event == 'line':
            count += 1
            if count > 20000:
                raise RuntimeError('This run exceeded the practice limit. Check for an endless loop.')
        return trace
    sys.settrace(trace)
    try:
        yield
    finally:
        sys.settrace(previous)


def _called(tree, name):
    return any(isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id == name
               for n in ast.walk(tree))


def _attribute_called(tree, module, name):
    return any(isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute)
               and isinstance(n.func.value, ast.Name) and n.func.value.id == module
               and n.func.attr == name for n in ast.walk(tree))


def _definition(tree, name, count):
    return any(isinstance(n, ast.FunctionDef) and n.name == name
               and len(n.args.args) == count for n in tree.body)


def _invoke(ns, name, args, expected, printed=None):
    sink = io.StringIO()
    with _bounded(), contextlib.redirect_stdout(sink):
        value = ns[name](*args)
    same = (type(value) in (int, float) and math.isclose(value, expected, abs_tol=1e-9)) if type(expected) in (int, float) else value == expected
    return same and (printed is None or sink.getvalue() == printed)


def _evaluate(qid, source):
    ns = {'__name__': '__student__'}
    output = io.StringIO()
    error = None
    error_line = None
    tree = None
    try:
        tree = ast.parse(source)
        with _bounded(), contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            exec(compile(tree, '<' + qid + '>', 'exec'), ns)
    except BaseException as exc:
        error_line = _error_line(exc)
        if isinstance(exc, KeyboardInterrupt):
            error = 'KeyboardInterrupt: run interrupted; edit and retry.'
        else:
            error = type(exc).__name__ + ': ' + str(exc)
    checks = []
    execution_failed = error is not None
    def check(label, predicate):
        nonlocal error, error_line
        try:
            passed = not execution_failed and bool(predicate())
        except BaseException as exc:
            passed = False
            if _error_line(exc) is not None and error is None:
                error = type(exc).__name__ + ': ' + str(exc)
                error_line = _error_line(exc)
        checks.append({'label': label, 'earned': 2 if passed else 0, 'possible': 2})
    if qid == 'C01':
        check('Use len for the character count.', lambda: ns.get('character_count') == 11 and _called(tree, 'len'))
        check('Use max for the largest character.', lambda: ns.get('largest_character') == 'w' and _called(tree, 'max'))
        check('Use min for the smallest character.', lambda: ns.get('smallest_character') == ' ' and _called(tree, 'min'))
        check('Use int to convert the text value.', lambda: type(ns.get('whole_number')) is int and ns['whole_number'] == 32 and _called(tree, 'int'))
        check('Use float to convert the decimal text.', lambda: type(ns.get('decimal_number')) is float and ns['decimal_number'] == 3.14159 and _called(tree, 'float'))
    elif qid == 'C02':
        lines = output.getvalue().splitlines()
        check('Import the random module.', lambda: any(isinstance(n, ast.Import) and any(a.name == 'random' for a in n.names) for n in tree.body))
        check('Use the supplied for loop and range(10).', lambda: any(isinstance(n, ast.For) and isinstance(n.iter, ast.Call) and isinstance(n.iter.func, ast.Name) and n.iter.func.id == 'range' and len(n.iter.args) == 1 and isinstance(n.iter.args[0], ast.Constant) and n.iter.args[0].value == 10 for n in ast.walk(tree)))
        check('Call random.random inside the loop.', lambda: any(isinstance(n, ast.For) and _attribute_called(n, 'random', 'random') for n in ast.walk(tree)))
        check('Print exactly ten numeric lines.', lambda: len(lines) == 10 and all(math.isfinite(float(v)) for v in lines))
        check('All ten values are at least 0 and below 1.', lambda: len(lines) == 10 and all(0 <= float(v) < 1 for v in lines))
    elif qid == 'C03':
        check('Define repeat_message with no parameters.', lambda: _definition(tree, 'repeat_message', 0))
        check('Define print_message with no parameters.', lambda: _definition(tree, 'print_message', 0))
        check('Define repeat_message before print_message.', lambda: [n.name for n in tree.body if isinstance(n, ast.FunctionDef)] == ['repeat_message', 'print_message'])
        check('Call print_message twice inside repeat_message.', lambda: sum(isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id == 'print_message' for f in tree.body if isinstance(f, ast.FunctionDef) and f.name == 'repeat_message' for n in ast.walk(f)) == 2)
        check('Call repeat_message after the definitions; print two lines.', lambda: isinstance(tree.body[-1], ast.Expr) and _called(tree.body[-1], 'repeat_message') and output.getvalue() == 'Hello world\nHello world\n')
    elif qid == 'C04':
        check('Define print_twice with one parameter.', lambda: _definition(tree, 'print_twice', 1))
        check('Print the text argument twice and return None.', lambda: _invoke(ns, 'print_twice', ('Spam',), None, 'Spam\nSpam\n'))
        check('Print a numeric argument twice.', lambda: _invoke(ns, 'print_twice', (17,), None, '17\n17\n'))
        check('Print an expression argument twice.', lambda: _invoke(ns, 'print_twice', ('Spam ' * 4,), None, ('Spam ' * 4 + '\n') * 2))
        check('Call your function with Bing and store its None result.', lambda: 'result' in ns and ns['result'] is None and output.getvalue() == 'Bing\nBing\n' and _called(tree, 'print_twice'))
    elif qid == 'C05':
        check('Define addtwo with two parameters.', lambda: _definition(tree, 'addtwo', 2))
        check('Return the sum of 3 and 5.', lambda: _invoke(ns, 'addtwo', (3, 5), 8, ''))
        check('Return the sum of 0 and 7.', lambda: _invoke(ns, 'addtwo', (0, 7), 7, ''))
        check('Return the sum of -2 and 5.', lambda: _invoke(ns, 'addtwo', (-2, 5), 3, ''))
        check('Store addtwo(3, 5) in x and print x.', lambda: ns.get('x') == 8 and output.getvalue() == '8\n' and _called(tree, 'addtwo'))
    elif qid == 'C06':
        check('Import math and keep degrees equal to 45.', lambda: ns.get('degrees') == 45 and any(isinstance(n, ast.Import) and any(a.name == 'math' for a in n.names) for n in tree.body))
        check('Compute radians from degrees using math.pi.', lambda: math.isclose(ns['radians'], math.pi / 4) and any(isinstance(n, ast.Attribute) and n.attr == 'pi' for n in ast.walk(tree)))
        check('Compute height with math.sin(radians).', lambda: math.isclose(ns['height'], math.sin(math.pi / 4)) and _attribute_called(tree, 'math', 'sin'))
        check('Compute comparison with math.sqrt(2) divided by 2.', lambda: math.isclose(ns['comparison'], math.sqrt(2) / 2) and _attribute_called(tree, 'math', 'sqrt'))
        check('Print height then comparison.', lambda: len(output.getvalue().splitlines()) == 2 and all(math.isclose(float(v), math.sqrt(2) / 2) for v in output.getvalue().splitlines()))
    elif qid == 'C07':
        check('Define computepay with hours and rate parameters.', lambda: _definition(tree, 'computepay', 2))
        check('Return 300 for 30 hours at 10.', lambda: _invoke(ns, 'computepay', (30, 10), 300, ''))
        check('Return 400 for exactly 40 hours at 10.', lambda: _invoke(ns, 'computepay', (40, 10), 400, ''))
        check('Return 475 for 45 hours at 10.', lambda: _invoke(ns, 'computepay', (45, 10), 475, ''))
        check('Handle another overtime rate and print the sample pay.', lambda: _invoke(ns, 'computepay', (42, 20), 860, '') and output.getvalue().strip() in ('475', '475.0'))
    elif qid == 'C08':
        check('Define computegrade with one parameter.', lambda: _definition(tree, 'computegrade', 1))
        check('Return A and B at the correct boundaries.', lambda: all(_invoke(ns, 'computegrade', (v,), grade, '') for v, grade in [(1.0,'A'),(.95,'A'),(.9,'A'),(.899,'B'),(.8,'B')]))
        check('Return C, D and F at the correct boundaries.', lambda: all(_invoke(ns, 'computegrade', (v,), grade, '') for v, grade in [(.799,'C'),(.75,'C'),(.7,'C'),(.699,'D'),(.6,'D'),(.599,'F'),(.5,'F'),(0,'F')]))
        check('Reject numeric scores outside 0 through 1.', lambda: all(_invoke(ns, 'computegrade', (v,), 'Bad score', '') for v in (-.1, 10.0)))
        check('Use the supplied text-input helper for numeric and invalid text.', lambda: all(_invoke(ns, 'grade_text', (v,), grade, '') for v, grade in [('0.95','A'),('0.75','C'),('0.5','F'),('perfect','Bad score'),('10.0','Bad score')]) and output.getvalue() == 'A\nBad score\n')
    return {'source': source, 'stdout': output.getvalue(), 'error': error, 'errorLine': error_line,
            'checks': checks, 'earned': sum(c['earned'] for c in checks), 'possible': 10}

