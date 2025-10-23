// src/screens/Chat/ChatScreen.tsx
import React, { useCallback, useState, useMemo, useRef } from 'react'; // Remova useEffect se não for mais usado para scrollToRef
import { ActivityIndicator, FlatList, Platform, View, Text, KeyboardAvoidingView, Alert, Image } from 'react-native';
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
// import { useFadeSlideIn } from '../../components/shared/Motion'; // Removido se não for usado
import { botService } from '../../services/botService';
import { ChatBootstrap } from '../../types/chat';
import { SuggestionChip } from '../../components/chat/SuggestionChip';
import { Spacing } from '../../theme/spacing'; // Import Spacing

type Props = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>;

const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
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
  // const flatListRef = useRef<FlatList>(null); // Removido - não precisamos mais do ref para scrollToEnd

  const loadChatData = useCallback(async (chatIdToLoad: string) => {
    if (!bootstrap) {
      try {
        const data = await botService.getChatBootstrap(botId);
        setBootstrap(data);
        if (chatIdToLoad !== data.conversationId) {
          setCurrentChatId(data.conversationId);
        }
      } catch (error) {
        console.error("Failed to load bootstrap:", error);
        return;
      }
    }
    await loadInitialMessages();
  }, [botId, bootstrap, loadInitialMessages]);

  useFocusEffect(
    useCallback(() => {
      loadChatData(currentChatId);
    }, [loadChatData, currentChatId])
  );

  // --- Handlers ---
  const handleOpenSettings = () => navigation.navigate('BotSettings', { botId });
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
            if (newChatId) setCurrentChatId(newChatId);
          },
        },
      ]
    );
  };
  const handleViewArchived = () => navigation.navigate('ArchivedChats', { botId });

  const menuItems = useMemo(() => [
    { label: t('chat.menuSettings'), onPress: handleOpenSettings, icon: <Feather name="settings" size={18} color={theme.textPrimary} /> },
    { label: t('chat.menuNewChat'), onPress: handleArchiveAndStartNew, icon: <Feather name="plus-circle" size={18} color={theme.textPrimary} /> },
    { label: t('chat.menuArchivedChats'), onPress: handleViewArchived, icon: <Feather name="archive" size={18} color={theme.textPrimary} /> },
  ], [t, theme.textPrimary, handleArchiveAndStartNew, handleOpenSettings, handleViewArchived]); // Adicione as dependências que faltavam

  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // --- Renderização ---

  // Componente movido para dentro da função principal para acessar `bootstrap`, `isInitialLoad`, `messages`
  const renderChatListFooter = () => {
    if (!bootstrap) return null; // Não renderiza nada se o bootstrap não carregou

    const showSuggestions = !isInitialLoad && messages.length === 0 && bootstrap.suggestions.length > 0;

    return (
      <>
        {/* Avatar Hero Centralizado */}
        <View style={s.heroContainer}>
          <View style={s.heroAvatarRing}>
            <Image
              source={bootstrap.bot.avatarUrl ? { uri: bootstrap.bot.avatarUrl } : require('../../assets/avatar.png')}
              style={s.heroAvatarImage} // Estilo da imagem (menor que o anel)
            />
          </View>
        </View>

        {/* Mensagem de Boas-Vindas */}
        <View style={s.welcomeBubble}>
            <Text style={s.bubbleText}>{bootstrap.welcome}</Text>
        </View>

        {/* Sugestões Iniciais (Condicionais) */}
        {showSuggestions && (
          <View style={s.chipStack}>
            {bootstrap.suggestions.map((label, idx) => (
              <SuggestionChip
                key={idx}
                label={label}
                onPress={() => sendMessage(label)}
              />
            ))}
          </View>
        )}
      </>
    );
  };

  if (!bootstrap) {
    return (
      <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.brand.normal} />
      </View>
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

      <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // Pode precisar ajustar o offset para iOS
      >
          {/* FlatList é o principal elemento de conteúdo */}
          <FlatList
            // ref={flatListRef} // Removido ref
            inverted // Mantém invertido
            data={invertedMessages} // Usa as mensagens já invertidas pelo useMemo
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            // Ajuste o padding aqui se necessário (especialmente paddingBottom)
            contentContainerStyle={s.listContent}
            renderItem={({ item }) => <MessageBubble message={item} />}
            onEndReached={() => loadMoreMessages()}
            onEndReachedThreshold={0.5}
            // ListHeaderComponent (visual: fundo) é para loading de mensagens antigas
            ListHeaderComponent={isLoadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={theme.brand.normal} /> : null}
            // ListFooterComponent (visual: topo) contém hero, welcome e sugestões
            ListFooterComponent={renderChatListFooter}
            keyboardShouldPersistTaps="handled"
            // Mostra indicador de loading inicial DENTRO da lista se não houver mensagens ainda
            ListEmptyComponent={isInitialLoad ? (
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', transform: [{ scaleY: -1 }] }}> {/* Inverte a escala para compensar o 'inverted' */}
                     <ActivityIndicator size="large" color={theme.brand.normal} />
                </View>
            ) : null} // Não mostra nada se o loading acabou e a lista está vazia
          />

          {/* Indicador 'digitando' e Input abaixo da lista */}
            {isTyping && (
            <View style={{ padding: 4 }}>
              <Text style={{ textAlign: 'center', color: theme.textSecondary }}>
                  Bot is typing...
              </Text>
            </View>
          )}   <ChatInput
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