import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { dailySnapshots, syncVisits } from '../workers/visitor-count/index.mjs';

test('daily snapshots fill zero days and reject corrupt analytics', () => {
  const rows = [{ dimensions: { date: '2026-10-23' }, sum: { visits: 8 } }];
  assert.deepEqual(dailySnapshots(rows, '2026-10-22T00:00:00Z', '2026-10-24T00:00:00Z'), [
    { day: '2026-10-22', visits: 0 }, { day: '2026-10-23', visits: 8 },
  ]);
  assert.throws(() => dailySnapshots([{ dimensions: { date: '2026-10-23' }, sum: { visits: -1 } }], '2026-10-23', '2026-10-24'));
});
test('upstream failure never overwrites saved totals', async () => {
  let writes = 0;
  const env = { TRACKING_SINCE: '2026-10-23T00:00:00Z', CF_ANALYTICS_TOKEN: 'test',
    DB: { prepare: () => ({ first: async () => null }), batch: async () => { writes++; } } };
  await assert.rejects(syncVisits(env, new Date('2026-10-23T02:00:00Z'), async () => Response.json({ errors: [{ message: 'denied' }] })));
  assert.equal(writes, 0);
});
test('public endpoint is read only and returns no fabricated initial zero', async () => {
  const env = { DB: { prepare: () => ({ first: async () => null }) } };
  assert.equal((await worker.fetch(new Request('https://example.com/visits', { method: 'POST' }), env)).status, 405);
  assert.equal((await worker.fetch(new Request('https://example.com/visits'), env)).status, 503);
});
