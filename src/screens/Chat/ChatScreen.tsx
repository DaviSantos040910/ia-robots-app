// src/screens/Chat/ChatScreen.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  ScrollView,
  Alert,
  ListRenderItem,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

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
import { Spacing } from '../../theme/spacing';
import { ChatMessage } from '../../types/chat';

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>;

const ChatScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ChatScreenProps['route']>();
  
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  const [inputText, setInputText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<Anchor>(null);
  
  const [isSending, setIsSending] = useState(false);

  const {
    currentChatId,
    bootstrap,
    isReadOnly,
    isScreenLoading,
    setBootstrap,
    setIsReadOnly,
    setCurrentChatId,
    initialLoadDoneForCurrentId
  } = useChatBootstrap({
    ...route.params,
  });

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

  // --- Handlers ---

  const handleBackPress = useCallback(() => {
    if (isReadOnly) {
      navigation.goBack();
    } else {
      navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main', { screen: 'Chat' });
    }
  }, [isReadOnly, navigation]);

  const handlePhonePress = useCallback(() => {
    if (!currentChatId || !bootstrap) {
        console.warn('[ChatScreen] Incomplete data for call.');
        return;
    }
    
    try {
        navigation.navigate('VoiceCall', {
            chatId: currentChatId,
            botId: route.params.botId,
            botName: bootstrap.bot.name,
            botHandle: bootstrap.bot.handle, 
            botAvatarUrl: bootstrap.bot.avatarUrl,
        });
    } catch (error) {
        console.error('[ChatScreen] Error navigating to voice call:', error);
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
    } catch (error: any) {
      console.error("Send failed:", error);
      if (textToSend) setInputText(textToSend);
      
      Alert.alert(
        t('common.error'), 
        t('chat.sendError', { defaultValue: 'Failed to send message.' })
      );
    } finally {
      setIsSending(false);
    }
  }, [isReadOnly, currentChatId, isSending, inputText, selectedAttachments, clearAttachments, sendAttachments, sendMessage, t]);

  const handleSuggestionPress = useCallback((label: string) => {
    if (isReadOnly || !currentChatId) return;
    sendMessage(label);
  }, [isReadOnly, currentChatId, sendMessage]);

  const handleArchiveAndStartNew = useCallback(() => {
    setMenuOpen(false);
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
            const newChatId = await archiveAndStartNew();
            if (newChatId) {
              setBootstrap(null);
              setIsReadOnly(false);
              if (initialLoadDoneForCurrentId) initialLoadDoneForCurrentId.current = null;
              setCurrentChatId(newChatId);
            }
          },
        },
      ]
    );
  }, [currentChatId, t, archiveAndStartNew, setBootstrap, setIsReadOnly, setCurrentChatId, initialLoadDoneForCurrentId]);

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
  ], [isReadOnly, theme, t, handleOpenSettings, handleArchiveAndStartNew, handleViewArchived]);

  const renderMessage: ListRenderItem<ChatMessage> = useCallback(({ item, index }) => {
    if (!currentChatId) return null;
    
    return (
      <MessageBubble
        message={item}
        conversationId={currentChatId}
        onCopy={handleCopyMessage}
        onLike={handleLikeMessage}
        onSuggestionPress={(_, text) => handleSuggestionPress(text)}
        onImagePress={onImagePress}
        isLastMessage={index === 0}
      />
    );
  }, [currentChatId, handleCopyMessage, handleLikeMessage, handleSuggestionPress, onImagePress]);

  const keyExtractor = useCallback((item: ChatMessage) => item.id ? item.id.toString() : `temp-${Math.random()}`, []);

  // --- FASE 2.1: Performance da Lista (getItemLayout) ---
  // Estimativa de altura para evitar cálculos pesados de layout durante o scroll rápido.
  // 100px é uma média razoável para mensagens de texto curtas/médias.
  const getItemLayout = useCallback((data: any, index: number) => (
    { length: 100, offset: 100 * index, index }
  ), []);

  const uniqueMessages = useMemo(() => {
    const seenIds = new Set();
    return messages.filter(msg => {
      if (seenIds.has(msg.id)) return false;
      seenIds.add(msg.id);
      return true;
    });
  }, [messages]);

  const invertedMessages = useMemo(() => [...uniqueMessages].reverse(), [uniqueMessages]);
  
  const showWelcome = !isReadOnly && uniqueMessages.length === 0;

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
    // --- FASE 2.2: Correção do Teclado ---
    // Usamos edges apenas 'top' para que a SafeAreaView não adicione padding inferior duplo
    // quando combinada com o KeyboardAvoidingView e o Bottom Navigation.
    <SafeAreaView style={s.screen} edges={['top']}>
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

      {/* CORREÇÃO CRÍTICA TECLADO:
         1. No Android, 'behavior' undefined é melhor com 'windowSoftInputMode="adjustResize"' no app.json.
         2. No iOS, 'padding' é necessário, e o offset compensa o header.
      */}
      <KeyboardAvoidingView
        style={s.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={invertedMessages}
          keyExtractor={keyExtractor}
          renderItem={renderMessage}
          inverted
          style={s.flatList}
          // --- FASE 2.1: Tuning de Performance e Padding ---
          contentContainerStyle={[s.flatListContent, { paddingBottom: 16 }]} 
          
          initialNumToRender={15}          
          maxToRenderPerBatch={10}          
          windowSize={21}                  
          updateCellsBatchingPeriod={50}   
          removeClippedSubviews={Platform.OS === 'android'}
          getItemLayout={getItemLayout}
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          
          extraData={uniqueMessages}
          keyboardShouldPersistTaps="handled"

          onEndReached={() => {
            if (!isReadOnly && !isLoadingMore && hasLoadedOnce) {
              loadMoreMessages();
            }
          }}
          onEndReachedThreshold={0.2}
          ListHeaderComponent={
            isLoadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={theme.brand.normal} /> : null
          }
          ListFooterComponent={
            <ChatWelcome
              botAvatar={bootstrap.bot.avatarUrl}
              welcomeText={bootstrap.welcome}
              suggestions={bootstrap.suggestions}
              onSuggestionPress={handleSuggestionPress}
              showSuggestions={showWelcome}
            />
          }
        />

        {isTyping && (
          <Text style={s.typingIndicator}>
            {t('chat.botTyping', { defaultValue: 'Bot is typing...' })}
          </Text>
        )}

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
                 <AttachmentPreview attachment={attachment} onRemove={onRemoveAttachment} />
               </View>
             ))}
             {isPickerLoading && <ActivityIndicator size="small" color={theme.brand.normal} style={s.attachmentLoader} />}
           </ScrollView>
          )}

          {isReadOnly ? (
            <View style={s.activateBanner}>
              <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>
                {t('chat.readOnlyMessage', { defaultValue: 'This chat is archived.' })}
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