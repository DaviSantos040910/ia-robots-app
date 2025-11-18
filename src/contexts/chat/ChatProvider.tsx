// src/contexts/chat/ChatProvider.tsx

import React, { createContext, useContext, useMemo, useState, useCallback, useRef } from 'react';
import { ChatMessage } from '../../types/chat';
import { chatService } from '../../services/chatService';
import { getCachedChatData, setCachedChatData } from '../../services/chatCacheService';
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
  // Alterado: Suporte a envio múltiplo
  sendMultipleAttachments: (chatId: string, files: AttachmentPickerResult[]) => Promise<void>;
  // Mantido para retrocompatibilidade (redireciona para múltiplo)
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

  const setChatData = (chatId: string, updater: (prevData: ChatData) => Partial<ChatData>) => {
    setChats(prevChats => {
      const currentChatState = prevChats[chatId] || initialChatData;
      const updates = updater(currentChatState);
      const newMessages = updates.messages !== undefined ? updates.messages : currentChatState.messages;

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

    if (isLoading) return;

    setChatData(chatId, () => ({ isLoadingInitial: true, hasLoadedOnce: false }));

    const cachedData = await getCachedChatData(chatId);
    if (cachedData) {
      setChatData(chatId, () => ({
        messages: cachedData.messages,
        nextPage: cachedData.nextPage,
        isLoadingInitial: false,
        hasLoadedOnce: true,
      }));

      const backgroundCheck = async () => {
        try {
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
            const messagesToAdd = newerMessages.reverse();
            setChatData(chatId, (prev) => {
              const existingIds = new Set(prev.messages.map(m => m.id));
              const uniqueNewerMessages = messagesToAdd.filter(nm => !existingIds.has(nm.id));
              return { messages: [...prev.messages, ...uniqueNewerMessages] };
            });
            await setCachedChatData(chatId, {
              messages: [...cachedData.messages, ...messagesToAdd.filter(nm => !cachedData.messages.some(cm => cm.id === nm.id))],
              nextPage: response.next ? 2 : null,
              timestamp: Date.now()
            });
          } else {
            await setCachedChatData(chatId, { ...cachedData, timestamp: Date.now() });
          }
        } catch (error) {
          console.error(`[ChatProvider] Background check failed for ${chatId}:`, error);
        }
      };
      backgroundCheck();
      return;
    }

    try {
      const response = await chatService.getMessages(chatId, 1);
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
      console.error(`[ChatProvider] Failed to load initial messages for ${chatId}:`, error);
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
      return;
    }

    const pageToFetch = currentChat.nextPage;
    setChatData(chatId, () => ({ isLoadingMore: true }));

    try {
      const response = await chatService.getMessages(chatId, pageToFetch);
      const nextPageApi = response.next ? pageToFetch + 1 : null;

      setChatData(chatId, (prev) => {
        const existingIds = new Set(prev.messages?.map((m: ChatMessage) => m.id) ?? []);
        const newUniqueMessages = response.results.filter((fetchedMessage: ChatMessage) => !existingIds.has(fetchedMessage.id));

        if (newUniqueMessages.length === 0) {
          return {
            isLoadingMore: false,
            nextPage: nextPageApi,
          };
        }

        const combinedMessages = [...newUniqueMessages.reverse(), ...(prev.messages ?? [])];
        return {
          messages: combinedMessages,
          nextPage: nextPageApi,
          isLoadingMore: false,
        };
      });
    } catch (error) {
      console.error(`[ChatProvider] Failed to load more messages for ${chatId}:`, error);
      setChatData(chatId, () => ({ isLoadingMore: false }));
    }
  }, []);

  // --- sendMessage ---
  const sendMessage = useCallback(async (chatId: string, text: string) => {
    if (activeSendPromises.current[chatId] !== undefined) return;

    const tempUserMsgId = `temp_user_${Date.now()}_${Math.random()}`;
    const tempUserMsg: ChatMessage = {
      id: tempUserMsgId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };

    setChatData(chatId, (prev) => ({
      messages: [...(prev.messages ?? []), tempUserMsg]
    }));

    setIsTypingById((prev) => ({ ...prev, [chatId]: true }));

    const sendPromise = chatService.sendMessage(chatId, text)
      .then((apiReplies) => {
        setIsTypingById((prev) => ({ ...prev, [chatId]: false }));

        setChats(prevChats => {
          const currentChatState = prevChats[chatId];
          if (!currentChatState) return prevChats;

          const messagesWithoutTemp = (currentChatState.messages ?? []).filter(m => m.id !== tempUserMsgId);
          const newFinalMessages = [...messagesWithoutTemp, ...apiReplies];

          setCachedChatData(chatId, {
            messages: newFinalMessages,
            nextPage: currentChatState.nextPage,
            timestamp: Date.now(),
          }).catch(err => console.error(err));

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
        console.error(`[ChatProvider] Failed to send message:`, error);
        setIsTypingById((prev) => ({ ...prev, [chatId]: false }));
        
        const errorMsg: ChatMessage = {
            id: `err_${Date.now()}`,
            role: 'assistant',
            content: 'Error sending message. Please try again.',
            created_at: new Date().toISOString()
        };

        setChatData(chatId, (prev) => ({
             messages: prev.messages.map(m => m.id === tempUserMsgId ? errorMsg : m)
        }));
      })
      .finally(() => {
        delete activeSendPromises.current[chatId];
      });

    activeSendPromises.current[chatId] = sendPromise;
  }, []);

  // --- archiveAndStartNew ---
  const archiveAndStartNew = useCallback(async (chatId: string): Promise<string | null> => {
    try {
      const { new_chat_id } = await chatService.archiveAndCreateNewChat(chatId);
      clearLocalChatState(chatId);
      clearLocalChatState(new_chat_id);
      return new_chat_id;
    } catch (error) {
      console.error(`[ChatProvider] Failed to archive chat:`, error);
      return null;
    }
  }, []);

  // --- sendMultipleAttachments (NOVA FUNÇÃO EM LOTE) ---
  const sendMultipleAttachments = useCallback(async (chatId: string, files: AttachmentPickerResult[]) => {
    if (!files.length) return;

    console.log(`[ChatProvider] Sending ${files.length} attachments for chat ${chatId}`);

    // 1. Cria mensagens temporárias para TODOS os arquivos
    const tempMessages: ChatMessage[] = files.map(file => ({
      id: `temp-att-${Date.now()}-${Math.random()}`,
      role: 'user',
      content: '',
      created_at: new Date().toISOString(),
      attachment_url: file.uri,
      attachment_type: file.type || 'application/octet-stream',
      original_filename: file.name,
    }));

    const tempIds = new Set(tempMessages.map(m => m.id));

    // 2. Atualiza UI imediatamente (Optimistic UI)
    setChatData(chatId, (prev) => ({
      messages: [...(prev.messages ?? []), ...tempMessages],
    }));

    try {
      // 3. Chama o serviço de batch upload
      const apiReplies = await attachmentService.uploadBatchAttachments(chatId, files);
      
      if (!Array.isArray(apiReplies)) {
        throw new Error('Invalid server response for batch upload');
      }

      console.log('[ChatProvider] Batch upload success. Updating messages.');

      // 4. Substitui temporários pelos reais
      setChats(prev => {
        const currentChat = prev[chatId];
        if (!currentChat) return prev;

        // Remove TODOS os temporários criados neste batch
        const messagesClean = currentChat.messages.filter(m => !tempIds.has(m.id));
        // Adiciona TODAS as respostas da API
        const finalMessages = [...messagesClean, ...apiReplies];

        setCachedChatData(chatId, {
          messages: finalMessages,
          nextPage: currentChat.nextPage,
          timestamp: Date.now(),
        }).catch(console.error);

        return {
          ...prev,
          [chatId]: {
            ...currentChat,
            messages: finalMessages,
          },
        };
      });

    } catch (error: any) {
      console.error('[ChatProvider] Batch upload failed:', error);
      
      // Em caso de erro, remove os temporários
      setChats(prev => {
        const currentChat = prev[chatId];
        if (!currentChat) return prev;
        return {
          ...prev,
          [chatId]: {
            ...currentChat,
            messages: currentChat.messages.filter(m => !tempIds.has(m.id)),
          },
        };
      });

      throw error;
    }
  }, []);

  // --- sendAttachment (Wrapper para compatibilidade) ---
  const sendAttachment = useCallback(async (chatId: string, file: AttachmentPickerResult) => {
    return sendMultipleAttachments(chatId, [file]);
  }, [sendMultipleAttachments]);

  // --- clearLocalChatState ---
  const clearLocalChatState = useCallback((chatId: string) => {
    setChats(prev => {
      const newState = { ...prev };
      if (newState[chatId]) {
        newState[chatId] = { ...initialChatData };
      }
      return newState;
    });
    setIsTypingById(prev => {
      const newState = { ...prev };
      delete newState[chatId];
      return newState;
    });
  }, []);

  const handleCopyMessage = useCallback((message: ChatMessage) => {
    if (message.content) {
      Clipboard.setStringAsync(message.content);
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
    } catch (error) {
      console.error('[ChatProvider] Failed to toggle like:', error);
    }
  }, []);

  const value = useMemo(
    () => ({
      chats,
      isTypingById,
      loadInitialMessages,
      loadMoreMessages,
      sendMessage,
      archiveAndStartNew,
      clearLocalChatState,
      sendMultipleAttachments, // Nova função exposta
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
      sendMultipleAttachments,
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
export const useChatController = (chatId: string | null) => {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChatController must be used within ChatProvider');
  }

  const chatData = chatId ? (ctx.chats[chatId] || initialChatData) : initialChatData;
  const isTyping = chatId ? !!ctx.isTypingById[chatId] : false;

  const stableLoadInitialMessages = useCallback(() => {
    if (chatId) return ctx.loadInitialMessages(chatId);
    return Promise.resolve();
  }, [ctx, chatId]);

  const stableLoadMoreMessages = useCallback(() => {
    if (chatId) return ctx.loadMoreMessages(chatId);
    return Promise.resolve();
  }, [ctx, chatId]);

  const stableSendMessage = useCallback((text: string) => {
    if (chatId) return ctx.sendMessage(chatId, text);
    return Promise.resolve();
  }, [ctx, chatId]);

  const stableArchiveAndStartNew = useCallback(() => {
    if (chatId) return ctx.archiveAndStartNew(chatId);
    return Promise.resolve(null);
  }, [ctx, chatId]);

  const stableSendAttachments = useCallback((files: AttachmentPickerResult[]) => {
    if (chatId) return ctx.sendMultipleAttachments(chatId, files);
    return Promise.resolve();
  }, [ctx, chatId]);

  // Compatibilidade
  const stableSendAttachment = useCallback((file: AttachmentPickerResult) => {
      if(chatId) return ctx.sendMultipleAttachments(chatId, [file]);
      return Promise.resolve();
  }, [ctx, chatId]);

  return {
    ...chatData,
    isTyping,
    loadInitialMessages: stableLoadInitialMessages,
    loadMoreMessages: stableLoadMoreMessages,
    sendMessage: stableSendMessage,
    archiveAndStartNew: stableArchiveAndStartNew,
    clearLocalChatState: ctx.clearLocalChatState,
    sendAttachments: stableSendAttachments,
    sendAttachment: stableSendAttachment, // Mantido por compatibilidade
    playTTS: ctx.playTTS,
    stopTTS: ctx.stopTTS,
    isTTSPlaying: ctx.isTTSPlaying,
    isTTSLoading: ctx.isTTSLoading,
    currentTTSMessageId: ctx.currentTTSMessageId,
    handleCopyMessage: ctx.handleCopyMessage,
    handleLikeMessage: (msg: ChatMessage) => chatId ? ctx.handleLikeMessage(chatId, msg) : Promise.resolve(),
  };
};