// src/services/botSettingsService.ts
import api from './api';

// This type definition can be shared across the app, e.g., in `src/types/chat.ts`.
export type BotDetails = {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  stats: {
    monthlyUsers: string;
    followers: string;
  };
  settings: {
    voice: string;
    language: string;
    publicity: 'Private' | 'Guests' | 'Public';
  };
  tags: string[];
  // This flag will be sent by the backend to determine user permissions.
  createdByMe: boolean;
};

// --- Configuration ---
const USE_MOCK_API = true;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock implementation for the Bot Settings service.
 */
const mockBotSettingsService = {
  async getBotDetails(botId: string): Promise<BotDetails> {
    console.log(`[MOCK] Fetching details for botId: "${botId}"`);
    await delay(600);

    // To test different UI states, you can change `createdByMe` to `false`.
    return {
      id: botId,
      name: 'Space traveler',
      handle: '@StarrySia',
      stats: {
        monthlyUsers: '56K',
        followers: '8.4K',
      },
      settings: {
        voice: 'EnergeticYouth',
        language: 'English',
        publicity: 'Public',
      },
      tags: ['featured', 'popular'],
      createdByMe: true, // Set to `false` to test the non-owner view.
    };
  },
};

/**
 * Real API implementation for the Bot Settings service.
 */
const realBotSettingsService = {
  async getBotDetails(botId: string): Promise<BotDetails> {
    console.log(`[API] Fetching details for botId: "${botId}"`);
    const response = await api.get<BotDetails>(`/v1/bots/${botId}/details`);
    return response;
  },
};

export const botSettingsService = USE_MOCK_API ? mockBotSettingsService : realBotSettingsService;