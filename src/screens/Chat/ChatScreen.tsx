// src/screens/Chat/ChatScreen.tsx
import React, { useCallback, useState, useMemo } from 'react';
import { ActivityIndicator, FlatList, Platform, View, Text, KeyboardAvoidingView, Alert } from 'react-native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';

import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { createChatStyles, getTheme } from './Chat.styles';
import { ChatMessage } from '../../types/chat';
import { useChatController } from '../../contexts/chat/ChatProvider';
import { ActionSheetMenu, type Anchor } from '../../components/chat/ActionSheetMenu';
import type { RootStackParamList } from '../../types/navigation';
import { useFadeSlideIn } from '../../components/shared/Motion';
import { botService } from '../../services/botService'; // Importar o botService
import { ChatBootstrap } from '../../types/chat'; // Importar ChatBootstrap
import { SuggestionChip } from '../../components/chat/SuggestionChip';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>;

const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  // Use a state for chatId to allow it to be updated when a new chat is created
  const { botId } = route.params; 
  const [currentChatId, setCurrentChatId] = useState(route.params.chatId);

  const [bootstrap, setBootstrap] = useState<ChatBootstrap | null>(null);
  
  const { 
    messages, 
    isTyping,
    isLoadingMore,
    isInitialLoad,
    nextPage,
    loadInitialMessages,
    loadMoreMessages,
    sendMessage,
    archiveAndStartNew
  } = useChatController(currentChatId);

  const { t } = useTranslation();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<Anchor>(null);

  // Load initial messages when the screen is focused
  const loadChatData = useCallback(async (chatIdToLoad: string) => {
    // Se o bootstrap ainda não foi carregado, carrega-o
    if (!bootstrap) {
      try {
        const data = await botService.getChatBootstrap(botId);
        setBootstrap(data);
        // Garante que estamos a usar o ID de conversa correto da API
        if (chatIdToLoad !== data.conversationId) {
          setCurrentChatId(data.conversationId);
        }
      } catch (error) {
        console.error("Failed to load bootstrap:", error);
        // Tratar erro, talvez navegar para trás
        return;
      }
    }
    // Carrega as mensagens iniciais para o chat ID atual
    await loadInitialMessages();
  }, [botId, bootstrap, loadInitialMessages]);

  useFocusEffect(
    useCallback(() => {
      loadChatData(currentChatId);
    }, [loadChatData, currentChatId])
  );
  
  // --- Handlers ---

  const handleOpenSettings = () => {
    navigation.navigate('BotSettings', { botId });
  };
  
  const handleSend = () => {
    const value = input.trim();
    if (!value || isTyping) return;
    sendMessage(value);
    setInput('');
  };

  const handleArchiveAndStartNew = () => {
    Alert.alert(
      t('chat.newChatTitle'),
      t('chat.newChatMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('chat.proceed'),
          style: 'destructive',
          onPress: async () => {
            const newChatId = await archiveAndStartNew();
            if (newChatId) {
              // Update the chatId in state to point to the new conversation
              setCurrentChatId(newChatId);
            }
          },
        },
      ]
    );
  };
  
  const handleViewArchived = () => {
    // Assuming botId can be derived or is available. We may need to adjust this.
    // Let's pass botId through navigation params.
    // This is a placeholder; you'll need to get the bot ID associated with the chat.
    // const botId = "123"; // This needs to be dynamic
    // navigation.navigate('ArchivedChats', { botId });
    navigation.navigate('ArchivedChats', { botId });
  };

  const menuItems = useMemo(() => [
    { label: t('chat.menuSettings'), onPress: handleOpenSettings, icon: <Feather name="settings" size={18} color={theme.textPrimary} /> },
    { label: t('chat.menuNewChat'), onPress: handleArchiveAndStartNew, icon: <Feather name="plus-circle" size={18} color={theme.textPrimary} /> },
    { label: t('chat.menuArchivedChats'), onPress: handleViewArchived, icon: <Feather name="archive" size={18} color={theme.textPrimary} /> },
    // Settings menu can be added back here
  ], [t, theme.textPrimary, handleArchiveAndStartNew]);

  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // --- Render ---
  
  const renderHeader = () => (
    isLoadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={theme.brand.normal} /> : null
  );

  if (!bootstrap || (isInitialLoad && messages.length === 0)) {
    return (
      <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.brand.normal} />
      </View>
    );
  }

 return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <ChatHeader
        // Usar os dados do bootstrap
        title={bootstrap.bot.name}
        subtitle={bootstrap.bot.handle}
        avatarUrl={bootstrap.bot.avatarUrl}
        onBack={() => navigation.goBack()}
        onMorePress={(anchor) => { setMenuAnchor(anchor); setMenuOpen(true); }}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        {isInitialLoad && messages.length === 0 ? (
          <ActivityIndicator size="large" color={theme.brand.normal} style={{ flex: 1 }} />
        ) : (
          <FlatList
            inverted // This is key for chat UIs
            data={invertedMessages}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            contentContainerStyle={s.listContent}
            renderItem={({ item }) => <MessageBubble message={item} />}
            onEndReached={() => loadMoreMessages()}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={isLoadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={theme.brand.normal} /> : null}            keyboardShouldPersistTaps="handled"
            ListFooterComponent={ // ListFooterComponent é renderizado no topo quando 'inverted' é true
            <>
              {isLoadingMore && <ActivityIndicator style={{ marginVertical: 16 }} color={theme.brand.normal} />}
              <View style={s.heroContainer}>
                {/* Opcional: mostrar um avatar no início do chat */}
              </View>
              {/* Usar os dados do bootstrap para a mensagem de boas-vindas e sugestões */}
              <View style={s.welcomeBubble}><Text style={s.bubbleText}>{bootstrap.welcome}</Text></View>
              {messages.length === 0 && bootstrap.suggestions.length > 0 && (
                <View style={s.chipStack}>
                  {bootstrap.suggestions.map((label, idx) => (
                    <SuggestionChip key={idx} label={label} onPress={() => sendMessage(label)} />
                  ))}
                </View>
              )}
            </>
          }
           
          />
        )}
        
        {isTyping && <Text style={{ textAlign: 'center', color: theme.textSecondary, padding: 4 }}>Bot is typing...</Text>}

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