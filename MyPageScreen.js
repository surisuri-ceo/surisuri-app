// MyPageScreen.js - 내 프로필 관리, 등록한 요청글 관리(금액/내용 수정 및 취소)
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

export function MyPageScreen({
  userInfo,
  currentRegionDisplay,
  requestList,
  onLogout,
  onUpdateProfile,
  onUpdateRequest,
  onDeleteRequest
}) {
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [tempNickname, setTempNickname] = useState(userInfo?.nickname || '');
  const [tempAddress, setTempAddress] = useState(userInfo?.address || '');

  const [editOrderModalVisible, setEditOrderModalVisible] = useState(false);
  const [editingOrderItem, setEditingOrderItem] = useState(null);
  const [editOrderPrice, setEditOrderPrice] = useState('');
  const [editOrderDesc, setEditOrderDesc] = useState('');

  const handleOpenEditRequest = (item) => {
    setEditingOrderItem(item);
    setEditOrderPrice(String(item.price));
    setEditOrderDesc(item.diagnosis);
    setEditOrderModalVisible(true);
  };

  const handleSaveOrder = () => {
    if (!editOrderPrice.trim() || !editOrderDesc.trim()) {
      return Alert.alert('확인', '금액과 내용을 입력해 주세요.');
    }
    onUpdateRequest(editingOrderItem.id, Number(editOrderPrice), editOrderDesc);
    setEditOrderModalVisible(false);
    Alert.alert('수정 완료', '요청글 정보가 변경되었습니다.');
  };

  const handleSaveProfile = () => {
    if (!tempNickname.trim()) return Alert.alert('확인', '활동명을 입력해 주세요.');
    if (!tempAddress.trim()) return Alert.alert('확인', '활동 지역을 입력해 주세요.');
    onUpdateProfile(tempNickname, tempAddress);
    setEditProfileModalVisible(false);
    Alert.alert('변경 완료', '회원님의 활동 정보가 업데이트되었습니다.');
  };

  return (
    <View style={s.container}>
      <View style={s.headerOfficialCleanFeed}>
        <Text style={s.headerTitleFeedGreen}>👤 내 프로필 및 활동 관리</Text>
        <TouchableOpacity onPress={onLogout}>
          <Text style={s.logoutBtnText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.mainContentFeed}>
        <View style={s.myProfileHeaderCardRow}>
          <View style={s.myProfileAvatar}><Text style={{ fontSize: 28 }}>😎</Text></View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
              {userInfo?.nickname || userInfo?.realName || '회원'} 님
            </Text>
            <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: 'bold', marginTop: 2 }}>
              📍 {currentRegionDisplay} 인증 회원
            </Text>
            <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              {userInfo?.address || '주소 미설정'}
            </Text>
          </View>
          <TouchableOpacity
            style={s.myProfileEditBtnPastelRed}
            onPress={() => {
              setTempNickname(userInfo?.nickname || '');
              setTempAddress(userInfo?.address || '');
              setEditProfileModalVisible(true);
            }}
          >
            <Text style={s.myProfileEditBtnTextPastelRed}>⚙️ 정보수정</Text>
          </TouchableOpacity>
        </View>

        <Text style={[s.feedListSectionTitle, { marginTop: 16 }]}>
          📋 내가 등록한 요청글 관리 ({requestList.length}건)
        </Text>

        {requestList.map((req) => (
          <View key={req.id} style={s.myRequestManageCardClean}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.officialOrderTitle}>{req.categoryName}</Text>
              <Text style={{ fontSize: 11, color: '#2563eb', fontWeight: 'bold' }}>{req.status}</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              {req.imageUri ? (
                <Image source={{ uri: req.imageUri }} style={s.myReqThumbImage} />
              ) : (
                <View style={[s.myReqThumbImage, { justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 10, color: '#94a3b8' }}>사진 없음</Text>
                </View>
              )}
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontSize: 13.5, color: '#dc2626', fontWeight: 'bold' }}>
                  희망금액: {Number(req.price).toLocaleString()}원
                </Text>
                <Text style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>📍 {req.address}</Text>
                <Text style={{ fontSize: 12, color: '#1e293b', marginTop: 2 }} numberOfLines={2}>
                  {req.diagnosis}
                </Text>
              </View>
            </View>

            <View style={s.reqManageBtnRow}>
              <TouchableOpacity style={s.reqEditBtn} onPress={() => handleOpenEditRequest(req)}>
                <Text style={s.reqEditBtnText}>✏️ 금액/내용 수정</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.reqDeleteBtnPastelRed} onPress={() => onDeleteRequest(req.id)}>
                <Text style={s.reqDeleteBtnTextPastelRed}>🗑️ 요청 취소(삭제)</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 내 정보 수정 모달 */}
      <Modal visible={editProfileModalVisible} transparent animationType="fade">
        <View style={s.modalCenterOverlay}>
          <View style={s.popCardModal}>
            <Text style={s.popTitleClean}>⚙️ 내 정보 수정</Text>
            <Text style={[s.labelOfficial, { marginTop: 10 }]}>앱 활동명 (닉네임) *</Text>
            <TextInput style={s.inputOfficial} value={tempNickname} onChangeText={setTempNickname} />

            <Text style={[s.labelOfficial, { marginTop: 6 }]}>활동 및 거주지역 (시/군/구 동) *</Text>
            <TextInput style={s.inputOfficial} value={tempAddress} onChangeText={setTempAddress} />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                style={[s.primaryButton, { flex: 1, backgroundColor: '#94a3b8' }]}
                onPress={() => setEditProfileModalVisible(false)}
              >
                <Text style={s.primaryButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.primaryPastelRedButton, { flex: 1.5, marginTop: 0 }]}
                onPress={handleSaveProfile}
              >
                <Text style={s.primaryButtonText}>변경사항 저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 요청글 수정 모달 */}
      <Modal visible={editOrderModalVisible} transparent animationType="fade">
        <View style={s.modalCenterOverlay}>
          <View style={s.popCardModal}>
            <Text style={s.popTitleClean}>✏️ 요청글 금액/내용 수정</Text>
            <Text style={[s.labelOfficial, { marginTop: 10 }]}>희망 금액 (원) *</Text>
            <TextInput
              style={s.inputOfficial}
              keyboardType="numeric"
              value={editOrderPrice}
              onChangeText={setEditOrderPrice}
            />
            <Text style={s.labelOfficial}>요청 상세 내용 *</Text>
            <TextInput
              style={[s.inputOfficial, { height: 75, textAlignVertical: 'top' }]}
              value={editOrderDesc}
              onChangeText={setEditOrderDesc}
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TouchableOpacity
                style={[s.primaryButton, { flex: 1, backgroundColor: '#94a3b8' }]}
                onPress={() => setEditOrderModalVisible(false)}
              >
                <Text style={s.primaryButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.primaryPastelRedButton, { flex: 1.5, marginTop: 0 }]}
                onPress={handleSaveOrder}
              >
                <Text style={s.primaryButtonText}>수정 내용 저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingTop: 28 },
  headerOfficialCleanFeed: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  headerTitleFeedGreen: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
  logoutBtnText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  mainContentFeed: { paddingHorizontal: 12, paddingBottom: 130 },
  feedListSectionTitle: { fontSize: 13.5, fontWeight: 'bold', color: '#111827', marginBottom: 8, marginTop: 4 },

  myProfileHeaderCardRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, marginBottom: 12 },
  myProfileAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  myProfileEditBtnPastelRed: { backgroundColor: '#fff', borderWidth: 1.2, borderColor: '#f87171', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  myProfileEditBtnTextPastelRed: { fontSize: 11.5, color: '#ef4444', fontWeight: 'bold' },

  myRequestManageCardClean: { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, marginBottom: 12, elevation: 1 },
  officialOrderTitle: { fontSize: 13.5, fontWeight: 'bold', color: '#111827' },
  myReqThumbImage: { width: 68, height: 68, borderRadius: 8, backgroundColor: '#f1f5f9' },
  reqManageBtnRow: { flexDirection: 'row', gap: 8, marginTop: 10, borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 8 },
  reqEditBtn: { flex: 1, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#93c5fd', paddingVertical: 7, borderRadius: 6, alignItems: 'center' },
  reqEditBtnText: { fontSize: 11.5, color: '#1d4ed8', fontWeight: 'bold' },
  reqDeleteBtnPastelRed: { flex: 1, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5', paddingVertical: 7, borderRadius: 6, alignItems: 'center' },
  reqDeleteBtnTextPastelRed: { fontSize: 11.5, color: '#dc2626', fontWeight: 'bold' },

  modalCenterOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  popCardModal: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 18, elevation: 8 },
  popTitleClean: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  labelOfficial: { fontSize: 12.5, fontWeight: 'bold', color: '#1f2937', marginTop: 8, marginBottom: 4 },
  inputOfficial: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, marginBottom: 4 },
  primaryButton: { paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  primaryPastelRedButton: { backgroundColor: '#f87171', paddingVertical: 13, borderRadius: 8, alignItems: 'center', marginTop: 14, elevation: 2 },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' }
});