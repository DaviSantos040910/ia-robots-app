import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';

export type TabKey = 'Chat' | 'Search' | 'Add' | 'Message' | 'Me';

interface Props {
  active?: TabKey;
  meBadgeCount?: number;
  onPress?: (tab: TabKey) => void;
}

const BottomNav: React.FC<Props> = ({ active, meBadgeCount = 0, onPress }) => {
  const tabs: { key: TabKey; label: string; icon: string; badge?: boolean }[] = [
    { key: 'Chat', label: 'Chats', icon: '💬' },
    { key: 'Search', label: 'Search', icon: '🔍' },
    { key: 'Add', label: 'Add', icon: '➕' },
    { key: 'Message', label: 'Message', icon: '🔔', badge: meBadgeCount > 0 },
    { key: 'Me', label: 'Me', icon: '👤' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.nav}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => onPress?.(tab.key)}>
            <View style={{ position: 'relative' }}>
              <Text style={[styles.icon, active === tab.key && { color: '#6949FF' }]}>{tab.icon}</Text>
              {tab.badge && <View style={styles.badge} />}
            </View>
            <Text style={styles.label}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 60,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  tab: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
    textAlign: 'center',
    color: '#6E6E73',
  },
  label: {
    fontSize: 11,
    color: '#6E6E73',
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
});

export default BottomNav;
