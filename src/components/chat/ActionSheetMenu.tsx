// src/components/chat/ActionSheetMenu.tsx
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View, useColorScheme, Dimensions, LayoutChangeEvent, StyleSheet } from 'react-native';
import { getTheme } from '../../screens/Chat/Chat.styles';

export type SheetItem = { label: string; onPress: () => void; danger?: boolean; icon?: React.ReactNode };
export type Anchor = { x: number; y: number; width: number; height: number } | null;

const MARGIN = 8; // outer safe margin to screen edges

export const ActionSheetMenu: React.FC<{
  visible: boolean;
  onClose: () => void;
  items: SheetItem[];
  anchor: Anchor;
}> = ({ visible, onClose, items, anchor }) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const screen = Dimensions.get('window');
  // CORREÇÃO: O parêntese de `useState` estava no lugar errado.
  const [menuSize, setMenuSize] = useState<{ w: number; h: number } | null>(null);

  const onMenuLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!menuSize || menuSize.w !== width || menuSize.h !== height) {
      setMenuSize({ w: width, h: height });
    }
  };

  const position = useMemo(() => {
    if (!anchor || !menuSize) return { top: -9999, left: -9999 };
    const { x, y, width, height } = anchor;
    let left = x + width - menuSize.w; // align right edges
    let top = y + height + 4; // prefer below anchor

    // Horizontal clamping
    if (left < MARGIN) left = MARGIN;
    if (left + menuSize.w + MARGIN > screen.width) left = screen.width - menuSize.w - MARGIN;

    // Vertical flip if not enough space below
    const spaceBelow = screen.height - (y + height);
    if (spaceBelow < menuSize.h + MARGIN) {
      top = y - menuSize.h - 4;
      if (top < MARGIN) top = MARGIN; // clamp to top margin
    }
    return { top, left };
  }, [anchor, menuSize, screen.height, screen.width]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <View
            onLayout={onMenuLayout}
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              backgroundColor: theme.surface,
              borderRadius: 12,
              paddingVertical: 6,
              minWidth: 180,
              maxWidth: Math.min(280, screen.width - MARGIN * 2),
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.border,
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 6,
            }}
          >
            {items.map((it, idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  onClose();
                  setTimeout(it.onPress, 0);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14 }}
              >
                {it.icon && <View style={{ marginRight: 12 }}>{it.icon}</View>}
                <Text style={{ fontSize: 16, color: it.danger ? '#E5484D' : theme.textPrimary }}>
                  {it.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};