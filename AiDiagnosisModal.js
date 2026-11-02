// AiDiagnosisModal.js - 실시간 AI 정밀진단 및 기술자(고수) 호출 모달
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';

export function AiDiagnosisModal({ visible, initialPhotos = [], onClose, onCompleteOrder }) {
  const [photos, setPhotos] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  
  // AI 판독 결과 상태
  const [category, setCategory] = useState('설비/종합');
  const [symptom, setSymptom] = useState('수전 누수 및 패킹 마모 의심');
  const [estimatedPrice, setEstimatedPrice] = useState(45000);
  const [userDesc, setUserDesc] = useState('');
  const [address, setAddress] = useState('광주광역시 광산구 고봉로 417');

  // 사진이 전달되면 AI 모의 비전 분석 실행
  useEffect(() => {
    if (visible && initialPhotos && initialPhotos.length > 0) {
      setPhotos(initialPhotos);
      setAnalyzing(true);
      
      const timer = setTimeout(() => {
        setAnalyzing(false);
      }, 1200);

      return () => clearTimeout(timer);
    } else if (visible) {
      setPhotos([]);
      setAnalyzing(false);
    }
  }, [visible, initialPhotos]);

  // 실시간 기술자(고수) 호출 핸들러
  const handleCallTechnician = () => {
    const finalPrice = estimatedPrice || 45000;
    
    // 규격화된 수리 주문 객체 생성
    const newOrder = {
      id: `req-${Date.now()}`,
      reqNumber: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      tagBadge: category,
      targetCategory: category,
      categoryName: category,
      diagnosis: symptom + (userDesc ? ` (${userDesc})` : ''),
      price: finalPrice,
      address: address,
      photos: photos,
      imageUri: photos[0] || null,
      status: '기술자 응답 대기중',
      createdAt: Date.now()
    };

    // 상위 콜백 호출 및 모달 닫기
    if (onCompleteOrder) {
      onCompleteOrder(newOrder);
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          {/* 상단 닫기 헤더 */}
          <View style={s.modalHeader}>
            <View>
              <Text style={s.modalTitle}>실시간 AI 정밀 진단</Text>
              <Text style={s.modalSubTitle}>사진 분석 기반 표준 시세 및 기술자 호출</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
              <Text style={s.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* 1. 첨부된 현장 사진 미리보기 */}
            <View style={{ marginTop: 12, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={s.sectionLabel}>📷 첨부된 수리 부위 사진</Text>
                <Text style={s.photoCountText}>{photos.length}장 등록됨</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {photos.length > 0 ? (
                  photos.map((uri, idx) => (
                    <Image key={idx} source={{ uri }} style={s.photoThumb} />
                  ))
                ) : (
                  <View style={s.noPhotoBox}>
                    <Text style={{ color: '#94a3b8', fontSize: 13 }}>등록된 사진이 없습니다.</Text>
                  </View>
                )}
              </ScrollView>
            </View>

            {/* 2. AI 판독 상태 및 결과 영역 */}
            {analyzing ? (
              <View style={s.loadingBox}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={s.loadingText}>AI 비전 모델이 수리 부위를 정밀 판독하고 있습니다...</Text>
              </View>
            ) : (
              <View style={s.resultBox}>
                <View style={s.resultBadgeRow}>
                  <View style={s.aiBadge}>
                    <Text style={s.aiBadgeText}>AI 판독 완료</Text>
                  </View>
                  <Text style={s.categoryNameText}>분류: {category}</Text>
                </View>

                <Text style={s.symptomText}>🔍 {symptom}</Text>

                {/* AI 권장 표준 견적가 */}
                <View style={s.priceRow}>
                  <Text style={s.priceLabel}>AI 권장 시세</Text>
                  <Text style={s.priceValue}>{Number(estimatedPrice).toLocaleString()}원</Text>
                </View>
                <Text style={s.priceNotice}>※ 부품비 및 난이도에 따라 현장에서 상호 협의 가능합니다.</Text>
              </View>
            )}

            {/* 3. 수리 현장 주소 */}
            <Text style={[s.sectionLabel, { marginTop: 14 }]}>수리 방문 주소 *</Text>
            <TextInput
              style={s.input}
              value={address}
              onChangeText={setAddress}
              placeholder="방문 주소를 입력해 주세요"
            />

            {/* 4. 고객 추가 전달사항 */}
            <Text style={[s.sectionLabel, { marginTop: 12 }]}>추가 고장 증상 / 요청사항 (선택)</Text>
            <TextInput
              style={[s.input, { height: 70, textAlignVertical: 'top' }]}
              placeholder="예: 물이 뚝뚝 떨어지고 소리가 납니다. 빠른 방문 부탁드립니다."
              value={userDesc}
              onChangeText={setUserDesc}
              multiline
            />

            {/* 5. 실시간 기술자(고수) 호출하기 버튼 */}
            <TouchableOpacity
              style={s.callTechnicianBtn}
              onPress={handleCallTechnician}
              activeOpacity={0.88}
            >
              <Text style={s.callTechnicianBtnText}>⚡ 실시간 기술자(고수) 호출하기</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    maxHeight: '88%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: 12
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  modalSubTitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  closeText: { fontSize: 20, color: '#94a3b8', fontWeight: 'bold' },

  sectionLabel: { fontSize: 13.5, fontWeight: 'bold', color: '#334155', marginBottom: 6 },
  photoCountText: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },
  photoThumb: { width: 78, height: 78, borderRadius: 10, marginRight: 8, backgroundColor: '#f1f5f9' },
  noPhotoBox: { width: '100%', height: 70, backgroundColor: '#f8fafc', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },

  loadingBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  loadingText: { fontSize: 12.5, color: '#1d4ed8', marginTop: 8, fontWeight: '600' },

  resultBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginVertical: 10
  },
  resultBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  aiBadge: { backgroundColor: '#2563eb', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  aiBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  categoryNameText: { fontSize: 12.5, fontWeight: 'bold', color: '#475569' },
  symptomText: { fontSize: 14.5, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  priceLabel: { fontSize: 13, fontWeight: 'bold', color: '#1e40af' },
  priceValue: { fontSize: 17, fontWeight: '900', color: '#1d4ed8' },
  priceNotice: { fontSize: 11, color: '#64748b', marginTop: 6, lineHeight: 15 },

  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0f172a'
  },

  callTechnicianBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3
  },
  callTechnicianBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});