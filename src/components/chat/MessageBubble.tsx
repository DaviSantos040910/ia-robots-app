// src/components/chat/MessageBubble.tsx
import React from 'react';
import { ActivityIndicator, Pressable, View, StyleSheet, Text, Image, Linking } from 'react-native';
import { useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ChatMessage } from '../../types/chat';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';
import { MiniSuggestionChip } from './MiniSuggestionChip';
import Markdown from 'react-native-markdown-display';
import { Spacing } from '../../theme/spacing';
import { Radius } from '../../theme/radius';
import { Typography } from '../../theme/typography';

export const MessageBubble: React.FC<{
  message: ChatMessage;
  onCopy?: (m: ChatMessage) => void;
  onLike?: (m: ChatMessage) => void;
  onListen?: (m: ChatMessage) => void;
  onRewrite?: (m: ChatMessage) => void;
  onSuggestionPress?: (messageId: string, text: string) => void;
  isLastMessage?: boolean;
  isSendingSuggestion?: boolean;
}> = ({
  message,
  onCopy,
  onLike,
  onListen,
  onRewrite,
  onSuggestionPress,
  isLastMessage,
  isSendingSuggestion,
}) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  const isUser = message.role === 'user';
  const rowStyle = isUser ? s.rowRight : s.rowLeft;
  const bubbleStyle = isUser ? s.bubbleUser : s.bubbleBot;
  const textStyle = isUser ? s.userText : s.bubbleText;

  // Estilos para o componente Markdown
  const markdownStyle = StyleSheet.create({
    body: {
      ...textStyle,
    },
    strong: {
      fontWeight: 'bold',
    },
  });

  const shouldShowSuggestions = !isUser && !!message.suggestions?.length && isLastMessage;

  // Determina se a mensagem tem anexo
  const hasAttachment = !!message.attachment_url;
  const isImageAttachment = message.attachment_type?.startsWith('image/');

  return (
    <View style={rowStyle}>
      <View style={s.bubbleContainer}>
        <View style={bubbleStyle}>
          {/* Renderiza o conteúdo de texto */}
          {message.content && (
            <Markdown style={markdownStyle}>
              {message.content}
            </Markdown>
          )}

          {/* Renderiza o anexo se existir */}
          {hasAttachment && (
            <View style={attachmentStyles.container}>
              {isImageAttachment ? (
                // Renderiza imagem
                <Pressable 
                  onPress={() => {
                    // TODO: Implementar preview/zoom de imagem
                    console.log('Open image preview:', message.attachment_url);
                    // Você pode abrir um modal ou navegador de imagens aqui
                  }}
                >
                  <Image
                    source={{ uri: message.attachment_url || undefined }}
                    style={attachmentStyles.image}
                    resizeMode="cover"
                  />
                </Pressable>
              ) : (
                // Renderiza documento/arquivo
                <Pressable
                  onPress={() => {
                    if (message.attachment_url) {
                      Linking.openURL(message.attachment_url).catch(err => {
                        console.error('Failed to open attachment:', err);
                      });
                    }
                  }}
                  style={[
                    attachmentStyles.document,
                    { 
                      backgroundColor: isUser ? 'rgba(255, 255, 255, 0.2)' : theme.surfaceAlt,
                      borderColor: isUser ? 'rgba(255, 255, 255, 0.3)' : theme.border,
                    }
                  ]}
                >
                  <Feather 
                    name="file-text" 
                    size={24} 
                    color={isUser ? '#FFFFFF' : theme.textPrimary} 
                  />
                  <Text 
                    style={[
                      attachmentStyles.documentText, 
                      { color: isUser ? '#FFFFFF' : theme.textPrimary }
                    ]} 
                    numberOfLines={1}
                  >
                    {message.original_filename || 'Arquivo anexo'}
                  </Text>
                  <Feather 
                    name="download" 
                    size={18} 
                    color={isUser ? 'rgba(255, 255, 255, 0.8)' : theme.textSecondary} 
                  />
                </Pressable>
              )}
            </View>
          )}

          {/* Ações do bot (apenas para mensagens do assistente) */}
          {!isUser && (
            <>
              <View style={s.bubbleDivider} />
              <View style={s.actionRow}>
                <View style={s.leftActions}>
                  <Pressable onPress={() => onCopy?.(message)} style={s.actionButton}>
                    <Feather name="copy" size={16} style={s.actionIcon} />
                  </Pressable>
                  <Pressable 
                    onPress={() => onLike?.(message)} 
                    style={message.liked ? s.actionButtonFilled : s.actionButton}
                  >
                    <Feather 
                      name="thumbs-up" 
                      size={16} 
                      style={message.liked ? s.actionIconFilled : s.actionIcon} 
                    />
                  </Pressable>
                  <Pressable onPress={() => onListen?.(message)} style={s.actionButton}>
                    <Feather name="mic" size={16} style={s.actionIcon} />
                  </Pressable>
                </View>
                <View style={s.rightActions}>
                  <Pressable onPress={() => onRewrite?.(message)} style={s.actionButton}>
                    {message.rewriting ? (
                      <ActivityIndicator size="small" color={theme.brand.normal} />
                    ) : (
                      <Feather name="refresh-cw" size={16} style={s.actionIcon} />
                    )}
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Mini suggestions: sempre visíveis na última mensagem do bot */}
        {shouldShowSuggestions && (
          <View style={s.miniSuggestionRow}>
            {message.suggestions?.map((label, i) => (
              <MiniSuggestionChip
                key={`${message.id}-suggestion-${i}`}
                label={label}
                onPress={() => onSuggestionPress?.(message.id, label)}
                disabled={isSendingSuggestion}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// Estilos específicos para anexos
const attachmentStyles = StyleSheet.create({
  container: {
    marginTop: Spacing['spacing-element-m'],
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: Radius.medium,
  },
  document: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing['spacing-element-l'],
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  documentText: {
    ...Typography.bodyRegular.medium,
    flex: 1,
    marginHorizontal: Spacing['spacing-element-m'],
  },
});
