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
import { useTranslation } from 'react-i18next'; // Importe o hook

import { ChatMessage } from '../../types/chat';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';
import { MiniSuggestionChip } from './MiniSuggestionChip';
import { Spacing } from '../../theme/spacing';
import { Radius } from '../../theme/radius';
import { Typography } from '../../theme/typography';
import { useChatController } from '../../contexts/chat/ChatProvider';
// Importa o novo player
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
  onListen,
  onRewrite,
  onSuggestionPress,
  onImagePress,
  isLastMessage,
  isSendingSuggestion,
}) => {
  const { t } = useTranslation(); // Uso do hook de tradução
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);
  const isUser = message.role === 'user';
  
  const [expanded, setExpanded] = useState(false);
  
  // Novo estado para controlar a visibilidade da transcrição
  const [showTranscription, setShowTranscription] = useState(false);

  const shouldTruncate = message.content && message.content.length > MAX_TEXT_LENGTH;
  const displayedContent = shouldTruncate && !expanded 
    ? message.content.slice(0, MAX_TEXT_LENGTH) + '...' 
    : message.content;

  const rowStyle = isUser ? s.rowRight : s.rowLeft;
  const bubbleStyle = isUser ? s.bubbleUser : s.bubbleBot;
  const textStyle = isUser ? s.userText : s.bubbleText;

  const { playTTS, isTTSPlaying, currentTTSMessageId } = useChatController(conversationId);
  const isThisMessagePlaying = isTTSPlaying && currentTTSMessageId === message.id;

  const isPending = message.id.toString().startsWith('temp') || message.id.toString().length > 30;

  const markdownStyle = useMemo(() => StyleSheet.create({
    body: { ...textStyle },
    strong: { fontWeight: 'bold' },
  }), [textStyle]);

  const shouldShowSuggestions = !isUser && !!message.suggestions?.length && isLastMessage;
  
  const hasAttachment = !!message.attachment_url;
  const isAudioMessage = message.attachment_type === 'audio';
  const isImageAttachment = message.attachment_type === 'image' || message.attachment_type?.startsWith('image/');

  const handleImagePress = useCallback(() => {
    if (message.attachment_url && onImagePress && !isPending) {
      onImagePress(message.attachment_url);
    }
  }, [message.attachment_url, onImagePress, isPending]);

  return (
    <View style={rowStyle}>
      <View style={[s.bubbleContainer, bubbleStyle]}>
        
        {/* 1. Mensagem de Áudio (Prioridade Visual) */}
        {isAudioMessage && message.attachment_url ? (
          <View style={{ marginBottom: message.content ? 8 : 0 }}>
            <AudioMessagePlayer 
              uri={message.attachment_url} 
              isUser={isUser}
            />
            
            {/* Se houver transcrição, mostra o botão de toggle */}
            {message.content ? (
              <View>
                {/* Texto da transcrição - Visível apenas se o estado permitir */}
                {showTranscription && (
                  <Text style={[textStyle, { marginTop: 8, marginBottom: 4, opacity: 0.9, fontSize: 14 }]}>
                      {message.content}
                  </Text>
                )}

                {/* Botão para mostrar/esconder a transcrição */}
                <Pressable 
                  onPress={() => setShowTranscription(!showTranscription)}
                  hitSlop={10}
                  style={{ marginTop: 4 }}
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
            /* 2. Conteúdo de Texto Padrão (se não for áudio ou se tiver texto junto) */
            message.content ? (
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
            ) : null
        )}

        {/* 3. Anexos de Imagem/Arquivo (Se não for áudio) */}
        {hasAttachment && !isAudioMessage && message.attachment_url && (
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
        {!isUser && !isPending && (
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
                {/* Só mostra botão de ouvir se NÃO for mensagem de áudio (pois ela já tem player) */}
                {!isAudioMessage && (
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
                )}
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

const arePropsEqual = (prevProps: MessageBubbleProps, nextProps: MessageBubbleProps) => {
  const isMessageContentEqual = 
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.liked === nextProps.message.liked &&
    prevProps.message.rewriting === nextProps.message.rewriting &&
    prevProps.message.attachment_url === nextProps.message.attachment_url &&
    prevProps.message.attachment_type === nextProps.message.attachment_type;

  const isLastMessageEqual = prevProps.isLastMessage === nextProps.isLastMessage;

  const prevSuggestions = prevProps.message.suggestions || [];
  const nextSuggestions = nextProps.message.suggestions || [];
  
  const isSuggestionsEqual = 
    prevSuggestions.length === nextSuggestions.length &&
    prevSuggestions.every((val, index) => val === nextSuggestions[index]);

  const isSendingStateEqual = prevProps.isSendingSuggestion === nextProps.isSendingSuggestion;

  return isMessageContentEqual && isLastMessageEqual && isSuggestionsEqual && isSendingStateEqual;
};

export const MessageBubble = memo(MessageBubbleComponent, arePropsEqual);