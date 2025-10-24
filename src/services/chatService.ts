// src/services/chatService.ts
import api from './api';
import { ChatMessage, PaginatedMessages, ChatListItem } from '../types/chat'; // Import PaginatedMessages type
import { string } from 'yup';

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
  }
};

const USE_MOCK_API = false;
export const chatService = USE_MOCK_API ? mockChatService : realChatService;