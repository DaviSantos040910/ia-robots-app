import React from 'react';
import { View, Image, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { getTheme } from '../../screens/Chat/Chat.styles';
import { AttachmentPickerResult } from '../../services/attachmentService';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { Radius } from '../../theme/radius';

type Props = {
  attachment: AttachmentPickerResult;
  onRemove: (uri: string) => void;
};

export const AttachmentPreview: React.FC<Props> = ({ attachment, onRemove }) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');

  const isImage = attachment.type?.startsWith('image/');

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.content}>
        {isImage ? (
          <Image 
            source={{ uri: attachment.uri }} 
            style={styles.imageThumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: theme.brand.normal }]}>
            <Ionicons name="document-text-outline" size={24} color="#FFFFFF" />
          </View>
        )}
        
        <View style={styles.info}>
          <Text 
            style={[styles.fileName, { color: theme.textPrimary }]} 
            numberOfLines={1}
          >
            {attachment.name}
          </Text>
          {attachment.size && (
            <Text style={[styles.fileSize, { color: theme.textSecondary }]}>
              {formatFileSize(attachment.size)}
            </Text>
          )}
        </View>
      </View>

      <Pressable 
        onPress={() => onRemove(attachment.uri)} 
        style={[styles.removeButton, { backgroundColor: Colors.semantic.error.normal }]}
        hitSlop={8}
      >
        <Ionicons name="close" size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['spacing-group-s'],
    paddingVertical: Spacing['spacing-element-m'],
    // ✅ CORREÇÃO 1: Removido espaçamentos que causam o bug
    // marginHorizontal: Spacing['spacing-group-s'], (removido)
    // marginBottom: Spacing['spacing-element-m'], (removido)
    borderRadius: Radius.medium,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  imageThumbnail: {
    width: 48,
    height: 48,
    borderRadius: Radius.small,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: Spacing['spacing-group-s'],
  },
  fileName: {
    ...Typography.bodyMedium.medium,
    marginBottom: 2,
  },
  fileSize: {
    ...Typography.bodyRegular.small,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing['spacing-element-m'],
  },
});