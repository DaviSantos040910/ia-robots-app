import { useCallback, useRef, useEffect } from 'react';
import { chatService } from '../../../services/chatService';
import { getCachedChatData, setCachedChatData } from '../../../services/chatCacheService';
import { ChatMessage } from '../../../types/chat';
import { ChatData } from './useChatState';

type UseChatLoaderDeps = {
  chats: Record<string, ChatData>;
  updateChatData: (chatId: string, updater: (prev: ChatData) => Partial<ChatData>) => void;
};

export const useChatLoader = ({ chats, updateChatData }: UseChatLoaderDeps) => {
  // Ref para acessar o estado mais recente sem recriar as funções
  const chatsRef = useRef(chats);

  // Mantém a ref sincronizada com o estado
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  /**
   * Função auxiliar para garantir unicidade e ordem cronológica.
   */
  const processMessages = (
    currentMessages: ChatMessage[], 
    newMessages: ChatMessage[]
  ): ChatMessage[] => {
    const allMessages = [...currentMessages, ...newMessages];
    const uniqueMessages = allMessages.filter(
      (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
    );
    return uniqueMessages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  };

  const loadInitialMessages = useCallback(async (chatId: string) => {
    // Acessa o valor atual via ref
    const currentChat = chatsRef.current[chatId];

    // Evita re-loading se já estiver em progresso
    if (currentChat?.isLoadingInitial) return;

    updateChatData(chatId, () => ({ 
      isLoadingInitial: true,
      // Não resetamos hasLoadedOnce aqui para evitar "flicker"
    }));

    // --- 1. Estratégia de Cache (Imediato) ---
    const cachedData = await getCachedChatData(chatId);
    
    if (cachedData && cachedData.messages.length > 0) {
      console.log(`[ChatLoader] Loaded ${cachedData.messages.length} messages from cache for ${chatId}`);
      
      updateChatData(chatId, (prev) => {
         const consolidatedMessages = processMessages(prev.messages || [], cachedData.messages);
         return {
            messages: consolidatedMessages,
            nextPage: cachedData.nextPage,
            isLoadingInitial: false,
            hasLoadedOnce: true,
         };
      });
    }

    // --- 2. Revalidação com API (Background) ---
    try {
      const response = await chatService.getMessages(chatId, 1);
      const apiMessages = response.results; 
      const nextPageApi = response.next ? 2 : null;

      updateChatData(chatId, (prev) => {
        const finalMessages = processMessages(prev.messages || [], apiMessages);

        if (finalMessages.length > 0) {
             setCachedChatData(chatId, {
              messages: finalMessages,
              nextPage: nextPageApi,
              timestamp: Date.now()
            }).catch(err => console.error("[ChatLoader] Failed to update cache", err));
        }

        return {
          messages: finalMessages,
          nextPage: nextPageApi,
          isLoadingInitial: false,
          hasLoadedOnce: true,
        };
      });

    } catch (error) {
      console.error(`[ChatLoader] Failed to fetch initial messages for ${chatId}:`, error);
      updateChatData(chatId, () => ({ isLoadingInitial: false }));
    }
  }, [updateChatData]); // Removido 'chats' das dependências


  const loadMoreMessages = useCallback(async (chatId: string) => {
    // Acessa via ref
    const currentChat = chatsRef.current[chatId];
    
    if (!currentChat || currentChat.isLoadingMore || !currentChat.nextPage) {
      return;
    }

    updateChatData(chatId, () => ({ isLoadingMore: true }));

    try {
      const page = currentChat.nextPage;
      const response = await chatService.getMessages(chatId, page);
      const newMessages = response.results;

      updateChatData(chatId, (prev) => {
        const finalMessages = processMessages(prev.messages, newMessages);
        
        return {
          messages: finalMessages,
          nextPage: response.next ? page + 1 : null,
          isLoadingMore: false,
        };
      });
    } catch (error) {
      console.error(`[ChatLoader] Error loading more messages:`, error);
      updateChatData(chatId, () => ({ isLoadingMore: false }));
    }
  }, [updateChatData]); // Removido 'chats' das dependências

  return { loadInitialMessages, loadMoreMessages };
};