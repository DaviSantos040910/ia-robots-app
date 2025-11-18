// src/contexts/chat/ChatProvider.tsx

import React, { createContext, useContext, useMemo, useState, useCallback, useRef } from 'react';
import { ChatMessage, PaginatedMessages } from '../../types/chat';
import { chatService } from '../../services/chatService';
import { getCachedChatData, setCachedChatData, removeCachedChatData} from '../../services/chatCacheService';
import { ChatCacheData } from '../../types/chat';
import { AttachmentPickerResult, attachmentService } from '../../services/attachmentService';
import { useTTS } from '../../hooks/useTTS';
import * as Clipboard from 'expo-clipboard';

// --- DEFINITIONS ---
type ChatData = {
  messages: ChatMessage[];
  nextPage: number | null;
  isLoadingMore: boolean;
  isLoadingInitial: boolean;
  hasLoadedOnce: boolean;
};

export type ChatStore = {
  chats: Record<string, ChatData>;
  isTypingById: Record<string, boolean>;
  loadInitialMessages: (chatId: string) => Promise<void>;
  loadMoreMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  archiveAndStartNew: (chatId: string) => Promise<string | null>;
  clearLocalChatState: (chatId: string) => void;
  sendAttachment: (chatId: string, file: AttachmentPickerResult) => Promise<void>;
  playTTS: (conversationId: string, messageId: string) => Promise<void>;
  stopTTS: () => Promise<void>;
  isTTSPlaying: boolean;
  isTTSLoading: boolean;
  currentTTSMessageId: string | null;
  handleCopyMessage: (message: ChatMessage) => void;
  handleLikeMessage: (chatId: string, message: ChatMessage) => Promise<void>;
};

const initialChatData: ChatData = {
  messages: [],
  nextPage: 1,
  isLoadingMore: false,
  isLoadingInitial: false,
  hasLoadedOnce: false,
};

const ChatContext = createContext<ChatStore | null>(null);
type ChatsState = Record<string, ChatData>;

// --- FIM DAS DEFINIÇÕES ---

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<ChatsState>({});
  const [isTypingById, setIsTypingById] = useState<Record<string, boolean>>({});
  const activeSendPromises = useRef<Record<string, Promise<void>>>({});

  // Hook do TTS
  const {
    playTTS,
    stopTTS,
    isPlaying: isTTSPlaying,
    isLoading: isTTSLoading,
    currentMessageId: currentTTSMessageId
  } = useTTS();

  // Function to update the state for a specific chat ID
  const setChatData = (chatId: string, updater: (prevData: ChatData) => Partial<ChatData>) => {
    setChats(prevChats => {
      const currentChatState = prevChats[chatId] || initialChatData;
      const updates = updater(currentChatState);
      const newMessages = updates.messages !== undefined ? updates.messages : currentChatState.messages;

      // Duplicate ID check (optional but good practice)
      if (newMessages) {
        const ids = newMessages.map(m => m.id);
        if (ids.length !== new Set(ids).size) {
          console.error(`[ChatProvider] setChatData DETECTED DUPLICATE IDs for chatId ${chatId} BEFORE setting state! IDs:`, ids);
        }
      }
      return {
        ...prevChats,
        [chatId]: {
          ...currentChatState,
          ...updates,
          messages: newMessages ?? [],
        },
      };
    });
  };

  // --- loadInitialMessages ---
  const loadInitialMessages = useCallback(async (chatId: string) => {
    let isLoading = false;
    setChats(currentChats => {
      isLoading = currentChats[chatId]?.isLoadingInitial ?? false;
      return currentChats;
    });

    if (isLoading) {
      console.log(`[ChatProvider] loadInitialMessages (${chatId}) aborted: already loading.`);
      return;
    }

    console.log(`[ChatProvider] Loading initial messages for chatId: ${chatId}`);
    setChatData(chatId, () => ({ isLoadingInitial: true, hasLoadedOnce: false }));

    // 1. Try loading from cache
    const cachedData = await getCachedChatData(chatId);
    if (cachedData) {
      console.log(`[ChatProvider] Cache hit for ${chatId}. Loading from cache.`);
      setChatData(chatId, () => ({
        messages: cachedData.messages,
        nextPage: cachedData.nextPage,
        isLoadingInitial: false,
        hasLoadedOnce: true,
      }));

      const backgroundCheck = async () => {
        try {
          console.log(`[ChatProvider] Background check for newer messages for ${chatId}`);
          const response = await chatService.getMessages(chatId, 1);
          const latestMessageTimestampInCache = cachedData.messages.length > 0
            ? cachedData.messages[cachedData.messages.length - 1]?.created_at
            : null;
          let newerMessages: ChatMessage[] = [];
          if (latestMessageTimestampInCache) {
            newerMessages = response.results.filter(
              (msg: ChatMessage) => msg.created_at > latestMessageTimestampInCache
            );
          } else {
            newerMessages = response.results;
          }

          if (newerMessages.length > 0) {
            console.log(`[ChatProvider] Found ${newerMessages.length} newer messages for ${chatId}. Merging.`);
            const messagesToAdd = newerMessages.reverse();
            setChatData(chatId, (prev) => {
              const existingIds = new Set(prev.messages.map(m => m.id));
              const uniqueNewerMessages = messagesToAdd.filter(nm => !existingIds.has(nm.id));
              if(uniqueNewerMessages.length < messagesToAdd.length){
                console.warn("[ChatProvider] Background check detected duplicates during merge");
              }
              return { messages: [...prev.messages, ...uniqueNewerMessages] };
            });
            await setCachedChatData(chatId, {
              messages: [...cachedData.messages, ...messagesToAdd.filter(nm => !cachedData.messages.some(cm => cm.id === nm.id))],
              nextPage: response.next ? 2 : null,
              timestamp: Date.now()
            });
          } else {
            console.log(`[ChatProvider] No newer messages found for ${chatId} in background check.`);
            await setCachedChatData(chatId, { ...cachedData, timestamp: Date.now() });
          }
        } catch (error) {
          console.error(`[ChatProvider] Background check failed for ${chatId}:`, error);
        }
      };
      backgroundCheck();
      return;
    }

    // 2. If no valid cache, fetch from API
    console.log(`[ChatProvider] Cache miss for ${chatId}. Fetching from API.`);
    try {
      const response = await chatService.getMessages(chatId, 1);
      console.log(`[ChatProvider] Received initial messages for ${chatId} from API. Count: ${response.results.length}. Next page exists: ${!!response.next}`);
      const apiMessages = response.results.reverse();
      const nextPageApi = response.next ? 2 : null;
      setChatData(chatId, () => ({
        messages: apiMessages,
        nextPage: nextPageApi,
        isLoadingInitial: false,
        hasLoadedOnce: true,
      }));
      await setCachedChatData(chatId, {
        messages: apiMessages,
        nextPage: nextPageApi,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`[ChatProvider] Failed to load initial messages for ${chatId} from API:`, error);
      setChatData(chatId, () => ({ isLoadingInitial: false, hasLoadedOnce: false }));
    }
  }, []);

  // --- loadMoreMessages ---
  const loadMoreMessages = useCallback(async (chatId: string) => {
    let currentChat: ChatData | undefined;
    setChats(currentChats => {
      currentChat = currentChats[chatId];
      return currentChats;
    });

    if (!currentChat || currentChat.isLoadingMore || !currentChat.nextPage || currentChat.isLoadingInitial) {
      console.log(`[ChatProvider] Skipping loadMoreMessages (${chatId}). Conditions not met.`);
      return;
    }

    const pageToFetch = currentChat.nextPage;
    console.log(`[ChatProvider] Loading more messages for chatId: ${chatId}, page: ${pageToFetch}`);
    setChatData(chatId, () => ({ isLoadingMore: true }));

    try {
      const response = await chatService.getMessages(chatId, pageToFetch);
      console.log(`[ChatProvider] Received more messages for ${chatId}. Count: ${response.results.length}. Next page exists: ${!!response.next}`);
      const nextPageApi = response.next ? pageToFetch + 1 : null;

      setChatData(chatId, (prev) => {
        const existingIds = new Set(prev.messages?.map((m: ChatMessage) => m.id) ?? []);
        const newUniqueMessages = response.results.filter((fetchedMessage: ChatMessage) => !existingIds.has(fetchedMessage.id));

        if (newUniqueMessages.length < response.results.length) {
          console.warn(`[ChatProvider] loadMoreMessages found ${response.results.length - newUniqueMessages.length} duplicate messages for page ${pageToFetch}.`);
        }

        if (newUniqueMessages.length === 0) {
          console.log(`[ChatProvider] No unique older messages found in fetched page ${pageToFetch}.`);
          return {
            isLoadingMore: false,
            nextPage: nextPageApi,
          };
        }

        console.log(`[ChatProvider] Adding ${newUniqueMessages.length} unique older messages from page ${pageToFetch}.`);
        const combinedMessages = [...newUniqueMessages.reverse(), ...(prev.messages ?? [])];
        const finalIds = combinedMessages.map((m: ChatMessage) => m.id);
        if (finalIds.length !== new Set(finalIds).size) {
          console.error('[ChatProvider] DUPLICATE IDs detected after merging in loadMoreMessages!', finalIds);
        }

        return {
          messages: combinedMessages,
          nextPage: nextPageApi,
          isLoadingMore: false,
        };
      });
    } catch (error) {
      console.error(`[ChatProvider] Failed to load more messages for ${chatId}, page ${pageToFetch}:`, error);
      setChatData(chatId, () => ({ isLoadingMore: false }));
    }
  }, []);

  // --- sendMessage ---
  const sendMessage = useCallback(async (chatId: string, text: string) => {
    if (activeSendPromises.current[chatId] !== undefined) {
      console.warn(`[ChatProvider] sendMessage (${chatId}) aborted: another send is already in progress.`);
      return;
    }

    const tempUserMsgId = `temp_user_${Date.now()}_${Math.random()}`;
    const tempUserMsg: ChatMessage = {
      id: tempUserMsgId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };

    console.log(`[ChatProvider] Sending message. Temp ID: ${tempUserMsgId}, Content: "${text}"`);

    setChatData(chatId, (prev) => ({
      messages: [...(prev.messages ?? []), tempUserMsg]
    }));

    setIsTypingById((prev) => ({ ...prev, [chatId]: true }));

    const sendPromise = chatService.sendMessage(chatId, text)
      .then((apiReplies) => {
        console.log(`[ChatProvider] Received ${apiReplies.length} replies for temp ID ${tempUserMsgId}.`);
        setIsTypingById((prev) => ({ ...prev, [chatId]: false }));

        setChats(prevChats => {
          const currentChatState = prevChats[chatId];
          if (!currentChatState) {
            console.error(`[ChatProvider] Chat state for ${chatId} not found during sendMessage update!`);
            return prevChats;
          }

          const messagesWithoutTemp = (currentChatState.messages ?? []).filter(m => m.id !== tempUserMsgId);

          if (messagesWithoutTemp.length === (currentChatState.messages?.length ?? 0)) {
            console.warn(`[ChatProvider] Temporary message ID ${tempUserMsgId} was NOT found during update!`);
          } else {
            console.log(`[ChatProvider] Temporary message ID ${tempUserMsgId} successfully removed.`);
          }

          const newFinalMessages = [...messagesWithoutTemp, ...apiReplies];
          const newFinalNextPage = currentChatState.nextPage;

          const finalIds = newFinalMessages.map(m => m.id);
          if (finalIds.length !== new Set(finalIds).size) {
            console.error('[ChatProvider] DUPLICATE IDs detected in finalMessages after sending!', finalIds);
            const uniqueMessagesMap = new Map<string, ChatMessage>();
            newFinalMessages.forEach(msg => uniqueMessagesMap.set(msg.id, msg));
            console.warn('[ChatProvider] Attempted duplicate removal.');
          } else {
            console.log('[ChatProvider] Final message list appears unique.');
          }

          console.log('[ChatProvider] Final messages count after update:', newFinalMessages.length);

          setCachedChatData(chatId, {
            messages: newFinalMessages,
            nextPage: newFinalNextPage,
            timestamp: Date.now(),
          }).catch(cacheError => {
            console.error('[Cache] Failed to save cache from within setChats (sendMessage):', cacheError);
          });

          return {
            ...prevChats,
            [chatId]: {
              ...currentChatState,
              messages: newFinalMessages,
            },
          };
        });
      })
      .catch(error => {
        console.error(`[ChatProvider] Failed to send message (temp ID ${tempUserMsgId}):`, error);
        setIsTypingById((prev) => ({ ...prev, [chatId]: false }));

        const errorMsgId = `err_${Date.now()}_${Math.random()}`;
        const errorMsg: ChatMessage = {
          id: errorMsgId,
          role: 'assistant',
          content: 'An unexpected error occurred while generating a response. Please try again.',
          created_at: new Date().toISOString()
        };

        setChatData(chatId, (prev) => {
          const messageExists = prev.messages.some(m => m.id === tempUserMsgId);
          let updatedMessages: ChatMessage[];

          if (messageExists) {
            updatedMessages = prev.messages.map(m => m.id === tempUserMsgId ? errorMsg : m);
          } else {
            console.warn(`[ChatProvider] Temp message ${tempUserMsgId} not found during error handling. Adding error message.`);
            updatedMessages = [...(prev.messages ?? []), errorMsg];
          }

          return { messages: updatedMessages };
        });
      })
      .finally(() => {
        delete activeSendPromises.current[chatId];
        console.log(`[ChatProvider] Send promise for ${chatId} (temp ID ${tempUserMsgId}) finished.`);
      });

    activeSendPromises.current[chatId] = sendPromise;
  }, []);

  // --- archiveAndStartNew ---
  const archiveAndStartNew = useCallback(async (chatId: string): Promise<string | null> => {
    console.log(`[ChatProvider] Archiving chat ${chatId} and creating new.`);
    try {
      const { new_chat_id } = await chatService.archiveAndCreateNewChat(chatId);
      console.log(`[ChatProvider] New chat ID ${new_chat_id} received. Clearing old in-memory state for ${chatId}.`);
      clearLocalChatState(chatId);
      clearLocalChatState(new_chat_id);
      return new_chat_id;
    } catch (error) {
      console.error(`[ChatProvider] Failed to archive chat ${chatId}:`, error);
      return null;
    }
  }, []);

  // --- sendAttachment ---
  // ✅ CORREÇÃO: Melhorada a lógica de substituição de mensagens temporárias
  const sendAttachment = useCallback(async (chatId: string, file: AttachmentPickerResult) => {
    console.log(`[ChatProvider] Sending attachment for chat ${chatId}:`, file.name);
    
    // Cria uma mensagem temporária para o anexo
    const tempId = `temp-attachment-${Date.now()}-${Math.random()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      role: 'user',
      content: '', // Sem conteúdo de texto
      created_at: new Date().toISOString(),
      attachment_url: file.uri, // URI local para preview
      attachment_type: file.type || 'application/octet-stream',
      original_filename: file.name,
    };

    // Adiciona o anexo à tela
    setChatData(chatId, (prev) => ({
      messages: [...(prev.messages ?? []), tempMessage],
    }));

    try {
      // Chama o attachmentService sem texto
      const apiReplies = await attachmentService.uploadAttachment(chatId, file, undefined);
      
      if (!Array.isArray(apiReplies) || apiReplies.length === 0) {
        throw new Error('Resposta inválida do servidor ao enviar anexo');
      }

      console.log('[ChatProvider] Attachment uploaded successfully, replacing temp message');

      // ✅ CORREÇÃO: Substitui a mensagem temporária pela resposta do servidor
      setChats(prev => {
        const currentChat = prev[chatId];
        if (!currentChat) return prev;

        // Filtra a mensagem temporária e adiciona a mensagem real do servidor
        const messagesWithoutTemp = currentChat.messages.filter(m => m.id !== tempId);
        const finalMessages = [...messagesWithoutTemp, ...apiReplies];

        console.log(`[ChatProvider] Messages before: ${currentChat.messages.length}, after: ${finalMessages.length}`);

        // Salva no cache
        setCachedChatData(chatId, {
          messages: finalMessages,
          nextPage: currentChat.nextPage,
          timestamp: Date.now(),
        }).catch(cacheError => {
          console.error('[Cache] Failed to save cache from within setChats (sendAttachment):', cacheError);
        });

        return {
          ...prev,
          [chatId]: {
            ...currentChat,
            messages: finalMessages,
          },
        };
      });

      console.log('[ChatProvider] Attachment sent and ACKNOWLEDGED by server.');
    } catch (error: any) {
      console.error('[ChatProvider] Failed to send attachment:', error);
      
      // Remove a mensagem temporária se o upload falhar
      setChats(prev => {
        const currentChat = prev[chatId];
        if (!currentChat) return prev;

        return {
          ...prev,
          [chatId]: {
            ...currentChat,
            messages: currentChat.messages.filter((m: ChatMessage) => m.id !== tempId),
          },
        };
      });

      throw error; // Propaga o erro para o ChatScreen
    }
  }, []);

  // --- clearLocalChatState ---
  const clearLocalChatState = useCallback((chatId: string) => {
    console.log(`[ChatProvider] Clearing local IN-MEMORY state for chatId: ${chatId}`);
    setChats(prev => {
      const newState = { ...prev };
      if (newState[chatId]) {
        newState[chatId] = { ...initialChatData };
        console.log(`[ChatProvider] In-memory state for ${chatId} reset to initial.`);
      } else {
        console.log(`[ChatProvider] No in-memory state found for ${chatId} to clear.`);
      }
      return newState;
    });
    setIsTypingById(prev => {
      const newState = { ...prev };
      delete newState[chatId];
      return newState;
    });
  }, []);

  // --- Funções de ações de mensagem ---
  const handleCopyMessage = useCallback((message: ChatMessage) => {
    if (message.content) {
      Clipboard.setStringAsync(message.content);
      console.log('[ChatProvider] Message copied to clipboard');
    }
  }, []);

  const handleLikeMessage = useCallback(async (chatId: string, message: ChatMessage) => {
    try {
      const result = await chatService.toggleMessageLike(chatId, message.id);
      
      setChats(prevChats => {
        const currentChat = prevChats[chatId];
        if (!currentChat) return prevChats;

        const updatedMessages = currentChat.messages.map(m =>
          m.id === message.id ? { ...m, liked: result.liked } : m
        );

        return {
          ...prevChats,
          [chatId]: {
            ...currentChat,
            messages: updatedMessages,
          },
        };
      });

      console.log(`[ChatProvider] Message ${message.id} like toggled: ${result.liked}`);
    } catch (error) {
      console.error('[ChatProvider] Failed to toggle like:', error);
    }
  }, []);

  // Memoize the context value
  const value = useMemo(
    () => ({
      chats,
      isTypingById,
      loadInitialMessages,
      loadMoreMessages,
      sendMessage,
      archiveAndStartNew,
      clearLocalChatState,
      sendAttachment,
      playTTS,
      stopTTS,
      isTTSPlaying,
      isTTSLoading,
      currentTTSMessageId,
      handleCopyMessage,
      handleLikeMessage,
    }),
    [
      chats,
      isTypingById,
      loadInitialMessages,
      loadMoreMessages,
      sendMessage,
      archiveAndStartNew,
      clearLocalChatState,
      sendAttachment,
      playTTS,
      stopTTS,
      isTTSPlaying,
      isTTSLoading,
      currentTTSMessageId,
      handleCopyMessage,
      handleLikeMessage,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// --- useChatController Hook ---
export const useChatController = (chatId: string | null): ChatData & {
  isTyping: boolean;
  loadInitialMessages: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  archiveAndStartNew: () => Promise<string | null>;
  clearLocalChatState: (idToClear: string) => void;
  sendAttachment: (file: AttachmentPickerResult) => Promise<void>;
  playTTS: (conversationId: string, messageId: string) => Promise<void>;
  stopTTS: () => Promise<void>;
  isTTSPlaying: boolean;
  isTTSLoading: boolean;
  currentTTSMessageId: string | null;
  handleCopyMessage: (message: ChatMessage) => void;
  handleLikeMessage: (message: ChatMessage) => Promise<void>;
} => {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChatController must be used within ChatProvider');
  }

  const chatData = chatId ? (ctx.chats[chatId] || initialChatData) : initialChatData;
  const isTyping = chatId ? !!ctx.isTypingById[chatId] : false;

  const stableLoadInitialMessages = useCallback(() => {
    if (chatId) {
      console.log(`[useChatController] Calling loadInitialMessages for ${chatId}`);
      return ctx.loadInitialMessages(chatId);
    }
    console.warn("[useChatController] Attempted to call loadInitialMessages with null chatId.");
    return Promise.resolve();
  }, [ctx, chatId]);

  const stableLoadMoreMessages = useCallback(() => {
    if (chatId) {
      console.log(`[useChatController] Calling loadMoreMessages for ${chatId}`);
      return ctx.loadMoreMessages(chatId);
    }
    console.warn("[useChatController] Attempted to call loadMoreMessages with null chatId.");
    return Promise.resolve();
  }, [ctx, chatId]);

  const stableSendMessage = useCallback((text: string) => {
    if (chatId) {
      console.log(`[useChatController] Calling sendMessage for ${chatId}`);
      return ctx.sendMessage(chatId, text);
    }
    console.warn("[useChatController] Attempted to call sendMessage with null chatId.");
    return Promise.resolve();
  }, [ctx, chatId]);

  const stableArchiveAndStartNew = useCallback(() => {
    if (chatId) {
      console.log(`[useChatController] Calling archiveAndStartNew for ${chatId}`);
      return ctx.archiveAndStartNew(chatId);
    }
    console.warn("[useChatController] Attempted to call archiveAndStartNew with null chatId.");
    return Promise.resolve(null);
  }, [ctx, chatId]);

  const stableClearLocalChatState = useCallback((idToClear: string) => {
    console.log(`[useChatController] Calling clearLocalChatState for ${idToClear}`);
    ctx.clearLocalChatState(idToClear);
  }, [ctx]);

  const stableSendAttachment = useCallback((file: AttachmentPickerResult) => {
    if (chatId) {
      console.log(`[useChatController] Calling sendAttachment for ${chatId}`);
      return ctx.sendAttachment(chatId, file);
    }
    console.warn("[useChatController] Attempted to call sendAttachment with null chatId.");
    return Promise.resolve();
  }, [ctx, chatId]);

  const stableHandleLikeMessage = useCallback((message: ChatMessage) => {
    if (chatId) {
      console.log(`[useChatController] Calling handleLikeMessage for ${chatId}`);
      return ctx.handleLikeMessage(chatId, message);
    }
    console.warn("[useChatController] Attempted to call handleLikeMessage with null chatId.");
    return Promise.resolve();
  }, [ctx, chatId]);

  return useMemo(() => ({
    ...chatData,
    isTyping: isTyping,
    loadInitialMessages: stableLoadInitialMessages,
    loadMoreMessages: stableLoadMoreMessages,
    sendMessage: stableSendMessage,
    archiveAndStartNew: stableArchiveAndStartNew,
    clearLocalChatState: stableClearLocalChatState,
    sendAttachment: stableSendAttachment,
    playTTS: ctx.playTTS,
    stopTTS: ctx.stopTTS,
    isTTSPlaying: ctx.isTTSPlaying,
    isTTSLoading: ctx.isTTSLoading,
    currentTTSMessageId: ctx.currentTTSMessageId,
    handleCopyMessage: ctx.handleCopyMessage,
    handleLikeMessage: stableHandleLikeMessage,
  }), [
    chatData,
    isTyping,
    stableLoadInitialMessages,
    stableLoadMoreMessages,
    stableSendMessage,
    stableArchiveAndStartNew,
    stableClearLocalChatState,
    stableSendAttachment,
    ctx.playTTS,
    ctx.stopTTS,
    ctx.isTTSPlaying,
    ctx.isTTSLoading,
    ctx.currentTTSMessageId,
    ctx.handleCopyMessage,
    stableHandleLikeMessage,
  ]);
};
