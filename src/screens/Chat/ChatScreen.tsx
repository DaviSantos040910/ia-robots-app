// src/screens/Chat/ChatScreen.tsx
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  ScrollView,
  Alert,
  Keyboard,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView, Edge } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  FlashList,
  type ListRenderItem,
  type FlashListRef,
} from "@shopify/flash-list";

import { ChatHeader } from "../../components/chat/ChatHeader";
import { ChatInput } from "../../components/chat/ChatInput";
import { MessageBubble } from "../../components/chat/MessageBubble";
import { ChatWelcome } from "../../components/chat/ChatWelcome";
import { AttachmentMenu } from "../../components/chat/AttachmentMenu";
import { AttachmentPreview } from "../../components/chat/AttachmentPreview";
import { ImageViewerModal } from "../../components/chat/ImageViewerModal";
import {
  ActionSheetMenu,
  type Anchor,
} from "../../components/chat/ActionSheetMenu";
import { smoothLayout } from "../../components/shared/Motion";

import { useChatBootstrap } from "./hooks/useChatBootstrap";
import { useChatController } from "../../contexts/chat/ChatProvider";
import { useChatMediaLogic } from "./hooks/useChatMediaLogic";
import { useChatAudioLogic } from "./hooks/useChatAudioLogic";

import { createChatStyles, getTheme } from "./Chat.styles";
import { RootStackParamList } from "../../types/navigation";
import { ChatMessage } from "../../types/chat";

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, "ChatScreen">;

const ChatScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ChatScreenProps["route"]>();

  const scheme = useColorScheme();
  const theme = useMemo(() => getTheme(scheme === "dark"), [scheme]);
  const s = useMemo(() => createChatStyles(theme), [theme]);

  const [inputText, setInputText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<Anchor>(null);
  const [isSending, setIsSending] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [typingMessage, setTypingMessage] = useState("");

  const flashListRef = useRef<FlashListRef<ChatMessage> | null>(null);
  const typingAnim = useRef(new Animated.Value(0)).current;

  // Ref para guardar o tamanho da última mensagem e controlar auto-scroll
  const lastMessageContentLengthRef = useRef(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
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
    () =>
      isKeyboardVisible
        ? ["top", "left", "right"]
        : ["top", "bottom", "left", "right"],
    [isKeyboardVisible]
  );

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

  // --- SELEÇÃO DE DADOS ---
  const {
    chats,
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
    clearLocalChatState,
  } = useChatController(currentChatId);

  const chatIdStr = String(currentChatId || "");
  const rawMessages = chats[chatIdStr]?.messages || [];

  // --- FILTRAGEM VISUAL FINAL (Deduplicação e Ordenação) ---
  const renderMessages = useMemo(() => {
    if (!rawMessages) return [];

    // Helper de normalização agressiva (igual ao do Loader)
    const normalize = (str?: string) =>
      (str || "").replace(/\s+/g, "").toLowerCase();

    // 1. Identificar assinaturas de mensagens REAIS (já confirmadas pelo servidor)
    // Assinatura = Role + Conteúdo Normalizado
    const realMessageSignatures = new Set<string>();

    rawMessages.forEach((m) => {
      if (!String(m.id).startsWith("temp-")) {
        realMessageSignatures.add(`${m.role}:${normalize(m.content)}`);
      }
    });

    // 2. Filtrar e Ordenar
    return rawMessages
      .filter((m) => {
        const idStr = String(m.id);
        // Se for temporária, verifica se já existe uma "real" com o mesmo conteúdo semântico
        if (idStr.startsWith("temp-")) {
          const signature = `${m.role}:${normalize(m.content)}`;
          if (realMessageSignatures.has(signature)) {
            // BLOQUEIA VISUALMENTE: A mensagem real já está na lista, escondemos a temp.
            return false;
          }
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
  }, [rawMessages]);

  // --- EFEITO DE CLEANUP ---
  useEffect(() => {
    return () => {
      if (currentChatId) {
        clearLocalChatState(currentChatId);
      }
    };
  }, [currentChatId, clearLocalChatState]);

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

  const scrollToBottom = useCallback(() => {
    if (flashListRef.current && renderMessages.length > 0) {
      try {
        flashListRef.current.scrollToEnd({ animated: true });
      } catch (error) {
        console.warn("Scroll failed:", error);
      }
    }
  }, [renderMessages.length]);

  // --- AUTO-SCROLL INTELIGENTE ---
  useEffect(() => {
    if (renderMessages.length > 0) {
      const lastMsg = renderMessages[renderMessages.length - 1];
      const lastMsgIdStr = String(lastMsg.id);
      const isStreamingMessage =
        lastMsg.role === "assistant" && lastMsgIdStr.startsWith("temp-stream");

      if (isStreamingMessage) {
        const currentLength = lastMsg.content.length;
        const diff = currentLength - lastMessageContentLengthRef.current;

        if (diff > 20 || lastMessageContentLengthRef.current === 0) {
          scrollToBottom();
          lastMessageContentLengthRef.current = currentLength;
        }
      } else {
        if (
          lastMessageContentLengthRef.current !== 0 &&
          !lastMsgIdStr.startsWith("temp-stream")
        ) {
          lastMessageContentLengthRef.current = 0;
          scrollToBottom();
        } else if (lastMessageContentLengthRef.current === 0) {
          scrollToBottom();
        }
      }
    }
  }, [renderMessages, scrollToBottom]);

  // Effect para rolar para o fundo ao entrar no chat
  useEffect(() => {
    if (hasLoadedOnce && renderMessages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [hasLoadedOnce, currentChatId]);

  // Animação do Indicador de Digitação
  useEffect(() => {
    Animated.timing(typingAnim, {
      toValue: isTyping ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease),
    }).start();
  }, [isTyping, typingAnim]);

  const handleBackPress = useCallback(() => {
    if (isReadOnly) {
      navigation.goBack();
    } else {
      navigation.canGoBack()
        ? navigation.goBack()
        : navigation.navigate("Main", { screen: "ChatList" });
    }
  }, [isReadOnly, navigation]);

  const handlePhonePress = useCallback(() => {
    if (!currentChatId || !bootstrap) return;
    try {
      navigation.navigate("VoiceCall", {
        chatId: currentChatId,
        botId: route.params.botId,
        botName: bootstrap.bot.name,
        botHandle: bootstrap.bot.handle,
        botAvatarUrl: bootstrap.bot.avatarUrl,
      });
    } catch (error) {
      Alert.alert(t("common.error"), t("chat.voiceCallNavigationError"));
    }
  }, [currentChatId, bootstrap, route.params.botId, navigation, t]);

  const handleOpenSettings = useCallback(() => {
    setMenuOpen(false);
    navigation.navigate("BotSettings", { botId: route.params.botId });
  }, [navigation, route.params.botId]);

  const handleViewArchived = useCallback(() => {
    setMenuOpen(false);
    navigation.navigate("ArchivedChats", { botId: route.params.botId });
  }, [navigation, route.params.botId]);

  const handleSend = useCallback(async () => {
    if (isReadOnly || !currentChatId || isSending) return;
    const textToSend = inputText.trim();
    const attachmentsToSend = selectedAttachments;
    if (!textToSend && attachmentsToSend.length === 0) return;

    const isImageRequest =
      /cjrie|gerar|imagem|foto|desenho|ilustra|image|picture|draw|generate/i.test(
        textToSend
      );
    setTypingMessage(
      isImageRequest ? t("chat.creatingImage") : t("chat.botTyping")
    );

    setIsSending(true);
    setInputText("");
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
        scrollToBottom();
      }, 100);
    } catch (error) {
      if (textToSend) setInputText(textToSend);
      Alert.alert(t("common.error"), t("chat.sendError"));
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
    scrollToBottom,
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
    Alert.alert(t("chat.newChatTitle"), t("chat.newChatMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("chat.proceed"),
        style: "destructive",
        onPress: async () => {
          const newChatId = await archiveAndStartNew();
          if (newChatId) {
            setBootstrap(null);
            setIsReadOnly(false);
            if (initialLoadDoneForCurrentId)
              initialLoadDoneForCurrentId.current = null;
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
        label: t("chat.menuSettings"),
        onPress: handleOpenSettings,
        icon: (
          <Ionicons
            name="settings-outline"
            size={18}
            color={theme.textPrimary}
          />
        ),
      },
      ...(!isReadOnly
        ? [
            {
              label: t("chat.menuNewChat"),
              onPress: handleArchiveAndStartNew,
              icon: (
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={theme.textPrimary}
                />
              ),
            },
          ]
        : []),
      {
        label: t("chat.menuArchivedChats"),
        onPress: handleViewArchived,
        icon: (
          <Ionicons
            name="archive-outline"
            size={18}
            color={theme.textPrimary}
          />
        ),
      },
    ],
    [
      isReadOnly,
      theme,
      t,
      handleOpenSettings,
      handleArchiveAndStartNew,
      handleViewArchived,
    ]
  );

  const renderMessage: ListRenderItem<ChatMessage> = useCallback(
    ({ item, index }) => {
      if (!currentChatId) return null;
      const isLastMessage = index === renderMessages.length - 1;
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
    [
      currentChatId,
      renderMessages.length,
      handleCopyMessage,
      handleLikeMessage,
      handleSuggestionPress,
      onImagePress,
    ]
  );

  // --- KEY EXTRACTOR BLINDADO ---
  const keyExtractor = useCallback((item: ChatMessage) => {
    return item.id ? String(item.id) : `temp-${Math.random()}`;
  }, []);

  const getItemType = useCallback((item: ChatMessage) => {
    if (item.attachment_type === "audio") return "audio";
    if (item.attachment_type === "image") return "image";
    return item.role;
  }, []);

  const overrideItemLayout = useCallback((layout: any, item: ChatMessage) => {
    if (item.attachment_type === "audio") {
      layout.size = 80;
    }
  }, []);

  const renderListFooter = useMemo(
    () => (
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
            welcomeText={bootstrap?.welcome || ""}
            suggestions={bootstrap?.suggestions || []}
            onSuggestionPress={handleSuggestionPress}
            showSuggestions={renderMessages.length === 0}
          />
        )}
      </>
    ),
    [
      isLoadingMore,
      hasLoadedOnce,
      isReadOnly,
      bootstrap,
      handleSuggestionPress,
      renderMessages.length,
      theme.brand.normal,
    ]
  );

  const typingContainerStyle = {
    height: typingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 36],
    }),
    opacity: typingAnim,
    overflow: "hidden" as const,
    justifyContent: "center" as const,
  };

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
        onMorePress={(anchor: Anchor) => {
          setMenuAnchor(anchor);
          setMenuOpen(true);
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlashList
          ref={flashListRef}
          data={renderMessages} // <-- USA A LISTA FILTRADA AGORA
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          // @ts-expect-error
          estimatedItemSize={120}
          overrideItemLayout={overrideItemLayout}
          contentContainerStyle={s.flatListContent}
          keyboardShouldPersistTaps="handled"
          onEndReached={() => {
            if (!isReadOnly && !isLoadingMore && hasLoadedOnce)
              loadMoreMessages();
          }}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={renderListFooter}
        />

        <Animated.View style={typingContainerStyle}>
          <Text style={s.typingIndicator}>
            {typingMessage || t("chat.botTyping")}
          </Text>
        </Animated.View>

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
              <Text style={s.activateBannerText}>
                {t("chat.readOnlyMessage")}
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
