// SpecialScreens.js - 수리수리 AI 특화 서비스 (몸통 PB 15mm / 도어 UV 18mm 완전 무결정본)
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// ==========================================
// 1. 단순인력 직거래 화면
// ==========================================
export function SimpleLaborScreen({ onBack, onComplete }) {
  const [laborType, setLaborType] = useState('단순운반');
  const [laborWage, setLaborWage] = useState('130000');
  const [laborAddr, setLaborAddr] = useState('광주광역시 북구 용봉동');
  const [laborDesc, setLaborDesc] = useState('');
  const [laborPhotos, setLaborPhotos] = useState([]);
  
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiVerifyStep, setAiVerifyStep] = useState('question');
  const [aiResult, setAiResult] = useState(null);

  const runAiDiagnosis = (photos) => {
    setIsAiAnalyzing(true);
    setTimeout(() => {
      setIsAiAnalyzing(false);
      setAiResult({
        category: '단순인력',
        title: laborType + ' - 소파 및 중량물 운반 (보통 작업 난이도)',
        range: '120,000원 ~ 140,000원',
        recommended: '130000'
      });
      setLaborWage('130000');
      setAiVerifyStep('question');
      setAiModalVisible(true);
    }, 800);
  };

  const handleCapturePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('권한 필요', '카메라 권한을 허용해 주세요.');

    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      const updatedPhotos = [...laborPhotos, res.assets[0].uri].slice(0, 5);
      setLaborPhotos(updatedPhotos);

      if (updatedPhotos.length >= 5) {
        Alert.alert('최대 촬영 완료', '최대 5장의 사진이 등록되어 AI 판독을 시작합니다.');
        runAiDiagnosis(updatedPhotos);
        return;
      }

      Alert.alert(
        '📷 사진 등록 완료 (' + updatedPhotos.length + '/5장)',
        '사진을 더 촬영하시겠습니까, 아니면 AI 판독을 시작하시겠습니까?',
        [
          { text: '📷 더 촬영하기', onPress: () => handleCapturePhoto() },
          { text: '⚡ AI 판독 시작', onPress: () => runAiDiagnosis(updatedPhotos) }
        ]
      );
    }
  };

  const handlePickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsMultipleSelection: true });
    if (!res.canceled && res.assets) {
      const uris = res.assets.map(a => a.uri);
      const updatedPhotos = [...laborPhotos, ...uris].slice(0, 5);
      setLaborPhotos(updatedPhotos);
      Alert.alert(
        '🖼️ 사진 등록 완료 (' + updatedPhotos.length + '/5장)',
        'AI 작업강도 판독을 시작하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '⚡ AI 판독 시작', onPress: () => runAiDiagnosis(updatedPhotos) }
        ]
      );
    }
  };

  const handleOpenPhotoChoice = () => {
    Alert.alert('현장 사진 등록 (최소 1장 ~ 최대 5장)', '등록 방식을 선택해 주세요.', [
      { text: '📷 카메라 촬영', onPress: handleCapturePhoto },
      { text: '🖼️ 갤러리에서 선택', onPress: handlePickFromGallery },
      { text: '취소', style: 'cancel' }
    ]);
  };

  const handleFinalSubmit = () => {
    if (!laborWage.trim()) return Alert.alert('확인', '지급 희망 일당을 입력해 주세요.');
    Alert.alert(
      '인력 요청 접수 완료 🚀',
      '[해당공정: 단순인력]\n일당 ' + Number(laborWage).toLocaleString() + '원으로 관내 전문 인력팀에 실시간 전송되었습니다!'
    );
    setAiModalVisible(false);
    onComplete();
  };

  return (
    <View style={s.container}>
      <View style={s.headerOfficialClean}>
        <TouchableOpacity onPress={onBack} style={s.navBackBtn}><Text style={s.navBackBtnText}>‹ 홈으로</Text></TouchableOpacity>
        <Text style={s.headerTitleClean}>💪 단순인력 직거래 접수</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.formContainerOfficial}>
        <Text style={s.labelOfficial}>작업 유형 선택 *</Text>
        <View style={s.tagWrapRow}>
          {['단순운반', '자재정리', '농작업도움', '행사보조'].map(t => (
            <TouchableOpacity key={t} style={[s.pillBtn, laborType === t && s.pillBtnActive]} onPress={() => setLaborType(t)}>
              <Text style={[s.pillBtnText, laborType === t && s.pillBtnTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.labelOfficial, { marginTop: 12 }]}>📷 현장 사진 등록 (최소 1장~최대 5장) *</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginVertical: 6 }}>
          <TouchableOpacity style={s.addPhotoBtn} onPress={handleOpenPhotoChoice}>
            <Text style={{ fontSize: 20 }}>📷</Text>
            <Text style={{ fontSize: 10, color: '#2563eb', fontWeight: 'bold' }}>{laborPhotos.length}/5장 추가</Text>
          </TouchableOpacity>
          <ScrollView horizontal>
            {laborPhotos.map((uri, idx) => (
              <Image key={idx} source={{ uri }} style={s.photoThumb} />
            ))}
          </ScrollView>
        </View>

        {laborPhotos.length > 0 && (
          <TouchableOpacity style={s.aiQuickTriggerBtn} onPress={() => runAiDiagnosis(laborPhotos)}>
            <Text style={s.aiQuickTriggerBtnText}>
              {isAiAnalyzing ? '🔄 AI 분석 중...' : '⚡ 등록된 사진으로 AI 판독 시작하기'}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={s.labelOfficial}>지급 희망 일당 (원) *</Text>
        <TextInput style={s.inputOfficial} keyboardType="numeric" value={laborWage} onChangeText={setLaborWage} />

        <Text style={s.labelOfficial}>작업 현장 주소 *</Text>
        <TextInput style={s.inputOfficial} value={laborAddr} onChangeText={setLaborAddr} />

        <Text style={s.labelOfficial}>상세 작업 요청 내용 *</Text>
        <TextInput
          style={[s.inputOfficial, { height: 75, textAlignVertical: 'top' }]}
          placeholder="예: 2층 소파 및 가구 운반 도움 필요 (엘리베이터 없음)"
          value={laborDesc}
          onChangeText={setLaborDesc}
          multiline
        />

        <TouchableOpacity style={s.primaryPastelRedButtonLarge} onPress={handleFinalSubmit}>
          <Text style={s.primaryButtonTextLarge}>🚀 실시간 인력 요청 접수하기</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={aiModalVisible} animationType="slide">
        <View style={s.container}>
          <View style={s.headerOfficialClean}>
            <TouchableOpacity onPress={() => setAiModalVisible(false)} style={s.navBackBtn}><Text style={s.navBackBtnText}>✕ 닫기</Text></TouchableOpacity>
            <Text style={s.headerTitleClean}>🤖 AI 작업강도 판독</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={s.formContainerOfficial}>
            <View style={s.aiResultBannerCard}>
              <View style={s.aiProcessTagRow}>
                <Text style={s.aiProcessTagLabel}>해당공정:</Text>
                <View style={s.aiProcessTagBadge}><Text style={s.aiProcessTagBadgeText}>단순인력</Text></View>
              </View>
              <Text style={s.aiDiagnosisTitleText}>{aiResult?.title}</Text>
              <View style={s.aiPriceRow}>
                <Text style={s.aiPriceLabel}>AI 권장시세:</Text>
                <Text style={s.aiPriceRangeValue}>{aiResult?.range}</Text>
              </View>
            </View>

            {aiVerifyStep === 'question' && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 14.5, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 14 }}>
                  ❓ AI가 판독한 위 작업 내용이 맞습니까?
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#16a34a', paddingVertical: 13, borderRadius: 8, alignItems: 'center' }}
                    onPress={() => setAiVerifyStep('final_price_input')}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>예</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#ea580c', paddingVertical: 13, borderRadius: 8, alignItems: 'center' }}
                    onPress={() => setAiVerifyStep('manual_edit')}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>아니오</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {aiVerifyStep === 'manual_edit' && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 13, color: '#dc2626', fontWeight: 'bold', marginBottom: 6 }}>
                  ✍️ 실제 작업 내용을 직접 입력해 주세요.
                </Text>
                <TextInput
                  style={[s.inputOfficial, { height: 75, textAlignVertical: 'top' }]}
                  placeholder="예: 짐 운반 및 창고 정리 3시간 작업"
                  value={laborDesc}
                  onChangeText={setLaborDesc}
                  multiline
                />
                <TouchableOpacity
                  style={[s.primaryPastelRedButtonLarge, { marginTop: 10 }]}
                  onPress={() => setAiVerifyStep('final_price_input')}
                >
                  <Text style={s.primaryButtonTextLarge}>수정 내용 확정 및 금액 입력 ›</Text>
                </TouchableOpacity>
              </View>
            )}

            {aiVerifyStep === 'final_price_input' && (
              <View style={{ marginTop: 10 }}>
                <Text style={s.labelOfficial}>💰 고객 직접 지급 희망 일당 (원) 입력 *</Text>
                <TextInput
                  style={s.inputOfficial}
                  keyboardType="numeric"
                  value={laborWage}
                  onChangeText={setLaborWage}
                />

                <Text style={[s.labelOfficial, { marginTop: 10 }]}>작업 현장 주소 *</Text>
                <TextInput style={s.inputOfficial} value={laborAddr} onChangeText={setLaborAddr} />

                <TouchableOpacity style={s.primaryPastelRedButtonLarge} onPress={handleFinalSubmit}>
                  <Text style={s.primaryButtonTextLarge}>🚀 실시간 매칭콜 호출하기</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ backgroundColor: '#f1f5f9', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 8 }}
                  onPress={() => setAiVerifyStep('question')}
                >
                  <Text style={{ color: '#64748b', fontSize: 12.5, fontWeight: 'bold' }}>‹ 이전 판독 확인으로 돌아가기</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ==========================================
// 2. 청소/방역 직거래 화면
// ==========================================
export function CleaningScreen({ onBack, onComplete }) {
  const [cleaningType, setCleaningType] = useState('입주/이사청소');
  const [cleaningWage, setCleaningWage] = useState('250000');
  const [cleaningAddr, setCleaningAddr] = useState('광주광역시 북구 용봉동 아파트');
  const [cleaningDesc, setCleaningDesc] = useState('');
  const [cleaningPhotos, setCleaningPhotos] = useState([]);

  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiVerifyStep, setAiVerifyStep] = useState('question');
  const [aiResult, setAiResult] = useState(null);

  const runAiDiagnosis = (photos) => {
    setIsAiAnalyzing(true);
    setTimeout(() => {
      setIsAiAnalyzing(false);
      setAiResult({
        category: '청소/방역',
        title: cleaningType + ' - 24평형 아파트 (오염도 보통, 창틀 집중케어)',
        range: '240,000원 ~ 280,000원',
        recommended: '250000'
      });
      setCleaningWage('250000');
      setAiVerifyStep('question');
      setAiModalVisible(true);
    }, 800);
  };

  const handleCapturePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('권한 필요', '카메라 권한을 허용해 주세요.');

    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      const updatedPhotos = [...cleaningPhotos, res.assets[0].uri].slice(0, 5);
      setCleaningPhotos(updatedPhotos);

      if (updatedPhotos.length >= 5) {
        Alert.alert('최대 촬영 완료', '최대 5장의 사진이 등록되어 AI 판독을 시작합니다.');
        runAiDiagnosis(updatedPhotos);
        return;
      }

      Alert.alert(
        '📷 사진 등록 완료 (' + updatedPhotos.length + '/5장)',
        '사진을 더 촬영하시겠습니까, 아니면 AI 판독을 시작하시겠습니까?',
        [
          { text: '📷 더 촬영하기', onPress: () => handleCapturePhoto() },
          { text: '⚡ AI 판독 시작', onPress: () => runAiDiagnosis(updatedPhotos) }
        ]
      );
    }
  };

  const handlePickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsMultipleSelection: true });
    if (!res.canceled && res.assets) {
      const uris = res.assets.map(a => a.uri);
      const updatedPhotos = [...cleaningPhotos, ...uris].slice(0, 5);
      setCleaningPhotos(updatedPhotos);
      Alert.alert(
        '🖼️ 사진 등록 완료 (' + updatedPhotos.length + '/5장)',
        'AI 청소 견적 판독을 시작하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '⚡ AI 판독 시작', onPress: () => runAiDiagnosis(updatedPhotos) }
        ]
      );
    }
  };

  const handleOpenPhotoChoice = () => {
    Alert.alert('청소 부위 사진 등록 (최소 1장 ~ 최대 5장)', '등록 방식을 선택해 주세요.', [
      { text: '📷 카메라 촬영', onPress: handleCapturePhoto },
      { text: '🖼️ 갤러리에서 선택', onPress: handlePickFromGallery },
      { text: '취소', style: 'cancel' }
    ]);
  };

  const handleFinalSubmit = () => {
    if (!cleaningWage.trim()) return Alert.alert('확인', '지급 희망 견적을 입력해 주세요.');
    Alert.alert(
      '청소/방역 접수 완료 🚀',
      '[해당공정: 청소/방역]\n견적 ' + Number(cleaningWage).toLocaleString() + '원으로 관내 전문 청소팀에 실시간 전송되었습니다!'
    );
    setAiModalVisible(false);
    onComplete();
  };

  return (
    <View style={s.container}>
      <View style={s.headerOfficialClean}>
        <TouchableOpacity onPress={onBack} style={s.navBackBtn}><Text style={s.navBackBtnText}>‹ 홈으로</Text></TouchableOpacity>
        <Text style={s.headerTitleClean}>🧹 청소/방역 직거래 접수</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.formContainerOfficial}>
        <Text style={s.labelOfficial}>청소 종류 선택 *</Text>
        <View style={s.tagWrapRow}>
          {['입주/이사청소', '원룸/거주청소', '에어컨/세탁기분해', '상가/준공청소'].map(t => (
            <TouchableOpacity key={t} style={[s.pillBtn, cleaningType === t && s.pillBtnActive]} onPress={() => setCleaningType(t)}>
              <Text style={[s.pillBtnText, cleaningType === t && s.pillBtnTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.labelOfficial, { marginTop: 12 }]}>📷 현장 사진 등록 (최소 1장~최대 5장) *</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginVertical: 6 }}>
          <TouchableOpacity style={s.addPhotoBtn} onPress={handleOpenPhotoChoice}>
            <Text style={{ fontSize: 20 }}>📷</Text>
            <Text style={{ fontSize: 10, color: '#2563eb', fontWeight: 'bold' }}>{cleaningPhotos.length}/5장 추가</Text>
          </TouchableOpacity>
          <ScrollView horizontal>
            {cleaningPhotos.map((uri, idx) => (
              <Image key={idx} source={{ uri }} style={s.photoThumb} />
            ))}
          </ScrollView>
        </View>

        {cleaningPhotos.length > 0 && (
          <TouchableOpacity style={s.aiQuickTriggerBtn} onPress={() => runAiDiagnosis(cleaningPhotos)}>
            <Text style={s.aiQuickTriggerBtnText}>
              {isAiAnalyzing ? '🔄 AI 분석 중...' : '⚡ 등록된 사진으로 AI 판독 시작하기'}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={s.labelOfficial}>지급 희망 금액 (원) *</Text>
        <TextInput style={s.inputOfficial} keyboardType="numeric" value={cleaningWage} onChangeText={setCleaningWage} />

        <Text style={s.labelOfficial}>현장 주소 *</Text>
        <TextInput style={s.inputOfficial} value={cleaningAddr} onChangeText={setCleaningAddr} />

        <Text style={s.labelOfficial}>상세 청소 요청 사항 *</Text>
        <TextInput
          style={[s.inputOfficial, { height: 75, textAlignVertical: 'top' }]}
          placeholder="예: 24평 아파트 공실 상태, 창틀 및 베란다 곰팡이 제거 희망"
          value={cleaningDesc}
          onChangeText={setCleaningDesc}
          multiline
        />

        <TouchableOpacity style={s.primaryPastelRedButtonLarge} onPress={handleFinalSubmit}>
          <Text style={s.primaryButtonTextLarge}>🚀 실시간 청소 요청 접수하기</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={aiModalVisible} animationType="slide">
        <View style={s.container}>
          <View style={s.headerOfficialClean}>
            <TouchableOpacity onPress={() => setAiModalVisible(false)} style={s.navBackBtn}><Text style={s.navBackBtnText}>✕ 닫기</Text></TouchableOpacity>
            <Text style={s.headerTitleClean}>🤖 AI 청소 견적 판독</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={s.formContainerOfficial}>
            <View style={s.aiResultBannerCard}>
              <View style={s.aiProcessTagRow}>
                <Text style={s.aiProcessTagLabel}>해당공정:</Text>
                <View style={s.aiProcessTagBadge}><Text style={s.aiProcessTagBadgeText}>청소/방역</Text></View>
              </View>
              <Text style={s.aiDiagnosisTitleText}>{aiResult?.title}</Text>
              <View style={s.aiPriceRow}>
                <Text style={s.aiPriceLabel}>AI 권장시세:</Text>
                <Text style={s.aiPriceRangeValue}>{aiResult?.range}</Text>
              </View>
            </View>

            {aiVerifyStep === 'question' && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 14.5, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 14 }}>
                  ❓ AI가 판독한 위 청소 범위가 맞습니까?
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#16a34a', paddingVertical: 13, borderRadius: 8, alignItems: 'center' }}
                    onPress={() => setAiVerifyStep('final_price_input')}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>예</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#ea580c', paddingVertical: 13, borderRadius: 8, alignItems: 'center' }}
                    onPress={() => setAiVerifyStep('manual_edit')}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>아니오</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {aiVerifyStep === 'manual_edit' && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 13, color: '#dc2626', fontWeight: 'bold', marginBottom: 6 }}>
                  ✍️ 실제 청소 범위를 직접 입력해 주세요.
                </Text>
                <TextInput
                  style={[s.inputOfficial, { height: 75, textAlignVertical: 'top' }]}
                  placeholder="예: 원룸 화장실 및 주방 집중 청소"
                  value={cleaningDesc}
                  onChangeText={setCleaningDesc}
                  multiline
                />
                <TouchableOpacity
                  style={[s.primaryPastelRedButtonLarge, { marginTop: 10 }]}
                  onPress={() => setAiVerifyStep('final_price_input')}
                >
                  <Text style={s.primaryButtonTextLarge}>수정 내용 확정 및 금액 입력 ›</Text>
                </TouchableOpacity>
              </View>
            )}

            {aiVerifyStep === 'final_price_input' && (
              <View style={{ marginTop: 10 }}>
                <Text style={s.labelOfficial}>💰 고객 직접 지급 희망 금액 (원) 입력 *</Text>
                <TextInput
                  style={s.inputOfficial}
                  keyboardType="numeric"
                  value={cleaningWage}
                  onChangeText={setCleaningWage}
                />

                <Text style={[s.labelOfficial, { marginTop: 10 }]}>청소 현장 주소 *</Text>
                <TextInput style={s.inputOfficial} value={cleaningAddr} onChangeText={setCleaningAddr} />

                <TouchableOpacity style={s.primaryPastelRedButtonLarge} onPress={handleFinalSubmit}>
                  <Text style={s.primaryButtonTextLarge}>🚀 실시간 매칭콜 호출하기</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ backgroundColor: '#f1f5f9', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 8 }}
                  onPress={() => setAiVerifyStep('question')}
                >
                  <Text style={{ color: '#64748b', fontSize: 12.5, fontWeight: 'bold' }}>‹ 이전 판독 확인으로 돌아가기</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ==========================================
// 3. 싱크대/가구 맞춤 직거래 화면 (몸통 PB 15mm, UV 18mm, 인조대리석, 수전 일체 완벽 복원)
// ==========================================
export function FurnitureKitchenScreen({ onBack, onComplete }) {
  const [itemType, setItemType] = useState('싱크대 전체맞춤');
  const [kitchenWidth, setKitchenWidth] = useState('2600');
  const [kitchenHeight, setKitchenHeight] = useState('2200');
  const [kitchenPrice, setKitchenPrice] = useState('1750000');
  const [kitchenAddr, setKitchenAddr] = useState('광주광역시 북구 용봉동');
  const [kitchenDesc, setKitchenDesc] = useState('');
  const [kitchenPhotos, setKitchenPhotos] = useState([]);

  const [isAiCalculating, setIsAiCalculating] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiVerifyStep, setAiVerifyStep] = useState('question');
  const [aiCalculatedResult, setAiCalculatedResult] = useState(null);

  const handleCapturePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('권한 필요', '카메라 권한을 허용해 주세요.');

    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      const updatedPhotos = [...kitchenPhotos, res.assets[0].uri].slice(0, 5);
      setKitchenPhotos(updatedPhotos);
      Alert.alert('📷 현장 사진 등록 (' + updatedPhotos.length + '/5장)', '치수(가로/세로)를 기입하신 후 AI 견적 산출을 눌러주세요.');
    }
  };

  const handlePickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsMultipleSelection: true });
    if (!res.canceled && res.assets) {
      const uris = res.assets.map(a => a.uri);
      const updatedPhotos = [...kitchenPhotos, ...uris].slice(0, 5);
      setKitchenPhotos(updatedPhotos);
    }
  };

  const handleCalculateAiQuote = () => {
    const w = parseInt(kitchenWidth, 10) || 2400;
    const h = parseInt(kitchenHeight, 10) || 2200;

    setIsAiCalculating(true);
    setTimeout(() => {
      setIsAiCalculating(false);

      let specDetail = '';
      let minPrice = 0;
      let maxPrice = 0;
      let baseRec = 0;

      if (itemType === '싱크대 전체맞춤') {
        const baseMeter = w / 1000;
        baseRec = Math.round(baseMeter * 670000);
        minPrice = baseRec - 80000;
        maxPrice = baseRec + 120000;
        specDetail = '[가로 ' + w + 'mm × 높이 ' + h + 'mm]\n' +
          '• 몸통(바디): 친환경 PB 합판 15mm 기준\n' +
          '• 도어: 고광택 UV 코팅 합판 18mm (댐퍼 힌지)\n' +
          '• 상판: 고급 인조대리석 상판 (12T/50T 마감)\n' +
          '• 수전/부속: KS 인증 최고급 수전 + 싱크볼 + 배수구 풀세트';
      } else if (itemType === '상판/도어 교체') {
        const baseMeter = w / 1000;
        baseRec = Math.round(baseMeter * 360000);
        minPrice = baseRec - 50000;
        maxPrice = baseRec + 70000;
        specDetail = '[가로 ' + w + 'mm 상판/도어 리폼]\n' +
          '• 몸통: 기존 수납장 유지 점검\n' +
          '• 도어: 고광택 UV 코팅 합판 18mm 전면 교체\n' +
          '• 상판: 인조대리석 상판 맞춤 교체 + KS 싱크 수전';
      } else if (itemType === '붙박이장') {
        const ja = w / 303;
        baseRec = Math.round(ja * 135000);
        minPrice = baseRec - 100000;
        maxPrice = baseRec + 150000;
        specDetail = '[가로 ' + w + 'mm (약 ' + ja.toFixed(1) + '자) × 높이 ' + h + 'mm]\n' +
          '• 몸통(내부장): 친환경 PB 합판 15mm 기준 격자 맞춤\n' +
          '• 도어: 고광택 UV 코팅 18mm 합판 (소음방지 댐퍼)\n' +
          '• 옷걸이봉, 타이걸이, 서랍 등 기본 풀옵션';
      } else {
        const baseMeter = w / 1000;
        baseRec = Math.round(baseMeter * 420000);
        minPrice = baseRec - 40000;
        maxPrice = baseRec + 60000;
        specDetail = '[가로 ' + w + 'mm × 높이 ' + h + 'mm 맞춤장]\n' +
          '• 몸통: 친환경 PB 합판 15mm 기준 촘촘 선반\n' +
          '• 도어: 고광택 UV 코팅 18mm 합판 (하부 띄움 시공 가능)';
      }

      setAiCalculatedResult({
        category: '싱크대/가구',
        title: itemType + ' AI 정밀 견적 산출',
        specs: specDetail,
        range: minPrice.toLocaleString() + '원 ~ ' + maxPrice.toLocaleString() + '원',
        recommended: String(baseRec)
      });
      setKitchenPrice(String(baseRec));
      setAiVerifyStep('question');
      setAiModalVisible(true);
    }, 600);
  };

  const handleFinalSubmit = () => {
    if (!kitchenPrice.trim()) return Alert.alert('확인', '희망 견적 금액을 입력해 주세요.');
    Alert.alert(
      '싱크대/가구 견적 요청 완료 🚀',
      '[해당공정: 싱크대/가구]\n몸통 PB 15mm / 도어 UV 18mm / 인조대리석 스펙으로\n희망금액 ' + Number(kitchenPrice).toLocaleString() + '원이 관내 전문 제작업체 및 시공마스터에 실시간 전송되었습니다!'
    );
    setAiModalVisible(false);
    onComplete();
  };

  return (
    <View style={s.container}>
      <View style={s.headerOfficialClean}>
        <TouchableOpacity onPress={onBack} style={s.navBackBtn}><Text style={s.navBackBtnText}>‹ 홈으로</Text></TouchableOpacity>
        <Text style={s.headerTitleClean}>🪑 싱크대/가구 맞춤 직거래</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.formContainerOfficial}>
        <Text style={s.labelOfficial}>맞춤 품목 선택 *</Text>
        <View style={s.tagWrapRow}>
          {['싱크대 전체맞춤', '상판/도어 교체', '붙박이장', '신발장/수납장'].map(t => (
            <TouchableOpacity key={t} style={[s.pillBtn, itemType === t && s.pillBtnActive]} onPress={() => setItemType(t)}>
              <Text style={[s.pillBtnText, itemType === t && s.pillBtnTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.labelOfficial, { marginTop: 12 }]}>📷 현장 실측 사진 등록 ({kitchenPhotos.length}/5장)</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginVertical: 6 }}>
          <TouchableOpacity style={s.addPhotoBtn} onPress={() => {
            Alert.alert('사진 등록', '방식을 선택해 주세요.', [
              { text: '📷 카메라 촬영', onPress: handleCapturePhoto },
              { text: '🖼️ 갤러리 선택', onPress: handlePickFromGallery },
              { text: '취소', style: 'cancel' }
            ]);
          }}>
            <Text style={{ fontSize: 20 }}>📷</Text>
            <Text style={{ fontSize: 10, color: '#2563eb', fontWeight: 'bold' }}>{kitchenPhotos.length}/5장 추가</Text>
          </TouchableOpacity>
          <ScrollView horizontal>
            {kitchenPhotos.map((uri, idx) => (
              <Image key={idx} source={{ uri }} style={s.photoThumb} />
            ))}
          </ScrollView>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.labelOfficial}>가로 실측 치수 (mm) *</Text>
            <TextInput
              style={s.inputOfficial}
              keyboardType="numeric"
              placeholder="예: 2600"
              value={kitchenWidth}
              onChangeText={setKitchenWidth}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.labelOfficial}>세로/높이 치수 (mm) *</Text>
            <TextInput
              style={s.inputOfficial}
              keyboardType="numeric"
              placeholder="예: 2200"
              value={kitchenHeight}
              onChangeText={setKitchenHeight}
            />
          </View>
        </View>

        <TouchableOpacity style={s.aiQuickTriggerBtn} onPress={handleCalculateAiQuote}>
          <Text style={s.aiQuickTriggerBtnText}>
            {isAiCalculating ? '🔄 표준 자재 견적 계산 중...' : '⚡ AI 자재 스펙(몸통 PB 15mm·UV 18mm) 표준 견적 산출'}
          </Text>
        </TouchableOpacity>

        <Text style={s.labelOfficial}>지급 희망 금액 (원) *</Text>
        <TextInput style={s.inputOfficial} keyboardType="numeric" value={kitchenPrice} onChangeText={setKitchenPrice} />

        <Text style={s.labelOfficial}>시공 현장 주소 *</Text>
        <TextInput style={s.inputOfficial} value={kitchenAddr} onChangeText={setKitchenAddr} />

        <Text style={s.labelOfficial}>상세 맞춤 요청사항 *</Text>
        <TextInput
          style={[s.inputOfficial, { height: 75, textAlignVertical: 'top' }]}
          placeholder="예: 쿡탑 매립 여부, 상부장 플랩장 구성 등 추가 요청사항 기입"
          value={kitchenDesc}
          onChangeText={setKitchenDesc}
          multiline
        />

        <TouchableOpacity style={s.primaryPastelRedButtonLarge} onPress={handleFinalSubmit}>
          <Text style={s.primaryButtonTextLarge}>🚀 실시간 맞춤 제작 견적 호출하기</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={aiModalVisible} animationType="slide">
        <View style={s.container}>
          <View style={s.headerOfficialClean}>
            <TouchableOpacity onPress={() => setAiModalVisible(false)} style={s.navBackBtn}><Text style={s.navBackBtnText}>✕ 닫기</Text></TouchableOpacity>
            <Text style={s.headerTitleClean}>🤖 AI 맞춤 가구 견적 산출</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={s.formContainerOfficial}>
            <View style={s.aiResultBannerCard}>
              <View style={s.aiProcessTagRow}>
                <Text style={s.aiProcessTagLabel}>해당공정:</Text>
                <View style={[s.aiProcessTagBadge, { backgroundColor: '#0284c7' }]}>
                  <Text style={s.aiProcessTagBadgeText}>싱크대/가구</Text>
                </View>
              </View>

              <Text style={s.aiDiagnosisTitleText}>{aiCalculatedResult?.title}</Text>
              
              <View style={s.specDetailBox}>
                <Text style={s.specDetailText}>{aiCalculatedResult?.specs}</Text>
              </View>

              <View style={s.aiPriceRow}>
                <Text style={s.aiPriceLabel}>AI 표준 권장시세:</Text>
                <Text style={s.aiPriceRangeValue}>{aiCalculatedResult?.range}</Text>
              </View>
            </View>

            {aiVerifyStep === 'question' && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 14.5, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 14 }}>
                  ❓ AI가 산출한 위 맞춤 스펙 및 견적이 맞습니까?
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#16a34a', paddingVertical: 13, borderRadius: 8, alignItems: 'center' }}
                    onPress={() => setAiVerifyStep('final_price_input')}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>예</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#ea580c', paddingVertical: 13, borderRadius: 8, alignItems: 'center' }}
                    onPress={() => setAiVerifyStep('manual_edit')}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>아니오</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {aiVerifyStep === 'manual_edit' && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 13, color: '#dc2626', fontWeight: 'bold', marginBottom: 6 }}>
                  ✍️ 원하는 자재 사양이나 상세 규격을 직접 입력해 주세요.
                </Text>
                <TextInput
                  style={[s.inputOfficial, { height: 75, textAlignVertical: 'top' }]}
                  placeholder="예: 상판을 최고급 칸스톤으로 변경 희망, 백조 싱크볼 사각볼 요청"
                  value={kitchenDesc}
                  onChangeText={setKitchenDesc}
                  multiline
                />
                <TouchableOpacity
                  style={[s.primaryPastelRedButtonLarge, { marginTop: 10 }]}
                  onPress={() => setAiVerifyStep('final_price_input')}
                >
                  <Text style={s.primaryButtonTextLarge}>수정 내용 확정 및 금액 입력 ›</Text>
                </TouchableOpacity>
              </View>
            )}

            {aiVerifyStep === 'final_price_input' && (
              <View style={{ marginTop: 10 }}>
                <Text style={s.labelOfficial}>💰 고객 직접 지급 희망 금액 (원) 입력 *</Text>
                <TextInput
                  style={s.inputOfficial}
                  keyboardType="numeric"
                  value={kitchenPrice}
                  onChangeText={setKitchenPrice}
                />

                <Text style={[s.labelOfficial, { marginTop: 10 }]}>시공 현장 주소 *</Text>
                <TextInput style={s.inputOfficial} value={kitchenAddr} onChangeText={setKitchenAddr} />

                <TouchableOpacity style={s.primaryPastelRedButtonLarge} onPress={handleFinalSubmit}>
                  <Text style={s.primaryButtonTextLarge}>🚀 실시간 제작업체/기술자 매칭콜 호출하기</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ backgroundColor: '#f1f5f9', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 8 }}
                  onPress={() => setAiVerifyStep('question')}
                >
                  <Text style={{ color: '#64748b', fontSize: 12.5, fontWeight: 'bold' }}>‹ 이전 판독 확인으로 돌아가기</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ==========================================
// 4. 각종공사 / 중장비 (절대 보존)
// ==========================================
export function HeavyConstructionScreen({ onBack }) {
  return (
    <View style={s.container}>
      <View style={s.headerOfficialClean}>
        <TouchableOpacity onPress={onBack} style={s.navBackBtn}><Text style={s.navBackBtnText}>‹ 홈으로</Text></TouchableOpacity>
        <Text style={s.headerTitleClean}>🚜 각종공사 / 중장비 직거래</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={s.formContainerOfficial}>
        <View style={s.aiResultBannerCard}>
          <View style={s.aiProcessTagRow}>
            <Text style={s.aiProcessTagLabel}>해당공정:</Text>
            <View style={[s.aiProcessTagBadge, { backgroundColor: '#ea580c' }]}><Text style={s.aiProcessTagBadgeText}>각종공사</Text></View>
          </View>
          <Text style={s.aiDiagnosisTitleText}>포크레인, 스카이차, 사다리차, 철거, 방수, 페인트 실시간 배차</Text>
        </View>
        <TouchableOpacity style={s.primaryPastelRedButtonLarge} onPress={() => Alert.alert('접수', '공사/장비 배차 요청이 접수되었습니다.')}>
          <Text style={s.primaryButtonTextLarge}>🚀 실시간 공사/장비 호출하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ==========================================
// 5. 자재마켓 최저가 직구 (절대 보존)
// ==========================================
export function MaterialMarketScreen({ onBack }) {
  return (
    <View style={s.container}>
      <View style={s.headerOfficialClean}>
        <TouchableOpacity onPress={onBack} style={s.navBackBtn}><Text style={s.navBackBtnText}>‹ 홈으로</Text></TouchableOpacity>
        <Text style={s.headerTitleClean}>🛒 자재마켓 최저가 직구</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={s.formContainerOfficial}>
        <View style={[s.aiResultBannerCard, { borderColor: '#86efac', backgroundColor: '#f0fdf4' }]}>
          <Text style={{ fontSize: 14.5, fontWeight: 'bold', color: '#166534' }}>
            공구, 배관자재, 인테리어 필름, 조명 등 인터넷 최저가 100% 직구 연결
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ==========================================
// 6. 중고장터 & 떠리털이 (절대 보존)
// ==========================================
export function UsedAndClearanceMarketScreen({ onBack, defaultMode = 'used' }) {
  const isClearance = defaultMode === 'clearance';
  return (
    <View style={s.container}>
      <View style={s.headerOfficialClean}>
        <TouchableOpacity onPress={onBack} style={s.navBackBtn}><Text style={s.navBackBtnText}>‹ 홈으로</Text></TouchableOpacity>
        <Text style={s.headerTitleClean}>{isClearance ? '🔥 떠리털이 (잉여자재)' : '🤝 공구/자재 중고장터'}</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={s.formContainerOfficial}>
        <View style={s.aiResultBannerCard}>
          <Text style={{ fontSize: 14.5, fontWeight: 'bold', color: '#1e3a8a' }}>
            {isClearance ? '현장 남은 잉여자재 헐값 처분 직거래' : '전동공구 및 시공 부품 1:1 안전 직거래'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingTop: 28 },
  headerOfficialClean: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 8, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  headerTitleClean: { fontSize: 15.5, fontWeight: 'bold', textAlign: 'center', flex: 1, color: '#111827' },
  navBackBtn: { paddingVertical: 4, minWidth: 44 },
  navBackBtnText: { fontSize: 14, color: '#2563eb', fontWeight: 'bold' },
  formContainerOfficial: { padding: 14, paddingBottom: 130 },

  labelOfficial: { fontSize: 12.5, fontWeight: 'bold', color: '#1f2937', marginTop: 8, marginBottom: 4 },
  inputOfficial: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, marginBottom: 4 },

  tagWrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  pillBtn: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  pillBtnActive: { backgroundColor: '#2563eb', borderColor: '#1d4ed8' },
  pillBtnText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  pillBtnTextActive: { color: '#ffffff', fontWeight: 'bold' },

  addPhotoBtn: { width: 72, height: 72, borderRadius: 8, borderWidth: 1.5, borderColor: '#2563eb', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#eff6ff' },
  photoThumb: { width: 72, height: 72, borderRadius: 8, marginRight: 6, backgroundColor: '#f1f5f9' },

  aiQuickTriggerBtn: { backgroundColor: '#eff6ff', borderWidth: 1.2, borderColor: '#93c5fd', paddingVertical: 11, borderRadius: 8, alignItems: 'center', marginVertical: 8 },
  aiQuickTriggerBtnText: { color: '#1d4ed8', fontSize: 12.5, fontWeight: 'bold' },

  aiResultBannerCard: { backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#86efac', borderRadius: 12, padding: 14, marginBottom: 14 },
  aiProcessTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  aiProcessTagLabel: { fontSize: 13, fontWeight: 'bold', color: '#15803d' },
  aiProcessTagBadge: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  aiProcessTagBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  aiDiagnosisTitleText: { fontSize: 14.5, fontWeight: 'bold', color: '#111827', lineHeight: 20, marginVertical: 4 },

  specDetailBox: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 8, padding: 10, marginVertical: 6 },
  specDetailText: { fontSize: 12, color: '#166534', lineHeight: 18, fontWeight: '500' },

  aiPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  aiPriceLabel: { fontSize: 13, fontWeight: 'bold', color: '#475569' },
  aiPriceRangeValue: { fontSize: 16, fontWeight: 'bold', color: '#dc2626' },

  primaryPastelRedButtonLarge: { backgroundColor: '#f87171', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 18, elevation: 2 },
  primaryButtonTextLarge: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' }
});