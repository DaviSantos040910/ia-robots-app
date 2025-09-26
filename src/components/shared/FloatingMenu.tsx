
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View, useColorScheme, Dimensions, LayoutChangeEvent, StyleSheet, Animated } from 'react-native';
import { getTheme, createCreateBotStyles } from '../../screens/CreateBot/CreateBot.styles';
import { useFadeScaleIn } from './Motion';

export type Anchor = { x: number; y: number; width: number; height: number } | null;

export const FloatingMenu: React.FC<{
  visible: boolean;
  onClose: () => void;
  anchor: Anchor;
  options: { label: string; value: string }[];
  selected?: string;
  onSelect: (v: string) => void;
}> = ({ visible, onClose, anchor, options, selected, onSelect }) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const s = createCreateBotStyles(t);
  const screen = Dimensions.get('window');
  const [menuSize, setMenuSize] = useState<{ w: number; h: number } | null>(null);

  const onMenuLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!menuSize || menuSize.w !== width || menuSize.h !== height) setMenuSize({ w: width, h: height });
  };

  const MARGIN = 8;
  const position = useMemo(() => {
    if (!anchor || !menuSize) return { top: -9999, left: -9999 };
    const { x, y, width, height } = anchor;
    let left = x + width - menuSize.w;
    let top = y + height + 4;
    if (left < MARGIN) left = MARGIN;
    if (left + menuSize.w + MARGIN > screen.width) left = screen.width - menuSize.w - MARGIN;
    const spaceBelow = screen.height - (y + height);
    if (spaceBelow < menuSize.h + MARGIN) {
      top = y - menuSize.h - 4;
      if (top < MARGIN) top = MARGIN;
    }
    return { top, left };
  }, [anchor, menuSize, screen.height, screen.width]);

  const anim = useFadeScaleIn(visible, { duration: 180, from: 0.96 });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Animated.View
            onLayout={onMenuLayout as any}
            style={[{
              position: 'absolute', top: position.top, left: position.left,
              backgroundColor: t.surface, borderRadius: 12, paddingVertical: 6,
              minWidth: 180, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border,
              shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
            }, anim]}
          >
            {options.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => { onClose(); setTimeout(() => onSelect(opt.value), 0); }}
                style={{ paddingVertical: 10, paddingHorizontal: 14 }}
              >
                <Text style={{ fontSize: 16, color: t.textPrimary, fontWeight: selected === opt.value ? '600' : '400' }}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
};
