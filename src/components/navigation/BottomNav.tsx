// src/components/navigation/BottomNav.tsx
import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../../screens/AllChats/AllChats.styles';
import { createBottomNavStyles } from './BottomNav.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabKey = 'Chat' | 'Explore' | 'Create' | 'Message' | 'Me';

interface Props {
  active?: TabKey;
  meBadgeCount?: number;
  onPress?: (tab: TabKey) => void;
}

const BottomNav: React.FC<Props> = ({ active, meBadgeCount = 0, onPress }) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const s = createBottomNavStyles(t);
  const insets = useSafeAreaInsets();

  const tabs: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap; badge?: boolean }[] = [
    { key: 'Chat', label: 'Chat', icon: 'chatbubble-outline' },
    { key: 'Explore', label: 'Explore', icon: 'search-outline' },
    { key: 'Create', label: 'Create', icon: 'add-circle-outline' },
    { key: 'Message', label: 'Message', icon: 'notifications-outline', badge: meBadgeCount > 0 },
    { key: 'Me', label: 'Me', icon: 'person-outline' },
  ];

  return (
    <View style={[s.container, { paddingBottom: insets.bottom || 8 }]}>
      <View style={s.nav}>
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={s.tab} onPress={() => onPress?.(tab.key)}>
              <View>
                <Ionicons
                  name={tab.icon}
                  size={26}
                  style={isActive ? s.iconActive : s.icon}
                />
                {tab.badge && <View style={s.badge} />}
              </View>
              <Text style={[s.label, isActive && s.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default BottomNav;