import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Clipboard,
  Platform,
  Image,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import * as Haptics from 'expo-haptics';
import * as ClipboardExpo from 'expo-clipboard';
import type { ChatMessage } from '../app/(app)/chat';
import { modelDisplayName } from '../lib/models';

function ThinkingDots() {
  return (
    <View style={styles.thinkingRow}>
      <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
      <Text style={styles.thinkingText}>Kyro is thinking…</Text>
    </View>
  );
}

function LoadingBubble({ label }: { label?: string }) {
  return (
    <View style={styles.assistantRow}>
      <View style={styles.avatarSmall}>
        <Text style={styles.avatarText}>K</Text>
      </View>
      <View style={styles.thinkingBubble}>
        <ActivityIndicator size="small" color="rgba(255,255,255,0.4)" />
        <Text style={styles.thinkingLabel}>{label || 'Kyro is thinking…'}</Text>
      </View>
    </View>
  );
}

export default function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  if (msg.loading || msg.reasoning) {
    return <LoadingBubble label={msg.loadingLabel} />;
  }

  const handleCopy = async () => {
    await ClipboardExpo.setStringAsync(msg.text);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (isUser) {
    return (
      <View style={styles.userRow}>
        {msg.attachment?.type.startsWith('image/') && (
          <Image
            source={{ uri: msg.attachment.dataUrl }}
            style={styles.attachImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{msg.text}</Text>
        </View>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>U</Text>
        </View>
      </View>
    );
  }

  // Assistant message
  return (
    <View style={styles.assistantRow}>
      <View style={styles.avatarSmall}>
        <Text style={styles.avatarText}>K</Text>
      </View>
      <View style={styles.assistantContent}>
        {msg.imageLoading ? (
          <View style={styles.imageLoading}>
            <ActivityIndicator color="rgba(255,255,255,0.4)" />
            <Text style={styles.imageLoadingText}>{msg.loadingLabel}</Text>
          </View>
        ) : (
          <Markdown style={markdownStyles}>{msg.text}</Markdown>
        )}

        {msg.text && !msg.loading && (
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleCopy} style={styles.actionBtn} activeOpacity={0.7}>
              <Text style={styles.actionText}>{copied ? '✓ Copied' : '⎘ Copy'}</Text>
            </TouchableOpacity>
            {msg.model && (
              <Text style={styles.modelLabel}>{modelDisplayName(msg.model)}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const markdownStyles: any = {
  body: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    lineHeight: 24,
  },
  heading1: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  heading2: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  heading3: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  strong: { color: '#fff', fontWeight: '700' },
  em: { fontStyle: 'italic', color: 'rgba(255,255,255,0.85)' },
  code_inline: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#7dd3fc',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
  },
  fence: {
    backgroundColor: '#0d1117',
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  code_block: {
    backgroundColor: '#0d1117',
    color: '#e6edf3',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
  },
  bullet_list: { marginLeft: 4, marginVertical: 4 },
  ordered_list: { marginLeft: 4, marginVertical: 4 },
  list_item: { marginBottom: 4, color: 'rgba(255,255,255,0.88)' },
  blockquote: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderLeftColor: 'rgba(255,255,255,0.3)',
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginVertical: 6,
  },
  link: { color: '#60a5fa' },
  paragraph: { marginVertical: 2, color: 'rgba(255,255,255,0.92)' },
  image: { borderRadius: 12, marginVertical: 8 },
};

const styles = StyleSheet.create({
  // User
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 16,
  },
  userBubble: {
    maxWidth: '78%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderBottomRightRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  userText: { fontSize: 15, color: '#fff', lineHeight: 22 },
  userAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  attachImage: {
    width: 180, height: 180,
    borderRadius: 16,
    marginBottom: 4,
  },

  // Assistant
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  avatarSmall: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#000' },
  assistantContent: { flex: 1 },

  // Thinking
  thinkingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8,
  },
  thinkingText: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  thinkingLabel: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },

  // Image loading
  imageLoading: {
    width: 200, height: 200,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  imageLoadingText: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },

  // Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  actionText: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  modelLabel: { fontSize: 10, color: 'rgba(255,255,255,0.3)' },
});
