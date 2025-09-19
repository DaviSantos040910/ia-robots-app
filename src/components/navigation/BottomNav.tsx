
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { createAllChatsStyles, getTheme } from '../../screens/AllChats/AllChats.styles';

export type TabKey = 'Chat' | 'Explore' | 'Create' | 'History' | 'Me';

export const BottomNav: React.FC<{
  active: TabKey;
  onPress: (tab: TabKey) => void;
  meBadgeCount?: number;
}> = ({ active, onPress, meBadgeCount = 0 }) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const s = createAllChatsStyles(t);

  const items: { key: TabKey; label: string; glyph: string }[] = [
    { key: 'Chat', label: 'Chat', glyph: '💬' },
    { key: 'Explore', label: 'Explore', glyph: '🔎' },
    { key: 'Create', label: 'Create', glyph: '✚' },
    { key: 'History', label: 'History', glyph: '🕘' },
    { key: 'Me', label: 'Me', glyph: '👤' },
  ];

  return (
    <View style={s.bottomBar}>
      {items.map(({ key, label, glyph }) => {
        const isActive = active === key;
        return (
          <Pressable key={key} onPress={() => onPress(key)} style={s.navItem}>
            <View style={s.navIconWrap}>
              <Text style={isActive ? s.navIconActive : s.navIconText}>{glyph}</Text>
              {key === 'Me' && meBadgeCount > 0 && (
                <View style={s.badge}><Text style={s.badgeText}>{meBadgeCount}</Text></View>
              )}
            </View>
            <Text style={isActive ? s.navLabelActive : s.navLabel}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};
