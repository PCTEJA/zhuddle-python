const DAY = 86400000;
// Previous counter total supplied by the site owner, before continuous tracking.
// Add at read time so analytics refreshes and repeated deploys cannot duplicate it.
const HISTORICAL_VISITS = 23127;
const QUERY = `query Visits($account: string!, $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!) {
  viewer { accounts(filter: {accountTag: $account}) {
    rumPageloadEventsAdaptiveGroups(limit: 32, filter: $filter) { dimensions {date} sum {visits} }
  } }
}`;

// Upsert daily snapshots, never add overlapping query totals to the running count.
export function dailySnapshots(rows, start, end) {
  const days = new Map();
  for (let time = Date.parse(start); time < Date.parse(end); time += DAY) {
    days.set(new Date(time).toISOString().slice(0, 10), 0);
  }
  for (const row of rows) {
    const day = row?.dimensions?.date;
    const visits = row?.sum?.visits;
    if (!days.has(day) || !Number.isSafeInteger(visits) || visits < 0) throw new Error('Invalid analytics response');
    days.set(day, visits);
  }
  return [...days].map(([day, visits]) => ({ day, visits }));
}

export async function syncVisits(env, now = new Date(), fetcher = fetch) {
  if (!env.CF_ANALYTICS_TOKEN) throw new Error('Missing analytics credential');
  const state = await env.DB.prepare('SELECT through_time FROM sync_state WHERE id = 1').first();
  const since = Date.parse(env.TRACKING_SINCE);
  // Refresh the last 3 days to capture delayed beacons, and catch up after outages.
  const previous = state ? Date.parse(state.through_time) : since;
  const startMs = Math.max(since, Math.floor((previous - 3 * DAY) / DAY) * DAY);
  // Refuse to silently skip history that has fallen out of the reporting window.
  if (now.getTime() - startMs > 30 * DAY) throw new Error('Analytics history requires recovery');
  const end = now.toISOString();
  const start = new Date(startMs).toISOString();
  const response = await fetcher('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { account: env.ACCOUNT_ID, filter: {
      siteTag: env.SITE_TAG, requestHost_in: ['zhuddle.com', 'www.zhuddle.com'],
      datetime_geq: start, datetime_lt: end, bot: 0,
    } } }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('Analytics upstream unavailable');
  const body = await response.json();
  const rows = body.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups;
  if (body.errors?.length || !Array.isArray(rows)) throw new Error('Analytics query failed');
  const snapshots = dailySnapshots(rows, start, end);
  await env.DB.batch([
    ...snapshots.map(({ day, visits }) => env.DB.prepare(`INSERT INTO daily_visits(day, visits, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(day) DO UPDATE SET visits=excluded.visits, updated_at=excluded.updated_at
      WHERE excluded.updated_at > daily_visits.updated_at`).bind(day, visits, end)),
    env.DB.prepare(`INSERT INTO sync_state(id, through_time) VALUES (1, ?)
      ON CONFLICT(id) DO UPDATE SET through_time=excluded.through_time
      WHERE excluded.through_time > sync_state.through_time`).bind(end),
  ]);
}

export default {
  async scheduled(_controller, env) { await syncVisits(env); },
  async fetch(request, env) {
    const headers = { 'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff' };
    if (new URL(request.url).pathname !== '/visits') return new Response('Not found', { status: 404 });
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    try {
      const state = await env.DB.prepare('SELECT through_time FROM sync_state WHERE id = 1').first();
      if (!state) return Response.json({ error: 'Count not ready' }, { status: 503, headers: { ...headers, 'Cache-Control': 'no-store' } });
      const row = await env.DB.prepare('SELECT COALESCE(SUM(visits), 0) AS total FROM daily_visits').first();
      const payload = { total: HISTORICAL_VISITS + row.total, since: env.TRACKING_SINCE, updatedAt: state.through_time };
      return new Response(request.method === 'HEAD' ? null : JSON.stringify(payload), { headers: {
        ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300',
      } });
    } catch {
      return Response.json({ error: 'Count temporarily unavailable' }, { status: 503, headers: { ...headers, 'Cache-Control': 'no-store' } });
    }
  },
};
