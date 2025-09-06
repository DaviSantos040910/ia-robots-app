
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { SuggestionChip } from '../../components/chat/SuggestionChip';
import { createChatStyles, getTheme } from './Chat.styles';
import { ChatMessage, ChatBootstrap } from '../../types/chat';
import { useChatController } from '../../contexts/chat/ChatProvider';
import * as Clipboard from 'expo-clipboard';

export type RootStackParamList = {
  ChatScreen: { chatId: string; bootstrap: ChatBootstrap; initialMessages?: ChatMessage[] };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>;

const AnimatedBubble: React.FC<{ message: ChatMessage; onSuggestionPress: (t:string)=>void; onCopy: (m:ChatMessage)=>void; onLike:(m:ChatMessage)=>void; onListen:(m:ChatMessage)=>void; onRewrite:(m:ChatMessage)=>void; }> = ({ message, onSuggestionPress, onCopy, onLike, onListen, onRewrite }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start(); }, []);
  return (
    <Animated.View style={{ opacity }}>
      <MessageBubble message={message} onSuggestionPress={onSuggestionPress} onCopy={onCopy} onLike={onLike} onListen={onListen} onRewrite={onRewrite} />
    </Animated.View>
  );
};

const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { chatId, bootstrap, initialMessages } = route.params;
  const { messages, isTyping, sendMessage, appendMessage, toggleLike, rewriteMessage, speakMessage } = useChatController(chatId);

  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);
  const insets = useSafeAreaInsets();

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [input, setInput] = useState('');

  // Seed initial messages if provided
  useEffect(() => {
    if (initialMessages && initialMessages.length) {
      initialMessages.forEach(m => appendMessage(m));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50); }, [messages.length]);

  const handleSend = () => {
    const value = input.trim();
    if (!value) return;
    sendMessage(value);
    setInput('');
  };

  const showIntro = messages.length === 0;

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <AnimatedBubble
      message={item}
      onSuggestionPress={(t) => sendMessage(t)}
      onCopy={async (m) => { await Clipboard.setStringAsync(m.content); }}
      onLike={(m) => toggleLike(m.id)}
      onListen={(m) => speakMessage(m.id)}
      onRewrite={(m) => rewriteMessage(m.id)}
    />
  );

  if (!bootstrap) {
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
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[s.listContent, { paddingBottom: Math.max(insets.bottom, 6) }]}
          renderItem={renderItem}
          ListHeaderComponent={showIntro ? (
            <View style={s.heroContainer}>
              <View style={s.heroAvatarRing}><View style={s.heroAvatar} /></View>
              <View style={s.welcomeBubble}><Text style={s.bubbleText}>{bootstrap.welcome}</Text></View>
              <View style={s.chipStack}>
                {bootstrap.suggestions.map((label, idx) => (
                  <View key={idx} style={s.chipItem}>
                    <SuggestionChip label={label} onPress={() => sendMessage(label)} />
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          ListFooterComponent={isTyping ? (
            <View style={[s.rowLeft, { marginBottom: 12 }]}>
              <View style={s.bubbleBot}><Text style={s.bubbleText}>...</Text></View>
            </View>
          ) : null}
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
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
