// src/screens/Chat/ChatScreen.tsx

import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  View,
  Text,
  KeyboardAvoidingView,
  Alert,
  Image,
  Pressable,
  ScrollView
} from 'react-native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { SuggestionChip } from '../../components/chat/SuggestionChip';
import { createChatStyles, getTheme, ChatTheme } from './Chat.styles';
import { ChatBootstrap, ChatMessage, ChatListItem } from '../../types/chat';
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
import { useAudioRecorder } from '../../hooks/useAudioRecorder';

type ChatScreenRouteProp = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>['route'];
type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChatScreen'>;

type ManualBootstrap = {
  conversationId: string;
  bot: { name: string; handle: string; avatarUrl?: string | null };
  welcome: string;
  suggestions: string[];
};

const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<ChatScreenNavigationProp>();

  const {
    botId,
    isArchived: initialIsArchived,
    chatId: initialChatId,
    botName,
    botHandle,
    botAvatarUrl
  } = route.params;

  // --- State ---
  const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatId);
  const [bootstrap, setBootstrap] = useState<ChatBootstrap | ManualBootstrap | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(initialIsArchived ?? false);
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<Anchor>(null);
  const [showHeaderChips, setShowHeaderChips] = useState(false);
  const [isScreenLoading, setIsScreenLoading] = useState(true);
  const [isSendingSuggestion, setIsSendingSuggestion] = useState(false);
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<AttachmentPickerResult[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // --- Audio Recording Hook ---
  const audioRecorder = useAudioRecorder();

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
    clearLocalChatState,
    sendAttachment,
    handleCopyMessage,
    handleLikeMessage
  } = useChatController(currentChatId);

  const { pickImage, pickDocument, takePhoto, isPickerLoading } = useAttachmentPicker();
  const isFocused = useIsFocused();
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  const initialLoadDoneForCurrentId = useRef<string | null>(null);
  const isLoadingData = useRef(false);

  // --- DATA LOADING ---
  const loadChatData = useCallback(async (isTriggeredByFocusOrActivation: boolean = false) => {
    if (isLoadingData.current && !isTriggeredByFocusOrActivation) {
      console.log("[ChatScreen] Skipping loadChatData: already loading.");
      return;
    }

    if (!botId) {
      console.log("[ChatScreen] Skipping loadChatData: no botId.");
      setIsScreenLoading(false);
      return;
    }

    if (isTriggeredByFocusOrActivation && initialLoadDoneForCurrentId.current === currentChatId && hasLoadedOnce) {
      console.log(`[ChatScreen] Skipping loadChatData (focus/activation): Initial load already done for ${currentChatId}.`);
      setIsScreenLoading(false);
      return;
    }

    isLoadingData.current = true;
    if (initialLoadDoneForCurrentId.current !== currentChatId) {
      console.log(`[ChatScreen] Setting isScreenLoading to true (initial load for ${currentChatId}).`);
      setIsScreenLoading(true);
    }
    console.log(`[ChatScreen] Starting loadChatData. CurrentChatId: ${currentChatId}, isReadOnly (state): ${isReadOnly}`);

    try {
      // FLUXO 1: Chat ARQUIVADO (Modo Leitura)
      if (isReadOnly) {
        console.log(`[ChatScreen] Loading ARCHIVED chat (ID: ${currentChatId})`);
        if (currentChatId !== initialChatId) {
          console.warn(`[ChatScreen] Archived flow: currentChatId (${currentChatId}) differs from initialChatId (${initialChatId}). Forcing initialChatId.`);
          setCurrentChatId(initialChatId);
          isLoadingData.current = false;
          return;
        }

        if (!bootstrap || bootstrap.conversationId !== initialChatId) {
          const manualBootstrap: ManualBootstrap = {
            conversationId: initialChatId,
            bot: { name: botName, handle: botHandle, avatarUrl: botAvatarUrl },
            welcome: t('archivedChats.title'),
            suggestions: []
          };
          setBootstrap(manualBootstrap);
        }

        if (initialLoadDoneForCurrentId.current !== initialChatId && initialChatId) {
          console.log(`[ChatScreen] Triggering loadInitialMessages for ARCHIVED chat ${initialChatId}`);
          clearLocalChatState(initialChatId);
          await loadInitialMessages();
          initialLoadDoneForCurrentId.current = initialChatId;
        }

        // FLUXO 2: Chat ATIVO (Modo Escrita)
      } else {
        console.log(`[ChatScreen] Loading ACTIVE chat for botId: ${botId}`);
        let chatDataToLoad: string | null = null;
        let fetchedBootstrapData: ChatBootstrap | null = null;

        console.log("[ChatScreen] Fetching bootstrap for active chat...");
        fetchedBootstrapData = await botService.getChatBootstrap(botId);
        setBootstrap(fetchedBootstrapData);
        chatDataToLoad = fetchedBootstrapData.conversationId;

        if (currentChatId !== chatDataToLoad) {
          console.log(`[ChatScreen] Bootstrap updated chatId from ${currentChatId} to ${chatDataToLoad}`);
          setCurrentChatId(chatDataToLoad);
          initialLoadDoneForCurrentId.current = null;
          isLoadingData.current = false;
          console.log("[ChatScreen] Returning early after setting new active currentChatId from bootstrap.");
          return;
        } else {
          console.log("[ChatScreen] Bootstrap ID matches currentChatId. No state update needed.");
        }

        const needsLoad = chatDataToLoad && initialLoadDoneForCurrentId.current !== chatDataToLoad;
        console.log(`[ChatScreen] Checking active message load: needsLoad=${needsLoad}, chatIdToLoad=${chatDataToLoad}`);
        if (needsLoad && chatDataToLoad) {
          console.log(`[ChatScreen] Triggering loadInitialMessages for ACTIVE chat ${chatDataToLoad}`);
          clearLocalChatState(chatDataToLoad);
          await loadInitialMessages();
          initialLoadDoneForCurrentId.current = chatDataToLoad;
        }
      }

    } catch (error) {
      console.error("[ChatScreen] Failed to load chat data:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados do chat.");
      initialLoadDoneForCurrentId.current = null;
    } finally {
      isLoadingData.current = false;
      setIsScreenLoading(false);
      console.log(`[ChatScreen] Finished loadChatData execution. isScreenLoading set to false.`);
    }
  }, [
    botId,
    currentChatId,
    initialChatId,
    isReadOnly,
    initialIsArchived,
    bootstrap,
    botName,
    botHandle,
    botAvatarUrl,
    loadInitialMessages,
    clearLocalChatState,
    t,
  ]);

  // --- Trigger data loading on focus or when currentChatId OR isReadOnly changes ---
  useEffect(() => {
    if (isFocused) {
      console.log(`[ChatScreen] useEffect [isFocused, currentChatId, isReadOnly] triggered.`);
      loadChatData(true);
    } else {
      console.log(`[ChatScreen] Screen lost focus. Resetting load flag.`);
      initialLoadDoneForCurrentId.current = null;
    }
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
  const handleOpenSettings = () => {
    navigation.navigate('BotSettings', { botId });
  };

  const handleViewArchived = () => {
    navigation.navigate('ArchivedChats', { botId });
  };

  const handlePlusPress = () => {
    if (isReadOnly) return;
    setAttachmentMenuVisible(true);
  };

  const handleSelectImage = async () => {
    const result = await pickImage(); // Retorna array ou null
    if (result) {
      setSelectedAttachments(prev => [...prev, ...result]); // Adiciona ao array
    }
  };

  const handleSelectDocument = async () => {
    const result = await pickDocument(); // Retorna array ou null
    if (result) {
      setSelectedAttachments(prev => [...prev, ...result]); // Adiciona ao array
    }
  };

  const handleTakePhoto = async () => {
    const result = await takePhoto(); // Retorna array de 1 item ou null
    if (result) {
      setSelectedAttachments(prev => [...prev, ...result]); // Adiciona ao array
    }
  };

  const handleRemoveAttachment = (uriToRemove: string) => {
    setSelectedAttachments(prev => prev.filter(att => att.uri !== uriToRemove));
  };

  // Handler para iniciar gravação
  const handleStartRecording = useCallback(async () => {
    console.log('[ChatScreen] Iniciando gravação de áudio...');
    const success = await audioRecorder.startRecording();

    if (!success) {
      Alert.alert(
        t('error', { defaultValue: 'Erro' }),
        t('chat.recordingPermissionDenied', {
          defaultValue: 'É necessária permissão do microfone para gravar áudio.'
        })
      );
    }
  }, [audioRecorder, t]);

  // Handler para parar gravação e transcrever
  const handleStopRecording = useCallback(async () => {
    if (!currentChatId) return;

    console.log('[ChatScreen] Parando gravação e iniciando transcrição...');

    const audioUri = await audioRecorder.stopRecording();

    if (!audioUri) {
      Alert.alert(
        t('error', { defaultValue: 'Erro' }),
        t('chat.recordingFailed', { defaultValue: 'Falha ao salvar a gravação de áudio.' })
      );
      return;
    }

    // Inicia transcrição
    setIsTranscribing(true);

    try {
      console.log('[ChatScreen] Transcrevendo áudio...', audioUri);
      const transcription = await chatService.transcribeAudio(currentChatId, audioUri);

      console.log('[ChatScreen] Transcrição recebida:', transcription);

      // Coloca o texto transcrito no campo de input para o usuário editar
      setInput(transcription);
    } catch (error) {
      console.error('[ChatScreen] Erro ao transcrever áudio:', error);
      Alert.alert(
        t('error', { defaultValue: 'Erro' }),
        t('chat.transcriptionFailed', {
          defaultValue: 'Falha ao transcrever áudio. Por favor, tente novamente.'
        })
      );
    } finally {
      setIsTranscribing(false);
    }
  }, [audioRecorder, currentChatId, t]);

  const handleBackPress = () => {
    if (isReadOnly) {
      console.log("[ChatScreen] Back pressed in read-only mode. Navigating back.");
      navigation.goBack();
    } else {
      console.log("[ChatScreen] Back pressed in active mode. Navigating to Main Chat list.");
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Main', { screen: 'Chat' });
      }
    }
  };

  const handleSend = useCallback(async () => {
    if (isReadOnly || !currentChatId) return;

    const textToSend = input.trim();
    const attachmentsToSend = selectedAttachments;

    // Se não há nem texto nem anexos, não faz nada
    if (attachmentsToSend.length === 0 && !textToSend) {
      return;
    }

    // Limpa a UI
    setSelectedAttachments([]);
    setInput('');
    setIsUploadingAttachment(true); // Usamos este loading para todo o processo

    try {
      // ETAPA 1: Enviar todos os anexos, um por um
      for (const attachment of attachmentsToSend) {
        console.log(`[ChatScreen] Enviando anexo: ${attachment.name}`);
        // O sendAttachment agora só envia o arquivo e espera o "OK"
        await sendAttachment(attachment);
      }

      // ETAPA 2: Enviar a mensagem de texto (que vai disparar a IA)
      // Enviamos o texto mesmo que esteja vazio,
      // se tivermos enviado anexos, para que a IA possa processá-los.
      if (textToSend || attachmentsToSend.length > 0) {
        console.log(`[ChatScreen] Enviando prompt de texto para disparar IA: "${textToSend}"`);
        await sendMessage(textToSend);
      }

    } catch (error: any) {
      Alert.alert('Erro no Envio', error.message || 'Não foi possível enviar a mensagem ou anexos.');
      // Restaura a UI em caso de falha
      setSelectedAttachments(attachmentsToSend);
      setInput(textToSend);
    } finally {
      setIsUploadingAttachment(false);
    }
  }, [isReadOnly, currentChatId, input, selectedAttachments, sendMessage, sendAttachment]);

  const handleSuggestionPress = async (label: string) => {
    if (isSendingSuggestion || isTyping || isReadOnly || !currentChatId) {
      console.warn(`[ChatScreen] Suggestion send cancelled: isSendingSuggestion=${isSendingSuggestion}, isTyping=${isTyping}, isReadOnly=${isReadOnly}, currentChatId=${currentChatId}`);
      return;
    }
    if (showHeaderChips) {
      smoothLayout();
      setShowHeaderChips(false);
    }

    setIsSendingSuggestion(true);
    try {
      await sendMessage(label);
    } finally {
      setIsSendingSuggestion(false);
    }
  };

  const handleArchiveAndStartNew = useCallback(() => {
    if (!currentChatId) {
      console.warn("[ChatScreen] Cannot archive: currentChatId is null.");
      return;
    }
    Alert.alert(
      t('chat.newChatTitle'),
      t('chat.newChatMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('chat.proceed'),
          style: 'destructive',
          onPress: async () => {
            console.log(`[ChatScreen] Archiving chat ${currentChatId} and starting new.`);
            setIsScreenLoading(true);
            const newChatId = await archiveAndStartNew();
            if (newChatId) {
              console.log(`[ChatScreen] New chat ID: ${newChatId}. Resetting state for transition.`);
              setBootstrap(null);
              setIsReadOnly(false);
              initialLoadDoneForCurrentId.current = null;
              setCurrentChatId(newChatId);
            } else {
              console.error("[ChatScreen] Failed to get new chat ID.");
              setIsScreenLoading(false);
            }
          },
        },
      ]
    );
  }, [currentChatId, archiveAndStartNew, t]);

  const handleActivateChat = useCallback(() => {
    if (!currentChatId) {
      console.warn("[ChatScreen] Cannot activate: currentChatId is null.");
      return;
    }

    Alert.alert(
      t('chat.activateConfirmTitle'),
      t('chat.activateConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('chat.proceed'),
          onPress: async () => {
            console.log(`[ChatScreen] Activating chat ${currentChatId}.`);
            try {
              setIsScreenLoading(true);

              const activatedChat: ChatListItem = await chatService.setActiveChat(currentChatId);
              console.log(`[ChatScreen] Chat ${activatedChat.id} activated successfully via API.`);
              Alert.alert(t('chat.activateSuccess'));

              navigation.replace('ChatScreen', {
                chatId: activatedChat.id,
                botId: activatedChat.bot.id,
                botName: activatedChat.bot.name,
                botHandle: `@${activatedChat.bot.name}`,
                botAvatarUrl: activatedChat.bot.avatar_url,
                isArchived: false,
              });

            } catch (error) {
              console.error("[ChatScreen] Failed to activate chat:", error);
              Alert.alert("Erro", "Não foi possível ativar esta conversa.");
              setIsScreenLoading(false);
            }
          },
        },
      ]
    );
  }, [currentChatId, t, navigation, botId]);

  const menuItems = useMemo(() => [
    {
      label: t('chat.menuSettings'),
      onPress: handleOpenSettings,
      icon: <Ionicons name="settings-outline" size={18} color={theme.textPrimary} />
    },
    ...(!isReadOnly ? [{
      label: t('chat.menuNewChat'),
      onPress: handleArchiveAndStartNew,
      icon: <Ionicons name="add-circle-outline" size={18} color={theme.textPrimary} />
    }] : []),
    {
      label: t('chat.menuArchivedChats'),
      onPress: handleViewArchived,
      icon: <Ionicons name="archive-outline" size={18} color={theme.textPrimary} />
    },
  ], [t, theme.textPrimary, handleArchiveAndStartNew, handleOpenSettings, handleViewArchived, botId, isReadOnly]);

  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // --- RENDER ---
  if (isScreenLoading || !bootstrap) {
    console.log(`[ChatScreen] Final Loading Check: isScreenLoading=${isScreenLoading}, !bootstrap=${!bootstrap}`);
    return (
      <SafeAreaView style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ChatHeader
          title={botName}
          subtitle={botHandle}
          avatarUrl={botAvatarUrl}
          onBack={handleBackPress}
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
        onBack={handleBackPress}
        onMorePress={(anchor) => {
          setMenuAnchor(anchor);
          setMenuOpen(true);
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          inverted
          data={invertedMessages}
          keyExtractor={(item) => String(item.id)}
          style={{ flex: 1 }}
          contentContainerStyle={[s.listContent, { paddingTop: Spacing['spacing-element-m'] }]}
          renderItem={({ item, index }) => {
            if (!currentChatId) {
              return null;
            }

            return (
              <MessageBubble
                message={item}
                conversationId={currentChatId}
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
          ListHeaderComponent={
            isLoadingMore ? (
              <ActivityIndicator style={{ marginVertical: 16 }} color={theme.brand.normal} />
            ) : null
          }
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
                      onPress={() => handleSuggestionPress(label)}
                    />
                  ))}
                </View>
              )}
            </>
          }
          keyboardShouldPersistTaps="handled"
          extraData={messages.length + (currentChatId ?? 'nullId') + isLoadingMore + isReadOnly + isTyping + hasLoadedOnce + showHeaderChips + isSendingSuggestion}
        />

        {isTyping && (
          <Text style={{ textAlign: 'center', color: theme.textSecondary, padding: 4 }}>
            Bot está digitando...
          </Text>
        )}

        {/* ✅ CORREÇÃO: Preview de anexos e input devem estar dentro de View separada */}
        <View>
          {/* Preview de anexos selecionados */}
          {selectedAttachments.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: Spacing['spacing-group-s'],
                paddingTop: Spacing['spacing-element-s'],
                paddingBottom: Spacing['spacing-element-s']
              }}
            >
              {selectedAttachments.map((attachment) => (
                <View
                  key={attachment.uri}
                  style={{ marginRight: Spacing['spacing-element-m'] }}
                >
                  <AttachmentPreview
                    attachment={attachment}
                    onRemove={handleRemoveAttachment}
                  />
                </View>
              ))}
            </ScrollView>
          )}

          {/* Banner de ativação ou input de chat */}
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
              onMic={handleStartRecording}
              onPlus={handlePlusPress}
              recordingState={audioRecorder.recordingState}
              recordingDuration={audioRecorder.formattedDuration}
              onPauseRecording={audioRecorder.pauseRecording}
              onResumeRecording={audioRecorder.resumeRecording}
              onStopRecording={handleStopRecording}
              onCancelRecording={audioRecorder.cancelRecording}
              isTranscribing={isTranscribing}
            />
          )}
        </View>
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
