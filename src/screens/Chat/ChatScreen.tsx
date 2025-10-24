// src/screens/Chat/ChatScreen.tsx
import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { ActivityIndicator, FlatList, Platform, View, Text, KeyboardAvoidingView, Alert, Image, Pressable } from 'react-native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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

type Props = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>;

const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  // --- STATE AND PARAMS ---
  const { botId, isArchived: initialIsArchived } = route.params;
  const [currentChatId, setCurrentChatId] = useState(route.params.chatId);
  const [bootstrap, setBootstrap] = useState<ChatBootstrap | null>(null);
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<Anchor>(null);
  
  // --- CORREÇÃO: Readicionado o estado para controlar os chips de sugestão ---
  const [showHeaderChips, setShowHeaderChips] = useState(true);
  
  const [isReadOnly, setIsReadOnly] = useState(initialIsArchived ?? false);

  // --- HOOKS ---
  const { 
    messages, 
    isTyping,
    isLoadingMore,
    isInitialLoad,
    loadInitialMessages,
    loadMoreMessages,
    sendMessage,
    archiveAndStartNew
  } = useChatController(currentChatId);

  const { t } = useTranslation();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  // --- DATA LOADING ---
  const loadChatData = useCallback(async () => {
    try {
      if (!bootstrap || currentChatId !== bootstrap.conversationId) {
        const data = await botService.getChatBootstrap(botId);
        setBootstrap(data);
        if (currentChatId !== data.conversationId) {
          setCurrentChatId(data.conversationId);
        }
      }
      await loadInitialMessages();
    } catch (error) {
      console.error("Failed to load chat data:", error);
      Alert.alert("Error", "Could not load chat data. Please go back and try again.");
    }
  }, [botId, bootstrap, loadInitialMessages, currentChatId]);

  useFocusEffect(
    useCallback(() => {
      // Quando o ecrã foca, garante que voltamos ao modo não-leitura se viemos de um arquivo
      // e o chatId pode ter sido atualizado pela ativação
      setIsReadOnly(initialIsArchived ?? false); 
      loadChatData();
    }, [loadChatData, initialIsArchived]) // Executa se loadChatData ou initialIsArchived mudar
  );
  
  // --- UI LOGIC ---
  useEffect(() => {
    if (isReadOnly) {
      setShowHeaderChips(false);
    } else {
        // Quando não está em modo leitura, resetar o showHeaderChips se não houver mensagens
        setShowHeaderChips(messages.length === 0);
    }
  }, [isReadOnly, messages.length]); // Reavalia quando o modo leitura ou as mensagens mudam

  useEffect(() => {
    if (!isReadOnly && messages.length > 0 && showHeaderChips) {
      smoothLayout();
      setShowHeaderChips(false);
    }
  }, [messages.length, showHeaderChips, isReadOnly]);

  // --- HANDLERS ---
  
  const handleOpenSettings = () => {
    navigation.navigate('BotSettings', { botId });
  };
  
  const handleSend = () => {
    const value = input.trim();
    if (!value || isTyping || isReadOnly) return;
    
    if (showHeaderChips) {
      smoothLayout();
      setShowHeaderChips(false);
    }
    sendMessage(value);
    setInput('');
  };

  // --- CORREÇÃO: Readicionada a função para os chips de sugestão ---
  const onHeaderChipPress = (label: string) => {
    if (showHeaderChips) {
      smoothLayout();
      setShowHeaderChips(false);
    }
    sendMessage(label);
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
              setCurrentChatId(newChatId);
              setBootstrap(null); // Force bootstrap to reload for the new chat
              setIsReadOnly(false); // New chat is never read-only
              setShowHeaderChips(true); // Show chips for the new chat
            }
          },
        },
      ]
    );
  };
  
  const handleViewArchived = () => {
    navigation.navigate('ArchivedChats', { botId });
  };

  const handleActivateChat = () => {
    Alert.alert(
      t('chat.activateConfirmTitle'),
      t('chat.activateConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('chat.proceed'),
          onPress: async () => {
            try {
              await chatService.setActiveChat(currentChatId);
              setIsReadOnly(false); // Desativa o modo leitura
              // Força o recarregamento do bootstrap para garantir que temos o ID correto (embora deva ser o mesmo)
              setBootstrap(null); 
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
  ], [t, theme.textPrimary, handleArchiveAndStartNew, handleOpenSettings, handleViewArchived]);

  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // --- RENDER ---

  if (!bootstrap) {
    return (
      <SafeAreaView style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ChatHeader title={route.params.botName} subtitle={route.params.botHandle} onBack={() => navigation.goBack()} />
        <ActivityIndicator size="large" color={theme.brand.normal} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  // Determina se o conteúdo inicial (Hero, sugestões) deve ser mostrado
  // Mostra se (estiver em modo leitura E não houver mensagens) OU se (NÃO estiver em modo leitura E showHeaderChips for true E não houver mensagens)
  const shouldShowInitialContent = (isReadOnly && messages.length === 0) || (!isReadOnly && showHeaderChips && messages.length === 0);

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
          onEndReached={() => loadMoreMessages()}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={isLoadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={theme.brand.normal} /> : null}
          
          ListFooterComponent={
            <>
              {/* O Hero (avatar + welcome) é sempre mostrado, a menos que esteja a carregar inicialmente */}
              {!(isInitialLoad && messages.length === 0) && (
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
                </>
              )}
              
              {/* Sugestões são mostradas se shouldShowInitialContent for verdadeiro */}
              {shouldShowInitialContent && bootstrap.suggestions.length > 0 && (
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