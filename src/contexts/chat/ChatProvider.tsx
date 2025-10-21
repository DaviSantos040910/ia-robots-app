// src/contexts/chat/ChatProvider.tsx
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { ChatMessage, PaginatedMessages } from '../../types/chat';
import { chatService } from '../../services/chatService';

// Função auxiliar para criar um atraso
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  archiveAndStartNew: (chatId: string) => Promise<string | null>;
};

const ChatContext = createContext<ChatStore | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Record<string, ChatData>>({});
  const [isTypingById, setIsTypingById] = useState<Record<string, boolean>>({});

  // --- FUNÇÃO DE ESTADO ATUALIZADA ---
  // Esta função agora usa um callback para garantir que estamos sempre a modificar o estado MAIS RECENTE.
  const setChatData = (chatId: string, updater: (prevData: ChatData) => ChatData) => {
    setChats(prevChats => ({
      ...prevChats,
      [chatId]: updater(prevChats[chatId] || { messages: [], nextPage: 1, isLoadingMore: false, isInitialLoad: true }),
    }));
  };

  const loadInitialMessages = useCallback(async (chatId: string) => {
    if (chats[chatId] && !chats[chatId].isInitialLoad) return;
    
    setChatData(chatId, (prev) => ({ ...prev, isInitialLoad: true }));
    try {
      const response = await chatService.getMessages(chatId, 1);
      setChatData(chatId, (prev) => ({
        ...prev,
        messages: response.results.reverse(), // Reverter para FlatList invertida
        nextPage: response.next ? 2 : null,
        isInitialLoad: false,
      }));
    } catch (error) {
      console.error("Failed to load initial messages:", error);
      setChatData(chatId, (prev) => ({ ...prev, isInitialLoad: false }));
    }
  }, [chats]); // A dependência 'chats' está correta aqui

  const loadMoreMessages = useCallback(async (chatId: string) => {
    const chat = chats[chatId];
    if (!chat || chat.isLoadingMore || !chat.nextPage) return;

    setChatData(chatId, (prev) => ({ ...prev, isLoadingMore: true }));
    try {
      const response = await chatService.getMessages(chatId, chat.nextPage);
      setChatData(chatId, (prev) => ({
        ...prev,
        messages: [...response.results.reverse(), ...prev.messages], // Adicionar mensagens antigas ao início
        nextPage: response.next ? ((prev.nextPage ?? 1) + 1) : null,
        isLoadingMore: false,
      }));
    } catch (error) {
      console.error("Failed to load more messages:", error);
      setChatData(chatId, (prev) => ({ ...prev, isLoadingMore: false }));
    }
  }, [chats]); // A dependência 'chats' está correta aqui
  
  // --- FUNÇÃO SENDMESSAGE TOTALMENTE CORRIGIDA ---
  const sendMessage = async (chatId: string, text: string) => {
    const tempUserMsg: ChatMessage = { 
      id: `temp_${Date.now()}`, 
      role: 'user', 
      content: text, 
      created_at: new Date().toISOString() 
    };
    
    // 1. Adicionar mensagem do utilizador de forma otimista (usando o updater)
    setChatData(chatId, (prev) => ({
      ...prev,
      messages: [...prev.messages, tempUserMsg]
    }));
    
    setIsTypingById((prev: Record<string, boolean>) => ({ ...prev, [chatId]: true }));
    
    try {
      // 2. Enviar mensagem e receber um ARRAY de respostas da IA
      const aiReplies = await chatService.sendMessage(chatId, text);
      
      setIsTypingById((prev: Record<string, boolean>) => ({ ...prev, [chatId]: false }));

      // 3. Atualizar o estado: remover a mensagem temporária
      setChatData(chatId, (prev) => ({
        ...prev,
        messages: prev.messages.filter(m => m.id !== tempUserMsg.id)
      }));

      // 4. Adicionar as respostas REAIS da IA, uma a uma, com um atraso
      for (const reply of aiReplies) {
        setChatData(chatId, (prev) => ({
          ...prev,
          messages: [...prev.messages, reply]
        }));
        // Atraso para um efeito de "digitação" natural
        await sleep(500 + Math.random() * 500);
      }

    } catch (error) {
      console.error("Failed to send message:", error);
      setIsTypingById((prev: Record<string, boolean>) => ({ ...prev, [chatId]: false }));
      
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I could not send your message. Please try again.',
        created_at: new Date().toISOString()
      };
      
      // Atualizar o estado para remover a mensagem temporária e adicionar a de erro
      setChatData(chatId, (prev) => ({
        ...prev,
        messages: [...prev.messages.filter(m => m.id !== tempUserMsg.id), errorMsg]
      }));
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

// ... (hook useChatController sem alterações)
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