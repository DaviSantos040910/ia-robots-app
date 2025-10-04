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

const realCreateBotService = {
  async createBot(payload: CreateBotPayload): Promise<BotDetails> {
    // This is the object with the nested 'settings' that we receive from the screen
    console.log(`[API] Received payload from screen:`, payload);

    // --- CORREÇÃO ---
    // Achatamos o objeto para que 'voice', 'language', e 'publicity' fiquem no nível principal.
    // Também renomeamos 'avatarUrl' para 'avatar_url' para corresponder ao backend.
    const flatPayload = {
      name: payload.name,
      prompt: payload.prompt,
      avatar_url: payload.avatarUrl, // Renamed field
      voice: payload.settings.voice,
      language: payload.settings.language,
      publicity: payload.settings.publicity,
    };

    // Este log mostrará o objeto final que está sendo enviado para a API
    console.log(`[API] Sending flattened payload to server:`, flatPayload);
    
    // O endpoint no backend para criação de bots é /api/v1/bots/
    const response = await api.post<BotDetails>('/api/v1/bots/', flatPayload);
    return response;
  },
};

// --- Mock Service (for testing purposes) ---
const mockCreateBotService = {
  async createBot(payload: CreateBotPayload): Promise<BotDetails> {
    console.log(`[MOCK] Creating bot with payload:`, payload);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      id: `bot-${Date.now()}`,
      name: payload.name,
      handle: `@${payload.name.replace(/\s/g, '').toLowerCase()}`,
      avatarUrl: payload.avatarUrl,
      stats: { monthlyUsers: '0', followers: '0' },
      settings: payload.settings,
      tags: ['newly_created'],
      createdByMe: true,
    };
  },
};

const USE_MOCK_API = false;
export const createBotService = USE_MOCK_API ? mockCreateBotService : realCreateBotService;