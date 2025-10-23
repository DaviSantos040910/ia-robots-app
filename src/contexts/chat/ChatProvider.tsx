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

// --- CORRIGIDO: Função auxiliar para remover duplicatas (lida com IDs numéricos) ---
const uniqueMessagesById = (messages: ChatMessage[]): ChatMessage[] => {
  if (!Array.isArray(messages)) {
    console.error('uniqueMessagesById received non-array input:', messages);
    return [];
  }

  const seenIds = new Set<string>(); // Armazena IDs como strings
  const unique: ChatMessage[] = [];
  // Itera da mais antiga para a mais nova para manter a primeira ocorrência
  for (const message of messages) {
    // 1. Verifica se 'message' é um objeto e não nulo
    // 2. Verifica se 'message.id' existe e NÃO é nulo/undefined
    if (message && typeof message === 'object' && message.id != null) {

      // *** CONVERTE ID PARA STRING ***
      const currentIdString = String(message.id);
      // ****************************

      // Agora a verificação .startsWith() funciona
      const isTemporaryOrError = currentIdString.startsWith('temp_') || currentIdString.startsWith('err_');

      if (!seenIds.has(currentIdString)) {
        seenIds.add(currentIdString);
        unique.push(message);
      } else if (isTemporaryOrError) {
        // Lógica para substituir se necessário (mantém a versão temp/erro sobre a real se o ID colidir)
        const existingIndex = unique.findIndex(m => String(m.id) === currentIdString); // Compara como string
        if (existingIndex > -1) {
          console.warn(`Replacing existing message ID ${currentIdString} with temporary/error version.`);
          unique[existingIndex] = message; // Substitui no lugar
        } else {
          unique.push(message); // Se não achou para substituir, adiciona
        }
        seenIds.add(currentIdString); // Garante que está no set
      } else {
        // Loga apenas se for uma duplicata real, não um temp/erro substituindo
         console.warn(`Duplicate message ID detected and skipped: ${currentIdString}`);
      }
    } else {
      console.warn('Skipping invalid message object (missing or invalid ID) during unique check:', message);
    }
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
     const nextChatDataCandidate = updater(currentChatData);
     // Garante que as mensagens são válidas e únicas *antes* de definir o estado
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
    // Previne múltiplas chamadas concorrentes
   if (currentChat && (currentChat.isLoadingMore || currentChat.isInitialLoad)) return;
   // Previne recarregar se já terminou o load inicial
   if (currentChat && !currentChat.isInitialLoad) return;


   setChatData(chatId, (prev) => ({ ...prev, isInitialLoad: true, isLoadingMore: false }));
   try {
     console.log(`[API] Fetching initial messages for chat ${chatId}, page 1`);
     const response = await chatService.getMessages(chatId, 1);
     const results = Array.isArray(response?.results) ? response.results : []; // Valida results
     setChatData(chatId, (prev) => ({
       ...prev,
       messages: results.reverse(), // Mantém reverse para FlatList invertida
       nextPage: response?.next ? 2 : null, // Usa optional chaining
       isInitialLoad: false,
     }));
   } catch (error) {
     console.error(`Failed to load initial messages for ${chatId}:`, error);
     setChatData(chatId, (prev) => ({ ...prev, isInitialLoad: false }));
   }
 }, [chats]); // chats como dependência

 // Carrega mais mensagens
 const loadMoreMessages = useCallback(async (chatId: string) => {
   const chat = chats[chatId];
   // Previne múltiplas chamadas
   if (!chat || chat.isLoadingMore || !chat.nextPage || chat.isInitialLoad) return;

   setChatData(chatId, (prev) => ({ ...prev, isLoadingMore: true }));
   try {
     console.log(`[API] Fetching more messages for chat ${chatId}, page ${chat.nextPage}`);
     const response = await chatService.getMessages(chatId, chat.nextPage);
     const results = Array.isArray(response?.results) ? response.results : []; // Valida results
     setChatData(chatId, (prev) => ({
       ...prev,
       messages: [...results.reverse(), ...prev.messages],
       nextPage: response?.next ? ((prev.nextPage ?? 1) + 1) : null, // Usa optional chaining
       isLoadingMore: false,
     }));
   } catch (error) {
     console.error(`Failed to load more messages for ${chatId}:`, error);
     setChatData(chatId, (prev) => ({ ...prev, isLoadingMore: false }));
   }
 }, [chats]); // chats como dependência

 // Envia mensagem
 const sendMessage = async (chatId: string, text: string) => {
   const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
   const tempUserMsg: ChatMessage = {
     id: tempId,
     role: 'user',
     content: text,
     created_at: new Date().toISOString()
   };

   // Adiciona otimista
   setChatData(chatId, (prev) => ({
     ...prev,
     messages: [...prev.messages, tempUserMsg]
   }));

   setIsTypingById((prev) => ({ ...prev, [chatId]: true }));

   try {
     const aiReplies = await chatService.sendMessage(chatId, text);
     const validAiReplies = Array.isArray(aiReplies) ? aiReplies : [];

     // --- CORREÇÃO APLICADA AQUI ---
     // Atualiza o estado APENAS adicionando as respostas da IA.
     // A mensagem do usuário (tempUserMsg) já está no estado.
     setChatData(chatId, (prev) => ({
       ...prev,
       // Mantém as mensagens existentes (incluindo tempUserMsg) e adiciona as novas
       messages: [
         ...prev.messages,
         ...validAiReplies
       ]
       // Nota: uniqueMessagesById dentro de setChatData removerá duplicatas
       // se a API acidentalmente retornar a mensagem do usuário também.
     }));
     // -------------------------

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
      // Em caso de erro, remove a temporária e adiciona a mensagem de erro
     setChatData(chatId, (prev) => ({
       ...prev,
       messages: [...prev.messages.filter(m => m?.id !== tempId), errorMsg]
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