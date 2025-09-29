// src/services/createBotService.ts
import api from './api';
import { BotDetails } from './botSettingsService'; // Reusing BotDetails type for consistency.

export type CreateBotPayload = {
  name: string;
  prompt: string;
  avatarUrl?: string; // Optional for initial creation, can be updated later.
  settings: {
    voice: string;
    language: string;
    publicity: 'Private' | 'Guests' | 'Public';
  };
};

// --- Configuration ---
const USE_MOCK_API = true;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock implementation for the Create Bot service.
 * Simulates creating a new bot and returning its details.
 */
const mockCreateBotService = {
  async createBot(payload: CreateBotPayload): Promise<BotDetails> {
    console.log(`[MOCK] Creating bot with payload:`, payload);
    await delay(1500); // Simulate network delay

    // Simulate a successful creation with some generated details.
    return {
      id: `bot-${Date.now()}`,
      name: payload.name,
      handle: `@${payload.name.replace(/\s/g, '').toLowerCase()}`, // Simplified handle generation
      avatarUrl: payload.avatarUrl || 'https://i.imgur.com/example.png', // Default avatar if not provided
      stats: {
        monthlyUsers: '0',
        followers: '0',
      },
      settings: payload.settings,
      tags: ['newly_created'],
      createdByMe: true, // Creator is always true for a newly created bot.
    };
  },
};

/**
 * Real API implementation for the Create Bot service.
 */
const realCreateBotService = {
  async createBot(payload: CreateBotPayload): Promise<BotDetails> {
    console.log(`[API] Creating bot with payload:`, payload);
    const response = await api.post<BotDetails>('/v1/bots', payload);
    return response;
  },
};

export const createBotService = USE_MOCK_API ? mockCreateBotService : realCreateBotService;