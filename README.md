# ZHUDDLE

A static Astro + React Python learning app for ZHUDDLE.COM. It uses the same chapter-specific curriculum and Python checks as the companion notebook: 8 coding missions (80 XP) and 10 MCQs (20 XP).

## Run and build

Node 22.12+ is required. Use pnpm as the primary package manager; the committed pnpm lockfile pins dependencies.

```sh
pnpm install
pnpm dev
pnpm build
pnpm preview
```

The same scripts work through npm:

```sh
npm install
npm run dev
npm run build
npm run preview
```

Use one installer consistently in a checkout. The shipped lockfile is for pnpm; npm can generate its own package-lock.json when selected. `dist/` is the complete deployable static website. Both Netlify (`netlify.toml`) and Vercel (`vercel.json`) deployment configurations are included.

## Learning and downloads

- Real Python executes in a dedicated Pyodide web worker. Loading Python is deferred until the first code run. The interpreter is fetched from jsDelivr, so the first run needs internet access.
- CodeMirror provides Python highlighting and indentation. Editor and PDF libraries are separate chunks; neither blocks the initial static page shell.
- Students enter a name and UNT ID. Progress is stored only in localStorage on their device; no student records are sent to a database or instructor dashboard.
- Editing an answer invalidates its previous score until it is checked again. Retries replace the score, without penalties or double counting.
- Each code mission has five checks worth 2 points each. MCQs earn 2 or 0. Badges match the notebook. Practice letter grades are A >=90, B >=80, C >=70, D >=60, otherwise F.
- Completing a check for all 18 answers unlocks a completion certificate at the student's earned score; 100 points is not required for completion. A failed answer can be revised and checked again.
- The finish screen downloads a completion certificate PDF, detailed grade report PDF, and an IPython notebook containing all current answers. Unchecked edits are included in the notebook, clearly marked ungraded.
- Reported marks are transparent local practice checks pending instructor review. This is not tamper-resistant exam software and certificates are not official UNT credentials.
- The UI includes small flame animations, reduced-motion support, a motion toggle, responsive mobile navigation, keyboard focus states, and native modal focus management.

## Hosting

Publish only `dist/`, not node_modules, instructor scratch files, or a student's exported work. Site hosting needs no Python server, API key, or environment secret.

For Netlify: upload the deploy ZIP or use the build command `pnpm build` and publish directory `dist`. Add zhuddle.com as a custom domain and apply the exact external DNS instructions provided by Netlify in Spaceship. Keep unrelated DNS records intact.

For Vercel: import this project, select Astro, and use the included configuration. Add zhuddle.com in the project's Domains panel and use its displayed DNS values.

Source: Charles R. Severance, [Python for Everybody: Functions](https://www.py4e.com/html3/04-functions), [CC BY 4.0](https://www.py4e.com/book). Original question wording, supplied scaffolding, scoring, and UI were added for ZHUDDLE.
