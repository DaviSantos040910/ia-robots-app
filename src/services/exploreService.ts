// src/services/exploreService.ts
import api from './api';
import { Bot } from '../types/chat'; // Use the base Bot type

export type ExploreBotItem = Bot & { is_subscribed?: boolean };
export type Category = { id: string; name: string; };

const realExploreService = {
  async getCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>('/api/v1/explore/categories/');
    return response;
  },

  async getBots(categoryId: string): Promise<ExploreBotItem[]> {
    // The backend should ideally tell us if the user is subscribed to each bot.
    const response = await api.get<ExploreBotItem[]>(`/api/v1/explore/bots/?category_id=${categoryId}`);
    return response;
  },

  async searchBots(query: string): Promise<ExploreBotItem[]> {
    const response = await api.get<ExploreBotItem[]>(`/api/v1/explore/bots/?q=${encodeURIComponent(query)}`);
    return response;
  },

  // --- NEW FUNCTION ---
  // Toggles the subscription status for a given bot.
  async toggleBotSubscription(botId: string): Promise<{ status: 'subscribed' | 'unsubscribed' }> {
    const response = await api.post<{ status: 'subscribed' | 'unsubscribed' }>(`/api/v1/bots/${botId}/subscribe/`);
    return response;
  },
};

// This can be used for development if the backend is down
const mockExploreService = {
    async getCategories(): Promise<Category[]> { return []; },
    async getBots(categoryId: string): Promise<ExploreBotItem[]> { return []; },
    async searchBots(query: string): Promise<ExploreBotItem[]> { return []; },
    async toggleBotSubscription(botId: string): Promise<{ status: 'subscribed' | 'unsubscribed' }> {
        console.log(`[MOCK] Toggling subscription for bot ${botId}`);
        return { status: 'subscribed' };
    }
};

const USE_MOCK_API = false;
export const exploreService = USE_MOCK_API ? mockExploreService : realExploreService;