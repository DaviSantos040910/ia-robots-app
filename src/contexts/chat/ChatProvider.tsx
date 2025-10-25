// src/contexts/chat/ChatProvider.tsx
import React, { createContext, useContext, useMemo, useState, useCallback, useRef } from 'react';
import { ChatMessage, PaginatedMessages } from '../../types/chat';
import { chatService } from '../../services/chatService';

// --- DEFINIÇÕES MOVIDAS PARA FORA DO COMPONENTE ---
type ChatData = {
  messages: ChatMessage[];
  nextPage: number | null;
  isLoadingMore: boolean;
  isLoadingInitial: boolean;
  hasLoadedOnce: boolean;
};

export type ChatStore = {
  chats: Record<string, ChatData>;
  isTypingById: Record<string, boolean>;
  loadInitialMessages: (chatId: string) => Promise<void>;
  loadMoreMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  archiveAndStartNew: (chatId: string) => Promise<string | null>;
  clearLocalChatState: (chatId: string) => void;
};

const initialChatData: ChatData = {
    messages: [],
    nextPage: 1, 
    isLoadingMore: false,
    isLoadingInitial: false,
    hasLoadedOnce: false,
};

const ChatContext = createContext<ChatStore | null>(null);
// --- FIM DAS DEFINIÇÕES ---


type ChatsState = Record<string, ChatData>;

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<ChatsState>({});
  const [isTypingById, setIsTypingById] = useState<Record<string, boolean>>({});
  const activeSendPromises = useRef<Record<string, Promise<any>>>({});

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
    setChats(currentChats => {
        isLoading = currentChats[chatId]?.isLoadingInitial ?? false;
        return currentChats;
    });

    if (isLoading) {
        console.log(`[ChatProvider] loadInitialMessages (${chatId}) aborted: already loading.`);
        return;
    }

    console.log(`[ChatProvider] Loading initial messages for chatId: ${chatId}`);
    setChatData(chatId, () => ({ isLoadingInitial: true, hasLoadedOnce: false }));

    try {
      const response = await chatService.getMessages(chatId, 1);
      console.log(`[ChatProvider] Received initial messages for ${chatId}. Count: ${response.results.length}. Next page exists: ${!!response.next}`);
      setChatData(chatId, (prev) => ({
        messages: response.results.reverse(), 
        nextPage: response.next ? 2 : null,
        isLoadingInitial: false,
        hasLoadedOnce: true,
      }));
    } catch (error) {
      console.error(`[ChatProvider] Failed to load initial messages for ${chatId}:`, error);
      setChatData(chatId, () => ({ isLoadingInitial: false, hasLoadedOnce: false }));
    }
  }, []); 

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
        const existingIds = new Set(prev.messages?.map((m: ChatMessage) => m.id) ?? []); 
        const newUniqueMessages = response.results.filter((fetchedMessage: ChatMessage) => !existingIds.has(fetchedMessage.id));

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
        const combinedMessages = [...newUniqueMessages.reverse(), ...(prev.messages ?? [])]; 

        const finalIds = combinedMessages.map((m: ChatMessage) => m.id);
        if (finalIds.length !== new Set(finalIds).size) {
            console.error('[ChatProvider] DUPLICATE IDs detected after merging in loadMoreMessages!', finalIds);
        }

        return {
          ...prev,
          messages: combinedMessages,
          nextPage: response.next ? (prev.nextPage || 1) + 1 : null,
          isLoadingMore: false,
        };
      });
    } catch (error) {
      console.error(`[ChatProvider] Failed to load more messages for ${chatId}:`, error);
      setChatData(chatId, () => ({ isLoadingMore: false }));
    }
  }, []); 

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

    setChats(prevChats => ({
        ...prevChats,
        [chatId]: {
            ...(prevChats[chatId] || initialChatData),
            messages: [...(prevChats[chatId]?.messages ?? []), tempUserMsg]
        }
    }));
    setIsTypingById((prev) => ({ ...prev, [chatId]: true }));

    const sendPromise = chatService.sendMessage(chatId, text)
      .then(aiReplies => {
        // aiReplies AGORA É UMA LISTA [userMessage, ...botMessages]
        console.log(`[ChatProvider] Received ${aiReplies.length} replies for temp ID ${tempUserMsgId}.`);
        setIsTypingById((prev) => ({ ...prev, [chatId]: false }));

        setChats(prevChats => {
            const currentChatState = prevChats[chatId];
            if (!currentChatState) return prevChats;
            console.log(`[ChatProvider] Updating state for ${chatId}. Attempting to remove temp ID: ${tempUserMsgId}`);

            // --- CORREÇÃO PRINCIPAL: LÓGICA DE ATUALIZAÇÃO ---
            // 1. Filtra a mensagem temporária
            const messagesWithoutTemp = (currentChatState.messages ?? []).filter((m: ChatMessage) => m.id !== tempUserMsgId);

            if (messagesWithoutTemp.length === (currentChatState.messages?.length ?? 0)) {
               console.warn(`[ChatProvider] Temporary message ID ${tempUserMsgId} was NOT found during update!`);
            } else {
               console.log(`[ChatProvider] Temporary message ID ${tempUserMsgId} successfully removed.`);
            }

            // 2. Adiciona as novas mensagens (que incluem a do usuário)
            let finalMessages = [...messagesWithoutTemp, ...aiReplies];
            // --- FIM DA CORREÇÃO ---

            const finalIds = finalMessages.map((m: ChatMessage) => m.id);
            if (finalIds.length !== new Set(finalIds).size) {
                 console.error('[ChatProvider] DUPLICATE IDs detected in finalMessages after sending!', finalIds);
                 // Tenta remover duplicatas
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
                    messages: finalMessages 
                }
            };
        });
      })
      .catch(error => {
        // Este é o bloco que envia "An unexpected error occurred..."
        console.error(`[ChatProvider] Failed to send message (temp ID ${tempUserMsgId}):`, error);
        setIsTypingById((prev) => ({ ...prev, [chatId]: false }));
        const errorMsgId = `err_${Date.now()}_${Math.random()}`;
        const errorMsg: ChatMessage = {
          id: errorMsgId,
          role: 'assistant',
          content: 'An unexpected error occurred while generating a response. Please try again.',
          created_at: new Date().toISOString()
        };
        
        setChats(prevChats => {
             const currentChatState = prevChats[chatId];
             if (!currentChatState) return prevChats;
             
             // Substitui a mensagem temporária pela de erro
             const finalMessages = (currentChatState.messages ?? []).map((m: ChatMessage) => 
                m.id === tempUserMsgId ? errorMsg : m
             );
             
             // Se não encontrou para substituir, apenas adiciona
             if (!finalMessages.some(m => m.id === errorMsgId)) {
                 finalMessages.push(errorMsg);
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
          // Reseta o estado do chat antigo
          setChats(prev => {
              const newState = { ...prev };
              if (newState[chatId]) {
                 newState[chatId] = { ...initialChatData }; 
              }
              // Garante que o novo chat também comece do zero
              newState[new_chat_id] = { ...initialChatData };
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
  }, []); 

  const clearLocalChatState = useCallback((chatId: string) => {
      console.log(`[ChatProvider] Clearing local state for chatId: ${chatId}`);
      setChats(prev => {
          const newState = { ...prev };
          if (newState[chatId]) {
             newState[chatId] = { ...initialChatData };
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
  }, []); 

   const value = useMemo(
     () => ({ chats, isTypingById, loadInitialMessages, loadMoreMessages, sendMessage, archiveAndStartNew, clearLocalChatState }),
     [chats, isTypingById, loadInitialMessages, loadMoreMessages, sendMessage, archiveAndStartNew, clearLocalChatState]
   );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// --- HOOK ATUALIZADO ---
export const useChatController = (chatId: string | null) => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatController must be used within ChatProvider');

  const chatData = chatId ? (ctx.chats[chatId] || initialChatData) : initialChatData;
  const isTyping = chatId ? !!ctx.isTypingById[chatId] : false;

  const stableLoadInitialMessages = useCallback(() => {
    if (chatId) {
       console.log(`[useChatController] Calling loadInitialMessages for ${chatId}`);
      return ctx.loadInitialMessages(chatId);
    }
    console.warn("[useChatController] Attempted to call loadInitialMessages with null chatId.");
    return Promise.resolve();
  }, [ctx, chatId]); 

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

   const stableClearLocalChatState = useCallback((idToClear: string) => {
        console.log(`[useChatController] Calling clearLocalChatState for ${idToClear}`);
       ctx.clearLocalChatState(idToClear);
   }, [ctx]); 


  return useMemo(() => ({
    ...chatData,
    isTyping: isTyping,
    loadInitialMessages: stableLoadInitialMessages,
    loadMoreMessages: stableLoadMoreMessages,
    sendMessage: stableSendMessage,
    archiveAndStartNew: stableArchiveAndStartNew,
    clearLocalChatState: stableClearLocalChatState,
  }), [chatData, isTyping, stableLoadInitialMessages, stableLoadMoreMessages, stableSendMessage, stableArchiveAndStartNew, stableClearLocalChatState]);
};