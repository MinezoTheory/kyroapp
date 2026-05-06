import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

type FocusMode = 'web' | 'code' | 'academic' | null;

interface Props {
  model: string;
  mode: FocusMode;
  onModeChange: (m: FocusMode) => void;
  onSend: (text: string, attachment?: { dataUrl: string; name: string; type: string }) => void;
  disabled?: boolean;
  onOpenModelPicker: () => void;
}

const QUICK_ACTIONS = [
  { icon: '✨', label: 'Summarize', prompt: 'Summarize the following text:\n\n' },
  { icon: '✉️', label: 'Email', prompt: 'Write a professional email about: ' },
  { icon: '💻', label: 'Code Help', prompt: 'Help me with this code problem: ' },
  { icon: '📰', label: 'Latest News', prompt: 'What are the latest news headlines today?' },
];

const FOCUS_MODES: { id: FocusMode; label: string; icon: string }[] = [
  { id: 'web', label: 'Web', icon: '🌐' },
  { id: 'code', label: 'Code', icon: '⌨️' },
  { id: 'academic', label: 'Academic', icon: '🎓' },
];

export default function ChatBar({ model, mode, onModeChange, onSend, disabled, onOpenModelPicker }: Props) {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<{ dataUrl: string; name: string; type: string } | null>(null);
  const [inputHeight, setInputHeight] = useState(40);
  const inputRef = useRef<TextInput>(null);

  const submit = () => {
    if (disabled) return;
    const t = text.trim();
    if (!t && !attachment) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(t, attachment ?? undefined);
    setText('');
    setAttachment(null);
    setInputHeight(40);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const dataUrl = `data:image/jpeg;base64,${asset.base64}`;
      setAttachment({ dataUrl, name: asset.fileName || 'image.jpg', type: 'image/jpeg' });
    }
  };

  const getBorderColor = () => {
    if (mode === 'web') return 'rgba(255,255,255,0.15)';
    if (mode === 'code') return 'rgba(52,211,153,0.3)';
    if (mode === 'academic') return 'rgba(56,189,248,0.3)';
    return 'rgba(255,255,255,0.08)';
  };

  const canSend = !disabled && (text.trim().length > 0 || !!attachment);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.container}>
        {/* Quick Actions */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickScroll}
          contentContainerStyle={styles.quickContent}
        >
          {QUICK_ACTIONS.map(({ icon, label, prompt }) => (
            <TouchableOpacity
              key={label}
              style={styles.quickChip}
              onPress={() => {
                setText(prompt);
                inputRef.current?.focus();
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.quickIcon}>{icon}</Text>
              <Text style={styles.quickLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Focus Mode Chips */}
        <View style={styles.modeRow}>
          {FOCUS_MODES.map(({ id, label, icon }) => {
            const active = mode === id;
            return (
              <TouchableOpacity
                key={id}
                style={[styles.modeChip, active && styles.modeChipActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onModeChange(active ? null : id);
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.modeIcon}>{icon}</Text>
                <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Input Box */}
        <View style={[styles.inputBox, { borderColor: getBorderColor() }]}>
          {/* Attachment preview */}
          {attachment && (
            <View style={styles.attachRow}>
              {attachment.type.startsWith('image/') && (
                <Image source={{ uri: attachment.dataUrl }} style={styles.attachThumb} />
              )}
              <Text style={styles.attachName} numberOfLines={1}>{attachment.name}</Text>
              <TouchableOpacity onPress={() => setAttachment(null)} style={styles.attachRemove}>
                <Text style={styles.attachRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            placeholder="Message Kyro…"
            placeholderTextColor="rgba(255,255,255,0.35)"
            multiline
            style={[styles.input, { height: Math.max(40, Math.min(inputHeight, 160)) }]}
            onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height + 10)}
            editable={!disabled}
          />

          {/* Bottom row: attach + model + send */}
          <View style={styles.bottomRow}>
            <TouchableOpacity onPress={pickImage} style={styles.iconBtn} activeOpacity={0.75}>
              <Text style={styles.iconBtnText}>⊕</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onOpenModelPicker}
              style={styles.modelPill}
              activeOpacity={0.75}
            >
              <Text style={styles.modelPillText} numberOfLines={1}>
                {model.length > 15 ? model.slice(0, 15) + '…' : model}
              </Text>
              <Text style={styles.modelPillChevron}>⌄</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={submit}
              disabled={!canSend}
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              activeOpacity={0.8}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.disclaimer}>Kyro can make mistakes. Verify important info.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    paddingTop: 8,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  quickScroll: { marginBottom: 8 },
  quickContent: { gap: 8, paddingHorizontal: 2 },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickIcon: { fontSize: 13 },
  quickLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    justifyContent: 'center',
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modeChipActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  modeIcon: { fontSize: 12 },
  modeLabel: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
  modeLabelActive: { color: '#000', fontWeight: '600' },

  inputBox: {
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: '#0f0f0f',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  attachThumb: { width: 36, height: 36, borderRadius: 8 },
  attachName: { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  attachRemove: { padding: 4 },
  attachRemoveText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  input: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
    paddingTop: 0,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  iconBtn: {
    width: 34, height: 34,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  iconBtnText: { fontSize: 20, color: 'rgba(255,255,255,0.6)', lineHeight: 26 },
  modelPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  modelPillText: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500', flex: 1 },
  modelPillChevron: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  sendBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.3 },
  sendIcon: { fontSize: 18, color: '#000', fontWeight: '700', lineHeight: 22 },

  disclaimer: {
    fontSize: 10,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.25)',
    marginTop: 8,
  },
});
