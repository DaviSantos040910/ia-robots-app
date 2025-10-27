// src/components/chat/MessageBubble.tsx
import React from 'react';
import { ActivityIndicator, Pressable, View, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ChatMessage } from '../../types/chat';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';
import { MiniSuggestionChip } from './MiniSuggestionChip';
// 1. Importar a nova biblioteca
import Markdown from 'react-native-markdown-display';

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

  // 2. Criar um objeto de estilos para o componente Markdown
  //    Isto garante que o texto mantém o estilo original da sua app.
  const markdownStyle = StyleSheet.create({
    body: {
      ...textStyle,
    },
    // O Markdown usa 'strong' para o negrito (**)
    strong: {
      fontWeight: 'bold',
    },
    // Pode adicionar outros estilos aqui se o bot usar, por ex.:
    // list_item: { ... },
    // heading1: { ... },
  });

  const shouldShowSuggestions = !isUser && !!message.suggestions?.length && isLastMessage;

  return (
    <View style={rowStyle}>
      <View style={s.bubbleContainer}>
        <View style={bubbleStyle}>
          {/* 3. Substituir o componente <Text> pelo <Markdown> */}
          <Markdown style={markdownStyle}>
            {message.content}
          </Markdown>

          {!isUser && (
            <>
              <View style={s.bubbleDivider} />
              <View style={s.actionRow}>
                <View style={s.leftActions}>
                  <Pressable onPress={() => onCopy?.(message)} style={s.actionButton}>
                    <Feather name="copy" size={16} style={s.actionIcon} />
                  </Pressable>
                  <Pressable onPress={() => onLike?.(message)} style={message.liked ? s.actionButtonFilled : s.actionButton}>
                    <Feather name="thumbs-up" size={16} style={message.liked ? s.actionIconFilled : s.actionIcon} />
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

        {/* Mini suggestions: always visible; do not hide on tap */}
        {shouldShowSuggestions && ( // ----> ALTERADO: Usa a nova condição <----
          <View style={s.miniSuggestionRow}>
            {message.suggestions?.map((label, i) => (
              <MiniSuggestionChip
                key={`${message.id}-suggestion-${i}`} // Melhora a key para incluir ID da mensagem
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