import { fingerprint, InputError, parseDiagnosisRequest, verifyPhotoPixels } from '../_shared/diagnosisInput.ts';
import type { JpegDecoder } from '../_shared/diagnosisInput.ts';
import { createOpenAiDiagnosis, isDiagnosis } from '../_shared/openaiDiagnosis.ts';
import type { DiagnosisInput } from '../_shared/openaiDiagnosis.ts';

type Reservation = { decision: string; traceId?: string; result?: unknown };
type Settlement = {
  status: 'unknown' | 'completed' | 'failed';
  costMicros?: number;
  inputTokens?: number;
  outputTokens?: number;
  result?: unknown;
  providerRequestId?: string;
};
type Dependencies = {
  authenticate(token: string): Promise<string | null>;
  reserve(uid: string, requestId: string, hash: string): Promise<Reservation>;
  finish(uid: string, requestId: string, settlement: Settlement): Promise<boolean>;
  status(uid: string, requestId: string): Promise<string | null>;
  decodeJpeg?: JpegDecoder;
  analyze(input: DiagnosisInput, traceId: string, onProviderRequestId: (id: string) => void): Promise<{
    diagnosis: unknown; costMicros: number; inputTokens: number; outputTokens: number;
  }>;
};

const reservationErrors: Record<string, [number, string]> = {
  conflict: [409, 'REQUEST_CONFLICT'],
  processing: [409, 'ANALYSIS_IN_PROGRESS'],
  active: [409, 'ANALYSIS_IN_PROGRESS'],
  unknown: [409, 'OUTCOME_UNKNOWN'],
  failed: [409, 'REQUEST_ALREADY_PROCESSED'],
  user_limit: [429, 'USER_DAILY_LIMIT'],
  budget_limit: [429, 'SERVER_DAILY_BUDGET'],
  disabled: [503, 'ANALYSIS_DISABLED'],
};

function json(status: number, body: object) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function createHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    if (!['GET', 'POST'].includes(request.method)) return json(405, { code: 'METHOD_NOT_ALLOWED' });
    const bearer = request.headers.get('authorization')?.match(/^Bearer ([\w-]+\.[\w-]+\.[\w-]+)$/i);
    if (!bearer || bearer[1].length > 8192) return json(401, { code: 'AUTH_REQUIRED' });
    try {
      const uid = await deps.authenticate(bearer[1]);
      if (!uid) return json(401, { code: 'AUTH_REQUIRED' });
      if (request.method === 'GET') {
        const id = new URL(request.url).searchParams.get('requestId');
        if (!id || !/^[a-zA-Z0-9_-]{16,100}$/.test(id)) return json(422, { code: 'INVALID_INPUT' });
        const status = await deps.status(uid, id);
        return status ? json(200, { requestId: id, status }) : json(404, { code: 'REQUEST_NOT_FOUND' });
      }
      if (!deps.decodeJpeg) return json(503, { code: 'PHOTO_DECODER_UNAVAILABLE' });
      const input = await parseDiagnosisRequest(request);
      for (const photo of input.photos) await verifyPhotoPixels(photo, deps.decodeJpeg);
      const { requestId } = input;
      const images = new Set(input.photos.map(photo => photo.id));
      const reply = (diagnosis: unknown) => json(200, { requestId, source: 'model', diagnosis });
      const reservation = await deps.reserve(uid, requestId, await fingerprint(input));
      if (reservation.decision === 'completed') {
        return isDiagnosis(reservation.result, images)
          ? reply(reservation.result) : json(503, { code: 'RESULT_UNAVAILABLE' });
      }
      if (reservation.decision !== 'reserved') {
        const [status, code] = Object.hasOwn(reservationErrors, reservation.decision)
          ? reservationErrors[reservation.decision] : [503, 'RESERVATION_UNAVAILABLE'];
        return json(status, { code });
      }
      if (!reservation.traceId || !/^[a-f0-9-]{36}$/i.test(reservation.traceId)) {
        return json(503, { code: 'RESERVATION_UNAVAILABLE' });
      }

      let analysis;
      let providerRequestId: string | undefined;
      try {
        // The upstream payload contains only the allowlisted analysis inputs.
        analysis = await deps.analyze({
          photos: input.photos, symptomCodes: input.symptomCodes,
          description: input.description, tradeHint: input.tradeHint,
        }, reservation.traceId, id => { providerRequestId = id; });
      } catch (error) {
        if (!await deps.finish(uid, requestId, { status: 'unknown', providerRequestId })) {
          return json(503, { code: 'SETTLEMENT_UNAVAILABLE' });
        }
        const timeout = error instanceof Error && error.message === 'PROVIDER_TIMEOUT';
        return json(timeout ? 504 : 502, { code: timeout ? 'MODEL_TIMEOUT' : 'OUTCOME_UNKNOWN' });
      }

      const modelResult = analysis.diagnosis;
      const electricalRisk = input.symptomCodes.includes('water_near_electricity') ||
        input.description.includes('전기와 물의 접촉 가능성');
      const diagnosis = isDiagnosis(modelResult, images) &&
          (!electricalRisk || modelResult.safety.urgency === 'urgent')
        ? {
          ...modelResult,
          estimateBasis: [],
          estimateHoldReasons: ['검증된 단가 기준이 마련되지 않아 견적을 보류합니다.'],
        }
        : null;
      const settled = await deps.finish(uid, requestId, {
        status: diagnosis ? 'completed' : 'failed',
        costMicros: analysis.costMicros, inputTokens: analysis.inputTokens, outputTokens: analysis.outputTokens,
        result: diagnosis, providerRequestId,
      });
      if (!settled) return json(503, { code: 'SETTLEMENT_UNAVAILABLE' });
      return diagnosis ? reply(diagnosis) : json(502, { code: 'INVALID_MODEL_RESPONSE' });
    } catch (error) {
      if (error instanceof InputError) return json(error.status, { code: error.code });
      return json(503, { code: 'ANALYSIS_UNAVAILABLE' });
    }
  };
}

export function createSupabaseAccess(
  url: string, publicKey: string, serverKey: string, fetcher: typeof fetch = fetch,
) {
  if (!url || !publicKey || !serverKey || serverKey === publicKey) throw new Error('INVALID_SUPABASE_CONFIGURATION');
  const base = new URL(url);
  if (base.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(base.hostname)) {
    throw new Error('INVALID_SUPABASE_URL');
  }
  const transport = (path: string, init: RequestInit) => fetcher(new URL(path, base), {
    ...init, redirect: 'error', signal: AbortSignal.timeout(5000),
  });
  const rpc = async (name: string, args: object) => {
    const response = await transport(`/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: serverKey, Authorization: `Bearer ${serverKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!response.ok) throw new Error('ACCOUNTING_UNAVAILABLE');
    return await response.json();
  };
  return {
    async authenticate(token: string): Promise<string | null> {
      const response = await transport('/auth/v1/user', {
        headers: { apikey: publicKey, Authorization: `Bearer ${token}` },
      });
      if ([400, 401, 403].includes(response.status)) return null;
      if (!response.ok) throw new Error('AUTH_UNAVAILABLE');
      const user = await response.json();
      return typeof user?.id === 'string' && !user.is_anonymous &&
        /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(user.id) ? user.id : null;
    },
    reserve(uid: string, requestId: string, hash: string): Promise<Reservation> {
      return rpc('reserve_repair_diagnosis', { p_uid: uid, p_request_id: requestId, p_fingerprint: hash });
    },
    status(uid: string, requestId: string): Promise<string | null> {
      return rpc('repair_diagnosis_status', { p_uid: uid, p_request_id: requestId });
    },
    async finish(uid: string, requestId: string, settlement: Settlement): Promise<boolean> {
      return (await rpc('finish_repair_diagnosis', {
        p_uid: uid, p_request_id: requestId, p_status: settlement.status,
        p_cost: settlement.costMicros ?? null, p_input_tokens: settlement.inputTokens ?? null,
        p_output_tokens: settlement.outputTokens ?? null, p_result: settlement.result ?? null,
        p_provider_request_id: settlement.providerRequestId ?? null,
      })) === true;
    },
  };
}

if (typeof Deno !== 'undefined') {
  const env = (key: string) => Deno.env.get(key) ?? '';
  let handler;
  try {
    handler = createHandler({
      ...createSupabaseAccess(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), env('SUPABASE_SERVICE_ROLE_KEY')),
      analyze: createOpenAiDiagnosis(env('OPENAI_API_KEY'), env('OPENAI_DIAGNOSIS_MODEL')),
      // Supply a strict decoder after its dependency and runtime are approved and verified.
    });
  } catch {
    handler = () => json(503, { code: 'ANALYSIS_MISCONFIGURED' });
  }
  Deno.serve(handler);
}
