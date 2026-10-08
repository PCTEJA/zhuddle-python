export const guides = {
  variables: {
    summary: 'Build your first Python programs with values, variables, expressions, and type conversions.',
    explanation: 'A variable gives a value a name so you can use it again. Python distinguishes whole numbers, decimal numbers, and text. Practice choosing clear names, calculating with operators, and converting input before using it in arithmetic.',
    example: 'minutes = 90\nhours = minutes / 60\nprint(hours)  # 1.5',
    takeaway: 'Division with / produces a decimal result. Changing minutes changes the result without changing the calculation.',
  },
  conditionals: {
    summary: 'Make decisions in Python with comparisons, if statements, elif, else, and exception handling.',
    explanation: 'Conditional statements choose which code runs. Start with a comparison that produces True or False, then indent the statements belonging to each branch. The exercises help you distinguish separate conditions from mutually exclusive branches and handle invalid input.',
    example: 'temperature = 18\nif temperature < 20:\n    print("Bring a jacket")\nelse:\n    print("Enjoy the sunshine")',
    takeaway: 'Only one branch runs here. Try a temperature of 24 and predict the output before running it.',
  },
  functions: {
    summary: 'Practice built-in functions, define your own functions, and use parameters and return values.',
    explanation: 'A function packages a useful operation behind a name. Calling a function executes it; defining one prepares it for later. Work through built-in tools, random numbers, parameters, and the difference between printing a value and returning it to the caller.',
    example: 'def double(number):\n    return number * 2\n\nresult = double(6)\nprint(result)  # 12',
    takeaway: 'The parameter number receives 6. The return statement sends 12 back to the calling code, where it can be saved or used again.',
  },
  loops: {
    summary: 'Repeat work with for and while loops, counters, running totals, and loop control.',
    explanation: 'Loops let a program repeat a small set of instructions. A for loop visits each item in a sequence, while a while loop continues as long as its condition is true. Practice updating counters and accumulators and deciding when a loop should stop.',
    example: 'total = 0\nfor number in [2, 4, 6]:\n    total = total + number\nprint(total)  # 12',
    takeaway: 'Initialize the total before the loop so each iteration adds to the result of the previous one.',
  },
  strings: {
    summary: 'Explore Python text with indexing, slicing, traversal, searching, and string methods.',
    explanation: 'A string is a sequence of characters. Indexes start at zero, and slices select part of the text. Strings are immutable: methods such as lower() produce a new string. Use these ideas to inspect and transform text in small, testable steps.',
    example: 'word = "Python"\nprint(word[0])    # P\nprint(word[1:4])  # yth\nprint(word.lower())  # python',
    takeaway: 'A slice includes its starting position and stops before its ending position. The original word remains unchanged.',
  },
  files: {
    summary: 'Read and process text files in Python, search lines, and work with practice file fixtures.',
    explanation: 'Text files let programs work with information beyond a single input. Learn to open files, iterate over lines, remove unwanted whitespace, and filter relevant records. ZHUDDLE supplies sample files inside its Python worker for these exercises, so you can practice without uploading your own files.',
    example: 'with open("notes.txt", "w") as handle:\n    handle.write("Practice Python\\n")\n\nwith open("notes.txt") as handle:\n    for line in handle:\n        print(line.strip())',
    takeaway: 'The first block creates a small practice file. The second reads it. Using with closes the file when the block finishes.',
  },
  lists: {
    summary: 'Store and transform collections using Python lists, indexes, methods, and iteration.',
    explanation: 'Lists hold multiple values in order and can be changed after they are created. Practice accessing elements, appending values, traversing a list, and connecting lists with strings. Pay attention to whether a method changes the original list or returns a new value.',
    example: 'scores = [7, 9, 8]\nscores.append(10)\nprint(len(scores))  # 4\nprint(sum(scores))  # 34',
    takeaway: 'append() changes scores in place. len() counts the items and sum() adds their numeric values.',
  },
};
export const guidePath = id => `/learn/python-${id}/`;
