import { useCallback } from 'react';
import { chatService } from '../../../services/chatService';
import { getCachedChatData, setCachedChatData } from '../../../services/chatCacheService';
import { ChatMessage } from '../../../types/chat';
import { ChatData } from './useChatState';

type UseChatLoaderDeps = {
  chats: Record<string, ChatData>;
  updateChatData: (chatId: string, updater: (prev: ChatData) => Partial<ChatData>) => void;
};

export const useChatLoader = ({ chats, updateChatData }: UseChatLoaderDeps) => {

  const loadInitialMessages = useCallback(async (chatId: string) => {
    // Se já está carregando ou já carregou e tem mensagens, evita recarga desnecessária
    // Mas permite se for para atualizar (revalidate)
    if (chats[chatId]?.isLoadingInitial) return;

    // Marca como carregando, mas MANTÉM as mensagens existentes se houver (ex: de uma navegação anterior)
    updateChatData(chatId, (prev) => ({ 
      isLoadingInitial: true, 
      // Não reseta hasLoadedOnce aqui para não causar flickers se já tiver dados
    }));

    // 1. Cache Strategy
    const cachedData = await getCachedChatData(chatId);
    
    if (cachedData && cachedData.messages.length > 0) {
      console.log(`[ChatLoader] Loaded ${cachedData.messages.length} messages from cache for ${chatId}`);
      updateChatData(chatId, () => ({
        messages: cachedData.messages,
        nextPage: cachedData.nextPage,
        isLoadingInitial: false, 
        hasLoadedOnce: true,
      }));
    } else {
       console.log(`[ChatLoader] No cache found for ${chatId}`);
    }

    // 2. API Revalidation
    try {
      const response = await chatService.getMessages(chatId, 1);
      const apiMessages = response.results.reverse(); // API: Newest first -> UI: Oldest first
      const nextPageApi = response.next ? 2 : null;

      updateChatData(chatId, (prev) => {
        // Merge inteligente: Combina Cache + API sem duplicatas
        const currentMessages = prev.messages || [];
        const existingIds = new Set(currentMessages.map(m => m.id));
        
        // Filtra mensagens da API que já temos
        const uniqueApiMessages = apiMessages.filter(m => !existingIds.has(m.id));
        
        // Se não tínhamos nada, usa tudo da API.
        // Se tínhamos cache, adiciona apenas as novas da API no final (assumindo que API traz as mais recentes na pág 1)
        // IMPORTANTE: A lógica de ordem depende de como sua API pagina. 
        // Se pág 1 são as últimas mensagens, elas devem ir para o final da lista visual (bottom).
        
        let finalMessages: ChatMessage[] = [];

        if (currentMessages.length === 0) {
            finalMessages = apiMessages;
        } else {
            // Cenário complexo: Reconciliação
            // Simplesmente unimos e reordenamos por data para garantir consistência
            const allMessages = [...currentMessages, ...uniqueApiMessages];
            finalMessages = allMessages.sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
        }

        // Atualiza o cache com a lista consolidada
        if (finalMessages.length > 0) {
             setCachedChatData(chatId, {
              messages: finalMessages,
              nextPage: nextPageApi,
              timestamp: Date.now()
            }).catch(err => console.error("Failed to update cache", err));
        }

        return {
          messages: finalMessages,
          nextPage: nextPageApi,
          isLoadingInitial: false,
          hasLoadedOnce: true,
        };
      });

    } catch (error) {
      console.error(`[ChatLoader] Failed to fetch messages for ${chatId}:`, error);
      updateChatData(chatId, () => ({ isLoadingInitial: false }));
    }
  }, [chats, updateChatData]);

  const loadMoreMessages = useCallback(async (chatId: string) => {
    const currentChat = chats[chatId];
    if (!currentChat || currentChat.isLoadingMore || !currentChat.nextPage) return;

    updateChatData(chatId, () => ({ isLoadingMore: true }));

    try {
      const page = currentChat.nextPage;
      const response = await chatService.getMessages(chatId, page);
      // Mensagens antigas vêm da API. Invertemos para ordem cronológica se necessário,
      // mas geralmente queremos prependê-las na lista.
      const newMessages = response.results.reverse(); 

      updateChatData(chatId, (prev) => {
        const existingIds = new Set(prev.messages.map(m => m.id));
        const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.id));

        // Adiciona as mensagens antigas NO INÍCIO da lista (topo)
        const combinedMessages = [...uniqueNewMessages, ...prev.messages];
        
        return {
          messages: combinedMessages,
          nextPage: response.next ? page + 1 : null,
          isLoadingMore: false,
        };
      });
    } catch (error) {
      console.error(`[ChatLoader] Error loading more:`, error);
      updateChatData(chatId, () => ({ isLoadingMore: false }));
    }
  }, [chats, updateChatData]);

  return { loadInitialMessages, loadMoreMessages };
};