# ZHUDDLE

A static Astro + React Python learning app for ZHUDDLE.COM. Seven independent chapters each follow the original Functions pattern: 8 coding missions (80 XP), 10 MCQs (20 XP), and chapter-specific completion documents.

## Chapters and source boundaries

| Chapter | Topic | PY4E source |
| --- | --- | --- |
| 02 | Variables, expressions, and statements | https://www.py4e.com/html3/02-variables |
| 03 | Conditional execution | https://www.py4e.com/html3/03-conditional |
| 04 | Functions (original bank and grader retained) | https://www.py4e.com/html3/04-functions |
| 05 | Loops and iterations | https://www.py4e.com/lessons/loops |
| 06 | Strings | https://www.py4e.com/html3/06-strings |
| 07 | Files | https://www.py4e.com/html3/07-files |
| 08 | Lists | https://www.py4e.com/lessons/lists |

The Loops and Lists lesson pages explicitly link to textbook chapters 5 and 8; their lesson-directory positions (6 and 9) are not textbook chapter numbers. The question banks use those linked readings. Every new question includes its source section and reading URL. Wording, practice fixtures, and answer checks are ZHUDDLE adaptations of concepts and exercises in the specified chapter, not copies of login-only PY4E quizzes. Variables does not require functions, branching, or loops. Loop/list exercises use only patterns covered by their linked readings. The source pages were reviewed on October 4, 2026.

`src/data/curriculum.js` is the chapter registry. `scripts/build-curriculum.py` generates the six new banks in `src/data/chapters.json`, browser grading cases in `public/chapter-checks.json`, offline notebooks, and reference solutions in `tests/solutions.json`. Run `pnpm curriculum:build` after editing the curriculum. Reference solutions are test files and are not included in the static deployment. The original Functions questions and grader remain intact.

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
- Each chapter has a separate `zhuddle-<chapter-id>-v1` storage key containing code, choices, checks, attempts, reflection, and active question. The original `zhuddle-functions-v1` key is read directly, preserving existing progress. The shared student profile and selected chapter have separate keys. Switching chapters restores its answers and score and terminates any active Python worker. Starting a new student explicitly clears all seven chapters after the existing confirmation dialog.
- The compact chapter dropdown sits above the sidebar lesson list and overlays it without moving the page. It supports arrow keys, Home/End, typeahead, Enter/Space, Escape, Tab, and outside-click dismissal. The current chapter is highlighted and checked. The menu scrolls within the viewport and is available inside the existing mobile course drawer. Selecting a chapter opens its first lesson while preserving all saved answers, XP, attempts, completion, and reflection. Reloading restores the current lesson. Searches, challenges, badges, source links, and achievement screens follow the selected chapter. Chapter 02: Variables is the initial default; subsequent visits restore the last selection, and explicit chapter links open the requested chapter.
- New coding missions have five independent checks with fresh variables, simulated `input()` values, and isolated temporary files. The instructions show the first sample's supplied variables/files. Every retry resets fixtures, including overwritten files. Output shown is from the first sample; each check reports its own failure. The Python execution and output budgets limit accidental runaway programs.
- Editing an answer invalidates its previous score until it is checked again. Retries replace the score, without penalties or double counting.
- Each code mission has five checks worth 2 points each. MCQs earn 2 or 0. Badges match the notebook. Practice letter grades are A >=90, B >=80, C >=70, D >=60, otherwise F.
- Completing a check for all 18 answers unlocks a completion certificate at the student's earned score; 100 points is not required for completion. A failed answer can be revised and checked again.
- Each chapter's finish screen downloads its own completion certificate PDF, detailed grade report PDF, and IPython notebook. Chapter number and topic appear in PDF content, metadata, and filenames, so documents from different chapters cannot overwrite each other. Reports remain available while learning; certificates unlock only after all 18 answers in that chapter have been checked. Unchecked edits are included in the notebook, clearly marked ungraded. Exported notebooks include the supplied variables and sample file fixtures needed to run the new missions offline.
- Reported marks are transparent local practice checks pending instructor review. This is not tamper-resistant exam software and certificates are not official UNT credentials.
- The UI includes small flame animations, reduced-motion support, a motion toggle, responsive mobile navigation, keyboard focus states, and native modal focus management.

## Hosting

Publish only `dist/`, not node_modules, instructor scratch files, or a student's exported work. Site hosting needs no Python server, API key, or environment secret.

For Netlify: upload the deploy ZIP or use the build command `pnpm build` and publish directory `dist`. Add zhuddle.com as a custom domain and apply the exact external DNS instructions provided by Netlify in Spaceship. Keep unrelated DNS records intact.

Keep **Project configuration → General → Powered by Netlify badge → Show the badge on this project** switched off in Netlify. This is a per-project hosting setting, not a source-code option; it removes the injected badge for all visitors and persists across deploys.

The site includes a heart icon and “Support ZHUDDLE” link to `https://www.buymeacoffee.com/hanr`. It floats at the bottom right on desktop and mobile, with phone safe-area spacing and extra space at the end of the page so the final content can scroll clear of the button. The static link works without JavaScript and opens the support page in a new tab; no third-party widget script or stream-alert credentials are needed.

For Vercel: import this project, select Astro, and use the included configuration. Add zhuddle.com in the project's Domains panel and use its displayed DNS values.

Source: Charles R. Severance, [Python for Everybody](https://www.py4e.com/book), CC BY 4.0; chapter links are listed above. Original question wording, supplied scaffolding, scoring, and UI were added for ZHUDDLE.

## Illustrated dashboard

The dashboard uses the supplied ZHUDDLE artwork in an emerald/mint design based on the reference: course path, learner welcome, Python workspace, goals, badges, challenge scene, knowledge checks, and the achievements/download view. Explore and lesson search link to real learning content. Progress indicators are derived from saved answers; there are no simulated streaks or XP rewards.

### Motion and assets

- `public/assets/zhuddle/` contains 20 animated SVGs and 21 still variants, covering all 18 main illustrations and the three reusable challenge layers.
- Production SVGs embed compressed WebP versions of the supplied PNGs. Sprite coordinates, frame timing, transparency, and original motion CSS are preserved. The full SVG library is 5.56 MB, reduced from 65.63 MB (91.5%). The compact welcome banner uses new generated artwork; its prompt and asset details are in `design/coding-garden-prompt.md`.
- The welcome and adventure videos use compressed MP4s and play only after page load, while visible, with motion enabled. Reduced-motion and data-saving connections use posters. Other artwork animates on hover/focus or for a short event; reward artwork is mounted when a check earns points. Offscreen and background-tab artwork switches to still variants.
- The motion toggle persists locally. The app also observes the system reduced-motion preference, swapping embedded SVGs to actual still files instead of attempting to pause an image with parent CSS.
- Rebuild the production images with `python scripts/optimize-assets.py PATH_TO_GENERATED_ASSETS` (requires Pillow). The original source pack is kept separately; it is not needed to build or deploy the site.
- The loop/list badge artwork illustrates the existing Function Explorer/Builder score milestones; it does not claim completion of additional chapters. Badge thresholds remain 0, 50, 75, and 100 XP.

### Browser verification

```sh
pnpm exec playwright install chromium
pnpm test
pnpm test:grader
```

Tests cover real Pyodide execution, retry scoring, edit invalidation and persistence, quiz grading, notebook/PDF downloads, certificate locking, starter reset, search, mobile focus/escape behavior, viewport overflow at seven widths, production asset URLs, and motion preferences. The Python test needs internet access to load Pyodide. Test identities and downloads remain in temporary browser contexts.

The chapter suite additionally runs all 48 new reference solutions through the real browser worker, checks all 240 grading cases locally, rejects representative incorrect solutions, verifies file resets, preserves legacy Functions progress, checks independent chapter completion and reset behavior, and downloads all 14 distinct chapter PDFs plus seven student notebooks. Browser tests save test-only PDF and screenshot artifacts under the ignored `test-results/` directory. The local Python grader suite does not need internet access.

## Performance and search visibility

The dashboard renders its initial lesson in static HTML; hydration restores the student's local chapter and progress. CodeMirror still loads separately, Python only downloads on Run, and PDFs only load on export. Lesson Markdown is memoized so editing an answer does not reparse the prompt. DM Sans and Manrope are self-hosted variable WOFF2 fonts; there is no Google Fonts request chain.

`scripts/optimize-page-media.py` generates versioned WebP posters and support artwork plus smaller H.264 videos from the original public media. It needs Pillow and imageio-ffmpeg only when rebuilding assets. Generated media is committed, so normal deployments do not need Python or FFmpeg. Preserve the filenames' versions when changing cached media. Hashed Astro bundles use immutable caching; other assets use a one-day cache. `public/_headers` also applies Netlify headers to drag-and-drop deployments.

The homepage links to seven static `/learn/python-<topic>/` chapter guides, each with a worked example, a mission outline, source attribution, a notebook, and a link into the matching interactive chapter. Guide content is maintained in `src/data/chapter-guides.js`. Each page has a distinct title, description, canonical URL, social metadata, and WebSite/WebPage JSON-LD. `/robots.txt` and `/sitemap.xml` are generated from the configured Astro site and curriculum. Query-string chapter selections canonicalize to `/`.

After publishing, verify ownership of `https://zhuddle.com/` in Google Search Console, submit `https://zhuddle.com/sitemap.xml`, and inspect the homepage and chapter guides to request indexing. Review impressions and clicks for beginner Python searches over subsequent weeks. Do not add fabricated ratings or promises of first-place rankings. See [Google's SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) and [JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

Run the crawler/no-JavaScript/media regression suite with `pnpm exec playwright test tests/seo-performance.spec.js`. To run browser tests against the production build, first use `pnpm build` and `pnpm preview --port 4322`, then set `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4322` before `pnpm test`. See `design/performance-seo-report.md` for the measured comparison and remaining deployment steps.
