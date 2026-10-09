import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleAssistant } from '../server/assistant.mjs';

const make = (body, headers = {}) => new Request('https://zhuddle.com/api/assistant', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
const review = { mode: 'review', chapterId: 'variables', questionId: 'C01', code: 'x = 1\nprint(y)', error: 'NameError', checks: [{ label: 'check', passed: false }] };
const env = { GROQ_API_KEY: 'test-server-secret' };
const upstream = answer => async () => Response.json({ choices: [{ message: { content: JSON.stringify(answer) } }] });
test('rejects foreign origins, wrong content types and oversized/invalid missions before calling Groq', async () => {
  let calls = 0;
  const options = { env, fetchImpl: async () => { calls++; throw new Error('unexpected'); } };
  assert.equal((await handleAssistant(make(review, { origin: 'https://attacker.test' }), options)).status, 403);
  assert.equal((await handleAssistant(make(review, { 'content-type': 'text/plain' }), options)).status, 415);
  assert.equal((await handleAssistant(make({ ...review, questionId: 'M01' }), options)).status, 400);
  assert.equal((await handleAssistant(make({ ...review, code: 'x'.repeat(33000) }), options)).status, 400);
  assert.equal((await handleAssistant(make(null), options)).status, 400);
  assert.equal(calls, 0);
});
test('keeps credentials and profile fields out of model context and normalizes line numbers', async () => {
  let payload;
  const response = await handleAssistant(make({ ...review, student: { name: 'private-name', untId: 'private-id' } }), { env, clientIp: 'review', fetchImpl: async (url, request) => {
    assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
    assert.equal(request.headers.Authorization, 'Bearer test-server-secret');
    payload = request.body;
    return upstream({ summary: 'Check the name.', diagnostics: [{ line: 2, message: 'Define y first.' }, { line: 999, message: 'bad' }, { line: 0, message: 'bad' }, { line: '1', message: 'bad' }] })();
  } });
  const result = await response.json();
  assert.deepEqual(result.diagnostics, [{ line: 2, message: 'Define y first.' }]);
  assert.equal(result.provider, 'groq');
  assert.ok(!payload.includes('private-name') && !payload.includes('private-id') && !payload.includes(env.GROQ_API_KEY));
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('allowlists navigation actions and rejects unusable provider output', async () => {
  const response = await handleAssistant(make({ mode: 'guide', message: 'Help' }), { env, clientIp: 'guide', fetchImpl: upstream({ message: 'Welcome', action: 'https://evil.test' }) });
  assert.equal((await response.json()).action, 'none');
  assert.equal((await handleAssistant(make(review), { env, clientIp: 'bad', fetchImpl: upstream({ summary: null }) })).status, 503);
});
test('handles missing configuration, quotas, provider failures and timeouts without exposing secrets', async () => {
  assert.equal((await handleAssistant(make(review), { env: {} })).status, 503);
  const limited = await handleAssistant(make(review), { env, clientIp: 'limited', fetchImpl: async () => new Response('private-provider-error', { status: 429 }) });
  assert.equal(limited.status, 429);
  assert.ok(!(await limited.text()).includes('private-provider-error'));
  const failed = await handleAssistant(make(review), { env, clientIp: 'timeout', fetchImpl: async () => { throw new Error(env.GROQ_API_KEY); } });
  assert.equal(failed.status, 503);
  assert.ok(!(await failed.text()).includes(env.GROQ_API_KEY));
});
test('bounds repeated requests before provider work', async () => {
  let calls = 0;
  const options = { env, clientIp: 'rate-test', fetchImpl: async () => { calls++; return upstream({ summary: 'Try again', diagnostics: [] })(); } };
  for (let i = 0; i < 8; i++) assert.equal((await handleAssistant(make(review), options)).status, 200);
  assert.equal((await handleAssistant(make(review), options)).status, 429);
  assert.equal(calls, 8);
});
