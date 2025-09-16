
import React, { useRef } from 'react';
import { View, Text, Pressable, UIManager, findNodeHandle } from 'react-native';
import { Typography } from '../../theme/typography';

export type RightAnchor = { x: number; y: number; width: number; height: number };

export const ValueRow: React.FC<{
  label: string;
  value: string;
  color: string;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  showChevronRight?: boolean;
  onPressRight?: (anchor: RightAnchor) => void;
}> = ({ label, value, color, onPress, leftIcon, showChevronRight = true, onPressRight }) => {
  const chevronRef = useRef<View>(null);

  const pressRight = () => {
    if (!onPressRight) return;
    const handle = findNodeHandle(chevronRef.current);
    if (!handle) return onPressRight({ x: 0, y: 0, width: 0, height: 0 });
    UIManager.measureInWindow(handle, (x, y, width, height) => onPressRight({ x, y, width, height }));
  };

  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ paddingVertical: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 12 }}>
          {leftIcon}
          <Text style={{ ...Typography.bodyRegular.medium, color }}>{label}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ ...Typography.bodyRegular.medium, color, opacity: 0.85 }}>{value}</Text>
          {showChevronRight && (
            onPressRight ? (
              <Pressable ref={chevronRef} onPress={pressRight} hitSlop={10}>
                <Text style={{ marginLeft: 8, color, opacity: 0.6 }}>›</Text>
              </Pressable>
            ) : (
              <Text style={{ marginLeft: 8, color, opacity: 0.6 }}>›</Text>
            )
          )}
        </View>
      </View>
    </Pressable>
  );
};
