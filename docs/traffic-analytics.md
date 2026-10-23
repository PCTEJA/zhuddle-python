# Free traffic and attack reporting

ZHUDDLE supports Cloudflare Web Analytics on the homepage and all seven chapter guides. The dashboard lives in your Cloudflare account, not on a public app page. Tracking starts after configuration and deployment; it cannot recover past visits.

## Enable visit reporting

1. Sign in to https://dash.cloudflare.com/ and open **Web Analytics**.
2. Choose **Add a site**, enter `zhuddle.com`, and open **Manage site**.
3. Copy only the `token` value from the JavaScript snippet. This is a public site identifier, not a Cloudflare API key.
4. In Vercel, open the `zhuddle-python` project, then **Settings > Environment Variables**. Add `PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` with that value for **Production** only. Netlify deployments can use the same build environment variable.
5. Redeploy. Astro embeds the token at build time; changing an environment variable without rebuilding does not activate tracking.
6. Visit the live site, navigate to a chapter guide, and wait a few minutes. Open **Cloudflare > Web Analytics > zhuddle.com** to inspect visits, page views, referrers, countries, devices, browsers, and performance.

No DNS or hosting migration is needed for Web Analytics. If you later enable Cloudflare automatic beacon injection, remove this environment variable and rebuild, or select manual JS snippet installation in Cloudflare. Use one installation method to avoid duplicate tracking.

The integration is disabled during development and when the token is absent. Keep the variable out of preview environments to avoid counting preview visits. A malformed nonempty production token fails the build with an actionable error. The deferred script does not block the learning interface.

Cloudflare counts visits and page views; these are not an exact count of distinct people. Browser blocking and disabled JavaScript can reduce counts. This integration does not send learner names, UNT IDs, answers, or custom learning events. Do not put personal information in page URLs. Chapter changes inside the React workspace are not custom lesson-completion events.

## View attacks and blocked requests

The browser analytics snippet cannot detect all attacks, API abuse, or bots that do not run JavaScript. Cloudflare security reporting is separate and requires requests to pass through Cloudflare's proxy.

For that setup, add `zhuddle.com` to a Cloudflare Free plan, review and preserve all existing DNS records (including mail records), follow its nameserver onboarding, and proxy the web records to the existing host. Verify HTTPS and `/api/assistant` after activation. This code change does not change DNS or activate a firewall.

Then open your domain in Cloudflare and go to **Security > Analytics** / **Security Events** for mitigated requests and available sampled logs. Free-plan reports are limited and sampled: they are not a complete attack log. Requests sent directly to the Vercel fallback hostname bypass the Cloudflare domain proxy, so review those in the hosting provider's security tools too. Web visits and edge request counts measure different things and will differ.

## Verify and troubleshoot

- In production page source, look for exactly one `static.cloudflareinsights.com/beacon.min.js` script with your site's token.
- In browser developer tools, check that the beacon loads and sends requests. Browser blockers may suppress it.
- If no script is present, check the Production build variable and redeploy. If a Content Security Policy is added later, allow the beacon script and its collection endpoint according to Cloudflare's current documentation.
- If the beacon loads but the dashboard stays empty, check the hostname and token in Manage site and allow a few minutes for ingestion.

Official references:

- [Free, privacy-first Web Analytics](https://developers.cloudflare.com/web-analytics/about/)
- [Setup and manual versus automatic installation](https://developers.cloudflare.com/web-analytics/get-started/)
- [Available metrics](https://developers.cloudflare.com/web-analytics/data-metrics/)
- [Security Events and plan limitations](https://developers.cloudflare.com/waf/analytics/security-events/)
