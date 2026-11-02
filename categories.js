// categories.js - 수리수리 AI 10대 카테고리 및 떠리털이 데이터

export const CATEGORIES = [
  { id: 'leak', name: '누수 탐지', icon: '💧', desc: '미세 누수, 배관 누수 정밀 탐지' },
  { id: 'plumbing', name: '수도·설비', icon: '🔧', desc: '수전 교체, 배관 막힘, 펌프 수리' },
  { id: 'electric', name: '전기·조명', icon: '⚡', desc: '누전 차단기, LED 조명, 배선 공사' },
  { id: 'waterproof', name: '방수·코킹', icon: '🛡️', desc: '옥상 우레탄, 외벽 실리콘, 화장실' },
  { id: 'door', name: '문·샤시·유리', icon: '🚪', desc: '도어락, 방충망, 유리 교체, 경첩' },
  { id: 'wallpaper', name: '도배·장판·타일', icon: '🎨', desc: '부분 도배, 데코타일, 줄눈 시공' },
  { id: 'hvac', name: '에어컨·보일러', icon: '❄️', desc: '가스 충전, 분해 청소, 배관 청소' },
  { id: 'demolition', name: '철거·폐기물', icon: '🔨', desc: '욕실 철거, 폐자재 처리, 원상복구' },
  { id: 'smarthome', name: '스마트홈·CCTV', icon: '📹', desc: '인터폰, 홈IoT, 보안카메라' },
  { id: 'surplus', name: '떠리 털이', icon: '🔥', desc: '현장 잉여 자재 급처 마켓', badge: 'HOT' }
];

export const INITIAL_SURPLUS_ITEMS = [
  {
    id: 1,
    title: '동파이프 15A 5미터 (미사용 신품)',
    price: '15,000원',
    location: '서울 강서구 화곡동',
    status: '판매중'
  },
  {
    id: 2,
    title: 'KCC 친환경 수성페인트 백색 18L',
    price: '25,000원',
    location: '인천 부평구',
    status: '판매중'
  },
  {
    id: 3,
    title: '대림바스 세면기 수전 (단순개봉)',
    price: '20,000원',
    location: '경기 부천시',
    status: '예약중'
  }
];