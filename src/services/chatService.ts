// src/services/chatService.ts
import api from './api';
import { ChatMessage, PaginatedMessages, ChatListItem } from '../types/chat'; // Import PaginatedMessages type
import { string } from 'yup';
import config from '../config'; // ✅ Importar config

const env = config(); // ✅ Obter configuração


const realChatService = {
  /**
   * Fetches a specific page of messages for a given chat.
   * @param chatId - The ID of the conversation.
   * @param page - The page number to fetch.
   * @returns A promise that resolves with a paginated list of ChatMessage objects.
   */
  async getMessages(chatId: string, page: number): Promise<PaginatedMessages> {
    console.log(`[API] Fetching messages for chat ${chatId}, page ${page}`);
    const response = await api.get<PaginatedMessages>(`/api/v1/chats/${chatId}/messages/?page=${page}`);
    return response;
  },

  /**
   * Sends a user message to the backend and gets the bot's reply.
   * @param chatId - The ID of the conversation.
   * @param content - The text content of the user's message.
   * @returns A promise that resolves with the assistant's ChatMessage from the API.
   */
  async sendMessage(chatId: string, content: string): Promise<ChatMessage[]> { // --- ALTERADO AQUI ---
    const response = await api.post<ChatMessage[]>(`/api/v1/chats/${chatId}/messages/`, { content });
    return response; // O backend agora retorna um array de mensagens
  },
  
  /**
   * Archives the current chat and creates a new active one.
   * @param chatId - The ID of the chat to archive.
   * @returns A promise that resolves with the ID of the new active chat.
   */
  async archiveAndCreateNewChat(chatId: string): Promise<{ new_chat_id: string }> {
    console.log(`[API] Archiving chat ${chatId}`);
    const response = await api.post<{ new_chat_id: string }>(`/api/v1/chats/${chatId}/archive/`);
    return response;
  },

 /**
   * Sets a specific chat (usually archived) as the active one.
   * This will archive the currently active chat for the same bot.
   * @param chatId - The ID of the chat to activate.
   * @returns A promise that resolves with the details of the newly activated chat.
   */
  async setActiveChat(chatId: string): Promise<ChatListItem> {
    console.log(`[API] Setting chat ${chatId} as active`);
    const response = await api.post<ChatListItem>(`/api/v1/chats/${chatId}/set-active/`);
    return response;
  },

  /**
   * Gets TTS audio for a specific message.
   * @param chatId - The ID of the conversation.
   * @param messageId - The ID of the message to convert to speech.
   * @returns A promise that resolves with the audio blob.
   */
  async getMessageTTS(chatId: string, messageId: string): Promise<Blob> {
    console.log(`[API] Fetching TTS for message ${messageId} in chat ${chatId}`);
    
    // Usando fetch porque precisamos do Blob raw
    // O axios do api.ts converte para JSON automaticamente
    const token = await import('expo-secure-store').then(m => 
      m.getItemAsync('authToken')
    );
    
      const response = await fetch(
      `${env.api.baseUrl}/api/v1/chats/${chatId}/messages/${messageId}/tts/`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Erro ao buscar áudio');
    }

    return response.blob();
  },

  /**
   * Toggles like status for a message.
   * @param chatId - The ID of the conversation.
   * @param messageId - The ID of the message to like/unlike.
   * @returns A promise that resolves with the updated like status.
   */
  async toggleMessageLike(chatId: string, messageId: string): Promise<{ liked: boolean }> {
    console.log(`[API] Toggling like for message ${messageId}`);
    const response = await api.post<{ liked: boolean }>(
      `/api/v1/chats/${chatId}/messages/${messageId}/like/`
    );
    return response;
  },
};





// Mocks for development
const mockChatService = {
  async getMessages(chatId: string, page: number): Promise<PaginatedMessages> { return { count: 0, next: null, previous: null, results: [] }; },
  async sendMessage(chatId: string, content: string): Promise<ChatMessage[]> { // --- ALTERADO AQUI ---
    return [{ id: 'mock', role: 'assistant', content: 'Mock response', created_at: new Date().toISOString() }];
  },
  async archiveAndCreateNewChat(chatId: string): Promise<{ new_chat_id: string }> { return { new_chat_id: 'new_mock_id' }; },
  
  async setActiveChat(chatId: string): Promise<ChatListItem> {
    console.log(`[MOCK] Setting chat ${chatId} as active`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      id: chatId,
      status: 'active',
      bot: { id: 'bot_1', name: 'Mock Bot', description: 'Mocked' },
      last_message: null,
      last_message_at: new Date().toISOString(),
    };
  },
async getMessageTTS(chatId: string, messageId: string): Promise<Blob> {
    console.log(`[MOCK] Getting TTS for message ${messageId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    // Retorna um blob vazio para mock
    return new Blob([], { type: 'audio/wav' });
  },

  async toggleMessageLike(chatId: string, messageId: string): Promise<{ liked: boolean }> {
    console.log(`[MOCK] Toggling like for message ${messageId}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return { liked: true };
  },
};

const USE_MOCK_API = false;
export const chatService = USE_MOCK_API ? mockChatService : realChatService;
