// SpecialScreens.js [1부] - 1~4번 공정 홈 실시간 매칭 연동 완결본
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
  Image,
  Linking
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

  const handleFinalSubmit = () => {
    if (!laborWage.trim()) return Alert.alert('확인', '지급 희망 일당을 입력해 주세요.');

    // 핀셋 연동: 홈 화면 실시간 매칭현황에 즉시 반영되는 주문 객체 전달
    const newOrder = {
      id: Date.now(),
      tagBadge: '단순인력',
      diagnosis: laborType + ' - ' + (laborDesc || '현장 인력 지원 요청'),
      price: parseInt(laborWage, 10) || 130000,
      address: laborAddr,
      status: '접수완료',
      photos: laborPhotos
    };

    if (onComplete) onComplete(newOrder);

    Alert.alert(
      '인력 요청 접수 완료 🚀',
      '[해당공정: 단순인력]\n일당 ' + Number(laborWage).toLocaleString() + '원으로 관내 전문 인력팀에 실시간 전송되었습니다!'
    );
    setAiModalVisible(false);
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
          <TouchableOpacity style={s.addPhotoBtn} onPress={() => {
            Alert.alert('사진 등록', '방식을 선택해 주세요.', [
              { text: '📷 카메라 촬영', onPress: handleCapturePhoto },
              { text: '🖼️ 갤러리 선택', onPress: handlePickFromGallery },
              { text: '취소', style: 'cancel' }
            ]);
          }}>
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

  const handleFinalSubmit = () => {
    if (!cleaningWage.trim()) return Alert.alert('확인', '지급 희망 견적을 입력해 주세요.');

    // 핀셋 연동: 홈 화면 실시간 매칭현황에 즉시 반영
    const newOrder = {
      id: Date.now(),
      tagBadge: '청소/방역',
      diagnosis: cleaningType + ' - ' + (cleaningDesc || '전문 청소 요청'),
      price: parseInt(cleaningWage, 10) || 250000,
      address: cleaningAddr,
      status: '접수완료',
      photos: cleaningPhotos
    };

    if (onComplete) onComplete(newOrder);

    Alert.alert(
      '청소/방역 접수 완료 🚀',
      '[해당공정: 청소/방역]\n견적 ' + Number(cleaningWage).toLocaleString() + '원으로 관내 전문 청소팀에 실시간 전송되었습니다!'
    );
    setAiModalVisible(false);
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
          <TouchableOpacity style={s.addPhotoBtn} onPress={() => {
            Alert.alert('사진 등록', '방식을 선택해 주세요.', [
              { text: '📷 카메라 촬영', onPress: handleCapturePhoto },
              { text: '🖼️ 갤러리 선택', onPress: handlePickFromGallery },
              { text: '취소', style: 'cancel' }
            ]);
          }}>
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
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ==========================================
// 3. 싱크대/가구 맞춤 직거래 화면
// ==========================================
export function FurnitureKitchenScreen({ onBack, onComplete }) {
  const [itemType, setItemType] = useState('싱크대');
  const [closetType, setClosetType] = useState('typeA');
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
      Alert.alert(
        '📷 실측 사진 등록 완료 (' + updatedPhotos.length + '/5장)',
        '입력하신 치수와 등록된 사진으로 AI 맞춤 견적을 산출하시겠습니까?',
        [
          { text: '📷 더 촬영하기', onPress: handleCapturePhoto },
          { text: '⚡ 견적 산출 및 매칭호출', onPress: () => handleCalculateAiQuote(updatedPhotos) }
        ]
      );
    }
  };

  const handlePickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsMultipleSelection: true });
    if (!res.canceled && res.assets) {
      const uris = res.assets.map(a => a.uri);
      const updatedPhotos = [...kitchenPhotos, ...uris].slice(0, 5);
      setKitchenPhotos(updatedPhotos);
      handleCalculateAiQuote(updatedPhotos);
    }
  };

  const handleCalculateAiQuote = (photos = kitchenPhotos) => {
    const w = parseInt(kitchenWidth, 10) || 2400;
    const h = parseInt(kitchenHeight, 10) || 2200;

    setIsAiCalculating(true);
    setTimeout(() => {
      setIsAiCalculating(false);

      let specDetail = '';
      let minPrice = 0;
      let maxPrice = 0;
      let baseRec = 0;

      if (itemType === '싱크대') {
        const baseMeter = w / 1000;
        baseRec = Math.round(baseMeter * 670000);
        minPrice = baseRec - 80000;
        maxPrice = baseRec + 120000;
        specDetail = '[가로 ' + w + 'mm × 높이 ' + h + 'mm]\n' +
          '• 몸통(바디): 친환경 E0 PB 합판 15mm 기준\n' +
          '• 도어: 고광택 UV 코팅 합판 18mm (댐퍼 힌지 장착)\n' +
          '• 상판: 고급 인조대리석 12T/50T 마감\n' +
          '• 수전/부속: KS 인증 최고급 수전 + 싱크볼 풀세트';
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
        const typeLabel = closetType === 'typeA' ? 'A타입 (기본 2단 서랍형)' : closetType === 'typeB' ? 'B타입 (롱코트 수납형)' : 'C타입 (3칸 분할 선반형)';
        baseRec = Math.round(ja * 135000);
        minPrice = baseRec - 100000;
        maxPrice = baseRec + 150000;
        specDetail = '[가로 ' + w + 'mm (약 ' + ja.toFixed(1) + '자) × 높이 ' + h + 'mm - ' + typeLabel + ']\n' +
          '• 몸통(내부장): 친환경 PB 합판 15mm 기준 맞춤 격자\n' +
          '• 도어: 고광택 UV 코팅 18mm 합판 (소음방지 댐퍼)\n' +
          '• 옵션: 옷걸이봉, 타이걸이, 서랍 등 풀옵션 포함';
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

    // 핀셋 연동: 홈 화면 실시간 매칭현황에 즉시 반영
    const newOrder = {
      id: Date.now(),
      tagBadge: '싱크대/가구',
      diagnosis: itemType + ' 맞춤 제작 및 시공 (' + kitchenWidth + 'mm)',
      price: parseInt(kitchenPrice, 10) || 1750000,
      address: kitchenAddr,
      status: '접수완료',
      photos: kitchenPhotos
    };

    if (onComplete) onComplete(newOrder);

    Alert.alert(
      '싱크대/가구 매칭 호출 완료 🚀',
      '[해당공정: 싱크대/가구]\n몸통 PB 15mm / 도어 UV 18mm / 인조대리석 스펙으로\n희망금액 ' + Number(kitchenPrice).toLocaleString() + '원이 관내 전문 제작업체 및 시공마스터에 실시간 전송되었습니다!'
    );
    setAiModalVisible(false);
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
          {['싱크대', '붙박이장', '상판/도어 교체', '신발장/수납장'].map(t => (
            <TouchableOpacity key={t} style={[s.pillBtn, itemType === t && s.pillBtnActive]} onPress={() => setItemType(t)}>
              <Text style={[s.pillBtnText, itemType === t && s.pillBtnTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {itemType === '붙박이장' && (
          <View style={s.closetTypeContainer}>
            <Text style={[s.labelOfficial, { marginTop: 4, color: '#1d4ed8' }]}>
              📐 붙박이장 내부 타입 선택 (기본 3대 모양 중 선택) *
            </Text>
            <View style={s.closetTypeGrid}>
              <TouchableOpacity
                style={[s.closetCard, closetType === 'typeA' && s.closetCardActive]}
                onPress={() => setClosetType('typeA')}
              >
                <View style={s.closetVisualBox}><Text style={{ fontSize: 28 }}>👔</Text></View>
                <Text style={s.closetCardTitle}>A타입</Text>
                <Text style={s.closetCardSub}>기본 2단 서랍형{'\n'}(상의/하의 분리)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.closetCard, closetType === 'typeB' && s.closetCardActive]}
                onPress={() => setClosetType('typeB')}
              >
                <View style={s.closetVisualBox}><Text style={{ fontSize: 28 }}>🧥</Text></View>
                <Text style={s.closetCardTitle}>B타입</Text>
                <Text style={s.closetCardSub}>롱코트 수납형{'\n'}(원피스/롱코트)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.closetCard, closetType === 'typeC' && s.closetCardActive]}
                onPress={() => setClosetType('typeC')}
              >
                <View style={s.closetVisualBox}><Text style={{ fontSize: 28 }}>🗄️</Text></View>
                <Text style={s.closetCardTitle}>C타입</Text>
                <Text style={s.closetCardSub}>3칸 분할 선반형{'\n'}(이불/다용도)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
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

        <TouchableOpacity style={s.cameraTriggerOnlyBtn} onPress={() => {
          Alert.alert('사진 등록', '현장 또는 설치 부위 사진을 등록해 주세요.', [
            { text: '📷 카메라 촬영 (권장)', onPress: handleCapturePhoto },
            { text: '🖼️ 갤러리 선택', onPress: handlePickFromGallery },
            { text: '취소', style: 'cancel' }
          ]);
        }}>
          <Text style={s.cameraTriggerOnlyBtnText}>
            📷 사진촬영 {kitchenPhotos.length > 0 ? `(${kitchenPhotos.length}/5장 완료)` : ''}
          </Text>
        </TouchableOpacity>

        <View style={s.specGuideInfoBox}>
          <Text style={s.specGuideInfoTitle}>🛡️ 수리수리 AI 공통 자재 스펙 안내</Text>
          <Text style={s.specGuideInfoBody}>
            • 몸통(바디): 친환경 E0 PB 15mm 고강도 합판 설계{'\n'}
            • 도어: 고광택 UV 18mm 합판 (소음방지 댐퍼 힌지 장착){'\n'}
            • 상판: 인조대리석 12T/50T 마감 + KS 인증 싱크볼 & 최고급 수전 세트
          </Text>
        </View>

        <Text style={s.labelOfficial}>지급 희망 금액 (원) *</Text>
        <TextInput style={s.inputOfficial} keyboardType="numeric" value={kitchenPrice} onChangeText={setKitchenPrice} />

        <Text style={s.labelOfficial}>시공 현장 주소 *</Text>
        <TextInput style={s.inputOfficial} value={kitchenAddr} onChangeText={setKitchenAddr} />

        <Text style={s.labelOfficial}>상세 맞춤 요청사항</Text>
        <TextInput
          style={[s.inputOfficial, { height: 65, textAlignVertical: 'top' }]}
          placeholder="예: 쿡탑 매립 여부, 상부장 플랩장 구성 등 추가 요청사항 기입"
          value={kitchenDesc}
          onChangeText={setKitchenDesc}
          multiline
        />

        <TouchableOpacity style={s.primaryPastelRedButtonLarge} onPress={() => handleCalculateAiQuote()}>
          <Text style={s.primaryButtonTextLarge}>🚀 견적 제공 및 매칭 호출하기</Text>
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
                <Text style={s.labelOfficial}>💰 최종 희망 금액 (원) 입력 *</Text>
                <TextInput
                  style={s.inputOfficial}
                  keyboardType="numeric"
                  value={kitchenPrice}
                  onChangeText={setKitchenPrice}
                />

                <Text style={[s.labelOfficial, { marginTop: 10 }]}>시공 현장 주소 *</Text>
                <TextInput style={s.inputOfficial} value={kitchenAddr} onChangeText={setKitchenAddr} />

                <TouchableOpacity style={s.primaryPastelRedButtonLarge} onPress={handleFinalSubmit}>
                  <Text style={s.primaryButtonTextLarge}>🚀 매칭 호출 확정하기</Text>
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
// 4. 이사/배송 직거래 화면
// ==========================================
export function MovingDeliveryScreen({ onBack, onComplete }) {
  const [loadAddr, setLoadAddr] = useState('광주광역시 북구 용봉동 101동 (출발지)');
  const [unloadAddr, setUnloadAddr] = useState('광주광역시 서구 치평동 202동 (도착지)');
  const [movingWage, setMovingWage] = useState('220000');
  const [movingDesc, setMovingDesc] = useState('');
  const [movingPhotos, setMovingPhotos] = useState([]);

  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiVerifyStep, setAiVerifyStep] = useState('question');
  const [aiResult, setAiResult] = useState(null);

  const runAiDiagnosis = (photos) => {
    setIsAiAnalyzing(true);
    setTimeout(() => {
      setIsAiAnalyzing(false);
      setAiResult({
        category: '이사/배송',
        title: '1톤 트럭 용달 화물 운송 (가구·가전 5개 내외 보통 물량 판독)',
        range: '190,000원 ~ 250,000원',
        recommended: '220000'
      });
      setMovingWage('220000');
      setAiVerifyStep('question');
      setAiModalVisible(true);
    }, 800);
  };

  const handleCapturePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('권한 필요', '카메라 권한을 허용해 주세요.');

    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      const updatedPhotos = [...movingPhotos, res.assets[0].uri].slice(0, 5);
      setMovingPhotos(updatedPhotos);

      if (updatedPhotos.length >= 5) {
        Alert.alert('최대 촬영 완료', '등록된 사진으로 AI 이사 물량 판독을 시작합니다.');
        runAiDiagnosis(updatedPhotos);
        return;
      }

      Alert.alert(
        '📷 사진 등록 완료 (' + updatedPhotos.length + '/5장)',
        '이삿짐 사진을 더 촬영하시겠습니까?',
        [
          { text: '📷 더 촬영하기', onPress: () => handleCapturePhoto() },
          { text: '⚡ AI 물량 판독 시작', onPress: () => runAiDiagnosis(updatedPhotos) }
        ]
      );
    }
  };

  const handlePickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsMultipleSelection: true });
    if (!res.canceled && res.assets) {
      const uris = res.assets.map(a => a.uri);
      const updatedPhotos = [...movingPhotos, ...uris].slice(0, 5);
      setMovingPhotos(updatedPhotos);
      runAiDiagnosis(updatedPhotos);
    }
  };

  const handleFinalSubmit = () => {
    if (!movingWage.trim()) return Alert.alert('확인', '희망 운송 금액을 입력해 주세요.');

    // 핀셋 연동: 홈 화면 실시간 매칭현황에 즉시 반영
    const newOrder = {
      id: Date.now(),
      tagBadge: '이사/배송',
      diagnosis: '용달 화물 운송 (' + loadAddr + ' ➔ ' + unloadAddr + ')',
      price: parseInt(movingWage, 10) || 220000,
      address: loadAddr,
      status: '배차요청',
      photos: movingPhotos
    };

    if (onComplete) onComplete(newOrder);

    Alert.alert(
      '이사/배송 접수 완료 🚀',
      '[해당공정: 이사/배송]\n상차지: ' + loadAddr + '\n도착지: ' + unloadAddr + '\n희망금액 ' + Number(movingWage).toLocaleString() + '원으로 관내 기사님들께 실시간 배차 호출되었습니다!'
    );
    setAiModalVisible(false);
  };

  return (
    <View style={s.container}>
      <View style={s.headerOfficialClean}>
        <TouchableOpacity onPress={onBack} style={s.navBackBtn}><Text style={s.navBackBtnText}>‹ 홈으로</Text></TouchableOpacity>
        <Text style={s.headerTitleClean}>🚚 이사 / 배송 직거래 접수</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.formContainerOfficial}>
        <Text style={s.labelOfficial}>📷 이삿짐/운반물품 사진 등록 (최소 1장~최대 5장) *</Text>
        <Text style={{ fontSize: 11.5, color: '#64748b', marginBottom: 6 }}>
          ※ 물품 사진을 등록하시면 AI가 차종(1톤/다마스/사다리차)과 작업 난이도를 자동 판독합니다.
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginVertical: 6 }}>
          <TouchableOpacity style={s.addPhotoBtn} onPress={() => {
            Alert.alert('사진 등록', '방식을 선택해 주세요.', [
              { text: '📷 카메라 촬영', onPress: handleCapturePhoto },
              { text: '🖼️ 갤러리 선택', onPress: handlePickFromGallery },
              { text: '취소', style: 'cancel' }
            ]);
          }}>
            <Text style={{ fontSize: 20 }}>📷</Text>
            <Text style={{ fontSize: 10, color: '#2563eb', fontWeight: 'bold' }}>{movingPhotos.length}/5장 추가</Text>
          </TouchableOpacity>
          <ScrollView horizontal>
            {movingPhotos.map((uri, idx) => (
              <Image key={idx} source={{ uri }} style={s.photoThumb} />
            ))}
          </ScrollView>
        </View>

        {movingPhotos.length > 0 && (
          <TouchableOpacity style={s.aiQuickTriggerBtn} onPress={() => runAiDiagnosis(movingPhotos)}>
            <Text style={s.aiQuickTriggerBtnText}>
              {isAiAnalyzing ? '🔄 AI 물량 분석 중...' : '⚡ 등록된 사진으로 AI 운임 견적 판독하기'}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[s.labelOfficial, { marginTop: 10 }]}>상차지 주소 (출발지) *</Text>
        <TextInput style={s.inputOfficial} value={loadAddr} onChangeText={setLoadAddr} placeholder="출발지 주소 입력" />

        <Text style={[s.labelOfficial, { marginTop: 10 }]}>하차지 주소 (도착지) *</Text>
        <TextInput style={s.inputOfficial} value={unloadAddr} onChangeText={setUnloadAddr} placeholder="도착지 주소 입력" />

        <Text style={s.labelOfficial}>지급 희망 운임 (원) *</Text>
        <TextInput style={s.inputOfficial} keyboardType="numeric" value={movingWage} onChangeText={setMovingWage} />

        <Text style={s.labelOfficial}>엘리베이터 유무 및 상세 요청사항</Text>
        <TextInput
          style={[s.inputOfficial, { height: 70, textAlignVertical: 'top' }]}
          placeholder="예: 양쪽 모두 엘리베이터 있음, 양문형 냉장고 및 침대 매트리스 포함"
          value={movingDesc}
          onChangeText={setMovingDesc}
          multiline
        />

        <TouchableOpacity style={s.primaryPastelRedButtonLarge} onPress={handleFinalSubmit}>
          <Text style={s.primaryButtonTextLarge}>🚀 실시간 이사/배송 배차 요청하기</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={aiModalVisible} animationType="slide">
        <View style={s.container}>
          <View style={s.headerOfficialClean}>
            <TouchableOpacity onPress={() => setAiModalVisible(false)} style={s.navBackBtn}><Text style={s.navBackBtnText}>✕ 닫기</Text></TouchableOpacity>
            <Text style={s.headerTitleClean}>🤖 AI 이사/화물 판독 결과</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={s.formContainerOfficial}>
            <View style={s.aiResultBannerCard}>
              <View style={s.aiProcessTagRow}>
                <Text style={s.aiProcessTagLabel}>해당공정:</Text>
                <View style={[s.aiProcessTagBadge, { backgroundColor: '#2563eb' }]}><Text style={s.aiProcessTagBadgeText}>이사/배송</Text></View>
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
                  ❓ AI가 판독한 위 운송 물량이 맞습니까?
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
                  ✍️ 실제 물품 목록을 직접 입력해 주세요.
                </Text>
                <TextInput
                  style={[s.inputOfficial, { height: 75, textAlignVertical: 'top' }]}
                  placeholder="예: 일반 소형가구 3점 및 박스 5개"
                  value={movingDesc}
                  onChangeText={setMovingDesc}
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
                <Text style={s.labelOfficial}>💰 지급 희망 운임 (원) 입력 *</Text>
                <TextInput
                  style={s.inputOfficial}
                  keyboardType="numeric"
                  value={movingWage}
                  onChangeText={setMovingWage}
                />
                <TouchableOpacity style={s.primaryPastelRedButtonLarge} onPress={handleFinalSubmit}>
                  <Text style={s.primaryButtonTextLarge}>🚀 실시간 매칭콜 호출하기</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
// SpecialScreens.js [2부] - 5번 각종공사부터 8번 떠리털이, 공통 스타일시트까지 원본 100% 보존 풀버전

// ==========================================
// 5. 각종공사 전문업체 파워링크 광고 모델 & 10대 분류 전체 노출
// (10번: 1:1 실시간 상담 채팅창 모달 완벽 연동)
// ==========================================
export function HeavyConstructionScreen({ onBack }) {
  const CATEGORIES_10 = [
    '전체보기', '건축공사', '토목공사', '인테리어', '설비공사', 
    '금속공사', '조경공사', '청소/방역', '운반/배송', '싱크대/가구', '기타공사'
  ];
  const [selectedCat, setSelectedCat] = useState('전체보기');

  const [adList, setAdList] = useState([
    {
      id: 1,
      name: '(주)호남종합건설 & 토목',
      category: '토목공사',
      region: '광주/전남, 전국',
      desc: '30년 전통 토목, 부지조성, 포크레인 중장비 10대 상시 대기. 최저가 책임시공 보증.',
      badge: '파워링크 프리미엄',
      cases: '누적 시공 실적 420건 등록됨',
      mannerTemp: '39.2℃',
      tel: '010-8888-7777',
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=500&auto=format&fit=crop&q=80'
    },
    {
      id: 2,
      name: '디자인 수 인테리어',
      category: '인테리어',
      region: '광주/전남, 전국',
      desc: '상가/아파트 감성 리모델링, 3D 무료 도면 제공 및 하자보수 이행보증서 100% 발급.',
      badge: '우수 인증업체',
      cases: '누적 시공 실적 158건 등록됨',
      mannerTemp: '38.0℃',
      tel: '010-5555-4444',
      imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&auto=format&fit=crop&q=80'
    },
    {
      id: 3,
      name: '대한 방수 & 금속',
      category: '금속공사',
      region: '광주/전남, 전국',
      desc: '옥상 우레탄 방수, 캐노피, 렉산, 계단 난간대 제작 시공 전문 마스터팀.',
      badge: '파워링크',
      cases: '누적 시공 실적 94건 등록됨',
      mannerTemp: '37.4℃',
      tel: '010-2222-3333',
      imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=80'
    }
  ]);

  // 1:1 실시간 상담 채팅 모달 상태
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatTargetCompany, setChatTargetCompany] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');

  const [adModalVisible, setAdModalVisible] = useState(false);
  const [adStep, setAdStep] = useState(1);
  const [adPlan, setAdPlan] = useState('1m');
  const [adPayMethod, setAdPayMethod] = useState('card');

  const [adFormName, setAdFormName] = useState('');
  const [adFormCategory, setAdFormCategory] = useState('건축공사');
  const [adFormRegion, setAdFormRegion] = useState('광주/전남, 전국');
  const [adFormDesc, setAdFormDesc] = useState('');
  const [adFormTel, setAdFormTel] = useState('');

  const planPrices = {
    '1m': '19,000원',
    '3m': '42,750원 (25%↓)',
    '1y': '171,000원 (25%↓)'
  };

  const handleOpenCompanyChat = (company) => {
    setChatTargetCompany(company);
    setChatMessages([
      { id: 1, sender: 'seller', text: `안녕하세요! ${company.name}입니다. ${company.category} 시공 및 견적 관련 문의사항을 남겨주시면 신속히 답변해 드리겠습니다.` }
    ]);
    setChatInputText('');
    setChatModalVisible(true);
  };

  const handleSendCompanyChatMessage = () => {
    if (!chatInputText.trim()) return;
    const userMsg = { id: Date.now(), sender: 'me', text: chatInputText.trim() };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatInputText('');

    setTimeout(() => {
      setChatMessages([
        ...updated,
        { id: Date.now() + 1, sender: 'seller', text: '문의 내용을 확인하였습니다! 현장 방문 견적 또는 상세 상담을 바로 안내해 드리겠습니다.' }
      ]);
    }, 600);
  };

  const handlePostAd = () => {
    if (!adFormName.trim() || !adFormDesc.trim()) {
      return Alert.alert('확인', '업체 상호와 광고 홍보 내용을 입력해 주세요.');
    }
    const newAd = {
      id: Date.now(),
      name: adFormName,
      category: adFormCategory,
      region: adFormRegion || '광주/전남, 전국',
      desc: adFormDesc,
      badge: '파워링크 신규',
      cases: '누적 시공 실적 신규 등록됨',
      mannerTemp: '36.5℃',
      tel: adFormTel || '010-1234-5678',
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=500&auto=format&fit=crop&q=80'
    };
    setAdList([newAd, ...adList]);
    setAdModalVisible(false);
    setAdStep(1);
    Alert.alert('광고 등록 성공 🎉', '파워링크 상단에 업체 광고가 성공적으로 게시되었습니다!');
  };

  const filteredAds = selectedCat === '전체보기' ? adList : adList.filter(a => a.category === selectedCat);

  return (
    <View style={s.container}>
      <View style={s.headerOfficialClean}>
        <TouchableOpacity onPress={onBack} style={s.navBackBtn}><Text style={s.navBackBtnText}>‹ 홈으로</Text></TouchableOpacity>
        <Text style={s.headerTitleClean}>각종공사 전문업체{'\n'}파워링크</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.formContainerOfficial}>
        <View style={s.powerAdBannerCard}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={s.powerAdBannerTitle}>📢 공사업체 사장님 입점 안내</Text>
            <Text style={s.powerAdBannerSub}>
              월 19,000원에 소비자 다이렉트 콜 연결 + 상단 배너 노출
            </Text>
          </View>
          <TouchableOpacity style={s.powerAdRegisterBtn} onPress={() => setAdModalVisible(true)}>
            <Text style={s.powerAdRegisterBtnText}>광고 등록 ›</Text>
          </TouchableOpacity>
        </View>

        <Text style={[s.labelOfficial, { marginTop: 10 }]}>공사 전문 분류 선택</Text>
        <View style={s.cat10GridWrap}>
          {CATEGORIES_10.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[s.cat10Pill, selectedCat === cat && s.cat10PillActive]}
              onPress={() => setSelectedCat(cat)}
            >
              <Text style={[s.cat10PillText, selectedCat === cat && s.cat10PillTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginTop: 14 }}>
          {filteredAds.map(item => (
            <View key={item.id} style={s.adCompanyCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={s.adCompanyName}>{item.name}</Text>
                <View style={s.adBadgePill}><Text style={s.adBadgePillText}>{item.badge}</Text></View>
              </View>
              <Text style={s.adCompanyRegion}>분류: {item.category} | 시공가능지역: {item.region}</Text>
              <Text style={s.adCompanyDesc}>{item.desc}</Text>
              <Text style={s.adCompanyCases}>📊 {item.cases}</Text>

              <View style={s.adActionRow}>
                <TouchableOpacity
                  style={s.adCallBtn}
                  onPress={() => Alert.alert('전화 견적 문의', `${item.name} (${item.tel}) 로 바로 연결합니다.`)}
                >
                  <Text style={s.adCallBtnText}>📞 전화 견적문의</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.adChatBtn}
                  onPress={() => handleOpenCompanyChat(item)}
                >
                  <Text style={s.adChatBtnText}>💬 1:1 실시간 상담</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 10번: 각종공사 1:1 실시간 상담 대화창 모달 */}
      <Modal visible={chatModalVisible} animationType="slide">
        <View style={s.container}>
          <View style={s.chatHeaderRow}>
            <TouchableOpacity onPress={() => setChatModalVisible(false)} style={s.navBackBtn}>
              <Text style={s.navBackBtnText}>‹ 닫기</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.chatHeaderSellerName}>{chatTargetCompany?.name || '업체명'}</Text>
              <Text style={s.chatHeaderSellerSub}>
                {chatTargetCompany?.category} 전문 · 신뢰지수 {chatTargetCompany?.mannerTemp || '36.5℃'}
              </Text>
            </View>
            <TouchableOpacity
              style={s.chatHeaderCallBtn}
              onPress={() => Alert.alert('전화 연결', `${chatTargetCompany?.name} (${chatTargetCompany?.tel}) 로 바로 통화를 연결합니다.`)}
            >
              <Text style={s.chatHeaderCallBtnText}>📞 전화</Text>
            </TouchableOpacity>
          </View>

          <View style={s.chatProductSummaryBar}>
            <Image source={{ uri: chatTargetCompany?.imageUrl }} style={s.chatProductThumb} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.chatProductTitle} numberOfLines={1}>{chatTargetCompany?.name}</Text>
              <Text style={[s.chatProductPrice, { fontSize: 12, color: '#2563eb' }]} numberOfLines={1}>
                {chatTargetCompany?.cases}
              </Text>
            </View>
            <View style={[s.chatProductStatusPill, { backgroundColor: '#fef3c7' }]}>
              <Text style={[s.chatProductStatusPillText, { color: '#b45309' }]}>
                {chatTargetCompany?.badge || '공사업체'}
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={s.chatMessageListContent}>
            {chatMessages.map(msg => (
              <View
                key={msg.id}
                style={[
                  s.chatBubbleWrap,
                  msg.sender === 'me' ? s.chatBubbleWrapMe : s.chatBubbleWrapSeller
                ]}
              >
                <View
                  style={[
                    s.chatBubbleBox,
                    msg.sender === 'me' ? s.chatBubbleBoxMe : s.chatBubbleBoxSeller
                  ]}
                >
                  <Text
                    style={[
                      s.chatBubbleText,
                      msg.sender === 'me' ? s.chatBubbleTextMe : s.chatBubbleTextSeller
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={s.chatInputBarWrap}>
            <TextInput
              style={s.chatTextInputField}
              placeholder="시공 현장 주소, 면적, 문의사항 입력..."
              value={chatInputText}
              onChangeText={setChatInputText}
            />
            <TouchableOpacity style={s.chatSendActionBtn} onPress={handleSendCompanyChatMessage}>
              <Text style={s.chatSendActionBtnText}>전송</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={adModalVisible} animationType="slide">
        <View style={s.container}>
          <View style={s.headerOfficialClean}>
            <TouchableOpacity onPress={() => setAdModalVisible(false)} style={s.navBackBtn}><Text style={s.navBackBtnText}>✕ 닫기</Text></TouchableOpacity>
            <Text style={s.headerTitleClean}>📢 파워링크 광고 등록 ({adStep}/3)</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={s.formContainerOfficial}>
            {adStep === 1 && (
              <View>
                <Text style={s.labelOfficial}>광고 게시 기간 선택 *</Text>
                <View style={{ gap: 10, marginVertical: 10 }}>
                  <TouchableOpacity
                    style={[s.planChoiceCard, adPlan === '1m' && s.planChoiceCardActive]}
                    onPress={() => setAdPlan('1m')}
                  >
                    <View><Text style={s.planChoiceTitle}>1개월 입점</Text><Text style={s.planChoiceSub}>기본 요금제</Text></View>
                    <Text style={s.planChoicePrice}>19,000원</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.planChoiceCard, adPlan === '3m' && s.planChoiceCardActive]}
                    onPress={() => setAdPlan('3m')}
                  >
                    <View><Text style={s.planChoiceTitle}>3개월 입점 (25% 할인)</Text><Text style={s.planChoiceSub}>추천 인기 플랜</Text></View>
                    <Text style={[s.planChoicePrice, { color: '#ea580c' }]}>42,750원</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.planChoiceCard, adPlan === '1y' && s.planChoiceCardActive]}
                    onPress={() => setAdPlan('1y')}
                  >
                    <View><Text style={s.planChoiceTitle}>1년 정기 입점 (25% 할인)</Text><Text style={s.planChoiceSub}>최대 노출 혜택</Text></View>
                    <Text style={[s.planChoicePrice, { color: '#dc2626' }]}>171,000원</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={s.primaryPastelRedButtonLarge} onPress={() => setAdStep(2)}>
                  <Text style={s.primaryButtonTextLarge}>다음: 결제 수단 선택하기 ›</Text>
                </TouchableOpacity>
              </View>
            )}

            {adStep === 2 && (
              <View>
                <Text style={s.labelOfficial}>결제 수단 선택 (금액: {planPrices[adPlan]}) *</Text>
                <View style={{ gap: 8, marginVertical: 10 }}>
                  {[
                    { id: 'card', name: '💳 신용 / 체크카드 (일반/법인)' },
                    { id: 'kakao', name: '💬 카카오페이 간편결제' },
                    { id: 'naver', name: '🟢 네이버페이' },
                    { id: 'toss', name: '🔵 토스페이' },
                    { id: 'phone', name: '📱 휴대폰 소액결제 (통신사 합산 청구)' }
                  ].map(p => (
                    <TouchableOpacity
                      key={p.id}
                      style={[s.payMethodCard, adPayMethod === p.id && s.payMethodCardActive]}
                      onPress={() => setAdPayMethod(p.id)}
                    >
                      <Text style={[s.payMethodText, adPayMethod === p.id && { color: '#ef4444', fontWeight: 'bold' }]}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={s.primaryPastelRedButtonLarge}
                  onPress={() => {
                    Alert.alert('결제 승인 완료 ✓', `[${planPrices[adPlan]}] 결제가 정상 승인되었습니다. 광고 내용을 작성해 주세요.`);
                    setAdStep(3);
                  }}
                >
                  <Text style={s.primaryButtonTextLarge}>안전결제 승인 후 광고 작성하기 ›</Text>
                </TouchableOpacity>
              </View>
            )}

            {adStep === 3 && (
              <View>
                <Text style={s.labelOfficial}>업체 상호명 *</Text>
                <TextInput style={s.inputOfficial} placeholder="예: (주)호남종합건설" value={adFormName} onChangeText={setAdFormName} />

                <Text style={s.labelOfficial}>대표 공종 분류 *</Text>
                <View style={s.cat10GridWrap}>
                  {CATEGORIES_10.filter(c => c !== '전체보기').map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[s.cat10Pill, adFormCategory === c && s.cat10PillActive]}
                      onPress={() => setAdFormCategory(c)}
                    >
                      <Text style={[s.cat10PillText, adFormCategory === c && s.cat10PillTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[s.labelOfficial, { marginTop: 10 }]}>시공가능지역 *</Text>
                <TextInput style={s.inputOfficial} value={adFormRegion} onChangeText={setAdFormRegion} placeholder="예: 광주/전남, 전국" />

                <Text style={s.labelOfficial}>직통 연락처 *</Text>
                <TextInput style={s.inputOfficial} placeholder="010-0000-0000" value={adFormTel} onChangeText={setAdFormTel} />

                <Text style={s.labelOfficial}>업체 홍보 및 시공 소개글 *</Text>
                <TextInput
                  style={[s.inputOfficial, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="예: 30년 전통 책임시공, 중장비 보유, 하자보수 100% 보증"
                  value={adFormDesc}
                  onChangeText={setAdFormDesc}
                  multiline
                />

                <TouchableOpacity style={s.primaryPastelRedButtonLarge} onPress={handlePostAd}>
                  <Text style={s.primaryButtonTextLarge}>🚀 파워링크 광고 즉시 게시하기</Text>
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
// 6. 자재마켓 온라인 직구몰
// (8번: 아이콘 🛒 쇼핑 카트로 변경)
// ==========================================
export function MaterialMarketScreen({ onBack }) {
  const [filterCat, setFilterCat] = useState('전체');
  const [materialSearch, setMaterialSearch] = useState('');

  const [products] = useState([
    {
      id: 1,
      cat: '전동공구',
      name: '마키타 18V 충전 임팩트 드라이버 베어툴 (DTD172Z)',
      spec: '최대 토크 180N.m / 고효율 BL모터 장착',
      regularPrice: 245000,
      lowestPrice: 189000,
      discount: '23%',
      mall: '쿠팡 로켓배송',
      imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=80',
      linkUrl: 'https://www.coupang.com'
    },
    {
      id: 2,
      cat: '배관/수전',
      name: '대림바스 KS 인증 최고급 싱크대 원홀 원터치 수전 (DL-K5110)',
      spec: '황동 주물 바디 / 미세 분사 헤드 포함 / 100% KS규격',
      regularPrice: 65000,
      lowestPrice: 38500,
      discount: '41%',
      mall: '쿠팡 최저가',
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80',
      linkUrl: 'https://www.coupang.com'
    },
    {
      id: 3,
      cat: '전기/조명',
      name: '신성 KS인증 2.5sq 3P 방수 난연 전선 케이블 100M 롤',
      spec: '현장 배선/분전반 규격 / 안전인증 1등급',
      regularPrice: 98000,
      lowestPrice: 72000,
      discount: '26%',
      mall: '네이버 쇼핑몰',
      imageUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=500&auto=format&fit=crop&q=80',
      linkUrl: 'https://shopping.naver.com'
    },
    {
      id: 4,
      cat: '타일/방수',
      name: '아덱스(ARDEX) 탄성 에폭시 줄눈제 + 실리콘 5kg',
      spec: '항균 곰팡이 방지 / 욕실 및 베란다 바닥 타일 전용',
      regularPrice: 22000,
      lowestPrice: 14800,
      discount: '33%',
      mall: '쿠팡 로켓배송',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
      linkUrl: 'https://www.coupang.com'
    },
    {
      id: 5,
      cat: '소모품/철물',
      name: '힐티 정품 콘크리트 칼브럭 세트 (6mm × 30mm 1000개입)',
      spec: '독일 직수입 / 벽체 타공 고하중 체결 전용',
      regularPrice: 32000,
      lowestPrice: 21500,
      discount: '32%',
      mall: '쿠팡 최저가',
      imageUrl: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=500&auto=format&fit=crop&q=80',
      linkUrl: 'https://www.coupang.com'
    }
  ]);

  const handleOpenMallLink = (item) => {
    Alert.alert(
      '최저가 쇼핑몰 이동',
      `[${item.mall}]\n"${item.name}"\n최저가 ${item.lowestPrice.toLocaleString()}원 구매 페이지로 바로 이동하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '🚀 최저가 바로가기',
          onPress: () => {
            Linking.openURL(item.linkUrl).catch(() => {
              Alert.alert('알림', '외부 브라우저 연결을 준비하고 있습니다.');
            });
          }
        }
      ]
    );
  };

  const filtered = products.filter(p => {
    const matchCat = filterCat === '전체' || p.cat === filterCat;
    const matchSearch = p.name.includes(materialSearch) || p.spec.includes(materialSearch);
    return matchCat && matchSearch;
  });

  return (
    <View style={s.container}>
      {/* 8번: 자재마켓 헤더 아이콘 🛒 쇼핑 카트로 변경 */}
      <View style={s.headerOfficialClean}>
        <TouchableOpacity onPress={onBack} style={s.navBackBtn}><Text style={s.navBackBtnText}>‹ 홈으로</Text></TouchableOpacity>
        <Text style={s.headerTitleClean}>🛒 자재마켓 최저가 직구몰</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.formContainerOfficial}>
        <View style={s.materialNoticeBanner}>
          <Text style={s.materialNoticeTitle}>🛒 시공 자재 & 공구 인터넷 최저가 실시간 비교</Text>
          <Text style={s.materialNoticeSub}>
            쿠팡 및 대형몰 다이렉트 연동으로 오프라인 매장 대비 평균 25~40% 저렴하게 직구하세요!
          </Text>
        </View>

        <View style={s.searchBarWrap}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
          <TextInput
            style={s.searchBarInput}
            placeholder="자재명, 규격, 공구 모델명 검색"
            value={materialSearch}
            onChangeText={setMaterialSearch}
          />
          {materialSearch.length > 0 && (
            <TouchableOpacity onPress={() => setMaterialSearch('')}>
              <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={s.tagWrapRow}>
          {['전체', '전동공구', '배관/수전', '전기/조명', '타일/방수', '소모품/철물'].map(c => (
            <TouchableOpacity
              key={c}
              style={[s.pillBtn, filterCat === c && s.pillBtnActive]}
              onPress={() => setFilterCat(c)}
            >
              <Text style={[s.pillBtnText, filterCat === c && s.pillBtnTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginTop: 10 }}>
          {filtered.map(item => (
            <View key={item.id} style={s.productCardBox}>
              <View style={s.productCardTopRow}>
                <View style={s.productImgBox}>
                  <Image source={{ uri: item.imageUrl }} style={s.productRealPhoto} />
                  <View style={s.productDiscountBadge}>
                    <Text style={s.productDiscountText}>{item.discount}</Text>
                  </View>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={s.productMallPill}>
                    <Text style={s.productMallPillText}>● {item.mall}</Text>
                  </View>
                  <Text style={s.productTitleText} numberOfLines={2}>{item.name}</Text>
                  <Text style={s.productSpecText}>{item.spec}</Text>

                  <View style={s.productPriceRow}>
                    <Text style={s.productRegularPrice}>{item.regularPrice.toLocaleString()}원</Text>
                    <Text style={s.productLowestPrice}>{item.lowestPrice.toLocaleString()}원</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={s.productBuyBtn}
                activeOpacity={0.85}
                onPress={() => handleOpenMallLink(item)}
              >
                <Text style={s.productBuyBtnText}>🛒 {item.mall} 최저가 직구 바로가기 ›</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ==========================================
// 7. 중고장터
// (9-2번: 버튼 하부 텍스트 삭제 및 깔끔한 메인 버튼 정돈)
// ==========================================
export function UsedMarketScreen({ onBack }) {
  const [usedFeed, setUsedFeed] = useState([
    {
      id: 1,
      title: '디월트 18V 충전 햄머드릴 풀세트 (배터리 2개 + 충전기)',
      price: 135000,
      isFree: false,
      sellerName: '용봉동맥가이버',
      mannerTemp: '37.8℃',
      tel: '010-3333-8888',
      region: '광주 북구 용봉동',
      time: '10분 전',
      status: '판매중',
      imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=80',
      desc: '현장 실사용 5회 미만입니다. 정상 작동하며 상태 깨끗합니다.'
    },
    {
      id: 2,
      title: '보쉬 레이저 레벨기 3축 360도 그린레이저 + 삼각대',
      price: 90000,
      isFree: false,
      sellerName: '치평동타일장인',
      mannerTemp: '36.5℃',
      tel: '010-5555-7777',
      region: '광주 서구 치평동',
      time: '1시간 전',
      status: '예약중',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
      desc: '타일 공사 때 쓰던 레벨기입니다. 오차 없이 칼같이 잡힙니다.'
    },
    {
      id: 3,
      title: '[나눔] 3단 이동식 공구정리함 및 부속 수납박스 필요하신 분',
      price: 0,
      isFree: true,
      sellerName: '수완창고정리',
      mannerTemp: '38.2℃',
      tel: '010-9999-1111',
      region: '광주 광산구 수완동',
      time: '2시간 전',
      status: '나눔중',
      imageUrl: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=500&auto=format&fit=crop&q=80',
      desc: '창고 이전하면서 필요 없어져서 나눔합니다. 먼저 오시는 분께 드립니다.'
    }
  ]);

  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatTargetItem, setChatTargetItem] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');

  const [modalMode, setModalMode] = useState('sell');
  const [activeModalVisible, setActiveModalVisible] = useState(false);
  const [stepState, setStepState] = useState('camera_gate');
  const [inputPhotos, setInputPhotos] = useState([]);

  const [aiReport] = useState({
    title: '전동공구 / 작업 장비 세트 (외관 A급 판독)',
    suggestedRange: '120,000원 ~ 145,000원'
  });

  const [itemTitle, setItemTitle] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDesc, setItemDesc] = useState('');

  const handleOpenChat = (item) => {
    setChatTargetItem(item);
    setChatMessages([
      { id: 1, sender: 'seller', text: `안녕하세요! "${item.title}" 관심 가져주셔서 감사합니다. 직거래 장소나 시간 편하게 말씀해 주세요.` }
    ]);
    setChatInputText('');
    setChatModalVisible(true);
  };

  const handleSendChatMessage = () => {
    if (!chatInputText.trim()) return;
    const userMsg = { id: Date.now(), sender: 'me', text: chatInputText.trim() };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatInputText('');

    setTimeout(() => {
      setChatMessages([
        ...updated,
        { id: Date.now() + 1, sender: 'seller', text: '네, 확인했습니다! 직거래 상세 위치 조율 가능합니다.' }
      ]);
    }, 600);
  };

  const handleCapturePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('권한 필요', '카메라 접근 권한을 허용해 주세요.');

    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      const updated = [...inputPhotos, res.assets[0].uri].slice(0, 6);
      setInputPhotos(updated);

      if (updated.length >= 6) {
        Alert.alert('최대 6장 촬영 완료', modalMode === 'sell' ? 'AI 중고 시세 판독을 시작합니다.' : '나눔 내용 작성창으로 이동합니다.');
        if (modalMode === 'sell') setStepState('ai_diagnosis');
        else setStepState('write_direct');
      } else {
        setStepState('ask_more');
      }
    }
  };

  const handlePickGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsMultipleSelection: true });
    if (!res.canceled && res.assets) {
      const uris = res.assets.map(a => a.uri);
      const updated = [...inputPhotos, ...uris].slice(0, 6);
      setInputPhotos(updated);
      setStepState('ask_more');
    }
  };

  const handlePublish = () => {
    if (modalMode === 'sell' && !itemPrice.trim()) {
      return Alert.alert('확인', '판매 희망 금액을 입력해 주세요.');
    }
    if (!itemTitle.trim()) {
      return Alert.alert('확인', '물품명을 입력해 주세요.');
    }

    const newPost = {
      id: Date.now(),
      title: modalMode === 'give' ? `[나눔] ${itemTitle}` : itemTitle,
      price: modalMode === 'give' ? 0 : parseInt(itemPrice, 10) || 100000,
      isFree: modalMode === 'give',
      sellerName: '용봉동이웃',
      mannerTemp: '36.5℃',
      tel: '010-1234-5678',
      region: '광주 북구 용봉동 (내 동네)',
      time: '방금 전',
      status: modalMode === 'give' ? '나눔중' : '판매중',
      imageUrl: inputPhotos.length > 0 ? inputPhotos[0] : 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=500&auto=format&fit=crop&q=80',
      desc: itemDesc || (modalMode === 'give' ? '무료 나눔합니다. 직접 가져가실 분 연락주세요.' : '직거래 선호합니다.')
    };

    setUsedFeed([newPost, ...usedFeed]);
    setActiveModalVisible(false);
    setInputPhotos([]);
    setItemTitle('');
    setItemPrice('');
    setItemDesc('');
    setStepState('camera_gate');
    Alert.alert('등록 완료 🎉', modalMode === 'give' ? '이웃을 위한 무료나눔 글이 등록되었습니다!' : '중고장터에 판매 물품이 성공적으로 게시되었습니다!');
  };

  return (
    <View style={s.container}>
      <View style={s.headerOfficialClean}>
        <TouchableOpacity onPress={onBack} style={s.navBackBtn}><Text style={s.navBackBtnText}>‹ 홈으로</Text></TouchableOpacity>
        <Text style={s.headerTitleClean}>🤝 중고장터 (동네 직거래 & 나눔)</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.formContainerOfficialWithDualBar}>
        <View style={s.usedNoticeBanner}>
          <Text style={s.usedNoticeTitle}>🏘️ 동네 이웃과 믿고 거래하는 중고 & 무료나눔</Text>
          <Text style={s.usedNoticeSub}>필요 없는 공구와 자재를 판매하거나 따뜻하게 무료 나눔하세요.</Text>
        </View>

        {usedFeed.map(item => (
          <TouchableOpacity
            key={item.id}
            style={s.usedItemCard}
            activeOpacity={0.8}
            onPress={() => handleOpenChat(item)}
          >
            <View style={s.usedThumbBox}>
              <Image source={{ uri: item.imageUrl }} style={s.usedThumbImg} />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={s.usedCardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={[s.usedStatusBadge, item.isFree ? { backgroundColor: '#059669' } : item.status === '예약중' ? { backgroundColor: '#f59e0b' } : { backgroundColor: '#16a34a' }]}>
                  <Text style={s.usedStatusText}>{item.status}</Text>
                </View>
              </View>

              <Text style={s.usedCardSubInfo}>{item.region} · {item.time}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[s.usedCardPrice, item.isFree && { color: '#059669' }]}>
                  {item.isFree ? '무료나눔 🎁' : `${item.price.toLocaleString()}원`}
                </Text>
                <Text style={{ fontSize: 11, color: '#2563eb', fontWeight: 'bold' }}>💬 1:1 채팅 ›</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 9-2번: 하단 보조 설명문 삭제, 심플하고 큼직한 2등분 버튼 */}
      <View style={s.bottomFixedDualButtonBar}>
        <TouchableOpacity
          style={s.dualSellBtn}
          activeOpacity={0.88}
          onPress={() => {
            setModalMode('sell');
            setInputPhotos([]);
            setStepState('camera_gate');
            setActiveModalVisible(true);
          }}
        >
          <Text style={s.dualBtnMainText}>+ 내 물건 팔기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.dualGiveBtn}
          activeOpacity={0.88}
          onPress={() => {
            setModalMode('give');
            setInputPhotos([]);
            setStepState('camera_gate');
            setActiveModalVisible(true);
          }}
        >
          <Text style={s.dualBtnMainText}>🎁 무료 나눔</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={chatModalVisible} animationType="slide">
        <View style={s.container}>
          <View style={s.chatHeaderRow}>
            <TouchableOpacity onPress={() => setChatModalVisible(false)} style={s.navBackBtn}>
              <Text style={s.navBackBtnText}>‹ 닫기</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.chatHeaderSellerName}>{chatTargetItem?.sellerName || '판매자'}</Text>
              <Text style={s.chatHeaderSellerSub}>매너온도 {chatTargetItem?.mannerTemp || '36.5℃'} · 인증완료</Text>
            </View>
            <TouchableOpacity
              style={s.chatHeaderCallBtn}
              onPress={() => Alert.alert('전화 연결', `${chatTargetItem?.sellerName} (${chatTargetItem?.tel}) 님께 통화를 연결합니다.`)}
            >
              <Text style={s.chatHeaderCallBtnText}>📞 전화</Text>
            </TouchableOpacity>
          </View>

          <View style={s.chatProductSummaryBar}>
            <Image source={{ uri: chatTargetItem?.imageUrl }} style={s.chatProductThumb} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.chatProductTitle} numberOfLines={1}>{chatTargetItem?.title}</Text>
              <Text style={s.chatProductPrice}>
                {chatTargetItem?.isFree ? '무료나눔 🎁' : `${chatTargetItem?.price?.toLocaleString()}원`}
              </Text>
            </View>
            <View style={s.chatProductStatusPill}>
              <Text style={s.chatProductStatusPillText}>{chatTargetItem?.status}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={s.chatMessageListContent}>
            {chatMessages.map(msg => (
              <View
                key={msg.id}
                style={[
                  s.chatBubbleWrap,
                  msg.sender === 'me' ? s.chatBubbleWrapMe : s.chatBubbleWrapSeller
                ]}
              >
                <View
                  style={[
                    s.chatBubbleBox,
                    msg.sender === 'me' ? s.chatBubbleBoxMe : s.chatBubbleBoxSeller
                  ]}
                >
                  <Text
                    style={[
                      s.chatBubbleText,
                      msg.sender === 'me' ? s.chatBubbleTextMe : s.chatBubbleTextSeller
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={s.chatInputBarWrap}>
            <TextInput
              style={s.chatTextInputField}
              placeholder="메시지를 입력하세요..."
              value={chatInputText}
              onChangeText={setChatInputText}
            />
            <TouchableOpacity style={s.chatSendActionBtn} onPress={handleSendChatMessage}>
              <Text style={s.chatSendActionBtnText}>전송</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={activeModalVisible} animationType="slide">
        <View style={s.container}>
          <View style={s.headerOfficialClean}>
            <TouchableOpacity onPress={() => setActiveModalVisible(false)} style={s.navBackBtn}><Text style={s.navBackBtnText}>✕ 닫기</Text></TouchableOpacity>
            <Text style={s.headerTitleClean}>
              {modalMode === 'sell' ? '📦 내 물건 판매 등록' : '🎁 이웃 무료 나눔 등록'}
            </Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={s.formContainerOfficial}>
            {stepState === 'camera_gate' && (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ fontSize: 44, marginBottom: 12 }}>📷</Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: 'center' }}>
                  {modalMode === 'sell' ? '판매할 물건 사진을 촬영해 주세요!' : '나눔할 물건 사진을 촬영해 주세요!'}
                </Text>
                <Text style={{ fontSize: 12.5, color: '#64748b', marginTop: 6, marginBottom: 20, textAlign: 'center' }}>
                  (최소 1장 ~ 최대 6장 촬영 가능){'\n'}
                  {modalMode === 'sell' ? '다양한 각도를 찍으시면 AI가 모델명과 시세를 자동 판독합니다.' : '사진 촬영 후 AI 판독 없이 바로 설명 입력 후 게시됩니다.'}
                </Text>

                <TouchableOpacity style={[s.modalStepPrimaryBtn, modalMode === 'give' && { backgroundColor: '#059669' }]} onPress={handleCapturePhoto}>
                  <Text style={s.modalStepPrimaryBtnText}>📷 지금 바로 카메라 촬영하기</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.modalStepSubBtn} onPress={handlePickGallery}>
                  <Text style={s.modalStepSubBtnText}>🖼️ 갤러리에서 사진 가져오기</Text>
                </TouchableOpacity>
              </View>
            )}

            {stepState === 'ask_more' && (
              <View style={{ paddingVertical: 10 }}>
                <Text style={{ fontSize: 15.5, fontWeight: 'bold', color: '#111827', textAlign: 'center' }}>
                  📸 사진 등록 완료 ({inputPhotos.length}/6장)
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 16 }}>
                  {inputPhotos.map((uri, idx) => (
                    <View key={idx} style={{ marginRight: 8, position: 'relative' }}>
                      <Image source={{ uri }} style={{ width: 90, height: 90, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' }} />
                      <View style={{ position: 'absolute', top: 4, left: 4, backgroundColor: modalMode === 'give' ? '#059669' : '#2563eb', paddingHorizontal: 6, borderRadius: 10 }}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{idx + 1}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center', marginBottom: 16 }}>
                  사진을 더 촬영하시겠습니까?
                </Text>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 8, alignItems: 'center' }}
                    onPress={handleCapturePhoto}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>예 (추가 촬영)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: modalMode === 'give' ? '#059669' : '#2563eb', paddingVertical: 14, borderRadius: 8, alignItems: 'center' }}
                    onPress={() => {
                      if (modalMode === 'sell') setStepState('ai_diagnosis');
                      else setStepState('write_direct');
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>
                      {modalMode === 'sell' ? '아니오 (AI 판독)' : '아니오 (내용 작성)'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {stepState === 'ai_diagnosis' && modalMode === 'sell' && (
              <View>
                <View style={s.aiResultBannerCard}>
                  <View style={s.aiProcessTagRow}>
                    <Text style={s.aiProcessTagLabel}>해당공정:</Text>
                    <View style={[s.aiProcessTagBadge, { backgroundColor: '#1d4ed8' }]}>
                      <Text style={s.aiProcessTagBadgeText}>중고장터 AI 시세판독</Text>
                    </View>
                  </View>
                  <Text style={s.aiDiagnosisTitleText}>{aiReport.title}</Text>
                  <View style={s.aiPriceRow}>
                    <Text style={s.aiPriceLabel}>AI 권장 중고시세:</Text>
                    <Text style={s.aiPriceRangeValue}>{aiReport.suggestedRange}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={s.primaryPastelRedButtonLarge}
                  onPress={() => setStepState('write_direct')}
                >
                  <Text style={s.primaryButtonTextLarge}>확인 및 판매 금액 입력하기 ›</Text>
                </TouchableOpacity>
              </View>
            )}

            {stepState === 'write_direct' && (
              <View>
                <Text style={s.labelOfficial}>물품명 *</Text>
                <TextInput
                  style={s.inputOfficial}
                  value={itemTitle}
                  onChangeText={setItemTitle}
                  placeholder={modalMode === 'sell' ? '예: 마키타 충전 드릴 세트 풀박스' : '예: 3단 공구 정리함 및 바스켓'}
                />

                {modalMode === 'sell' ? (
                  <View>
                    <Text style={[s.labelOfficial, { marginTop: 10 }]}>💰 판매 희망 금액 (원) 직접 입력 *</Text>
                    <TextInput
                      style={[s.inputOfficial, { fontSize: 16, fontWeight: 'bold', color: '#dc2626' }]}
                      keyboardType="numeric"
                      value={itemPrice}
                      onChangeText={setItemPrice}
                      placeholder="판매 금액 숫자로 입력"
                    />
                  </View>
                ) : (
                  <View style={s.givePriceNoticeBox}>
                    <Text style={s.givePriceNoticeText}>🎁 무료 나눔 품목 (가격 0원 자동 설정 완료)</Text>
                  </View>
                )}

                <Text style={[s.labelOfficial, { marginTop: 10 }]}>자세한 설명 *</Text>
                <TextInput
                  style={[s.inputOfficial, { height: 90, textAlignVertical: 'top' }]}
                  placeholder={modalMode === 'sell' ? '사용 기간, 하자 여부, 거래 장소를 입력해 주세요.' : '물품 상태와 나눔 받아가실 장소(아파트 앞 등)를 적어주세요.'}
                  value={itemDesc}
                  onChangeText={setItemDesc}
                  multiline
                />

                <TouchableOpacity
                  style={[s.primaryPastelRedButtonLarge, modalMode === 'give' && { backgroundColor: '#059669' }]}
                  onPress={handlePublish}
                >
                  <Text style={s.primaryButtonTextLarge}>
                    {modalMode === 'sell' ? '🚀 중고장터에 즉시 게시하기' : '🎁 무료나눔 즉시 게시하기'}
                  </Text>
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
// 8. 떠리털이 (헤드카피: 어떤 재고·폐업물품이든 원가 이하 땡처리! & 1:1 직거래 채팅 모달)
// (11번: 📷 카메라 촬영하기 멘트 핀셋 수정 완료)
// ==========================================
export function SurplusClearanceScreen({ onBack }) {
  const [clearanceFeed, setClearanceFeed] = useState([
    {
      id: 1,
      title: '포천석 버너구이 바닥 화강석 타일 (300×600) 45장 헐값 급처',
      price: 50000,
      regularPrice: 220000,
      sellerName: '평동석재건설',
      mannerTemp: '38.5℃',
      tel: '010-4444-2222',
      region: '광주 광산구 평동공단 현장',
      time: '30분 전',
      status: '급처중',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
      desc: '신축 상가 현장 시공 끝나고 남은 파렛트 잔여분입니다. 용달차로 직접 싣고 가실 분 연락주세요.'
    },
    {
      id: 2,
      title: '동진 KS 16mm CD 주름관 난연 전선관 3롤 묶음 처분',
      price: 30000,
      regularPrice: 75000,
      sellerName: '첨단전기마스터',
      mannerTemp: '37.1℃',
      tel: '010-6666-8888',
      region: '광주 북구 첨단 현장',
      time: '2시간 전',
      status: '급처중',
      imageUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=500&auto=format&fit=crop&q=80',
      desc: '미개봉 신품입니다. 창고 정리 차원에서 원가 이하 반값에 넘깁니다.'
    },
    {
      id: 3,
      title: '영림 ABS 도어 (도어마감재/손잡이 포함) 2세트',
      price: 80000,
      regularPrice: 280000,
      sellerName: '농성동창고장',
      mannerTemp: '36.9℃',
      tel: '010-7777-3333',
      region: '광주 서구 농성동 창고',
      time: '5시간 전',
      status: '예약중',
      imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=80',
      desc: '사이즈 실측 미스로 규격 안 맞아 보관만 하던 새 도어입니다. 개당 4만원 꼴로 처분합니다.'
    }
  ]);

  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatTargetItem, setChatTargetItem] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');

  const [sellModalVisible, setSellModalVisible] = useState(false);
  const [sellStep, setSellStep] = useState('camera_gate');
  const [sellPhotos, setSellPhotos] = useState([]);

  const [formTitle, setFormTitle] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formRegularPrice, setFormRegularPrice] = useState('');
  const [formLocation, setFormLocation] = useState('광주광역시 북구 현장');
  const [formDesc, setFormDesc] = useState('');

  const handleOpenChat = (item) => {
    setChatTargetItem(item);
    setChatMessages([
      { id: 1, sender: 'seller', text: `안녕하세요! "${item.title}" 헐값 급처분 건입니다. 상차 방법이나 거래 시간 편하게 말씀해 주세요.` }
    ]);
    setChatInputText('');
    setChatModalVisible(true);
  };

  const handleSendChatMessage = () => {
    if (!chatInputText.trim()) return;
    const userMsg = { id: Date.now(), sender: 'me', text: chatInputText.trim() };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatInputText('');

    setTimeout(() => {
      setChatMessages([
        ...updated,
        { id: Date.now() + 1, sender: 'seller', text: '네, 확인했습니다! 현장 상차 바로 지원 가능합니다.' }
      ]);
    }, 600);
  };

  const handleCapturePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('권한 필요', '카메라 권한을 허용해 주세요.');

    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      const updated = [...sellPhotos, res.assets[0].uri].slice(0, 6);
      setSellPhotos(updated);

      if (updated.length >= 6) {
        Alert.alert('최대 6장 촬영 완료', '등록된 사진으로 급처분 게시글 작성창으로 이동합니다.');
        setSellStep('form_input');
      } else {
        setSellStep('ask_more');
      }
    }
  };

  const handlePickGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsMultipleSelection: true });
    if (!res.canceled && res.assets) {
      const uris = res.assets.map(a => a.uri);
      const updated = [...sellPhotos, ...uris].slice(0, 6);
      setSellPhotos(updated);
      setSellStep('ask_more');
    }
  };

  const handlePublishClearance = () => {
    if (!formPrice.trim() || !formTitle.trim()) {
      return Alert.alert('확인', '품목명과 헐값 급처 금액을 입력해 주세요.');
    }

    const newPost = {
      id: Date.now(),
      title: formTitle,
      price: parseInt(formPrice, 10) || 50000,
      regularPrice: parseInt(formRegularPrice, 10) || parseInt(formPrice, 10) * 2,
      sellerName: '용봉동현장소장',
      mannerTemp: '36.8℃',
      tel: '010-1234-5678',
      region: formLocation || '광주 북구 현장',
      time: '방금 전',
      status: '급처중',
      imageUrl: sellPhotos.length > 0 ? sellPhotos[0] : 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
      desc: formDesc || '현장 잔여자재 헐값 처분합니다. 빠른 거래 희망합니다.'
    };

    setClearanceFeed([newPost, ...clearanceFeed]);
    setSellModalVisible(false);
    setSellPhotos([]);
    setFormTitle('');
    setFormPrice('');
    setFormRegularPrice('');
    setFormDesc('');
    setSellStep('camera_gate');

    Alert.alert('급처 등록 완료 🎉', '떠리털이 게시판에 잉여자재가 성공적으로 등록되었습니다!');
  };

  return (
    <View style={s.container}>
      <View style={s.headerOfficialClean}>
        <TouchableOpacity onPress={onBack} style={s.navBackBtn}><Text style={s.navBackBtnText}>‹ 홈으로</Text></TouchableOpacity>
        <Text style={s.headerTitleClean}>🔥 떠리털이</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.formContainerOfficialWithDualBar}>
        <View style={[s.aiResultBannerCard, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
          <Text style={{ fontSize: 14.5, fontWeight: 'bold', color: '#b91c1c' }}>
            🔥 어떤 재고·폐업물품이든 원가 이하 땡처리!
          </Text>
          <Text style={{ fontSize: 11, color: '#991b1b', marginTop: 3, lineHeight: 16 }}>
            공사 잔여자재부터 사업장 폐업물품까지, 필요한 이웃에게 원가 이하 직거래로 빠르게 털어내세요.
          </Text>
        </View>

        {clearanceFeed.map(item => (
          <TouchableOpacity
            key={item.id}
            style={s.usedItemCard}
            activeOpacity={0.8}
            onPress={() => handleOpenChat(item)}
          >
            <View style={s.usedThumbBox}>
              <Image source={{ uri: item.imageUrl }} style={s.usedThumbImg} />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={s.usedCardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={[s.usedStatusBadge, { backgroundColor: item.status === '예약중' ? '#f59e0b' : '#dc2626' }]}>
                  <Text style={s.usedStatusText}>{item.status}</Text>
                </View>
              </View>

              <Text style={s.usedCardSubInfo}>📍 {item.region} · {item.time}</Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {item.regularPrice > item.price && (
                    <Text style={{ fontSize: 11, color: '#94a3b8', textDecorationLine: 'line-through' }}>
                      {item.regularPrice.toLocaleString()}원
                    </Text>
                  )}
                  <Text style={[s.usedCardPrice, { color: '#dc2626' }]}>{item.price.toLocaleString()}원</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#dc2626', fontWeight: 'bold' }}>💬 1:1 채팅 ›</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={s.bottomFixedSingleBar}>
        <TouchableOpacity
          style={s.clearanceFixedBtn}
          activeOpacity={0.88}
          onPress={() => {
            setSellPhotos([]);
            setSellStep('camera_gate');
            setSellModalVisible(true);
          }}
        >
          <Text style={s.clearanceFixedBtnText}>+ 내 물건 팔기</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={chatModalVisible} animationType="slide">
        <View style={s.container}>
          <View style={s.chatHeaderRow}>
            <TouchableOpacity onPress={() => setChatModalVisible(false)} style={s.navBackBtn}>
              <Text style={s.navBackBtnText}>‹ 닫기</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.chatHeaderSellerName}>{chatTargetItem?.sellerName || '판매자'}</Text>
              <Text style={s.chatHeaderSellerSub}>매너온도 {chatTargetItem?.mannerTemp || '36.5℃'} · 인증완료</Text>
            </View>
            <TouchableOpacity
              style={s.chatHeaderCallBtn}
              onPress={() => Alert.alert('전화 연결', `${chatTargetItem?.sellerName} (${chatTargetItem?.tel}) 님께 통화를 연결합니다.`)}
            >
              <Text style={s.chatHeaderCallBtnText}>📞 전화</Text>
            </TouchableOpacity>
          </View>

          <View style={s.chatProductSummaryBar}>
            <Image source={{ uri: chatTargetItem?.imageUrl }} style={s.chatProductThumb} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.chatProductTitle} numberOfLines={1}>{chatTargetItem?.title}</Text>
              <Text style={[s.chatProductPrice, { color: '#dc2626' }]}>
                {chatTargetItem?.price?.toLocaleString()}원
              </Text>
            </View>
            <View style={[s.chatProductStatusPill, { backgroundColor: '#fee2e2' }]}>
              <Text style={[s.chatProductStatusPillText, { color: '#dc2626' }]}>{chatTargetItem?.status}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={s.chatMessageListContent}>
            {chatMessages.map(msg => (
              <View
                key={msg.id}
                style={[
                  s.chatBubbleWrap,
                  msg.sender === 'me' ? s.chatBubbleWrapMe : s.chatBubbleWrapSeller
                ]}
              >
                <View
                  style={[
                    s.chatBubbleBox,
                    msg.sender === 'me' ? s.chatBubbleBoxMe : s.chatBubbleBoxSeller
                  ]}
                >
                  <Text
                    style={[
                      s.chatBubbleText,
                      msg.sender === 'me' ? s.chatBubbleTextMe : s.chatBubbleTextSeller
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={s.chatInputBarWrap}>
            <TextInput
              style={s.chatTextInputField}
              placeholder="메시지를 입력하세요..."
              value={chatInputText}
              onChangeText={setChatInputText}
            />
            <TouchableOpacity style={s.chatSendActionBtn} onPress={handleSendChatMessage}>
              <Text style={s.chatSendActionBtnText}>전송</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={sellModalVisible} animationType="slide">
        <View style={s.container}>
          <View style={s.headerOfficialClean}>
            <TouchableOpacity onPress={() => setSellModalVisible(false)} style={s.navBackBtn}><Text style={s.navBackBtnText}>✕ 닫기</Text></TouchableOpacity>
            <Text style={s.headerTitleClean}>🔥 잔여자재 급처 등록</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={s.formContainerOfficial}>
            {sellStep === 'camera_gate' && (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ fontSize: 44, marginBottom: 12 }}>📷</Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: 'center' }}>
                  남은 자재 실물 사진을 촬영해 주세요!
                </Text>
                <Text style={{ fontSize: 12.5, color: '#64748b', marginTop: 6, marginBottom: 20, textAlign: 'center' }}>
                  (최소 1장 ~ 최대 6장 촬영 가능){'\n'}자재 상태와 수량을 한눈에 알아볼 수 있게 찍어주세요.
                </Text>

                <TouchableOpacity style={[s.modalStepPrimaryBtn, { backgroundColor: '#dc2626' }]} onPress={handleCapturePhoto}>
                  <Text style={s.modalStepPrimaryBtnText}>📷 카메라 촬영하기</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.modalStepSubBtn} onPress={handlePickGallery}>
                  <Text style={s.modalStepSubBtnText}>🖼️ 갤러리에서 사진 가져오기</Text>
                </TouchableOpacity>
              </View>
            )}

            {sellStep === 'ask_more' && (
              <View style={{ paddingVertical: 10 }}>
                <Text style={{ fontSize: 15.5, fontWeight: 'bold', color: '#111827', textAlign: 'center' }}>
                  📸 자재 사진 등록 완료 ({sellPhotos.length}/6장)
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 16 }}>
                  {sellPhotos.map((uri, idx) => (
                    <View key={idx} style={{ marginRight: 8, position: 'relative' }}>
                      <Image source={{ uri }} style={{ width: 90, height: 90, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' }} />
                      <View style={{ position: 'absolute', top: 4, left: 4, backgroundColor: '#dc2626', paddingHorizontal: 6, borderRadius: 10 }}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{idx + 1}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#991b1b', textAlign: 'center', marginBottom: 16 }}>
                  자재 사진을 더 촬영하시겠습니까?
                </Text>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 8, alignItems: 'center' }}
                    onPress={handleCapturePhoto}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>예 (추가 촬영)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#dc2626', paddingVertical: 14, borderRadius: 8, alignItems: 'center' }}
                    onPress={() => setSellStep('form_input')}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>아니오 (금액 입력)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {sellStep === 'form_input' && (
              <View>
                <Text style={s.labelOfficial}>자재 품목명 및 수량 *</Text>
                <TextInput
                  style={s.inputOfficial}
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="예: 600각 포세린 타일 15박스 급처"
                />

                <Text style={[s.labelOfficial, { marginTop: 10 }]}>🔥 헐값 급처분 희망 금액 (원) *</Text>
                <TextInput
                  style={[s.inputOfficial, { fontSize: 16, fontWeight: 'bold', color: '#dc2626' }]}
                  keyboardType="numeric"
                  value={formPrice}
                  onChangeText={setFormPrice}
                  placeholder="숫자로만 입력 (예: 60000)"
                />

                <Text style={[s.labelOfficial, { marginTop: 10 }]}>자재 보관 장소 (현장/창고 주소) *</Text>
                <TextInput
                  style={s.inputOfficial}
                  value={formLocation}
                  onChangeText={setFormLocation}
                  placeholder="예: 광주 북구 용봉동 상가 신축 현장 앞"
                />

                <Text style={[s.labelOfficial, { marginTop: 10 }]}>상차 방식 및 상세 설명</Text>
                <TextInput
                  style={[s.inputOfficial, { height: 90, textAlignVertical: 'top' }]}
                  placeholder="예: 지게차 상차 지원 불가, 직접 실어가셔야 합니다. 이번 주말까지 처분 희망."
                  value={formDesc}
                  onChangeText={setFormDesc}
                  multiline
                />

                <TouchableOpacity style={[s.primaryPastelRedButtonLarge, { backgroundColor: '#dc2626' }]} onPress={handlePublishClearance}>
                  <Text style={s.primaryButtonTextLarge}>🚀 떠리털이 게시판에 즉시 게시</Text>
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
// 공통 스타일시트
// ==========================================
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingTop: 28 },
  headerOfficialClean: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 8, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  headerTitleClean: { fontSize: 15.5, fontWeight: 'bold', textAlign: 'center', flex: 1, color: '#111827' },
  navBackBtn: { paddingVertical: 4, minWidth: 44 },
  navBackBtnText: { fontSize: 14, color: '#2563eb', fontWeight: 'bold' },
  formContainerOfficial: { padding: 14, paddingBottom: 110 },
  formContainerOfficialWithDualBar: { padding: 14, paddingBottom: 130 },

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

  closetTypeContainer: { marginVertical: 8, backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  closetTypeGrid: { flexDirection: 'row', gap: 8, marginTop: 6 },
  closetCard: { flex: 1, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 8, padding: 8, alignItems: 'center' },
  closetCardActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  closetVisualBox: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  closetCardTitle: { fontSize: 12.5, fontWeight: 'bold', color: '#111827' },
  closetCardSub: { fontSize: 10, color: '#64748b', textAlign: 'center', marginTop: 2, lineHeight: 13 },

  cameraTriggerOnlyBtn: { backgroundColor: '#1d4ed8', borderRadius: 8, paddingVertical: 13, alignItems: 'center', marginTop: 10, elevation: 2 },
  cameraTriggerOnlyBtnText: { color: '#ffffff', fontSize: 14.5, fontWeight: 'bold' },

  specGuideInfoBox: { backgroundColor: '#eff6ff', borderWidth: 1.2, borderColor: '#bfdbfe', borderRadius: 8, padding: 10, marginTop: 8, marginBottom: 6 },
  specGuideInfoTitle: { fontSize: 12, fontWeight: 'bold', color: '#1d4ed8', marginBottom: 4 },
  specGuideInfoBody: { fontSize: 11, color: '#334155', lineHeight: 16 },

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

  primaryPastelRedButtonLarge: { backgroundColor: '#f87171', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 14, elevation: 2 },
  primaryButtonTextLarge: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },

  powerAdBannerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 10, padding: 14, marginBottom: 10 },
  powerAdBannerTitle: { color: '#ffffff', fontSize: 13.5, fontWeight: 'bold' },
  powerAdBannerSub: { color: '#94a3b8', fontSize: 11, marginTop: 2, lineHeight: 15 },
  powerAdRegisterBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  powerAdRegisterBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },

  cat10GridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 4 },
  cat10Pill: { backgroundColor: '#f1f5f9', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  cat10PillActive: { backgroundColor: '#2563eb', borderColor: '#1d4ed8' },
  cat10PillText: { fontSize: 11, color: '#475569', fontWeight: 'bold' },
  cat10PillTextActive: { color: '#ffffff' },

  adCompanyCard: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, marginBottom: 10, elevation: 1 },
  adCompanyName: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  adBadgePill: { backgroundColor: '#fef3c7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#fde68a' },
  adBadgePillText: { color: '#b45309', fontSize: 10.5, fontWeight: 'bold' },
  adCompanyRegion: { fontSize: 11.5, color: '#64748b', marginVertical: 3 },
  adCompanyDesc: { fontSize: 12.5, color: '#334155', lineHeight: 18, marginBottom: 4 },
  adCompanyCases: { fontSize: 11.5, color: '#2563eb', fontWeight: 'bold', marginBottom: 10 },
  adActionRow: { flexDirection: 'row', gap: 8 },
  adCallBtn: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  adCallBtnText: { fontSize: 12, color: '#1e293b', fontWeight: 'bold' },
  adChatBtn: { flex: 1, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  adChatBtnText: { fontSize: 12, color: '#1d4ed8', fontWeight: 'bold' },

  planChoiceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 14 },
  planChoiceCardActive: { borderColor: '#ef4444', backgroundColor: '#fff5f5' },
  planChoiceTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  planChoiceSub: { fontSize: 11.5, color: '#64748b', marginTop: 2 },
  planChoicePrice: { fontSize: 15.5, fontWeight: 'bold', color: '#1d4ed8' },
  payMethodCard: { backgroundColor: '#f8fafc', borderWidth: 1.2, borderColor: '#e2e8f0', borderRadius: 8, padding: 12 },
  payMethodCardActive: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  payMethodText: { fontSize: 13, color: '#334155' },

  materialNoticeBanner: { backgroundColor: '#ecfdf5', borderWidth: 1.2, borderColor: '#a7f3d0', borderRadius: 10, padding: 12, marginBottom: 10 },
  materialNoticeTitle: { fontSize: 13, fontWeight: 'bold', color: '#065f46' },
  materialNoticeSub: { fontSize: 11, color: '#047857', marginTop: 2, lineHeight: 15 },

  searchBarWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10 },
  searchBarInput: { flex: 1, fontSize: 12.5, color: '#1e293b', paddingVertical: 2 },

  productCardBox: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, marginBottom: 12, elevation: 1 },
  productCardTopRow: { flexDirection: 'row', alignItems: 'center' },
  productImgBox: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f1f5f9', overflow: 'hidden', position: 'relative' },
  productRealPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  productDiscountBadge: { position: 'absolute', top: 3, left: 3, backgroundColor: '#dc2626', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  productDiscountText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },

  productMallPill: { backgroundColor: '#eff6ff', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 3 },
  productMallPillText: { fontSize: 10, color: '#2563eb', fontWeight: 'bold' },
  productTitleText: { fontSize: 13.5, fontWeight: 'bold', color: '#111827', lineHeight: 18 },
  productSpecText: { fontSize: 11, color: '#64748b', marginTop: 2 },

  productPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  productRegularPrice: { fontSize: 11.5, color: '#94a3b8', textDecorationLine: 'line-through' },
  productLowestPrice: { fontSize: 15, fontWeight: 'bold', color: '#dc2626' },

  productBuyBtn: { backgroundColor: '#2563eb', borderRadius: 6, paddingVertical: 9, alignItems: 'center', marginTop: 10 },
  productBuyBtnText: { color: '#ffffff', fontSize: 12.5, fontWeight: 'bold' },

  usedNoticeBanner: { backgroundColor: '#f0fdf4', borderWidth: 1.2, borderColor: '#bbf7d0', borderRadius: 10, padding: 12, marginBottom: 10 },
  usedNoticeTitle: { fontSize: 13, fontWeight: 'bold', color: '#166534' },
  usedNoticeSub: { fontSize: 11, color: '#15803d', marginTop: 2 },

  usedItemCard: { flexDirection: 'row', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, marginBottom: 10, alignItems: 'center', elevation: 1 },
  usedThumbBox: { width: 78, height: 78, borderRadius: 8, backgroundColor: '#f8fafc', overflow: 'hidden' },
  usedThumbImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  usedCardTitle: { fontSize: 13.5, fontWeight: 'bold', color: '#111827', flex: 1, marginRight: 6 },
  usedStatusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  usedStatusText: { color: '#ffffff', fontSize: 10.5, fontWeight: 'bold' },
  usedCardSubInfo: { fontSize: 11.5, color: '#64748b', marginVertical: 3 },
  usedCardPrice: { fontSize: 15, fontWeight: 'bold', color: '#111827' },

  bottomFixedDualButtonBar: { position: 'absolute', bottom: 10, left: 14, right: 14, flexDirection: 'row', gap: 8, backgroundColor: 'transparent' },
  dualSellBtn: { flex: 1, backgroundColor: '#ea580c', borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  dualGiveBtn: { flex: 1, backgroundColor: '#059669', borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  dualBtnMainText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },

  bottomFixedSingleBar: { position: 'absolute', bottom: 10, left: 14, right: 14, backgroundColor: 'transparent' },
  clearanceFixedBtn: { backgroundColor: '#dc2626', borderRadius: 10, paddingVertical: 14, alignItems: 'center', elevation: 5 },
  clearanceFixedBtnText: { color: '#ffffff', fontSize: 15.5, fontWeight: 'bold' },

  modalStepPrimaryBtn: { width: '100%', backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  modalStepPrimaryBtnText: { color: '#ffffff', fontSize: 14.5, fontWeight: 'bold' },
  modalStepSubBtn: { width: '100%', backgroundColor: '#eff6ff', borderWidth: 1.2, borderColor: '#bfdbfe', paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  modalStepSubBtnText: { color: '#1d4ed8', fontSize: 14, fontWeight: 'bold' },

  givePriceNoticeBox: { backgroundColor: '#ecfdf5', borderWidth: 1.2, borderColor: '#6ee7b7', padding: 12, borderRadius: 8, marginVertical: 6, alignItems: 'center' },
  givePriceNoticeText: { color: '#047857', fontWeight: 'bold', fontSize: 13.5 },

  chatHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  chatHeaderSellerName: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  chatHeaderSellerSub: { fontSize: 10.5, color: '#16a34a', marginTop: 1 },
  chatHeaderCallBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#bfdbfe' },
  chatHeaderCallBtnText: { fontSize: 12, color: '#1d4ed8', fontWeight: 'bold' },

  chatProductSummaryBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 14, paddingVertical: 9, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  chatProductThumb: { width: 44, height: 44, borderRadius: 6, backgroundColor: '#e2e8f0' },
  chatProductTitle: { fontSize: 13, fontWeight: 'bold', color: '#1f2937' },
  chatProductPrice: { fontSize: 13.5, fontWeight: 'bold', color: '#111827', marginTop: 2 },
  chatProductStatusPill: { backgroundColor: '#e0e7ff', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  chatProductStatusPillText: { fontSize: 10.5, color: '#3730a3', fontWeight: 'bold' },

  chatMessageListContent: { padding: 14, paddingBottom: 20 },
  chatBubbleWrap: { marginVertical: 4, flexDirection: 'row' },
  chatBubbleWrapMe: { justifyContent: 'flex-end' },
  chatBubbleWrapSeller: { justifyContent: 'flex-start' },
  chatBubbleBox: { maxWidth: '78%', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14 },
  chatBubbleBoxMe: { backgroundColor: '#2563eb', borderBottomRightRadius: 2 },
  chatBubbleBoxSeller: { backgroundColor: '#f1f5f9', borderBottomLeftRadius: 2 },
  chatBubbleText: { fontSize: 13, lineHeight: 18 },
  chatBubbleTextMe: { color: '#ffffff' },
  chatBubbleTextSeller: { color: '#1e293b' },

  chatInputBarWrap: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff', alignItems: 'center' },
  chatTextInputField: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 13 },
  chatSendActionBtn: { backgroundColor: '#2563eb', paddingHorizontal: 15, paddingVertical: 9, borderRadius: 20, marginLeft: 8 },
  chatSendActionBtnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' }
});