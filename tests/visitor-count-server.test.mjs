import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker, { dailySnapshots, syncVisits } from '../workers/visitor-count/index.mjs';

test('persisted snapshots survive repeats and out-of-order concurrent syncs', async () => {
  const sqlite = new DatabaseSync(':memory:');
  try {
    sqlite.exec(readFileSync(new URL('../workers/visitor-count/schema.sql', import.meta.url), 'utf8'));
    sqlite.exec("INSERT INTO daily_visits VALUES ('2026-10-23', 7, '2026-10-24T00:00:00.000Z'); INSERT INTO sync_state VALUES (1, '2026-10-29T01:00:00.000Z')");
    const DB = {
      prepare(sql) {
        let args = [];
        return {
          bind(...values) { args = values; return this; },
          async first() { return sqlite.prepare(sql).get(...args); },
          run() { return sqlite.prepare(sql).run(...args); },
        };
      },
      async batch(statements) {
        sqlite.exec('BEGIN');
        try { statements.forEach(statement => statement.run()); sqlite.exec('COMMIT'); }
        catch (error) { sqlite.exec('ROLLBACK'); throw error; }
      },
    };
    const env = { DB, TRACKING_SINCE: '2026-10-23T00:00:00Z', CF_ANALYTICS_TOKEN: 'test', ACCOUNT_ID: 'account', SITE_TAG: 'site' };
    const response = visits => Response.json({ data: { viewer: { accounts: [{ rumPageloadEventsAdaptiveGroups: [
      { dimensions: { date: '2026-10-29' }, sum: { visits } },
    ] }] } } });
    let release;
    const pending = new Promise(resolve => { release = resolve; });
    const older = syncVisits(env, new Date('2026-10-29T02:00:00Z'), async () => { await pending; return response(8); });
    await syncVisits(env, new Date('2026-10-29T03:00:00Z'), async () => response(10));
    release();
    await older;
    await syncVisits(env, new Date('2026-10-29T03:00:00Z'), async () => response(10));
    const result = await worker.fetch(new Request('https://example.com/visits'), env);
    assert.deepEqual(await result.json(), { total: 23144, since: env.TRACKING_SINCE, updatedAt: '2026-10-29T03:00:00.000Z' });
    assert.equal(sqlite.prepare("SELECT visits FROM daily_visits WHERE day = '2026-10-23'").get().visits, 7);
  } finally { sqlite.close(); }
});

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
