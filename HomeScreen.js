// HomeScreen.js - 자재마켓 아이콘 쇼핑카트(🛒) 및 실시간 매칭현황 핀셋 반영 완전체
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

// [8대 정식 카테고리 - 8번: 자재마켓 아이콘 쇼핑 카트(🛒) 반영]
const CATEGORIES = [
  { id: 'simple_labor', name: '단순인력', icon: '💪', screen: 'simple_labor' },
  { id: 'cleaning', name: '청소/방역', icon: '🧹', screen: 'cleaning' },
  { id: 'furniture_kitchen', name: '싱크대/가구', icon: '🪑', screen: 'furniture_kitchen' },
  { id: 'moving_delivery', name: '이사/배송', icon: '🚚', screen: 'moving_delivery' },
  { id: 'heavy_construction', name: '각종공사/중장비', icon: '🚜', screen: 'heavy_construction' },
  { id: 'materials_market', name: '자재마켓', icon: '🛒', screen: 'materials_market' },
  { id: 'used_market', name: '중고장터', icon: '🤝', screen: 'used_market' },
  { id: 'surplus_clearance', name: '떠리털이', icon: '🔥', screen: 'surplus_clearance' }
];

export default function HomeScreen({
  currentRegionDisplay,
  requestList,
  onNavigate,
  onAddOrder,
  currentUser,
  onOpenAuth
}) {
  const [methodModalVisible, setMethodModalVisible] = useState(false);
  const [askMoreModalVisible, setAskMoreModalVisible] = useState(false);
  const [aiFlowModalVisible, setAiFlowModalVisible] = useState(false);

  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiStep, setAiStep] = useState('question');

  const [aiResult, setAiResult] = useState({
    category: '설비/종합수리',
    title: '싱크대 하부 배관 노후 누수 및 패킹 마모 진단',
    range: '45,000원 ~ 65,000원',
    recommended: '55000'
  });

  const [customDesc, setCustomDesc] = useState('');
  const [finalPrice, setFinalPrice] = useState('55000');
  const [finalAddr, setFinalAddr] = useState(currentRegionDisplay || '광주광역시 북구 용봉동');

  const handleCameraCapture = async (currentList = capturedPhotos) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 접근 권한을 허용해 주세요.');
      return;
    }

    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      const newUri = res.assets[0].uri;
      const updated = [...currentList, newUri].slice(0, 5);
      setCapturedPhotos(updated);

      if (updated.length < 3) {
        Alert.alert(
          `📷 촬영 완료 (${updated.length}/5장)`,
          '각도를 다르게 찍어 주세요. (연속 최소 3장 촬영 필수)',
          [{ text: '다음 각도 촬영하기', onPress: () => handleCameraCapture(updated) }]
        );
      } else if (updated.length >= 5) {
        Alert.alert('촬영 완료', '최대 5장 촬영이 완료되어 AI 판독을 시작합니다.', [
          { text: '확인', onPress: () => startAiDiagnosis() }
        ]);
      } else {
        setAskMoreModalVisible(true);
      }
    }
  };

  const handleGalleryPick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsMultipleSelection: true
    });

    if (!res.canceled && res.assets && res.assets.length > 0) {
      const uris = res.assets.map(a => a.uri);
      const updated = [...capturedPhotos, ...uris].slice(0, 5);
      setCapturedPhotos(updated);

      if (updated.length < 3) {
        Alert.alert(
          '사진 부족 (최소 3장)',
          `현재 ${updated.length}장이 등록되었습니다. 정확한 AI 진단을 위해 최소 3장 이상 필요합니다.`,
          [
            { text: '📷 카메라로 추가 촬영', onPress: () => handleCameraCapture(updated) },
            { text: '🖼️ 갤러리 다시 선택', onPress: handleGalleryPick }
          ]
        );
      } else {
        setAskMoreModalVisible(true);
      }
    }
  };

  const startAiDiagnosis = () => {
    setMethodModalVisible(false);
    setAskMoreModalVisible(false);
    setAiFlowModalVisible(true);
    setIsAiAnalyzing(true);
    setAiStep('question');

    setTimeout(() => {
      setIsAiAnalyzing(false);
      setFinalPrice('55000');
      setCustomDesc('싱크대 배관 누수 부품 교체 및 패킹 보강 작업');
    }, 1200);
  };

  const handleFinalMatching = () => {
    if (!finalPrice.trim()) {
      Alert.alert('확인', '희망 수리 금액을 입력해 주세요.');
      return;
    }

    if (onAddOrder) {
      onAddOrder({
        category: aiResult.category,
        title: customDesc || aiResult.title,
        price: parseInt(finalPrice, 10) || 55000,
        address: finalAddr,
        photos: capturedPhotos
      });
    }

    Alert.alert(
      '기술자 매칭 접수 완료 🚀',
      `[${aiResult.category}]\n사진 ${capturedPhotos.length}장과 함께 ${finalAddr} 관내 전문 기술자팀에 실시간 알림이 발송되었습니다!`
    );

    setAiFlowModalVisible(false);
    setCapturedPhotos([]);
    setCustomDesc('');
  };

  return (
    <View style={s.container}>
      {/* 1. 상단 네비게이션 헤더 */}
      <View style={s.topNavHeader}>
        <View style={s.brandRow}>
          {/* 개발 검토용: 회원가입/역할선택으로 돌아가는 작은 글씨 버튼 */}
          <TouchableOpacity
            style={s.devBackBtnSmall}
            activeOpacity={0.6}
            onPress={onOpenAuth}
          >
            <Text style={s.devBackBtnSmallText}>‹ 이전</Text>
          </TouchableOpacity>

          <Text style={s.brandLogoIcon}>🏠</Text>
          <Text style={s.brandTitleText}>수리수리 AI</Text>
          <View style={s.regionPillBadge}>
            <Text style={s.regionPillText}>📍 {currentRegionDisplay || '광주 북구'}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollBody} showsVerticalScrollIndicator={false}>
        {/* 2. 상단 AI 진단 배너 */}
        <TouchableOpacity
          style={s.heroAiDiagnosticCard}
          activeOpacity={0.88}
          onPress={() => setMethodModalVisible(true)}
        >
          <Text style={s.heroQuestionText}>어떤 수리를 고민하십니까?</Text>
          <Text style={s.heroCatchPhrase}>사진 한 장 찍고 3초 만에 진단부터 견적까지 ⚡</Text>

          <View style={s.heroCameraTriggerRowDeepBlueCentered}>
            <Text style={s.heroCameraTriggerMainText}>수리부위 사진촬영 (클릭)</Text>
            <View style={s.heroSubRowCentered}>
              <Text style={s.heroCameraTriggerSubText}>(1/5장)</Text>
              <Text style={s.heroCameraEmoji}>📷</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 3. 8대 공정 카테고리 */}
        <Text style={s.sectionTitle}>🛠 원클릭 전문 직거래 공정</Text>
        <View style={s.categoryGridWrap}>
          {CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={s.gridItemBoxClean}
              activeOpacity={0.7}
              onPress={() => onNavigate(item.screen)}
            >
              <View style={s.gridIconCircleClean}>
                <Text style={{ fontSize: 26 }}>{item.icon}</Text>
              </View>
              <Text style={s.gridItemLabelClean}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. 실시간 매칭현황 (9-1번 반영: 실시간 매칭현황으로 변경 및 대기건수 삭제) */}
        <View style={s.feedHeaderRow}>
          <Text style={s.sectionTitle}>⚡ 실시간 매칭현황</Text>
        </View>

        {requestList && requestList.map((req) => (
          <View key={req.id} style={s.feedItemCard}>
            <View style={s.feedCardTop}>
              <View style={s.feedTagPill}>
                <Text style={s.feedTagPillText}>{req.tagBadge}</Text>
              </View>
              <Text style={s.feedStatusText}>● {req.status}</Text>
            </View>
            <Text style={s.feedDiagText}>{req.diagnosis}</Text>
            {req.photos && req.photos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                {req.photos.map((uri, idx) => (
                  <Image key={idx} source={{ uri }} style={s.feedPhotoThumb} />
                ))}
              </ScrollView>
            )}
            <View style={s.feedBottomRow}>
              <Text style={s.feedAddrText}>📍 {req.address}</Text>
              <Text style={s.feedPriceText}>{Number(req.price).toLocaleString()}원</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 모달 1단계: 사진 등록 방식 선택 */}
      <Modal visible={methodModalVisible} transparent animationType="fade">
        <View style={s.modalCenterOverlay}>
          <View style={s.popCardBox}>
            <Text style={s.popCardTitle}>📷 수리부위 사진등록 (최소 3장 ~ 최대 5장)</Text>
            <Text style={s.popCardSubNotice}>정확한 AI 진단을 위해 등록 방식을 선택해 주세요.</Text>
            <View style={{ gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={s.methodChoiceBtnPrimary}
                onPress={() => {
                  setMethodModalVisible(false);
                  handleCameraCapture(capturedPhotos);
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 8 }}>📷</Text>
                <Text style={s.methodChoiceBtnPrimaryText}>직접 카메라 촬영 (권장)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.methodChoiceBtnSecondary}
                onPress={() => {
                  setMethodModalVisible(false);
                  handleGalleryPick();
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 8 }}>🖼️</Text>
                <Text style={s.methodChoiceBtnSecondaryText}>갤러리에서 선택</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setMethodModalVisible(false)}>
                <Text style={s.modalCancelBtnText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 모달 2단계: 추가 촬영 여부 확인 */}
      <Modal visible={askMoreModalVisible} transparent animationType="fade">
        <View style={s.modalCenterOverlay}>
          <View style={s.popCardBox}>
            <Text style={s.popCardTitle}>📸 사진 등록 확인 ({capturedPhotos.length}/5장)</Text>
            <Text style={s.popCardSubNotice}>추가 사진을 더 촬영하시겠습니까?{'\n'}(아니오 선택 시 AI 판독 시작)</Text>
            <View style={s.yesNoBtnRow}>
              <TouchableOpacity
                style={s.btnChoiceYesMultiLine}
                onPress={() => {
                  setAskMoreModalVisible(false);
                  handleCameraCapture(capturedPhotos);
                }}
              >
                <Text style={s.btnChoiceMainTitle}>예</Text>
                <Text style={s.btnChoiceSubTitle}>(추가촬영)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.btnChoiceNoMultiLine}
                onPress={() => {
                  setAskMoreModalVisible(false);
                  startAiDiagnosis();
                }}
              >
                <Text style={s.btnChoiceMainTitle}>아니오</Text>
                <Text style={s.btnChoiceSubTitle}>(판독시작)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 모달 3단계: AI 정밀 진단 */}
      <Modal visible={aiFlowModalVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#ffffff', paddingTop: 26 }}>
          <View style={s.modalTopHeaderClean}>
            <TouchableOpacity onPress={() => setAiFlowModalVisible(false)} style={s.navCloseBtn}>
              <Text style={s.navCloseBtnText}>✕ 닫기</Text>
            </TouchableOpacity>
            <Text style={s.modalHeaderTitle}>🤖 수리수리 AI 정밀 진단</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={s.modalScrollContent}>
            {isAiAnalyzing ? (
              <View style={s.analyzingLoadingBox}>
                <Text style={{ fontSize: 44, marginBottom: 12 }}>🔄</Text>
                <Text style={s.analyzingTitle}>수리 부위 AI 정밀 판독 중...</Text>
                <Text style={s.analyzingSub}>
                  등록하신 {capturedPhotos.length}장의 사진으로 손상 부위 및 규격 자재를 분석하고 있습니다.
                </Text>
              </View>
            ) : (
              <View>
                <View style={s.aiDiagnosisResultCard}>
                  <View style={s.aiTagBadgeRow}>
                    <Text style={s.aiTagLead}>해당공정:</Text>
                    <View style={s.aiTagPill}>
                      <Text style={s.aiTagPillText}>{aiResult.category}</Text>
                    </View>
                  </View>
                  <Text style={s.aiDiagnosisMainTitle}>{aiResult.title}</Text>
                  <View style={s.aiPriceGuideRow}>
                    <Text style={s.aiPriceGuideLabel}>AI 권장 표준시세:</Text>
                    <Text style={s.aiPriceGuideVal}>{aiResult.range}</Text>
                  </View>
                </View>

                {aiStep === 'question' && (
                  <View style={s.stepQuestionBox}>
                    <Text style={s.stepQuestionTitle}>❓ AI가 판독한 위 수리 내용이 맞습니까?</Text>
                    <View style={s.yesNoBtnRow}>
                      <TouchableOpacity style={s.btnChoiceYesSimple} onPress={() => setAiStep('final_input')}>
                        <Text style={s.btnChoiceTextWhite}>예</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.btnChoiceOrangeCompact} onPress={() => setAiStep('manual_edit')}>
                        <Text style={s.btnChoiceTextWhite}>아니오</Text>
                        <Text style={s.btnChoiceSubSmallText}> (내용 입력)</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {aiStep === 'manual_edit' && (
                  <View style={s.stepEditBox}>
                    <Text style={s.inputLabelRed}>✍️ 실제 수리 희망 내용을 직접 작성해 주세요.</Text>
                    <TextInput
                      style={s.modalMultilineInput}
                      placeholder="예: 싱크대 수전 교체 및 배수구 호스 악취 차단 캡 교체 요청"
                      value={customDesc}
                      onChangeText={setCustomDesc}
                      multiline
                    />
                    <TouchableOpacity style={s.confirmEditActionBtn} onPress={() => setAiStep('final_input')}>
                      <Text style={s.confirmEditActionBtnText}>수정 내용 확정 및 금액 입력 ›</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {aiStep === 'final_input' && (
                  <View style={s.stepFinalInputBox}>
                    <Text style={s.inputFieldTitle}>📷 등록된 현장 사진 ({capturedPhotos.length}장)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photoPreviewScroll}>
                      {capturedPhotos.map((uri, idx) => (
                        <View key={idx} style={s.photoWrapBadge}>
                          <Image source={{ uri }} style={s.capturedThumbImg} />
                          <View style={s.photoOrderBadge}>
                            <Text style={s.photoOrderBadgeText}>{idx + 1}</Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>

                    <Text style={[s.inputFieldTitle, { marginTop: 12 }]}>💰 고객 직접 지급 희망 수리 금액 (원) *</Text>
                    <TextInput
                      style={s.modalSingleInput}
                      keyboardType="numeric"
                      value={finalPrice}
                      onChangeText={setFinalPrice}
                    />

                    <Text style={[s.inputFieldTitle, { marginTop: 12 }]}>수리 현장 주소 *</Text>
                    <TextInput
                      style={s.modalSingleInput}
                      value={finalAddr}
                      onChangeText={setFinalAddr}
                    />

                    <Text style={[s.inputFieldTitle, { marginTop: 12 }]}>확정된 수리 요청 내용</Text>
                    <TextInput
                      style={[s.modalMultilineInput, { height: 60 }]}
                      value={customDesc || aiResult.title}
                      onChangeText={setCustomDesc}
                      multiline
                    />

                    <TouchableOpacity style={s.matchingSubmitBtn} activeOpacity={0.85} onPress={handleFinalMatching}>
                      <Text style={s.matchingSubmitBtnText}>🚀 기술자 매칭 호출하기 ({capturedPhotos.length}장 사진 첨부)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={s.backToQuestionBtn} onPress={() => setAiStep('question')}>
                      <Text style={s.backToQuestionBtnText}>‹ 판독 확인으로 돌아가기</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingTop: 26 },
  topNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9'
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },

  devBackBtnSmall: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginRight: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 6
  },
  devBackBtnSmallText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold'
  },

  brandLogoIcon: { fontSize: 22, marginRight: 4 },
  brandTitleText: { fontSize: 17, fontWeight: 'bold', color: '#1a73e8' },
  regionPillBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 6
  },
  regionPillText: { fontSize: 11, color: '#2563eb', fontWeight: 'bold' },

  scrollBody: { paddingHorizontal: 16, paddingBottom: 20 },

  heroAiDiagnosticCard: {
    backgroundColor: '#dbeafe',
    borderWidth: 1.8,
    borderColor: '#60a5fa',
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    marginBottom: 18,
    elevation: 2
  },
  heroQuestionText: { fontSize: 18.5, fontWeight: 'bold', color: '#1e40af' },
  heroCatchPhrase: { fontSize: 13, color: '#2563eb', fontWeight: 'bold', marginTop: 6, marginBottom: 14 },
  heroCameraTriggerRowDeepBlueCentered: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2
  },
  heroCameraTriggerMainText: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
  heroSubRowCentered: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 3, gap: 6 },
  heroCameraTriggerSubText: { fontSize: 13, fontWeight: '600', color: '#bfdbfe', textAlign: 'center' },
  heroCameraEmoji: { fontSize: 18 },

  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 10 },
  categoryGridWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  gridItemBoxClean: { width: '23%', alignItems: 'center', paddingVertical: 6, marginBottom: 8 },
  gridIconCircleClean: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    elevation: 1
  },
  gridItemLabelClean: { fontSize: 11.5, color: '#334155', fontWeight: 'bold', textAlign: 'center' },

  feedHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  feedItemCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10
  },
  feedCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feedTagPill: { backgroundColor: '#f1f5f9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  feedTagPillText: { fontSize: 11, color: '#475569', fontWeight: 'bold' },
  feedStatusText: { fontSize: 11.5, color: '#16a34a', fontWeight: 'bold' },
  feedDiagText: { fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginVertical: 6 },
  feedPhotoThumb: { width: 68, height: 68, borderRadius: 8, marginRight: 8, backgroundColor: '#f1f5f9' },
  feedBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  feedAddrText: { fontSize: 12, color: '#64748b' },
  feedPriceText: { fontSize: 14.5, fontWeight: 'bold', color: '#dc2626' },

  modalCenterOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  popCardBox: { width: '100%', backgroundColor: '#ffffff', borderRadius: 16, padding: 20, elevation: 6 },
  popCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  popCardSubNotice: { fontSize: 12.5, color: '#64748b', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  methodChoiceBtnPrimary: { flexDirection: 'row', backgroundColor: '#2563eb', paddingVertical: 13, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  methodChoiceBtnPrimaryText: { color: '#ffffff', fontSize: 14.5, fontWeight: 'bold' },
  methodChoiceBtnSecondary: { flexDirection: 'row', backgroundColor: '#eff6ff', borderWidth: 1.2, borderColor: '#bfdbfe', paddingVertical: 13, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  methodChoiceBtnSecondaryText: { color: '#1d4ed8', fontSize: 14, fontWeight: 'bold' },
  modalCancelBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  modalCancelBtnText: { color: '#64748b', fontSize: 13, fontWeight: 'bold' },
  yesNoBtnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btnChoiceYesMultiLine: { flex: 1, backgroundColor: '#16a34a', paddingVertical: 11, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnChoiceNoMultiLine: { flex: 1, backgroundColor: '#2563eb', paddingVertical: 11, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnChoiceMainTitle: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  btnChoiceSubTitle: { color: '#ffffff', fontSize: 11.5, marginTop: 2 },
  btnChoiceYesSimple: { flex: 1, backgroundColor: '#16a34a', paddingVertical: 13, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnChoiceOrangeCompact: { flex: 1.2, backgroundColor: '#ea580c', paddingVertical: 13, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnChoiceTextWhite: { color: '#ffffff', fontSize: 14.5, fontWeight: 'bold' },
  btnChoiceSubSmallText: { color: '#ffffff', fontSize: 11.5, fontWeight: '600' },
  modalTopHeaderClean: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  navCloseBtn: { paddingVertical: 4, minWidth: 44 },
  navCloseBtnText: { fontSize: 14, color: '#2563eb', fontWeight: 'bold' },
  modalHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  modalScrollContent: { padding: 16, paddingBottom: 80 },
  analyzingLoadingBox: { alignItems: 'center', paddingVertical: 50 },
  analyzingTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 6 },
  analyzingSub: { fontSize: 12.5, color: '#64748b', textAlign: 'center', paddingHorizontal: 20 },
  aiDiagnosisResultCard: { backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#86efac', borderRadius: 12, padding: 16, marginBottom: 16 },
  aiTagBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  aiTagLead: { fontSize: 13, fontWeight: 'bold', color: '#15803d' },
  aiTagPill: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  aiTagPillText: { color: '#fff', fontSize: 11.5, fontWeight: 'bold' },
  aiDiagnosisMainTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginVertical: 6 },
  aiPriceGuideRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  aiPriceGuideLabel: { fontSize: 13, fontWeight: 'bold', color: '#475569' },
  aiPriceGuideVal: { fontSize: 16, fontWeight: 'bold', color: '#dc2626' },
  stepQuestionBox: { marginTop: 10 },
  stepQuestionTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 10 },
  stepEditBox: { marginTop: 10 },
  inputLabelRed: { fontSize: 13, fontWeight: 'bold', color: '#dc2626', marginBottom: 6 },
  modalMultilineInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 13, height: 80, textAlignVertical: 'top' },
  confirmEditActionBtn: { backgroundColor: '#f87171', paddingVertical: 13, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  confirmEditActionBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  stepFinalInputBox: { marginTop: 10 },
  inputFieldTitle: { fontSize: 13, fontWeight: 'bold', color: '#1f2937', marginBottom: 6 },
  photoPreviewScroll: { flexDirection: 'row', marginBottom: 12 },
  photoWrapBadge: { position: 'relative', marginRight: 10 },
  capturedThumbImg: { width: 84, height: 84, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1' },
  photoOrderBadge: { position: 'absolute', top: 4, left: 4, backgroundColor: '#2563eb', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  photoOrderBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  modalSingleInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  matchingSubmitBtn: { backgroundColor: '#f87171', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 20, elevation: 3 },
  matchingSubmitBtnText: { color: '#ffffff', fontSize: 15.5, fontWeight: 'bold' },
  backToQuestionBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  backToQuestionBtnText: { color: '#64748b', fontSize: 13, fontWeight: 'bold' }
});