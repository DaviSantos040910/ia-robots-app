
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, View,Text, Keyboard, EmitterSubscription, KeyboardAvoidingView } from 'react-native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { SuggestionChip } from '../../components/chat/SuggestionChip';
import { createChatStyles, getTheme } from './Chat.styles';
import { ChatMessage } from '../../types/chat';
import { useChatController } from '../../contexts/chat/ChatProvider';
import * as Clipboard from 'expo-clipboard';
import { ActionSheetMenu, type Anchor } from '../../components/chat/ActionSheetMenu';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';



type Props = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>;

const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { chatId, bootstrap, initialMessages } = route.params;
  const { messages, isTyping, sendMessage, appendMessage, toggleLike, rewriteMessage, speakMessage } = useChatController(chatId);

  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const [input, setInput] = useState('');
  const [showHeaderChips, setShowHeaderChips] = useState<boolean>(true);

  // Menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<Anchor>(null);

  const safeScrollToEnd = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
      setTimeout(() => listRef.current?.scrollToEnd({ animated }), 40);
      setTimeout(() => listRef.current?.scrollToEnd({ animated }), 120);
    });
  }, []);

  useEffect(() => {
    if (initialMessages && initialMessages.length) initialMessages.forEach(m => appendMessage(m));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (messages.length) safeScrollToEnd(true);
  }, [messages.length, safeScrollToEnd]);

  useEffect(() => {
    const subs: EmitterSubscription[] = [];
    const onShow = () => safeScrollToEnd(false);
    if (Platform.OS === 'ios') {
      subs.push(Keyboard.addListener('keyboardWillShow', onShow));
    } else {
      subs.push(Keyboard.addListener('keyboardDidShow', onShow));
    }
    return () => subs.forEach(s => s.remove());
  }, [safeScrollToEnd]);

  const handleSend = () => {
    const value = input.trim();
    if (!value) return;
    if (showHeaderChips) setShowHeaderChips(false);
    sendMessage(value);
    setInput('');
    safeScrollToEnd(true);
  };

  const onHeaderChipPress = (label: string) => {
    if (showHeaderChips) setShowHeaderChips(false);
    sendMessage(label);
    safeScrollToEnd(true);
  };

  const onMiniChipPress = (_messageId: string, label: string) => {
    sendMessage(label);
    safeScrollToEnd(true);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <MessageBubble
      message={item}
      onCopy={async (m) => { await Clipboard.setStringAsync(m.content); }}
      onLike={() => toggleLike(item.id)}
      onListen={() => speakMessage(item.id)}
      onRewrite={() => rewriteMessage(item.id)}
      onSuggestionPress={onMiniChipPress}
    />
  );

  if (!bootstrap) {
    return (
      <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.brand.normal} />
      </View>
    );
  }

  const keyboardBehavior = Platform.OS === 'ios' ? 'padding' : 'height';
  const keyboardOffset = 0;

  const handleNewChat = () => {
    const newId = chatId + '-new-' + Date.now();
    navigation.push('ChatScreen', {
      chatId: newId,
      bootstrap: {
        ...bootstrap,
        conversationId: newId,
      },
    });
  };

  const handleOpenSettings = () => {
    const id = (bootstrap as any)?.bot?.handle ?? 'bot-001';
    navigation.navigate('BotSettings', { botId: id });
  };

  const openOverflow = (anchor: Anchor) => {
    setMenuAnchor(anchor);
    setMenuOpen(true);
  };

  return (
    <SafeAreaView style={s.screen} edges={['top','bottom']}>
      <ChatHeader
        avatarUrl={bootstrap.bot.avatarUrl}
        title={bootstrap.bot.name}
        subtitle={`@${bootstrap.bot.handle}`}
        onBack={() => navigation.goBack()}
        onPhone={() => {}}
        onVolume={() => {}}
        onMorePress={openOverflow}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={keyboardBehavior} keyboardVerticalOffset={keyboardOffset}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={[s.listContent]}
          renderItem={renderItem}
          ListHeaderComponent={
            <View>
              <View style={s.heroContainer}>
                <View style={s.heroAvatarRing}><View style={s.heroAvatar} /></View>
                <View style={s.welcomeBubble}><Text style={s.bubbleText}>{bootstrap.welcome}</Text></View>
              </View>
              {showHeaderChips && !!bootstrap.suggestions?.length && (
                <View style={s.chipStack}>
                  {bootstrap.suggestions.map((label, idx) => (
                    <View key={idx} style={s.chipItem}>
                      <SuggestionChip label={label} onPress={() => onHeaderChipPress(label)} />
                    </View>
                  ))}
                </View>
              )}
            </View>
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          onContentSizeChange={() => safeScrollToEnd(true)}
        />

        {/* ChatInput at bottom */}
        <ChatInput
          value={input}
          placeholder="Digite sua mensagem..."
          onChangeText={setInput}
          onSend={handleSend}
          onMic={() => {}}
          onPlus={() => {}}
        />
      </KeyboardAvoidingView>

      <ActionSheetMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchor={menuAnchor}
        items={[
          { label: 'New chat', onPress: handleNewChat },
          { label: 'Settings', onPress: handleOpenSettings },
        ]}
      />
    </SafeAreaView>
  );
};

export default ChatScreen;
