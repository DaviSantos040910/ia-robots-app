import { useCallback, useRef, useEffect } from 'react';
import { chatService } from '../../../services/chatService';
import { getCachedChatData, setCachedChatData } from '../../../services/chatCacheService';
import { ChatData } from './useChatState';

type UseChatLoaderDeps = {
  chats: Record<string, ChatData>;
  updateChatData: (chatId: string, updater: (prev: ChatData) => Partial<ChatData>) => void;
};

export const useChatLoader = ({ chats, updateChatData }: UseChatLoaderDeps) => {
  // Refs para evitar closures obsoletos
  const chatsRef = useRef(chats);
  const isFetchingMoreRef = useRef(false);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  const loadInitialMessages = useCallback(async (chatId: string) => {
    const currentChat = chatsRef.current[chatId];

    // Evita chamadas duplicadas
    if (currentChat?.isLoadingInitial) return;

    updateChatData(chatId, () => ({ isLoadingInitial: true }));

    // --- 1. Cache Local (Opcional, para UX rápida) ---
    try {
      const cachedData = await getCachedChatData(chatId);
      if (cachedData && cachedData.messages.length > 0) {
        updateChatData(chatId, () => ({
          messages: cachedData.messages,
          nextPage: cachedData.nextPage,
          isLoadingInitial: false,
          hasLoadedOnce: true,
        }));
      }
    } catch (e) {
      console.warn('[ChatLoader] Failed to load cache', e);
    }

    // --- 2. API (A Verdade Absoluta) ---
    try {
      // Página 1 sempre traz o estado mais atual
      const response = await chatService.getMessages(chatId, 1);
      const apiMessages = response.results;
      const nextPageApi = response.next ? 2 : null;

      updateChatData(chatId, () => {
        // Lógica 'Old School': Substituição Total na página 1.
        // Isso remove qualquer mensagem temporária, duplicada ou 'zumbi' que estivesse localmente.
        // A API manda, a gente obedece.
        
        // Atualiza o cache para a próxima sessão
        setCachedChatData(chatId, {
          messages: apiMessages,
          nextPage: nextPageApi,
          timestamp: Date.now()
        }).catch(err => console.error("[ChatLoader] Cache update failed", err));

        return {
          messages: apiMessages,
          nextPage: nextPageApi,
          isLoadingInitial: false,
          hasLoadedOnce: true,
        };
      });

    } catch (error) {
      console.error(`[ChatLoader] Failed to fetch initial messages:`, error);
      updateChatData(chatId, () => ({ isLoadingInitial: false }));
    }
  }, [updateChatData]);


  const loadMoreMessages = useCallback(async (chatId: string) => {
    if (isFetchingMoreRef.current) return;

    const currentChat = chatsRef.current[chatId];
    
    // Verificações de segurança para paginação
    if (!currentChat || currentChat.isLoadingMore || !currentChat.nextPage) {
      return;
    }

    isFetchingMoreRef.current = true;
    updateChatData(chatId, () => ({ isLoadingMore: true }));

    try {
      const page = currentChat.nextPage;
      const response = await chatService.getMessages(chatId, page);
      
      updateChatData(chatId, (prev) => {
        // Paginação Simples: Anexa os novos resultados ao final da lista existente.
        // Sem merge complexo, sem verificação de IDs. Confia na ordem da API.
        const newMessages = [...(prev.messages || []), ...response.results];
        
        return {
          messages: newMessages,
          nextPage: response.next ? page + 1 : null,
          isLoadingMore: false,
        };
      });
    } catch (error) {
      console.error(`[ChatLoader] Error loading more messages:`, error);
      updateChatData(chatId, () => ({ isLoadingMore: false }));
    } finally {
      setTimeout(() => {
        isFetchingMoreRef.current = false;
      }, 500);
    }
  }, [updateChatData]);

  return { loadInitialMessages, loadMoreMessages };
};