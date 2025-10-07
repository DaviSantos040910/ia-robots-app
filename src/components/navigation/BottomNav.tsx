// src/components/navigation/BottomNav.tsx
import React from "react";
import { View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getTheme } from "../../screens/ChatList/ChatList.styles"; // Will be updated
import { createBottomNavStyles } from "./BottomNav.styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next"; // Import useTranslation

// --- UPDATED ICONS ---
const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Chat: "chatbubbles-outline",
  Explore: "search-outline",
  Create: "add-circle-outline",
  Bots: "hardware-chip-outline", // New icon for Bots
  Me: "person-outline",
};

export const BottomNav: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { t } = useTranslation(); // Hook for translations
  const scheme = useColorScheme();
  const theme = getTheme(scheme === "dark");
  const s = createBottomNavStyles(theme);
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingBottom: insets.bottom || 8 }]}>
      <View style={s.nav}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];

          // Use translation keys for labels
          const label = t(`mainTabs.${route.name.toLowerCase()}` as any);

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
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
              onPress={onPress}
              style={s.tab}
            >
              <View>
                <Ionicons
                  name={ICONS[route.name] || "ellipse-outline"}
                  size={26}
                  style={isFocused ? s.iconActive : s.icon}
                />
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
