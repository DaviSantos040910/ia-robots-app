
import React, { useRef } from 'react';
import { Pressable, Text, View, UIManager, findNodeHandle } from 'react-native';
import { useColorScheme } from 'react-native';
import { createCreateBotStyles, getTheme } from '../../screens/CreateBot/CreateBot.styles';

export type Anchor = { x: number; y: number; width: number; height: number };

export const SettingValueRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  onPressRight?: (anchor: Anchor) => void;
}> = ({ icon, label, value, onPressRight }) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const s = createCreateBotStyles(t);
  const ref = useRef<View>(null);

  const handlePressRight = () => {
    if (!onPressRight) return;
    const handle = findNodeHandle(ref.current);
    if (!handle) return;
    UIManager.measureInWindow(handle, (x, y, width, height) => onPressRight({ x, y, width, height }));
  };

  return (
    <View style={s.row}>
      <View style={s.rowLeft}>
        <View style={s.leadingIconWrap}><Text style={s.leadingIconText}>{icon}</Text></View>
        <Text style={s.rowLabel}>{label}</Text>
      </View>
      <Pressable onPress={handlePressRight} ref={ref} hitSlop={10} style={{ flexDirection:'row', alignItems:'center' }}>
        <Text style={s.rowValue}>{value}</Text>
        <Text style={s.chevron}>›</Text>
      </Pressable>
    </View>
  );
};
