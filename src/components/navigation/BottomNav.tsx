// src/components/navigation/BottomNav.tsx
import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../../screens/AllChats/AllChats.styles';
import { createBottomNavStyles } from './BottomNav.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Chat: 'chatbubble-outline',
  Explore: 'search-outline',
  Create: 'add-circle-outline',
  Message: 'notifications-outline',
  Me: 'person-outline',
};

export const BottomNav: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const s = createBottomNavStyles(t);
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingBottom: insets.bottom || 8 }]}>
      <View style={s.nav}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel?.toString() ?? options.title ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              // AJUSTE: Removida a propriedade 'testID' que estava causando o erro de tipo.
              // testID={options.tabBarTestID}
              onPress={onPress}
              style={s.tab}
            >
              <View>
                <Ionicons
                  name={ICONS[route.name] || 'ellipse-outline'}
                  size={26}
                  style={isFocused ? s.iconActive : s.icon}
                />
                {/* Badge logic can be added here if needed */}
              </View>
              <Text style={[s.label, isFocused && s.labelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default BottomNav;