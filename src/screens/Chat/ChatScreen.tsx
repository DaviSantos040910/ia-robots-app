// src/screens/Chat/ChatScreen.tsx
import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { ActivityIndicator, FlatList, Platform, View, Text, KeyboardAvoidingView, Alert, Image, Pressable } from 'react-native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';

import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { SuggestionChip } from '../../components/chat/SuggestionChip';
import { createChatStyles, getTheme } from './Chat.styles';
import { ChatBootstrap, ChatMessage } from '../../types/chat';
import { useChatController } from '../../contexts/chat/ChatProvider';
import { ActionSheetMenu, type Anchor } from '../../components/chat/ActionSheetMenu';
import type { RootStackParamList } from '../../types/navigation';
import { botService } from '../../services/botService';
import { chatService } from '../../services/chatService';
import { smoothLayout } from '../../components/shared/Motion';

type ChatScreenRouteProp = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>['route'];

const ChatScreen: React.FC = () => { 
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<NativeStackScreenProps<RootStackParamList, 'ChatScreen'>['navigation']>(); 

  const { botId, isArchived: initialIsArchived, chatId: initialChatId } = route.params;
  
  const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatId);
  const [bootstrap, setBootstrap] = useState<ChatBootstrap | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(initialIsArchived ?? false);
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<Anchor>(null);
  const [showHeaderChips, setShowHeaderChips] = useState(true);

  // --- HOOKS ---
  const { 
    messages, 
    isTyping,
    isLoadingMore,
    isLoadingInitial,
    hasLoadedOnce,     
    loadInitialMessages,
    loadMoreMessages,
    sendMessage,
    archiveAndStartNew,
    clearLocalChatState 
  } = useChatController(currentChatId); // Pass state chatId

  const { t } = useTranslation();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  // --- DATA LOADING ---
  // --- DATA LOADING ---
const loadChatData = useCallback(async () => {
  if (!botId) return; 

  try {
    console.log("[ChatScreen] Loading bootstrap...");

    // 1. Carrega bootstrap se ainda não foi carregado ou se o chatId mudou
    if (!bootstrap || currentChatId !== bootstrap.conversationId) {
      const data = await botService.getChatBootstrap(botId);
      setBootstrap(data);

      // Atualiza o chatId atual caso o bootstrap tenha um novo ID
      if (currentChatId === initialChatId && data.conversationId !== initialChatId) {
        console.log(`[ChatScreen] Updating currentChatId from bootstrap ${initialChatId} to ${data.conversationId}`);
        setCurrentChatId(data.conversationId);
      }
    }

    // 2. Determina qual chatId deve ser usado
    const chatIdToLoad = currentChatId || bootstrap?.conversationId;
    console.log(`[ChatScreen] Determined chatIdToLoad: ${chatIdToLoad}`);

    // 3. Carrega mensagens iniciais se ainda não foi feito
    if (chatIdToLoad && !hasLoadedOnce && !isLoadingInitial) {
      console.log(`[ChatScreen] Triggering loadInitialMessages for ${chatIdToLoad}`);
      clearLocalChatState(chatIdToLoad); // limpa cache local do chat
      await loadInitialMessages();       // usa o hook já vinculado ao currentChatId
    } else {
      console.log(`[ChatScreen] Initial messages already loaded or loading for ${chatIdToLoad}`);
    }

    // 4. Define o estado de somente leitura
    setIsReadOnly(initialIsArchived ?? false);

  } catch (error) {
    console.error("[ChatScreen] Failed to load chat data:", error);
    Alert.alert("Error", "Could not load chat data. Please go back and try again.");
  }
}, [
  botId,
  currentChatId,
  initialChatId,
  bootstrap,
  hasLoadedOnce,
  isLoadingInitial,
  loadInitialMessages,
  initialIsArchived,
  clearLocalChatState
]);



  useFocusEffect(
    useCallback(() => {
      loadChatData();
    }, [loadChatData]) 
  );
  
  // --- UI LOGIC ---
  useEffect(() => {
    const shouldShow = !isReadOnly && messages.length === 0;
    if (shouldShow !== showHeaderChips) {
        if (messages.length > 0) smoothLayout(); 
        setShowHeaderChips(shouldShow);
    }
  }, [isReadOnly, messages.length, showHeaderChips]);

  // --- HANDLERS ---
  const handleOpenSettings = () => { navigation.navigate('BotSettings', { botId }); };
  const handleViewArchived = () => { navigation.navigate('ArchivedChats', { botId }); };
  
  const handleSend = () => {
    const value = input.trim();
    if (!value || isTyping || isReadOnly) return;
    if (showHeaderChips) { smoothLayout(); setShowHeaderChips(false); }
    sendMessage(value);
    setInput('');
  };

  const onHeaderChipPress = (label: string) => {
    if (showHeaderChips) { smoothLayout(); setShowHeaderChips(false); }
    sendMessage(label);
  };

  const handleArchiveAndStartNew = () => {
    Alert.alert(
      t('chat.newChatTitle'), t('chat.newChatMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('chat.proceed'), style: 'destructive',
          onPress: async () => {
            const newChatId = await archiveAndStartNew();
            if (newChatId) {
              // Update state to force reload with the new ID
              setCurrentChatId(newChatId); 
              setBootstrap(null); // Force bootstrap reload
              setIsReadOnly(false); // New chat is active
            }
          },
        },
      ]
    );
  };
  
  const handleActivateChat = () => {
    Alert.alert(
      t('chat.activateConfirmTitle'), t('chat.activateConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('chat.proceed'),
          onPress: async () => {
            if (!currentChatId) return; 
            try {
              await chatService.setActiveChat(currentChatId);
              setIsReadOnly(false); 
              clearLocalChatState(currentChatId); 
              setBootstrap(null); // Force reload of bootstrap
              // loadChatData will be called by useFocusEffect upon state change if needed,
              // or manually trigger if navigation isn't involved
              loadChatData(); // Explicitly reload after activation
              Alert.alert(t('chat.activateSuccess'));
            } catch (error) {
              console.error("Failed to activate chat:", error);
              Alert.alert("Error", "Could not activate this conversation.");
            }
          },
        },
      ]
    );
  };
  
  const menuItems = useMemo(() => [
    { label: t('chat.menuSettings'), onPress: handleOpenSettings, icon: <Feather name="settings" size={18} color={theme.textPrimary} /> },
    { label: t('chat.menuNewChat'), onPress: handleArchiveAndStartNew, icon: <Feather name="plus-circle" size={18} color={theme.textPrimary} /> },
    { label: t('chat.menuArchivedChats'), onPress: handleViewArchived, icon: <Feather name="archive" size={18} color={theme.textPrimary} /> },
  ], [t, theme.textPrimary, handleArchiveAndStartNew, handleOpenSettings, handleViewArchived, botId]); // Added botId

  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // --- RENDER ---
  
  // Refined Loading State: Show loading if bootstrap is missing OR initial messages are loading for the *first time*
  if (!bootstrap || (isLoadingInitial && !hasLoadedOnce)) { 
    return (
      <SafeAreaView style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ChatHeader 
          title={route.params.botName} 
          subtitle={route.params.botHandle} 
          avatarUrl={route.params.botAvatarUrl}
          onBack={() => navigation.goBack()} 
        />
        <ActivityIndicator size="large" color={theme.brand.normal} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <ChatHeader
        title={bootstrap.bot.name}
        subtitle={bootstrap.bot.handle}
        avatarUrl={bootstrap.bot.avatarUrl}
        onBack={() => navigation.goBack()}
        onMorePress={(anchor) => { setMenuAnchor(anchor); setMenuOpen(true); }}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <FlatList
          inverted
          data={invertedMessages}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => <MessageBubble message={item} onSuggestionPress={(_, label) => sendMessage(label)} />} 
          onEndReached={() => {
              console.log("[ChatScreen] Reached end (top), attempting to load more...");
              loadMoreMessages();
          }}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={isLoadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={theme.brand.normal} /> : null}
          ListFooterComponent={ // Rendered at the top
            <>
              {/* Hero is always shown once bootstrap is loaded */}
              <View style={s.heroContainer}>
                <View style={s.heroAvatarRing}>
                  <Image 
                    source={bootstrap.bot.avatarUrl ? { uri: bootstrap.bot.avatarUrl } : require('../../assets/avatar.png')} 
                    style={s.heroAvatarImage} 
                  />
                </View>
              </View>
              <View style={s.welcomeBubble}>
                <Text style={s.bubbleText}>{bootstrap.welcome}</Text>
              </View>
              
              {/* Suggestions: Show if not read-only, state allows, and bootstrap has them */}
              {showHeaderChips && !isReadOnly && bootstrap.suggestions.length > 0 && (
                <View style={s.chipStack}>
                  {bootstrap.suggestions.map((label, idx) => (
                    <SuggestionChip key={idx} label={label} onPress={() => onHeaderChipPress(label)} />
                  ))}
                </View>
              )}
            </>
          }
          keyboardShouldPersistTaps="handled"
        />
        
        {isTyping && <Text style={{ textAlign: 'center', color: theme.textSecondary, padding: 4 }}>Bot is typing...</Text>}

        {isReadOnly ? (
          <View style={s.activateBanner}>
            <Pressable style={s.activateButton} onPress={handleActivateChat}>
              <Text style={s.activateButtonText}>{t('chat.activateButton')}</Text>
            </Pressable>
          </View>
        ) : (
          <ChatInput
            value={input}
            onChangeText={setInput}
            onSend={handleSend}
            onMic={() => {}} // Placeholder
            onPlus={() => {}} // Placeholder
          />
        )}
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