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
  /**
   * Creates a new bot in a two-step process:
   * 1. Create the bot with text-based data.
   * 2. If an avatar is provided, upload it as a separate request.
   * @param payload - The data for the new bot from the CreateBotScreen.
   * @returns A promise that resolves with the final BotDetails.
   */
  async createBot(payload: CreateBotPayload): Promise<BotDetails> {
    
    // --- Step 1: Create the bot with text data ---
    const textPayload = {
      name: payload.name,
      description: payload.description,
      prompt: payload.prompt,
      voice: payload.settings.voice,
      publicity: payload.settings.publicity,
      category_ids: payload.category_ids,
    };

    console.log(`[API] Step 1: Sending text payload to create bot`, textPayload);
    const createdBot = await api.post<BotDetails>('/api/v1/bots/', textPayload);

    // --- Step 2: If an avatar URI exists, upload the image ---
    if (payload.avatarUrl) {
      console.log(`[API] Step 2: Uploading avatar for bot ID ${createdBot.id}`);
      
      const formData = new FormData();
      // 'uri' is the local file path from the image picker
      // 'name' is the filename
      // 'type' is the mime type
      formData.append('avatar_url', {
        uri: payload.avatarUrl,
        name: `avatar_${createdBot.id}.jpg`,
        type: 'image/jpeg',
      } as any);

      try {
        // We use PUT or PATCH to update the existing bot with the image.
        // Let's assume the BotSerializer can handle file uploads on an update.
        const updatedBot = await api.patch<BotDetails>(`/api/v1/bots/${createdBot.id}/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data', // This is crucial for file uploads
          },
        });
        return updatedBot; // Return the bot with the final avatar URL
      } catch (error) {
        console.error("Avatar upload failed:", error);
        // If upload fails, we still return the created bot without the avatar
        return createdBot;
      }
    }

    return createdBot; // Return the bot if no avatar was selected
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