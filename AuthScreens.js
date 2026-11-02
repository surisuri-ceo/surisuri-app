// AuthScreens.js - 활동명 미입력 시 '취소' 없이 오직 '확인' 버튼만 뜨는 팝업 적용본
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
  Modal
} from 'react-native';

const TECH_CATEGORIES = [
  { id: 'facilities', name: '설비/종합', icon: '🔧' },
  { id: 'furniture_kitchen', name: '싱크대/가구', icon: '🪑' },
  { id: 'cleaning_pro', name: '청소/방역', icon: '🧹' },
  { id: 'moving_delivery', name: '이사/배송(화물)', icon: '🚚' },
  { id: 'metal_window', name: '금속/창호', icon: '🪟' },
  { id: 'carpentry', name: '목공/내장', icon: '🪵' },
  { id: 'wallpaper', name: '도배/장판', icon: '🏠' },
  { id: 'electric', name: '전기/조명', icon: '💡' },
  { id: 'paint', name: '페인트/방수', icon: '🛡️' },
  { id: 'simple_labor', name: '단순인력', icon: '💪' },
  { id: 'etc', name: '기타/종합수리', icon: '📦' }
];

const RADIUS_OPTIONS = ['3km', '5km', '10km', '30km', '전지역'];

export function LandingScreen({ onSelectRole, onClose }) {
  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      {onClose && (
        <View style={s.topBarSkip}>
          <TouchableOpacity onPress={onClose} style={s.skipBtnTouch}>
            <Text style={s.skipBtnText}>✕ 둘러보기 (홈으로)</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={s.landingCenterOfficial}>
        <View style={s.officialHouseIconBox}><Text style={{ fontSize: 38 }}>🏠</Text></View>
        <Text style={s.officialMainTitle}>수리수리 AI</Text>
        <Text style={s.officialMainSub}>스마트 긴급수리 · 장터 직거래 · 전문공사 & 가구시공 플랫폼</Text>

        <View style={s.officialCardList}>
          <TouchableOpacity style={s.cardCustomerOfficial} onPress={() => onSelectRole('customer_auth_select')}>
            <Text style={{ fontSize: 26, marginRight: 12 }}>👤</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.cardCustomerTitle}>고객 / 소비자 회원가입</Text>
              <Text style={s.cardCustomerSub}>3초 AI 견적 판독, 수수료 0원 직거래 호출</Text>
            </View>
            <Text style={s.cardArrowBlue}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.cardTechOfficial} onPress={() => onSelectRole('tech')}>
            <Text style={{ fontSize: 26, marginRight: 12 }}>🛠</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTechTitle}>기술자 / 고수 회원가입</Text>
              <Text style={s.cardTechSub}>수수료 0원, 하루 2회 무료콜 · 우선배차 혜택</Text>
            </View>
            <Text style={s.cardArrowOrange}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.cardCompanyOfficial} onPress={() => onSelectRole('company')}>
            <Text style={{ fontSize: 26, marginRight: 12 }}>🏢</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.cardCompanyTitle}>업체(회사) 회원가입</Text>
              <Text style={s.cardCompanySub}>사업자 등록, 대형 공사 및 종합시공 배차 수신</Text>
            </View>
            <Text style={s.cardArrowSky}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export function CustomerAuthSelectScreen({ onSelectMethod, onBack }) {
  return (
    <View style={s.container}>
      <View style={s.headerOfficialClean}>
        <TouchableOpacity onPress={onBack} style={s.navBackBtn}><Text style={s.navBackBtnText}>‹ 처음으로</Text></TouchableOpacity>
        <Text style={s.headerTitleClean}>소비자 회원가입</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={s.authSelectBoxBody}>
        <TouchableOpacity style={s.kakaoBigBtn} onPress={() => onSelectMethod('카카오')}>
          <Text style={{ fontSize: 19, marginRight: 8 }}>💬</Text><Text style={s.kakaoBigBtnText}>카카오로 1초 간편가입</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.googleBigBtn} onPress={() => onSelectMethod('Google')}>
          <Text style={{ fontSize: 18, marginRight: 8 }}>🌐</Text><Text style={s.googleBigBtnText}>Google 계정으로 계속하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.phoneBigBtnCenteredPastelRed} onPress={() => onSelectMethod('휴대폰')}>
          <Text style={{ fontSize: 18, marginRight: 6 }}>📱</Text><Text style={s.phoneBigBtnCenteredText}>휴대폰 번호 본인인증으로 가입하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function CustomerFormScreen({ authMethod, onComplete, onBack }) {
  const isSocial = authMethod === '카카오' || authMethod === 'Google';
  const [realName, setRealName] = useState('서한영');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [smsVerified, setSmsVerified] = useState(false);
  const [address, setAddress] = useState('광주광역시 북구 용봉동');

  const handleSendSms = () => {
    if (!phone.trim() || phone.length < 10) return Alert.alert('확인', '올바른 휴대폰 번호를 입력해 주세요.');
    setSmsSent(true);
    Alert.alert('인증번호 발송', '인증번호 [123456]가 발송되었습니다. (테스트용)');
  };

  const handleVerifySms = () => {
    if (smsCode.trim() === '123456') {
      setSmsVerified(true);
      Alert.alert('인증 성공', '휴대폰 본인인증이 완료되었습니다.');
    } else {
      Alert.alert('인증 실패', '인증번호 6자리를 다시 확인해 주세요. (테스트: 123456)');
    }
  };

  // 활동명 미입력 시 '취소' 없이 오직 '확인' 버튼만 제공하여 경고 후 실명으로 통과
  const handleSubmit = () => {
    if (!realName.trim()) return Alert.alert('확인', '이름(실명)을 입력해 주세요.');
    if (!isSocial && !smsVerified) return Alert.alert('인증 필요', '휴대폰 인증을 완료해 주세요.');
    if (!address.trim()) return Alert.alert('확인', '거주 지역을 입력해 주세요.');

    if (!nickname.trim()) {
      Alert.alert(
        '⚠️ 활동명 확인',
        '활동명을 입력하지 않으면 실명으로 게시됩니다.',
        [
          {
            text: '확인',
            onPress: () => {
              onComplete({ realName, nickname: realName, phone, address });
            }
          }
        ]
      );
      return;
    }

    onComplete({ realName, nickname: nickname.trim(), phone, address });
  };

  return (
    <View style={s.container}>
      <View style={s.headerOfficialClean}>
        <TouchableOpacity onPress={onBack} style={s.navBackBtn}><Text style={s.navBackBtnText}>‹ 이전</Text></TouchableOpacity>
        <Text style={s.headerTitleClean}>{isSocial ? `${authMethod} 간편가입 프로필` : '휴대폰 본인인증 가입'}</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={s.formContainerOfficial}>
        {isSocial && (
          <View style={s.socialVerifiedCard}>
            <Text style={s.socialVerifiedTitle}>✓ {authMethod} 계정 연동 완료</Text>
            <Text style={s.socialVerifiedSub}>서비스 활동에 사용할 실명과 닉네임을 설정해 주세요.</Text>
          </View>
        )}

        <Text style={s.labelOfficial}>이름 (실명) *</Text>
        <TextInput style={s.inputOfficial} placeholder="실명을 입력해 주세요" value={realName} onChangeText={setRealName} />

        <Text style={[s.labelOfficial, { marginTop: 12 }]}>앱 활동명 (닉네임)</Text>
        <TextInput style={s.inputOfficial} placeholder="예: 수리고수, 용봉동주민" value={nickname} onChangeText={setNickname} />
        <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2, marginBottom: 8 }}>
          ※ 활동명을 입력하지 않으시면 실명({realName || '홍길동'})으로 활동하게 됩니다.
        </Text>

        {!isSocial && (
          <View>
            <Text style={s.labelOfficial}>휴대폰 번호 *</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
              <TextInput
                style={[s.inputOfficial, { flex: 1, marginBottom: 0 }]}
                placeholder="01012345678"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                editable={!smsVerified}
              />
              <TouchableOpacity style={[s.smsSendActionBtnPastelRed, smsVerified && { backgroundColor: '#bbb' }]} onPress={handleSendSms} disabled={smsVerified}>
                <Text style={s.smsSendActionBtnText}>{smsSent ? '재발송' : '인증번호 받기'}</Text>
              </TouchableOpacity>
            </View>

            {smsSent && !smsVerified && (
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                <TextInput
                  style={[s.inputOfficial, { flex: 1, marginBottom: 0, borderColor: '#ef4444' }]}
                  placeholder="인증번호 6자리 (테스트: 123456)"
                  keyboardType="numeric"
                  value={smsCode}
                  onChangeText={setSmsCode}
                />
                <TouchableOpacity style={s.smsVerifyActionBtnPastelRed} onPress={handleVerifySms}>
                  <Text style={s.smsVerifyActionBtnText}>확인</Text>
                </TouchableOpacity>
              </View>
            )}
            {smsVerified && <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: 'bold', marginBottom: 8 }}>✓ 휴대폰 본인인증 완료</Text>}
          </View>
        )}

        <Text style={s.labelOfficial}>거주 및 활동 지역 (시/군/구 동) *</Text>
        <TextInput style={s.inputOfficial} placeholder="예: 광주광역시 북구 용봉동" value={address} onChangeText={setAddress} />

        <TouchableOpacity style={s.primaryPastelRedButton} onPress={handleSubmit}>
          <Text style={s.primaryButtonText}>가입 완료하고 메인 홈으로 이동 ›</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export function TechWizardScreen({ role, onComplete, onBack }) {
  const isCompany = role === 'company';
  const [step, setStep] = useState(1);
  const [techName, setTechName] = useState('서한영 대표');
  const [techPhone, setTechPhone] = useState('010-9999-8888');
  const [techRegion, setTechRegion] = useState('광주광역시 북구/광산구');
  const [techRadius, setTechRadius] = useState('10km');
  const [primaryField, setPrimaryField] = useState('설비/종합');
  const [secondaryFields, setSecondaryFields] = useState(['싱크대/가구']);
  const [businessNumber, setBusinessNumber] = useState('');
  const [techBio, setTechBio] = useState('30년 국가공인 베테랑 마스터, 책임 시공 및 신속 출동');

  const [selectedPlanType, setSelectedPlanType] = useState('pro');
  const [selectedDuration, setSelectedDuration] = useState('1m');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [techPayMethod, setTechPayMethod] = useState('card');

  const prices = isCompany
    ? { '1m': '49,000원', '3m': '129,000원', '1y': '440,000원' }
    : { '1m': '19,000원', '3m': '49,000원', '1y': '179,000원' };

  const isMovingSelected = primaryField.includes('이사') || secondaryFields.some(f => f.includes('이사'));

  const toggleSecondaryField = (fieldName) => {
    if (primaryField === fieldName) return Alert.alert('확인', '주 전문분야로 이미 선택된 분야입니다.');
    if (secondaryFields.includes(fieldName)) {
      setSecondaryFields(prev => prev.filter(f => f !== fieldName));
    } else {
      if (secondaryFields.length >= 2) return Alert.alert('선택 제한', '서브 전문분야는 최대 2개까지만 선택 가능합니다.');
      setSecondaryFields(prev => [...prev, fieldName]);
    }
  };

  const handleFinishTechReg = (plan) => {
    onComplete({
      techName,
      techPhone,
      techRegion,
      techRadius,
      primaryField,
      secondaryFields,
      businessNumber,
      techBio,
      planType: plan,
      duration: selectedDuration
    });
  };

  return (
    <View style={s.container}>
      <View style={s.headerOfficialClean}>
        <TouchableOpacity onPress={() => step === 1 ? onBack() : setStep(step - 1)} style={s.navBackBtn}>
          <Text style={s.navBackBtnText}>‹ 이전</Text>
        </TouchableOpacity>
        <Text style={s.headerTitleClean}>
          {step === 3 ? '소개 및 플랜 (3/3)' : `${isCompany ? '업체(회사)' : '기술자/고수'} 등록 (${step}/3)`}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.formContainerOfficial}>
        {step === 1 && (
          <View>
            <Text style={s.labelOfficial}>{isCompany ? '상호명 및 대표자명 *' : '이름 / 대표자명 *'}</Text>
            <TextInput style={s.inputOfficial} value={techName} onChangeText={setTechName} />

            {isCompany && (
              <View>
                <Text style={s.labelOfficial}>🏢 사업자등록번호 (10자리 필수) *</Text>
                <TextInput 
                  style={[s.inputOfficial, { borderColor: '#10b981' }]} 
                  placeholder="예: 123-45-67890 (숫자 10자리)" 
                  value={businessNumber} 
                  onChangeText={setBusinessNumber} 
                />
              </View>
            )}

            <Text style={s.labelOfficial}>직통 연락처 (휴대폰) *</Text>
            <TextInput style={s.inputOfficial} keyboardType="phone-pad" value={techPhone} onChangeText={setTechPhone} />
            <Text style={s.labelOfficial}>주요 활동 중심 지역 *</Text>
            <TextInput style={s.inputOfficial} value={techRegion} onChangeText={setTechRegion} />

            <Text style={[s.labelOfficial, { marginTop: 12 }]}>📍 출동 가능 활동 반경 *</Text>
            <View style={s.radiusTabBarWrap}>
              {RADIUS_OPTIONS.map((rad) => (
                <TouchableOpacity key={rad} style={[s.radiusTabItem, techRadius === rad && s.radiusTabItemActivePastelRed]} onPress={() => setTechRadius(rad)}>
                  <Text style={[s.radiusTabText, techRadius === rad && s.radiusTabTextActive]}>{rad}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={s.primaryPastelRedButton} 
              onPress={() => {
                if (isCompany && (!businessNumber.trim() || businessNumber.replace(/-/g, '').length < 10)) {
                  return Alert.alert('사업자번호 필수', '업체 회원은 10자리 사업자등록번호를 정확히 입력해 주세요.');
                }
                setStep(2);
              }}
            >
              <Text style={s.primaryButtonText}>다음: 전문 기술 선택하기 ›</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={s.labelOfficial}>대표 주 전문분야 (단일 선택) *</Text>
            <View style={s.techFieldGrid2Col}>
              {TECH_CATEGORIES.map((cat) => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[s.techFieldGridItem, primaryField === cat.name && s.techFieldGridItemActivePastelRed]} 
                  onPress={() => { setPrimaryField(cat.name); setSecondaryFields(prev => prev.filter(f => f !== cat.name)); }}
                >
                  <Text style={{ fontSize: 18, marginRight: 6 }}>{cat.icon}</Text>
                  <Text style={[s.techFieldGridText, primaryField === cat.name && { color: '#fff', fontWeight: 'bold' }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.labelOfficial, { marginTop: 18 }]}>서브(보조) 전문분야 (최대 2개) ({secondaryFields.length}/2개)</Text>
            <View style={s.techFieldGrid2Col}>
              {TECH_CATEGORIES.filter(c => c.name !== primaryField).map((cat) => {
                const isChecked = secondaryFields.includes(cat.name);
                return (
                  <TouchableOpacity 
                    key={cat.id} 
                    style={[s.techFieldGridItem, isChecked && s.techFieldGridItemActiveSecondary]} 
                    onPress={() => toggleSecondaryField(cat.name)}
                  >
                    <Text style={{ fontSize: 18, marginRight: 6 }}>{cat.icon}</Text>
                    <Text style={[s.techFieldGridText, isChecked && { color: '#ef4444', fontWeight: 'bold' }]}>
                      {isChecked ? `✓ ${cat.name}` : cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {(!isCompany && isMovingSelected) && (
              <View style={s.businessVerifyAlertBox}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#b91c1c' }}>🚨 화물자동차 운송사업자 등록번호 필수</Text>
                <TextInput
                  style={[s.inputOfficial, { marginTop: 6, borderColor: '#ef4444', backgroundColor: '#fff' }]}
                  placeholder="사업자등록번호 10자리 입력"
                  value={businessNumber}
                  onChangeText={setBusinessNumber}
                />
              </View>
            )}

            <TouchableOpacity 
              style={s.primaryPastelRedButton} 
              onPress={() => {
                if (isMovingSelected && (!businessNumber.trim() || businessNumber.replace(/-/g, '').length < 10)) {
                  return Alert.alert('등록 차단', '이사/배송 분야는 관련 법령 준수를 위해 사업자번호(10자리)를 반드시 입력하셔야 합니다.');
                }
                setStep(3);
              }}
            >
              <Text style={s.primaryButtonText}>다음: 소개 및 플랜 선택 (3/3) ›</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={s.labelOfficial}>간략 자기소개 및 경력 (필수) *</Text>
            <TextInput 
              style={[s.inputOfficial, { height: 75, textAlignVertical: 'top' }]} 
              placeholder="예: 30년 국가공인 설비 마스터, 신속 출동 및 책임 시공 보증" 
              value={techBio} 
              onChangeText={setTechBio} 
              multiline 
            />

            <Text style={[s.captureSectionHeader, { marginTop: 14 }]}>활동 멤버십 플랜 선택</Text>

            <TouchableOpacity 
              style={[s.capturePlanCard, selectedPlanType === 'free' && s.capturePlanCardSelectedFree]}
              onPress={() => setSelectedPlanType('free')}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={s.capturePlanCardTitle}>일반 파트너 (무료)</Text>
                <View style={s.freeBadgePill}><Text style={s.freeBadgeText}>평생 무료</Text></View>
              </View>
              <Text style={s.capturePlanCardSub}>
                <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#111827' }}>0원</Text> / 수수료 0원 직거래
              </Text>
              <Text style={s.freeLimitBulletText}>
                • 하루 최대 2회 한정 오더 알림 제공 (초과 시 연결 제한)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[s.captureProCard, selectedPlanType === 'pro' && s.captureProCardSelected]}
              onPress={() => setSelectedPlanType('pro')}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={s.captureProCardTitle}>
                  👑 프로 파트너 (0초 우선배차) {isCompany && '<업체전용>'}
                </Text>
                <View style={s.recommendBadgePill}><Text style={s.recommendBadgeText}>추천 1위</Text></View>
              </View>

              <View style={s.durationTabRow}>
                <TouchableOpacity 
                  style={[s.durationTabBtn, selectedDuration === '1m' && s.durationTabBtnActivePastelRed]}
                  onPress={() => { setSelectedPlanType('pro'); setSelectedDuration('1m'); }}
                >
                  <Text style={[s.durationTabPeriodText, selectedDuration === '1m' && s.durationTabTextActive]}>1개월</Text>
                  <Text style={[s.durationTabPriceText, selectedDuration === '1m' && s.durationTabTextActive]}>{prices['1m']}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[s.durationTabBtn, selectedDuration === '3m' && s.durationTabBtnActivePastelRed]}
                  onPress={() => { setSelectedPlanType('pro'); setSelectedDuration('3m'); }}
                >
                  <Text style={[s.durationTabPeriodText, selectedDuration === '3m' && s.durationTabTextActive]}>3개월 (15%↓)</Text>
                  <Text style={[s.durationTabPriceText, selectedDuration === '3m' && s.durationTabTextActive]}>{prices['3m']}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[s.durationTabBtn, selectedDuration === '1y' && s.durationTabBtnActivePastelRed]}
                  onPress={() => { setSelectedPlanType('pro'); setSelectedDuration('1y'); }}
                >
                  <Text style={[s.durationTabPeriodText, selectedDuration === '1y' && s.durationTabTextActive]}>1년 (25%↓)</Text>
                  <Text style={[s.durationTabPriceText, selectedDuration === '1y' && s.durationTabTextActive]}>{prices['1y']}</Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 10, gap: 4 }}>
                <Text style={s.proBenefitBullet}>⚡ 신규 콜 0초 즉시 우선 배당 알림</Text>
                <Text style={s.proBenefitBullet}>👑 목록 최상단 골드 마크 인증 배지 부착</Text>
                <Text style={s.proBenefitBullet}>💬 고객 다이렉트 1:1 연결톡 무제한 연결</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={s.captureSubmitBigBtnPastelRed} 
              onPress={() => {
                if (selectedPlanType === 'pro') {
                  setPaymentModalVisible(true);
                } else {
                  Alert.alert('가입 승인 완료 🎉', '일반 파트너로 등록되었습니다! 고객 요청콜 화면으로 이동합니다.');
                  handleFinishTechReg('free');
                }
              }}
            >
              <Text style={s.captureSubmitBigBtnText}>
                {selectedPlanType === 'pro' ? `멤버십 결제 진행하기 (${prices[selectedDuration]}) ›` : '가입 완료하고 고객요청콜 확인하기 ›'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={paymentModalVisible} transparent animationType="fade">
        <View style={s.modalCenterOverlay}>
          <View style={s.popCardModal}>
            <Text style={s.popTitleClean}>💳 멤버십 결제 수단 선택</Text>
            <Text style={{ fontSize: 13, color: '#334155', marginVertical: 8 }}>
              결제 상품: <Text style={{ fontWeight: 'bold', color: '#ef4444' }}>프로 파트너 {selectedDuration === '1m' ? '1개월' : selectedDuration === '3m' ? '3개월' : '1년'}</Text>{'\n'}
              결제 금액: <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>{prices[selectedDuration]}</Text>
            </Text>

            <View style={{ gap: 6, marginVertical: 10 }}>
              {[
                { id: 'card', name: '💳 신용 / 체크카드 (일반/법인)' },
                { id: 'kakao', name: '💬 카카오페이 간편결제' },
                { id: 'naver', name: '🟢 네이버페이' },
                { id: 'toss', name: '🔵 토스페이' }
              ].map(p => (
                <TouchableOpacity 
                  key={p.id} 
                  style={[s.paySelectRow, techPayMethod === p.id && s.paySelectRowActivePastelRed]} 
                  onPress={() => setTechPayMethod(p.id)}
                >
                  <Text style={[s.paySelectText, techPayMethod === p.id && s.paySelectTextActivePastelRed]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ gap: 8, marginTop: 6 }}>
              <TouchableOpacity 
                style={{ backgroundColor: '#f87171', paddingVertical: 13, borderRadius: 8, alignItems: 'center' }} 
                onPress={() => {
                  setPaymentModalVisible(false);
                  Alert.alert('결제 및 가입 완료 🎉', `[프로 파트너 ${prices[selectedDuration]}] 결제가 정상 승인되었습니다!\n지금부터 관내 고객 요청콜이 0초 만에 우선 배차됩니다.`);
                  handleFinishTechReg('pro');
                }}
              >
                <Text style={{ color: '#fff', fontSize: 14.5, fontWeight: 'bold' }}>{prices[selectedDuration]} 안전결제 승인</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ backgroundColor: '#f1f5f9', paddingVertical: 10, borderRadius: 8, alignItems: 'center' }} 
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={{ color: '#64748b', fontSize: 13, fontWeight: 'bold' }}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingTop: 40 },
  topBarSkip: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 6 },
  skipBtnTouch: { paddingVertical: 6, paddingHorizontal: 10 },
  skipBtnText: { fontSize: 13.5, color: '#475569', fontWeight: 'bold' },

  landingCenterOfficial: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  officialHouseIconBox: { width: 76, height: 76, borderRadius: 22, backgroundColor: '#f1f8e9', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  officialMainTitle: { fontSize: 26, fontWeight: 'bold', color: '#1a73e8', marginBottom: 4 },
  officialMainSub: { fontSize: 12, color: '#4b5563', textAlign: 'center', marginBottom: 24 },
  officialCardList: { width: '100%', gap: 10 },

  cardCustomerOfficial: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f7ff', borderWidth: 1.5, borderColor: '#2563eb', padding: 14, borderRadius: 10 },
  cardCustomerTitle: { fontSize: 15, fontWeight: 'bold', color: '#1d4ed8' },
  cardCustomerSub: { fontSize: 11, color: '#4b5563', marginTop: 2 },
  cardArrowBlue: { fontSize: 20, color: '#2563eb', fontWeight: 'bold' },

  cardTechOfficial: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbf0', borderWidth: 1.5, borderColor: '#f59e0b', padding: 14, borderRadius: 10 },
  cardTechTitle: { fontSize: 15, fontWeight: 'bold', color: '#b45309' },
  cardTechSub: { fontSize: 11, color: '#4b5563', marginTop: 2 },
  cardArrowOrange: { fontSize: 20, color: '#f59e0b', fontWeight: 'bold' },

  cardCompanyOfficial: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#10b981', padding: 14, borderRadius: 10 },
  cardCompanyTitle: { fontSize: 15, fontWeight: 'bold', color: '#047857' },
  cardCompanySub: { fontSize: 11, color: '#4b5563', marginTop: 2 },
  cardArrowSky: { fontSize: 20, color: '#10b981', fontWeight: 'bold' },

  headerOfficialClean: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 8, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  headerTitleClean: { fontSize: 15.5, fontWeight: 'bold', textAlign: 'center', flex: 1, color: '#111827' },
  navBackBtn: { paddingVertical: 4, minWidth: 44 },
  navBackBtnText: { fontSize: 14, color: '#2563eb', fontWeight: 'bold' },
  formContainerOfficial: { padding: 14, paddingBottom: 130 },

  authSelectBoxBody: { paddingHorizontal: 20, paddingTop: 36 },
  kakaoBigBtn: { backgroundColor: '#FEE500', height: 56, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  kakaoBigBtnText: { color: '#191919', fontSize: 14.5, fontWeight: 'bold' },
  googleBigBtn: { backgroundColor: '#ffffff', borderWidth: 1.2, borderColor: '#e5e7eb', height: 56, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  googleBigBtnText: { color: '#1f2937', fontSize: 14.5, fontWeight: '600' },
  phoneBigBtnCenteredPastelRed: { backgroundColor: '#f87171', height: 56, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  phoneBigBtnCenteredText: { color: '#ffffff', fontSize: 13.5, fontWeight: 'bold' },

  socialVerifiedCard: { backgroundColor: '#f0fdf4', borderWidth: 1.2, borderColor: '#86efac', borderRadius: 8, padding: 12, marginBottom: 14 },
  socialVerifiedTitle: { fontSize: 13, fontWeight: 'bold', color: '#16a34a' },
  socialVerifiedSub: { fontSize: 11.5, color: '#4b5563', marginTop: 2 },

  labelOfficial: { fontSize: 12.5, fontWeight: 'bold', color: '#1f2937', marginTop: 8, marginBottom: 4 },
  inputOfficial: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, marginBottom: 4 },
  primaryButton: { paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  primaryPastelRedButton: { backgroundColor: '#f87171', paddingVertical: 13, borderRadius: 8, alignItems: 'center', marginTop: 14, elevation: 2 },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },

  smsSendActionBtnPastelRed: { backgroundColor: '#f87171', paddingHorizontal: 10, justifyContent: 'center', borderRadius: 6 },
  smsSendActionBtnText: { color: '#fff', fontSize: 11.5, fontWeight: 'bold' },
  smsVerifyActionBtnPastelRed: { backgroundColor: '#ef4444', paddingHorizontal: 12, justifyContent: 'center', borderRadius: 6 },
  smsVerifyActionBtnText: { color: '#fff', fontSize: 11.5, fontWeight: 'bold' },

  radiusTabBarWrap: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 3, marginVertical: 4 },
  radiusTabItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  radiusTabItemActivePastelRed: { backgroundColor: '#f87171' },
  radiusTabText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  radiusTabTextActive: { color: '#ffffff', fontWeight: 'bold' },

  techFieldGrid2Col: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  techFieldGridItem: { width: '48.5%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, padding: 9 },
  techFieldGridItemActivePastelRed: { backgroundColor: '#f87171', borderColor: '#ef4444' },
  techFieldGridItemActiveSecondary: { backgroundColor: '#fef2f2', borderColor: '#fca5a5', borderWidth: 1.5 },
  techFieldGridText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  businessVerifyAlertBox: { backgroundColor: '#fef2f2', borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 8, padding: 10, marginTop: 12 },

  captureSectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  capturePlanCard: { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, marginBottom: 10 },
  capturePlanCardSelectedFree: { borderColor: '#f87171', backgroundColor: '#fff5f5' },
  capturePlanCardTitle: { fontSize: 14.5, fontWeight: 'bold', color: '#111827' },
  freeBadgePill: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  freeBadgeText: { fontSize: 10.5, color: '#475569', fontWeight: 'bold' },
  capturePlanCardSub: { fontSize: 13, color: '#4b5563', marginVertical: 3 },
  freeLimitBulletText: { fontSize: 11.5, color: '#dc2626', fontWeight: 'bold', marginTop: 2 },

  captureProCard: { backgroundColor: '#fffbeb', borderWidth: 1.5, borderColor: '#fed7aa', borderRadius: 10, padding: 12, marginBottom: 12 },
  captureProCardSelected: { borderColor: '#ef4444', borderWidth: 2 },
  captureProCardTitle: { fontSize: 14.5, fontWeight: 'bold', color: '#b45309' },
  recommendBadgePill: { backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  recommendBadgeText: { fontSize: 10.5, color: '#ffffff', fontWeight: 'bold' },

  durationTabRow: { flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 6 },
  durationTabBtn: { flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#fcd34d', borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  durationTabBtnActivePastelRed: { backgroundColor: '#f87171', borderColor: '#ef4444' },
  durationTabPeriodText: { fontSize: 11, color: '#475569', fontWeight: 'bold' },
  durationTabPriceText: { fontSize: 12.5, color: '#111827', fontWeight: 'bold', marginTop: 2 },
  durationTabTextActive: { color: '#ffffff' },

  proBenefitBullet: { fontSize: 11.5, color: '#92400e', fontWeight: '500' },
  captureSubmitBigBtnPastelRed: { backgroundColor: '#f87171', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10, elevation: 2 },
  captureSubmitBigBtnText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },

  modalCenterOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  popCardModal: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 18, elevation: 8 },
  popTitleClean: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  paySelectRow: { paddingVertical: 11, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1.2, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  paySelectRowActivePastelRed: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  paySelectText: { fontSize: 13, color: '#334155', fontWeight: '500' },
  paySelectTextActivePastelRed: { color: '#dc2626', fontWeight: 'bold' }
});