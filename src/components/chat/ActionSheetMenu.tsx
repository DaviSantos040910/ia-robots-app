
import React from 'react';
import { Modal, Pressable, Text, View, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';

export type SheetItem = { label: string; onPress: () => void; danger?: boolean };

export const ActionSheetMenu: React.FC<{
  visible: boolean;
  onClose: () => void;
  items: SheetItem[];
}> = ({ visible, onClose, items }) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={onClose}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 8, paddingBottom: 16 }}>
            {items.map((it, idx) => (
              <Pressable key={idx} onPress={() => { onClose(); setTimeout(it.onPress, 0); }}
                style={{ paddingVertical: 14, paddingHorizontal: 20, borderTopWidth: idx===0?0:0.5, borderColor: theme.border }}>
                <Text style={{ fontSize: 16, color: it.danger ? '#E5484D' : theme.textPrimary }}>{it.label}</Text>
              </Pressable>
            ))}
            <View style={{ height: 8 }} />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};
