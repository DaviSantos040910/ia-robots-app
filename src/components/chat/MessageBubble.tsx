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
import { useChatController } from '../../contexts/chat/ChatProvider';

export const MessageBubble: React.FC<{
  message: ChatMessage;
  conversationId: string;
  onCopy?: (m: ChatMessage) => void;
  onLike?: (m: ChatMessage) => void;
  onListen?: (m: ChatMessage) => void;
  onRewrite?: (m: ChatMessage) => void;
  onSuggestionPress?: (messageId: string, text: string) => void;
  isLastMessage?: boolean;
  isSendingSuggestion?: boolean;
}> = ({
  message,
  conversationId,
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

  // Hook para acessar o contexto de TTS
  const { playTTS, isTTSPlaying, currentTTSMessageId } = useChatController(conversationId);
  const isThisMessagePlaying = isTTSPlaying && currentTTSMessageId === message.id;

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
  const isImageAttachment = message.attachment_type?.startsWith('image/') ||
    message.attachment_type === 'image';

  return (
    <View style={rowStyle}>
      <View style={[s.bubbleContainer, bubbleStyle]}>
        {/* Renderiza o conteúdo de texto */}
        {message.content && (
          <Markdown style={markdownStyle}>
            {message.content}
          </Markdown>
        )}

        {/* Renderiza o anexo se existir */}
{hasAttachment && message.attachment_url && (
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
                  source={{ uri: message.attachment_url }}
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
                  },
                ]}
              >
                <Feather name="file-text" size={20} color={isUser ? '#FFFFFF' : theme.textSecondary} />
                <Text 
                  style={[
                    attachmentStyles.documentText,
                    { color: isUser ? '#FFFFFF' : theme.textPrimary }
                  ]}
                  numberOfLines={1}
                >
                  {message.original_filename || 'Arquivo anexo'}
                </Text>
                <Feather name="external-link" size={16} color={isUser ? '#FFFFFF' : theme.textSecondary} />
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
                  <Feather name="copy" size={16} color={theme.textSecondary} />
                </Pressable>
                <Pressable
                  onPress={() => onLike?.(message)}
                  style={message.liked ? s.actionButtonFilled : s.actionButton}
                >
                  <Feather 
                    name={message.liked ? "thumbs-up" : "thumbs-up"} 
                    size={16} 
                    color={message.liked ? theme.brand.normal : theme.textSecondary} 
                  />
                </Pressable>
                <Pressable 
                  onPress={() => playTTS(conversationId, message.id)}
                  style={[
                    s.actionButton,
                    isThisMessagePlaying && s.actionButtonFilled
                  ]}
                >
                  <Feather 
                    name={isThisMessagePlaying ? "volume-2" : "volume-1"} 
                    size={16} 
                    color={isThisMessagePlaying ? theme.brand.normal : theme.textSecondary} 
                  />
                </Pressable>
              </View>
              <View style={s.rightActions}>
                <Pressable onPress={() => onRewrite?.(message)} style={s.actionButton}>
                  {message.rewriting ? (
                    <ActivityIndicator size="small" color={theme.textSecondary} />
                  ) : (
                    <Feather name="refresh-cw" size={16} color={theme.textSecondary} />
                  )}
                </Pressable>
              </View>
            </View>
          </>
        )}

        {/* Mini suggestions: sempre visíveis na última mensagem do bot */}
        {shouldShowSuggestions && (
          <View style={s.miniSuggestionRow}>
            {message.suggestions?.map((label, i) => (
              <MiniSuggestionChip
                key={i}
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
