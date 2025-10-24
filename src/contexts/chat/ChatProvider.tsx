// src/contexts/chat/ChatProvider.tsx
import React, { createContext, useContext, useMemo, useState, useCallback, useRef } from 'react';
import { ChatMessage, PaginatedMessages } from '../../types/chat';
import { chatService } from '../../services/chatService';

// --- DEFINIÇÕES MOVIDAS PARA FORA DO COMPONENTE ---
// Define a estrutura de dados para um único chat
type ChatData = {
  messages: ChatMessage[];
  nextPage: number | null;
  isLoadingMore: boolean;
  isLoadingInitial: boolean;
  hasLoadedOnce: boolean;
  // Adicione status aqui se você precisar rastreá-lo no provider
  // status?: 'active' | 'archived';
};

// Define a estrutura completa do que o contexto vai fornecer
export type ChatStore = {
  chats: Record<string, ChatData>;
  isTypingById: Record<string, boolean>;
  loadInitialMessages: (chatId: string) => Promise<void>;
  loadMoreMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  archiveAndStartNew: (chatId: string) => Promise<string | null>;
  clearLocalChatState: (chatId: string) => void;
};

// Define o estado inicial para um novo chat
const initialChatData: ChatData = {
    messages: [],
    nextPage: 1, // Começa tentando carregar a página 1
    isLoadingMore: false,
    isLoadingInitial: false,
    hasLoadedOnce: false, // Importante começar como false
};

// Cria o contexto com um valor inicial (pode ser null ou um objeto com funções vazias)
// Usar 'as ChatStore' aqui ajuda o TypeScript dentro do hook useChatController
const ChatContext = createContext<ChatStore | null>(null);
// --- FIM DAS DEFINIÇÕES MOVIDAS ---


// Helper type for the internal state structure
type ChatsState = Record<string, ChatData>;

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<ChatsState>({});
  const [isTypingById, setIsTypingById] = useState<Record<string, boolean>>({});

  // Use a ref to prevent race conditions during message sending/updates
  const activeSendPromises = useRef<Record<string, Promise<any>>>({});


  // Consistent way to update chat data
  const setChatData = (chatId: string, updater: (prevData: ChatData) => Partial<ChatData>) => {
    setChats(prevChats => {
      const currentChatState = prevChats[chatId] || initialChatData;
      const updates = updater(currentChatState);
      const newMessages = updates.messages !== undefined ? updates.messages : currentChatState.messages;

       if (newMessages) {
          const ids = newMessages.map(m => m.id);
          if (ids.length !== new Set(ids).size) {
              console.error(`[ChatProvider] setChatData DETECTED DUPLICATE IDs for chatId ${chatId} BEFORE setting state! IDs:`, ids);
          }
      }

      return {
        ...prevChats,
        [chatId]: {
          ...currentChatState,
          ...updates,
          messages: newMessages,
        },
      };
    });
  };

  const loadInitialMessages = useCallback(async (chatId: string) => {
    let isLoading = false;
    // Verifica o estado atual de forma segura antes de prosseguir
    setChats(currentChats => {
        isLoading = currentChats[chatId]?.isLoadingInitial ?? false;
        // Não altera o estado aqui, apenas lê
        return currentChats;
    });

    // Se já estiver carregando, aborta
    if (isLoading) {
        console.log(`[ChatProvider] loadInitialMessages (${chatId}) aborted: already loading.`);
        return;
    }

    console.log(`[ChatProvider] Loading initial messages for chatId: ${chatId}`);
    // Define isLoadingInitial como true e reseta hasLoadedOnce
    setChatData(chatId, () => ({ isLoadingInitial: true, hasLoadedOnce: false }));

    try {
      const response = await chatService.getMessages(chatId, 1);
      console.log(`[ChatProvider] Received initial messages for ${chatId}. Count: ${response.results.length}. Next page exists: ${!!response.next}`);
      setChatData(chatId, (prev) => ({
        // messages: response.results.reverse(), // Mensagens da API já devem vir ordenadas (mais antigas primeiro talvez?) -> Verifique a ordem da API
        messages: response.results.reverse(), // Mantendo reverse por enquanto, assumindo API retorna mais novas primeiro
        nextPage: response.next ? 2 : null,
        isLoadingInitial: false,
        hasLoadedOnce: true, // Marca como carregado com sucesso
      }));
    } catch (error) {
      console.error(`[ChatProvider] Failed to load initial messages for ${chatId}:`, error);
      // Garante que hasLoadedOnce permaneça false em caso de erro
      setChatData(chatId, () => ({ isLoadingInitial: false, hasLoadedOnce: false }));
    }
  }, []); // Sem dependências, pois chatId vem como argumento

  const loadMoreMessages = useCallback(async (chatId: string) => {
    let currentChat: ChatData | undefined;
    setChats(currentChats => {
        currentChat = currentChats[chatId];
        return currentChats;
    });

    if (!currentChat || currentChat.isLoadingMore || !currentChat.nextPage || currentChat.isLoadingInitial) {
        console.log(`[ChatProvider] Skipping loadMoreMessages (${chatId}). Conditions not met.`);
        return;
    }

    console.log(`[ChatProvider] Loading more messages for chatId: ${chatId}, page: ${currentChat.nextPage}`);
    setChatData(chatId, () => ({ isLoadingMore: true }));

    try {
      const response = await chatService.getMessages(chatId, currentChat.nextPage);
      console.log(`[ChatProvider] Received more messages for ${chatId}. Count: ${response.results.length}. Next page exists: ${!!response.next}`);

      setChatData(chatId, (prev) => {
        // Pega IDs existentes de forma segura
        const existingIds = new Set(prev.messages?.map(m => m.id) ?? []); // Adiciona verificação para prev.messages
        // Filtra novas mensagens únicas
        const newUniqueMessages = response.results.filter(fetchedMessage => !existingIds.has(fetchedMessage.id));

        if (newUniqueMessages.length < response.results.length) {
            console.warn(`[ChatProvider] loadMoreMessages found ${response.results.length - newUniqueMessages.length} duplicate messages.`);
        }

        if (newUniqueMessages.length === 0) {
           console.log('[ChatProvider] No unique older messages found in fetched page.');
           return {
             ...prev,
             nextPage: response.next ? (prev.nextPage || 1) + 1 : null,
             isLoadingMore: false,
           };
        }

        console.log(`[ChatProvider] Adding ${newUniqueMessages.length} unique older messages.`);
        // Combina: novas únicas (invertidas) + mensagens existentes
        const combinedMessages = [...newUniqueMessages.reverse(), ...(prev.messages ?? [])]; // Adiciona verificação para prev.messages

        // Verificação final de duplicatas
        const finalIds = combinedMessages.map(m => m.id);
        if (finalIds.length !== new Set(finalIds).size) {
            console.error('[ChatProvider] DUPLICATE IDs detected after merging in loadMoreMessages!', finalIds);
        }

        return {
          ...prev,
          messages: combinedMessages,
          nextPage: response.next ? (prev.nextPage || 1) + 1 : null, // Calcula próxima página
          isLoadingMore: false,
        };
      });
    } catch (error) {
      console.error(`[ChatProvider] Failed to load more messages for ${chatId}:`, error);
      setChatData(chatId, () => ({ isLoadingMore: false }));
    }
  }, []); // Sem dependências

 // src/contexts/chat/ChatProvider.tsx

 const sendMessage = useCallback(async (chatId: string, text: string) => {
  if (chatId in activeSendPromises.current) {
      console.warn(`[ChatProvider] sendMessage (${chatId}) aborted: another send is already in progress.`);
      return;
    }

    const tempUserMsgId = `temp_user_${Date.now()}_${Math.random()}`;
    const tempUserMsg: ChatMessage = {
      id: tempUserMsgId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };
    console.log(`[ChatProvider] Sending message. Temp ID: ${tempUserMsgId}, Content: "${text}"`);

    // Adiciona a mensagem temporária imediatamente
    // IMPORTANTE: Usar a forma funcional do setState para garantir que estamos adicionando ao estado MAIS RECENTE
    setChats(prevChats => ({
        ...prevChats,
        [chatId]: {
            ...(prevChats[chatId] || initialChatData),
            messages: [...(prevChats[chatId]?.messages ?? []), tempUserMsg] // Adiciona ao final
        }
    }));
    setIsTypingById((prev) => ({ ...prev, [chatId]: true }));

    // Cria e armazena a promessa
    const sendPromise = chatService.sendMessage(chatId, text)
      .then(aiReplies => {
        console.log(`[ChatProvider] Received AI replies for temp ID ${tempUserMsgId}. Count: ${aiReplies.length}`);
        setIsTypingById((prev) => ({ ...prev, [chatId]: false }));

        // ATUALIZAÇÃO REFINADA:
        setChats(prevChats => {
            const currentChatState = prevChats[chatId];
            if (!currentChatState) return prevChats; // Segurança: Não atualiza se o chat sumiu

            console.log(`[ChatProvider] Updating state for ${chatId} after AI response. Attempting to process temp ID: ${tempUserMsgId}`);
            console.log('[ChatProvider] Messages before update:', currentChatState.messages.map(m => ({id: m.id, content: m.content.substring(0,15)})));
            console.log('[ChatProvider] AI Replies received:', aiReplies.map(m=>({id: m.id, content: m.content.substring(0,15)})));

            // Encontra a mensagem temporária
            const tempMsgIndex = currentChatState.messages.findIndex(m => m.id === tempUserMsgId);

            let finalMessages: ChatMessage[];

            if (tempMsgIndex !== -1) {
                 console.log(`[ChatProvider] Temp message ${tempUserMsgId} found at index ${tempMsgIndex}. Replacing with AI replies.`);
                 // Mantém tudo antes, adiciona as respostas da IA, mantém tudo depois
                 finalMessages = [
                     ...currentChatState.messages.slice(0, tempMsgIndex),
                     ...aiReplies, // As respostas da IA com IDs reais
                     ...currentChatState.messages.slice(tempMsgIndex + 1),
                 ];
            } else {
                 console.warn(`[ChatProvider] Temp message ${tempUserMsgId} NOT FOUND during update! Adding AI replies to the end.`);
                 // Fallback: Adiciona ao final se a temporária sumiu
                 finalMessages = [...currentChatState.messages, ...aiReplies];
            }

            // Verificação de duplicatas (debug)
            const finalIds = finalMessages.map(m => m.id);
            if (finalIds.length !== new Set(finalIds).size) {
                 console.error('[ChatProvider] DUPLICATE IDs detected in finalMessages after sending!', finalIds);
                 // Tenta remover duplicatas como último recurso (mantendo a última ocorrência)
                 const uniqueMessagesMap = new Map<string, ChatMessage>();
                 finalMessages.forEach(msg => uniqueMessagesMap.set(msg.id, msg));
                 finalMessages = Array.from(uniqueMessagesMap.values());
                 console.warn('[ChatProvider] Attempted to remove duplicates.');
            } else {
                 console.log('[ChatProvider] Final message list seems unique.');
            }
             console.log('[ChatProvider] Final messages count after update:', finalMessages.length);


            return {
                ...prevChats,
                [chatId]: {
                    ...currentChatState,
                    messages: finalMessages // Atualiza com a lista final
                }
            };
        });

      })
      .catch(error => {
        console.error(`[ChatProvider] Failed to send message (temp ID ${tempUserMsgId}):`, error);
        setIsTypingById((prev) => ({ ...prev, [chatId]: false }));
        const errorMsgId = `err_${Date.now()}_${Math.random()}`;
        const errorMsg: ChatMessage = {
          id: errorMsgId,
          role: 'assistant',
          content: 'An unexpected error occurred while generating a response. Please try again.', // Mensagem de erro padrão
          created_at: new Date().toISOString()
        };
        // ATUALIZAÇÃO REFINADA PARA ERRO:
        setChats(prevChats => {
             const currentChatState = prevChats[chatId];
             if (!currentChatState) return prevChats;

             const tempMsgIndex = currentChatState.messages.findIndex(m => m.id === tempUserMsgId);
             let finalMessages: ChatMessage[];

             if (tempMsgIndex !== -1) {
                  // Substitui a temporária pela mensagem de erro
                  finalMessages = [
                      ...currentChatState.messages.slice(0, tempMsgIndex),
                      errorMsg,
                      ...currentChatState.messages.slice(tempMsgIndex + 1),
                  ];
             } else {
                  // Adiciona erro ao final se a temporária sumiu
                   finalMessages = [...currentChatState.messages, errorMsg];
             }

            return {
                ...prevChats,
                [chatId]: {
                    ...currentChatState,
                    messages: finalMessages
                }
            };
        });

      })
      .finally(() => {
        delete activeSendPromises.current[chatId];
        console.log(`[ChatProvider] Send promise for ${chatId} (temp ID ${tempUserMsgId}) finished.`);
      });

    activeSendPromises.current[chatId] = sendPromise;

  }, []); // Mantenha vazio

  const archiveAndStartNew = useCallback(async (chatId: string): Promise<string | null> => {
      console.log(`[ChatProvider] Archiving chat ${chatId} and creating new.`);
      try {
          const { new_chat_id } = await chatService.archiveAndCreateNewChat(chatId);
          console.log(`[ChatProvider] New chat ID ${new_chat_id} received. Clearing old state for ${chatId}.`);
          // Limpa estado local para o chat antigo arquivado
          setChats(prev => {
              const newState = { ...prev };
              if (newState[chatId]) {
                 // Reseta para o estado inicial em vez de deletar
                 newState[chatId] = { ...initialChatData };
              }
              return newState;
          });
          setIsTypingById(prev => {
              const newState = { ...prev };
              delete newState[chatId];
              return newState;
          });
          return new_chat_id;
      } catch (error) {
          console.error(`[ChatProvider] Failed to archive chat ${chatId}:`, error);
          return null;
      }
  }, []); // Sem dependências

  const clearLocalChatState = useCallback((chatId: string) => {
      console.log(`[ChatProvider] Clearing local state for chatId: ${chatId}`);
      setChats(prev => {
          const newState = { ...prev };
          if (newState[chatId]) {
             newState[chatId] = { ...initialChatData }; // Reseta para inicial
             console.log(`[ChatProvider] State for ${chatId} reset to initial.`);
          } else {
             console.log(`[ChatProvider] No state found for ${chatId} to clear.`);
          }
          return newState;
      });
      setIsTypingById(prev => {
          const newState = { ...prev };
          delete newState[chatId];
          return newState;
      });
  }, []); // Sem dependências

  // Valor fornecido pelo contexto
   const value = useMemo(
     () => ({ chats, isTypingById, loadInitialMessages, loadMoreMessages, sendMessage, archiveAndStartNew, clearLocalChatState }),
     [chats, isTypingById, loadInitialMessages, loadMoreMessages, sendMessage, archiveAndStartNew, clearLocalChatState]
   );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// --- HOOK ATUALIZADO ---
export const useChatController = (chatId: string | null) => {
  const ctx = useContext(ChatContext);
  // Lança erro se o contexto não for encontrado (importante!)
  if (!ctx) throw new Error('useChatController must be used within ChatProvider');

  // Obtém dados do chat ou usa o estado inicial se não houver ID ou dados
  const chatData = chatId ? (ctx.chats[chatId] || initialChatData) : initialChatData;
  const isTyping = chatId ? !!ctx.isTypingById[chatId] : false;

  // Usa useCallback para estabilizar as referências das funções passadas para ChatScreen
  const stableLoadInitialMessages = useCallback(() => {
    if (chatId) {
       console.log(`[useChatController] Calling loadInitialMessages for ${chatId}`);
      return ctx.loadInitialMessages(chatId);
    }
    console.warn("[useChatController] Attempted to call loadInitialMessages with null chatId.");
    return Promise.resolve();
  }, [ctx, chatId]); // Depende do contexto e do chatId

  const stableLoadMoreMessages = useCallback(() => {
      if (chatId) {
          console.log(`[useChatController] Calling loadMoreMessages for ${chatId}`);
          return ctx.loadMoreMessages(chatId);
      }
       console.warn("[useChatController] Attempted to call loadMoreMessages with null chatId.");
      return Promise.resolve();
  }, [ctx, chatId]);

  const stableSendMessage = useCallback((text: string) => {
      if (chatId) {
          console.log(`[useChatController] Calling sendMessage for ${chatId}`);
          return ctx.sendMessage(chatId, text);
      }
       console.warn("[useChatController] Attempted to call sendMessage with null chatId.");
      return Promise.resolve();
  }, [ctx, chatId]);

   const stableArchiveAndStartNew = useCallback(() => {
       if (chatId) {
           console.log(`[useChatController] Calling archiveAndStartNew for ${chatId}`);
           return ctx.archiveAndStartNew(chatId);
       }
        console.warn("[useChatController] Attempted to call archiveAndStartNew with null chatId.");
       return Promise.resolve(null);
   }, [ctx, chatId]);

   // clearLocalChatState não depende do chatId atual, pode limpar qualquer um
   const stableClearLocalChatState = useCallback((idToClear: string) => {
        console.log(`[useChatController] Calling clearLocalChatState for ${idToClear}`);
       ctx.clearLocalChatState(idToClear);
   }, [ctx]); // Depende apenas do contexto


  // Retorna um objeto memoizado contendo os dados do chat e as funções estáveis
  return useMemo(() => ({
    ...chatData, // Espalha os dados atuais (messages, isLoading, hasLoadedOnce, etc.)
    isTyping: isTyping,
    loadInitialMessages: stableLoadInitialMessages,
    loadMoreMessages: stableLoadMoreMessages,
    sendMessage: stableSendMessage,
    archiveAndStartNew: stableArchiveAndStartNew,
    clearLocalChatState: stableClearLocalChatState,
  }), [chatData, isTyping, stableLoadInitialMessages, stableLoadMoreMessages, stableSendMessage, stableArchiveAndStartNew, stableClearLocalChatState]);
};