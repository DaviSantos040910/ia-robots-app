
import React from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { ChatMessage } from '../../types/chat';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';
import { useColorScheme } from 'react-native';
import { MiniSuggestionChip } from './MiniSuggestionChip';

type Props = {
  message: ChatMessage;
  onCopy?: (m: ChatMessage) => void;
  onLike?: (m: ChatMessage) => void;
  onListen?: (m: ChatMessage) => void;
  onRewrite?: (m: ChatMessage) => void;
  onSuggestionPress?: (text: string) => void;
};

const CopyIcon = () => <Text>{'📋'}</Text>;
const LikeIcon = () => <Text>{'👍'}</Text>;
const SpeakerIcon = () => <Text>{'🔊'}</Text>;
const RewriteIcon = () => <Text>{'🔁'}</Text>;

export const MessageBubble: React.FC<Props> = ({ message, onCopy, onLike, onListen, onRewrite, onSuggestionPress }) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  const isUser = message.role === 'user';
  const containerStyle = isUser ? s.rowRight : s.rowLeft;
  const bubbleStyle = isUser ? s.bubbleUser : s.bubbleBot;
  const textStyle = isUser ? s.userText : s.bubbleText;

  return (
    <View style={containerStyle}>
      <View style={s.bubbleContainer}>
        <View style={bubbleStyle}>
          <Text style={textStyle}>{message.content}</Text>
          {!isUser && (
            <>
              <View style={s.bubbleDivider} />
              <View style={s.actionRow}>
                <View style={s.leftActions}>
                  <Pressable onPress={() => onCopy?.(message)} style={s.actionButton} hitSlop={8} accessibilityLabel="Copiar resposta">
                    <Text style={s.actionIcon}><CopyIcon /></Text>
                  </Pressable>
                  <Pressable onPress={() => onLike?.(message)} style={message.liked ? s.actionButtonFilled : s.actionButton} hitSlop={8} accessibilityLabel="Curtir resposta">
                    <Text style={message.liked ? s.actionIconFilled : s.actionIcon}><LikeIcon /></Text>
                  </Pressable>
                  <Pressable onPress={() => onListen?.(message)} style={s.actionButton} hitSlop={8} accessibilityLabel="Ouvir resposta">
                    <Text style={s.actionIcon}><SpeakerIcon /></Text>
                  </Pressable>
                </View>
                <View style={s.rightActions}>
                  <Pressable onPress={() => onRewrite?.(message)} style={s.actionButton} hitSlop={8} accessibilityLabel="Reescrever resposta">
                    {message.rewriting ? (
                      <ActivityIndicator size="small" color={theme.brand.normal} />
                    ) : (
                      <Text style={s.actionIcon}><RewriteIcon /></Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </View>
        {!isUser && !!message.suggestions?.length && (
          <View style={s.miniSuggestionRow}>
            {message.suggestions.map((label, idx) => (
              <MiniSuggestionChip key={idx} label={label} onPress={() => onSuggestionPress?.(label)} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};
