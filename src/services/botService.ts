// src/services/botService.ts
import api from './api';
import { ChatBootstrap } from '../types/chat';

// --- Configuration ---
// Switch this flag to `false` to use the real API implementation.
// When `true`, the service will return mock data without making network requests.
const USE_MOCK_API = false;

// Utility to simulate network latency.
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock implementation for the bot service.
 * Simulates fetching chat bootstrap data with a delay.
 * This is useful for developing and testing the UI without a live backend.
 */
const mockBotService = {
  /**
   * Fetches the bootstrap data for a specific chat.
   * @param chatId - The unique identifier for the chat.
   * @returns A promise that resolves with the `ChatBootstrap` data.
   */
  async getChatBootstrap(chatId: string): Promise<ChatBootstrap> {
    console.log(`[MOCK] Fetching bootstrap data for chatId: "${chatId}"`);
    await delay(800); // Simulate network delay for a realistic loading experience.

    // Return a hardcoded mock object. This data structure should match the
    // expected response from your actual backend API.
    return {
      conversationId: chatId,
      bot: {
        name: 'StarryAI bot',
        handle: 'Official',
        // A placeholder or a real remote URL for the bot's avatar.
        avatarUrl: 'https://i.imgur.com/6_p3_C-1_c.png',
      },
      welcome: "Hello. I'm your new friend, StarryAI Bot. You can ask me any questions.",
      // A list of initial suggestion chips to guide the user.
      suggestions: [
        'Customize a savings plan for me.',
        'Have a healthy meal.',
        'U.S. travel plans for 2024.',
      ],
    };
  },
};

/**
 * Real API implementation for the bot service.
 * This service makes actual HTTP requests to the backend API.
 */
const realBotService = {
  async getChatBootstrap(botId: string): Promise<ChatBootstrap> { // Changed param to botId
    console.log(`[API] Fetching bootstrap data for botId: "${botId}"`);
    // Use the new bootstrap endpoint
    const response = await api.get<ChatBootstrap>(`/api/v1/chats/bootstrap/bot/${botId}/`);
    return response;
  },
};

// Export the selected service implementation based on the `USE_MOCK_API` flag.
// This allows for easily switching between mock and real data sources.
export const botService = USE_MOCK_API ? mockBotService : realBotService;