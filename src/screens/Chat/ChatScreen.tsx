// src/screens/Chat/ChatScreen.tsx
import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import {
  ActivityIndicator, FlatList, Platform, View, Text,
  KeyboardAvoidingView, Alert, Image, Pressable, AppState, // Import AppState
} from 'react-native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation, useRoute, useIsFocused } from '@react-navigation/native'; // Import useIsFocused
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';

import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { SuggestionChip } from '../../components/chat/SuggestionChip';
import { createChatStyles, getTheme, ChatTheme } from './Chat.styles'; // Import ChatTheme
import { ChatBootstrap, ChatMessage } from '../../types/chat';
import { useChatController } from '../../contexts/chat/ChatProvider';
import { ActionSheetMenu, type Anchor } from '../../components/chat/ActionSheetMenu';
import type { RootStackParamList } from '../../types/navigation';
import { botService } from '../../services/botService';
import { chatService } from '../../services/chatService';
import { smoothLayout } from '../../components/shared/Motion';
import { Spacing } from '../../theme/spacing'; // Import Spacing

type ChatScreenRouteProp = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>['route'];

const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<NativeStackScreenProps<RootStackParamList, 'ChatScreen'>['navigation']>();

  const { botId, isArchived: initialIsArchived, chatId: initialChatId } = route.params;

  // --- State ---
  const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatId);
  const [bootstrap, setBootstrap] = useState<ChatBootstrap | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(initialIsArchived ?? false);
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<Anchor>(null);
  const [showHeaderChips, setShowHeaderChips] = useState(false); // Default to false
  const [isScreenLoading, setIsScreenLoading] = useState(true); // New state for initial loading indicator

  // --- HOOKS ---
  const {
    messages,
    isTyping,
    isLoadingMore,
    isLoadingInitial,
    hasLoadedOnce, // Usaremos este do provider
    loadInitialMessages,
    loadMoreMessages,
    sendMessage,
    archiveAndStartNew,
    clearLocalChatState
  } = useChatController(currentChatId); // Pass state chatId

  const isFocused = useIsFocused(); // Track if the screen is focused

  const { t } = useTranslation();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  // Ref para controlar se o carregamento inicial JÁ FOI FEITO para o currentChatId
  const initialLoadDoneForCurrentId = useRef<string | null>(null);
  // Ref para evitar cargas concorrentes
  const isLoadingData = useRef(false);

  // --- DATA LOADING ---
  const loadChatData = useCallback(async (isTriggeredByFocus: boolean = false) => {
    if (isLoadingData.current) {
        console.log("[ChatScreen] Skipping loadChatData: already loading.");
        return;
    }
    if (!botId) {
        console.log("[ChatScreen] Skipping loadChatData: no botId.");
        setIsScreenLoading(false);
        return;
    }

    isLoadingData.current = true;
    if (initialLoadDoneForCurrentId.current !== currentChatId || (isTriggeredByFocus && !hasLoadedOnce)) {
        console.log("[ChatScreen] Setting isScreenLoading to true.");
        setIsScreenLoading(true);
    }
    console.log(`[ChatScreen] Starting loadChatData. CurrentChatId: ${currentChatId}, isTriggeredByFocus: ${isTriggeredByFocus}, initialLoadDoneRef: ${initialLoadDoneForCurrentId.current}`);

    try {
      let chatDataToLoad: string | null = currentChatId; // Explicitamente tipo string | null
      let fetchedBootstrapData: ChatBootstrap | null = null;

      // 1. Fetch bootstrap SEMPRE que não existir ou o chatId mudou
      if (!bootstrap || (currentChatId && currentChatId !== bootstrap.conversationId)) {
        console.log("[ChatScreen] Fetching bootstrap...");
        fetchedBootstrapData = await botService.getChatBootstrap(botId);
        setBootstrap(fetchedBootstrapData);

        if (currentChatId !== fetchedBootstrapData.conversationId) {
          console.log(`[ChatScreen] Bootstrap ID mismatch. Updating currentChatId from ${currentChatId} to ${fetchedBootstrapData.conversationId}`);
          setCurrentChatId(fetchedBootstrapData.conversationId);
          initialLoadDoneForCurrentId.current = null;
          isLoadingData.current = false;
          console.log("[ChatScreen] Returning early after setting new currentChatId from bootstrap.");
          return; // Sai da função atual, a mudança de estado vai reativar o useEffect
        } else {
            chatDataToLoad = currentChatId;
            console.log("[ChatScreen] Bootstrap ID matches currentChatId.");
        }
      } else {
        fetchedBootstrapData = bootstrap;
        chatDataToLoad = currentChatId;
        console.log("[ChatScreen] Using existing bootstrap.");
      }

      // 2. Load initial messages APENAS se temos um ID e NUNCA foi carregado para ESTE ID
      // Usa hasLoadedOnce do provider como verificação principal se o ID não mudou
      const needsLoad = chatDataToLoad && initialLoadDoneForCurrentId.current !== chatDataToLoad;
      console.log(`[ChatScreen] Checking message load conditions: chatDataToLoad=${chatDataToLoad}, initialLoadDoneRef=${initialLoadDoneForCurrentId.current}, NeedsLoad=${needsLoad}`);

      if (needsLoad) {
           console.log(`[ChatScreen] Triggering loadInitialMessages for ${chatDataToLoad}`);
           // ---> CORREÇÃO VERIFICA SE chatDataToLoad NÃO É NULL <---
           if (chatDataToLoad) { // Garante que só limpa/carrega se tiver um ID válido
                clearLocalChatState(chatDataToLoad); // Limpa cache ANTES de carregar
                await loadInitialMessages(); // Hook usa o state currentChatId
                // Marca que a carga foi feita para este ID APÓS a conclusão
                initialLoadDoneForCurrentId.current = chatDataToLoad;
                console.log(`[ChatScreen] Marked initial load attempt trigger/done for ${chatDataToLoad}.`);
           } else {
                console.warn("[ChatScreen] Tried to load messages but chatDataToLoad was nullish unexpectedly.");
                // Se não devia ser nulo aqui, pode indicar outro problema
           }
           // ---> FIM DA CORREÇÃO <---
      } else {
          console.log(`[ChatScreen] Skipping loadInitialMessages (already loaded for this ID or no ID).`);
          if (isScreenLoading) setIsScreenLoading(false); // Garante que loading para se pulou a carga
      }

      setIsReadOnly(initialIsArchived ?? false);

    } catch (error) {
      console.error("[ChatScreen] Failed to load chat data:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados do chat.");
      initialLoadDoneForCurrentId.current = null; // Permite tentar de novo em caso de erro
    } finally {
      isLoadingData.current = false;
      // Desliga loading apenas se a carga inicial para o ID atual foi marcada como feita
      if (initialLoadDoneForCurrentId.current === currentChatId || !currentChatId) {
           setIsScreenLoading(false);
      }
      console.log("[ChatScreen] Finished loadChatData execution.");
    }
  }, [
      botId,
      currentChatId,
      bootstrap,
      loadInitialMessages,
      clearLocalChatState,
      initialIsArchived,
      isScreenLoading,
      hasLoadedOnce // Adicionado hasLoadedOnce aqui também
  ]);

  // --- Trigger data loading on focus or when currentChatId changes ---
  useEffect(() => {
    // Roda sempre que a tela foca OU o currentChatId muda
    if (isFocused) {
      console.log(`[ChatScreen] useEffect [isFocused, currentChatId] triggered. isFocused: ${isFocused}, currentChatId: ${currentChatId}`);
      // Passa 'true' para indicar que é um gatilho de foco/montagem
      loadChatData(true);
    } else {
      // Quando desfoca, reseta a flag para forçar recarga na próxima vez que focar
      console.log(`[ChatScreen] Screen lost focus. Resetting initialLoadDoneForCurrentId.`);
      initialLoadDoneForCurrentId.current = null;
    }
  }, [isFocused, currentChatId, loadChatData]); // Depende do foco, chatId e da função memoizada loadChatData


  // --- UI LOGIC for header chips ---
  useEffect(() => {
    const shouldShow = !!bootstrap && !isReadOnly && messages.length === 0;
    if (shouldShow !== showHeaderChips) {
      if (!shouldShow && showHeaderChips) smoothLayout();
      setShowHeaderChips(shouldShow);
      console.log(`[ChatScreen] Setting showHeaderChips to ${shouldShow}. Messages: ${messages.length}`);
    }
  }, [bootstrap, isReadOnly, messages.length, showHeaderChips]);


  // --- HANDLERS ---
  const handleOpenSettings = () => { navigation.navigate('BotSettings', { botId }); };
  const handleViewArchived = () => { navigation.navigate('ArchivedChats', { botId }); };

  // Verifica currentChatId antes de chamar sendMessage
  const handleSend = () => {
    const value = input.trim();
    if (!value || isTyping || isReadOnly || !currentChatId) { // <<-- Verificação aqui
        console.warn(`[ChatScreen] Send cancelled: value=${!!value}, isTyping=${isTyping}, isReadOnly=${isReadOnly}, currentChatId=${currentChatId}`);
        return;
    }
    console.log(`[ChatScreen] Sending message: "${value}" for chatId: ${currentChatId}`);
    if (showHeaderChips) { smoothLayout(); setShowHeaderChips(false); }
    sendMessage(value); // sendMessage do hook já lida com o ID interno
    setInput('');
  };

  // Verifica currentChatId antes de chamar sendMessage
  const onHeaderChipPress = (label: string) => {
    if (isTyping || isReadOnly || !currentChatId) { // <<-- Verificação aqui
        console.warn(`[ChatScreen] Suggestion send cancelled: isTyping=${isTyping}, isReadOnly=${isReadOnly}, currentChatId=${currentChatId}`);
        return;
    }
    console.log(`[ChatScreen] Sending suggestion: "${label}" for chatId: ${currentChatId}`);
    if (showHeaderChips) { smoothLayout(); setShowHeaderChips(false); }
    sendMessage(label); // sendMessage do hook já lida com o ID interno
  };

  // Envolve em useCallback e verifica currentChatId
  const handleArchiveAndStartNew = useCallback(() => {
    // ---> CORREÇÃO: VERIFICA SE currentChatId NÃO É NULL ANTES DE USAR <---
    if (!currentChatId) {
        console.warn("[ChatScreen] Cannot archive: currentChatId is null.");
        return;
    }
    // ---> FIM DA CORREÇÃO <---
    Alert.alert(
      t('chat.newChatTitle'), t('chat.newChatMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('chat.proceed'), style: 'destructive',
          onPress: async () => {
            console.log(`[ChatScreen] Archiving chat ${currentChatId} and starting new.`); // Agora seguro usar currentChatId
            const newChatId = await archiveAndStartNew();
            if (newChatId) {
              console.log(`[ChatScreen] New chat ID: ${newChatId}. Resetting state for transition.`);
              setBootstrap(null);
              setIsReadOnly(false);
              initialLoadDoneForCurrentId.current = null;
              setCurrentChatId(newChatId);
            } else { console.error("[ChatScreen] Failed to get new chat ID."); }
          },
        },
      ]
    );
  }, [currentChatId, archiveAndStartNew, t]);

  // Envolve em useCallback e verifica currentChatId
  const handleActivateChat = useCallback(() => {
    // ---> CORREÇÃO: VERIFICA SE currentChatId NÃO É NULL ANTES DE USAR <---
    if (!currentChatId) {
        console.warn("[ChatScreen] Cannot activate: currentChatId is null.");
        return;
    }
    // ---> FIM DA CORREÇÃO <---
    Alert.alert(
      t('chat.activateConfirmTitle'), t('chat.activateConfirmMessage'),
      [
         { text: t('common.cancel'), style: 'cancel' },
         {
           text: t('chat.proceed'),
           onPress: async () => {
             console.log(`[ChatScreen] Activating chat ${currentChatId}.`); // Agora seguro usar currentChatId
             try {
               setIsScreenLoading(true);
               await chatService.setActiveChat(currentChatId); // Passa o ID verificado
               console.log(`[ChatScreen] Chat ${currentChatId} activated.`);
               setIsReadOnly(false);
               setBootstrap(null);
               initialLoadDoneForCurrentId.current = null;
               loadChatData(true);
               Alert.alert(t('chat.activateSuccess'));
             } catch (error) {
               console.error("[ChatScreen] Failed to activate chat:", error);
               Alert.alert("Erro", "Não foi possível ativar esta conversa.");
               setIsScreenLoading(false);
             }
           },
         },
      ]
    );
  }, [currentChatId, t, loadChatData]); // loadChatData está estável


  const menuItems = useMemo(() => [
     { label: t('chat.menuSettings'), onPress: handleOpenSettings, icon: <Feather name="settings" size={18} color={theme.textPrimary} /> },
     { label: t('chat.menuNewChat'), onPress: handleArchiveAndStartNew, icon: <Feather name="plus-circle" size={18} color={theme.textPrimary} /> },
     { label: t('chat.menuArchivedChats'), onPress: handleViewArchived, icon: <Feather name="archive" size={18} color={theme.textPrimary} /> },
  ], [t, theme.textPrimary, handleArchiveAndStartNew, handleOpenSettings, handleViewArchived, botId]);

  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // --- RENDER ---
  // Loading inicial
  if (isScreenLoading || !bootstrap || (currentChatId && initialLoadDoneForCurrentId.current !== currentChatId)) {
      console.log(`[ChatScreen] Showing Loading Indicator: isScreenLoading=${isScreenLoading}, !bootstrap=${!bootstrap}, initialLoadDoneRef=${initialLoadDoneForCurrentId.current}, currentChatId=${currentChatId}`);
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

  // Renderização principal
  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <ChatHeader
        title={bootstrap.bot.name}
        subtitle={bootstrap.bot.handle}
        avatarUrl={bootstrap.bot.avatarUrl}
        onBack={() => navigation.goBack()}
        onMorePress={(anchor) => { setMenuAnchor(anchor); setMenuOpen(true); }}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <FlatList
          inverted
          data={invertedMessages}
          keyExtractor={(item) => String(item.id)} // Garante string
          style={{ flex: 1 }}
          contentContainerStyle={[s.listContent, { paddingTop: Spacing['spacing-element-m'] }]}
          renderItem={({ item }) => <MessageBubble message={item} onSuggestionPress={(_, label) => onHeaderChipPress(label)} />}
          onEndReached={() => {
            if (!isReadOnly && !isLoadingMore && hasLoadedOnce && messages.length > 0 && bootstrap?.conversationId === currentChatId) {
              console.log("[ChatScreen] Reached end (top), attempting to load more...");
              loadMoreMessages();
            } else {
                 console.log(`[ChatScreen] Skipping onEndReached: ReadOnly=${isReadOnly}, LoadingMore=${isLoadingMore}, HasLoaded=${hasLoadedOnce}, MsgCount=${messages.length}, ID Match=${bootstrap?.conversationId === currentChatId}`);
            }
          }}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={isLoadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={theme.brand.normal} /> : null}
          ListFooterComponent={ // Visualmente no topo
            <>
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
              {showHeaderChips && !isReadOnly && bootstrap.suggestions.length > 0 && (
                <View style={s.chipStack}>
                  {bootstrap.suggestions.map((label, idx) => (
                    <SuggestionChip
                      // ---> CORREÇÃO: Usa botId se currentChatId for null <---
                      key={`${currentChatId ?? `bot_${botId}`}-suggestion-${idx}`}
                      label={label}
                      onPress={() => onHeaderChipPress(label)} />
                  ))}
                </View>
              )}
            </>
          }
          keyboardShouldPersistTaps="handled"
          extraData={messages.length + currentChatId + isLoadingMore + isReadOnly + isTyping + hasLoadedOnce}
        />

        {isTyping && <Text style={{ textAlign: 'center', color: theme.textSecondary, padding: 4 }}>Bot está digitando...</Text>}

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
            onMic={() => {}}
            onPlus={() => {}}
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