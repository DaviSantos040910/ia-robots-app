import React, { useState, useEffect, useRef } from 'react';
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { SuggestionChip } from '../../components/chat/SuggestionChip';
import { createChatStyles, getTheme } from './Chat.styles';
import { useColorScheme } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { ChatMessage, ChatBootstrap } from '../../types/chat';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>;

const AnimatedBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity }}>
      <MessageBubble message={message} />
    </Animated.View>
  );
};

const TypingIndicator = () => (
  <View style={{ marginBottom: 12 }}>
    <View
      style={{
        padding: 12,
        borderRadius: 16,
        backgroundColor: '#eee',
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ fontSize: 16 }}>...</Text>
    </View>
  </View>
);

const ChatScreen: React.FC<Props> = ({ route }) => {
  const { bootstrap, messages, onSendMessage, loading = false, isTyping = false } = route.params;
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  const [input, setInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(messages);

  useEffect(() => {
    setChatMessages(messages);
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  if (loading || !bootstrap) {
    return (
      <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.brand.normal} />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <ChatHeader
        avatarUrl={bootstrap.bot.avatarUrl}
        title={bootstrap.bot.name}
        subtitle={`@${bootstrap.bot.handle}`}
        onBack={() => {}}
        onVolume={() => {}}
        onMore={() => {}}
      />

      <FlatList
        data={chatMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => <AnimatedBubble message={item} />}
        ListHeaderComponent={
          <View style={s.heroContainer}>
            <View style={s.heroAvatarRing}>
              <View style={s.heroAvatar} />
            </View>
            <Text style={s.subtitle}>{bootstrap.welcome}</Text>

            <View style={s.chipStack}>
              {bootstrap.suggestions.map((suggestion, index) => (
                <SuggestionChip
                  key={index}
                  label={suggestion}
                  onPress={() => {
                    setInput(suggestion);
                    handleSend();
                  }}
                />
              ))}
            </View>
          </View>
        }
        ListFooterComponent={isTyping ? <TypingIndicator /> : null}
      />

      <ChatInput
        value={input}
        placeholder="Digite sua mensagem..."
        onChangeText={setInput}
        onSend={handleSend}
        onMic={() => {}}
        onPlus={() => {}}
      />
    </View>
  );
};

export default ChatScreen;
