// src/services/chatListService.ts
import api from './api';
import { ChatListItem } from '../types/chat'; // Import the correct type for our list items

/**
 * Real API implementation for the Chat List service.
 */
const realChatListService = {
  /**
   * Fetches the list of active chat sessions for the current user.
   * The list is ordered by the most recent message.
   * @returns A promise that resolves with an array of ChatListItem objects.
   */
  async getActiveChats(): Promise<ChatListItem[]> {
    console.log(`[API] Fetching active chats`);
    try {
      const response = await api.get<ChatListItem[]>('/api/v1/chats/');
      return response;
    } catch (error) {
      console.error("Failed to fetch active chats:", error);
      // Return an empty array in case of an error to prevent the app from crashing.
      return [];
    }
  },
};

/**
 * Mock implementation for the Chat List service.
 */
const mockChatListService = {
  async getActiveChats(): Promise<ChatListItem[]> {
    console.log(`[MOCK] Fetching active chats`);
    await new Promise(resolve => setTimeout(resolve, 800));
    // Return an empty array or mocked data for testing
    return [];
  },
};

const USE_MOCK_API = false;

export const chatListService = USE_MOCK_API ? mockChatListService : realChatListService;