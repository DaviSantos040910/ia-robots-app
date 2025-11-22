// src/contexts/chat/ChatProvider.tsx

import React, { createContext, useContext, useMemo } from 'react';
import { ChatMessage } from '../../types/chat';
import { AttachmentPickerResult } from '../../services/attachmentService';

// Importação dos Hooks de Lógica (Camadas separadas)
import { useChatState, ChatData, initialChatData } from './hooks/useChatState';
import { useChatLoader } from './hooks/useChatLoader';
import { useChatSender } from './hooks/useChatSender';
import { useChatInteractions } from './hooks/useChatInteractions';

// --- DEFINIÇÃO DA INTERFACE DO CONTEXTO ---
export type ChatStore = {
  // Estado (Leitura)
  chats: Record<string, ChatData>;
  isTypingById: Record<string, boolean>;
  
  // Carregamento (Loader)
  loadInitialMessages: (chatId: string) => Promise<void>;
  loadMoreMessages: (chatId: string) => Promise<void>;
  
  // Envio (Sender)
  sendMessage: (chatId: string, text: string) => Promise<void>;
  archiveAndStartNew: (chatId: string) => Promise<string | null>;
  sendMultipleAttachments: (chatId: string, files: AttachmentPickerResult[]) => Promise<void>;
  sendAttachment: (chatId: string, file: AttachmentPickerResult) => Promise<void>;
  
  // Interações (Interactions & TTS)
  playTTS: (conversationId: string, messageId: string) => Promise<void>;
  stopTTS: () => Promise<void>;
  isTTSPlaying: boolean;
  isTTSLoading: boolean;
  currentTTSMessageId: string | null;
  handleCopyMessage: (message: ChatMessage) => void;
  handleLikeMessage: (chatId: string, message: ChatMessage) => Promise<void>;
  
  // Utilitários de Estado
  clearLocalChatState: (chatId: string) => void;
};

const ChatContext = createContext<ChatStore | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Camada de Estado
  const { 
    chats, 
    setChats, 
    isTypingById, 
    setIsTypingById, 
    activeSendPromises, 
    updateChatData 
  } = useChatState();

  // 2. Camada de Carregamento (Loader)
  const { loadInitialMessages, loadMoreMessages } = useChatLoader({ 
    chats, 
    updateChatData 
  });

  // 3. Camada de Envio (Sender)
  const { 
    sendMessage, 
    archiveAndStartNew, 
    sendMultipleAttachments, 
    sendAttachment 
  } = useChatSender({ 
    updateChatData, 
    setIsTypingById, 
    activeSendPromises 
  });

  // 4. Camada de Interações
  const { 
    playTTS, 
    stopTTS, 
    isTTSPlaying, 
    isTTSLoading, 
    currentTTSMessageId, 
    handleCopyMessage, 
    handleLikeMessage 
  } = useChatInteractions({ 
    updateChatData 
  });

  // 5. Utils
  const clearLocalChatState = React.useCallback((chatId: string) => {
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
  }, [setChats, setIsTypingById]);

  // 6. Construção do Objeto de Valor (Memoizado)
  const value = useMemo<ChatStore>(() => ({
    // Dados (Mudam)
    chats,
    isTypingById,
    isTTSPlaying,
    isTTSLoading,
    currentTTSMessageId,

    // Funções (Estáveis)
    loadInitialMessages,
    loadMoreMessages,
    sendMessage,
    archiveAndStartNew,
    sendMultipleAttachments,
    sendAttachment,
    playTTS,
    stopTTS,
    handleCopyMessage,
    handleLikeMessage,
    clearLocalChatState,
  }), [
    chats,
    isTypingById,
    isTTSPlaying,
    isTTSLoading,
    currentTTSMessageId,
    loadInitialMessages,
    loadMoreMessages,
    sendMessage,
    archiveAndStartNew,
    sendMultipleAttachments,
    sendAttachment,
    playTTS,
    stopTTS,
    handleCopyMessage,
    handleLikeMessage,
    clearLocalChatState
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// --- HOOK DE CONSUMO ---

export const useChatController = (chatId: string | null) => {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChatController must be used within ChatProvider');
  }

  const chatData = chatId ? (ctx.chats[chatId] || initialChatData) : initialChatData;
  const isTyping = chatId ? !!ctx.isTypingById[chatId] : false;

  const controller = useMemo(() => ({
    ...chatData,
    isTyping,
    
    loadInitialMessages: () => chatId ? ctx.loadInitialMessages(chatId) : Promise.resolve(),
    loadMoreMessages: () => chatId ? ctx.loadMoreMessages(chatId) : Promise.resolve(),
    sendMessage: (text: string) => chatId ? ctx.sendMessage(chatId, text) : Promise.resolve(),
    archiveAndStartNew: () => chatId ? ctx.archiveAndStartNew(chatId) : Promise.resolve(null),
    sendAttachments: (files: AttachmentPickerResult[]) => chatId ? ctx.sendMultipleAttachments(chatId, files) : Promise.resolve(),
    sendAttachment: (file: AttachmentPickerResult) => chatId ? ctx.sendAttachment(chatId, file) : Promise.resolve(),
    handleLikeMessage: (msg: ChatMessage) => chatId ? ctx.handleLikeMessage(chatId, msg) : Promise.resolve(),
    
    playTTS: ctx.playTTS,
    stopTTS: ctx.stopTTS,
    isTTSPlaying: ctx.isTTSPlaying,
    isTTSLoading: ctx.isTTSLoading,
    currentTTSMessageId: ctx.currentTTSMessageId,
    handleCopyMessage: ctx.handleCopyMessage,
    clearLocalChatState: ctx.clearLocalChatState,
  }), [
    chatId, 
    chatData,
    isTyping, 
    ctx
  ]);

  return controller;
};