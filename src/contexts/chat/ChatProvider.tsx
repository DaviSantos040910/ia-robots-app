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

// --- CORRIGIDO NOVAMENTE: Função auxiliar para remover duplicatas (mais segura) ---
const uniqueMessagesById = (messages: ChatMessage[]): ChatMessage[] => {
  // Garante que a entrada seja um array válido
  if (!Array.isArray(messages)) {
    console.error('uniqueMessagesById received non-array input:', messages);
    return [];
  }

  const seenIds = new Set<string>();
  const unique: ChatMessage[] = [];
  // Itera da mais antiga para a mais nova para manter a primeira ocorrência
  for (const message of messages) {
    // *** VERIFICAÇÃO DE SEGURANÇA REFORÇADA ***
    // 1. Verifica se 'message' é um objeto e não nulo
    // 2. Verifica se 'message.id' existe e é uma string
    if (message && typeof message === 'object' && typeof message.id === 'string') {
      const currentId = String(message.id);      const isTemporaryOrError = currentId.startsWith('temp_') || currentId.startsWith('err_');

      if (!seenIds.has(currentId)) {
        seenIds.add(currentId);
        unique.push(message);
      } else if (isTemporaryOrError) {
        // Lógica para substituir se necessário (mantém a versão temp/erro sobre a real se o ID colidir)
        const existingIndex = unique.findIndex(m => m.id === currentId);
        if (existingIndex > -1) {
          console.warn(`Replacing existing message ID ${currentId} with temporary/error version.`);
          unique[existingIndex] = message; // Substitui no lugar
        } else {
          // Se não encontrou para substituir (improvável), apenas adiciona
          unique.push(message);
        }
        // Garante que o ID (agora temp/erro) está no set se foi adicionado/substituído
        seenIds.add(currentId);
      } else {
        console.warn(`Duplicate message ID detected and skipped: ${currentId}`);
      }
    } else {
      // Loga o item inválido encontrado
      console.warn('Skipping invalid message object during unique check:', message);
    }
    // *******************************************
  }
  return unique;
};
// ---------------------------------------------------------------------------------


export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const [chats, setChats] = useState<Record<string, ChatData>>({});
 const [isTypingById, setIsTypingById] = useState<Record<string, boolean>>({});

 // --- setChatData AGORA GARANTE UNICIDADE ---
 const setChatData = (chatId: string, updater: (prevData: ChatData) => ChatData) => {
   setChats(prevChats => {
     const newState = { ...prevChats };
     const currentChatData = newState[chatId] || { messages: [], nextPage: 1, isLoadingMore: false, isInitialLoad: true };
     // Calcula o próximo estado
     const nextChatDataCandidate = updater(currentChatData);
     // Garante que as mensagens são válidas e únicas *antes* de definir o estado
     // Passa um array vazio como fallback caso messages seja undefined
     const validAndUniqueMessages = uniqueMessagesById(nextChatDataCandidate.messages || []);

     newState[chatId] = {
        ...nextChatDataCandidate,
        messages: validAndUniqueMessages // Usa as mensagens válidas e únicas
     };
     return newState;
   });
 };
 // -------------------------------------------

 // Carrega mensagens iniciais
 const loadInitialMessages = useCallback(async (chatId: string) => {
   const currentChat = chats[chatId];
   if (currentChat && (currentChat.isLoadingMore || !currentChat.isInitialLoad)) return;

   setChatData(chatId, (prev) => ({ ...prev, isInitialLoad: true, isLoadingMore: false }));
   try {
     console.log(`[API] Fetching initial messages for chat ${chatId}, page 1`);
     const response = await chatService.getMessages(chatId, 1);
     // Adiciona verificação para garantir que response.results é um array
     const results = Array.isArray(response.results) ? response.results : [];
     setChatData(chatId, (prev) => ({
       ...prev,
       messages: results.reverse(), // Mantém reverse para FlatList invertida
       nextPage: response.next ? 2 : null,
       isInitialLoad: false,
     }));
   } catch (error) {
     console.error(`Failed to load initial messages for ${chatId}:`, error);
     setChatData(chatId, (prev) => ({ ...prev, isInitialLoad: false }));
   }
 }, [chats]);

 // Carrega mais mensagens
 const loadMoreMessages = useCallback(async (chatId: string) => {
   const chat = chats[chatId];
   if (!chat || chat.isLoadingMore || !chat.nextPage || chat.isInitialLoad) return;

   setChatData(chatId, (prev) => ({ ...prev, isLoadingMore: true }));
   try {
     console.log(`[API] Fetching more messages for chat ${chatId}, page ${chat.nextPage}`);
     const response = await chatService.getMessages(chatId, chat.nextPage);
      // Adiciona verificação para garantir que response.results é um array
     const results = Array.isArray(response.results) ? response.results : [];
     setChatData(chatId, (prev) => ({
       ...prev,
       messages: [...results.reverse(), ...prev.messages],
       nextPage: response.next ? ((prev.nextPage ?? 1) + 1) : null,
       isLoadingMore: false,
     }));
   } catch (error) {
     console.error(`Failed to load more messages for ${chatId}:`, error);
     setChatData(chatId, (prev) => ({ ...prev, isLoadingMore: false }));
   }
 }, [chats]);

 // Envia mensagem
 const sendMessage = async (chatId: string, text: string) => {
   const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
   const tempUserMsg: ChatMessage = {
     id: tempId,
     role: 'user',
     content: text,
     created_at: new Date().toISOString()
   };

   setChatData(chatId, (prev) => ({
     ...prev,
     messages: [...prev.messages, tempUserMsg]
   }));

   setIsTypingById((prev) => ({ ...prev, [chatId]: true }));

   try {
     const aiReplies = await chatService.sendMessage(chatId, text);
     // Adiciona verificação para garantir que aiReplies é um array
     const validAiReplies = Array.isArray(aiReplies) ? aiReplies : [];

     setChatData(chatId, (prev) => ({
       ...prev,
       messages: [
         ...prev.messages.filter(m => m?.id !== tempId), // Adiciona check para m?.id
         ...validAiReplies
       ]
     }));

     setIsTypingById((prev) => ({ ...prev, [chatId]: false }));

   } catch (error) {
     console.error(`Failed to send message for ${chatId}:`, error);
     setIsTypingById((prev) => ({ ...prev, [chatId]: false }));

     const errorMsg: ChatMessage = {
        id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        role: 'assistant',
        content: 'Sorry, I could not send your message. Please try again.',
        created_at: new Date().toISOString()
      };
     setChatData(chatId, (prev) => ({
       ...prev,
       messages: [...prev.messages.filter(m => m?.id !== tempId), errorMsg] // Adiciona check para m?.id
     }));
   }
 };

 // Arquivar chat
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

 // Memoização do valor do contexto
 const value = useMemo(
   () => ({ chats, isTypingById, loadInitialMessages, loadMoreMessages, sendMessage, archiveAndStartNew }),
   [chats, isTypingById, loadInitialMessages, loadMoreMessages, sendMessage, archiveAndStartNew]
 );

 return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Hook useChatController
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