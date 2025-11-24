// src/services/chatCacheService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../types/chat';
import { ChatCacheData } from '../types/chat';
import config from '../config'; // Importar config para pegar a URL atual

const env = config();
const CACHE_PREFIX = '@chatMessages:';
const CACHE_LRU_LIST_KEY = '@chatCacheLRUList';
const MAX_CACHED_CHATS = 15;
const MAX_CACHE_MESSAGES = 30;
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

// --- Função Auxiliar para Corrigir URLs (Fix IP Issue) ---
const fixMessageUrls = (messages: ChatMessage[]): ChatMessage[] => {
  if (!env.isDev) return messages; // Só aplica em dev

  const currentBaseUrl = env.api.baseUrl;
  // Extrai o host atual (ex: http://192.168.0.10:8000)
  
  return messages.map(msg => {
    if (msg.attachment_url && msg.attachment_url.startsWith('http')) {
      try {
        // Se a URL do anexo não começar com a baseUrl atual, tentamos corrigir
        if (!msg.attachment_url.startsWith(currentBaseUrl)) {
          const urlParts = msg.attachment_url.split('/media/');
          if (urlParts.length > 1) {
            // Reconstrói a URL com o novo IP base
            const newUrl = `${currentBaseUrl}/media/${urlParts[1]}`;
            console.log(`[Cache] Fixed URL: ${msg.attachment_url} -> ${newUrl}`);
            return { ...msg, attachment_url: newUrl };
          }
        }
      } catch (e) {
        // Ignora erros de parse
      }
    }
    return msg;
  });
};

// --- LRU Helpers (Mantidos iguais) ---
const getLRUList = async (): Promise<string[]> => {
  try {
    const listJson = await AsyncStorage.getItem(CACHE_LRU_LIST_KEY);
    return listJson ? JSON.parse(listJson) : [];
  } catch (error) {
    console.error('[Cache] Error getting LRU list:', error);
    return [];
  }
};

const setLRUList = async (list: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHE_LRU_LIST_KEY, JSON.stringify(list));
  } catch (error) {
    console.error('[Cache] Error setting LRU list:', error);
  }
};

const updateLRUList = async (chatId: string): Promise<string[]> => {
  let currentList = await getLRUList();
  currentList = currentList.filter(id => id !== chatId);
  const newList = [chatId, ...currentList];
  await setLRUList(newList);
  return newList;
};

const removeFromLRUList = async (chatId: string): Promise<void> => {
    let currentList = await getLRUList();
    const newList = currentList.filter(id => id !== chatId);
    if (newList.length < currentList.length) {
        await setLRUList(newList);
    }
};

const evictLRUIfNeeded = async (currentList: string[]): Promise<void> => {
  if (currentList.length > MAX_CACHED_CHATS) {
    const chatIdToRemove = currentList.pop();
    if (chatIdToRemove) {
      await removeCachedChatData(chatIdToRemove);
      await setLRUList(currentList);
    }
  }
};


// --- Funções Principais ---

const getCacheKey = (chatId: string): string => `${CACHE_PREFIX}${chatId}`;

export const getCachedChatData = async (chatId: string): Promise<ChatCacheData | null> => {
  try {
    const key = getCacheKey(chatId);
    const cachedJson = await AsyncStorage.getItem(key);
    if (!cachedJson) {
      await removeFromLRUList(chatId);
      return null;
    }

    const cachedData: ChatCacheData = JSON.parse(cachedJson);

    if (Date.now() - cachedData.timestamp > CACHE_EXPIRY_MS) {
      await removeCachedChatData(chatId);
      return null;
    }

    // ✅ APLICA A CORREÇÃO DE URLS AQUI
    cachedData.messages = fixMessageUrls(cachedData.messages);

    await updateLRUList(chatId);
    return cachedData;
  } catch (error) {
    console.error(`[Cache] Error getting cache for ${chatId}:`, error);
     try {
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
    const messagesToCache = data.messages.slice(-MAX_CACHE_MESSAGES);
    const dataToStore: ChatCacheData = {
      ...data,
      messages: messagesToCache,
      timestamp: Date.now(),
    };

    const jsonValue = JSON.stringify(dataToStore);
    await AsyncStorage.setItem(key, jsonValue);
    
    const updatedList = await updateLRUList(chatId);
    await evictLRUIfNeeded(updatedList);

  } catch (error) {
    console.error(`[Cache] Error setting cache for ${chatId}:`, error);
  }
};


export const removeCachedChatData = async (chatId: string): Promise<void> => {
  try {
    const key = getCacheKey(chatId);
    await AsyncStorage.removeItem(key);
    await removeFromLRUList(chatId);
  } catch (error) {
    console.error(`[Cache] Error removing cache for ${chatId}:`, error);
  }
};

export const clearAllChatCache = async (): Promise<void> => {
    try {
        const allKeys = await AsyncStorage.getAllKeys();
        const chatKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX) || key === CACHE_LRU_LIST_KEY);
        if (chatKeys.length > 0) {
            await AsyncStorage.multiRemove(chatKeys);
        }
    } catch (error) {
        console.error('[Cache] Error clearing all chat cache:', error);
    }
};