// src/components/chat/ChatHeader.tsx
import React, { useRef } from 'react';
import { View, Text, Pressable, Image, useColorScheme, UIManager, findNodeHandle, StyleSheet } from 'react-native';
import { getTheme } from '../../screens/Chat/Chat.styles';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Typography } from '../../theme/typography';
import type { Anchor } from './ActionSheetMenu';

export const ChatHeader: React.FC<{
  avatarUrl?: string | null;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onPhone?: () => void;
  onVolume?: () => void;
  isVoiceModeEnabled?: boolean; // NOVO: Estado visual do botão
  onMorePress?: (anchor: Anchor) => void;
}> = ({ 
  avatarUrl, 
  title, 
  subtitle, 
  onBack, 
  onPhone, 
  onVolume, 
  isVoiceModeEnabled = false, // Default false
  onMorePress 
}) => {
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
    <View style={[styles.container, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.backButton}>
        <Feather name="chevron-left" size={24} color={t.textPrimary} />
      </Pressable>

      {/* Avatar */}
      <View style={[styles.avatarContainer, { backgroundColor: t.surfaceAlt }]}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : null}
      </View>

      {/* Titles */}
      <View style={styles.titleContainer}>
        <Text style={[styles.titleText, { color: t.textPrimary }]} numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text style={[styles.subtitleText, { color: t.textSecondary }]} numberOfLines={1}>{subtitle}</Text>}
      </View>

      {/* Actions */}
      
      {/* 1. Botão de Chamada (Telefone) */}
      <Pressable 
        onPress={onPhone} 
        hitSlop={10} 
        style={styles.actionButton}
        accessibilityRole="button"
        accessibilityLabel="Call"
      >
        <Feather name="phone-call" size={20} color={t.textPrimary} />
      </Pressable>

      {/* 2. Botão de Modo de Voz (Volume) - Toggle */}
      <Pressable 
        onPress={onVolume} 
        hitSlop={10} 
        style={styles.actionButton}
        accessibilityRole="button"
        accessibilityLabel={isVoiceModeEnabled ? "Disable voice mode" : "Enable voice mode"}
      >
        {/* Muda o ícone e a cor se estiver ativo */}
        <Feather 
          name={isVoiceModeEnabled ? "volume-2" : "volume-x"} 
          size={20} 
          color={isVoiceModeEnabled ? t.brand.normal : t.textPrimary} 
        />
      </Pressable>
      
      {/* 3. Menu Mais */}
      <Pressable ref={moreRef} onPress={openMenu} hitSlop={10} style={[styles.actionButton, { marginRight: 0 }]}>
        <Feather name="more-vertical" size={22} color={t.textPrimary} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    ...Typography.bodySemiBold.medium,
  },
  subtitleText: {
    ...Typography.bodyRegular.small,
  },
  actionButton: {
    padding: 6,
    marginHorizontal: 4,
  }
});