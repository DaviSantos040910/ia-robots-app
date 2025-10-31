import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { getTheme } from '../../screens/Chat/Chat.styles';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { Radius } from '../../theme/radius';
import { useTranslation } from 'react-i18next';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectImage: () => void;
  onSelectDocument: () => void;
  onTakePhoto: () => void;
};

export const AttachmentMenu: React.FC<Props> = ({
  visible,
  onClose,
  onSelectImage,
  onSelectDocument,
  onTakePhoto,
}) => {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');

  const menuItems = [
    {
      icon: 'camera' as const,
      label: t('chat.attachmentMenu.camera') || 'Câmera',
      onPress: () => {
        onTakePhoto();
        onClose();
      },
      color: '#10B981',
    },
    {
      icon: 'image' as const,
      label: t('chat.attachmentMenu.gallery') || 'Galeria',
      onPress: () => {
        onSelectImage();
        onClose();
      },
      color: '#3B82F6',
    },
    {
      icon: 'file-text' as const,
      label: t('chat.attachmentMenu.document') || 'Documento',
      onPress: () => {
        onSelectDocument();
        onClose();
      },
      color: '#F59E0B',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menuContainer}>
          <View style={[styles.menu, { backgroundColor: theme.surface }]}>
            {menuItems.map((item, index) => (
              <Pressable
                key={item.label}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && styles.menuItemBorder,
                  { borderBottomColor: theme.border },
                ]}
                onPress={item.onPress}
              >
                <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                  <Feather name={item.icon} size={24} color="#FFFFFF" />
                </View>
                <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    padding: Spacing['spacing-group-s'],
  },
  menu: {
    borderRadius: Radius.extraLarge,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing['spacing-group-s'],
    paddingHorizontal: Spacing['spacing-group-s'],
  },
  menuItemBorder: {
    borderBottomWidth: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    ...Typography.bodyMedium.medium,
    marginLeft: Spacing['spacing-group-s'],
  },
});
