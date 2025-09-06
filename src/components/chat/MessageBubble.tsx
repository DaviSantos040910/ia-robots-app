
import React from 'react';
import { Text, View } from 'react-native';
import { ChatMessage } from '../../types/chat';
import { createChatStyles, getTheme } from '../../screens/Chat/Chat.styles';
import { useColorScheme } from 'react-native';

type Props = {
  message: ChatMessage;
};

export const MessageBubble: React.FC<Props> = ({ message }) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  const isUser = message.role === 'user';
  const containerStyle = isUser ? s.rowRight : s.rowLeft;
  const bubbleStyle = isUser ? s.bubbleUser : s.bubbleBot;

  return (
    <View style={[s.bubbleContainer, containerStyle]}>
      <View style={bubbleStyle}>
        <Text style={s.bubbleText}>{message.content}</Text>
      </View>
    </View>
  );
};
