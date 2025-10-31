// src/contexts/chat/ChatProvider.tsx
import React, { createContext, useContext, useMemo, useState, useCallback, useRef } from 'react';
import { ChatMessage, PaginatedMessages } from '../../types/chat';
import { chatService } from '../../services/chatService';
import { getCachedChatData, setCachedChatData, removeCachedChatData} from '../../services/chatCacheService';
import { ChatCacheData } from '../../types/chat';
import { AttachmentPickerResult, attachmentService } from '../../services/attachmentService';

// --- DEFINITIONS ---
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
  clearLocalChatState: (chatId: string) => void; // Clears only in-memory state
  sendAttachment: (chatId: string, file: AttachmentPickerResult) => Promise<void>;
};

const initialChatData: ChatData = {
    messages: [],
    nextPage: 1,
    isLoadingMore: false,
    isLoadingInitial: false,
    hasLoadedOnce: false,
};

// Initialize with null, the consumer hook (useChatController) will handle the null case.
const ChatContext = createContext<ChatStore | null>(null);
type ChatsState = Record<string, ChatData>;
// --- FIM DAS DEFINIÇÕES ---

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<ChatsState>({});
  const [isTypingById, setIsTypingById] = useState<Record<string, boolean>>({});
  const activeSendPromises = useRef<Record<string, Promise<any>>>({});

  // Function to update the state for a specific chat ID
  const setChatData = (chatId: string, updater: (prevData: ChatData) => Partial<ChatData>) => {
    setChats(prevChats => {
      const currentChatState = prevChats[chatId] || initialChatData;
      const updates = updater(currentChatState);
      const newMessages = updates.messages !== undefined ? updates.messages : currentChatState.messages;

      // Duplicate ID check (optional but good practice)
      if (newMessages) {
        const ids = newMessages.map(m => m.id);
        if (ids.length !== new Set(ids).size) {
            console.error(`[ChatProvider] setChatData DETECTED DUPLICATE IDs for chatId ${chatId} BEFORE setting state! IDs:`, ids);
            // Optionally, add logic here to filter duplicates before setting state
        }
      }

      return {
        ...prevChats,
        [chatId]: {
          ...currentChatState,
          ...updates,
          // Ensure messages is always an array, even if updates.messages is undefined
          messages: newMessages ?? [],
        },
      };
    });
  };

  // --- loadInitialMessages ---
  const loadInitialMessages = useCallback(async (chatId: string) => {
    // Prevent multiple simultaneous loads for the same chat
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

    // 1. Try loading from cache
    const cachedData = await getCachedChatData(chatId);

    if (cachedData) {
      console.log(`[ChatProvider] Cache hit for ${chatId}. Loading from cache.`);
      setChatData(chatId, () => ({
        messages: cachedData.messages,
        nextPage: cachedData.nextPage,
        isLoadingInitial: false,
        hasLoadedOnce: true, // Mark as loaded from cache
      }));

      // --- Optional: Background check for newer messages (async function) ---
      const backgroundCheck = async () => {
          try {
            console.log(`[ChatProvider] Background check for newer messages for ${chatId}`);
            const response = await chatService.getMessages(chatId, 1); // Fetch page 1
            const latestMessageTimestampInCache = cachedData.messages.length > 0
              ? cachedData.messages[cachedData.messages.length - 1]?.created_at // Get timestamp of the last message in cache
              : null;

            let newerMessages: ChatMessage[] = [];
            if (latestMessageTimestampInCache) {
                 newerMessages = response.results.filter(
                    (msg: ChatMessage) => msg.created_at > latestMessageTimestampInCache
                );
            } else {
                 // If cache was empty, all fetched messages are "newer"
                 newerMessages = response.results;
            }


            if (newerMessages.length > 0) {
              console.log(`[ChatProvider] Found ${newerMessages.length} newer messages for ${chatId}. Merging.`);
               const messagesToAdd = newerMessages.reverse(); // API results are newest first

               setChatData(chatId, (prev) => {
                 // Prevent duplicates if background check runs multiple times quickly
                  const existingIds = new Set(prev.messages.map(m => m.id));
                  const uniqueNewerMessages = messagesToAdd.filter(nm => !existingIds.has(nm.id));
                  if(uniqueNewerMessages.length < messagesToAdd.length){
                     console.warn("[ChatProvider] Background check detected duplicates during merge");
                  }
                  return { messages: [...prev.messages, ...uniqueNewerMessages] }; // Add newer messages to the end
                });

              // Update cache with merged messages and correct nextPage from API
              await setCachedChatData(chatId, {
                // Get the most up-to-date message list from state after the merge
                messages: [...cachedData.messages, ...messagesToAdd.filter(nm => !cachedData.messages.some(cm => cm.id === nm.id))], // Ensure unique merge for cache
                nextPage: response.next ? 2 : null, // nextPage from the API response
                timestamp: Date.now() // Update timestamp
              });
            } else {
               console.log(`[ChatProvider] No newer messages found for ${chatId} in background check.`);
               // Update cache timestamp even if no new messages, marking it as recently checked
               await setCachedChatData(chatId, { ...cachedData, timestamp: Date.now() });
            }
          } catch (error) {
            console.error(`[ChatProvider] Background check failed for ${chatId}:`, error);
            // Don't disrupt the user experience if the background check fails
          }
      };
      backgroundCheck(); // Start the check without awaiting it
      // --- End Background Check ---
      return; // Return early as cache was loaded
    }

    // 2. If no valid cache, fetch from API
    console.log(`[ChatProvider] Cache miss for ${chatId}. Fetching from API.`);
    try {
      const response = await chatService.getMessages(chatId, 1);
      console.log(`[ChatProvider] Received initial messages for ${chatId} from API. Count: ${response.results.length}. Next page exists: ${!!response.next}`);
      const apiMessages = response.results.reverse(); // API sends newest first, reverse for display order (oldest first)
      const nextPageApi = response.next ? 2 : null;

      setChatData(chatId, () => ({
        messages: apiMessages,
        nextPage: nextPageApi,
        isLoadingInitial: false,
        hasLoadedOnce: true, // Mark as loaded from API
      }));

      // 3. Save the fetched data to cache
      await setCachedChatData(chatId, {
        messages: apiMessages,
        nextPage: nextPageApi,
        timestamp: Date.now(), // setCachedChatData handles the timestamp
      });

    } catch (error) {
      console.error(`[ChatProvider] Failed to load initial messages for ${chatId} from API:`, error);
      setChatData(chatId, () => ({ isLoadingInitial: false, hasLoadedOnce: false })); // Indicate loading failed
    }
  }, []); // Empty dependency array because it doesn't rely on changing props/state directly

  // --- loadMoreMessages ---
  const loadMoreMessages = useCallback(async (chatId: string) => {
    let currentChat: ChatData | undefined;
    setChats(currentChats => {
      currentChat = currentChats[chatId];
      return currentChats;
    });

    // Prevent loading more if already loading, no next page, or initial load is happening
    if (!currentChat || currentChat.isLoadingMore || !currentChat.nextPage || currentChat.isLoadingInitial) {
        console.log(`[ChatProvider] Skipping loadMoreMessages (${chatId}). Conditions not met: isLoadingMore=${currentChat?.isLoadingMore}, nextPage=${currentChat?.nextPage}, isLoadingInitial=${currentChat?.isLoadingInitial}`);
        return;
    }

    const pageToFetch = currentChat.nextPage;
    console.log(`[ChatProvider] Loading more messages for chatId: ${chatId}, page: ${pageToFetch}`);
    setChatData(chatId, () => ({ isLoadingMore: true }));

    try {
      const response = await chatService.getMessages(chatId, pageToFetch);
      console.log(`[ChatProvider] Received more messages for ${chatId}. Count: ${response.results.length}. Next page exists: ${!!response.next}`);
      const nextPageApi = response.next ? pageToFetch + 1 : null; // Calculate the next page number

      setChatData(chatId, (prev) => {
        // Filter out any messages already present in the state (handles potential overlaps/duplicates)
        const existingIds = new Set(prev.messages?.map((m: ChatMessage) => m.id) ?? []);
        const newUniqueMessages = response.results.filter((fetchedMessage: ChatMessage) => !existingIds.has(fetchedMessage.id));

        if (newUniqueMessages.length < response.results.length) {
            console.warn(`[ChatProvider] loadMoreMessages found ${response.results.length - newUniqueMessages.length} duplicate messages for page ${pageToFetch}.`);
        }

        if (newUniqueMessages.length === 0) {
           console.log(`[ChatProvider] No unique older messages found in fetched page ${pageToFetch}.`);
           // Still update loading state and nextPage based on API response
           return {
             isLoadingMore: false,
             nextPage: nextPageApi, // Update nextPage even if no new messages were added
           };
        }

        console.log(`[ChatProvider] Adding ${newUniqueMessages.length} unique older messages from page ${pageToFetch}.`);
        // Prepend the older messages (reversed API results) to the existing messages
        const combinedMessages = [...newUniqueMessages.reverse(), ...(prev.messages ?? [])];

        // Final duplicate check (optional but good practice)
        const finalIds = combinedMessages.map((m: ChatMessage) => m.id);
        if (finalIds.length !== new Set(finalIds).size) {
            console.error('[ChatProvider] DUPLICATE IDs detected after merging in loadMoreMessages!', finalIds);
            // Implement recovery logic if needed (e.g., filter duplicates again)
        }

        return {
          messages: combinedMessages,
          nextPage: nextPageApi, // Update nextPage based on the API response
          isLoadingMore: false,
        };
      });
      // Note: Older messages loaded via scroll are usually not saved back to the persistent cache
    } catch (error) {
      console.error(`[ChatProvider] Failed to load more messages for ${chatId}, page ${pageToFetch}:`, error);
      setChatData(chatId, () => ({ isLoadingMore: false })); // Stop loading indicator on error
    }
  }, []); // Empty dependency array

  // --- sendMessage ---
  const sendMessage = useCallback(async (chatId: string, text: string) => {
    // Prevent sending if another send is in progress for this chat
    if (activeSendPromises.current[chatId]!== undefined) {
      console.warn(`[ChatProvider] sendMessage (${chatId}) aborted: another send is already in progress.`);
      return;
    }

    // Create temporary user message for optimistic UI update
    const tempUserMsgId = `temp_user_${Date.now()}_${Math.random()}`;
    const tempUserMsg: ChatMessage = {
      id: tempUserMsgId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };
    console.log(`[ChatProvider] Sending message. Temp ID: ${tempUserMsgId}, Content: "${text}"`);

    // Optimistically add the temporary message to the state
    setChatData(chatId, (prev) => ({
        messages: [...(prev.messages ?? []), tempUserMsg]
    }));
    setIsTypingById((prev) => ({ ...prev, [chatId]: true })); // Show typing indicator

    // --- Create and store the promise ---
    const sendPromise = chatService.sendMessage(chatId, text)
      .then(async (apiReplies) => { // Make the .then callback async to allow await inside
        console.log(`[ChatProvider] Received ${apiReplies.length} replies for temp ID ${tempUserMsgId}.`);
        setIsTypingById((prev) => ({ ...prev, [chatId]: false })); // Stop typing indicator

        let finalMessages: ChatMessage[] = []; // Variable to hold the final message list
        let finalNextPage: number | null = 1;  // Variable to hold the nextPage state

        // Update the state: replace temp message with actual messages from API
        setChats(prevChats => {
            const currentChatState = prevChats[chatId];
            if (!currentChatState) {
                console.error(`[ChatProvider] Chat state for ${chatId} not found during sendMessage update!`);
                return prevChats; // Should not happen if optimistic update worked
            }

            // Remove the temporary message
            const messagesWithoutTemp = (currentChatState.messages ?? []).filter(m => m.id !== tempUserMsgId);
            if (messagesWithoutTemp.length === (currentChatState.messages?.length ?? 0)) {
               console.warn(`[ChatProvider] Temporary message ID ${tempUserMsgId} was NOT found during update!`);
            } else {
               console.log(`[ChatProvider] Temporary message ID ${tempUserMsgId} successfully removed.`);
            }

            // Combine messages (old ones + new ones from API)
            finalMessages = [...messagesWithoutTemp, ...apiReplies];
            finalNextPage = currentChatState.nextPage; // Preserve the current nextPage value

            // Final duplicate check
            const finalIds = finalMessages.map(m => m.id);
            if (finalIds.length !== new Set(finalIds).size) {
                 console.error('[ChatProvider] DUPLICATE IDs detected in finalMessages after sending!', finalIds);
                 // Simple de-duplication strategy: keep the last occurrence
                 const uniqueMessagesMap = new Map<string, ChatMessage>();
                 finalMessages.forEach(msg => uniqueMessagesMap.set(msg.id, msg));
                 finalMessages = Array.from(uniqueMessagesMap.values());
                 console.warn('[ChatProvider] Attempted duplicate removal.');
            } else {
                 console.log('[ChatProvider] Final message list appears unique.');
            }
            console.log('[ChatProvider] Final messages count after update:', finalMessages.length);

            // Return the updated state for this chat ID
            return {
                ...prevChats,
                [chatId]: {
                    ...currentChatState,
                    messages: finalMessages, // Use the updated, potentially de-duplicated list
                    // nextPage remains unchanged here
                }
            };
        });

        // --- Update Cache AFTER state update ---
        // Use the `finalMessages` and `finalNextPage` captured during state update
        await setCachedChatData(chatId, {
          messages: finalMessages,
          nextPage: finalNextPage,
          timestamp: Date.now(), // Update timestamp
        });
        // --- End Cache Update ---

      })
      .catch(error => { // Handle API errors
        console.error(`[ChatProvider] Failed to send message (temp ID ${tempUserMsgId}):`, error);
        setIsTypingById((prev) => ({ ...prev, [chatId]: false })); // Stop typing indicator

        // Create an error message to display in the chat
        const errorMsgId = `err_${Date.now()}_${Math.random()}`;
        const errorMsg: ChatMessage = {
          id: errorMsgId,
          role: 'assistant', // Displayed as a bot message
          content: 'An unexpected error occurred while generating a response. Please try again.',
          created_at: new Date().toISOString()
        };

        // Update state: Replace temp message with error message OR add error message if temp was lost
        setChatData(chatId, (prev) => {
             const messageExists = prev.messages.some(m => m.id === tempUserMsgId);
             let updatedMessages: ChatMessage[];
             if (messageExists) {
                updatedMessages = prev.messages.map(m => m.id === tempUserMsgId ? errorMsg : m);
             } else {
                // If temp message somehow disappeared, just add the error message
                console.warn(`[ChatProvider] Temp message ${tempUserMsgId} not found during error handling. Adding error message.`);
                updatedMessages = [...(prev.messages ?? []), errorMsg];
             }
             return { messages: updatedMessages };
        });
        // Note: Do not update cache on error to avoid saving the error message permanently
      })
      .finally(() => { // Cleanup after success or error
        delete activeSendPromises.current[chatId]; // Remove the promise lock
        console.log(`[ChatProvider] Send promise for ${chatId} (temp ID ${tempUserMsgId}) finished.`);
      });

    // Store the promise to prevent concurrent sends
    activeSendPromises.current[chatId] = sendPromise;

  }, []); // Empty dependency array

  // --- archiveAndStartNew ---
  const archiveAndStartNew = useCallback(async (chatId: string): Promise<string | null> => {
      console.log(`[ChatProvider] Archiving chat ${chatId} and creating new.`);
      try {
          // Call API to archive and get the new chat ID
          const { new_chat_id } = await chatService.archiveAndCreateNewChat(chatId);
          console.log(`[ChatProvider] New chat ID ${new_chat_id} received. Clearing old in-memory state for ${chatId}.`);

          // Clear the in-memory state for the old chat ID
          clearLocalChatState(chatId);
          // Also clear any potential in-memory state for the new chat ID to ensure it starts fresh
          clearLocalChatState(new_chat_id);

          // Do NOT remove the persistent cache for the archived chat here.
          // It might be needed if the user navigates to the archived chats screen.

          return new_chat_id; // Return the ID of the newly created active chat
      } catch (error) {
          console.error(`[ChatProvider] Failed to archive chat ${chatId}:`, error);
          return null; // Return null on failure
      }
 // Include clearLocalChatState in dependencies as it's defined outside but used inside
  }, [/* Removed clearLocalChatState dependency as it's stable now */]);


  // --- clearLocalChatState ---
  // Clears only the IN-MEMORY state for a given chat ID, not the persistent cache.

  const sendAttachment = useCallback(async (chatId: string, file: AttachmentPickerResult) => {
    console.log(`[ChatProvider] Sending attachment for chat ${chatId}:`, file.name);

    let currentChat: ChatData | undefined;
    setChats(currentChats => {
      currentChat = currentChats[chatId];
      return currentChats;
    });

    if (!currentChat) {
      console.warn(`[ChatProvider] Chat ${chatId} not initialized`);
      return;
    }

    // 1. Cria mensagem temporária
    const tempId = `temp-${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      role: 'user',
      content: `📎 ${file.name}`,
      created_at: new Date().toISOString(),
      attachment_url: file.uri,
      attachment_type: file.type,
      original_filename: file.name,
    };

    // Adiciona mensagem temporária
    setChats(prev => ({
      ...prev,
      [chatId]: {
        ...prev[chatId],
        messages: [...prev[chatId].messages, tempMessage],
      },
    }));

    // Adiciona "Bot está digitando..."
    setIsTypingById((prev) => ({ ...prev, [chatId]: true }));

    try {
      // 2. Faz upload (agora espera uma lista)
      const apiReplies = await attachmentService.uploadAttachment(chatId, file);
      
      // Para "Bot está digitando..."
      setIsTypingById((prev) => ({ ...prev, [chatId]: false }));

      // 3. Remove mensagem temporária e adiciona as reais (user + bot)
      setChats(prev => {
        const filtered = prev[chatId].messages.filter((m: ChatMessage) => m.id !== tempId);
        const finalMessages = [...filtered, ...apiReplies]; // Adiciona a LISTA de respostas

        // 4. Atualiza o cache (movido para dentro do setChats)
        setCachedChatData(chatId, {
          messages: finalMessages,
          nextPage: prev[chatId].nextPage, // Mantém o nextPage
          timestamp: Date.now(),
        });

        return {
          ...prev,
          [chatId]: {
            ...prev[chatId],
            messages: finalMessages,
          },
        };
      });

      console.log('[ChatProvider] Attachment sent and AI reply received.');
    } catch (error: any) {
      console.error('[ChatProvider] Failed to send attachment:', error);
      setIsTypingById((prev) => ({ ...prev, [chatId]: false })); // Para "digitando"

      // Remove mensagem temporária em caso de erro
      setChats(prev => ({
        ...prev,
        [chatId]: {
          ...prev[chatId],
          messages: prev[chatId].messages.filter((m: ChatMessage) => !(m?.id?.startsWith('temp-'))),
        },
      }));

      throw error;
    }
  }, []); // Mantenha as dependências vazias

  const clearLocalChatState = useCallback((chatId: string) => {
      console.log(`[ChatProvider] Clearing local IN-MEMORY state for chatId: ${chatId}`);
      setChats(prev => {
          const newState = { ...prev };
          // If state exists for this chat, reset it to initial data
          if (newState[chatId]) {
             newState[chatId] = { ...initialChatData };
             console.log(`[ChatProvider] In-memory state for ${chatId} reset to initial.`);
          } else {
             console.log(`[ChatProvider] No in-memory state found for ${chatId} to clear.`);
          }
          return newState;
      });
      // Clear any typing indicator for this chat
      setIsTypingById(prev => {
          const newState = { ...prev };
          delete newState[chatId];
          return newState;
      });
  }, []); // Empty dependency array

  // Memoize the context value
  const value = useMemo(
    () => ({ chats, isTypingById, loadInitialMessages, loadMoreMessages, sendMessage, archiveAndStartNew, clearLocalChatState, sendAttachment }),
    [chats, isTypingById, loadInitialMessages, loadMoreMessages, sendMessage, archiveAndStartNew, clearLocalChatState, sendAttachment]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// --- useChatController Hook ---
// Provides access to chat data and actions for a specific chat ID.
export const useChatController = (chatId: string | null): ChatData & { isTyping: boolean; loadInitialMessages: () => Promise<void>; loadMoreMessages: () => Promise<void>; sendMessage: (text: string) => Promise<void>; archiveAndStartNew: () => Promise<string | null>; clearLocalChatState: (idToClear: string) => void; sendAttachment: (file: AttachmentPickerResult) => Promise<void>; } => {
  const ctx = useContext(ChatContext);
  // Ensure the hook is used within the ChatProvider
  if (!ctx) {
    throw new Error('useChatController must be used within ChatProvider');
  }

  // Get the chat data for the specific chatId, or use initial data if ID is null or not found
  const chatData = chatId ? (ctx.chats[chatId] || initialChatData) : initialChatData;
  // Get the typing status for the specific chatId
  const isTyping = chatId ? !!ctx.isTypingById[chatId] : false;

  // --- Create stable callback references bound to the current chatId ---
  const stableLoadInitialMessages = useCallback(() => {
    if (chatId) {
       console.log(`[useChatController] Calling loadInitialMessages for ${chatId}`);
      return ctx.loadInitialMessages(chatId);
    }
    console.warn("[useChatController] Attempted to call loadInitialMessages with null chatId.");
    return Promise.resolve(); // Return resolved promise if no chatId
  }, [ctx, chatId]); // Depend on context and chatId

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
       return Promise.resolve(null); // Resolve with null if no chatId
   }, [ctx, chatId]);

   // Note: clearLocalChatState doesn't necessarily need to be bound to the *current* chatId
   // It might be called to clear *any* chat's state.
   const stableClearLocalChatState = useCallback((idToClear: string) => {
        console.log(`[useChatController] Calling clearLocalChatState for ${idToClear}`);
       ctx.clearLocalChatState(idToClear);
   }, [ctx]); // Only depends on the context itself

   const stableSendAttachment = useCallback((file: AttachmentPickerResult) => {
       if (chatId) {
           console.log(`[useChatController] Calling sendAttachment for ${chatId}`);
           return ctx.sendAttachment(chatId, file);
       }
        console.warn("[useChatController] Attempted to call sendAttachment with null chatId.");
       return Promise.resolve();
   }, [ctx, chatId]);

  // Memoize the returned object to prevent unnecessary re-renders in consuming components
  return useMemo(() => ({
    ...chatData, // Spread the current chat data (messages, nextPage, loading states, hasLoadedOnce)
    isTyping: isTyping,
    // Provide the stable callback functions
    loadInitialMessages: stableLoadInitialMessages,
    loadMoreMessages: stableLoadMoreMessages,
    sendMessage: stableSendMessage,
    archiveAndStartNew: stableArchiveAndStartNew,
    clearLocalChatState: stableClearLocalChatState,
    sendAttachment: stableSendAttachment,
    // Add type assertion for return type correctness if needed, though useMemo should infer it
  }), [chatData, isTyping, stableLoadInitialMessages, stableLoadMoreMessages, stableSendMessage, stableArchiveAndStartNew, stableClearLocalChatState, stableSendAttachment]);
};