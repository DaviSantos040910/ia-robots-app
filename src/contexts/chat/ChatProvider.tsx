// src/contexts/chat/ChatProvider.tsx
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { ChatMessage, PaginatedMessages } from '../../types/chat';
import { chatService } from '../../services/chatService';

// New shape for storing chat data, including pagination info.
type ChatData = {
  messages: ChatMessage[];
  nextPage: number | null;
  isLoadingMore: boolean;
  isInitialLoad: boolean;
};

export type ChatStore = {
  chats: Record<string, ChatData>;
  isTypingById: Record<string, boolean>;
  
  loadInitialMessages: (chatId: string) => Promise<void>;
  loadMoreMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  archiveAndStartNew: (chatId: string) => Promise<string | null>; // Returns the new chat ID
};

const ChatContext = createContext<ChatStore | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Record<string, ChatData>>({});
  const [isTypingById, setIsTypingById] = useState<Record<string, boolean>>({});

  const setChatData = (chatId: string, data: Partial<ChatData>) => {
    setChats(prev => ({
      ...prev,
      [chatId]: {
        ...prev[chatId] || { messages: [], nextPage: 1, isLoadingMore: false, isInitialLoad: true },
        ...data,
      },
    }));
  };

  const loadInitialMessages = useCallback(async (chatId: string) => {
    if (chats[chatId] && !chats[chatId].isInitialLoad) return;

    setChatData(chatId, { isInitialLoad: true });
    try {
      const response = await chatService.getMessages(chatId, 1);
      // Messages from API are newest first, but FlatList inverted needs them oldest first.
      // So we reverse the initial batch.
      setChatData(chatId, {
        messages: response.results.reverse(),
        nextPage: response.next ? 2 : null,
        isInitialLoad: false,
      });
    } catch (error) {
      console.error("Failed to load initial messages:", error);
      setChatData(chatId, { isInitialLoad: false });
    }
  }, [chats]);

  const loadMoreMessages = useCallback(async (chatId: string) => {
    const chat = chats[chatId];
    if (!chat || chat.isLoadingMore || !chat.nextPage) return;

    setChatData(chatId, { isLoadingMore: true });
    try {
      const response = await chatService.getMessages(chatId, chat.nextPage);
      setChatData(chatId, {
        // Prepend older messages to the beginning of the list for inverted FlatList
        messages: [...response.results.reverse(), ...chat.messages],
        nextPage: response.next ? chat.nextPage + 1 : null,
        isLoadingMore: false,
      });
    } catch (error) {
      console.error("Failed to load more messages:", error);
      setChatData(chatId, { isLoadingMore: false });
    }
  }, [chats]);
  
  // --- FUNÇÃO CORRIGIDA ---
  const sendMessage = async (chatId: string, text: string) => {
    // 1. Create a temporary user message for immediate UI update (optimistic response)
    const tempUserMsg: ChatMessage = { 
      id: `temp_${Date.now()}`, 
      role: 'user', 
      content: text, 
      created_at: new Date().toISOString() 
    };
    
    // 2. Add the temporary message to the end of the current messages array
    setChatData(chatId, { messages: [...(chats[chatId]?.messages || []), tempUserMsg] });
    setIsTypingById((prev: Record<string, boolean>) => ({ ...prev, [chatId]: true }));
    
    try {
      // 3. Send the message to the backend. The service handles the correct payload.
      const aiReply = await chatService.sendMessage(chatId, text);
      
      // 4. On success, add the AI's reply to the messages list.
      // We don't need to update the user's message as the backend already saved it.
      // We simply remove our temporary message and add the AI's response.
      setChatData(chatId, { 
        messages: [...(chats[chatId]?.messages || []).filter(m => m.id !== tempUserMsg.id), aiReply] 
      });

    } catch (error) {
      console.error("Failed to send message:", error);
      // Optional: Add an error message to the chat UI
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I could not send your message. Please try again.',
        created_at: new Date().toISOString()
      };
      setChatData(chatId, { messages: [...(chats[chatId]?.messages || []).filter(m => m.id !== tempUserMsg.id), errorMsg] });

    } finally {
      setIsTypingById((prev: Record<string, boolean>) => ({ ...prev, [chatId]: false }));
    }
  };
  
  const archiveAndStartNew = useCallback(async (chatId: string): Promise<string | null> => {
    try {
      const { new_chat_id } = await chatService.archiveAndCreateNewChat(chatId);
      
      setChats(prev => {
        const newState = { ...prev };
        delete newState[chatId];
        return newState;
      });
      
      return new_chat_id;
    } catch (error) {
      console.error("Failed to archive chat:", error);
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({ chats, isTypingById, loadInitialMessages, loadMoreMessages, sendMessage, archiveAndStartNew }),
    [chats, isTypingById, loadInitialMessages, loadMoreMessages, sendMessage, archiveAndStartNew]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Custom hook to interact with a specific chat's state
export const useChatController = (chatId: string) => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatController must be used within ChatProvider');
  
  const chatData = ctx.chats[chatId] || { messages: [], nextPage: 1, isLoadingMore: false, isInitialLoad: true };

  return {
    ...chatData,
    isTyping: !!ctx.isTypingById[chatId],
    loadInitialMessages: () => ctx.loadInitialMessages(chatId),
    loadMoreMessages: () => ctx.loadMoreMessages(chatId),
    sendMessage: (text: string) => ctx.sendMessage(chatId, text),
    archiveAndStartNew: () => ctx.archiveAndStartNew(chatId),
  };
};