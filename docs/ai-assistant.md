# Zhuddle AI help

Code Coach automatically reviews a failed coding check, explains up to three relevant lines, and lets the learner jump to each line. It never edits their answer or assigns XP. Python's existing checks remain authoritative. Editing, rerunning, changing missions, or disabling AI clears old feedback and cancels the browser request. Successful answers do not request a review.

Zhuddle Guide provides platform Q&A, four quick questions, and a five-stop walkthrough. “Show me” buttons use a fixed list of platform destinations. Generated text is rendered as text, never HTML or executable commands. A small original SVG, `public/assets/zhuddle/guide-spark.svg`, matches the green, cream, and gold palette.

## Connect Groq

1. In [Groq API Keys](https://console.groq.com/keys), create a key for Zhuddle. Keep the account on the Free plan; this integration does not enable billing or change the plan.
2. Copy `.env.example` to `.env` locally and set `GROQ_API_KEY`. Keep it server-only: no `PUBLIC_` or `VITE_` prefix. `.env` is ignored by Git.
3. Run `pnpm dev`. Astro's development middleware serves `/api/assistant` locally. Restart after changing `.env`.
4. On Netlify, mark the variable **Contains secret values** and set its **Production** context. Choose **Functions** scope when your plan supports scope selection; otherwise Netlify includes Builds, Functions, and Runtime. Leave preview and branch values empty for public-repository contributions. Deploy the project (build `pnpm build`, publish `dist`, functions `netlify/functions`). On Vercel, set it in the server environment and deploy; `api/assistant.mjs` provides the same endpoint. Both need Node 22.12+.
5. Check a deliberately incorrect answer and confirm the badge reads **AI · GROQ**. Ask the guide a platform question. Missing configuration must show **built-in help** instead.

The default model is `openai/gpt-oss-20b`, configurable through `GROQ_MODEL`. [Groq's free limits](https://console.groq.com/docs/rate-limits) apply to the account and model; this is not unlimited free capacity. The UI falls back to Python diagnostics and the maintained platform guide if credentials are missing, the network fails, or the quota is exhausted. No fallback provider or paid upgrade is used.

## Data and request boundaries

- Code review sends only the selected mission ID, source code, Python error location/message, and five check labels/results. The server supplies the mission's task from the curriculum. Profile fields, UNT IDs, reflections, other answers, and scores are not included. Personal text typed into code still travels with that code.
- Guide questions send the current chapter ID and the last six conversation messages. Conversation is held in memory, not localStorage. The interface reminds students to keep personal information out of questions and code.
- Groq receives these inputs according to its service policies. Zhuddle's handler does not log or persist prompts, responses, or credentials.
- The endpoint requires JSON, rejects cross-origin browser calls, bounds request sizes and output, allows only code missions, validates AI line numbers, and enforces a timeout. The API key and provider errors are never returned to the browser.
- Netlify's configured edge limiter permits eight requests per IP/domain per minute. A per-instance limiter also caps eight requests per client and 25 total per minute. In-memory limits are not a distributed quota; Vercel deployments with public traffic should additionally configure host firewall rate limits. The provider's free-plan limits are the final account-wide ceiling.
- AI suggestions are advisory and can be wrong. The local interpreter runs code; Groq does not execute it or grade it.

## Validate

`pnpm build`, `pnpm test:assistant`, `pnpm test:grader`, and `pnpm exec playwright test` cover the build, request boundaries, Python error positions, stale responses, navigation, fallback behavior, and mobile layouts. Browser AI tests mock the provider; verify the live badge after configuring a real key. `pnpm preview` serves only static output; use `pnpm dev` or a hosting preview for AI API testing.
