// src/services/chatCacheService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../types/chat';
import { ChatCacheData } from '../types/chat';

const CACHE_PREFIX = '@chatMessages:';
const MAX_CACHE_MESSAGES = 30; // Manter as últimas 30 mensagens por chat
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // Cache válido por 24 horas (exemplo)



// Chave usada no AsyncStorage para um chat específico
const getCacheKey = (chatId: string): string => `${CACHE_PREFIX}${chatId}`;

/**
 * Busca os dados cacheados para um chat.
 * Retorna null se não houver cache ou se estiver expirado.
 */
export const getCachedChatData = async (chatId: string): Promise<ChatCacheData | null> => {
  try {
    const key = getCacheKey(chatId);
    const cachedJson = await AsyncStorage.getItem(key);
    if (!cachedJson) {
      console.log(`[Cache] No cache found for ${chatId}`);
      return null;
    }

    const cachedData: ChatCacheData = JSON.parse(cachedJson);

    // Verifica se o cache expirou
    if (Date.now() - cachedData.timestamp > CACHE_EXPIRY_MS) {
      console.log(`[Cache] Cache expired for ${chatId}. Removing.`);
      await AsyncStorage.removeItem(key); // Remove cache expirado
      return null;
    }

    console.log(`[Cache] Valid cache found for ${chatId}. Messages: ${cachedData.messages.length}, NextPage: ${cachedData.nextPage}`);
    return cachedData;
  } catch (error) {
    console.error(`[Cache] Error getting cache for ${chatId}:`, error);
    return null;
  }
};

/**
 * Salva os dados de um chat no cache. Garante que apenas as últimas MAX_CACHE_MESSAGES sejam salvas.
 */
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
  } catch (error) {
    console.error(`[Cache] Error setting cache for ${chatId}:`, error);
  }
};

/**
 * Remove o cache de um chat específico.
 */
export const removeCachedChatData = async (chatId: string): Promise<void> => {
  try {
    const key = getCacheKey(chatId);
    await AsyncStorage.removeItem(key);
    console.log(`[Cache] Cache removed for ${chatId}`);
  } catch (error) {
    console.error(`[Cache] Error removing cache for ${chatId}:`, error);
  }
};

// TODO (Opcional): Implementar lógica LRU se necessário.
// Isso envolveria manter uma lista ordenada de chaves de chat em AsyncStorage
// e remover a mais antiga quando um novo cache for adicionado além de um limite X.