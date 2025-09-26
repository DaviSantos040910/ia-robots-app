
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, View,Text, Keyboard, EmitterSubscription, KeyboardAvoidingView, Animated } from 'react-native';
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
import { useFadeSlideIn, AnimatedPressable, useScaleOnPress, smoothLayout } from '../../components/shared/Motion';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>;

const ChipAnimatedItem: React.FC<{ idx: number; label: string; onPress: (label: string) => void; style?: any }>
= ({ idx, label, onPress, style }) => {
  const anim = useFadeSlideIn({ delay: idx * 50, dy: 10, duration: 320 });
  const press = useScaleOnPress();
  return (
    <Animated.View style={[style, anim]}>
      <AnimatedPressable onPress={() => onPress(label)} onPressIn={press.onPressIn} onPressOut={press.onPressOut} style={press.style}>
        <SuggestionChip label={label} onPress={() => onPress(label)} />
      </AnimatedPressable>
    </Animated.View>
  );
};

const AnimatedBubble: React.FC<{ item: ChatMessage; onCopy: (m: ChatMessage) => void; onLike: () => void; onListen: () => void; onRewrite: () => void; onSuggestionPress: (id: string, label: string) => void }>
= ({ item, onCopy, onLike, onListen, onRewrite, onSuggestionPress }) => {
  const scale = useRef(new Animated.Value(0.98)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 90 }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);
  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <MessageBubble
        message={item}
        onCopy={async (_) => { await Clipboard.setStringAsync(item.content); onCopy(item); }}
        onLike={onLike}
        onListen={onListen}
        onRewrite={onRewrite}
        onSuggestionPress={(label) => onSuggestionPress(item.id, label)}
      />
    </Animated.View>
  );
};

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

  const headerAnim = useFadeSlideIn({ dy: -8, duration: 260 });

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
    if (showHeaderChips) { smoothLayout(); setShowHeaderChips(false); }
    sendMessage(value);
    setInput('');
    safeScrollToEnd(true);
  };

  const onHeaderChipPress = (label: string) => {
    if (showHeaderChips) { smoothLayout(); setShowHeaderChips(false); }
    sendMessage(label);
    safeScrollToEnd(true);
  };

  const onMiniChipPress = (_messageId: string, label: string) => {
    sendMessage(label);
    safeScrollToEnd(true);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <AnimatedBubble
      item={item}
      onCopy={(m) => { /* já copiado acima; opcional mantido */ }}
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
      <Animated.View style={headerAnim}>
        <ChatHeader
          avatarUrl={bootstrap.bot.avatarUrl}
          title={bootstrap.bot.name}
          subtitle={`@${bootstrap.bot.handle}`}
          onBack={() => navigation.goBack()}
          onPhone={() => {}}
          onVolume={() => {}}
          onMorePress={openOverflow}
        />
      </Animated.View>

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
                    <ChipAnimatedItem key={idx} idx={idx} label={label} onPress={onHeaderChipPress} style={s.chipItem} />
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
    { label: 'Settings', onPress: handleOpenSettings },
  ]}
/>

    </SafeAreaView>
  );
};

export default ChatScreen;
