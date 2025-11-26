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
  const isDark = scheme === 'dark';

  // Memoização de Estilos e Tema
  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const s = useMemo(() => createChatStyles(theme), [theme]);

  const isUser = message.role === 'user';
  
  const [expanded, setExpanded] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);

  // --- TAREFA: Adicionado isTTSLoading ---
  const { playTTS, isTTSPlaying, currentTTSMessageId, isTTSLoading } = useChatController(conversationId);
  
  const isThisMessagePlaying = isTTSPlaying && currentTTSMessageId === message.id;
  
  // --- NOVA LÓGICA DE FEEDBACK VISUAL ---
  const isLoadingThisMessage = isTTSLoading && currentTTSMessageId === message.id;
  // Desabilita se estiver carregando qualquer coisa para evitar conflito (race condition)
  const isTTSDisabled = isTTSLoading; 

  const isAudioMessage = message.attachment_type === 'audio';
  
  const displayedContent = useMemo(() => {
    if (isAudioMessage) return '';
    const shouldTruncate = message.content && message.content.length > MAX_TEXT_LENGTH;
    return shouldTruncate && !expanded 
      ? message.content.slice(0, MAX_TEXT_LENGTH) + '...' 
      : message.content;
  }, [message.content, expanded, isAudioMessage]);

  const shouldTruncate = !isAudioMessage && message.content && message.content.length > MAX_TEXT_LENGTH;
  const isPending = message.id.toString().startsWith('temp') || message.id.toString().length > 30;
  const shouldShowSuggestions = !isUser && !!message.suggestions?.length && isLastMessage;
  
  const hasAttachment = !!message.attachment_url;
  const isImageAttachment = message.attachment_type === 'image' || message.attachment_type?.startsWith('image/');

  // Estilos condicionados
  const rowStyle = isUser ? s.rowRight : s.rowLeft;
  const bubbleStyle = isUser ? s.bubbleUser : s.bubbleBot;
  const textStyle = isUser ? s.userText : s.bubbleText;

  const markdownStyle = useMemo(() => StyleSheet.create({
    body: { ...textStyle },
    strong: { fontWeight: 'bold', color: textStyle.color },
    link: { color: theme.brand.normal, textDecorationLine: 'underline' },
  }), [textStyle, theme]);

  const documentStyle = useMemo(() => ({
    backgroundColor: isUser ? 'rgba(255, 255, 255, 0.2)' : theme.surfaceAlt,
    borderColor: isUser ? 'rgba(255, 255, 255, 0.3)' : theme.border,
    opacity: isPending ? 0.7 : 1,
  }), [isUser, theme, isPending]);

  const documentTextStyle = useMemo(() => ({
    color: isUser ? '#FFFFFF' : theme.textPrimary 
  }), [isUser, theme]);

  // Handlers
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

  const renderedContent = useMemo(() => {
    if (isAudioMessage && message.attachment_url) {
      return (
        <View style={{ marginBottom: message.content ? 8 : 0 }}>
            <AudioMessagePlayer 
              uri={message.attachment_url} 
              isUser={isUser}
              duration={message.duration} 
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
      );
    }

    if (message.content) {
      return (
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
      );
    }
    return null;
  }, [
    isAudioMessage, 
    message.attachment_url, 
    message.content,
    message.duration, 
    isUser, 
    showTranscription, 
    textStyle, 
    s, 
    handleToggleTranscription, 
    theme.textSecondary, 
    t, 
    markdownStyle, 
    displayedContent, 
    shouldTruncate, 
    expanded, 
    handleReadMore
  ]);

  const renderedAttachment = useMemo(() => {
    if (!hasAttachment || isAudioMessage || !message.attachment_url) return null;

    return (
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
    );
  }, [
    hasAttachment, 
    isAudioMessage, 
    message.attachment_url, 
    s, 
    isImageAttachment, 
    handleImagePress, 
    isPending, 
    handleLinkPress, 
    documentStyle, 
    isUser, 
    theme.textSecondary, 
    documentTextStyle, 
    message.original_filename
  ]);

  const renderedActions = useMemo(() => {
    if (isUser || isPending) return null;
    return (
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
                    disabled={isTTSDisabled} // Desabilita se houver carregamento ativo
                    style={[
                        s.actionButton,
                        isThisMessagePlaying && s.actionButtonFilled,
                        { opacity: isTTSDisabled ? 0.5 : 1 } // Feedback visual de desabilitado
                    ]}
                    >
                    {isLoadingThisMessage ? (
                        // Mostra spinner se estiver carregando ESTA mensagem
                        <ActivityIndicator size="small" color={theme.brand.normal} />
                    ) : (
                        // Ícone normal
                        <Feather 
                            name={isThisMessagePlaying ? "volume-2" : "volume-1"} 
                            size={16} 
                            color={isThisMessagePlaying ? theme.brand.normal : theme.textSecondary} 
                        />
                    )}
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
    );
  }, [
    isUser, 
    isPending, 
    s, 
    handleCopy, 
    theme, 
    handleLike, 
    message.liked, 
    isAudioMessage, 
    handlePlayTTS, 
    isThisMessagePlaying, 
    handleRewrite, 
    message.rewriting,
    // Novas dependências adicionadas ao useMemo
    isTTSDisabled,
    isLoadingThisMessage
  ]);

  return (
    <View style={rowStyle}>
      <View style={[s.bubbleContainer, bubbleStyle]}>
        {renderedContent}
        {renderedAttachment}
        {renderedActions}

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

// --- OTIMIZAÇÃO CRÍTICA: Comparação Rigorosa ---
const arePropsEqual = (prev: MessageBubbleProps, next: MessageBubbleProps) => {
  const { message: m1 } = prev;
  const { message: m2 } = next;

  // 1. IDs diferentes
  if (m1.id !== m2.id) return false;

  // 2. Conteúdo (texto, anexo, duração)
  if (m1.content !== m2.content) return false;
  if (m1.attachment_url !== m2.attachment_url) return false;
  if (m1.duration !== m2.duration) return false; 

  // 3. Estados de interação
  if (m1.liked !== m2.liked) return false;
  if (m1.rewriting !== m2.rewriting) return false;

  // 4. Props contextuais
  if (prev.isLastMessage !== next.isLastMessage) return false;
  if (prev.isSendingSuggestion !== next.isSendingSuggestion) return false;
  
  return true;
};

export const MessageBubble = memo(MessageBubbleComponent, arePropsEqual);