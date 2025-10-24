// src/contexts/chat/ChatProvider.tsx
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { ChatMessage, PaginatedMessages } from '../../types/chat';
import { chatService } from '../../services/chatService';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  clearLocalChatState: (chatId: string) => void; // A definição aqui está correta
};

const ChatContext = createContext<ChatStore | null>(null);

const initialChatData: ChatData = {
    messages: [],
    nextPage: 1,
    isLoadingMore: false,
    isLoadingInitial: false,
    hasLoadedOnce: false,
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Record<string, ChatData>>({});
  const [isTypingById, setIsTypingById] = useState<Record<string, boolean>>({});

  const setChatData = (chatId: string, updater: (prevData: ChatData) => Partial<ChatData>) => {
    setChats(prevChats => ({
      ...prevChats,
      [chatId]: {
        ...(prevChats[chatId] || initialChatData),
        ...updater(prevChats[chatId] || initialChatData),
      },
    }));
  };

  const loadInitialMessages = useCallback(async (chatId: string) => {
    // Check internal state directly using chats[chatId]
    const currentChat = chats[chatId];
    if (!currentChat || currentChat.isLoadingInitial || currentChat.hasLoadedOnce) return;

    console.log(`[ChatProvider] Loading initial messages for chatId: ${chatId}`);
    // Use updater function form for state setting
    setChatData(chatId, (prev) => ({ ...prev, isLoadingInitial: true }));
    try {
      const response = await chatService.getMessages(chatId, 1);
      setChatData(chatId, (prev) => ({
        ...prev,
        messages: response.results.reverse(),
        nextPage: response.next ? 2 : null,
        isLoadingInitial: false,
        hasLoadedOnce: true,
      }));
    } catch (error) {
      console.error(`[ChatProvider] Failed to load initial messages for ${chatId}:`, error);
      setChatData(chatId, (prev) => ({ ...prev, isLoadingInitial: false }));
    }
  }, [chats]); // chats dependency is needed here

  const loadMoreMessages = useCallback(async (chatId: string) => {
    const chat = chats[chatId];
    if (!chat || chat.isLoadingMore || !chat.nextPage) return;

    console.log(`[ChatProvider] Loading more messages for chatId: ${chatId}, page: ${chat.nextPage}`);
    setChatData(chatId, (prev) => ({ ...prev, isLoadingMore: true }));
    try {
      const response = await chatService.getMessages(chatId, chat.nextPage);
      setChatData(chatId, (prev) => ({
        ...prev,
        messages: [...response.results.reverse(), ...prev.messages],
        nextPage: response.next ? (prev.nextPage || 1) + 1 : null,
        isLoadingMore: false,
      }));
    } catch (error) {
      console.error(`[ChatProvider] Failed to load more messages for ${chatId}:`, error);
      setChatData(chatId, (prev) => ({ ...prev, isLoadingMore: false }));
    }
  }, [chats]); // chats dependency is needed here

  const sendMessage = async (chatId: string, text: string) => {
      const tempUserMsg: ChatMessage = {
          id: `temp_${Date.now()}`,
          role: 'user',
          content: text,
          created_at: new Date().toISOString()
      };
      setChatData(chatId, (prev) => ({ ...prev, messages: [...prev.messages, tempUserMsg] }));
      setIsTypingById((prev) => ({ ...prev, [chatId]: true }));
      try {
          const aiReplies = await chatService.sendMessage(chatId, text);
          setIsTypingById((prev) => ({ ...prev, [chatId]: false }));
          setChatData(chatId, (prev) => {
              const currentMessages = prev.messages.filter(m => m.id !== tempUserMsg.id);
              return { ...prev, messages: [...currentMessages, ...aiReplies] };
          });
      } catch (error) {
          console.error("Failed to send message:", error);
          setIsTypingById((prev) => ({ ...prev, [chatId]: false }));
          const errorMsg: ChatMessage = {
              id: `err_${Date.now()}`,
              role: 'assistant',
              content: 'Sorry, I could not send your message. Please try again.',
              created_at: new Date().toISOString()
          };
          setChatData(chatId, (prev) => ({
              ...prev,
              messages: [...prev.messages.filter(m => m.id !== tempUserMsg.id), errorMsg]
          }));
      }
  };

  const archiveAndStartNew = useCallback(async (chatId: string): Promise<string | null> => {
      try {
          const { new_chat_id } = await chatService.archiveAndCreateNewChat(chatId);
          clearLocalChatState(chatId);
          return new_chat_id;
      } catch (error) {
          console.error("Failed to archive chat:", error);
          return null;
      }
  }, []); // Removed clearLocalChatState from dependencies as it's defined in the same scope

  const clearLocalChatState = useCallback((chatId: string) => { // useCallback is fine here
      setChats(prev => {
          const newState = { ...prev };
          delete newState[chatId];
          return newState;
      });
      setIsTypingById(prev => {
          const newState = { ...prev };
          delete newState[chatId];
          return newState;
      });
  }, []); // No dependencies needed

  const value = useMemo(
    () => ({ chats, isTypingById, loadInitialMessages, loadMoreMessages, sendMessage, archiveAndStartNew, clearLocalChatState }),
    [chats, isTypingById, loadInitialMessages, loadMoreMessages, sendMessage, archiveAndStartNew, clearLocalChatState] // Added clearLocalChatState
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// --- HOOK ATUALIZADO ---
export const useChatController = (chatId: string | null) => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatController must be used within ChatProvider');
  
  const chatData = chatId ? (ctx.chats[chatId] || initialChatData) : initialChatData;
  const isTyping = chatId ? !!ctx.isTypingById[chatId] : false;

  // --- CORREÇÃO APLICADA AQUI ---
  // A função clearLocalChatState retornada pelo hook agora aceita o chatId como argumento.
  const clearChatStateCallback = useCallback((idToClear: string) => {
      // Chama a função clearLocalChatState do contexto com o ID fornecido.
      ctx.clearLocalChatState(idToClear);
  }, [ctx]); // ctx é a dependência

  return {
    ...chatData,
    isTyping: isTyping,
    loadInitialMessages: useCallback(() => {
      if (chatId) return ctx.loadInitialMessages(chatId);
      return Promise.resolve();
    }, [ctx, chatId]),
    loadMoreMessages: useCallback(() => {
        if (chatId) return ctx.loadMoreMessages(chatId);
        return Promise.resolve();
    }, [ctx, chatId]),
    sendMessage: useCallback((text: string) => {
        if (chatId) return ctx.sendMessage(chatId, text);
        return Promise.resolve();
    }, [ctx, chatId]),
    archiveAndStartNew: useCallback(() => {
        if (chatId) return ctx.archiveAndStartNew(chatId);
        return Promise.resolve(null);
    }, [ctx, chatId]),
    // Retorna a função corrigida que aceita o argumento
    clearLocalChatState: clearChatStateCallback, 
  };
};