// 표시 이름은 유지하고, 명시적으로 알려진 분야만 연결합니다. etc는 전체 분야가 아닙니다.
export const FIELD_DEFINITIONS = [
  { code: 'facilities', names: ['설비/종합', '설비/종합수리', '설비/누수'] },
  { code: 'simple_labor', names: ['단순인력'] },
  { code: 'cleaning_pro', names: ['청소/방역', '청소/입주'], aliases: ['cleaning'] },
  { code: 'furniture_kitchen', names: ['싱크대/가구'] },
  { code: 'moving_delivery', names: ['이사/배송', '이사/배송(화물)'] },
  { code: 'metal_window', names: ['금속/창호'] },
  { code: 'carpentry', names: ['목공/내장'] },
  { code: 'wallpaper', names: ['도배/장판'] },
  { code: 'electric', names: ['전기/조명'] },
  { code: 'paint', names: ['페인트/방수'] },
  { code: 'etc', names: ['기타/종합수리'] },
  { code: 'building_construction', names: ['건축공사'] },
  { code: 'civil_construction', names: ['토목공사'] },
  { code: 'interior', names: ['인테리어'] },
  { code: 'facility_construction', names: ['설비공사'] },
  { code: 'metal_construction', names: ['금속공사'] },
  { code: 'landscaping', names: ['조경공사'] },
  { code: 'transport_delivery', names: ['운반/배송'] },
  { code: 'other_construction', names: ['기타공사'] }
];

const nonCallFields = ['자재마켓', 'materials_market', '중고장터', 'used_market', '떠리털이', 'surplus_clearance', '전체보기'];
const broadFields = ['각종공사/중장비', 'heavy_construction', '일반수리'];

export function normalizeField(value) {
  const name = typeof value === 'string' ? value.trim() : '';
  const field = FIELD_DEFINITIONS.find(field => field.code === name || field.names.includes(name) || field.aliases?.includes(name));
  return {
    fieldCode: field?.code ?? null,
    fieldStatus: field ? 'recognized' : nonCallFields.includes(name) ? 'not_applicable' : broadFields.includes(name) ? 'needs_detail' : 'unrecognized'
  };
}

// 법정동코드 기반 시·도 2자리 / 시·군·구 5자리. 코드의 현존 여부 검증은 공식 주소 확인 단계의 책임입니다.
// source/status는 서버 인증이 아니며, 이 함수는 이미 확인된 정규화 데이터만 비교하는 로컬 순수 함수입니다.
export function isConfirmedRegionCode(value) {
  return value?.status === 'confirmed' && value.codeSystem === 'KR-LAWD' &&
    value.source === 'official-address' && typeof value.sidoCode === 'string' &&
    /^[0-9]{2}$/.test(value.sidoCode) && value.sidoCode !== '00' &&
    typeof value.sigunguCode === 'string' && /^[0-9]{5}$/.test(value.sigunguCode) &&
    value.sigunguCode.startsWith(value.sidoCode) && !value.sigunguCode.endsWith('000');
}

export function normalizeRegion(address, confirmedCode = null) {
  const confirmed = isConfirmedRegionCode(confirmedCode);
  return {
    originalText: typeof address === 'string' ? address : '',
    codeSystem: 'KR-LAWD',
    status: confirmed ? 'confirmed' : 'unverified',
    sidoCode: confirmed ? confirmedCode.sidoCode : null,
    sigunguCode: confirmed ? confirmedCode.sigunguCode : null,
    source: confirmed ? 'official-address' : null
  };
}

export function normalizeActivityRadius(value) {
  if (value === '전지역') return { mode: 'nationwide', km: null };
  const match = typeof value === 'string' ? /^(3|5|10|30)km$/.exec(value) : null;
  return match ? { mode: 'distance', km: Number(match[1]) } : { mode: 'unverified', km: null };
}

export function normalizeProviderFields(primaryField, secondaryFields) {
  return {
    primaryFieldCode: normalizeField(primaryField).fieldCode,
    secondaryFieldCodes: Array.isArray(secondaryFields)
      ? [...new Set(secondaryFields.map(field => normalizeField(field).fieldCode).filter(Boolean))]
      : []
  };
}

// 같은 시·군·구의 분야 일치 여부만 보는 예비 후보 판정입니다. 거리·권한·실제 배정은 처리하지 않습니다.
export function isAssignmentCandidate(request, provider) {
  if (!request || !provider || !['tech', 'company'].includes(provider.role)) return false;
  const fieldCode = normalizeField(request.fieldCode).fieldCode;
  if (!fieldCode || fieldCode !== request.fieldCode || !isConfirmedRegionCode(request.regionCode) || !isConfirmedRegionCode(provider.regionCode)) return false;
  const fields = [provider.primaryFieldCode, ...(Array.isArray(provider.secondaryFieldCodes) ? provider.secondaryFieldCodes : [])];
  return fields.includes(fieldCode) && request.regionCode.sidoCode === provider.regionCode.sidoCode &&
    request.regionCode.sigunguCode === provider.regionCode.sigunguCode;
}
