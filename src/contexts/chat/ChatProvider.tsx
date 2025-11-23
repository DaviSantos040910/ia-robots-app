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
  isBotVoiceMode: boolean; // NOVO
  
  // Carregamento (Loader)
  loadInitialMessages: (chatId: string) => Promise<void>;
  loadMoreMessages: (chatId: string) => Promise<void>;
  
  // Envio (Sender)
  sendMessage: (chatId: string, text: string) => Promise<void>;
  sendVoiceMessage: (chatId: string, audioUri: string, durationMs: number, replyWithAudio: boolean) => Promise<void>; // NOVO
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
  toggleBotVoiceMode: () => void; // NOVO
  
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
    isBotVoiceMode, // NOVO
    setIsBotVoiceMode, // NOVO
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
    sendVoiceMessage, // NOVO
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
    handleLikeMessage,
    toggleBotVoiceMode // NOVO
  } = useChatInteractions({ 
    updateChatData,
    setIsBotVoiceMode // Injeta o setter
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
    isBotVoiceMode, // Exportado
    isTTSPlaying,
    isTTSLoading,
    currentTTSMessageId,

    // Funções (Estáveis)
    loadInitialMessages,
    loadMoreMessages,
    sendMessage,
    sendVoiceMessage, // Exportado
    archiveAndStartNew,
    sendMultipleAttachments,
    sendAttachment,
    playTTS,
    stopTTS,
    handleCopyMessage,
    handleLikeMessage,
    toggleBotVoiceMode, // Exportado
    clearLocalChatState,
  }), [
    chats,
    isTypingById,
    isBotVoiceMode, // Dependência
    isTTSPlaying,
    isTTSLoading,
    currentTTSMessageId,
    loadInitialMessages,
    loadMoreMessages,
    sendMessage,
    sendVoiceMessage, // Dependência
    archiveAndStartNew,
    sendMultipleAttachments,
    sendAttachment,
    playTTS,
    stopTTS,
    handleCopyMessage,
    handleLikeMessage,
    toggleBotVoiceMode, // Dependência
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
    // Propriedades globais
    isBotVoiceMode: ctx.isBotVoiceMode,
    
    loadInitialMessages: () => chatId ? ctx.loadInitialMessages(chatId) : Promise.resolve(),
    loadMoreMessages: () => chatId ? ctx.loadMoreMessages(chatId) : Promise.resolve(),
    sendMessage: (text: string) => chatId ? ctx.sendMessage(chatId, text) : Promise.resolve(),
    // NOVO: Wrapper seguro
    sendVoiceMessage: (audioUri: string, durationMs: number) => 
      chatId ? ctx.sendVoiceMessage(chatId, audioUri, durationMs, ctx.isBotVoiceMode) : Promise.resolve(),

    archiveAndStartNew: () => chatId ? ctx.archiveAndStartNew(chatId) : Promise.resolve(null),
    sendAttachments: (files: AttachmentPickerResult[]) => chatId ? ctx.sendMultipleAttachments(chatId, files) : Promise.resolve(),
    sendAttachment: (file: AttachmentPickerResult) => chatId ? ctx.sendAttachment(chatId, file) : Promise.resolve(),
    handleLikeMessage: (msg: ChatMessage) => chatId ? ctx.handleLikeMessage(chatId, msg) : Promise.resolve(),
    
    playTTS: ctx.playTTS,
    stopTTS: ctx.stopTTS,
    toggleBotVoiceMode: ctx.toggleBotVoiceMode,
    isTTSPlaying: ctx.isTTSPlaying,
    isTTSLoading: ctx.isTTSLoading,
    currentTTSMessageId: ctx.currentTTSMessageId,
    handleCopyMessage: ctx.handleCopyMessage,
    clearLocalChatState: ctx.clearLocalChatState,
  }), [
    chatId, 
    chatData,
    isTyping, 
    ctx // Como o contexto já é memoizado, é seguro usar como dependência
  ]);

  return controller;
};