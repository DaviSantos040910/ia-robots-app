// src/components/chat/MessageBubble.tsx

import React from 'react';
import { 
  ActivityIndicator, 
  Pressable, 
  View, 
  StyleSheet, 
  Text, 
  Image, 
  Linking, 
  useColorScheme 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';

import { ChatMessage } from '../../types/chat';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';
import { MiniSuggestionChip } from './MiniSuggestionChip';
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
  onImagePress?: (imageUrl: string) => void; // Nova prop para abrir imagem
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
  onImagePress,
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

  // Verifica se a mensagem é temporária (ainda enviando)
  // No ChatProvider, IDs temporários começam com "temp"
  const isPending = message.id.toString().startsWith('temp');

  const markdownStyle = StyleSheet.create({
    body: {
      ...textStyle,
    },
    strong: {
      fontWeight: 'bold',
    },
  });

  const shouldShowSuggestions = !isUser && !!message.suggestions?.length && isLastMessage;

  const hasAttachment = !!message.attachment_url;
  const isImageAttachment = message.attachment_type?.startsWith('image/') ||
    message.attachment_type === 'image';

  const handleImagePress = () => {
    // Só permite abrir se tiver URL e NÃO for uma mensagem pendente de envio
    if (message.attachment_url && onImagePress && !isPending) {
      onImagePress(message.attachment_url);
    }
  };

  return (
    <View style={rowStyle}>
      <View style={[s.bubbleContainer, bubbleStyle]}>
        {/* Conteúdo de Texto */}
        {message.content ? (
          <Markdown style={markdownStyle}>
            {message.content}
          </Markdown>
        ) : null}

        {/* Anexos */}
        {hasAttachment && message.attachment_url && (
          <View style={attachmentStyles.container}>
            {isImageAttachment ? (
              // Imagem
              <Pressable
                onPress={handleImagePress}
                style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
              >
                <Image
                  source={{ uri: message.attachment_url }}
                  style={[
                    attachmentStyles.image,
                    // Adiciona uma leve opacidade se estiver pendente para indicar upload
                    { opacity: isPending ? 0.5 : 1 }
                  ]}
                  resizeMode="cover"
                />
                {isPending && (
                  <View style={attachmentStyles.loadingOverlay}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            ) : (
              // Documento
              <Pressable
                onPress={() => {
                  if (message.attachment_url && !isPending) {
                    Linking.openURL(message.attachment_url).catch(err => {
                      console.error('Falha ao abrir anexo:', err);
                    });
                  }
                }}
                style={[
                  attachmentStyles.document,
                  {
                    backgroundColor: isUser ? 'rgba(255, 255, 255, 0.2)' : theme.surfaceAlt,
                    borderColor: isUser ? 'rgba(255, 255, 255, 0.3)' : theme.border,
                    opacity: isPending ? 0.7 : 1,
                  },
                ]}
              >
                <Feather name="file-text" size={20} color={isUser ? '#FFFFFF' : theme.textSecondary} />
                <View style={{ flex: 1, marginHorizontal: Spacing['spacing-element-m'] }}>
                    <Text 
                    style={[
                        attachmentStyles.documentText,
                        { color: isUser ? '#FFFFFF' : theme.textPrimary }
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                    >
                    {message.original_filename || 'Arquivo anexo'}
                    </Text>
                </View>
                {!isPending && (
                  <Feather name="external-link" size={16} color={isUser ? '#FFFFFF' : theme.textSecondary} />
                )}
                {isPending && (
                   <ActivityIndicator size="small" color={isUser ? '#FFFFFF' : theme.textSecondary} />
                )}
              </Pressable>
            )}
          </View>
        )}

        {/* Ações do Bot */}
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

        {/* Sugestões */}
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

const attachmentStyles = StyleSheet.create({
  container: {
    marginTop: Spacing['spacing-element-s'],
    borderRadius: Radius.medium,
    overflow: 'hidden',
    minWidth: 200,
  },
  image: {
    width: 220, 
    height: 220,
    borderRadius: Radius.medium,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.medium,
  },
  document: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing['spacing-element-l'],
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    width: 220,
  },
  documentText: {
    ...Typography.bodyRegular.medium,
  },
});


