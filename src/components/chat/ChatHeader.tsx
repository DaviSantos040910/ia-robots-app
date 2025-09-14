
import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';

export const ChatHeader: React.FC<{
  avatarUrl?: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onPhone?: () => void;
  onVolume?: () => void;
  onMore?: () => void; // 3-dots menu trigger
}> = ({ avatarUrl, title, subtitle, onBack, onPhone, onVolume, onMore }) => {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: '#FFFFFF', borderBottomWidth: 0.5, borderBottomColor: '#E6E6E6'
    }}>
      <Pressable onPress={onBack} hitSlop={10} style={{ marginRight: 8 }}>
        <Text style={{ fontSize: 18 }}>{'‹'}</Text>
      </Pressable>

      {/* Avatar permanece sem ação */}
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EAEAEA', marginRight: 12, overflow:'hidden' }}>
        {!!avatarUrl && <Image source={{ uri: avatarUrl }} style={{ width: 36, height: 36 }} />}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '600', fontSize: 16 }} numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text style={{ color: '#666' }} numberOfLines={1}>{subtitle}</Text>}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={onPhone} hitSlop={10} style={{ paddingHorizontal: 8 }}>
          <Text style={{ fontSize: 18 }}>{'📞'}</Text>
        </Pressable>
        <Pressable onPress={onVolume} hitSlop={10} style={{ paddingHorizontal: 8 }}>
          <Text style={{ fontSize: 18 }}>{'🔊'}</Text>
        </Pressable>
        {/* 3 pontos (menu) */}
        <Pressable onPress={onMore} hitSlop={10} style={{ paddingHorizontal: 8 }}>
          <Text style={{ fontSize: 22, marginTop: -3 }}>{'⋯'}</Text>
        </Pressable>
      </View>
    </View>
  );
};
