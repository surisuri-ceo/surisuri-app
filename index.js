// index.js - 4대 공정 실시간 매칭현황 즉각 연동 완결본
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './HomeScreen';
import {
  LandingScreen,
  CustomerAuthSelectScreen,
  CustomerFormScreen,
  TechWizardScreen
} from './AuthScreens';

import {
  SimpleLaborScreen,
  CleaningScreen,
  FurnitureKitchenScreen,
  MovingDeliveryScreen,
  HeavyConstructionScreen,
  MaterialMarketScreen,
  UsedMarketScreen,
  SurplusClearanceScreen
} from './SpecialScreens';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [activeScreen, setActiveScreen] = useState('home');
  const [authStep, setAuthStep] = useState('landing');
  const [chosenSocialMethod, setChosenSocialMethod] = useState('카카오');

  const [currentUser, setCurrentUser] = useState({
    name: '서한영',
    role: 'customer',
    region: '광주광역시 북구 용봉동'
  });

  const [isEditProfileModal, setIsEditProfileModal] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editRegion, setEditRegion] = useState(currentUser.region);

  const [notiSubTab, setNotiSubTab] = useState('chat');

  const [chatRooms, setChatRooms] = useState([
    {
      id: 1,
      techName: '김철수 마스터',
      category: '설비/종합',
      lastMsg: '고객님, 현장 사진 확인했습니다. 자재 준비해서 30분 내로 방문 가능합니다.',
      time: '11:42'
    },
    {
      id: 2,
      techName: '박영희 크린케어',
      category: '청소/방역',
      lastMsg: '이사 청소 견적 35만원으로 조율 가능하신가요?',
      time: '어제'
    }
  ]);

  const [notices, setNotices] = useState([
    {
      id: 1,
      title: '🚨 [필독] 수리수리 직거래 안전 수칙 안내',
      content: '시공 완료 후 직접 결과물을 확인하신 뒤 현장에서 최종 대금을 정산해 주세요.',
      date: '2026.10.20'
    },
    {
      id: 2,
      title: '🎉 AI 3초 정밀 진단 시스템 전국 서비스 확대',
      content: '사진 3장으로 정확한 부속 규격과 표준 공임을 즉시 판독해 드립니다.',
      date: '2026.10.15'
    }
  ]);

  const [requestList, setRequestList] = useState([
    {
      id: 101,
      tagBadge: '설비/누수',
      diagnosis: '싱크대 하부 배관 노후 누수 및 패킹 마모 진단',
      price: 55000,
      address: '광주 북구 용봉동 120-4',
      status: '배차중',
      isMyPost: true,
      photos: []
    },
    {
      id: 102,
      tagBadge: '청소/입주',
      diagnosis: '원룸 퇴거 입주청소 및 방역 소독',
      price: 180000,
      address: '광주 서구 치평동 상무지구',
      status: '배차중',
      isMyPost: false,
      photos: []
    }
  ]);

  const [editPostModal, setEditPostModal] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostPrice, setEditPostPrice] = useState('');

  const handleAddOrder = (newOrder) => {
    const createdItem = {
      id: Date.now(),
      tagBadge: newOrder.tagBadge || newOrder.category || '일반수리',
      diagnosis: newOrder.diagnosis || newOrder.title,
      price: newOrder.price,
      address: newOrder.address || currentUser.region,
      status: '접수완료',
      isMyPost: true,
      photos: newOrder.photos || []
    };
    setRequestList([createdItem, ...requestList]);
  };

  const handleDeletePost = (id) => {
    Alert.alert('요청글 삭제', '해당 수리 요청을 취소하고 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제하기',
        style: 'destructive',
        onPress: () => {
          setRequestList(requestList.filter((item) => item.id !== id));
          Alert.alert('삭제 완료', '수리 요청글이 삭제되었습니다.');
        }
      }
    ]);
  };

  const handleStartEditPost = (post) => {
    setEditingPostId(post.id);
    setEditPostTitle(post.diagnosis);
    setEditPostPrice(String(post.price));
    setEditPostModal(true);
  };

  const handleSavePostEdit = () => {
    if (!editPostPrice.trim()) {
      Alert.alert('확인', '희망 금액을 입력해 주세요.');
      return;
    }
    setRequestList(
      requestList.map((item) => {
        if (item.id === editingPostId) {
          return {
            ...item,
            diagnosis: editPostTitle,
            price: parseInt(editPostPrice, 10) || item.price
          };
        }
        return item;
      })
    );
    setEditPostModal(false);
    Alert.alert('수정 완료', '요청글 정보가 성공적으로 변경되었습니다.');
  };

  const handleSaveProfile = () => {
    if (!editName.trim() || !editRegion.trim()) {
      Alert.alert('확인', '활동명과 지역을 모두 입력해 주세요.');
      return;
    }
    setCurrentUser({
      ...currentUser,
      name: editName,
      region: editRegion
    });
    setIsEditProfileModal(false);
    Alert.alert('저장 완료', '내 정보가 성공적으로 변경되었습니다.');
  };

  return (
    <View style={s.rootScreen}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* 화면 본문 라우팅 */}
      <View style={s.mainBodyContainer}>
        {currentTab === 'home' && (
          <>
            {activeScreen === 'home' && (
              <HomeScreen
                currentRegionDisplay={currentUser.region}
                requestList={requestList}
                currentUser={currentUser}
                onOpenAuth={() => setAuthStep('landing')}
                onNavigate={(screenKey) => setActiveScreen(screenKey)}
                onAddOrder={handleAddOrder}
              />
            )}
            {/* 4대 공정 완료 시 handleAddOrder 자동 호출 및 홈 이동 라우팅 핀셋 적용 */}
            {activeScreen === 'simple_labor' && (
              <SimpleLaborScreen
                onBack={() => setActiveScreen('home')}
                onComplete={(order) => {
                  if (order) handleAddOrder(order);
                  setActiveScreen('home');
                }}
              />
            )}
            {activeScreen === 'cleaning' && (
              <CleaningScreen
                onBack={() => setActiveScreen('home')}
                onComplete={(order) => {
                  if (order) handleAddOrder(order);
                  setActiveScreen('home');
                }}
              />
            )}
            {activeScreen === 'furniture_kitchen' && (
              <FurnitureKitchenScreen
                onBack={() => setActiveScreen('home')}
                onComplete={(order) => {
                  if (order) handleAddOrder(order);
                  setActiveScreen('home');
                }}
              />
            )}
            {activeScreen === 'moving_delivery' && (
              <MovingDeliveryScreen
                onBack={() => setActiveScreen('home')}
                onComplete={(order) => {
                  if (order) handleAddOrder(order);
                  setActiveScreen('home');
                }}
              />
            )}
            {activeScreen === 'heavy_construction' && (
              <HeavyConstructionScreen onBack={() => setActiveScreen('home')} />
            )}
            {activeScreen === 'materials_market' && (
              <MaterialMarketScreen onBack={() => setActiveScreen('home')} />
            )}
            {activeScreen === 'used_market' && (
              <UsedMarketScreen onBack={() => setActiveScreen('home')} />
            )}
            {activeScreen === 'surplus_clearance' && (
              <SurplusClearanceScreen onBack={() => setActiveScreen('home')} />
            )}
          </>
        )}

        {currentTab === 'community' && (
          <View style={s.pageContainer}>
            <View style={s.headerBar}>
              <Text style={s.headerTitle}>동네 직거래 커뮤니티</Text>
            </View>
            <View style={s.centerNoticeWrap}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>👥</Text>
              <Text style={s.boldSubText}>{currentUser.region} 이웃 소통 공간</Text>
              <Text style={s.lightSubText}>인근 기술자 및 이웃들과 자재 나눔, 공구 대여를 소통해 보세요.</Text>
            </View>
          </View>
        )}

        {currentTab === 'location' && (
          <View style={s.pageContainer}>
            <View style={s.headerBar}>
              <Text style={s.headerTitle}>내 주변 수리 지도</Text>
            </View>
            <View style={s.centerNoticeWrap}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>📍</Text>
              <Text style={s.boldSubText}>현재 활동 지역: {currentUser.region}</Text>
              <Text style={s.lightSubText}>반경 5km 이내 등록된 실시간 수리 및 출동 가능 기사를 조회합니다.</Text>
            </View>
          </View>
        )}

        {currentTab === 'chat_noti' && (
          <View style={s.pageContainer}>
            <View style={s.headerBar}>
              <Text style={s.headerTitle}>알림 및 대화 센터</Text>
            </View>
            <View style={s.subTabWrap}>
              <TouchableOpacity
                style={[s.subTabBtn, notiSubTab === 'chat' && s.subTabBtnActive]}
                onPress={() => setNotiSubTab('chat')}
              >
                <Text style={[s.subTabText, notiSubTab === 'chat' && s.subTabTextActive]}>대화 내역 (2)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.subTabBtn, notiSubTab === 'notice' && s.subTabBtnActive]}
                onPress={() => setNotiSubTab('notice')}
              >
                <Text style={[s.subTabText, notiSubTab === 'notice' && s.subTabTextActive]}>공지사항 (2)</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {notiSubTab === 'chat' ? (
                chatRooms.map((room) => (
                  <TouchableOpacity
                    key={room.id}
                    style={s.chatRoomCard}
                    activeOpacity={0.7}
                    onPress={() => Alert.alert('대화방 진입', `${room.techName}님과의 1:1 견적 대화방으로 연결됩니다.`)}
                  >
                    <View style={s.chatAvatarCircle}>
                      <Ionicons name="chatbubble-ellipses" size={22} color="#2563eb" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={s.chatTechName}>{room.techName} <Text style={s.chatCategory}>[{room.category}]</Text></Text>
                        <Text style={s.chatTimeText}>{room.time}</Text>
                      </View>
                      <Text style={s.chatLastMsgText} numberOfLines={1}>{room.lastMsg}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                notices.map((n) => (
                  <View key={n.id} style={s.noticeCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={s.noticeCardTitle}>{n.title}</Text>
                      <Text style={s.noticeDateText}>{n.date}</Text>
                    </View>
                    <Text style={s.noticeCardContent}>{n.content}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        )}

        {currentTab === 'mypage' && (
          <View style={s.pageContainer}>
            <View style={s.headerBar}>
              <Text style={s.headerTitle}>내 정보 관리</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              <View style={s.myProfileCard}>
                <View style={s.profileTopRow}>
                  <View style={s.profileAvatarBox}>
                    <Ionicons name="person" size={28} color="#2563eb" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={s.profileNameText}>{currentUser.name} 님</Text>
                    <Text style={s.profileRoleText}>수리수리 AI 일반 회원 (소비자)</Text>
                    <Text style={s.profileRegionText}>📍 {currentUser.region}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={s.profileEditTriggerBtn}
                  onPress={() => {
                    setEditName(currentUser.name);
                    setEditRegion(currentUser.region);
                    setIsEditProfileModal(true);
                  }}
                >
                  <Text style={s.profileEditTriggerText}>⚙️ 활동명 / 지역 수정하기</Text>
                </TouchableOpacity>
              </View>

              <View style={s.myPostsHeaderRow}>
                <Text style={s.myPostsTitle}>📋 내가 올린 수리 요청글</Text>
                <Text style={s.myPostsCountText}>
                  총 {requestList.filter((r) => r.isMyPost).length}건
                </Text>
              </View>

              {requestList.filter((r) => r.isMyPost).length === 0 ? (
                <View style={s.emptyPostCard}>
                  <Text style={s.emptyPostText}>아직 등록하신 수리 요청글이 없습니다.</Text>
                </View>
              ) : (
                requestList
                  .filter((r) => r.isMyPost)
                  .map((post) => (
                    <View key={post.id} style={s.myPostItemCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={s.myPostTagBadge}>
                          <Text style={s.myPostTagBadgeText}>{post.tagBadge}</Text>
                        </View>
                        <Text style={s.myPostStatusText}>● {post.status}</Text>
                      </View>

                      <Text style={s.myPostDiagText}>{post.diagnosis}</Text>

                      {post.photos && post.photos.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                          {post.photos.map((uri, idx) => (
                            <Image key={idx} source={{ uri }} style={s.myPostThumb} />
                          ))}
                        </ScrollView>
                      )}

                      <View style={s.myPostBottomRow}>
                        <Text style={s.myPostPriceText}>{Number(post.price).toLocaleString()}원</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity
                            style={s.postActionBtnEdit}
                            onPress={() => handleStartEditPost(post)}
                          >
                            <Text style={s.postActionBtnEditText}>수정</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={s.postActionBtnDelete}
                            onPress={() => handleDeletePost(post.id)}
                          >
                            <Text style={s.postActionBtnDeleteText}>삭제</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
              )}

              <View style={s.authSwitchCard}>
                <Text style={s.authSwitchTitle}>기술자 등록 및 다른 계정 전환</Text>
                <TouchableOpacity style={s.authSwitchBtn} onPress={() => setAuthStep('landing')}>
                  <Text style={s.authSwitchBtnText}>3대 회원가입 / 계정 전환 카드 열기 ›</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {/* 바닥 공통 탭바 */}
      <View style={s.universalBottomTabBar}>
        <TouchableOpacity
          style={s.tabTouchBtn}
          activeOpacity={0.7}
          onPress={() => {
            setCurrentTab('home');
            setActiveScreen('home');
          }}
        >
          <Ionicons
            name="home"
            size={26}
            color={currentTab === 'home' ? '#0f172a' : '#94a3b8'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.tabTouchBtn}
          activeOpacity={0.7}
          onPress={() => setCurrentTab('community')}
        >
          <Ionicons
            name="people"
            size={28}
            color={currentTab === 'community' ? '#0f172a' : '#94a3b8'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.tabTouchBtn}
          activeOpacity={0.7}
          onPress={() => setCurrentTab('location')}
        >
          <Ionicons
            name="location"
            size={27}
            color={currentTab === 'location' ? '#0f172a' : '#94a3b8'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.tabTouchBtn}
          activeOpacity={0.7}
          onPress={() => setCurrentTab('chat_noti')}
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={26}
            color={currentTab === 'chat_noti' ? '#0f172a' : '#94a3b8'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.tabTouchBtn}
          activeOpacity={0.7}
          onPress={() => setCurrentTab('mypage')}
        >
          <Ionicons
            name="person"
            size={26}
            color={currentTab === 'mypage' ? '#0f172a' : '#94a3b8'}
          />
        </TouchableOpacity>
      </View>

      {/* 내정보 수정 모달 */}
      <Modal visible={isEditProfileModal} transparent animationType="fade">
        <View style={s.modalOverlayCenter}>
          <View style={s.modalBoxCard}>
            <Text style={s.modalBoxTitle}>⚙️ 내 정보 수정</Text>
            <Text style={s.modalBoxSub}>활동명(닉네임)과 기본 활동 지역을 변경합니다.</Text>
            <Text style={s.inputLabel}>활동명 (성함/닉네임)</Text>
            <TextInput style={s.modalInputSingle} value={editName} onChangeText={setEditName} placeholder="예: 서한영" />
            <Text style={[s.inputLabel, { marginTop: 12 }]}>활동 지역 (주소)</Text>
            <TextInput style={s.modalInputSingle} value={editRegion} onChangeText={setEditRegion} placeholder="예: 광주광역시 북구 용봉동" />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity style={s.modalBtnCancel} onPress={() => setIsEditProfileModal(false)}>
                <Text style={s.modalBtnCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalBtnConfirm} onPress={handleSaveProfile}>
                <Text style={s.modalBtnConfirmText}>저장하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 요청글 수정 모달 */}
      <Modal visible={editPostModal} transparent animationType="fade">
        <View style={s.modalOverlayCenter}>
          <View style={s.modalBoxCard}>
            <Text style={s.modalBoxTitle}>✏️ 수리 요청글 내용 수정</Text>
            <Text style={s.inputLabel}>수리 요청 내용</Text>
            <TextInput style={[s.modalInputSingle, { height: 60 }]} value={editPostTitle} onChangeText={setEditPostTitle} multiline />
            <Text style={[s.inputLabel, { marginTop: 12 }]}>희망 수리 금액 (원)</Text>
            <TextInput style={s.modalInputSingle} value={editPostPrice} onChangeText={setEditPostPrice} keyboardType="numeric" />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity style={s.modalBtnCancel} onPress={() => setEditPostModal(false)}>
                <Text style={s.modalBtnCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalBtnConfirm} onPress={handleSavePostEdit}>
                <Text style={s.modalBtnConfirmText}>수정 확정</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3대 회원가입 모달 */}
      <Modal visible={authStep !== null} animationType="slide">
        {authStep === 'landing' && (
          <LandingScreen
            onSelectRole={(role) => setAuthStep(role)}
            onClose={() => setAuthStep(null)}
          />
        )}

        {authStep === 'customer_auth_select' && (
          <CustomerAuthSelectScreen
            onSelectMethod={(method) => {
              setChosenSocialMethod(method);
              setAuthStep('customer_form');
            }}
            onBack={() => setAuthStep('landing')}
          />
        )}

        {authStep === 'customer_form' && (
          <CustomerFormScreen
            authMethod={chosenSocialMethod}
            onComplete={(data) => {
              setCurrentUser({
                ...currentUser,
                name: data.nickname || data.realName,
                region: data.address,
                role: 'customer'
              });
              setAuthStep(null);
            }}
            onBack={() => setAuthStep('customer_auth_select')}
          />
        )}

        {(authStep === 'tech' || authStep === 'company') && (
          <TechWizardScreen
            role={authStep}
            onComplete={(data) => {
              setCurrentUser({
                ...currentUser,
                name: data.techName,
                region: data.techRegion,
                role: authStep
              });
              setAuthStep(null);
            }}
            onBack={() => setAuthStep('landing')}
          />
        )}
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  rootScreen: { flex: 1, backgroundColor: '#ffffff' },
  mainBodyContainer: { flex: 1, backgroundColor: '#ffffff' },
  pageContainer: { flex: 1, backgroundColor: '#ffffff', paddingTop: 26 },
  headerBar: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
  centerNoticeWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  boldSubText: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 6 },
  lightSubText: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20 },

  universalBottomTabBar: {
    height: 84,
    backgroundColor: '#ffffff',
    borderTopWidth: 1.5,
    borderColor: '#cbd5e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 32,
    elevation: 20
  },
  tabTouchBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%'
  },

  subTabWrap: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  subTabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  subTabBtnActive: { borderBottomWidth: 2.5, borderColor: '#1d4ed8', backgroundColor: '#ffffff' },
  subTabText: { fontSize: 13.5, color: '#64748b', fontWeight: 'bold' },
  subTabTextActive: { color: '#1d4ed8' },

  chatRoomCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  chatAvatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  chatTechName: { fontSize: 14.5, fontWeight: 'bold', color: '#111827' },
  chatCategory: { fontSize: 12, color: '#2563eb' },
  chatTimeText: { fontSize: 11, color: '#94a3b8' },
  chatLastMsgText: { fontSize: 12.5, color: '#64748b', marginTop: 3 },

  noticeCard: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  noticeCardTitle: { fontSize: 13.5, fontWeight: 'bold', color: '#1e3a8a', flex: 1 },
  noticeDateText: { fontSize: 11, color: '#94a3b8' },
  noticeCardContent: { fontSize: 12.5, color: '#475569', marginTop: 4, lineHeight: 18 },

  myProfileCard: { backgroundColor: '#eff6ff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#bfdbfe', marginBottom: 20 },
  profileTopRow: { flexDirection: 'row', alignItems: 'center' },
  profileAvatarBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  profileNameText: { fontSize: 17, fontWeight: 'bold', color: '#1e3a8a' },
  profileRoleText: { fontSize: 12, color: '#2563eb', marginVertical: 2 },
  profileRegionText: { fontSize: 12.5, color: '#475569' },
  profileEditTriggerBtn: { marginTop: 14, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#93c5fd', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  profileEditTriggerText: { fontSize: 13, fontWeight: 'bold', color: '#1d4ed8' },

  myPostsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  myPostsTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  myPostsCountText: { fontSize: 12.5, color: '#2563eb', fontWeight: 'bold' },
  emptyPostCard: { paddingVertical: 30, backgroundColor: '#f8fafc', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  emptyPostText: { fontSize: 13, color: '#94a3b8' },

  myPostItemCard: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 1 },
  myPostTagBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  myPostTagBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#334155' },
  myPostStatusText: { fontSize: 11.5, fontWeight: 'bold', color: '#16a34a' },
  myPostDiagText: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginVertical: 6 },
  myPostThumb: { width: 60, height: 60, borderRadius: 6, marginRight: 6, backgroundColor: '#f1f5f9' },
  myPostBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: '#f1f5f9' },
  myPostPriceText: { fontSize: 15, fontWeight: 'bold', color: '#dc2626' },
  postActionBtnEdit: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  postActionBtnEditText: { fontSize: 12, color: '#1d4ed8', fontWeight: 'bold' },
  postActionBtnDelete: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  postActionBtnDeleteText: { fontSize: 12, color: '#dc2626', fontWeight: 'bold' },

  authSwitchCard: { marginTop: 18, backgroundColor: '#f8fafc', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  authSwitchTitle: { fontSize: 12.5, color: '#64748b', marginBottom: 6 },
  authSwitchBtn: { paddingVertical: 4 },
  authSwitchBtnText: { fontSize: 13, color: '#2563eb', fontWeight: 'bold' },

  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalBoxCard: { width: '100%', backgroundColor: '#ffffff', borderRadius: 14, padding: 20, elevation: 6 },
  modalBoxTitle: { fontSize: 16.5, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  modalBoxSub: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4, marginBottom: 14 },
  inputLabel: { fontSize: 12.5, fontWeight: 'bold', color: '#334155', marginBottom: 4 },
  modalInputSingle: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13.5 },
  modalBtnCancel: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalBtnCancelText: { fontSize: 13.5, color: '#64748b', fontWeight: 'bold' },
  modalBtnConfirm: { flex: 1, backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalBtnConfirmText: { fontSize: 13.5, color: '#ffffff', fontWeight: 'bold' }
});