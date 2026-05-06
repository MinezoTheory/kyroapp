import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DEFAULT_MODEL, IMAGE_MODEL_ID, IMAGE_MODEL_NAME, modelDisplayName, KYRO_MODELS } from '../../lib/models';
import ChatBar from '../../components/ChatBar';
import MessageBubble from '../../components/MessageBubble';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.78;
const VISION_MODELS = new Set(['gpt-5', 'gpt-5-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini']);

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  model?: string | null;
  attachment?: { dataUrl: string; type: string; name: string };
  loading?: boolean;
  loadingLabel?: string;
  reasoning?: boolean;
  imageLoading?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export default function ChatScreen() {
  const { user, session, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [mode, setMode] = useState<'web' | 'code' | 'academic' | null>(null);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem('kyro-model').then((v) => v && setModel(v));
    AsyncStorage.getItem('kyro-mode').then((v) => {
      if (v === 'web' || v === 'code' || v === 'academic') setMode(v);
    });
  }, []);

  useEffect(() => { AsyncStorage.setItem('kyro-model', model); }, [model]);
  useEffect(() => {
    if (mode) AsyncStorage.setItem('kyro-mode', mode);
    else AsyncStorage.removeItem('kyro-mode');
  }, [mode]);

  const openSidebar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSidebarOpen(true);
    Animated.parallel([
      Animated.spring(sidebarAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 200 }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.spring(sidebarAnim, { toValue: -SIDEBAR_WIDTH, useNativeDriver: true, damping: 22, stiffness: 200 }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setSidebarOpen(false));
  };

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setConvsLoading(true);
    const { data } = await supabase
      .from('chats')
      .select('conversation_id, text, role, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    setConvsLoading(false);
    if (!data) return;
    const map = new Map<string, Conversation>();
    for (const row of data) {
      if (!map.has(row.conversation_id)) {
        map.set(row.conversation_id, {
          id: row.conversation_id,
          title: row.role === 'user' ? row.text.slice(0, 40) : 'New chat',
          created_at: row.created_at,
        });
      }
    }
    setConversations(Array.from(map.values()).reverse());
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadMessages = async (convId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    if (!data) return;
    setMessages(data.map((r: any) => ({ id: r.id, role: r.role, text: r.text, model: r.model })));
  };

  const selectConv = (id: string) => {
    setActiveId(id);
    loadMessages(id);
    closeSidebar();
  };

  const newChat = () => {
    setActiveId(null);
    setMessages([]);
    closeSidebar();
  };

  const deleteConv = async (id: string) => {
    if (!user) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await supabase.from('chats').delete().eq('user_id', user.id).eq('conversation_id', id);
    if (activeId === id) newChat();
    loadConversations();
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, streaming]);

  const handleSend = async (text: string, attachment?: { dataUrl: string; name: string; type: string }) => {
    if (!user || !session) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isImageReq =
      model === IMAGE_MODEL_ID ||
      /^(create|generate|draw|make)\s+(an?\s+)?image\s+/i.test(text) ||
      /^image:\s*/i.test(text);

    let convId = activeId;
    if (!convId) {
      convId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      setActiveId(convId);
    }

    const userMsg: ChatMessage = { id: Math.random().toString(36), role: 'user', text, attachment };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    await supabase.from('chats').insert({
      user_id: user.id, conversation_id: convId, text, role: 'user', model,
    });

    const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (isImageReq) {
      const prompt = text
        .replace(/^(create|generate|draw|make)\s+(an?\s+)?image\s+(of|with|showing)?\s*/i, '')
        .replace(/^image:\s*/i, '')
        .trim() || text;
      setStreaming(true);
      const placeholderId = Math.random().toString(36);
      setMessages([...newMessages, {
        id: placeholderId, role: 'assistant', text: '',
        model: IMAGE_MODEL_NAME, imageLoading: true,
        loadingLabel: `Generating with ${IMAGE_MODEL_NAME}… 0%`,
      }]);

      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/kyro-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: SUPABASE_KEY!,
          },
          body: JSON.stringify({ prompt }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Image generation failed');
        const reply = `![${prompt}](${j.image})`;
        setMessages((prev) =>
          prev.map((m) => m.id === placeholderId ? { ...m, text: reply, imageLoading: false } : m)
        );
        await supabase.from('chats').insert({
          user_id: user.id, conversation_id: convId, text: reply, role: 'assistant', model: IMAGE_MODEL_NAME,
        });
        loadConversations();
      } catch (e: any) {
        Alert.alert('Error', e.message);
        setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
      } finally {
        setStreaming(false);
      }
      return;
    }

    setStreaming(true);
    const apiMessages = newMessages.map((m) => ({
      role: m.role,
      content: m.text,
    }));

    const assistantId = Math.random().toString(36);
    let acc = '';

    setMessages([...newMessages, {
      id: assistantId, role: 'assistant', text: '', model,
      loading: true, reasoning: true,
      loadingLabel: mode === 'academic' ? 'Searching academic sources…'
        : mode === 'code' ? 'Analyzing code intent…'
        : 'Kyro is thinking…',
    }]);

    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/kyro-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: SUPABASE_KEY!,
        },
        body: JSON.stringify({ messages: apiMessages, model, mode }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: 'Stream failed' }));
        throw new Error(err.error || 'Stream failed');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;
      let firstToken = true;

      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            if (parsed.kyro_sources) continue;
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              if (firstToken) firstToken = false;
              acc += delta;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, text: acc, loading: false, reasoning: false }
                    : m
                )
              );
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      if (acc) {
        await supabase.from('chats').insert({
          user_id: user.id, conversation_id: convId, text: acc, role: 'assistant', model,
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, loading: false, reasoning: false, loadingLabel: undefined } : m
          )
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      }
      loadConversations();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to get response');
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setStreaming(false);
    }
  };

  const groups = Array.from(new Set(KYRO_MODELS.map((m) => m.group)));

  return (
    <View style={styles.container}>
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeSidebar} activeOpacity={1} />
        </Animated.View>
      )}

      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }] }]}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Sidebar Header */}
          <View style={styles.sidebarHeader}>
            <View style={styles.sidebarBrand}>
              <View style={styles.sidebarLogo}>
                <Text style={styles.sidebarLogoText}>K</Text>
              </View>
              <Text style={styles.sidebarBrandName}>Kyro</Text>
            </View>
          </View>

          {/* New Chat */}
          <TouchableOpacity style={styles.newChatBtn} onPress={newChat} activeOpacity={0.75}>
            <Text style={styles.newChatIcon}>＋</Text>
            <Text style={styles.newChatText}>New chat</Text>
          </TouchableOpacity>

          <Text style={styles.sidebarSectionLabel}>RECENTS</Text>

          {/* Conversations */}
          <ScrollView style={styles.convList} showsVerticalScrollIndicator={false}>
            {conversations.length === 0 && !convsLoading && (
              <Text style={styles.noConvText}>No conversations yet.</Text>
            )}
            {conversations.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.convItem, activeId === c.id && styles.convItemActive]}
                onPress={() => selectConv(c.id)}
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert('Delete chat?', c.title, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteConv(c.id) },
                  ]);
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.convIcon}>💬</Text>
                <Text style={styles.convTitle} numberOfLines={1}>{c.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* User info + sign out */}
          <View style={styles.sidebarFooter}>
            <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
            <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.75}>
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Main Content */}
      <SafeAreaView style={styles.main}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={openSidebar}
            style={styles.menuBtn}
            activeOpacity={0.7}
          >
            <View style={styles.menuLine} />
            <View style={[styles.menuLine, { width: 16 }]} />
            <View style={styles.menuLine} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerLogo}>
              <Text style={styles.headerLogoText}>K</Text>
            </View>
            <Text style={styles.headerTitle}>Kyro</Text>
          </View>

          <TouchableOpacity
            style={styles.modelBtn}
            onPress={() => setModelPickerOpen(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.modelBtnText} numberOfLines={1}>
              {modelDisplayName(model).length > 12
                ? modelDisplayName(model).slice(0, 12) + '…'
                : modelDisplayName(model)}
            </Text>
            <Text style={styles.modelChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyLogo}>
                <Text style={styles.emptyLogoText}>K</Text>
              </View>
              <Text style={styles.emptyTitle}>What can I help with?</Text>
              <Text style={styles.emptySubtitle}>Real-time, grounded answers.</Text>
              <Text style={styles.emptyModel}>
                Using {modelDisplayName(model)}
              </Text>
            </View>
          }
        />

        {/* Chat Input */}
        <ChatBar
          model={model}
          mode={mode}
          onModeChange={setMode}
          onSend={handleSend}
          disabled={streaming}
          onOpenModelPicker={() => setModelPickerOpen(true)}
        />
      </SafeAreaView>

      {/* Model Picker Modal */}
      <Modal
        visible={modelPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModelPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setModelPickerOpen(false)}
            activeOpacity={1}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choose Model</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {groups.map((g, gi) => (
                <View key={g}>
                  <Text style={styles.groupLabel}>{g.toUpperCase()}</Text>
                  {KYRO_MODELS.filter((m) => m.group === g).map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.modelItem, model === m.id && styles.modelItemActive]}
                      onPress={() => {
                        setModel(m.id);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setModelPickerOpen(false);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.modelItemText, model === m.id && styles.modelItemTextActive]}>
                        {m.name}
                      </Text>
                      {model === m.id && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  main: { flex: 1 },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 10,
  },

  // Sidebar
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#0a0a0a',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    zIndex: 20,
  },
  sidebarHeader: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  sidebarBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sidebarLogo: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  sidebarLogoText: { fontSize: 16, fontWeight: '700', color: '#000' },
  sidebarBrandName: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  newChatIcon: { fontSize: 18, color: '#fff' },
  newChatText: { fontSize: 14, color: '#fff', fontWeight: '500' },
  sidebarSectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.5,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  convList: { flex: 1 },
  noConvText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 10,
  },
  convItemActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  convIcon: { fontSize: 13 },
  convTitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', flex: 1 },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  userEmail: { fontSize: 12, color: 'rgba(255,255,255,0.4)', paddingHorizontal: 4 },
  signOutBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  signOutText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  menuBtn: { gap: 4, padding: 4 },
  menuLine: {
    width: 20, height: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 1,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogo: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  headerLogoText: { fontSize: 14, fontWeight: '700', color: '#000' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#fff', letterSpacing: -0.3 },
  modelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    maxWidth: 120,
  },
  modelBtnText: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  modelChevron: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginLeft: 2 },

  // Messages
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyLogo: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#fff',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  emptyLogoText: { fontSize: 36, fontWeight: '700', color: '#000' },
  emptyTitle: {
    fontSize: 26, fontWeight: '600', color: '#fff',
    letterSpacing: -0.8, marginBottom: 8, textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 24,
  },
  emptyModel: {
    fontSize: 11, color: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  // Model Picker Modal
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: '#0f0f0f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 40, height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17, fontWeight: '600', color: '#fff',
    marginBottom: 16, letterSpacing: -0.3,
  },
  groupLabel: {
    fontSize: 10, fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 6,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  modelItemActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  modelItemText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  modelItemTextActive: { color: '#fff' },
  checkmark: { fontSize: 16, color: '#fff' },
});
