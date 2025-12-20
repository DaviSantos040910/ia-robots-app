import React, { useRef } from "react";
import { View, Text, Pressable, UIManager, findNodeHandle } from "react-native";
import { createValueRowStyles } from "./ValueRow.styles";

export type RightAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const ValueRow: React.FC<{
  label: string;
  value: string;
  color: string;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  showChevronRight?: boolean;
  onPressRight?: (anchor: RightAnchor) => void;
}> = ({
  label,
  value,
  color,
  onPress,
  leftIcon,
  showChevronRight = true,
  onPressRight,
}) => {
  const chevronRef = useRef<View>(null);
  const s = createValueRowStyles();

  const pressRight = () => {
    if (!onPressRight) return;
    const handle = findNodeHandle(chevronRef.current);
    if (!handle) return onPressRight({ x: 0, y: 0, width: 0, height: 0 });
    UIManager.measureInWindow(handle, (x, y, width, height) =>
      onPressRight({ x, y, width, height })
    );
  };

  return (
    <Pressable onPress={onPress} disabled={!onPress} style={s.pressable}>
      <View style={s.row}>
        <View style={s.left}>
          {leftIcon}
          <Text style={[s.label, { color }]}>{label}</Text>
        </View>
        <View style={s.right}>
          <Text style={[s.value, { color }]}>{value}</Text>
          {showChevronRight &&
            (onPressRight ? (
              <Pressable
                ref={chevronRef}
                onPress={pressRight}
                hitSlop={10}
                style={s.chevronPressable}
              >
                <Text style={[s.chevron, { color }]}>›</Text>
              </Pressable>
            ) : (
              <Text style={[s.chevron, { color }]}>›</Text>
            ))}
        </View>
      </View>
    </Pressable>
  );
};
