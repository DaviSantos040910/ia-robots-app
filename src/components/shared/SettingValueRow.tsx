import React, { useRef } from "react";
import { Pressable, Text, View, UIManager, findNodeHandle } from "react-native";
import { useTheme } from "../../theme/colors";
import { createSettingValueRowStyles } from "./SettingValueRow.styles";

export type Anchor = { x: number; y: number; width: number; height: number };

export const SettingValueRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  onPressRight?: (anchor: Anchor) => void;
}> = ({ icon, label, value, onPressRight }) => {
  const theme = useTheme();
  const s = createSettingValueRowStyles(theme);
  const ref = useRef<View>(null);

  const handlePressRight = () => {
    if (!onPressRight) return;
    const handle = findNodeHandle(ref.current);
    if (!handle) return;
    UIManager.measureInWindow(handle, (x, y, width, height) =>
      onPressRight({ x, y, width, height })
    );
  };

  return (
    <View style={s.row}>
      <View style={s.rowLeft}>
        <View style={s.leadingIconWrap}>
          <Text style={s.leadingIconText}>{icon}</Text>
        </View>
        <Text style={s.rowLabel}>{label}</Text>
      </View>
      <Pressable
        onPress={handlePressRight}
        ref={ref}
        hitSlop={10}
        style={s.rightPressable}
      >
        <Text style={s.rowValue}>{value}</Text>
        <Text style={s.chevron}>›</Text>
      </Pressable>
    </View>
  );
};
