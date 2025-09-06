
import React, { useState, useEffect, useRef } from 'react';
import { FlatList, View, Text, ActivityIndicator, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { SuggestionChip } from '../../components/chat/SuggestionChip';
import { createChatStyles, getTheme } from './Chat.styles';
import { useColorScheme } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { ChatMessage } from '../../types/chat';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>;

const AnimatedBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={{ opacity }}>
      <MessageBubble message={message} />
    </Animated.View>
  );
};

const TypingIndicator = () => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={s.typingBubble}>
        <Text style={{ fontSize: 16 }}>...</Text>
      </View>
    </View>
  );
};

const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { bootstrap, messages, onSendMessage, loading = false, isTyping = false } = route.params;
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);
  const insets = useSafeAreaInsets();

  const [input, setInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(messages);
  const [composerHeight, setComposerHeight] = useState<number>(64);

  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => { setChatMessages(messages); }, [messages]);

  useEffect(() => {
    setTimeout(() => { listRef.current?.scrollToEnd({ animated: true }); }, 50);
  }, [chatMessages.length]);

  const sendText = (text: string) => {
    const value = (text ?? '').trim();
    if (!value) return;
    onSendMessage(value);
    setInput('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const handleSend = () => sendText(input);

  if (loading || !bootstrap) {
    return (
      <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.brand.normal} />
      </View>
    );
  }

  const keyboardOffset = 0;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <KeyboardAvoidingView style={s.content} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={keyboardOffset}>
        <ChatHeader
          avatarUrl={bootstrap.bot.avatarUrl}
          title={bootstrap.bot.name}
          subtitle={`@${bootstrap.bot.handle}`}
          onBack={() => navigation.goBack()}
          onPhone={() => {}}
          onVolume={() => {}}
          onMore={() => {}}
        />

        <FlatList
          ref={listRef}
          data={chatMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[s.listContent, { paddingBottom: (composerHeight || 0) + Math.max(insets.bottom, 6) }]}
          renderItem={({ item }) => <AnimatedBubble message={item} />}
          ListHeaderComponent={
            <View style={s.heroContainer}>
              <View style={s.heroAvatarRing}><View style={s.heroAvatar} /></View>
              <View style={s.welcomeBubble}><Text style={s.bubbleText}>{bootstrap.welcome}</Text></View>
              <View style={s.chipStack}>
                {bootstrap.suggestions.map((suggestion, index) => (
                  <View style={s.chipItem} key={index}>
                    <SuggestionChip
                      label={suggestion}
                      onPress={() => {
                        // Tap-to-send: envia imediatamente o texto do chip
                        sendText(suggestion);
                      }}
                    />
                  </View>
                ))}
              </View>
            </View>
          }
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        <ChatInput
          value={input}
          placeholder="Digite sua mensagem..."
          onChangeText={setInput}
          onSend={handleSend}
          onMic={() => {}}
          onPlus={() => {}}
          onHeightChange={setComposerHeight}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
