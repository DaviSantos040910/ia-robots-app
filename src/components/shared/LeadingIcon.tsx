import React from "react";
import { View } from "react-native";
import {
  createBotSettingsStyles,
  getTheme,
} from "../../screens/BotSettings/BotSettings.styles";
import { useColorScheme } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

// Simple placeholder leading icon. Replace its content with your own icon lib later.
export const LeadingIcon: React.FC<{
  name: keyof typeof Ionicons.glyphMap;
}> = ({ name }) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === "dark");
  const s = createBotSettingsStyles(t);
  return (
    <View style={s.settingIconWrapper}>
      <Ionicons name={name} size={18} color={t.textSecondary} />
    </View>
  );
};
