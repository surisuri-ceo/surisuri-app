import type { DiagnosisInput, Photo } from './openaiDiagnosis.ts';

const MAX_PHOTO_BYTES = 1_500_000;
const MAX_PHOTO_TOTAL = 6_000_000;
const MAX_MULTIPART_BYTES = 6_050_000;
const photoKey = /^photo_[1-5]$/;
const inputKeys = new Set(['requestId', 'pilot', 'symptomCodes', 'description', 'tradeHint']);
export const PILOT_TRADES = ['facilities', 'electric', 'wallpaper', 'paint', 'furniture_kitchen'];
const allowedSymptoms = new Set([
  'leak', 'dripping', 'standing_water', 'dampness', 'low_pressure',
  'blocked_drain', 'pipe_noise', 'odor', 'water_near_electricity', 'other',
]);

export class InputError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export function redactCustomerText(text: string): string {
  return text.normalize('NFKC')
    .replace(/[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu, '[연락처 삭제]')
    .replace(/(?<!\d)(?:\+?82[\s().-]*)?0?\d{1,3}[\s().-]*\d{3,4}[\s().-]*\d{4}(?!\d)/g, '[번호 삭제]')
    .replace(/\b\d{6}\s*-\s*[1-8]\d{6}\b/g, '[식별번호 삭제]')
    .replace(/(?:이름|성명|고객명|신청자|주소|도로명|지번)\s*[:：=]\s*[^\n,;]+/gu, '[개인정보 삭제]')
    .replace(/(?:[가-힣\d]+(?:특별시|광역시|특별자치시|특별자치도|시|군|구|동|읍|면|리)\s+)*(?:[가-힣\d]+(?:번길|길|로|동|리))\s*\d+(?:-\d+)?(?:\s*\d+(?:동|호))*/gu, '[주소 삭제]')
    .replace(/(?:https?:\/\/|www\.)[^\s]+/gi, '[링크 삭제]');
}

const symptomPhrases = [
  ['물이 떨어짐', /물방울|물(?:이)?\s*떨어|물(?:이)?\s*뚝뚝/],
  ['누수 또는 젖음', /누수|새는|샙니다|젖었|젖어|축축/],
  ['배수 문제', /역류|막힘|막혔|배수(?:가)?\s*안/],
  ['수압 저하', /수압(?:이)?\s*(?:낮|약)|물(?:이)?\s*약/],
  ['냄새 또는 소음', /악취|냄새|소음|소리/],
  ['전기와 물의 접촉 가능성', /(?:콘센트|전선|전기).{0,20}(?:물|누수|젖)|(?:물|누수|젖).{0,20}(?:콘센트|전선|전기)/],
] as const;

// Only fixed symptom phrases can leave the pilot endpoint; unrecognized free text remains private.
export function extractSafeSymptoms(text: string): string {
  const redacted = redactCustomerText(text);
  return symptomPhrases.filter(([, pattern]) => pattern.test(redacted)).map(([phrase]) => phrase).join('; ');
}

// Preserve only the JPEG image stream; remove APP and comment segments (EXIF, XMP, IPTC, etc.).
export function sanitizeJpeg(bytes: Uint8Array): Uint8Array {
  const invalid = () => new InputError(415, 'INVALID_PHOTO');
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw invalid();
  const chunks = [bytes.subarray(0, 2)];
  let pos = 2;
  let frame = false;
  let scan = false;
  let quantization = false;
  let huffman = false;
  while (pos < bytes.length) {
    const start = pos;
    if (bytes[pos++] !== 0xff) throw invalid();
    while (bytes[pos] === 0xff) pos++;
    const marker = bytes[pos++];
    if (marker === 0xd9) {
      if (!scan || pos !== bytes.length) throw invalid();
      chunks.push(bytes.subarray(start, pos));
      const result = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      return result;
    }
    const length = (bytes[pos] << 8) | bytes[pos + 1];
    const end = pos + length;
    if (length < 2 || end > bytes.length) throw invalid();

    if ((marker >= 0xe0 && marker <= 0xef) || marker === 0xfe) {
      pos = end;
      continue;
    }
    if (marker === 0xc0 || marker === 0xc2) {
      const height = (bytes[pos + 3] << 8) | bytes[pos + 4];
      const width = (bytes[pos + 5] << 8) | bytes[pos + 6];
      const components = bytes[pos + 7];
      if (frame || bytes[pos + 2] !== 8 || ![1, 3].includes(components) ||
          length !== 8 + 3 * components || !width || !height || width > 2048 || height > 2048) throw invalid();
      frame = true;
    } else if (marker === 0xdb) {
      if (length < 67) throw invalid();
      quantization = true;
    } else if (marker === 0xc4) {
      if (length < 19) throw invalid();
      huffman = true;
    } else if (marker === 0xdd) {
      if (length !== 4) throw invalid();
    } else if (marker === 0xda) {
      if (!frame || !quantization || !huffman || length < 8 ||
          length !== 6 + 2 * bytes[pos + 2]) throw invalid();
      pos = end;
      while (pos < bytes.length) {
        if (bytes[pos] !== 0xff) { pos++; continue; }
        const next = bytes[pos + 1];
        if (next === 0 || (next >= 0xd0 && next <= 0xd7)) { pos += 2; continue; }
        break;
      }
      if (pos === end) throw invalid();
      chunks.push(bytes.subarray(start, pos));
      scan = true;
      continue;
    } else {
      throw invalid();
    }
    chunks.push(bytes.subarray(start, end));
    pos = end;
  }
  throw invalid();
}

export type JpegDecoder = (bytes: Uint8Array) => Promise<{
  width: number; height: number; rgba: Uint8Array | Uint8ClampedArray;
}>;

export async function verifyPhotoPixels(photo: Photo, decode: JpegDecoder) {
  const bytes = photo.bytes;
  let offset = 2;
  while (offset < bytes.length) {
    while (bytes[offset] === 255) offset++;
    const marker = bytes[offset++];
    if (marker === 0xc0 || marker === 0xc2) break;
    offset += (bytes[offset] << 8) | bytes[offset + 1];
  }
  const expectedHeight = (bytes[offset + 3] << 8) | bytes[offset + 4];
  const expectedWidth = (bytes[offset + 5] << 8) | bytes[offset + 6];
  try {
    const { width, height, rgba } = await decode(bytes);
    if (width !== expectedWidth || height !== expectedHeight ||
        width < 1 || height < 1 || width * height > 4_194_304 ||
        rgba.byteLength !== 4 * width * height) throw new Error();
  } catch {
    throw new InputError(415, 'INVALID_PHOTO_PIXELS');
  }
}

async function readMultipart(request: Request): Promise<FormData> {
  const type = request.headers.get('content-type') || '';
  if (!/^multipart\/form-data\s*;/i.test(type)) throw new InputError(415, 'INVALID_CONTENT_TYPE');
  if (Number(request.headers.get('content-length')) > MAX_MULTIPART_BYTES) throw new InputError(413, 'BODY_TOO_LARGE');
  const reader = request.body?.getReader();
  if (!reader) throw new InputError(422, 'MISSING_BODY');
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_MULTIPART_BYTES) {
        void reader.cancel().catch(() => {});
        throw new InputError(413, 'BODY_TOO_LARGE');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return await new Response(body, { headers: { 'content-type': type } }).formData();
  } catch {
    throw new InputError(422, 'INVALID_MULTIPART');
  }
}

export async function parseDiagnosisRequest(request: Request): Promise<DiagnosisInput & { requestId: string }> {
  const form = await readMultipart(request);
  const entries = [...form.entries()];
  const photos = entries.filter(([key]) => key !== 'input');
  if (form.getAll('input').length !== 1 || photos.length < 3 || photos.length > 5 ||
      new Set(photos.map(([key]) => key)).size !== photos.length ||
      photos.some(([key]) => !photoKey.test(key))) throw new InputError(422, 'INVALID_FIELDS');
  let data;
  try {
    const input = form.get('input');
    if (typeof input !== 'string' || input.length > 8000) throw new Error();
    data = JSON.parse(input);
  } catch {
    throw new InputError(422, 'INVALID_INPUT');
  }
  if (!data || typeof data !== 'object' || Object.keys(data).some(key => !inputKeys.has(key)) ||
      typeof data.requestId !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(data.requestId) ||
      data.pilot !== 'leak_plumbing' || typeof data.description !== 'string' || data.description.length > 2000 ||
      !Array.isArray(data.symptomCodes) || data.symptomCodes.length > 12 ||
      data.symptomCodes.some((value: unknown) => typeof value !== 'string' || !allowedSymptoms.has(value)) ||
      (data.tradeHint !== null && !PILOT_TRADES.includes(data.tradeHint))) {
    throw new InputError(422, 'INVALID_INPUT');
  }
  let total = 0;
  const images: Photo[] = [];
  for (let i = 1; i <= photos.length; i++) {
    const id = `photo_${i}`;
    const file = form.get(id);
    if (typeof file === 'string' || !file || file.type !== 'image/jpeg') throw new InputError(415, 'JPEG_REQUIRED');
    total += file.size;
    if (file.size < 1 || file.size > MAX_PHOTO_BYTES || total > MAX_PHOTO_TOTAL) {
      throw new InputError(413, 'PHOTO_TOO_LARGE');
    }
    images.push({ id, type: file.type, bytes: sanitizeJpeg(new Uint8Array(await file.arrayBuffer())) });
  }
  return {
    requestId: data.requestId,
    symptomCodes: [...new Set<string>(data.symptomCodes)],
    description: extractSafeSymptoms(data.description.trim()),
    tradeHint: data.tradeHint,
    photos: images,
  };
}

export async function fingerprint(input: DiagnosisInput): Promise<string> {
  const hash = async (bytes: BufferSource) =>
    [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
      .map(byte => byte.toString(16).padStart(2, '0')).join('');
  const images = await Promise.all(input.photos.map(photo => hash(Uint8Array.from(photo.bytes))));
  return hash(new TextEncoder().encode(JSON.stringify([
    'leak_plumbing', input.symptomCodes, input.description, input.tradeHint, images,
  ])));
}
