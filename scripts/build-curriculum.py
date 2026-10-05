"""Rebuild the six PY4E chapter banks, grader cases and reference-solution tests.

Questions are original adaptations of the cited chapter sections, not the
login-only PY4E quiz banks. No later-chapter knowledge is required.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
banks, checks, solutions = {}, {}, {}
chapter = None

def begin(slug):
    global chapter
    chapter = slug
    banks[slug] = []
    checks[slug] = {}
    solutions[slug] = {}

def case(label, given=None, expected=None, inputs=None, stdout=None, files=None, written=None):
    result = dict(label=label, given=given or {}, expected=expected or {})
    for key, value in [('inputs', inputs), ('stdout', stdout), ('files', files), ('written', written)]:
        if value is not None: result[key] = value
    return result

def code(title, section, task, starter, solution, cases, hint, requires=None):
    assert len(cases) == 5, title
    qid = f'C{1 + sum(q["kind"] == "code" for q in banks[chapter]):02}'
    setup = '\n'.join(f'{k} = {v!r}' for k, v in cases[0]['given'].items())
    task += '\n\nFive independent checks are worth 2 XP each. '
    if setup:
        task += 'The checker supplies the variables below with different values on each check. Use them without replacing their starting values.\n\n```python\n' + setup + '\n```'
    if 'inputs' in cases[0]:
        task += '\n\nUse `input()` normally: the checker enters test values for you. Sample inputs, in order: ' + ', '.join('`' + str(v) + '`' for v in cases[0]['inputs']) + '. Input prompts are omitted from captured output.'
    if 'files' in cases[0]:
        task += '\n\nPractice files are created afresh for every check. Sample file contents:'
        for filename, content in cases[0]['files'].items():
            task += f'\n\n**{filename}**\n```text\n{content}\n```'
    q = dict(id=qid, kind='code', title=title, level='Easy' if int(qid[1:]) <= 4 else 'Medium', points=10,
             source=section, task=task, starter=starter, hint=hint, setup=setup,
             sampleFiles=cases[0].get('files', {}), sampleInputs=cases[0].get('inputs', []))
    q['prompt'] = f'## {qid} | {title}\n\n{task}\n\n**Source checkpoint:** {section}'
    banks[chapter].append(q)
    checks[chapter][qid] = dict(cases=cases, requires=requires or [])
    solutions[chapter][qid] = solution

def mcq(title, section, task, options, answer, explanation):
    qid = f'M{1 + sum(q["kind"] == "mcq" for q in banks[chapter]):02}'
    opts = [dict(letter=chr(65+i), text=text) for i, text in enumerate(options)]
    banks[chapter].append(dict(id=qid, kind='mcq', title=title, level='Easy', points=2, source=section,
        task=task, options=opts, answer=answer, explanation=explanation,
        prompt=f'## {qid} | {title}\n\n{task}\n\n' + '\n'.join(f'{o["letter"]}. {o["text"]}' for o in opts)))

begin('variables')
code('Values and their types', 'Values and types',
     'Assign `whole`, `fraction`, and `text` the values 17, 3.2, and the string "17". Use `type()` to store their types in `whole_type`, `fraction_type`, and `text_type`.',
     'whole = None\nfraction = None\ntext = None\nwhole_type = None\nfraction_type = None\ntext_type = None',
     "whole = 17\nfraction = 3.2\ntext = '17'\nwhole_type = type(whole)\nfraction_type = type(fraction)\ntext_type = type(text)",
     [case('Store an integer.', expected={'whole':17}), case('Store a float.', expected={'fraction':3.2}), case('Keep quoted digits as text.', expected={'text':'17'}),
      case('Identify the integer and float types.', expected={'whole_type':{'$type':'int'},'fraction_type':{'$type':'float'}}), case('Identify the string type.', expected={'text_type':{'$type':'str'}})],
     'Quotes change a numeric-looking value into a string.', ['call:type'])
code('Assignment and updates', 'Variables; Statements',
     'The checker supplies `n`. Store its value in `original`, increase `n` by 1, and print the updated number.',
     'original = None\n# Update n, then print it.', 'original = n\nn = n + 1\nprint(n)',
     [case(f'Update {n} to {n+1}.', {'n':n}, {'original':n,'n':n+1}, stdout=str(n+1)) for n in [17,0,-1,99,-8]],
     'The right side of an assignment is evaluated before the left side changes.')
code('Arithmetic toolbox', 'Operators and operands; Modulus operator',
     'Using supplied integers `a` and `b` (b is positive), calculate `total` (sum), `difference` (a minus b), `product`, `quotient` (true division), and `remainder` (a modulo b).',
     'total = None\ndifference = None\nproduct = None\nquotient = None\nremainder = None',
     'total = a + b\ndifference = a - b\nproduct = a * b\nquotient = a / b\nremainder = a % b',
     [case(f'Arithmetic with {a} and {b}.', {'a':a,'b':b},dict(total=a+b,difference=a-b,product=a*b,quotient=a/b,remainder=a%b)) for a,b in [(7,3),(20,4),(0,5),(17,2),(9,7)]],
     'The percent operator produces the remainder, not a percentage.')
code('Precedence workshop', 'Order of operations; Exercise 4',
     'Use `width` and `height` to compute `floor_half = width // 2`, `decimal_half = width / 2.0`, and `third = height / 3`. Also calculate `expression` from `1 + 2 * 5` and `grouped` from `(1 + 2) * 5`.',
     'floor_half = None\ndecimal_half = None\nthird = None\nexpression = None\ngrouped = None',
     'floor_half = width // 2\ndecimal_half = width / 2.0\nthird = height / 3\nexpression = 1 + 2 * 5\ngrouped = (1 + 2) * 5',
     [case(f'Width {w}, height {h}.',dict(width=w,height=h),dict(floor_half=w//2,decimal_half=w/2.,third=h/3,expression=11,grouped=15)) for w,h in [(17,12.),(8,9.),(1,3.),(22,15.),(0,0.)]],
     'Parentheses control grouping; multiplication happens before addition.')
code('Joining and repeating text', 'String operations',
     'Join `first` and `second` with `+`, saving `joined`. Repeat `first` by the supplied integer `times`, saving `repeated`.',
     'joined = None\nrepeated = None', 'joined = first + second\nrepeated = first * times',
     [case(f'Join and repeat sample {i+1}.',dict(first=a,second=b,times=n),dict(joined=a+b,repeated=a*n)) for i,(a,b,n) in enumerate([('100','150',3),('Py','thon',2),('Hi ','there',1),('','end',4),('Test ','!',0)])],
     'For strings, + joins and * with an integer repeats.')
code('A personal welcome', 'Asking the user for input; Exercise 2',
     'Read one name with `input()` into `name`. Print `Hello` followed by a space and that name.',
     '# Read a name and welcome the user.', "name = input('Name: ')\nprint('Hello', name)",
     [case(f'Welcome {n}.',expected={'name':n},inputs=[n],stdout='Hello '+n) for n in ['Chuck','Ada','Grace Hopper','Lin','Sam']],
     'input returns text; print can separate two arguments with a space.', ['call:input'])
code('Gross pay calculator', 'Choosing mnemonic variable names; Exercise 3',
     'Read hours and hourly rate using two `input()` calls. Convert both to `float`, store them in `hours` and `rate`, compute `pay`, then print `Pay:` and the amount. This chapter uses straight pay for all hours.',
     '# Read hours, read rate, calculate pay, then print.', "hours = float(input('Hours: '))\nrate = float(input('Rate: '))\npay = hours * rate\nprint('Pay:', pay)",
     [case(f'{h} hours at {r}.',expected=dict(hours=float(h),rate=float(r),pay=float(h)*float(r)),inputs=[str(h),str(r)],stdout='Pay: '+str(float(h)*float(r))) for h,r in [(35,2.75),(10,12.5),(0,8),(45,10),(2.5,4)]],
     'Convert the input strings before multiplying.', ['call:input','call:float'])
code('Temperature converter', 'Exercises: Exercise 5',
     'Read a Celsius temperature using `input()`, convert it to a float named `celsius`, and compute `fahrenheit = celsius * 9 / 5 + 32`. Print only the Fahrenheit value.',
     '# Convert Celsius input to Fahrenheit.', 'celsius = float(input("Celsius: "))\nfahrenheit = celsius * 9 / 5 + 32\nprint(fahrenheit)',
     [case(f'Convert {c} Celsius.',expected=dict(celsius=float(c),fahrenheit=c*9/5+32),inputs=[str(c)],stdout=str(c*9/5+32)) for c in [0,100,-40,25,37.5]],
     'Apply multiplication and division before adding 32.', ['call:input'])
mcq('Quoted numbers','Values and types','What is the type of `"3.2"`?', ['float','int','str','bool'],'C','Quotation marks make this a string, even though it looks numeric.')
mcq('A valid name','Variable names and keywords','Which assignment uses a legal variable name?', ['2hours = 4','hours_worked = 4','class = 4','hour-rate = 4'],'B','Underscores are allowed; names cannot start with a digit or be reserved keywords.')
mcq('Assignment output','Statements','What does a script containing only `x = 5` print?', ['5','x','None','Nothing'],'D','Assignment stores a value but does not print it.')
mcq('True division','Operators and operands','In Python 3, what is `7 / 2`?', ['3.5','3','1','14'],'A','The / operator performs true division.')
mcq('Floor division','Operators and operands','What is `17 // 2`?', ['8.5','9','8','1'],'C','For these positive values, floor division gives the whole-number quotient.')
mcq('Remainder','Modulus operator','What is `17 % 5`?', ['3','2','0.2','5'],'B','Three groups of five leave two.')
mcq('Order matters','Order of operations','What is `1 + 2 * 5`?', ['15','25','10','11'],'D','Multiplication is evaluated before addition.')
mcq('Input is text','Asking the user for input','A user types 42 at `input()`. What type is returned?', ['str','int','float','It depends on the digits'],'A','input returns a string. A conversion is needed for arithmetic.')
mcq('Joining strings','String operations','What is `"10" + "15"`?', ['25','"25"','"1015"','An error'],'C','Adding two strings concatenates them.')
mcq('Useful comments','Comments','What happens to text after # outside a string on a Python line?', ['It is printed','It is ignored during execution','It becomes a variable','It runs after the next line'],'B','A comment documents the program without changing its execution.')

begin('conditionals')
code('Boolean comparisons','Boolean expressions',
     'Compare supplied `x` and `y`. Save `equal` (==), `different` (!=), `greater` (>), `at_least` (>=), and `at_most` (<=) as booleans.',
     'equal = None\ndifferent = None\ngreater = None\nat_least = None\nat_most = None',
     'equal = x == y\ndifferent = x != y\ngreater = x > y\nat_least = x >= y\nat_most = x <= y',
     [case(f'Compare {x} and {y}.',dict(x=x,y=y),dict(equal=x==y,different=x!=y,greater=x>y,at_least=x>=y,at_most=x<=y)) for x,y in [(5,5),(5,6),(6,5),(-2,0),(0,-2)]],
     'A comparison uses ==; assignment uses =.')
code('Logical combinations','Logical operators',
     'For supplied integer `n`, save `single_digit` as whether 0 < n < 10 using `and`. Save `divisible` as whether n is divisible by 2 or 3 using `or`. Save `not_positive` using `not` on n > 0.',
     'single_digit = None\ndivisible = None\nnot_positive = None',
     'single_digit = n > 0 and n < 10\ndivisible = n % 2 == 0 or n % 3 == 0\nnot_positive = not (n > 0)',
     [case(f'Combine conditions for {n}.',dict(n=n),dict(single_digit=0<n<10,divisible=n%2==0 or n%3==0,not_positive=not n>0)) for n in [6,7,10,0,-3]],
     'and needs both conditions; or needs at least one.', ['node:And','node:Or','node:Not'])
code('Choose even or odd','Alternative execution',
     'Use `if` and `else` to set `parity` to "even" or "odd" for supplied integer `n`. Print parity.',
     '# Choose one of two branches.', 'if n % 2 == 0:\n    parity = "even"\nelse:\n    parity = "odd"\nprint(parity)',
     [case(f'Classify {n}.',dict(n=n),dict(parity='even' if n%2==0 else 'odd'),stdout='even' if n%2==0 else 'odd') for n in [4,7,0,-2,-3]],
     'A zero remainder after division by two means even.', ['node:If'])
code('Three-way comparison','Chained conditionals',
     'Use an if/elif/else chain to compare `x` and `y`. Set `relation` to "less", "equal", or "greater" and print it.',
     '# Compare x with y.', 'if x < y:\n    relation = "less"\nelif x == y:\n    relation = "equal"\nelse:\n    relation = "greater"\nprint(relation)',
     [case(f'Order {x} and {y}.',dict(x=x,y=y),dict(relation='less' if x<y else 'equal' if x==y else 'greater'),stdout='less' if x<y else 'equal' if x==y else 'greater') for x,y in [(1,2),(2,2),(3,2),(-5,-1),(0,-1)]],
     'Only the first true branch in the chain runs.', ['node:If'])
code('Guard the division','Short-circuit evaluation of logical expressions',
     'Set `safe` to the boolean result of x >= 2 and x / y > 2. Add a `y != 0` guard before division so a zero denominator makes the result False instead of raising an error.',
     'safe = None', 'safe = x >= 2 and y != 0 and x / y > 2',
     [case(f'Guard x={x}, y={y}.',dict(x=x,y=y),dict(safe=x>=2 and y!=0 and x/y>2)) for x,y in [(6,2),(6,0),(1,0),(4,2),(9,3)]],
     'and stops as soon as a condition is false.', ['node:And'])
code('A safer temperature input','Catching exceptions using try and except',
     'Read Fahrenheit using `input()`. In a `try` block, convert it to float and print (fahrenheit - 32) * 5 / 9. On invalid text, print exactly `Please enter a number`.',
     '# Read input and handle conversion errors.', 'text = input("Fahrenheit: ")\ntry:\n    fahrenheit = float(text)\n    print((fahrenheit - 32) * 5 / 9)\nexcept:\n    print("Please enter a number")',
     [case(f'Handle input {v!r}.',inputs=[v],stdout=out) for v,out in [('32','0.0'),('212','100.0'),('-40','-40.0'),('fred','Please enter a number'),('','Please enter a number')]],
     'The except block handles a failed numeric conversion.', ['node:Try','call:input'])
code('Overtime with error handling','Exercises: Exercises 1 and 2',
     'Read hours and rate as floats with `input()`. Pay 1.5 times the rate for hours above 40, and the ordinary rate for other hours. Print only the pay. If either input is not numeric, print `Error, please enter numeric input`. Use conditionals, without defining a function.',
     '# Read two values, handle errors, and calculate overtime.', 'try:\n    hours = float(input("Hours: "))\n    rate = float(input("Rate: "))\n    if hours > 40:\n        pay = 40 * rate + (hours - 40) * rate * 1.5\n    else:\n        pay = hours * rate\n    print(pay)\nexcept:\n    print("Error, please enter numeric input")',
     [case(f'Hours {h}, rate {r}.',inputs=[h,r],stdout=o) for h,r,o in [('45','10','475.0'),('40','10','400.0'),('30','10','300.0'),('bad','10','Error, please enter numeric input'),('20','bad','Error, please enter numeric input')]],
     'Compute regular pay and overtime separately inside the valid-input path.', ['node:If','node:Try','call:input'])
code('Score to letter grade','Exercises: Exercise 3',
     'Read a numeric score with `input()`. For scores from 0 to 1, print A at 0.9+, B at 0.8+, C at 0.7+, D at 0.6+, otherwise F. Print `Bad score` for out-of-range values or nonnumeric text. Each check covers a group of inputs, including boundaries.',
     '# Validate the score before choosing a grade.', 'try:\n    score = float(input("Score: "))\n    if score < 0 or score > 1:\n        print("Bad score")\n    elif score >= .9:\n        print("A")\n    elif score >= .8:\n        print("B")\n    elif score >= .7:\n        print("C")\n    elif score >= .6:\n        print("D")\n    else:\n        print("F")\nexcept:\n    print("Bad score")',
     [dict(label=label, variants=[case('',inputs=[v],stdout=o) for v,o in values],given={},expected={}) for label,values in [
         ('A and B boundaries.',[('1','A'),('.9','A'),('.899','B'),('.8','B')]),
         ('C boundary.',[('.799','C'),('.7','C')]), ('D boundary.',[('.699','D'),('.6','D')]),
         ('F and zero.',[('.599','F'),('0','F')]), ('Reject invalid scores.',[('-0.1','Bad score'),('1.1','Bad score'),('perfect','Bad score')])]],
     'Check the highest threshold first, after validating the range.', ['node:If','node:Try','call:input'])
mcq('Boolean type','Boolean expressions','Which is a boolean value?', ['"True"','True','"False"','"bool"'],'B','True without quotation marks is a bool value.')
mcq('Equality test','Boolean expressions','Which operator tests equality?', ['=','=>','==','!='],'C','== compares values; = assigns a value.')
mcq('Both conditions','Logical operators','When is `x > 0 and x < 10` true?', ['For every positive x','Only at x = 10','For negative x','When x lies strictly between 0 and 10'],'D','Both comparisons must be true.')
mcq('Either condition','Logical operators','What is `False or True`?', ['True','False','None','An error'],'A','or is true if either operand is true.')
mcq('An empty branch','Conditional execution','Which statement can occupy a branch that does nothing?', ['empty','skip','pass','stop'],'C','pass is a valid statement with no effect.')
mcq('Branch structure','Conditional execution','What must follow an if header and colon?', ['A closing brace','An indented body','A return statement','An import'],'B','Indentation identifies the statements controlled by the condition.')
mcq('First matching branch','Chained conditionals','If two conditions in an if/elif chain are true, which bodies run?', ['Both','Neither','Only the last','Only the first matching body'],'D','An if/elif chain selects the first condition that is true.')
mcq('Nested decisions','Nested conditionals','When is an inner if reached inside an outer if body?', ['When the outer condition is true','Before the outer condition is tested','Only when the outer condition is false','Always'],'A','The outer branch must run before its nested statement can be reached.')
mcq('Exception path','Catching exceptions using try and except','If float conversion raises an error inside try, control moves to which block?', ['else automatically','The next line of try','except','The beginning of the script'],'C','An applicable except block handles the exception.')
mcq('Guardian ordering','Short-circuit evaluation of logical expressions','Which expression guards division when y is zero?', ['x / y > 2 and y != 0','y != 0 and x / y > 2','x / y > 2 or y == 0','y == 0 and x / y > 2'],'B','The nonzero test must occur before division in an and expression.')

begin('loops')
code('Count down with while','The while statement',
     'Use a `while` loop to print supplied positive integer `n`, then each lower integer down through 1. Decrease n on each iteration. Finish by printing `Blastoff!`.',
     '# Count down, then announce blastoff.', 'while n > 0:\n    print(n)\n    n = n - 1\nprint("Blastoff!")',
     [case(f'Countdown from {n}.',dict(n=n),dict(n=0),stdout='\n'.join(map(str,range(n,0,-1)))+'\nBlastoff!') for n in [5,1,3,8,2]],
     'The loop condition is tested before each iteration.', ['node:While'])
code('Stop at done','Infinite loops and break',
     'Repeatedly read text using `input()` in a while loop. When the text is `done`, use `break`. Print every other entry unchanged, then print `Done!` once after the loop.',
     '# Read until the sentinel is entered.', 'while True:\n    line = input("> ")\n    if line == "done":\n        break\n    print(line)\nprint("Done!")',
     [case(f'Sentinel sequence {i+1}.',inputs=values,stdout='\n'.join(values[:-1]+['Done!'])) for i,values in enumerate([['hello','done'],['done'],['one','two','done'],['Done','done'],['42','done']])],
     'Check for the sentinel before printing the input.', ['node:While','node:Break','call:input'])
code('Skip comment lines','Finishing iterations with continue',
     'Read lines until `done`. Skip lines starting with # using `continue`. Print other lines unchanged, then `Done!` after the loop. The supplied skeleton checks done for you.',
     'while True:\n    line = input("> ")\n    if line == "done":\n        break\n    # Skip comment lines; print the others.\nprint("Done!")',
     'while True:\n    line = input("> ")\n    if line == "done":\n        break\n    if line.startswith("#"):\n        continue\n    print(line)\nprint("Done!")',
     [case(f'Filter sequence {i+1}.',inputs=values,stdout='\n'.join([s for s in values[:-1] if not s.startswith('#')]+['Done!'])) for i,values in enumerate([['#ignore','hello','done'],['#one','#two','done'],['plain','done'],['x#y','done'],['done']])],
     'continue skips the remaining body and begins another iteration.', ['node:Continue','call:input'])
code('Greet each friend','Definite loops using for',
     'Use a `for` loop over supplied `friends`. Print `Happy New Year:` followed by a space and each friend. Print `Done!` after all friends have been processed.',
     '# Greet every friend in order.', 'for friend in friends:\n    print("Happy New Year:", friend)\nprint("Done!")',
     [case(f'Greet group {i+1}.',dict(friends=names),stdout='\n'.join(['Happy New Year: '+n for n in names]+['Done!'])) for i,names in enumerate([['Joseph','Glenn','Sally'],['Ada'],[],['Sam','Lin'],['Lee','Lee']])],
     'The loop variable receives each item from the supplied list.', ['node:For'])
number_sets = [[3,41,12,9,74,15],[],[-5,-2,-8],[7],[0,0,0]]
code('Count and accumulate','Counting and summing loops',
     'Use a for loop over `numbers` to compute `count` and `total`. Initialize both to zero. Practice the loop pattern without calling len or sum. No printing is required.',
     'count = 0\ntotal = 0\n# Process numbers.', 'count = 0\ntotal = 0\nfor number in numbers:\n    count = count + 1\n    total = total + number',
     [case(f'Count and sum sample {i+1}.',dict(numbers=nums),dict(count=len(nums),total=sum(nums))) for i,nums in enumerate(number_sets)],
     'A counter adds one; an accumulator adds the current value.', ['node:For','no-call:len','no-call:sum'])
code('Largest so far','Maximum and minimum loops',
     'Initialize `largest` to None. Use a loop to track the greatest value in `numbers`, without calling max. For an empty list, leave largest as None.',
     'largest = None\n# Track the largest value.', 'largest = None\nfor number in numbers:\n    if largest is None or number > largest:\n        largest = number',
     [case(f'Largest in sample {i+1}.',dict(numbers=nums),dict(largest=max(nums) if nums else None)) for i,nums in enumerate(number_sets)],
     'None marks the state before the first value has been seen.', ['node:For','no-call:max'])
code('Smallest so far','Maximum and minimum loops',
     'Initialize `smallest` to None. Use a loop to find the least value in `numbers`, without calling min. Leave None for an empty list.',
     'smallest = None\n# Track the smallest value.', 'smallest = None\nfor number in numbers:\n    if smallest is None or number < smallest:\n        smallest = number',
     [case(f'Smallest in sample {i+1}.',dict(numbers=nums),dict(smallest=min(nums) if nums else None)) for i,nums in enumerate(number_sets)],
     'Reverse the comparison used by the largest-value pattern.', ['node:For','no-call:min'])
code('A resilient number loop','Exercises: Exercise 1',
     'Read integers until `done`. Handle invalid entries with try/except, print `Invalid input`, and continue. Track `total` and `count`. At the end, print total, count, and average separated by spaces. For no valid entries, print `No numbers` instead of dividing by zero.',
     'total = 0\ncount = 0\n# Read numbers until done, then report.',
     'total = 0\ncount = 0\nwhile True:\n    text = input("Number: ")\n    if text == "done":\n        break\n    try:\n        number = int(text)\n    except:\n        print("Invalid input")\n        continue\n    total = total + number\n    count = count + 1\nif count > 0:\n    print(total, count, total / count)\nelse:\n    print("No numbers")',
     [case(label,expected=dict(total=t,count=c),inputs=ins,stdout=out) for label,ins,t,c,out in [
         ('Skip bad data.',['4','5','bad data','7','done'],16,3,'Invalid input\n16 3 5.333333333333333'),
         ('Empty stream.',['done'],0,0,'No numbers'),('Negative values.',['-2','-4','done'],-6,2,'-6 2 -3.0'),
         ('Zero is valid.',['0','done'],0,1,'0 1 0.0'),('Only invalid data.',['bad','done'],0,0,'Invalid input\nNo numbers')]],
     'Check for done before converting text to an integer.', ['node:While','node:Try','node:Break','node:Continue'])
mcq('Initialization','Updating variables','Before executing `count = count + 1`, what must be true?', ['count must be zero','count must already have a value','count must be a string','count must be a keyword'],'B','Python evaluates the old value before assigning the new one.')
mcq('While condition','The while statement','When is the condition of a while loop evaluated?', ['Only after the loop','Only once','Before every iteration','Only after break'],'C','A false condition prevents the body from running.')
mcq('No iterations','The while statement','What happens if a while condition is false at its first check?', ['The body runs once','The program always fails','The body runs forever','The body is skipped'],'D','while tests its condition before entering the body.')
mcq('Leaving a loop','Infinite loops and break','What does break do?', ['Exits the current loop','Restarts the script','Skips only one print','Ends every function'],'A','Execution continues after the loop containing break.')
mcq('Skipping an iteration','Finishing iterations with continue','What does continue do?', ['Stops the interpreter','Exits the loop permanently','Moves to the next iteration','Resets all variables'],'C','The rest of the current loop body is skipped.')
mcq('Definite iteration','Definite loops using for','In `for friend in friends:`, what is friend?', ['The whole list','The iteration variable','A keyword','A function'],'B','It refers to each list element in turn.')
mcq('Counting pattern','Counting and summing loops','Which update counts each processed item?', ['count = item','count = count + item','count = 0','count = count + 1'],'D','Adding one per iteration measures the number of items.')
mcq('Accumulator pattern','Counting and summing loops','Which update adds the current value to a running total?', ['total = total + value','total = value','total = total + 1','value = total'],'A','An accumulator retains the prior total and adds the next value.')
mcq('Before the first value','Maximum and minimum loops','Why initialize largest to None rather than 0?', ['None is a large integer','None sorts above numbers','It marks that no item has been seen','None automatically calculates the maximum'],'C','Using zero as the initial maximum gives wrong results for all-negative data.')
mcq('Debug by bisection','Debugging','What is the purpose of checking an intermediate value near the middle of a program?', ['To double the code','To narrow which portion contains the bug','To remove all loops','To skip input validation'],'B','The check helps determine whether the error occurred before or after that point.')

begin('strings')
code('First, last, and length','A string is a sequence; Getting the length of a string using len',
     'For supplied nonempty `fruit`, assign its first character to `first`, its last character to `last`, and its length to `length`. Use indexing and len.',
     'first = None\nlast = None\nlength = None', 'first = fruit[0]\nlast = fruit[-1]\nlength = len(fruit)',
     [case(f'Inspect {s!r}.',dict(fruit=s),dict(first=s[0],last=s[-1],length=len(s))) for s in ['banana','apple','x','pear','orange']],
     'Indexes start at zero; -1 selects the last character.', ['call:len','node:Subscript'])
code('Walk a string backwards','Traversal through a string with a loop; Exercise 1',
     'Use a while loop to print each character of `fruit` on its own line, starting at the end. An empty string should print nothing.',
     '# Start at the final index and work backwards.', 'index = len(fruit) - 1\nwhile index >= 0:\n    print(fruit[index])\n    index = index - 1',
     [case(f'Reverse traversal of {s!r}.',dict(fruit=s),stdout='\n'.join(reversed(s))) for s in ['banana','abc','x','','pear']],
     'Start at len(fruit) - 1 and keep going while the index is nonnegative.', ['node:While'])
code('Slice a word','String slices; Exercise 2',
     'Using slices of `fruit`, save its first three characters as `prefix`, everything from index 3 as `suffix`, and the full string as `copy`. Short and empty strings are valid.',
     'prefix = None\nsuffix = None\ncopy = None', 'prefix = fruit[:3]\nsuffix = fruit[3:]\ncopy = fruit[:]',
     [case(f'Slice {s!r}.',dict(fruit=s),dict(prefix=s[:3],suffix=s[3:],copy=s[:])) for s in ['banana','Python','hi','','abcd']],
     'A slice includes its start and excludes its stop.', ['node:Slice'])
code('Create a new greeting','Strings are immutable',
     'Keep supplied nonempty `greeting` unchanged. Build `new_greeting` by replacing its first character with supplied `letter`, using concatenation and a slice.',
     'new_greeting = None', 'new_greeting = letter + greeting[1:]',
     [case(f'Replace first character in sample {i+1}.',dict(greeting=g,letter=l),dict(greeting=g,new_greeting=l+g[1:])) for i,(g,l) in enumerate([('Hello, world!','J'),('cat','b'),('x','y'),('Python','J'),('door','p')])],
     'You can build a new string, but cannot assign to greeting[0].', ['node:Slice'])
code('Count a chosen letter','Looping and counting',
     'Use a for loop to count occurrences of supplied `letter` in `word`. Save the integer in `count`. Matching is case-sensitive. Practice the counter pattern without using the count method.',
     'count = 0\n# Count matching letters.', 'count = 0\nfor char in word:\n    if char == letter:\n        count = count + 1',
     [case(f'Count {l!r} in {w!r}.',dict(word=w,letter=l),dict(count=w.count(l))) for w,l in [('banana','a'),('banana','z'),('Mississippi','s'),('','a'),('AaA','a')]],
     'Increment only when the current character matches.', ['node:For','no-method:count'])
code('Clean and normalize','String methods',
     'Remove whitespace from both ends of `line` into `clean`. Save an uppercase copy as `loud` and a lowercase copy as `quiet`. Set `starts` to whether quiet starts with "have". Leave line unchanged.',
     'clean = None\nloud = None\nquiet = None\nstarts = None', 'clean = line.strip()\nloud = clean.upper()\nquiet = clean.lower()\nstarts = quiet.startswith("have")',
     [case(f'Normalize sample {i+1}.',dict(line=s),dict(line=s,clean=s.strip(),loud=s.strip().upper(),quiet=s.strip().lower(),starts=s.strip().lower().startswith('have'))) for i,s in enumerate(['  Have a nice day  ','\tHELLO\n','have fun','   ','HAVEN'])],
     'String methods return new strings; save the returned values.', ['method:strip','method:upper','method:lower','method:startswith'])
code('Find the mail host','Parsing strings',
     'The supplied `data` contains a From line with an email address followed by a space and date. Use find and slicing to extract the domain after @ into `host`. Do not use split.',
     'host = None\n# Locate @, then the space after it.', 'atpos = data.find("@")\nsppos = data.find(" ", atpos)\nhost = data[atpos + 1:sppos]',
     [case(f'Extract domain in sample {i+1}.',dict(data='From '+address+' Sat Jan 5'),dict(host=address.split('@')[1])) for i,address in enumerate(['stephen@uct.ac.za','a@example.org','long.name@school.edu','x@a.io','person@mail.example.net'])],
     'Start the second find at the position of the at-sign.', ['method:find','node:Slice','no-method:split'])
code('Extract a numeric field','Exercises: Exercise 5',
     'From `text` in the form `X-DSPAM-Confidence: number`, use find and slicing to take the text after the colon. Convert it to a float called `confidence` and print it. Whitespace around the number is allowed.',
     'confidence = None\n# Find the colon, slice, convert, and print.', 'position = text.find(":")\nconfidence = float(text[position + 1:])\nprint(confidence)',
     [case(f'Parse confidence {v}.',dict(text='X-DSPAM-Confidence: '+v),dict(confidence=float(v)),stdout=str(float(v))) for v in ['0.8475',' 0.5','1.0','0.0',' 0.123 ']],
     'float accepts leading and trailing whitespace.', ['method:find','node:Slice','call:float'])
mcq('Zero-based indexing','A string is a sequence','What is `"banana"[1]`?', ['b','a','n','An error'],'B','Index zero is b; index one is a.')
mcq('Final character','Getting the length of a string using len','For a nonempty string s, which selects its final character?', ['s[len(s)]','s[1]','s[-1]','s[0]'],'C','Negative indexes count from the end; -1 selects the last character.')
mcq('Slice boundary','String slices','What is `"Monty Python"[0:5]`?', ['"Monty "','"Python"','"Mont"','"Monty"'],'D','The slice includes indexes zero through four.')
mcq('Empty slice','String slices','What is `"banana"[3:3]`?', ['An empty string','"a"','None','An error'],'A','Equal slice boundaries select no characters.')
mcq('Immutable text','Strings are immutable','What happens to `greeting[0] = "J"` when greeting is a string?', ['It changes the first letter','It appends J','It raises a TypeError','It deletes greeting'],'C','A string does not support item assignment.')
mcq('Substring membership','The in operator','What is `"ana" in "banana"`?', ['False','True','3','"ana"'],'B','in tests whether one string appears inside another.')
mcq('Find failure','String methods','What does `"banana".find("z")` return?', ['0','None','6','-1'],'D','find returns -1 when the substring is absent.')
mcq('Whitespace cleanup','String methods','Which removes whitespace from both ends of a string?', ['strip()','upper()','find()','startswith()'],'A','strip removes leading and trailing whitespace.')
mcq('Case-sensitive prefix','String methods','What is `"Have a nice day".startswith("h")`?', ['True','"Have"','False','An error'],'C','The lowercase h does not match uppercase H.')
mcq('A full slice','String slices; Exercise 2','What does `fruit[:]` select?', ['The first character','The entire string','The last character','An empty string'],'B','Omitting both bounds selects from the beginning through the end.')

begin('files')
texts = ['Hello\nWorld!\n','one line\n','','a\nb\nc','last line']
code('Count lines in a file','Opening files; Reading files',
     'Open the supplied practice file `sample.txt`. Use a for loop over its handle to count lines into `count`, then print count. A final line without a newline still counts.',
     'count = 0\n# Open sample.txt and count its lines.', 'fhand = open("sample.txt")\ncount = 0\nfor line in fhand:\n    count = count + 1\nfhand.close()\nprint(count)',
     [case(f'Count lines in file sample {i+1}.',expected=dict(count=len(s.splitlines())),files={'sample.txt':s},stdout=str(len(s.splitlines()))) for i,s in enumerate(texts)],
     'A file handle can be used directly in a for loop.', ['call:open','node:For'])
code('Read and exhaust a handle','Reading files',
     'Open `sample.txt`. Save the first call to its read method in `contents`, and the second call on the same handle in `again`. Save the character count of contents as `length`. Close the handle.',
     '# Read the same handle twice.', 'fhand = open("sample.txt")\ncontents = fhand.read()\nagain = fhand.read()\nlength = len(contents)\nfhand.close()',
     [case(f'Read file sample {i+1}.',expected=dict(contents=s,again='',length=len(s)),files={'sample.txt':s}) for i,s in enumerate(texts)],
     'After reading to the end, another read on that handle returns an empty string.', ['call:open','method:read','method:close'])
mail_texts = [
    'From: ada@example.org\nSubject: Hello\n\nFrom: lin@example.org\n',
    'Subject: No sender\n',
    '',
    'From person@example.org Sat Jan 5\nFrom: person@example.org\n',
    'From: one@example.org\nFrom: two@example.org\nFrom: three@example.org\n']
code('Select sender headers','Searching through a file',
     'Read `mail.txt` line by line. Print only lines beginning with `From:`. Strip trailing whitespace before printing so no extra blank lines appear.',
     '# Filter From: headers.', 'fhand = open("mail.txt")\nfor line in fhand:\n    if line.startswith("From:"):\n        print(line.rstrip())\nfhand.close()',
     [case(f'Select headers from sample {i+1}.',files={'mail.txt':s},stdout='\n'.join(l.rstrip() for l in s.splitlines() if l.startswith('From:'))) for i,s in enumerate(mail_texts)],
     'From: headers are different from From followed by a space.', ['call:open','method:startswith','method:rstrip'])
code('Search anywhere in a line','Searching through a file',
     'Read `mail.txt`. Use find to print lines containing `@uct.ac.za` anywhere. Remove trailing whitespace and print each matching line once.',
     '# Find the requested domain in each line.', 'fhand = open("mail.txt")\nfor line in fhand:\n    if line.find("@uct.ac.za") == -1:\n        continue\n    print(line.rstrip())\nfhand.close()',
     [case(f'Search file sample {i+1}.',files={'mail.txt':s},stdout='\n'.join(l.rstrip() for l in s.splitlines() if '@uct.ac.za' in l)) for i,s in enumerate(['From: a@uct.ac.za\nFrom: b@example.org\n','@uct.ac.za at index zero\n','none\n','','To: x@uct.ac.za\nCc: y@uct.ac.za\n'])],
     'A match at position zero is still a match; only -1 means absent.', ['call:open','method:find'])
code('Choose a file safely','Letting the user choose the file name; Using try, except, and open',
     'Read a filename with input. Try to open it, count lines beginning with `Subject:`, and print only that count. If opening fails, print `File cannot be opened:` followed by the filename. Use try/except and avoid reading a handle that failed to open.',
     '# Read the filename; handle missing files.', 'fname = input("File: ")\ntry:\n    fhand = open(fname)\nexcept:\n    print("File cannot be opened:", fname)\nelse:\n    count = 0\n    for line in fhand:\n        if line.startswith("Subject:"):\n            count = count + 1\n    fhand.close()\n    print(count)',
     [case(label,inputs=[name],files=files,stdout=out) for label,name,files,out in [
         ('Two subject headers.','mail.txt',{'mail.txt':'Subject: one\nFrom: a\nSubject: two\n'},'2'),
         ('Empty file.','empty.txt',{'empty.txt':''},'0'),('Missing file.','missing.txt',{},'File cannot be opened: missing.txt'),
         ('Do not count embedded text.','other.txt',{'other.txt':'Re: Subject: one\n'},'0'),
         ('Different filename.','notes.txt',{'notes.txt':'Subject: test\n'},'1')]],
     'Keep the file-processing code on the successful-open path.', ['node:Try','call:open','call:input'])
code('Uppercase a file','Exercises: Exercise 1',
     'Ask for a filename using input, open it, and print every line in uppercase. Remove trailing whitespace before printing. Test files exist, so this mission does not require missing-file handling.',
     '# Open the requested file and uppercase each line.', 'fname = input("File: ")\nfhand = open(fname)\nfor line in fhand:\n    print(line.rstrip().upper())\nfhand.close()',
     [case(f'Uppercase file sample {i+1}.',inputs=['words.txt'],files={'words.txt':s},stdout='\n'.join(l.rstrip().upper() for l in s.splitlines())) for i,s in enumerate(['hello\nworld\n','MiXeD\n','','one\n\ntwo\n','last line'])],
     'upper returns a new string; print that returned value.', ['call:input','call:open','method:upper'])
confidence_files = ['X-DSPAM-Confidence: 0.5\nIgnore this\nX-DSPAM-Confidence: 1.0\n','X-DSPAM-Confidence: 0.8475\n','Subject: none\n','', 'X-DSPAM-Confidence: 0.0\nX-DSPAM-Confidence: 0.2\nX-DSPAM-Confidence: 0.4\n']
code('Average spam confidence','Exercises: Exercise 2',
     'Open `mail.txt`, select `X-DSPAM-Confidence:` lines, and convert the part after the colon to float. Track `count` and `total`, then print the average. Print `No matching lines` if count is zero. Values in matching lines are valid numbers.',
     'count = 0\ntotal = 0.0\n# Read matching lines, then calculate the average.', 'count = 0\ntotal = 0.0\nfhand = open("mail.txt")\nfor line in fhand:\n    if not line.startswith("X-DSPAM-Confidence:"):\n        continue\n    value = float(line[line.find(":") + 1:])\n    count = count + 1\n    total = total + value\nfhand.close()\nif count > 0:\n    print(total / count)\nelse:\n    print("No matching lines")',
     [case(f'Average sample {i+1}.',files={'mail.txt':s},expected=dict(count=c,total=t),stdout=str(t/c) if c else 'No matching lines') for i,(s,c,t) in enumerate(zip(confidence_files,[2,1,0,0,3],[1.5,.8475,0.,0.,.6]))],
     'A counter and accumulator allow you to compute an average after the loop.', ['call:open','call:float','node:For'])
code('Write a fresh text file','Writing files',
     'Open `output.txt` in write mode. Write supplied `first` and `second` on separate lines, each ending with a newline. Close the handle. Existing file contents must be replaced.',
     '# Write two lines to output.txt.', 'fout = open("output.txt", "w")\nfout.write(first + "\\n")\nfout.write(second + "\\n")\nfout.close()',
     [case(f'Write sample {i+1}.',dict(first=a,second=b),files={'output.txt':'old contents that must disappear\n'},written={'output.txt':a+'\n'+b+'\n'}) for i,(a,b) in enumerate([('Hello','World'),('one','two'),('','end'),('42','text'),('last','')])],
     'write does not add a newline automatically; include it in the string.', ['call:open','method:write','method:close'])
mcq('A file handle','Opening files','What does open return when it succeeds?', ['All file text','A file handle','The line count','A list of words'],'B','A handle provides access to the file; opening alone does not load all its data.')
mcq('Missing file','Opening files','Opening a missing file for reading normally raises which exception?', ['TypeError','ZeroDivisionError','FileNotFoundError','No exception'],'C','Use try/except when a supplied path may not exist.')
mcq('Newline length','Text files and lines','How many characters are in the string `"X\nY"`?', ['2','4','5','3'],'D','The newline escape represents one character.')
mcq('File iteration','Reading files','A for loop over a text file handle yields what?', ['One line at a time','The entire file each time','Only filenames','One integer per byte'],'A','A file loop reads successive lines, normally retaining their newline characters.')
mcq('Read again','Reading files','After f.read() reaches the end, what does another f.read() return?', ['The whole file again','None','An empty string','The last line'],'C','Reading consumes the handle through the end of the file.')
mcq('Double spacing','Searching through a file','Why can print(line) show blank lines between file lines?', ['Files add tabs','line already ends in a newline and print adds another','print repeats each word','open inserts blank lines'],'B','Remove the trailing newline before printing to avoid extra spacing.')
mcq('Prefix filtering','Searching through a file','Which checks whether line begins with `From:`?', ['line.find("From:") == -1','"From:" == line','line.upper()','line.startswith("From:")'],'D','startswith checks the beginning of the string.')
mcq('Choosing a filename','Letting the user choose the file name','Why read a filename with input?', ['To process different files without editing the code','To create every missing file','To avoid opening the file','To load every file at once'],'A','The user can select which file the same program processes.')
mcq('Write mode','Writing files','What happens when an existing file is opened with mode w?', ['New text always appends','The file is read only','Its old contents are cleared','Nothing until close'],'C','Write mode starts a fresh file, replacing existing contents.')
mcq('Write return value','Writing files','What does a text file handle write method return?', ['The file handle','The number of characters written','The whole file','Always None'],'B','The return value records the length of the written text.')

begin('lists')
code('Index and mutate','A list is a sequence; Lists are mutable',
     'For supplied nonempty `numbers`, save its first item as `first` and its last item as `last`. Replace the first item with `replacement`. Save the list length as `length`.',
     'first = None\nlast = None\nlength = None\n# Replace the first item.', 'first = numbers[0]\nlast = numbers[-1]\nnumbers[0] = replacement\nlength = len(numbers)',
     [case(f'Mutate sample {i+1}.',dict(numbers=nums,replacement=r),dict(first=nums[0],last=nums[-1],numbers=[r]+nums[1:],length=len(nums))) for i,(nums,r) in enumerate([([10,20,30],99),([1],8),([-1,-2],0),([0,0],3),([2,4,6,8],5)])],
     'Unlike strings, lists support assignment to an index.', ['node:Subscript'])
code('Combine, repeat, and slice','List operations; List slices',
     'Save `left + right` as `joined`, `left * 2` as `repeated`, and `joined[1:3]` as `middle`. Keep left and right unchanged.',
     'joined = None\nrepeated = None\nmiddle = None', 'joined = left + right\nrepeated = left * 2\nmiddle = joined[1:3]',
     [case(f'List operations sample {i+1}.',dict(left=a,right=b),dict(left=a,right=b,joined=a+b,repeated=a*2,middle=(a+b)[1:3])) for i,(a,b) in enumerate([([1,2],[3,4]),([],[7]),([9],[]),([1],[2,3]),([],[])])],
     'List addition concatenates; repetition repeats elements.', ['node:Slice'])
code('Append, extend, and sort','List methods',
     'Append supplied `item` to `values`, extend values with the individual items from `extra`, then sort values in place in ascending order. Do not assign the return value of sort to values.',
     '# Modify values with three list methods.', 'values.append(item)\nvalues.extend(extra)\nvalues.sort()',
     [case(f'Build and sort sample {i+1}.',dict(values=v,item=x,extra=e),dict(values=sorted(v+[x]+e))) for i,(v,x,e) in enumerate([([3,1],2,[5,4]),([],0,[]),([2],2,[2]),([-1],-3,[-2]),([9,1],4,[0])])],
     'append adds one item; extend adds items from another list.', ['method:append','method:extend','method:sort'])
code('Remove an element','Deleting elements',
     'Use pop with supplied valid `index` on `values`. Store the removed item in `removed`, leaving values with the remaining items in their original order.',
     'removed = None', 'removed = values.pop(index)',
     [case(f'Remove index {idx} from sample {i+1}.',dict(values=v,index=idx),dict(removed=v[idx],values=v[:idx]+v[idx+1:])) for i,(v,idx) in enumerate([([10,20,30],1),([5],0),([1,2,3],0),([1,2,3],2),(['a','b'],1)])],
     'pop both modifies the list and returns the deleted item.', ['method:pop'])
code('Lists and string methods','Lists and strings',
     'Split supplied `text` on whitespace into `words`. Join those words with a hyphen into `joined`. Save the number of words as `count`.',
     'words = None\njoined = None\ncount = None', 'words = text.split()\njoined = "-".join(words)\ncount = len(words)',
     [case(f'Split and join sample {i+1}.',dict(text=s),dict(words=s.split(),joined='-'.join(s.split()),count=len(s.split()))) for i,s in enumerate(['pining for the fjords','  one   two  ','','single','a\tb\nc'])],
     'With no argument, split handles runs of whitespace.', ['method:split','method:join'])
code('Copy without aliasing','Objects and values; Aliasing; Debugging',
     'Copy supplied nonempty list `original` using a full slice into `copy`. Change copy[0] to supplied `replacement`. Leave original unchanged. Save `same_object` as the result of `copy is original`.',
     'copy = None\nsame_object = None', 'copy = original[:]\ncopy[0] = replacement\nsame_object = copy is original',
     [case(f'Independent copy sample {i+1}.',dict(original=v,replacement=r),dict(original=v,copy=[r]+v[1:],same_object=False)) for i,(v,r) in enumerate([([1,2],9),(['a','b'],'z'),([0],7),([3,3],4),([-1,-2],0)])],
     'Assignment alone creates an alias; a slice creates a separate list.', ['node:Slice','node:Is'])
code('Unique words in a file','Exercises: Exercise 4',
     'Open `romeo.txt`, split each line into words, and append only words not already in `unique`. Sort unique alphabetically. Keep capitalization and punctuation as they are. Use a list and membership checks, without sets or dictionaries. No printing is required.',
     'unique = []\n# Read, collect distinct words, and sort.', 'unique = []\nfhand = open("romeo.txt")\nfor line in fhand:\n    for word in line.split():\n        if word not in unique:\n            unique.append(word)\nfhand.close()\nunique.sort()',
     [case(f'Unique words sample {i+1}.',files={'romeo.txt':s},expected=dict(unique=sorted(set(s.split())))) for i,s in enumerate(['But soft what light\nwhat light breaks\n','one one one\n','','A a A\n','red blue\nblue green\n'])],
     'Use not in before append, then sort once after reading.', ['call:open','method:split','method:append','method:sort','no-call:set','no-node:Set','no-node:SetComp','no-node:Dict','no-node:DictComp'])
code('A guarded mail reader','Debugging: Lists, split, and files; Exercises 2 and 5',
     'Read `mail.txt`. Split each line and skip it unless it has at least two words and the first word is exactly `From` (not `From:`). Print the second word for each accepted line. Track `count` and finish by printing `Count:` and count. Handle blank and one-word lines safely.',
     'count = 0\n# Guard list indexes before reading a sender.', 'count = 0\nfhand = open("mail.txt")\nfor line in fhand:\n    words = line.split()\n    if len(words) < 2 or words[0] != "From":\n        continue\n    print(words[1])\n    count = count + 1\nfhand.close()\nprint("Count:", count)',
     [case(f'Guard mailbox sample {i+1}.',files={'mail.txt':s},expected=dict(count=len(senders)),stdout='\n'.join(senders+['Count: '+str(len(senders))])) for i,(s,senders) in enumerate([
         ('From ada@example.org Sat Jan 5\nFrom: header@example.org\n\nFrom\nFrom lin@example.org Sun Jan 6\n',['ada@example.org','lin@example.org']),
         ('',[]),('From\n\nOther\n',[]),('From: header@example.org\n',[]),('From a@example.org\nFrom a@example.org\n',['a@example.org','a@example.org'])])],
     'Check the length before accessing words[0] or words[1].', ['call:open','method:split'])
mcq('Mutable lists','Lists are mutable','Which operation is valid when values is a nonempty list?', ['values[0] = 7','values(0) = 7','values = values.sort() always preserves the list','Lists cannot change'],'A','A list permits assignment to individual elements.')
mcq('Nested elements','A list is a sequence','What is the length of `[1, [2, 3], 4]`?', ['4','2','3','5'],'C','The inner list counts as a single element of the outer list.')
mcq('List concatenation','List operations','What is `[1, 2] + [3]`?', ['[4, 5]','[1, 2, 3]','[1, 2, [3]]','An error'],'B','The + operator concatenates lists.')
mcq('Append or extend','List methods','What does `items.append([2, 3])` add?', ['Two separate numbers','Nothing','Only 2','One nested list'],'D','append adds its argument as one element.')
mcq('Sort return value','List methods; Debugging','What does a list sort method return?', ['None','The sorted list','True','The final element'],'A','sort mutates the list in place and returns None.')
mcq('Pop result','Deleting elements','What does pop return?', ['The remaining list','Nothing','The removed element','The new length'],'C','pop removes an element and returns it.')
mcq('Whitespace split','Lists and strings','What is `"a  b".split()`?', ['["a", "", "b"]','["a", "b"]','["a  b"]','"ab"'],'B','Default split treats runs of whitespace as one separator.')
mcq('Aliased names','Aliasing','After `a = [1, 2]; b = a; b[0] = 9`, what is a?', ['[1, 2]','[2, 9]','None','[9, 2]'],'D','a and b refer to the same list.')
mcq('Make a copy','Aliasing; Debugging','Which creates a separate shallow copy of list a?', ['b = a[:]','b = a','b = a.sort()','b = a.append(0)'],'A','A full slice builds another list containing the same elements.')
mcq('Guard an index','Debugging: Lists, split, and files','Before reading words[1], which guard ensures that index exists?', ['len(words) > 0','words[0] == "From"','len(words) >= 2','words is not None'],'C','Index one requires at least two elements.')

metadata = [
    ('variables','02','Variables','Variables, expressions, and statements','https://www.py4e.com/html3/02-variables'),
    ('conditionals','03','Conditionals','Conditional execution','https://www.py4e.com/html3/03-conditional'),
    ('loops','05','Loops','Loops and iterations','https://www.py4e.com/lessons/loops'),
    ('strings','06','Strings','Strings','https://www.py4e.com/html3/06-strings'),
    ('files','07','Files','Files','https://www.py4e.com/html3/07-files'),
    ('lists','08','Lists','Lists','https://www.py4e.com/lessons/lists'),
]

def write(path, data):
    (ROOT / path).parent.mkdir(parents=True, exist_ok=True)
    (ROOT / path).write_text(json.dumps(data, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')

chapters = []
for slug, number, title, full_title, source in metadata:
    questions = banks[slug]
    assert len(questions) == 18 and sum(q['points'] for q in questions) == 100
    reading = {'loops':'https://www.py4e.com/html3/05-iterations','lists':'https://www.py4e.com/html3/08-lists'}.get(slug, source)
    for q in questions:
        q['sourceUrl'] = reading
    chapters.append(dict(id=slug,number=number,title=title,fullTitle=full_title,source=source,reading=reading,questions=questions,
                         notebook=f'/ZHUDDLE_{title}_Quest.ipynb'))
    cells = [dict(cell_type='markdown',metadata={},source=f'# ZHUDDLE | Chapter {number}: {full_title}\n\n8 coding missions + 10 MCQs. 100 XP.\n\nAdapted from Charles R. Severance, Python for Everybody (CC BY 4.0).\n\nSource: {source}\n\nReading: {reading}\n\nThe browser runs five independent cases per coding mission. This notebook supplies the first sample; input prompts here are interactive.')]
    for q in questions:
        cells.append(dict(cell_type='markdown',metadata={},source=q['prompt']))
        if q['kind'] == 'code':
            setup = q['setup']
            for name, content in q['sampleFiles'].items():
                setup += f'\n# Practice fixture supplied by ZHUDDLE\nwith open({name!r}, "w") as fixture:\n    fixture.write({content!r})\n'
            if setup:
                cells.append(dict(cell_type='code',metadata={},source=setup,execution_count=None,outputs=[]))
            cells.append(dict(cell_type='code',metadata={},source=q['starter'],execution_count=None,outputs=[]))
        else:
            cells.append(dict(cell_type='code',metadata={},source=f'{q["id"].lower()} = ""  # A, B, C, or D',execution_count=None,outputs=[]))
    for i, cell in enumerate(cells): cell['id'] = f'{slug}-{i:03}'
    write(f'public/ZHUDDLE_{title}_Quest.ipynb',dict(nbformat=4,nbformat_minor=5,metadata=dict(kernelspec=dict(display_name='Python 3',language='python',name='python3')),cells=cells))

write('src/data/chapters.json', chapters)
write('public/chapter-checks.json', checks)
write('tests/solutions.json', solutions)
print(f'Built {len(chapters)} chapters, {sum(len(q) for q in banks.values())} questions and 240 coding checks.')
