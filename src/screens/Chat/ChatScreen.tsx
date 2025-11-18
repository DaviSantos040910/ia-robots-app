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
import { ImageViewerModal } from '../../components/chat/ImageViewerModal'; // Importado
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
  
  // Estados de Anexos e Modal
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<AttachmentPickerResult[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  
  // NOVO: Estado para controlar o modal de visualização de imagem
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  // Estado de Áudio
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
    sendAttachments,
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
    if (isLoadingData.current && !isTriggeredByFocusOrActivation) return;
    if (!botId) { setIsScreenLoading(false); return; }

    if (isTriggeredByFocusOrActivation && initialLoadDoneForCurrentId.current === currentChatId && hasLoadedOnce) {
      setIsScreenLoading(false);
      return;
    }

    isLoadingData.current = true;
    if (initialLoadDoneForCurrentId.current !== currentChatId) {
      setIsScreenLoading(true);
    }

    try {
      if (isReadOnly) {
        if (currentChatId !== initialChatId) {
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
          clearLocalChatState(initialChatId);
          await loadInitialMessages();
          initialLoadDoneForCurrentId.current = initialChatId;
        }
      } else {
        let chatDataToLoad: string | null = null;
        let fetchedBootstrapData: ChatBootstrap | null = null;

        fetchedBootstrapData = await botService.getChatBootstrap(botId);
        setBootstrap(fetchedBootstrapData);
        chatDataToLoad = fetchedBootstrapData.conversationId;

        if (currentChatId !== chatDataToLoad) {
          setCurrentChatId(chatDataToLoad);
          initialLoadDoneForCurrentId.current = null;
          isLoadingData.current = false;
          return;
        }

        const needsLoad = chatDataToLoad && initialLoadDoneForCurrentId.current !== chatDataToLoad;
        if (needsLoad && chatDataToLoad) {
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
    }
  }, [
    botId,
    currentChatId,
    initialChatId,
    isReadOnly,
    bootstrap,
    botName,
    botHandle,
    botAvatarUrl,
    loadInitialMessages,
    clearLocalChatState,
    t,
  ]);

  useEffect(() => {
    if (isFocused) {
      loadChatData(true);
    } else {
      initialLoadDoneForCurrentId.current = null;
    }
  }, [isFocused, currentChatId, isReadOnly, loadChatData]);

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
    const result = await pickImage();
    if (result) setSelectedAttachments(prev => [...prev, ...result]);
  };

  const handleSelectDocument = async () => {
    const result = await pickDocument();
    if (result) setSelectedAttachments(prev => [...prev, ...result]);
  };

  const handleTakePhoto = async () => {
    const result = await takePhoto();
    if (result) setSelectedAttachments(prev => [...prev, ...result]);
  };

  const handleRemoveAttachment = (uriToRemove: string) => {
    setSelectedAttachments(prev => prev.filter(att => att.uri !== uriToRemove));
  };

  const handleStartRecording = useCallback(async () => {
    const success = await audioRecorder.startRecording();
    if (!success) {
      Alert.alert(
        t('error', { defaultValue: 'Erro' }),
        t('chat.recordingPermissionDenied', { defaultValue: 'É necessária permissão do microfone para gravar áudio.' })
      );
    }
  }, [audioRecorder, t]);

  const handleStopRecording = useCallback(async () => {
    if (!currentChatId) return;
    const audioUri = await audioRecorder.stopRecording();

    if (!audioUri) {
      Alert.alert(t('error', { defaultValue: 'Erro' }), t('chat.recordingFailed', { defaultValue: 'Falha ao salvar gravação.' }));
      return;
    }

    setIsTranscribing(true);
    try {
      const transcription = await chatService.transcribeAudio(currentChatId, audioUri);
      setInput(transcription);
    } catch (error) {
      Alert.alert(t('error', { defaultValue: 'Erro' }), t('chat.transcriptionFailed', { defaultValue: 'Falha ao transcrever áudio.' }));
    } finally {
      setIsTranscribing(false);
    }
  }, [audioRecorder, currentChatId, t]);

  const handleBackPress = () => {
    if (isReadOnly) {
      navigation.goBack();
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Main', { screen: 'Chat' });
      }
    }
  };

  // --- UPDATED SEND HANDLER (BATCH) ---
  const handleSend = useCallback(async () => {
    if (isReadOnly || !currentChatId) return;

    const textToSend = input.trim();
    const attachmentsToSend = selectedAttachments;

    if (attachmentsToSend.length === 0 && !textToSend) return;

    setSelectedAttachments([]);
    setInput('');
    setIsUploadingAttachment(true);

    try {
      if (attachmentsToSend.length > 0) {
        console.log(`[ChatScreen] Iniciando upload em lote de ${attachmentsToSend.length} arquivos...`);
        await sendAttachments(attachmentsToSend);
      }

      if (textToSend || attachmentsToSend.length > 0) {
        console.log(`[ChatScreen] Enviando texto: "${textToSend}"`);
        await sendMessage(textToSend);
      }

    } catch (error: any) {
      Alert.alert('Erro no Envio', error.message || 'Não foi possível enviar.');
      setSelectedAttachments(attachmentsToSend);
      setInput(textToSend);
    } finally {
      setIsUploadingAttachment(false);
    }
  }, [isReadOnly, currentChatId, input, selectedAttachments, sendMessage, sendAttachments]);

  const handleSuggestionPress = async (label: string) => {
    if (isSendingSuggestion || isTyping || isReadOnly || !currentChatId) return;
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

  // Handler para abrir imagem em tela cheia
  const handleImagePress = (imageUrl: string) => {
    setViewingImageUrl(imageUrl);
  };

  // ... (rest of the handlers: handleArchiveAndStartNew, handleActivateChat, menuItems) ...
  const handleArchiveAndStartNew = useCallback(() => {
    if (!currentChatId) return;
    Alert.alert(
      t('chat.newChatTitle'),
      t('chat.newChatMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('chat.proceed'),
          style: 'destructive',
          onPress: async () => {
            setIsScreenLoading(true);
            const newChatId = await archiveAndStartNew();
            if (newChatId) {
              setBootstrap(null);
              setIsReadOnly(false);
              initialLoadDoneForCurrentId.current = null;
              setCurrentChatId(newChatId);
            } else {
              setIsScreenLoading(false);
            }
          },
        },
      ]
    );
  }, [currentChatId, archiveAndStartNew, t]);

  const handleActivateChat = useCallback(() => {
    if (!currentChatId) return;
    Alert.alert(
      t('chat.activateConfirmTitle'),
      t('chat.activateConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('chat.proceed'),
          onPress: async () => {
            try {
              setIsScreenLoading(true);
              const activatedChat: ChatListItem = await chatService.setActiveChat(currentChatId);
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
              Alert.alert("Erro", "Não foi possível ativar esta conversa.");
              setIsScreenLoading(false);
            }
          },
        },
      ]
    );
  }, [currentChatId, t, navigation]);

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
            if (!currentChatId) return null;
            return (
              <MessageBubble
                message={item}
                conversationId={currentChatId}
                onCopy={handleCopyMessage}
                onLike={handleLikeMessage}
                onSuggestionPress={(messageId, text) => handleSuggestionPress(text)}
                // Passa o handler de imagem
                onImagePress={handleImagePress}
                isLastMessage={index === 0}
                isSendingSuggestion={isSendingSuggestion}
              />
            );
          }}
          onEndReached={() => {
            if (!isReadOnly && !isLoadingMore && hasLoadedOnce && messages.length > 0 && bootstrap?.conversationId === currentChatId) {
              loadMoreMessages();
            }
          }}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            isLoadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={theme.brand.normal} /> : null
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
          extraData={messages.length}
        />

        {isTyping && (
          <Text style={{ textAlign: 'center', color: theme.textSecondary, padding: 4 }}>
            Bot está digitando...
          </Text>
        )}

        <View>
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
                <View key={attachment.uri} style={{ marginRight: Spacing['spacing-element-m'] }}>
                  <AttachmentPreview attachment={attachment} onRemove={handleRemoveAttachment} />
                </View>
              ))}
            </ScrollView>
          )}

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

      {/* Modal de Visualização de Imagem */}
      <ImageViewerModal
        visible={!!viewingImageUrl}
        imageUrl={viewingImageUrl}
        onClose={() => setViewingImageUrl(null)}
      />
    </SafeAreaView>
  );
};

export default ChatScreen;