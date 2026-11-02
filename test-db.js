const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sdhewingffatmkjbevzm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oAmBLKt8N297K3vGadGYIA_JGOHVs83';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkConnection() {
  console.log('🚀 [수리수리 DB 연결 테스트 시작]...');
  
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .insert([{
      name: '대표님테스트',
      phone: '010-0000-0000',
      role: 'customer',
      region: '광주광역시'
    }])
    .select()
    .single();

  if (pErr) {
    console.error('❌ 프로필 등록 에러:', pErr.message);
    return;
  }
  console.log('✅ 1. 프로필 등록 성공! ID:', profile.id);

  const { data: req, error: rErr } = await supabase
    .from('requests')
    .insert([{
      req_number: 'REQ-' + Date.now(),
      customer_id: profile.id,
      category_id: 'electric_scooter',
      category_name: '전동 킥보드 점검',
      address: '광주광역시 북구',
      description: 'DB 연동 테스트 요청 건입니다.',
      status: 'waiting'
    }])
    .select()
    .single();

  if (rErr) {
    console.error('❌ 요청서 등록 에러:', rErr.message);
    return;
  }
  console.log('✅ 2. 요청서 등록 성공! 접수번호:', req.req_number);
  console.log('🎉 [연동 성공] 대표님의 독립 Supabase 백엔드가 정상 작동 중입니다!');
}

checkConnection();
