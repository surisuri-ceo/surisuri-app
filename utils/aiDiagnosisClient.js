import diagnosisSchema from '../shared/diagnosisSchema.json';

export const DIAGNOSIS_LIMITS = Object.freeze({
  minPhotos: 3,
  maxPhotos: 5,
  maxPhotoBytes: 1_500_000,
  maxTotalPhotoBytes: 6_000_000,
  dailyRequestsPerUser: 5,
  concurrentRequestsPerUser: 1,
  modelTimeoutMs: 30_000,
  dailyBudgetUsd: 1,
});

const PILOT = 'leak_plumbing';
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const requestIdPattern = /^[a-zA-Z0-9_-]{16,100}$/;
const symptomCodePattern = /^[a-z0-9_-]{1,60}$/;

export class DiagnosisRequestError extends Error {
  constructor(code) {
    super(code);
    this.name = 'DiagnosisRequestError';
    this.code = code;
  }
}

// Implements only the JSON Schema keywords used by the v1 contract.
function matchesSchema(value, schema) {
  switch (schema.type) {
    case 'object':
      return value !== null && typeof value === 'object' && !Array.isArray(value) &&
        Object.keys(value).length === schema.required.length &&
        schema.required.every(key => Object.prototype.hasOwnProperty.call(value, key) &&
          matchesSchema(value[key], schema.properties[key]));
    case 'array':
      return Array.isArray(value) && value.length <= schema.maxItems &&
        value.every(item => matchesSchema(item, schema.items));
    case 'string':
      return typeof value === 'string' && (schema.enum
        ? schema.enum.includes(value)
        : value.trim().length >= schema.minLength && [...value].length <= schema.maxLength);
    case 'boolean':
      return typeof value === 'boolean';
    default:
      return false;
  }
}

function buildRequest({ requestId, photos, symptomCodes = [], description = '', tradeHint = null }) {
  if (typeof requestId !== 'string' || !requestIdPattern.test(requestId) ||
      !Array.isArray(photos) || photos.length < DIAGNOSIS_LIMITS.minPhotos ||
      photos.length > DIAGNOSIS_LIMITS.maxPhotos || !Array.isArray(symptomCodes) ||
      symptomCodes.length > 12 || symptomCodes.some(code =>
        typeof code !== 'string' || !symptomCodePattern.test(code)) ||
      typeof description !== 'string' || description.length > 2000 ||
      (tradeHint !== null && (typeof tradeHint !== 'string' || !symptomCodePattern.test(tradeHint)))) {
    throw new DiagnosisRequestError('INVALID_INPUT');
  }

  const body = new FormData();
  // Only allowlisted fields enter the request. Keep contact details and addresses out of free text.
  body.append('input', JSON.stringify({
    requestId, pilot: PILOT, symptomCodes: [...new Set(symptomCodes)], description: description.trim(), tradeHint,
  }));

  let totalBytes = 0;
  for (const [index, photo] of photos.entries()) {
    const file = photo?.file;
    const bytes = file?.size ?? photo?.byteLength;
    if (!file || !imageTypes.has(file.type) || !Number.isInteger(bytes) || bytes < 1 ||
        bytes > DIAGNOSIS_LIMITS.maxPhotoBytes) {
      throw new DiagnosisRequestError('INVALID_PHOTO');
    }
    totalBytes += bytes;
    if (totalBytes > DIAGNOSIS_LIMITS.maxTotalPhotoBytes) {
      throw new DiagnosisRequestError('INVALID_PHOTO');
    }

    const imageId = `photo_${index + 1}`;
    const extension = file.type.split('/')[1];
    const name = `${imageId}.${extension}`;
    if (typeof file.uri === 'string' && file.uri) {
      body.append(imageId, { uri: file.uri, type: file.type, name });
    } else if (typeof Blob !== 'undefined' && file instanceof Blob) {
      body.append(imageId, file, name);
    } else {
      throw new DiagnosisRequestError('INVALID_PHOTO');
    }
  }
  return { body, requestId, photoCount: photos.length };
}

function invocationError(status) {
  switch (status) {
    case 401:
    case 403:
      return new DiagnosisRequestError('AUTH_REQUIRED');
    case 409:
      return new DiagnosisRequestError('DUPLICATE_REQUEST');
    case 413:
    case 415:
    case 422:
      return new DiagnosisRequestError('INVALID_INPUT');
    case 429:
      return new DiagnosisRequestError('LIMIT_EXCEEDED');
    case 408:
    case 504:
      return new DiagnosisRequestError('TIMEOUT');
    default:
      return new DiagnosisRequestError('SERVER_ERROR');
  }
}

export function createAiDiagnosisClient(supabase, { timeoutMs = 35_000 } = {}) {
  // This only guards the current app instance. The server owns quotas, budget reservations, and idempotency.
  const pendingByUser = new Map();

  return async function analyze(input = {}) {
    const { body, requestId, photoCount } = buildRequest(input);
    let session;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      session = data?.session;
    } catch {
      throw new DiagnosisRequestError('AUTH_REQUIRED');
    }
    if (!session?.user?.id || !session.access_token) {
      throw new DiagnosisRequestError('AUTH_REQUIRED');
    }

    const userId = session.user.id;
    if (pendingByUser.has(userId)) {
      throw new DiagnosisRequestError(pendingByUser.get(userId) === requestId
        ? 'DUPLICATE_REQUEST' : 'ANALYSIS_IN_PROGRESS');
    }
    pendingByUser.set(userId, requestId);

    const controller = new AbortController();
    let timer;
    try {
      const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(new DiagnosisRequestError('TIMEOUT'));
          controller.abort();
        }, timeoutMs);
      });
      const { data, error } = await Promise.race([
        deadline,
        supabase.functions.invoke('analyze-repair', {
          body,
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: controller.signal,
        }),
      ]);
      if (error) throw invocationError(error.context?.status);

      const result = data?.diagnosis;
      if (data?.requestId !== requestId || data.source !== 'model' ||
          !matchesSchema(result, diagnosisSchema) ||
          (result.status !== 'completed' && result.holdReasons.length === 0)) {
        throw new DiagnosisRequestError('INVALID_RESPONSE');
      }
      const imageIds = new Set(Array.from({ length: photoCount }, (_, index) => `photo_${index + 1}`));
      if (result.observations.some(item => !imageIds.has(item.imageId)) ||
          result.causeCandidates.some(item => item.imageIds.some(id => !imageIds.has(id)))) {
        throw new DiagnosisRequestError('INVALID_RESPONSE');
      }
      return result;
    } catch (error) {
      if (error instanceof DiagnosisRequestError) throw error;
      throw new DiagnosisRequestError('SERVER_ERROR');
    } finally {
      clearTimeout(timer);
      pendingByUser.delete(userId);
    }
  };
}
