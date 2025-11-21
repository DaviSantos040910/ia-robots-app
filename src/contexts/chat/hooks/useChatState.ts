import { useState, useRef, useCallback } from 'react';
import { ChatMessage } from '../../../types/chat';

// --- TYPES & CONSTANTS ---

export type ChatData = {
  messages: ChatMessage[];
  nextPage: number | null;
  isLoadingMore: boolean;
  isLoadingInitial: boolean;
  hasLoadedOnce: boolean;
};

export const initialChatData: ChatData = {
  messages: [],
  nextPage: 1,
  isLoadingMore: false,
  isLoadingInitial: false,
  hasLoadedOnce: false,
};

type ChatsState = Record<string, ChatData>;

// --- HOOK IMPLEMENTATION ---

export const useChatState = () => {
  // Armazena o estado de todas as conversas carregadas
  const [chats, setChats] = useState<ChatsState>({});
  
  // Armazena o estado de digitação (loading de envio) por ID de chat
  const [isTypingById, setIsTypingById] = useState<Record<string, boolean>>({});
  
  // Ref para evitar envios duplicados (race conditions), não dispara re-render
  const activeSendPromises = useRef<Record<string, Promise<void>>>({});

  /**
   * Atualiza atomicamente os dados de um chat específico.
   * Usa a forma funcional do setState para garantir que não dependemos
   * de closures obsoletos (stale closures) em operações assíncronas.
   */
  const updateChatData = useCallback((
    chatId: string, 
    updater: (prevData: ChatData) => Partial<ChatData>
  ) => {
    setChats(prevChats => {
      // Recupera o estado atual ou inicializa se não existir
      const currentChatState = prevChats[chatId] || initialChatData;
      
      // Calcula as atualizações baseadas no estado anterior
      const updates = updater(currentChatState);
      
      // Garante que a lista de mensagens seja preservada se não for atualizada
      const newMessages = updates.messages !== undefined 
        ? updates.messages 
        : currentChatState.messages;

      return {
        ...prevChats,
        [chatId]: {
          ...currentChatState,
          ...updates,
          messages: newMessages ?? [],
        },
      };
    });
  }, []);

  return {
    chats,
    setChats, // Exposto caso precise de reset total
    isTypingById,
    setIsTypingById,
    activeSendPromises,
    updateChatData,
  };
};