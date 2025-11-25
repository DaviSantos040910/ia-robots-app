// src/contexts/chat/ChatProvider.tsx

import React, { createContext, useContext, useMemo, useCallback } from 'react';
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
  isBotVoiceMode: boolean; 
  isTTSPlaying: boolean;
  isTTSLoading: boolean;
  currentTTSMessageId: string | null;
  
  // Funções (Estáveis)
  loadInitialMessages: (chatId: string) => Promise<void>;
  loadMoreMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  sendVoiceMessage: (chatId: string, audioUri: string, durationMs: number, replyWithAudio: boolean) => Promise<void>; 
  archiveAndStartNew: (chatId: string) => Promise<string | null>;
  sendMultipleAttachments: (chatId: string, files: AttachmentPickerResult[]) => Promise<void>;
  sendAttachment: (chatId: string, file: AttachmentPickerResult) => Promise<void>;
  playTTS: (conversationId: string, messageId: string) => Promise<void>;
  stopTTS: () => Promise<void>;
  handleCopyMessage: (message: ChatMessage) => void;
  handleLikeMessage: (chatId: string, message: ChatMessage) => Promise<void>;
  toggleBotVoiceMode: () => void; 
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
    isBotVoiceMode, 
    setIsBotVoiceMode, 
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
    sendVoiceMessage, 
    archiveAndStartNew, 
    sendMultipleAttachments, 
    sendAttachment 
  } = useChatSender({ 
    updateChatData, 
    setIsTypingById, 
    activeSendPromises,
    isBotVoiceMode,
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
    toggleBotVoiceMode
  } = useChatInteractions({ 
    updateChatData,
    setIsBotVoiceMode 
  });

  // 5. Utils (Estável)
  const clearLocalChatState = useCallback((chatId: string) => {
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

  // --- FASE 2.5: Divisão do Value para Otimização ---
  
  // A. Valores de Dados (Mudam frequentemente)
  const dataValue = useMemo(() => ({
    chats,
    isTypingById,
    isBotVoiceMode,
    isTTSPlaying,
    isTTSLoading,
    currentTTSMessageId,
  }), [
    chats,
    isTypingById,
    isBotVoiceMode,
    isTTSPlaying,
    isTTSLoading,
    currentTTSMessageId,
  ]);

  // B. Funções (Estáveis - mudam muito raramente ou nunca)
  const functionsValue = useMemo(() => ({
    loadInitialMessages,
    loadMoreMessages,
    sendMessage,
    sendVoiceMessage,
    archiveAndStartNew,
    sendMultipleAttachments,
    sendAttachment,
    playTTS,
    stopTTS,
    handleCopyMessage,
    handleLikeMessage,
    toggleBotVoiceMode,
    clearLocalChatState,
  }), [
    loadInitialMessages,
    loadMoreMessages,
    sendMessage,
    sendVoiceMessage,
    archiveAndStartNew,
    sendMultipleAttachments,
    sendAttachment,
    playTTS,
    stopTTS,
    handleCopyMessage,
    handleLikeMessage,
    toggleBotVoiceMode,
    clearLocalChatState
  ]);

  // C. Combinação Final (Trigger de re-render apenas quando A ou B mudam)
  const value = useMemo<ChatStore>(() => ({
    ...dataValue,
    ...functionsValue,
  }), [dataValue, functionsValue]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// --- HOOK DE CONSUMO ---

export const useChatController = (chatId: string | null) => {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChatController must be used within ChatProvider');
  }

  // Seletor simples de dados
  const chatData = chatId ? (ctx.chats[chatId] || initialChatData) : initialChatData;
  const isTyping = chatId ? !!ctx.isTypingById[chatId] : false;

  // Construção do Controller Memoizado
  // Aqui é onde a mágica acontece: mesmo que 'ctx' mude, se as propriedades específicas
  // que este hook usa não mudarem, o objeto retornado deve ser referencialmente estável
  // (na medida do possível, embora 'ctx' mudando force o hook a rodar).
  const controller = useMemo(() => ({
    ...chatData,
    isTyping,
    // Propriedades globais reativas
    isBotVoiceMode: ctx.isBotVoiceMode,
    isTTSPlaying: ctx.isTTSPlaying,
    isTTSLoading: ctx.isTTSLoading,
    currentTTSMessageId: ctx.currentTTSMessageId,
    
    // Funções Estáveis
    loadInitialMessages: () => chatId ? ctx.loadInitialMessages(chatId) : Promise.resolve(),
    loadMoreMessages: () => chatId ? ctx.loadMoreMessages(chatId) : Promise.resolve(),
    sendMessage: (text: string) => chatId ? ctx.sendMessage(chatId, text) : Promise.resolve(),
    sendVoiceMessage: (audioUri: string, durationMs: number) => 
      chatId ? ctx.sendVoiceMessage(chatId, audioUri, durationMs, ctx.isBotVoiceMode) : Promise.resolve(),
    archiveAndStartNew: () => chatId ? ctx.archiveAndStartNew(chatId) : Promise.resolve(null),
    sendAttachments: (files: AttachmentPickerResult[]) => chatId ? ctx.sendMultipleAttachments(chatId, files) : Promise.resolve(),
    sendAttachment: (file: AttachmentPickerResult) => chatId ? ctx.sendAttachment(chatId, file) : Promise.resolve(),
    handleLikeMessage: (msg: ChatMessage) => chatId ? ctx.handleLikeMessage(chatId, msg) : Promise.resolve(),
    
    // Funções Globais
    playTTS: ctx.playTTS,
    stopTTS: ctx.stopTTS,
    toggleBotVoiceMode: ctx.toggleBotVoiceMode,
    handleCopyMessage: ctx.handleCopyMessage,
    clearLocalChatState: ctx.clearLocalChatState,
  }), [
    chatId, 
    chatData, // muda quando chegam mensagens
    isTyping, // muda ao enviar
    ctx.isBotVoiceMode,
    ctx.isTTSPlaying,
    ctx.isTTSLoading,
    ctx.currentTTSMessageId,
    // Dependências de função (estáveis, vindas do functionsValue)
    ctx.loadInitialMessages,
    ctx.loadMoreMessages,
    ctx.sendMessage,
    ctx.sendVoiceMessage,
    ctx.archiveAndStartNew,
    ctx.sendMultipleAttachments,
    ctx.sendAttachment,
    ctx.handleLikeMessage,
    ctx.playTTS,
    ctx.stopTTS,
    ctx.toggleBotVoiceMode,
    ctx.handleCopyMessage,
    ctx.clearLocalChatState
  ]);

  return controller;
};