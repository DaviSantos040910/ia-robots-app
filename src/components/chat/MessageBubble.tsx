// src/components/chat/MessageBubble.tsx

import React, { memo, useState, useCallback, useMemo } from 'react';
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

type MessageBubbleProps = {
  message: ChatMessage;
  conversationId: string;
  onCopy?: (m: ChatMessage) => void;
  onLike?: (m: ChatMessage) => void;
  onListen?: (m: ChatMessage) => void;
  onRewrite?: (m: ChatMessage) => void;
  onSuggestionPress?: (messageId: string, text: string) => void;
  onImagePress?: (imageUrl: string) => void;
  isLastMessage?: boolean;
  isSendingSuggestion?: boolean;
};

const MAX_TEXT_LENGTH = 500;

const MessageBubbleComponent: React.FC<MessageBubbleProps> = ({
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
  
  const [expanded, setExpanded] = useState(false);

  // Otimização: Truncar texto longo para renderização inicial mais rápida
  const shouldTruncate = message.content && message.content.length > MAX_TEXT_LENGTH;
  const displayedContent = shouldTruncate && !expanded 
    ? message.content.slice(0, MAX_TEXT_LENGTH) + '...' 
    : message.content;

  const rowStyle = isUser ? s.rowRight : s.rowLeft;
  const bubbleStyle = isUser ? s.bubbleUser : s.bubbleBot;
  const textStyle = isUser ? s.userText : s.bubbleText;

  // Hook de TTS (Atenção: Isso conecta o componente ao contexto global. 
  // Se isPlaying mudar, este componente re-renderiza. O memo abaixo mitiga isso se as props não mudarem)
  const { playTTS, isTTSPlaying, currentTTSMessageId } = useChatController(conversationId);
  const isThisMessagePlaying = isTTSPlaying && currentTTSMessageId === message.id;

  const isPending = message.id.toString().startsWith('temp');

  const markdownStyle = useMemo(() => StyleSheet.create({
    body: { ...textStyle },
    strong: { fontWeight: 'bold' },
  }), [textStyle]);

  const shouldShowSuggestions = !isUser && !!message.suggestions?.length && isLastMessage;
  const hasAttachment = !!message.attachment_url;
  const isImageAttachment = message.attachment_type?.startsWith('image/') || message.attachment_type === 'image';

  const handleImagePress = useCallback(() => {
    if (message.attachment_url && onImagePress && !isPending) {
      onImagePress(message.attachment_url);
    }
  }, [message.attachment_url, onImagePress, isPending]);

  return (
    <View style={rowStyle}>
      <View style={[s.bubbleContainer, bubbleStyle]}>
        {/* Conteúdo de Texto */}
        {message.content ? (
          <View>
            <Markdown style={markdownStyle}>
              {displayedContent}
            </Markdown>
            {shouldTruncate && !expanded && (
              <Pressable onPress={() => setExpanded(true)} style={{ marginTop: 4 }}>
                <Text style={s.readMore}>Ler mais</Text>
              </Pressable>
            )}
          </View>
        ) : null}

        {/* Anexos */}
        {hasAttachment && message.attachment_url && (
          <View style={attachmentStyles.container}>
            {isImageAttachment ? (
              <Pressable
                onPress={handleImagePress}
                style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
              >
                <Image
                  source={{ uri: message.attachment_url! }}
                  style={[
                    attachmentStyles.image,
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
              <Pressable
                onPress={() => {
                  if (message.attachment_url && !isPending) {
                    Linking.openURL(message.attachment_url).catch(console.error);
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
                    name="thumbs-up" 
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

// --- CRÍTICO: Função de Comparação de Props ---
const arePropsEqual = (prevProps: MessageBubbleProps, nextProps: MessageBubbleProps) => {
  const isMessageEqual = 
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.liked === nextProps.message.liked &&
    prevProps.message.rewriting === nextProps.message.rewriting &&
    prevProps.message.attachment_url === nextProps.message.attachment_url;

  const isStateEqual = 
    prevProps.isLastMessage === nextProps.isLastMessage &&
    prevProps.isSendingSuggestion === nextProps.isSendingSuggestion;

  // Ignoramos propositalmente as funções (onLike, onCopy) e conversationId
  // pois elas são estáveis ou não afetam o visual isoladamente.
  return isMessageEqual && isStateEqual;
};

export const MessageBubble = memo(MessageBubbleComponent, arePropsEqual);