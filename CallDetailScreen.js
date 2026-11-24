import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, Modal } from 'react-native';

// AI 텍스트에만 적용합니다. 고객이 작성한 요청 내용과 희망 금액은 가공하지 않습니다.
export function getProviderAiDiagnosis(diagnosis) {
  const parts = typeof diagnosis === 'string'
    ? [diagnosis]
    : [diagnosis?.title, diagnosis?.description];
  return parts.filter(part => typeof part === 'string').map(part => part
    .replace(/(?:AI\s*)?(?:권장|추천|표준|예상)\s*(?:수리\s*)?(?:시세|금액|비용|견적|수리비)[^\n]*/gi, '')
    .replace(/(?:[0-9][0-9,]*(?:\.[0-9]+)?\s*(?:~|～|–|-)\s*)?[0-9][0-9,]*(?:\.[0-9]+)?\s*(?:만|천|억)?\s*원/g, '[금액 제외]')
    .replace(/(?:₩|KRW)\s*[0-9][0-9,.]*|[0-9][0-9,.]*\s*KRW/gi, '[금액 제외]')
    .trim()).filter(Boolean).join('\n');
}

function isPhotoUri(uri) {
  return typeof uri === 'string' && /^(?:https?:\/\/|file:\/\/|content:\/\/|ph:\/\/|data:image\/)/.test(uri) &&
    !/\s/.test(uri) && uri.length > uri.indexOf(':') + 3;
}

export default function CallDetailScreen({ request, onBack }) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [failedPhotos, setFailedPhotos] = useState([]);
  const photos = Array.isArray(request?.photos) ? request.photos : [];
  const expandedUri = expandedIndex === null ? null : photos[expandedIndex];
  const recordPhotoFailure = (index) => {
    setFailedPhotos(prev => prev.includes(index) ? prev : [...prev, index]);
  };
  const aiText = getProviderAiDiagnosis(request?.aiDiagnosis);
  const customerText = typeof request?.customerRequest === 'string'
    ? request.customerRequest
    : typeof request?.diagnosis === 'string' ? request.diagnosis : '';

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} accessibilityRole="button" style={s.backButton}>
          <Text style={s.backText}>‹ 콜 목록</Text>
        </TouchableOpacity>
        <Text style={s.title}>콜 상세</Text>
      </View>
      {!request ? (
        <View style={s.body}>
          <Text style={s.value}>수신 대상이 확인된 요청 정보를 찾을 수 없습니다.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.body}>
          <Text style={s.label}>현장 사진</Text>
          {photos.length === 0 ? <Text style={s.value}>등록된 사진이 없습니다.</Text> : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photos}>
              {photos.map((uri, index) => (
                <TouchableOpacity
                  key={index}
                  accessibilityRole="button"
                  accessibilityLabel={`현장 사진 ${index + 1} 확대`}
                  disabled={!isPhotoUri(uri) || failedPhotos.includes(index)}
                  onPress={() => setExpandedIndex(index)}
                  style={s.thumbnailBox}
                >
                  {!isPhotoUri(uri) || failedPhotos.includes(index) ? (
                    <Text style={s.photoError}>사진을 불러올 수 없습니다</Text>
                  ) : (
                    <Image source={{ uri }} style={s.thumbnail} onError={() => recordPhotoFailure(index)} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          <Text style={s.label}>AI 원본 진단</Text>
          <Text style={s.value}>{aiText || 'AI 원본 진단이 저장되지 않았습니다.'}</Text>
          <Text style={s.label}>고객 최종 수리 요청</Text>
          <Text style={s.value}>{customerText || '등록된 요청 내용이 없습니다.'}</Text>
          <Text style={s.label}>고객 희망 수리 금액</Text>
          <Text style={s.price}>{Number.isSafeInteger(request.price) && request.price > 0
            ? `${request.price.toLocaleString()}원` : '금액 정보가 없습니다.'}</Text>
          <Text style={s.label}>현장 주소</Text>
          <Text style={s.value}>{typeof request.address === 'string' ? request.address : '주소 정보가 없습니다.'}</Text>
          <Text style={s.label}>요청 상태</Text>
          <Text style={s.value}>{typeof request.status === 'string' ? request.status : '상태 정보가 없습니다.'}</Text>
        </ScrollView>
      )}
      <Modal visible={expandedIndex !== null} animationType="fade" onRequestClose={() => setExpandedIndex(null)}>
        <View style={s.expandedContainer}>
          <TouchableOpacity accessibilityRole="button" onPress={() => setExpandedIndex(null)} style={s.closeButton}>
            <Text style={s.closeText}>✕ 닫기</Text>
          </TouchableOpacity>
          {isPhotoUri(expandedUri) && !failedPhotos.includes(expandedIndex) ? (
            <Image
              source={{ uri: expandedUri }}
              resizeMode="contain"
              style={s.expandedImage}
              onError={() => recordPhotoFailure(expandedIndex)}
            />
          ) : <Text style={s.closeText}>사진을 불러올 수 없습니다.</Text>}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingTop: 26 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  backButton: { minHeight: 44, justifyContent: 'center', paddingRight: 16 },
  backText: { color: '#2563eb', fontSize: 14 },
  title: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
  body: { padding: 16, paddingBottom: 32 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#374151', marginTop: 16, marginBottom: 8 },
  value: { fontSize: 14, color: '#1f2937', lineHeight: 22 },
  price: { fontSize: 17, fontWeight: 'bold', color: '#dc2626' },
  photos: { marginBottom: 8 },
  thumbnailBox: { width: 84, height: 84, marginRight: 8, borderRadius: 8, backgroundColor: '#f1f5f9', justifyContent: 'center' },
  thumbnail: { width: 84, height: 84, borderRadius: 8 },
  photoError: { fontSize: 11, textAlign: 'center', color: '#64748b', padding: 4 },
  expandedContainer: { flex: 1, backgroundColor: '#111827', paddingTop: 26 },
  closeButton: { alignSelf: 'flex-end', minHeight: 44, paddingHorizontal: 18, justifyContent: 'center' },
  closeText: { color: '#ffffff', fontSize: 14, textAlign: 'center' },
  expandedImage: { flex: 1, width: '100%' }
});
