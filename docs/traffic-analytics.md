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

For the current Vercel deployment, use the existing Vercel Firewall alongside Cloudflare Web Analytics:

- [Visitor dashboard](https://dash.cloudflare.com/d04fe4763d53950f2656f61bd11ad98b/web-analytics/overview?siteTag~in=d12b2b9e0ab0495bb803b1e6074d5bcb&excludeBots=Yes): visits, page views, referrers, and visitor breakdowns.
- [Security dashboard](https://vercel.com/teja-piepur-chakravarthis-projects/zhuddle-python/firewall): allowed, denied, and challenged requests, DDoS mitigation activity, and active alerts.
- [Request traffic](https://vercel.com/teja-piepur-chakravarthis-projects/zhuddle-python/firewall/traffic): inspect traffic using the filters available on the current plan.

The Hobby project already has an active firewall and system mitigations. These reports do not require a DNS migration or another analytics script. Some historical views and advanced features require a paid plan; the dashboard indicates those restrictions. Denied or challenged requests are security actions, not proof that every request was an attack. Web visits and HTTP request counts measure different things and will differ.

The browser analytics snippet cannot detect all attacks, API abuse, or bots that do not run JavaScript. Cloudflare security reporting is separate and requires requests to pass through Cloudflare's proxy. The Cloudflare domain onboarding has not been completed; use Vercel for security reporting in the current setup.

Vercel recommends connecting directly where possible. Adding an external proxy introduces security visibility, caching, and certificate-validation tradeoffs. Do not enable the Cloudflare proxy solely to obtain reports that Vercel already provides. If a future migration requires it, review the current Verified Proxy requirements, preserve DNS and mail records, and validate HTTPS and `/api/assistant` before switching traffic.

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
- [Vercel Firewall](https://vercel.com/docs/vercel-firewall)
- [Using Cloudflare and other reverse proxies with Vercel](https://vercel.com/kb/guide/can-i-use-a-proxy-on-top-of-my-vercel-deployment)
