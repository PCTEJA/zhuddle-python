# ZHUDDLE performance and SEO update

Prepared October 7, 2026. Target site: https://zhuddle.com/. Target query supplied by the owner: “best begginer python learning platform”. Content uses natural “beginner Python” wording.

## Verified production findings

- The live homepage returned HTTP 200 but its app HTML was only an “Opening your chapters…” placeholder. Lessons depended on JavaScript rendering.
- `/robots.txt` and `/sitemap.xml` both returned 404.
- The homepage lacked a canonical link, social metadata, and structured site-name data.
- The www hostname already redirected to https://zhuddle.com/; no domain redirect change was needed.
- The welcome poster was 1,880,249 bytes; its video was 8,753,576 bytes. The adventure video was 4,704,623 bytes; the support GIF was 1,728,644 bytes.

## Local production-build comparison

One cold Chromium run per build, mobile viewport 390 × 844, cache disabled, 40 ms network latency, 10 Mbps download, 4× CPU slowdown. Captured 12 seconds after the code editor appeared. These are local lab observations, not Google field data or a guaranteed visitor experience. Network totals include only requests completed during the observation period, not all assets in the deployment directory.

| Measurement | Before | After initial optimization |
| --- | ---: | ---: |
| First contentful paint | 3.58 s | 0.54 s |
| Largest contentful paint | 6.52 s | 0.96 s |
| Completed network transfer | 10.03 MB | 1.91 MB |
| Cumulative layout shift | 0.0002 | 0.0137 |
| Browser page errors | 0 | 0 |

The later removal of the animated loading illustration and memoization of lesson Markdown further reduce unnecessary work; the table above does not attribute an unmeasured benefit to them. INP requires interaction measurements/field data and was not measured here. Raw snapshots and screenshots are stored in ignored `.qa/performance-before.*` and `.qa/performance-after.*` files.

| Optimized asset | Bytes |
| --- | ---: |
| Welcome WebP poster | 56,410 |
| Welcome MP4 | 54,662 |
| Adventure MP4 | 120,005 |
| Animated support WebP | 118,168 |

Videos preserve the existing animation but wait for page load and visibility. They stop when offscreen, the tab is hidden, or motion is disabled. Reduced-motion/data-saving connections receive still posters. Fonts are served locally and cached with versioned build assets.

## Search content and verification

Eight indexable pages now include static content, descriptive titles, canonical links, Open Graph/Twitter metadata, and WebSite/WebPage JSON-LD. Seven guides cover variables, conditionals, functions, loops, strings, files, and lists with examples and links into the correct chapter. The generated sitemap and robots file expose their canonical URLs without indexing student data or query-string variants.

Validation: production build; all 11 pre-existing Playwright tests; 10 local Python grader tests; 7 new Playwright tests covering no-JavaScript content, guide layout, crawl endpoints, canonical URLs, chapter deep links, unavailable storage, reduced motion, video visibility, and media budgets. Existing tests exercise real Python grading, chapter progress preservation, mobile navigation, and PDF/notebook downloads.

## Publishing and Google follow-up

The source and `dist/` build contain these changes. They must be published before Google or visitors can receive them. This report does not claim a deployment or Search Console submission.

1. Publish the website's `dist/` directory through the existing Netlify deployment workflow.
2. Confirm `/robots.txt`, `/sitemap.xml`, and all seven guide URLs return HTTP 200 on zhuddle.com; check the canonical host and response cache headers.
3. In the owner's verified Google Search Console property, submit `https://zhuddle.com/sitemap.xml`. Use URL Inspection on the homepage and a chapter guide, then request indexing.
4. Monitor indexing, query impressions, clicks, and field Core Web Vitals. Ranking for a broad competitive query depends on content relevance and other signals; technical improvements do not guarantee first position.

Sources: [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [Google site names](https://developers.google.com/search/docs/appearance/site-names), [web.dev LCP optimization](https://web.dev/articles/optimize-lcp).
