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
import { useTranslation } from 'react-i18next';

import { ChatMessage } from '../../types/chat';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';
import { MiniSuggestionChip } from './MiniSuggestionChip';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { useChatController } from '../../contexts/chat/ChatProvider';
import { AudioMessagePlayer } from './AudioMessagePlayer';

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
  onRewrite,
  onSuggestionPress,
  onImagePress,
  isLastMessage,
  isSendingSuggestion,
}) => {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);
  const isUser = message.role === 'user';
  
  const [expanded, setExpanded] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);

  const { playTTS, isTTSPlaying, currentTTSMessageId } = useChatController(conversationId);
  
  // Computações Simples
  const shouldTruncate = message.content && message.content.length > MAX_TEXT_LENGTH;
  const displayedContent = shouldTruncate && !expanded 
    ? message.content.slice(0, MAX_TEXT_LENGTH) + '...' 
    : message.content;

  // Estilos condicionados (não inline)
  const rowStyle = isUser ? s.rowRight : s.rowLeft;
  const bubbleStyle = isUser ? s.bubbleUser : s.bubbleBot;
  const textStyle = isUser ? s.userText : s.bubbleText;
  const isPending = message.id.toString().startsWith('temp') || message.id.toString().length > 30;
  const shouldShowSuggestions = !isUser && !!message.suggestions?.length && isLastMessage;
  
  const isThisMessagePlaying = isTTSPlaying && currentTTSMessageId === message.id;
  const hasAttachment = !!message.attachment_url;
  const isAudioMessage = message.attachment_type === 'audio';
  const isImageAttachment = message.attachment_type === 'image' || message.attachment_type?.startsWith('image/');

  // Memoização de estilos complexos que dependem de props
  const markdownStyle = useMemo(() => StyleSheet.create({
    body: { ...textStyle },
    strong: { fontWeight: 'bold' },
  }), [textStyle]);

  const documentStyle = useMemo(() => ({
    backgroundColor: isUser ? 'rgba(255, 255, 255, 0.2)' : theme.surfaceAlt,
    borderColor: isUser ? 'rgba(255, 255, 255, 0.3)' : theme.border,
    opacity: isPending ? 0.7 : 1,
  }), [isUser, theme, isPending]);

  const documentTextStyle = useMemo(() => ({
    color: isUser ? '#FFFFFF' : theme.textPrimary 
  }), [isUser, theme]);

  // Handlers Memoizados com useCallback
  const handleImagePress = useCallback(() => {
    if (message.attachment_url && onImagePress && !isPending) {
      onImagePress(message.attachment_url);
    }
  }, [message.attachment_url, onImagePress, isPending]);

  const handleLinkPress = useCallback(() => {
    if (message.attachment_url && !isPending) {
      Linking.openURL(message.attachment_url).catch(console.error);
    }
  }, [message.attachment_url, isPending]);

  const handleToggleTranscription = useCallback(() => {
    setShowTranscription(prev => !prev);
  }, []);

  const handleReadMore = useCallback(() => {
    setExpanded(true);
  }, []);

  const handleCopy = useCallback(() => onCopy?.(message), [onCopy, message]);
  const handleLike = useCallback(() => onLike?.(message), [onLike, message]);
  const handleRewrite = useCallback(() => onRewrite?.(message), [onRewrite, message]);
  const handlePlayTTS = useCallback(() => playTTS(conversationId, message.id), [playTTS, conversationId, message.id]);

  // Renderização
  return (
    <View style={rowStyle}>
      <View style={[s.bubbleContainer, bubbleStyle]}>
        
        {/* 1. Mensagem de Áudio */}
        {isAudioMessage && message.attachment_url ? (
          <View style={{ marginBottom: message.content ? 8 : 0 }}>
            <AudioMessagePlayer 
              uri={message.attachment_url} 
              isUser={isUser}
            />
            
            {message.content ? (
              <View>
                {showTranscription && (
                  <Text style={[textStyle, s.transcriptionText]}>
                      {message.content}
                  </Text>
                )}
                <Pressable 
                  onPress={handleToggleTranscription}
                  hitSlop={10}
                  style={s.transcriptionToggle}
                >
                  <Text style={[
                    Typography.bodyRegular.small, 
                    { 
                      color: isUser ? 'rgba(255,255,255,0.8)' : theme.textSecondary,
                      textDecorationLine: 'underline'
                    }
                  ]}>
                    {showTranscription ? t('chat.hideTranscription') : t('chat.showTranscription')}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : (
            /* 2. Conteúdo de Texto Padrão */
            message.content ? (
            <View>
                <Markdown style={markdownStyle}>
                {displayedContent}
                </Markdown>
                {shouldTruncate && !expanded && (
                <Pressable onPress={handleReadMore} style={{ marginTop: 4 }}>
                    <Text style={s.readMore}>Ler mais</Text>
                </Pressable>
                )}
            </View>
            ) : null
        )}

        {/* 3. Anexos */}
        {hasAttachment && !isAudioMessage && message.attachment_url && (
          <View style={s.attachmentContainer}>
            {isImageAttachment ? (
              <Pressable
                onPress={handleImagePress}
                style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
              >
                <Image
                  source={{ uri: message.attachment_url! }}
                  style={[
                    s.attachmentImage,
                    { opacity: isPending ? 0.5 : 1 }
                  ]}
                  resizeMode="cover"
                />
                {isPending && (
                  <View style={s.attachmentLoadingOverlay}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            ) : (
              <Pressable
                onPress={handleLinkPress}
                style={[s.attachmentDocument, documentStyle]}
              >
                <Feather name="file-text" size={20} color={isUser ? '#FFFFFF' : theme.textSecondary} />
                <View style={{ flex: 1, marginHorizontal: Spacing['spacing-element-m'] }}>
                    <Text 
                    style={[s.attachmentDocumentText, documentTextStyle]}
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
        {!isUser && !isPending && (
          <>
            <View style={s.bubbleDivider} />
            <View style={s.actionRow}>
              <View style={s.leftActions}>
                <Pressable onPress={handleCopy} style={s.actionButton}>
                  <Feather name="copy" size={16} color={theme.textSecondary} />
                </Pressable>
                <Pressable
                  onPress={handleLike}
                  style={message.liked ? s.actionButtonFilled : s.actionButton}
                >
                  <Feather 
                    name="thumbs-up" 
                    size={16} 
                    color={message.liked ? theme.brand.normal : theme.textSecondary} 
                  />
                </Pressable>
                {!isAudioMessage && (
                    <Pressable 
                    onPress={handlePlayTTS}
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
                )}
              </View>
              <View style={s.rightActions}>
                <Pressable onPress={handleRewrite} style={s.actionButton}>
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
              <SuggestionItem 
                key={i}
                label={label}
                messageId={message.id}
                onPress={onSuggestionPress}
                disabled={isSendingSuggestion}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// Extraí o item de sugestão para evitar recriar a função dentro do map
const SuggestionItem = memo(({ label, messageId, onPress, disabled }: any) => {
    const handlePress = useCallback(() => onPress?.(messageId, label), [onPress, messageId, label]);
    return (
        <MiniSuggestionChip
            label={label}
            onPress={handlePress}
            disabled={disabled}
        />
    );
});

const arePropsEqual = (prev: MessageBubbleProps, next: MessageBubbleProps) => {
  // 1. Checagem de ID e status visual crítico
  const isSameId = prev.message.id === next.message.id;
  const isSameLoading = prev.message.rewriting === next.message.rewriting;
  const isSameLiked = prev.message.liked === next.message.liked;
  const isSameSending = prev.isSendingSuggestion === next.isSendingSuggestion;
  const isSameLast = prev.isLastMessage === next.isLastMessage;

  // 2. Checagem de conteúdo (importante para streaming)
  const isSameContent = prev.message.content === next.message.content;
  
  // 3. Checagem de Mídia (Evita re-render do player de áudio)
  const isSameAttachment = prev.message.attachment_url === next.message.attachment_url;

  // 4. Checagem profunda de sugestões (array)
  const prevSugg = prev.message.suggestions || [];
  const nextSugg = next.message.suggestions || [];
  const isSameSuggestions = prevSugg.length === nextSugg.length && 
                            prevSugg.every((v, i) => v === nextSugg[i]);

  return isSameId && isSameContent && isSameLiked && isSameLoading && 
         isSameSending && isSameLast && isSameAttachment && isSameSuggestions;
};

export const MessageBubble = memo(MessageBubbleComponent, arePropsEqual);