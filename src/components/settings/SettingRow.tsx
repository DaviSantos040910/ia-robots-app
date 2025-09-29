// src/components/settings/SettingRow.tsx
import React, { useRef } from 'react';
import { View, Text, Pressable, UIManager, findNodeHandle } from 'react-native';
import { useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getTheme, createBotSettingsStyles } from '../../screens/BotSettings/BotSettings.styles';
import { Typography } from '../../theme/typography';

// Type for the function that provides measurement data for pop-up menus.
export type AnchorCallback = { x: number; y: number; width: number; height: number };

// Props for the new SettingRow component.
interface SettingRowProps {
  label: string;
  value: string;
  iconName: keyof typeof Feather.glyphMap;
  iconBgColor: string;
  showChevron?: boolean;
  onPress?: (anchor: AnchorCallback) => void;
}

export const SettingRow: React.FC<SettingRowProps> = ({ label, value, iconName, iconBgColor, showChevron = true, onPress }) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const s = createBotSettingsStyles(t);
  const rowRef = useRef<View>(null);

  const handlePress = () => {
    if (!onPress) return;
    // Measure the position of the row to anchor a menu to it.
    const handle = findNodeHandle(rowRef.current);
    if (!handle) return onPress({ x: 0, y: 0, width: 0, height: 0 });
    UIManager.measureInWindow(handle, (x, y, width, height) => onPress({ x, y, width, height }));
  };

  return (
    <Pressable ref={rowRef} onPress={handlePress} disabled={!onPress} style={s.settingRow}>
      {/* Left side: Icon and Label */}
      <View style={s.rowLeft}>
        <View style={[s.settingIconWrapper, { backgroundColor: iconBgColor }]}>
          <Feather name={iconName} size={20} color="#FFFFFF" />
        </View>
        <Text style={s.valueRowLabel}>{label}</Text>
      </View>
      
      {/* Right side: Value and Chevron */}
      <View style={s.rowRight}>
        <Text style={s.valueRowValue}>{value}</Text>
        {showChevron && <Feather name="chevron-right" size={20} style={s.valueRowChevron} />}
      </View>
    </Pressable>
  );
};