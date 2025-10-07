// src/services/chatService.ts
import api from './api';
import { ChatMessage, PaginatedMessages } from '../types/chat'; // Import PaginatedMessages type

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
  async sendMessage(chatId: string, content: string): Promise<ChatMessage> {
    const response = await api.post<ChatMessage>(`/api/v1/chats/${chatId}/messages/`, { content });
    return response;
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

  // Other functions like rewriteMessage or synthesizeSpeech would go here if needed.
};

// Mocks for development
const mockChatService = {
  async getMessages(chatId: string, page: number): Promise<PaginatedMessages> { return { count: 0, next: null, previous: null, results: [] }; },
  async sendMessage(chatId: string, content: string): Promise<ChatMessage> { 
    return { id: 'mock', role: 'assistant', content: 'Mock response', created_at: new Date().toISOString() };
  },
  async archiveAndCreateNewChat(chatId: string): Promise<{ new_chat_id: string }> { return { new_chat_id: 'new_mock_id' }; },
};

const USE_MOCK_API = false;
export const chatService = USE_MOCK_API ? mockChatService : realChatService;