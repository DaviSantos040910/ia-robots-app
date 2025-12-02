// src/screens/Chat/ChatScreen.tsx
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  ScrollView,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FlashList, type ListRenderItem, type FlashListRef } from '@shopify/flash-list';

// Components
import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { ChatWelcome } from '../../components/chat/ChatWelcome';
import { AttachmentMenu } from '../../components/chat/AttachmentMenu';
import { AttachmentPreview } from '../../components/chat/AttachmentPreview';
import { ImageViewerModal } from '../../components/chat/ImageViewerModal';
import { ActionSheetMenu, type Anchor } from '../../components/chat/ActionSheetMenu';
import { smoothLayout } from '../../components/shared/Motion';

// Hooks
import { useChatBootstrap } from './hooks/useChatBootstrap';
import { useChatController } from '../../contexts/chat/ChatProvider';
import { useChatMediaLogic } from './hooks/useChatMediaLogic';
import { useChatAudioLogic } from './hooks/useChatAudioLogic';

// Styles & Types
import { createChatStyles, getTheme } from './Chat.styles';
import { RootStackParamList } from '../../types/navigation';
import { ChatMessage } from '../../types/chat';

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>;

const ChatScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ChatScreenProps['route']>();
  
  const scheme = useColorScheme();
  const theme = useMemo(() => getTheme(scheme === 'dark'), [scheme]);
  const s = useMemo(() => createChatStyles(theme), [theme]);

  // UI State
  const [inputText, setInputText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<Anchor>(null);
  const [isSending, setIsSending] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Ref da FlashList
  const flashListRef = useRef<FlashListRef<ChatMessage> | null>(null);

  // Gerenciamento de listeners do teclado
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = () => setKeyboardVisible(true);
    const onHide = () => setKeyboardVisible(false);

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const safeAreaEdges: Edge[] = useMemo(
    () => (isKeyboardVisible ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']),
    [isKeyboardVisible]
  );

  // Business Logic Hooks
  const {
    currentChatId,
    bootstrap,
    isReadOnly,
    isScreenLoading,
    setBootstrap,
    setIsReadOnly,
    setCurrentChatId,
    initialLoadDoneForCurrentId,
  } = useChatBootstrap({ ...route.params });

  const {
    messages,
    isTyping,
    isLoadingMore,
    hasLoadedOnce,
    loadMoreMessages,
    sendMessage,
    archiveAndStartNew,
    sendAttachments,
    handleCopyMessage,
    handleLikeMessage,
    isBotVoiceMode,
    toggleBotVoiceMode,
    sendVoiceMessage,
  } = useChatController(currentChatId);

  const {
    attachmentMenuVisible,
    setAttachmentMenuVisible,
    selectedAttachments,
    viewingImageUrl,
    isPickerLoading,
    onAttachPress,
    onCameraPress,
    onImageSelected,
    onDocumentSelected,
    onRemoveAttachment,
    clearAttachments,
    onImagePress,
    onCloseImageViewer,
  } = useChatMediaLogic();

  const { audioProps } = useChatAudioLogic({
    onSendVoice: sendVoiceMessage,
  });

  // Autoscroll para a mensagem mais recente quando usuário envia mensagem
  useEffect(() => {
  if (messages.length > 0) {
    setTimeout(() => {
      flashListRef.current?.scrollToIndex({ 
        index: messages.length - 1, 
        animated: true 
      });
    }, 300);
  }
}, [messages.length]);

  // --- Handlers ---

  const handleBackPress = useCallback(() => {
    if (isReadOnly) {
      navigation.goBack();
    } else {
      navigation.canGoBack()
        ? navigation.goBack()
        : navigation.navigate('Main', { screen: 'Chat' });
    }
  }, [isReadOnly, navigation]);

  const handlePhonePress = useCallback(() => {
    if (!currentChatId || !bootstrap) return;
    try {
      navigation.navigate('VoiceCall', {
        chatId: currentChatId,
        botId: route.params.botId,
        botName: bootstrap.bot.name,
        botHandle: bootstrap.bot.handle,
        botAvatarUrl: bootstrap.bot.avatarUrl,
      });
    } catch (error) {
      Alert.alert(t('common.error'), t('chat.voiceCallNavigationError'));
    }
  }, [currentChatId, bootstrap, route.params.botId, navigation, t]);

  const handleOpenSettings = useCallback(() => {
    setMenuOpen(false);
    navigation.navigate('BotSettings', { botId: route.params.botId });
  }, [navigation, route.params.botId]);

  const handleViewArchived = useCallback(() => {
    setMenuOpen(false);
    navigation.navigate('ArchivedChats', { botId: route.params.botId });
  }, [navigation, route.params.botId]);

  const handleSend = useCallback(async () => {
    if (isReadOnly || !currentChatId || isSending) return;
    
    const textToSend = inputText.trim();
    const attachmentsToSend = selectedAttachments;

    if (!textToSend && attachmentsToSend.length === 0) return;

    setIsSending(true);
    setInputText('');
    clearAttachments();
    smoothLayout();

    try {
      if (attachmentsToSend.length > 0) {
        await sendAttachments(attachmentsToSend);
      }
      if (textToSend) {
        await sendMessage(textToSend);
      }
      setTimeout(() => {
        if (flashListRef.current && messages.length > 0) {
          flashListRef.current.scrollToIndex({ 
            index: messages.length - 1, 
            animated: true 
          });
        }
      }, 200);
    } catch (error) {
      if (textToSend) setInputText(textToSend);
      Alert.alert(t('common.error'), t('chat.sendError'));
    } finally {
      setIsSending(false);
    }
  }, [
    isReadOnly,
    currentChatId,
    isSending,
    inputText,
    selectedAttachments,
    clearAttachments,
    sendAttachments,
    sendMessage,
    messages.length,
    t,
  ]);

  const handleSuggestionPress = useCallback(
    (label: string) => {
      if (isReadOnly || !currentChatId) return;
      sendMessage(label);
    },
    [isReadOnly, currentChatId, sendMessage]
  );

  const handleArchiveAndStartNew = useCallback(() => {
    setMenuOpen(false);
    if (!currentChatId) return;

    Alert.alert(t('chat.newChatTitle'), t('chat.newChatMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('chat.proceed'),
        style: 'destructive',
        onPress: async () => {
          const newChatId = await archiveAndStartNew();
          if (newChatId) {
            setBootstrap(null);
            setIsReadOnly(false);
            if (initialLoadDoneForCurrentId) initialLoadDoneForCurrentId.current = null;
            setCurrentChatId(newChatId);
          }
        },
      },
    ]);
  }, [
    currentChatId,
    t,
    archiveAndStartNew,
    setBootstrap,
    setIsReadOnly,
    setCurrentChatId,
    initialLoadDoneForCurrentId,
  ]);

  const menuItems = useMemo(
    () => [
      {
        label: t('chat.menuSettings'),
        onPress: handleOpenSettings,
        icon: <Ionicons name="settings-outline" size={18} color={theme.textPrimary} />,
      },
      ...(!isReadOnly
        ? [
            {
              label: t('chat.menuNewChat'),
              onPress: handleArchiveAndStartNew,
              icon: <Ionicons name="add-circle-outline" size={18} color={theme.textPrimary} />,
            },
          ]
        : []),
      {
        label: t('chat.menuArchivedChats'),
        onPress: handleViewArchived,
        icon: <Ionicons name="archive-outline" size={18} color={theme.textPrimary} />,
      },
    ],
    [isReadOnly, theme, t, handleOpenSettings, handleArchiveAndStartNew, handleViewArchived]
  );

  // --- FlashList Config ---

  const renderMessage: ListRenderItem<ChatMessage> = useCallback(
    ({ item, index }) => {
      if (!currentChatId) return null;
      
      const isLastMessage = index === messages.length - 1;

      return (
        <MessageBubble
          message={item}
          conversationId={currentChatId}
          onCopy={handleCopyMessage}
          onLike={handleLikeMessage}
          onSuggestionPress={(_, text) => handleSuggestionPress(text)}
          onImagePress={onImagePress}
          isLastMessage={isLastMessage}
        />
      );
    },
    [currentChatId, messages.length, handleCopyMessage, handleLikeMessage, handleSuggestionPress, onImagePress]
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const getItemType = useCallback((item: ChatMessage) => {
    if (item.attachment_type === 'audio') return 'audio';
    if (item.attachment_type === 'image') return 'image';
    return item.role;
  }, []);

  // ✅ Welcome + Loading no TOPO visual (ListFooterComponent em lista invertida)
  const renderListFooter = useMemo(() => (
    <>
      {isLoadingMore && (
        <ActivityIndicator
          style={{ marginVertical: 16 }}
          color={theme.brand.normal}
        />
      )}
      {!isLoadingMore && hasLoadedOnce && !isReadOnly && (
        <ChatWelcome
          botAvatar={bootstrap?.bot.avatarUrl}
          welcomeText={bootstrap?.welcome || ''}
          suggestions={bootstrap?.suggestions || []}
          onSuggestionPress={handleSuggestionPress}
          showSuggestions={messages.length === 0}
        />
      )}
    </>
  ), [isLoadingMore, hasLoadedOnce, isReadOnly, bootstrap, handleSuggestionPress, messages.length, theme.brand.normal]);

  if (isScreenLoading || !bootstrap) {
    return (
      <SafeAreaView style={s.screen}>
        <ChatHeader
          title={route.params.botName}
          subtitle={route.params.botHandle}
          avatarUrl={route.params.botAvatarUrl}
          onBack={handleBackPress}
        />
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={theme.brand.normal} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={safeAreaEdges}>
      <ChatHeader
        title={bootstrap.bot.name}
        subtitle={bootstrap.bot.handle}
        avatarUrl={bootstrap.bot.avatarUrl}
        onBack={handleBackPress}
        onPhone={handlePhonePress}
        onVolume={toggleBotVoiceMode}
        isVoiceModeEnabled={isBotVoiceMode}
        onMorePress={(anchor) => {
          setMenuAnchor(anchor);
          setMenuOpen(true);
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* ✅ Lista de mensagens invertida */}
        <FlashList
          ref={flashListRef}
          data={messages}  
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          // @ts-expect-error: estimatedItemSize é suportado mas pode faltar nos tipos locais
          estimatedItemSize={100}
          
          inverted={true}
          
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,    // Espaço na base visual
            paddingBottom: 30, // Espaço no topo visual
          }}
          
          keyboardShouldPersistTaps="handled"
          
          onEndReached={() => {
            if (!isReadOnly && !isLoadingMore && hasLoadedOnce) {
              loadMoreMessages();
            }
          }}
          onEndReachedThreshold={0.5}
          
          // ✅ Welcome e loading aparecem no TOPO visual (quando scrolla para cima)
            ListHeaderComponent={renderListFooter}
        />

        {/* ✅ Indicador de digitação FIXO acima do input (fora da FlashList) */}
        {isTyping && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <Text style={s.typingIndicator}>
              {t('chat.botTyping', { defaultValue: 'Bot is typing...' })}
            </Text>
          </View>
        )}

        {/* ✅ Área de anexos e input */}
        <View>
          {selectedAttachments.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.attachmentsScrollView}
              keyboardShouldPersistTaps="handled"
            >
              {selectedAttachments.map((attachment) => (
                <View key={attachment.uri} style={s.attachmentsContainer}>
                  <AttachmentPreview
                    attachment={attachment}
                    onRemove={onRemoveAttachment}
                  />
                </View>
              ))}
              {isPickerLoading && (
                <ActivityIndicator
                  size="small"
                  color={theme.brand.normal}
                  style={s.attachmentLoader}
                />
              )}
            </ScrollView>
          )}

          {isReadOnly ? (
            <View style={s.activateBanner}>
              <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>
                {t('chat.readOnlyMessage', {
                  defaultValue: 'This chat is archived.',
                })}
              </Text>
            </View>
          ) : (
            <View>
              {isSending && (
                <View style={s.loadingOverlay}>
                  <ActivityIndicator size="small" color={theme.brand.normal} />
                </View>
              )}
              <ChatInput
                value={inputText}
                onChangeText={setInputText}
                onSend={handleSend}
                onPlus={onAttachPress}
                {...audioProps}
              />
            </View>
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
        onSelectImage={onImageSelected}
        onSelectDocument={onDocumentSelected}
        onTakePhoto={onCameraPress}
      />

      <ImageViewerModal
        visible={!!viewingImageUrl}
        imageUrl={viewingImageUrl}
        onClose={onCloseImageViewer}
      />
    </SafeAreaView>
  );
};

export default ChatScreen;
