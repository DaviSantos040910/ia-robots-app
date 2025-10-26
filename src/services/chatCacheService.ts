// src/services/chatCacheService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../types/chat';
import {ChatCacheData} from '../types/chat';


const CACHE_PREFIX = '@chatMessages:';
const CACHE_LRU_LIST_KEY = '@chatCacheLRUList'; // Chave para a lista LRU
const MAX_CACHED_CHATS = 15; // Limite de quantos chats manter em cache (ajuste conforme necessário)
const MAX_CACHE_MESSAGES = 30;
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 horas



// --- Funções Auxiliares para LRU ---

/**
 * Obtém a lista LRU atual (array de chatIds, mais recentes primeiro).
 */
const getLRUList = async (): Promise<string[]> => {
  try {
    const listJson = await AsyncStorage.getItem(CACHE_LRU_LIST_KEY);
    return listJson ? JSON.parse(listJson) : [];
  } catch (error) {
    console.error('[Cache] Error getting LRU list:', error);
    return [];
  }
};

/**
 * Salva a lista LRU atualizada.
 */
const setLRUList = async (list: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHE_LRU_LIST_KEY, JSON.stringify(list));
  } catch (error) {
    console.error('[Cache] Error setting LRU list:', error);
  }
};

/**
 * Move um chatId para o início da lista LRU (marcando como mais recentemente usado).
 * Remove o chatId se já existir na lista antes de adicioná-lo ao início.
 */
const updateLRUList = async (chatId: string): Promise<string[]> => {
  let currentList = await getLRUList();
  // Remove chatId se já existir
  currentList = currentList.filter(id => id !== chatId);
  // Adiciona no início
  const newList = [chatId, ...currentList];
  await setLRUList(newList);
  return newList; // Retorna a nova lista para possível uso
};

/**
 * Remove um chatId da lista LRU.
 */
const removeFromLRUList = async (chatId: string): Promise<void> => {
    let currentList = await getLRUList();
    const newList = currentList.filter(id => id !== chatId);
    if (newList.length < currentList.length) {
        await setLRUList(newList);
    }
};


/**
 * Remove o item menos recentemente usado (último da lista) se o limite for excedido.
 */
const evictLRUIfNeeded = async (currentList: string[]): Promise<void> => {
  if (currentList.length > MAX_CACHED_CHATS) {
    const chatIdToRemove = currentList.pop(); // Remove o último item (LRU)
    if (chatIdToRemove) {
      console.log(`[Cache] LRU limit reached (${MAX_CACHED_CHATS}). Evicting chat: ${chatIdToRemove}`);
      await removeCachedChatData(chatIdToRemove); // Remove o cache do chat (chama a função principal que também atualiza a LRU list)
      // A lista já foi modificada com pop(), então salvamos ela
      await setLRUList(currentList);
    }
  }
};


// --- Funções Principais do Cache ---

const getCacheKey = (chatId: string): string => `${CACHE_PREFIX}${chatId}`;

export const getCachedChatData = async (chatId: string): Promise<ChatCacheData | null> => {
  try {
    const key = getCacheKey(chatId);
    const cachedJson = await AsyncStorage.getItem(key);
    if (!cachedJson) {
      console.log(`[Cache] No cache found for ${chatId}`);
      // Mesmo sem cache de dados, remova da lista LRU por segurança, caso tenha ficado órfão
      await removeFromLRUList(chatId);
      return null;
    }

    const cachedData: ChatCacheData = JSON.parse(cachedJson);

    // Verifica se o cache expirou
    if (Date.now() - cachedData.timestamp > CACHE_EXPIRY_MS) {
      console.log(`[Cache] Cache expired for ${chatId}. Removing.`);
      await removeCachedChatData(chatId); // Remove dados e da lista LRU
      return null;
    }

    console.log(`[Cache] Valid cache found for ${chatId}. Messages: ${cachedData.messages.length}, NextPage: ${cachedData.nextPage}`);
    // --- LRU: Atualiza a lista ao acessar ---
    await updateLRUList(chatId);
    // --- Fim LRU ---
    return cachedData;
  } catch (error) {
    console.error(`[Cache] Error getting cache for ${chatId}:`, error);
     try {
        // Tenta remover cache corrompido e da lista LRU
        await removeCachedChatData(chatId);
    } catch (removeError) {
       console.error(`[Cache] Failed to remove corrupted cache for ${chatId}:`, removeError);
    }
    return null;
  }
};


export const setCachedChatData = async (chatId: string, data: ChatCacheData): Promise<void> => {
  try {
    const key = getCacheKey(chatId);
    // Garante que só as últimas N mensagens sejam salvas
    const messagesToCache = data.messages.slice(-MAX_CACHE_MESSAGES);
    const dataToStore: ChatCacheData = {
      ...data,
      messages: messagesToCache,
      timestamp: Date.now(), // Atualiza o timestamp ao salvar
    };

    const jsonValue = JSON.stringify(dataToStore);
    await AsyncStorage.setItem(key, jsonValue);
    console.log(`[Cache] Data saved for ${chatId}. Messages: ${messagesToCache.length}, NextPage: ${data.nextPage}`);

    // --- LRU: Atualiza a lista e remove o mais antigo se necessário ---
    const updatedList = await updateLRUList(chatId);
    await evictLRUIfNeeded(updatedList);
    // --- Fim LRU ---

  } catch (error) {
    console.error(`[Cache] Error setting cache for ${chatId}:`, error);
  }
};


export const removeCachedChatData = async (chatId: string): Promise<void> => {
  try {
    const key = getCacheKey(chatId);
    await AsyncStorage.removeItem(key);
    // --- LRU: Remove da lista também ---
    await removeFromLRUList(chatId);
    // --- Fim LRU ---
    console.log(`[Cache] Cache removed for ${chatId}`);
  } catch (error) {
    console.error(`[Cache] Error removing cache for ${chatId}:`, error);
  }
};

/**
 * (Opcional) Limpa todo o cache de mensagens e a lista LRU.
 * Pode ser útil para logout ou debug.
 */
export const clearAllChatCache = async (): Promise<void> => {
    try {
        const allKeys = await AsyncStorage.getAllKeys();
        const chatKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX) || key === CACHE_LRU_LIST_KEY);
        if (chatKeys.length > 0) {
            await AsyncStorage.multiRemove(chatKeys);
            console.log('[Cache] All chat cache cleared.');
        } else {
            console.log('[Cache] No chat cache found to clear.');
        }
    } catch (error) {
        console.error('[Cache] Error clearing all chat cache:', error);
    }
};