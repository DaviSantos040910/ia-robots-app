// src/screens/Chat/ChatScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, View, Text, Keyboard, KeyboardAvoidingView, Animated, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { SuggestionChip } from '../../components/chat/SuggestionChip';
import { createChatStyles, getTheme } from './Chat.styles';
import { ChatMessage, ChatBootstrap } from '../../types/chat';
import { useChatController } from '../../contexts/chat/ChatProvider';
import * as Clipboard from 'expo-clipboard';
import { ActionSheetMenu, type Anchor } from '../../components/chat/ActionSheetMenu';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { useFadeSlideIn, AnimatedPressable, useScaleOnPress, smoothLayout, useFadeScaleIn } from '../../components/shared/Motion';
import { Feather } from '@expo/vector-icons';
import { botService } from '../../services/botService';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>;

// ... (Animated components remain unchanged)
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

const ScrollToEndButton: React.FC<{ visible: boolean, onPress: () => void }> = ({ visible, onPress }) => {
    const theme = getTheme(useColorScheme() === 'dark');
    const s = createChatStyles(theme);
    const anim = useFadeScaleIn(visible, { duration: 200 });

    return (
        <Animated.View style={[s.scrollToEndButton, anim]}>
            <AnimatedPressable onPress={onPress}>
                <Feather name="arrow-down" size={20} color={theme.textPrimary} />
            </AnimatedPressable>
        </Animated.View>
    );
};
const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { chatId, initialMessages } = route.params;
  const { messages, isTyping, sendMessage, appendMessage, toggleLike, rewriteMessage, speakMessage } = useChatController(chatId);
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  // Ref to prevent the new-message scroll effect from running on the initial render.
  const isInitialRender = useRef(true);

  const [input, setInput] = useState('');
  const [bootstrap, setBootstrap] = useState<ChatBootstrap | null>(null);
  const [showHeaderChips, setShowHeaderChips] = useState(true);
  const [showScrollToEnd, setShowScrollToEnd] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<Anchor>(null);

  const headerAnim = useFadeSlideIn({ dy: -8, duration: 260 });

  const safeScrollToEnd = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const handleOpenSettings = () => {
    const botId = bootstrap?.bot?.handle ?? 'default-bot';
    navigation.navigate('BotSettings', { botId });
  };

  const handleNewChat = () => {
    const newId = `chat-${Date.now()}`;
    navigation.push('ChatScreen', {
      chatId: newId,
    });
  };

  const menuItems = React.useMemo(() => [
    { label: t('chat.menuSettings'), onPress: handleOpenSettings, icon: <Feather name="settings" size={18} color={theme.textPrimary} /> },
    { label: t('chat.menuNewChat'), onPress: handleNewChat, icon: <Feather name="plus-circle" size={18} color={theme.textPrimary} /> },
  ], [t, theme.textPrimary, handleOpenSettings, handleNewChat]);

  // --- Effects ---
  useEffect(() => {
    let isMounted = true;
    const loadBootstrap = async () => {
      try {
        const data = await botService.getChatBootstrap(chatId);
        if (isMounted) setBootstrap(data);
      } catch (error) {
        console.error("Failed to load chat bootstrap:", error);
      }
    };
    loadBootstrap();
    return () => { isMounted = false; };
  }, [chatId]);

  useEffect(() => {
    if (initialMessages?.length) {
      initialMessages.forEach(m => appendMessage(m));
    }
  }, [initialMessages, appendMessage]);

  useEffect(() => {
    if (messages.length > 0) {
      setShowHeaderChips(false);
    }
  }, [messages.length]);

  // SOLUÇÃO: `useFocusEffect` garante a rolagem para o final sempre que a tela é focada.
  useFocusEffect(
    useCallback(() => {
      if (messages.length > 0) {
        safeScrollToEnd(false); // Rola sem animação ao entrar/voltar.
      }
    }, [messages.length, safeScrollToEnd])
  );
  
  // SOLUÇÃO: Este `useEffect` agora lida APENAS com a chegada de novas mensagens.
  useEffect(() => {
    // Ignora a primeira renderização, que já é tratada pelo useFocusEffect.
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    
    // Para qualquer nova mensagem, rola suavemente para o final.
    if (messages.length > 0) {
      safeScrollToEnd(true);
    }
  }, [messages.length, safeScrollToEnd]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    if (showScrollToEnd === isAtBottom) {
        setShowScrollToEnd(!isAtBottom);
    }
  };

  const handleSend = () => {
    const value = input.trim();
    if (!value) return;
    if (showHeaderChips) {
      smoothLayout();
      setShowHeaderChips(false);
    }
    sendMessage(value);
    setInput('');
  };

  const onHeaderChipPress = (label: string) => {
    if (showHeaderChips) {
      smoothLayout();
      setShowHeaderChips(false);
    }
    sendMessage(label);
  };

  const onMiniChipPress = (_messageId: string, label: string) => {
    sendMessage(label);
  };

  const openOverflow = (anchor: Anchor) => {
    setMenuAnchor(anchor);
    setMenuOpen(true);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <AnimatedBubble
      item={item}
      onCopy={() => {}}
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

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <View style={{ flex: 1 }}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            contentContainerStyle={s.listContent}
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
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
          <ScrollToEndButton visible={showScrollToEnd} onPress={() => safeScrollToEnd(true)} />
        </View>

        <ChatInput
          value={input}
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
        items={menuItems}
      />
    </SafeAreaView>
  );
};

export default ChatScreen;