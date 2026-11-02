// AiFlowScreen.js
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput
} from 'react-native';

export default function AiFlowScreen({
  aiAnalysisResult,
  initialPrice,
  defaultAddress,
  onGoBack,
  onSubmit
}) {
  const [customerPrice, setCustomerPrice] = useState(initialPrice || '');
  const [repairAddress, setRepairAddress] = useState(defaultAddress || '광주광역시 광산구 고봉로 417');

  return (
    <View style={styles.container}>
      <View style={styles.headerOfficial}>
        <TouchableOpacity onPress={onGoBack} style={styles.navBackBtn}>
          <Text style={styles.navBackBtnText}>‹ 홈으로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitleOfficial}>AI 판독 및 견적 설정</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.formContainerOfficial}>
        {aiAnalysisResult && (
          <View style={styles.aiResultCard}>
            <View style={styles.aiBadgeRow}>
              <View style={styles.aiTagBadge}><Text style={styles.aiTagBadgeText}>AI 분석완료</Text></View>
              <Text style={styles.aiCategoryText}>분야: {aiAnalysisResult.detectedCategory}</Text>
            </View>
            <Text style={styles.aiResultTitle}>{aiAnalysisResult.detectedTitle}</Text>

            <View style={styles.aiCostBreakdownCard}>
              <View style={styles.costDetailRow}>
                <Text style={styles.costDetailLabel}>필요한 전체 자재비의 합:</Text>
                <Text style={styles.costDetailVal}>{aiAnalysisResult.materialCostTotal?.toLocaleString()}원</Text>
              </View>
              <View style={styles.costDetailRow}>
                <Text style={styles.costDetailLabel}>표준 기술 공임비:</Text>
                <Text style={styles.costDetailVal}>{aiAnalysisResult.laborCost?.toLocaleString()}원</Text>
              </View>
              <View style={[styles.costDetailRow, { borderTopWidth: 1, borderColor: '#e2e8f0', paddingTop: 3, marginTop: 3 }]}>
                <Text style={styles.costTotalLabel}>= 예상 산출 합계:</Text>
                <Text style={styles.costTotalVal}>{aiAnalysisResult.totalEstimate?.toLocaleString()}원</Text>
              </View>
            </View>

            <Text style={styles.aiPartsInfo}>권장 소모부품: {aiAnalysisResult.partsGuide}</Text>
          </View>
        )}

        {aiAnalysisResult && (
          <View style={styles.priceInfoGuideCard}>
            <Text style={styles.priceInfoTitle}>📊 AI 권장 적정 시세 가이드</Text>
            <Text style={styles.priceInfoRange}>
              지역 평균 시세: <Text style={styles.redBoldPriceText}>{aiAnalysisResult.recommendedRange}</Text>
            </Text>
            <Text style={styles.priceInfoNotice}>※ 위 시세와 자재/공임 내역을 참고하시어 기술자님께 지급하실 희망 금액을 아래에 직접 입력하세요.</Text>
          </View>
        )}

        <Text style={styles.labelOfficial}>지급 희망 금액 설정 (원) *</Text>
        <TextInput
          style={[styles.inputOfficial, { borderColor: '#2e7d32', borderWidth: 1.5, fontWeight: 'bold', fontSize: 14.5 }]}
          placeholder="예: 45000"
          keyboardType="numeric"
          value={customerPrice}
          onChangeText={setCustomerPrice}
        />

        <Text style={styles.labelOfficial}>방문 주소 *</Text>
        <TextInput style={styles.inputOfficial} value={repairAddress} onChangeText={setRepairAddress} />

        <TouchableOpacity
          style={styles.submitBtnGreen}
          onPress={() => onSubmit({ price: customerPrice, address: repairAddress })}
        >
          <Text style={styles.submitBtnText}>🚀 매칭콜 클릭 (기술자에게 전송)</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingTop: 28 },
  headerOfficial: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  headerTitleOfficial: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', flex: 1, color: '#111827' },
  navBackBtn: { paddingVertical: 4, paddingHorizontal: 4, minWidth: 50 },
  navBackBtnText: { fontSize: 13, color: '#2563eb', fontWeight: 'bold' },
  formContainerOfficial: { padding: 14, paddingBottom: 90 },

  aiResultCard: { backgroundColor: '#e8f5e9', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#c8e6c9', marginBottom: 10 },
  aiBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  aiTagBadge: { backgroundColor: '#2e7d32', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  aiTagBadgeText: { color: '#fff', fontSize: 9.5, fontWeight: 'bold' },
  aiCategoryText: { fontSize: 11, color: '#1b5e20', fontWeight: 'bold' },
  aiResultTitle: { fontSize: 13.5, fontWeight: 'bold', color: '#0f172a', marginBottom: 2 },
  aiPartsInfo: { fontSize: 10.5, color: '#334155', marginTop: 4 },

  aiCostBreakdownCard: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, padding: 6, marginVertical: 4 },
  costDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 1 },
  costDetailLabel: { fontSize: 10.5, color: '#475569' },
  costDetailVal: { fontSize: 11, fontWeight: 'bold', color: '#1e293b' },
  costTotalLabel: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  costTotalVal: { fontSize: 12, fontWeight: 'bold', color: '#dc2626' },

  priceInfoGuideCard: { backgroundColor: '#fefce8', borderWidth: 1, borderColor: '#fef08a', borderRadius: 6, padding: 10, marginBottom: 10 },
  priceInfoTitle: { fontSize: 11.5, fontWeight: 'bold', color: '#854d0e', marginBottom: 2 },
  priceInfoRange: { fontSize: 12, color: '#111' },
  priceInfoNotice: { fontSize: 9.5, color: '#a16207', marginTop: 2 },
  redBoldPriceText: { color: '#dc2626', fontWeight: 'bold', fontSize: 13 },

  labelOfficial: { fontSize: 12, fontWeight: 'bold', color: '#1f2937', marginTop: 8, marginBottom: 4 },
  inputOfficial: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, marginBottom: 4 },
  submitBtnGreen: { backgroundColor: '#2e7d32', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' }
});