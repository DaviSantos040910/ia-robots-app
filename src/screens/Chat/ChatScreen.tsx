// src/screens/Chat/ChatScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
  ScrollView,
  Alert,
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

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'ChatScreen'>;

const ChatScreen: React.FC = () => {
  // --- Hooks & Init ---
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ChatScreenProps['route']>();
  
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark');
  const s = createChatStyles(theme);

  // --- Local State (Input & Menus) ---
  const [inputText, setInputText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<Anchor>(null);

  // --- Custom Hooks ---
  
  const {
    currentChatId,
    bootstrap,
    isReadOnly,
    isScreenLoading,
    setIsReadOnly,
    setCurrentChatId,
    setBootstrap,
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

  const {
    audioProps,
    isTranscribing 
  } = useChatAudioLogic({
    chatId: currentChatId,
    setTextInput: setInputText,
  });

  // --- Handlers ---

  const handleBackPress = () => {
    if (isReadOnly) {
      navigation.goBack();
    } else {
      navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main', { screen: 'Chat' });
    }
  };

  const handleOpenSettings = () => {
    setMenuOpen(false);
    navigation.navigate('BotSettings', { botId: route.params.botId });
  };

  const handleViewArchived = () => {
    setMenuOpen(false);
    navigation.navigate('ArchivedChats', { botId: route.params.botId });
  };

  const handleSend = async () => {
    if (isReadOnly || !currentChatId) return;
    
    const textToSend = inputText.trim();
    const attachmentsToSend = selectedAttachments;

    if (!textToSend && attachmentsToSend.length === 0) return;

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
    } catch (error) {
      Alert.alert(t('error'), t('chat.sendError', { defaultValue: 'Failed to send message.' }));
    }
  };

  const handleSuggestionPress = (label: string) => {
    if (isReadOnly || !currentChatId) return;
    sendMessage(label);
  };

  const handleArchiveAndStartNew = () => {
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
  };

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
  ], [isReadOnly, theme, t]);

  // --- Render Logic ---

  // Correção BUG 1: Layout de Loading corrigido
  // Agora usamos 'flex: 1' para o container do indicador, em vez de centralizar a tela inteira.
  if (isScreenLoading || !bootstrap) {
    return (
      <SafeAreaView style={s.screen}>
         <ChatHeader
          title={route.params.botName}
          subtitle={route.params.botHandle}
          avatarUrl={route.params.botAvatarUrl}
          onBack={handleBackPress}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.brand.normal} />
        </View>
      </SafeAreaView>
    );
  }

  const showWelcome = !isReadOnly && messages.length === 0;
  const invertedMessages = [...messages].reverse();

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
      >
        <FlatList
          data={invertedMessages}
          keyExtractor={(item) => item.id}
          inverted
          style={{ flex: 1 }}
          contentContainerStyle={[s.listContent, { paddingTop: Spacing['spacing-element-m'] }]}
          
          // Correção BUG 2: Permitir toque com teclado aberto
          // 'handled' garante que o toque no suggestion chip seja processado mesmo se o teclado estiver visível.
          keyboardShouldPersistTaps="handled"

          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              conversationId={currentChatId || ''}
              onCopy={handleCopyMessage}
              onLike={handleLikeMessage}
              onSuggestionPress={(_, text) => handleSuggestionPress(text)}
              onImagePress={onImagePress}
              isLastMessage={index === 0}
            />
          )}
          onEndReached={() => {
            if (!isReadOnly && !isLoadingMore && hasLoadedOnce) {
              loadMoreMessages();
            }
          }}
          onEndReachedThreshold={0.5}
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
          <Text style={{ textAlign: 'center', color: theme.textSecondary, padding: 4 }}>
            {t('chat.botTyping', { defaultValue: 'Bot is typing...' })}
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
             // Também adicionamos aqui por precaução, caso o usuário tente remover um anexo com teclado aberto
             keyboardShouldPersistTaps="handled" 
           >
             {selectedAttachments.map((attachment) => (
               <View key={attachment.uri} style={{ marginRight: Spacing['spacing-element-m'] }}>
                 <AttachmentPreview attachment={attachment} onRemove={onRemoveAttachment} />
               </View>
             ))}
             {isPickerLoading && <ActivityIndicator size="small" color={theme.brand.normal} style={{ marginLeft: 10 }} />}
           </ScrollView>
          )}

          {isReadOnly ? (
            <View style={s.activateBanner}>
              <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>
                {t('chat.readOnlyMessage', { defaultValue: 'This chat is archived.' })}
              </Text>
            </View>
          ) : (
            <ChatInput
              value={inputText}
              onChangeText={setInputText}
              onSend={handleSend}
              onPlus={onAttachPress}
              {...audioProps}
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