// src/components/chat/MessageBubble.tsx
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ChatMessage } from '../../types/chat';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';
import { MiniSuggestionChip } from './MiniSuggestionChip';

export const MessageBubble: React.FC<{
  message: ChatMessage;
  onCopy?: (m: ChatMessage) => void;
  onLike?: (m: ChatMessage) => void;
  onListen?: (m: ChatMessage) => void;
  onRewrite?: (m: ChatMessage) => void;
  onSuggestionPress?: (messageId: string, text: string) => void;
  hideSuggestions?: boolean; // kept for compatibility but unused
}> = ({
  message,
  onCopy,
  onLike,
  onListen,
  onRewrite,
  onSuggestionPress,
}) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  const isUser = message.role === 'user';
  const rowStyle = isUser ? s.rowRight : s.rowLeft;
  const bubbleStyle = isUser ? s.bubbleUser : s.bubbleBot;
  const textStyle = isUser ? s.userText : s.bubbleText;

  return (
    <View style={rowStyle}>
      <View style={s.bubbleContainer}>
        <View style={bubbleStyle}>
          <Text style={textStyle}>{message.content}</Text>

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
        {!isUser && !!message.suggestions?.length && (
          <View style={s.miniSuggestionRow}>
            {message.suggestions.map((label, i) => (
              <MiniSuggestionChip
                key={i}
                label={label}
                onPress={() => onSuggestionPress?.(message.id, label)}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};