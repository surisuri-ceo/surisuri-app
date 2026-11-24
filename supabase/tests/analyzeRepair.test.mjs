import assert from 'node:assert/strict';
import test from 'node:test';
import { createHandler, createSupabaseAccess } from '../functions/analyze-repair/index.ts';
import { parseDiagnosisRequest, sanitizeJpeg } from '../functions/_shared/diagnosisInput.ts';
import { createOpenAiDiagnosis, MAX_OUTPUT_TOKENS, RESERVATION_MICRO_USD } from '../functions/_shared/openaiDiagnosis.ts';

// Synthetic 16x16 JPEG generated locally. All network-bound functions are injected fakes.
const jpeg = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAQABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD5/ooooA//2Q==', 'base64');
const uid = '11111111-1111-4111-8111-111111111111';
const uid2 = '22222222-2222-4222-8222-222222222222';
const token = 'mock.valid.token';
const requestId = 'mock-diagnosis-0001';
const traceId = '33333333-3333-4333-8333-333333333333';
const decodedFixture = async () => ({ width: 16, height: 16, rgba: new Uint8Array(1024) });
const diagnosis = {
  schemaVersion: '1', status: 'completed',
  observations: [{ imageId: 'photo_1', phenomenon: '연결부 물방울' }],
  customerSymptoms: ['물이 떨어짐'],
  causeCandidates: [{ cause: '연결부 누수 가능성', rationale: '물방울 위치', imageIds: ['photo_1'], uncertainty: 'medium' }],
  trades: [{ code: 'facilities', role: 'primary', rationale: '배관 점검' }],
  repairPlan: [{ stepId: 'inspect', tradeCode: 'facilities', action: '전문가 연결부 확인', dependsOn: [] }],
  safety: { urgency: 'routine', risks: [], precautions: [], requiresProfessional: true },
  questions: [], requestedPhotos: [], uncertainty: { level: 'medium', reasons: ['내부 확인 불가'] },
  parts: [], estimateBasis: [], estimateHoldReasons: ['단가 부재'], holdReasons: [],
};

function submission({ id = requestId, auth = token, count = 3, bytes = jpeg, type = 'image/jpeg',
  description = '물이 떨어져요', extra = {} } = {}) {
  const body = new FormData();
  body.append('input', JSON.stringify({
    requestId: id, pilot: 'leak_plumbing', symptomCodes: ['leak'], description, tradeHint: null, ...extra,
  }));
  for (let index = 1; index <= count; index++) {
    body.append(`photo_${index}`, new Blob([bytes], { type }), 'fixture.jpg');
  }
  return new Request('http://localhost/analyze-repair', { method: 'POST', body,
    headers: auth ? { Authorization: `Bearer ${auth}` } : {} });
}

function mockLedger(initialSpend = 0) {
  const rows = new Map();
  let committed = initialSpend;
  return {
    rows,
    enabled: true,
    get committed() { return committed; },
    async reserve(user, id, hash) {
      const key = `${user}/${id}`;
      const old = rows.get(key);
      if (old) return old.hash === hash ? { decision: old.status, result: old.result } : { decision: 'conflict' };
      const prior = [...rows.values()].filter(row => row.user === user);
      if (prior.some(row => ['processing', 'unknown'].includes(row.status))) return { decision: 'active' };
      if (prior.length >= 5) return { decision: 'user_limit' };
      if (committed + RESERVATION_MICRO_USD > 1_000_000) return { decision: 'budget_limit' };
      committed += RESERVATION_MICRO_USD;
      rows.set(key, { user, hash, status: 'processing' });
      return { decision: 'reserved', traceId };
    },
    async status(user, id) { return rows.get(`${user}/${id}`)?.status ?? null; },
    async finish(user, id, settlement) {
      const row = rows.get(`${user}/${id}`);
      if (!row || !['processing', 'unknown'].includes(row.status)) return false;
      Object.assign(row, settlement);
      if (settlement.status !== 'unknown') committed += settlement.costMicros - RESERVATION_MICRO_USD;
      return true;
    },
  };
}

function setup(overrides = {}, ledger = mockLedger()) {
  let calls = 0;
  const handler = createHandler({
    authenticate: async value => value === token ? uid : value === 'mock.second.user' ? uid2 : null,
    reserve: (...args) => ledger.enabled ? ledger.reserve(...args) : Promise.resolve({ decision: 'disabled' }),
    finish: ledger.finish,
    status: ledger.status,
    decodeJpeg: decodedFixture,
    analyze: async () => { calls++; return settled(diagnosis); },
    ...overrides,
  });
  return { handler, ledger, get calls() { return calls; } };
}

function settled(result) {
  return { diagnosis: result, costMicros: 4_000, inputTokens: 4000, outputTokens: 200 };
}

async function expectResponse(response, status, code) {
  assert.equal(response.status, status);
  const body = await response.json();
  if (code) assert.equal(body.code, code);
  return body;
}

test('successful and deferred analysis, with usage settlement', async () => {
  const { handler, ledger } = setup();
  const response = await expectResponse(await handler(submission()), 200);
  assert.deepEqual(response.diagnosis, {
    ...diagnosis, estimateBasis: [], estimateHoldReasons: ['검증된 단가 기준이 마련되지 않아 견적을 보류합니다.'],
  });
  assert.equal(response.source, 'model');
  assert.equal(ledger.committed, 4000);
  const deferred = { ...diagnosis, status: 'deferred', observations: [], causeCandidates: [], holdReasons: ['흐린 사진'] };
  const next = setup({ analyze: async () => settled(deferred) });
  assert.equal((await expectResponse(await next.handler(submission()), 200)).diagnosis.status, 'deferred');
});

test('missing, forged and expired JWTs never reach the accounting or model interfaces', async () => {
  const tokens = [];
  const access = createSupabaseAccess('http://localhost', 'fake-public', 'fake-server', async (url, init) => {
    assert.equal(url.pathname, '/auth/v1/user');
    assert.equal(init.headers.apikey, 'fake-public');
    tokens.push(init.headers.Authorization);
    return Response.json({}, { status: 401 });
  });
  const mock = setup({ authenticate: access.authenticate, reserve: access.reserve });
  for (const auth of [null, 'fake-public', 'mock.forged.token', 'mock.expired.token']) {
    await expectResponse(await mock.handler(submission({ auth })), 401, 'AUTH_REQUIRED');
  }
  assert.deepEqual(tokens, ['Bearer mock.forged.token', 'Bearer mock.expired.token']);
  assert.equal(mock.calls, 0);
});

test('auth UID is taken from verified user endpoint even when the token has other claims', async () => {
  const seen = [];
  const access = createSupabaseAccess('http://localhost', 'fake-public', 'fake-server', async (url, init) => {
    if (url.pathname === '/auth/v1/user') return Response.json({ id: uid2 });
    seen.push({ path: url.pathname, input: JSON.parse(init.body) });
    assert.equal(init.headers.apikey, 'fake-server');
    return Response.json(url.pathname.endsWith('/reserve_repair_diagnosis') ? { decision: 'reserved', traceId } : true);
  });
  await expectResponse(await setup(access).handler(submission()), 200);
  assert.deepEqual(seen.map(item => item.input.p_uid), [uid2, uid2]);
  await expectResponse(await setup(access).handler(submission({ extra: { uid } })), 422, 'INVALID_INPUT');
});

test('rejects quantity, per-file size, total byte size, bad formats and JPEG truncation', async () => {
  const mock = setup();
  for (const count of [2, 6]) await expectResponse(await mock.handler(submission({ count })), 422, 'INVALID_FIELDS');
  await expectResponse(await mock.handler(submission({ bytes: Buffer.alloc(1_500_001) })), 413, 'PHOTO_TOO_LARGE');
  const padded = Buffer.concat([jpeg.subarray(0, 2),
    ...Array.from({ length: 20 }, () => {
      const segment = Buffer.alloc(65_537);
      segment.set([0xff, 0xef, 0xff, 0xff]);
      return segment;
    }), jpeg.subarray(2)]);
  await expectResponse(await mock.handler(submission({ count: 5, bytes: padded })), 413, 'BODY_TOO_LARGE');
  const segment = Buffer.alloc(1_201_000 - jpeg.length - 18 * 65_537);
  segment.set([255, 239, (segment.length - 2) >> 8, (segment.length - 2) & 255]);
  const aggregate = Buffer.concat([padded.subarray(0, 2 + 18 * 65_537), segment, jpeg.subarray(2)]);
  await expectResponse(await mock.handler(submission({ count: 5, bytes: aggregate })), 413, 'PHOTO_TOO_LARGE');
  await expectResponse(await mock.handler(submission({ type: 'image/png' })), 415, 'JPEG_REQUIRED');
  for (const bytes of [Buffer.from('not jpeg'), jpeg.subarray(0, -2)]) {
    await expectResponse(await mock.handler(submission({ bytes })), 415, 'INVALID_PHOTO');
  }
  assert.equal(mock.calls, 0);
});

test('removes metadata, contact/address text and upstream identifiers', async () => {
  const metadata = Buffer.from('PRIVATE-METADATA');
  const tagged = Buffer.concat([jpeg.subarray(0, 2), Buffer.from([255, 225, 0, metadata.length + 2]),
    metadata, jpeg.subarray(2)]);
  assert.equal(Buffer.from(sanitizeJpeg(tagged)).includes(metadata), false);
  const input = await parseDiagnosisRequest(submission({ bytes: tagged,
    description: '예시이름입니다. 고객명: 예시이름, 예시로 123번지, 010-1234-5678, example@example.com; 물이 떨어져요.' }));
  assert.doesNotMatch(input.description, /예시이름|예시로 123|010-1234-5678|example@example.com/);
  assert.equal(input.description, '물이 떨어짐');
  const analyze = createOpenAiDiagnosis('fixture-only', 'gpt-5.4-mini', async (url, init) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    const body = JSON.parse(init.body);
    assert.equal(body.store, false);
    assert.equal(body.max_output_tokens, MAX_OUTPUT_TOKENS);
    assert.equal(body.text.format.strict, true);
    const plaintext = body.input[0].content[0].text;
    assert.doesNotMatch(plaintext, /fixture-only|mock-diagnosis|예시이름|010-1234-5678/);
    assert.equal(body.input[0].content.filter(part => part.type === 'input_image').length, 3);
    return Response.json({ status: 'completed', usage: { input_tokens: 4000, output_tokens: 200 },
      output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(diagnosis) }] }] });
  });
  assert.equal((await analyze(input)).costMicros, 3900);
});

test('settles invalid schema, invalid photo references, cycles, and guessed prices as failed', async () => {
  for (const result of [
    { ...diagnosis, price: 55000 },
    { ...diagnosis, observations: [{ imageId: 'photo_5', phenomenon: '없는 사진' }] },
    { ...diagnosis, repairPlan: [{ stepId: 'cycle', tradeCode: 'facilities', action: '점검', dependsOn: ['cycle'] }] },
    { ...diagnosis, estimateBasis: ['55000원'] },
    { ...diagnosis, repairPlan: [{ stepId: 'inspect', tradeCode: 'facilities', action: '수리비는 오만 원', dependsOn: [] }] },
  ]) {
    const { handler, ledger } = setup({ analyze: async () => settled(result) });
    await expectResponse(await handler(submission()), 502, 'INVALID_MODEL_RESPONSE');
    assert.equal(ledger.committed, 4000);
    assert.equal(ledger.rows.get(`${uid}/${requestId}`).result, null);
  }
});

test('requires a decoder before admission and rejects decoder errors and mismatched pixels', async () => {
  for (const [decodeJpeg, status, result] of [
    [undefined, 503, 'PHOTO_DECODER_UNAVAILABLE'],
    [async () => { throw new Error('malformed entropy'); }, 415, 'INVALID_PHOTO_PIXELS'],
    [async () => ({ width: 8, height: 32, rgba: new Uint8Array(1024) }), 415, 'INVALID_PHOTO_PIXELS'],
    [async () => ({ width: 16, height: 16, rgba: new Uint8Array(8) }), 415, 'INVALID_PHOTO_PIXELS'],
  ]) {
    const mock = setup({ decodeJpeg });
    await expectResponse(await mock.handler(submission()), status, result);
    assert.equal(mock.calls, 0);
    assert.equal(mock.ledger.rows.size, 0);
  }
});

test('live switch blocks new requests and leaves owner status accessible without exposing identifiers', async () => {
  const mock = setup();
  await expectResponse(await mock.handler(submission()), 200);
  mock.ledger.enabled = false;
  await expectResponse(await mock.handler(submission({ id: 'mock-diagnosis-0002' })), 503, 'ANALYSIS_DISABLED');
  const url = `http://localhost/analyze-repair?requestId=${requestId}`;
  const query = (auth) => new Request(url, auth ? {headers:{Authorization:`Bearer ${auth}`}} : {});
  await expectResponse(await mock.handler(query(null)), 401, 'AUTH_REQUIRED');
  await expectResponse(await mock.handler(query('mock.second.user')), 404, 'REQUEST_NOT_FOUND');
  assert.deepEqual(await expectResponse(await mock.handler(query(token)), 200), {requestId, status:'completed'});
  assert.equal(mock.calls, 1);
});

test('records available provider request ID with unknown outcome and sends the internal trace', async () => {
  const analyze = createOpenAiDiagnosis('fixture-only', 'gpt-5.4-mini', async (_, init) => {
    assert.equal(init.headers['X-Client-Request-Id'], traceId);
    return new Response(null, { status: 503, headers: { 'x-request-id': 'req_mock_123' } });
  });
  const { handler, ledger } = setup({ analyze });
  await expectResponse(await handler(submission()), 502, 'OUTCOME_UNKNOWN');
  assert.equal(ledger.rows.get(`${uid}/${requestId}`).providerRequestId, 'req_mock_123');
  assert.equal(ledger.committed, RESERVATION_MICRO_USD);
});

test('rejects a non-urgent result for water near electricity', async () => {
  const { handler } = setup();
  await expectResponse(await handler(submission({ extra: { symptomCodes: ['water_near_electricity'] } })),
    502, 'INVALID_MODEL_RESPONSE');
});

test('enforces five mocked reservations per user and global remaining budget', async () => {
  const mock = setup();
  for (let index = 1; index <= 5; index++) {
    await expectResponse(await mock.handler(submission({ id: `mock-diagnosis-000${index}` })), 200);
  }
  await expectResponse(await mock.handler(submission({ id: 'mock-diagnosis-0006' })), 429, 'USER_DAILY_LIMIT');
  const budget = setup({}, mockLedger(960_000));
  await expectResponse(await budget.handler(submission()), 429, 'SERVER_DAILY_BUDGET');
  assert.equal(budget.calls, 0);
});

test('coordinates duplicate requests and another device while a request is running', async () => {
  let entered;
  let release;
  const pending = new Promise(resolve => { entered = resolve; });
  const upstream = new Promise(resolve => { release = resolve; });
  const ledger = mockLedger();
  const first = setup({ analyze: async () => { entered(); return upstream; } }, ledger);
  const second = setup({}, ledger);
  const result = first.handler(submission());
  await pending;
  await expectResponse(await second.handler(submission()), 409, 'ANALYSIS_IN_PROGRESS');
  await expectResponse(await second.handler(submission({ id: 'mock-diagnosis-0002' })), 409, 'ANALYSIS_IN_PROGRESS');
  await expectResponse(await second.handler(submission({ description: 'different' })), 409, 'REQUEST_CONFLICT');
  assert.equal(second.calls, 0);
  release(settled(diagnosis));
  await expectResponse(await result, 200);
  await expectResponse(await second.handler(submission()), 200);
  assert.equal(second.calls, 0);
  await expectResponse(await second.handler(submission({ auth: 'mock.second.user' })), 200);
  assert.equal(second.calls, 1);
});

test('timeout and provider network failure retain reservations without reissue', async () => {
  for (const timeout of [false, true]) {
    let signal;
    const analyze = createOpenAiDiagnosis('fixture-only', 'gpt-5.4-mini', async (_, init) => {
      signal = init.signal;
      if (!timeout) throw new Error('fake secret or provider exception');
      return new Promise(() => {});
    }, 10);
    const mock = setup({ analyze });
    const response = await mock.handler(submission());
    const body = await expectResponse(response, timeout ? 504 : 502, timeout ? 'MODEL_TIMEOUT' : 'OUTCOME_UNKNOWN');
    assert.deepEqual(Object.keys(body), ['code']);
    if (timeout) assert.equal(signal.aborted, true);
    assert.equal(mock.ledger.committed, RESERVATION_MICRO_USD);
    await expectResponse(await mock.handler(submission()), 409, 'OUTCOME_UNKNOWN');
  }
});

test('reservation failure stops processing and settlement failure retains the reservation', async () => {
  const authUnavailable = setup({ authenticate: async () => { throw new Error('Auth offline'); } });
  await expectResponse(await authUnavailable.handler(submission()), 503, 'ANALYSIS_UNAVAILABLE');
  assert.equal(authUnavailable.calls, 0);
  const unavailable = setup({ reserve: async () => { throw new Error('DB offline'); } });
  await expectResponse(await unavailable.handler(submission()), 503, 'ANALYSIS_UNAVAILABLE');
  assert.equal(unavailable.calls, 0);
  const failedSettlement = setup({ finish: async () => false });
  await expectResponse(await failedSettlement.handler(submission()), 503, 'SETTLEMENT_UNAVAILABLE');
  assert.equal(failedSettlement.ledger.committed, RESERVATION_MICRO_USD);
  await expectResponse(await failedSettlement.handler(submission()), 409, 'ANALYSIS_IN_PROGRESS');
  assert.equal(failedSettlement.calls, 1);
});
