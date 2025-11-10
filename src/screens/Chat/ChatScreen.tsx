// src/screens/Chat/ChatScreen.tsx
import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import {
  ActivityIndicator, FlatList, Platform, View, Text,
  KeyboardAvoidingView, Alert, Image, Pressable,
} from 'react-native'; // Removido AppState se não usado
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack'; // Import NativeStackNavigationProp
import { Feather } from '@expo/vector-icons';

import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { SuggestionChip } from '../../components/chat/SuggestionChip';
import { createChatStyles, getTheme, ChatTheme } from './Chat.styles';
import { ChatBootstrap, ChatMessage, ChatListItem } from '../../types/chat'; // Import ChatListItem
import { useChatController } from '../../contexts/chat/ChatProvider';
import { ActionSheetMenu, type Anchor } from '../../components/chat/ActionSheetMenu';
import type { RootStackParamList } from '../../types/navigation';
import { botService } from '../../services/botService';
import { chatService } from '../../services/chatService';
import { smoothLayout } from '../../components/shared/Motion';
import { Spacing } from '../../theme/spacing';
import { AttachmentMenu } from '../../components/chat/AttachmentMenu';
import { AttachmentPreview } from '../../components/chat/AttachmentPreview';
import { useAttachmentPicker } from '../../hooks/useAttachmentPicker';
import { AttachmentPickerResult } from '../../services/attachmentService';

type ChatScreenRouteProp = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>['route'];
// Adiciona o tipo para a prop de navegação
type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChatScreen'>;

type ManualBootstrap = {
  conversationId: string;
  bot: { name: string; handle: string; avatarUrl?: string | null };
  welcome: string;
  suggestions: string[];
};

const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  // Usa o tipo correto para navigation
  const navigation = useNavigation<ChatScreenNavigationProp>();

  const {
    botId,
    isArchived: initialIsArchived, // Status *inicial* da rota
    chatId: initialChatId,
    botName,
    botHandle,
    botAvatarUrl
  } = route.params;

  // --- State ---
  const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatId);
  const [bootstrap, setBootstrap] = useState<ChatBootstrap | ManualBootstrap | null>(null);
  // isReadOnly agora reflete o estado ATUAL da tela (pode mudar de true para false)
  const [isReadOnly, setIsReadOnly] = useState(initialIsArchived ?? false);
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<Anchor>(null);
  const [showHeaderChips, setShowHeaderChips] = useState(false);
  const [isScreenLoading, setIsScreenLoading] = useState(true);
  const [isSendingSuggestion, setIsSendingSuggestion] = useState(false);
  const { sendAttachment } = useChatController(currentChatId);
  const { pickImage, pickDocument, takePhoto, isPickerLoading } = useAttachmentPicker();
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<AttachmentPickerResult | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);


  // --- HOOKS ---
  const {
    messages, isTyping, isLoadingMore, isLoadingInitial, hasLoadedOnce,
    loadInitialMessages, loadMoreMessages, sendMessage, archiveAndStartNew, clearLocalChatState,handleCopyMessage,
  handleLikeMessage
  } = useChatController(currentChatId);

  const isFocused = useIsFocused();
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  const initialLoadDoneForCurrentId = useRef<string | null>(null);
  const isLoadingData = useRef(false);

  // --- DATA LOADING ---
  const loadChatData = useCallback(async (isTriggeredByFocusOrActivation: boolean = false) => {
    // --- LÓGICA DE PREVENÇÃO DE LOOP/CARGA ---
    // Se já estiver carregando E não for o gatilho inicial/foco, sai
    if (isLoadingData.current && !isTriggeredByFocusOrActivation) {
        console.log("[ChatScreen] Skipping loadChatData: already loading.");
        return;
    }
     // Se não tem botId, não há o que fazer
    if (!botId) {
        console.log("[ChatScreen] Skipping loadChatData: no botId.");
        setIsScreenLoading(false);
        return;
    }
     // Se é um trigger de foco/ativação E a carga inicial para este ID JÁ FOI FEITA, não faz nada
     if (isTriggeredByFocusOrActivation && initialLoadDoneForCurrentId.current === currentChatId && hasLoadedOnce) {
         console.log(`[ChatScreen] Skipping loadChatData (focus/activation): Initial load already done for ${currentChatId}.`);
         setIsScreenLoading(false); // Garante que o loading para
         return;
     }

    isLoadingData.current = true;
    // Mostra loading apenas se for realmente a primeira carga para este ID
    if (initialLoadDoneForCurrentId.current !== currentChatId) {
        console.log(`[ChatScreen] Setting isScreenLoading to true (initial load for ${currentChatId}).`);
        setIsScreenLoading(true);
    }
    console.log(`[ChatScreen] Starting loadChatData. CurrentChatId: ${currentChatId}, isReadOnly (state): ${isReadOnly}`);


    try {
      // --- LÓGICA DIVIDIDA ---

      // FLUXO 1: Chat ARQUIVADO (Modo Leitura)
      if (isReadOnly) {
        console.log(`[ChatScreen] Loading ARCHIVED chat (ID: ${currentChatId})`);
        // Garante que o ID do estado é o ID arquivado correto
        if (currentChatId !== initialChatId) {
            console.warn(`[ChatScreen] Archived flow: currentChatId (${currentChatId}) differs from initialChatId (${initialChatId}). Forcing initialChatId.`);
            setCurrentChatId(initialChatId); // Força o ID correto para arquivado
             // Retorna para deixar o useEffect reagir à mudança de ID
            isLoadingData.current = false;
            return;
        }

        // Cria bootstrap manual (se ainda não existir ou for do chat errado)
        if (!bootstrap || bootstrap.conversationId !== initialChatId) {
            const manualBootstrap: ManualBootstrap = {
                conversationId: initialChatId,
                bot: { name: botName, handle: botHandle, avatarUrl: botAvatarUrl },
                welcome: t('archivedChats.title'),
                suggestions: []
            };
            setBootstrap(manualBootstrap);
        }

        // Carrega mensagens se for a primeira vez para este ID arquivado
        if (initialLoadDoneForCurrentId.current !== initialChatId && initialChatId) { // Adiciona verificação de initialChatId não nulo
            console.log(`[ChatScreen] Triggering loadInitialMessages for ARCHIVED chat ${initialChatId}`);
            clearLocalChatState(initialChatId); // Limpa estado anterior se houver
            await loadInitialMessages(); // Hook usa currentChatId (que agora é == initialChatId)
            initialLoadDoneForCurrentId.current = initialChatId; // Marca como feito
        }

      // FLUXO 2: Chat ATIVO (Modo Escrita)
      } else {
        console.log(`[ChatScreen] Loading ACTIVE chat for botId: ${botId}`);
        let chatDataToLoad: string | null = null;
        let fetchedBootstrapData: ChatBootstrap | null = null;

        // Busca o bootstrap (que SEMPRE retorna o chat ATIVO)
        console.log("[ChatScreen] Fetching bootstrap for active chat...");
        fetchedBootstrapData = await botService.getChatBootstrap(botId);
        setBootstrap(fetchedBootstrapData); // Atualiza sempre para garantir dados recentes
        chatDataToLoad = fetchedBootstrapData.conversationId;

        // Se o ID do bootstrap for diferente do state ATUAL, atualiza o state
        // Isso é crucial após arquivar/ativar
        if (currentChatId !== chatDataToLoad) {
            console.log(`[ChatScreen] Bootstrap updated chatId from ${currentChatId} to ${chatDataToLoad}`);
            setCurrentChatId(chatDataToLoad); // Dispara re-render e novo useEffect
            initialLoadDoneForCurrentId.current = null; // Reseta flag para o NOVO ID ativo
            isLoadingData.current = false;
            console.log("[ChatScreen] Returning early after setting new active currentChatId from bootstrap.");
            return; // Deixa o useEffect lidar com a nova carga
        }else{
          console.log("[ChatScreen] Bootstrap ID matches currentChatId. No state update needed.");
        }

        // Carrega as mensagens do chat ATIVO se for a primeira vez para este ID
        const needsLoad = chatDataToLoad && initialLoadDoneForCurrentId.current !== chatDataToLoad;
        console.log(`[ChatScreen] Checking active message load: needsLoad=${needsLoad}, chatIdToLoad=${chatDataToLoad}`);
        if (needsLoad && chatDataToLoad) { // Verifica chatDataToLoad novamente
             console.log(`[ChatScreen] Triggering loadInitialMessages for ACTIVE chat ${chatDataToLoad}`);
             clearLocalChatState(chatDataToLoad);
             await loadInitialMessages();
             initialLoadDoneForCurrentId.current = chatDataToLoad; // Marca como feito
        }
      }
      // --- FIM DA DIVISÃO ---

    } catch (error) {
      console.error("[ChatScreen] Failed to load chat data:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados do chat.");
      initialLoadDoneForCurrentId.current = null;
    } finally {
      isLoadingData.current = false;
      // Garante que o loading principal para, independentemente do fluxo
      setIsScreenLoading(false);
      console.log(`[ChatScreen] Finished loadChatData execution. isScreenLoading set to false.`);
    }
  }, [
      // Mantenha as dependências mínimas que REALMENTE mudam a lógica
      botId,
      currentChatId, // O ID que estamos *tentando* ver
      initialChatId, // O ID que veio da rota
      isReadOnly,    // O estado atual de leitura
      initialIsArchived, // O status que veio da rota
      bootstrap,     // Os dados atuais do bootstrap
      botName, botHandle, botAvatarUrl, // Dados da rota para modo arquivado
      loadInitialMessages, clearLocalChatState, // Funções do provider
      t, // Para tradução no bootstrap manual
      // REMOVA hasLoadedOnce daqui, a lógica agora usa initialLoadDoneForCurrentId
      // REMOVA isScreenLoading daqui, ele é gerenciado internamente
  ]);

  // --- Trigger data loading on focus or when currentChatId OR isReadOnly changes ---
  useEffect(() => {
    // Roda quando foca, ou quando o ID ou o status ReadOnly mudam
    if (isFocused) {
      console.log(`[ChatScreen] useEffect [isFocused, currentChatId, isReadOnly] triggered.`);
      loadChatData(true); // Passa true para indicar gatilho de foco/estado
    } else {
      console.log(`[ChatScreen] Screen lost focus. Resetting load flag.`);
      initialLoadDoneForCurrentId.current = null; // Reseta ao desfocar
    }
    // Adiciona isReadOnly como dependência para recarregar se mudar de arquivado para ativo
  }, [isFocused, currentChatId, isReadOnly, loadChatData]);


  // --- UI LOGIC for header chips ---
  useEffect(() => {
    const shouldShow = !!bootstrap && !isReadOnly && messages.length === 0;
    if (shouldShow !== showHeaderChips) {
      if (!shouldShow && showHeaderChips) smoothLayout();
      setShowHeaderChips(shouldShow);
    }
  }, [bootstrap, isReadOnly, messages.length, showHeaderChips]);


  // --- HANDLERS ---
  const handleOpenSettings = () => { navigation.navigate('BotSettings', { botId }); };
  const handleViewArchived = () => { navigation.navigate('ArchivedChats', { botId }); };

  const handlePlusPress = () => {
  if (isReadOnly) return;
  setAttachmentMenuVisible(true);
};

const handleSelectImage = async () => {
  const result = await pickImage();
  if (result) {
    setSelectedAttachment(result);
  }
};

const handleSelectDocument = async () => {
  const result = await pickDocument();
  if (result) {
    setSelectedAttachment(result);
  }
};

const handleTakePhoto = async () => {
  const result = await takePhoto();
  if (result) {
    setSelectedAttachment(result);
  }
};

const handleRemoveAttachment = () => {
  setSelectedAttachment(null);
};



  // --- CORREÇÃO: Botão Voltar ---
 const handleBackPress = () => {
    if (isReadOnly) {
      // Se está vendo um chat arquivado, volta para a lista de arquivados
      console.log("[ChatScreen] Back pressed in read-only mode. Navigating back.");
      navigation.goBack();
    } else {
      // Se está vendo um chat ativo, volta para a tela principal de Chats
      console.log("[ChatScreen] Back pressed in active mode. Navigating to Main Chat list.");
      // Tenta voltar na stack. Se não puder, navega para a tab 'ChatList'.
      if (navigation.canGoBack()) {
         navigation.goBack(); // Volta para ChatList ou Bots se veio de lá
      } else {
         // ---> CORREÇÃO APLICADA AQUI <---
         // Navega para o grupo 'Main' e especifica a tela 'ChatList' *dentro* dele
           navigation.navigate('Main', { screen: 'Chat'});
      }
    }
  };

  // Em ChatScreen.tsx

// ...
const handleSend = useCallback(async () => {
  if (isReadOnly || !currentChatId) return;

  const textToSend = input.trim();
  const attachmentToSend = selectedAttachment; // <-- Salva o anexo atual

  // ✅ CASO 1: Tem anexo selecionado
  if (attachmentToSend) {
    
    // --- INÍCIO DA CORREÇÃO ---
    // Limpa o input e o preview IMEDIATAMENTE
    setSelectedAttachment(null);
    setInput('');
    setIsUploadingAttachment(true);
    // --- FIM DA CORREÇÃO ---

    try {
      // Envia o anexo salvo (attachmentToSend)
      await sendAttachment(attachmentToSend, textToSend);
      // Não limpa o estado aqui, já foi limpo
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível enviar o arquivo');
      // --- INÍCIO DA CORREÇÃO ---
      // Restaura o input e o anexo em caso de erro
      setSelectedAttachment(attachmentToSend);
      setInput(textToSend);
      // --- FIM DA CORREÇÃO ---
    } finally {
      setIsUploadingAttachment(false);
    }
    return;
  }

  // ✅ CASO 2: Apenas texto (sem anexo)
  if (!textToSend) return;

  setInput(''); // <-- Lógica original (correta)
  try {
    await sendMessage(textToSend);
  } catch (error) {
    console.error('[ChatScreen] Failed to send message:', error);
    Alert.alert('Erro', 'Não foi possível enviar a mensagem');
    setInput(textToSend);  // Restaura texto em caso de erro
  }
}, [isReadOnly, currentChatId, input, selectedAttachment, sendMessage, sendAttachment]);
// ...


  const handleSuggestionPress = async (label: string) => { // Marca como async
    // Verifica se já está enviando ou se não deve enviar
    if (isSendingSuggestion || isTyping || isReadOnly || !currentChatId) {
       console.warn(`[ChatScreen] Suggestion send cancelled: isSendingSuggestion=${isSendingSuggestion}, isTyping=${isTyping}, isReadOnly=${isReadOnly}, currentChatId=${currentChatId}`);
       return;
   }
   if (showHeaderChips) { smoothLayout(); setShowHeaderChips(false); }

   setIsSendingSuggestion(true); // ----> ADICIONADO: Inicia o estado de envio <----
   try {
       await sendMessage(label); // ----> ADICIONADO: Aguarda o envio <----
   } finally {
       setIsSendingSuggestion(false); // ----> ADICIONADO: Finaliza o estado de envio (sucesso ou erro) <----
   }
 };

  const handleArchiveAndStartNew = useCallback(() => { /* ... (sem alterações, mas verifica logs) ... */
    if (!currentChatId) { console.warn("[ChatScreen] Cannot archive: currentChatId is null."); return; }
    Alert.alert(
      t('chat.newChatTitle'), t('chat.newChatMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('chat.proceed'), style: 'destructive',
          onPress: async () => {
            console.log(`[ChatScreen] Archiving chat ${currentChatId} and starting new.`);
            setIsScreenLoading(true);
            const newChatId = await archiveAndStartNew();
            if (newChatId) {
              console.log(`[ChatScreen] New chat ID: ${newChatId}. Resetting state for transition.`);
              setBootstrap(null);
              setIsReadOnly(false); // Garante modo escrita
              initialLoadDoneForCurrentId.current = null; // Reseta flag crucialmente
              setCurrentChatId(newChatId); // Dispara useEffect para carregar novo chat
            } else {
              console.error("[ChatScreen] Failed to get new chat ID.");
              setIsScreenLoading(false);
            }
          },
        },
      ]
    );
  }, [currentChatId, archiveAndStartNew, t]);

  // --- CORREÇÃO: Lógica de Ativação e Navegação ---
  const handleActivateChat = useCallback(() => {
    if (!currentChatId) { console.warn("[ChatScreen] Cannot activate: currentChatId is null."); return; }

    Alert.alert(
      t('chat.activateConfirmTitle'), t('chat.activateConfirmMessage'),
      [
         { text: t('common.cancel'), style: 'cancel' },
         {
           text: t('chat.proceed'),
           onPress: async () => {
             console.log(`[ChatScreen] Activating chat ${currentChatId}.`);
             try {
               setIsScreenLoading(true); // Mostra loading

               // 1. Chama API para ativar
               const activatedChat: ChatListItem = await chatService.setActiveChat(currentChatId);
               console.log(`[ChatScreen] Chat ${activatedChat.id} activated successfully via API.`);
               Alert.alert(t('chat.activateSuccess')); // Mostra sucesso antes de navegar

               // 2. USA REPLACE para substituir a TELA ATUAL (arquivada) pela NOVA TELA ATIVA
               // Isso corrige o histórico de navegação para o botão voltar.
               navigation.replace('ChatScreen', {
                  chatId: activatedChat.id, // O ID do chat que AGORA está ativo
                  botId: activatedChat.bot.id,
                  botName: activatedChat.bot.name,
                  botHandle: `@${activatedChat.bot.name}`, // Recria handle (ou pega do backend se disponível)
                  botAvatarUrl: activatedChat.bot.avatar_url,
                  isArchived: false, // Define explicitamente como NÃO arquivado
               });
               // Não precisa chamar loadChatData aqui, o replace vai montar uma nova tela que chamará loadChatData.
               // Não precisa resetar refs ou state aqui, pois a tela será substituída.

             } catch (error) {
               console.error("[ChatScreen] Failed to activate chat:", error);
               Alert.alert("Erro", "Não foi possível ativar esta conversa.");
               setIsScreenLoading(false); // Para loading no erro
             }
           },
         },
      ]
    );
  // Removido loadChatData das dependências, navigation/route.params são estáveis
  }, [currentChatId, t, navigation, botId]); // Adicionado botId se necessário para recriar params
  // --- FIM DA CORREÇÃO ---


  const menuItems = useMemo(() => [
     { label: t('chat.menuSettings'), onPress: handleOpenSettings, icon: <Feather name="settings" size={18} color={theme.textPrimary} /> },
     // Só mostra "Novo Chat" se a conversa atual NÃO for readonly
     ...(!isReadOnly ? [{ label: t('chat.menuNewChat'), onPress: handleArchiveAndStartNew, icon: <Feather name="plus-circle" size={18} color={theme.textPrimary} /> }] : []),
     { label: t('chat.menuArchivedChats'), onPress: handleViewArchived, icon: <Feather name="archive" size={18} color={theme.textPrimary} /> },
  ], [t, theme.textPrimary, handleArchiveAndStartNew, handleOpenSettings, handleViewArchived, botId, isReadOnly]); // Adiciona isReadOnly

  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // --- RENDER ---
  // Loading inicial mais robusto
  if (isScreenLoading || !bootstrap) {
    console.log(`[ChatScreen] Final Loading Check: isScreenLoading=${isScreenLoading}, !bootstrap=${!bootstrap}`);
    return (
      <SafeAreaView style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ChatHeader
          title={botName}
          subtitle={botHandle}
          avatarUrl={botAvatarUrl}
          onBack={handleBackPress} // <<-- USA O NOVO HANDLER AQUI
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
        onBack={handleBackPress} // <<-- USA O NOVO HANDLER AQUI
        onMorePress={(anchor) => { setMenuAnchor(anchor); setMenuOpen(true); }}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <FlatList
          inverted
          data={invertedMessages}
          keyExtractor={(item) => String(item.id)}
          style={{ flex: 1 }}
          contentContainerStyle={[s.listContent, { paddingTop: Spacing['spacing-element-m'] }]}
          renderItem={({ item, index }) => {
    // Adicionar verificação de null
    if (!currentChatId) {
      return null; // ou retornar um placeholder se preferir
    }

    return (
      <MessageBubble
        message={item}
        conversationId={currentChatId} // Agora TypeScript sabe que não é null
        onCopy={handleCopyMessage}
        onLike={handleLikeMessage}
        onSuggestionPress={(messageId, text) => handleSuggestionPress(text)}
        isLastMessage={index === 0}
        isSendingSuggestion={isSendingSuggestion}
      />
    );
  }}
          onEndReached={() => {
            if (!isReadOnly && !isLoadingMore && hasLoadedOnce && messages.length > 0 && bootstrap?.conversationId === currentChatId) {
              console.log("[ChatScreen] Reached end (top), attempting to load more...");
              loadMoreMessages();
            }
          }}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={isLoadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={theme.brand.normal} /> : null}
          ListFooterComponent={
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
                      key={`${currentChatId ?? `bot_${botId}`}-suggestion-${idx}`}
                      label={label}
                      onPress={() => handleSuggestionPress(label)} />
                  ))}
                </View>
              )}
            </>
          }
          keyboardShouldPersistTaps="handled"
extraData={messages.length + (currentChatId ?? 'nullId') + isLoadingMore + isReadOnly + isTyping + hasLoadedOnce+ showHeaderChips + isSendingSuggestion}        />

        {isTyping && <Text style={{ textAlign: 'center', color: theme.textSecondary, padding: 4 }}>Bot está digitando...</Text>}
        {selectedAttachment && (
          <AttachmentPreview
          attachment={selectedAttachment}
          onRemove={handleRemoveAttachment}
          />
          )}
        {isReadOnly ? (
          <View style={s.activateBanner}>
            <Pressable style={s.activateButton} onPress={handleActivateChat}>
              <Text style={s.activateButtonText}>{t('chat.activateButton')}</Text>
            </Pressable>
          </View>
        ) :   (
          <ChatInput
            value={input}
            onChangeText={setInput}
            onSend={handleSend}
            onMic={() => {}}
            onPlus={handlePlusPress}
          />
        )}
      </KeyboardAvoidingView>

      <ActionSheetMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchor={menuAnchor}
        items={menuItems}
      />
      <AttachmentMenu
  visible={attachmentMenuVisible}
  onClose={() => setAttachmentMenuVisible(false)}
  onSelectImage={handleSelectImage}
  onSelectDocument={handleSelectDocument}
  onTakePhoto={handleTakePhoto}
/>
    </SafeAreaView>
  );
};

export default ChatScreen;