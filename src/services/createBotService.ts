// src/services/createBotService.ts
import api from './api';
import { BotDetails } from './botSettingsService'; // Reusing BotDetails type for consistency.

/**
 * Defines the shape of the data required to create a new bot.
 * This is sent from the CreateBotScreen to this service.
 */
export type CreateBotPayload = {
  name: string;
  description?: string; // Adicionado
  prompt: string;
  avatarUrl?: string; // Optional for initial creation
  settings: {
    voice: string;
    publicity: 'Private' | 'Guests' | 'Public';
  };
  // The list of category IDs selected by the user
  category_ids: string[];
};

/**
 * Real API implementation for the Create Bot service.
 * This makes the actual HTTP request to the backend.
 */
const realCreateBotService = {
  async createBot(payload: CreateBotPayload): Promise<BotDetails> {
    // This is the object with the nested 'settings' that we receive from the screen
    console.log(`[API] Received payload from screen:`, payload);

    // Flatten the payload to match what the Django serializer expects.
    // The nested 'settings' object is removed, and its properties are moved to the top level.
    const flatPayload = {
      name: payload.name,
      description: payload.description, // Adicionado
      prompt: payload.prompt,
      avatar_url: payload.avatarUrl, // Match backend field name
      voice: payload.settings.voice,
      publicity: payload.settings.publicity,
      // Pass the array of category IDs
      category_ids: payload.category_ids,
    };

    // This log is useful for debugging to see the exact object being sent.
    console.log(`[API] Sending flattened payload to server:`, flatPayload);
    
    // The endpoint in the backend for creating bots is /api/v1/bots/
    const response = await api.post<BotDetails>('/api/v1/bots/', flatPayload);
    return response;
  },
};

/**
 * Mock implementation for the Create Bot service.
 * Simulates creating a new bot and returning its details without a network call.
 * Useful for frontend development and testing.
 */
const mockCreateBotService = {
  async createBot(payload: CreateBotPayload): Promise<BotDetails> {
    console.log(`[MOCK] Creating bot with payload:`, payload);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    return {
      id: `bot-${Date.now()}`,
      name: payload.name,
      handle: `@${payload.name.replace(/\s/g, '').toLowerCase()}`,
      avatarUrl: payload.avatarUrl,
      stats: { monthlyUsers: '0', followers: '0' },
      // Mock service still uses the nested structure for its return type example
      settings: {
        voice: payload.settings.voice,
        language: 'English', // language is removed but mock can keep it for now
        publicity: payload.settings.publicity,
      },
      tags: ['newly_created'],
      createdByMe: true,
    };
  },
};

// This flag allows for easily switching between mock and real data sources.
const USE_MOCK_API = false;

export const createBotService = USE_MOCK_API ? mockCreateBotService : realCreateBotService;