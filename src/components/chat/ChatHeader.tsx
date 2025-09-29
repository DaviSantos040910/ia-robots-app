// src/components/chat/ChatHeader.tsx
import React, { useRef } from 'react';
import { View, Text, Pressable, Image, useColorScheme, UIManager, findNodeHandle } from 'react-native';
import { getTheme } from '../../screens/Chat/Chat.styles';
import { Feather } from '@expo/vector-icons';
import { Typography } from '../../theme/typography';
import type { Anchor } from './ActionSheetMenu';

export const ChatHeader: React.FC<{
  avatarUrl?: string | null;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onPhone?: () => void;
  onVolume?: () => void;
  onMorePress?: (anchor: Anchor) => void;
}> = ({ avatarUrl, title, subtitle, onBack, onPhone, onVolume, onMorePress }) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const moreRef = useRef<View>(null);

  const openMenu = () => {
    const handle = findNodeHandle(moreRef.current);
    if (!handle) {
      onMorePress && onMorePress(null);
      return;
    }
    UIManager.measureInWindow(handle, (x, y, width, height) => {
      onMorePress && onMorePress({ x, y, width, height });
    });
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: t.surface, borderBottomWidth: 0.5, borderColor: t.border }}>
      <Pressable onPress={onBack} hitSlop={10} style={{ padding: 6, marginRight: 8 }}>
        <Feather name="chevron-left" size={24} color={t.textPrimary} />
      </Pressable>

      {/* Avatar */}
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.surfaceAlt, marginRight: 10, overflow: 'hidden' }}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} />
        ) : null}
      </View>

      {/* Titles */}
      <View style={{ flex: 1 }}>
        <Text style={{ ...Typography.bodySemiBold.medium, color: t.textPrimary }}>{title}</Text>
        {!!subtitle && <Text style={{ ...Typography.bodyRegular.small, color: t.textSecondary }}>{subtitle}</Text>}
      </View>

      {/* Actions */}
      <Pressable onPress={onPhone} hitSlop={10} style={{ padding: 6, marginHorizontal: 4 }}>
        <Feather name="phone" size={20} color={t.textPrimary} />
      </Pressable>
      <Pressable onPress={onVolume} hitSlop={10} style={{ padding: 6, marginHorizontal: 4 }}>
        <Feather name="volume-2" size={20} color={t.textPrimary} />
      </Pressable>
      <Pressable ref={moreRef} onPress={openMenu} hitSlop={10} style={{ padding: 6, marginLeft: 4 }}>
        <Feather name="more-vertical" size={22} color={t.textPrimary} />
      </Pressable>
    </View>
  );
};