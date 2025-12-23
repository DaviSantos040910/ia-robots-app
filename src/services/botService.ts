// src/services/botService.ts
import api from './api';
import { ChatBootstrap, Bot } from '../types/chat';

const realBotService = {
  /**
   * Fetches the bootstrap data for a specific bot from the backend.
   * This endpoint finds or creates an active chat session.
   * @param botId - The unique identifier for the bot.
   * @returns A promise that resolves with the ChatBootstrap data from the API.
   */
  async getChatBootstrap(botId: string): Promise<ChatBootstrap> {
    console.log(`[API] Fetching bootstrap data for botId: "${botId}"`);
    const response = await api.get<ChatBootstrap>(`/api/v1/chats/bootstrap/bot/${botId}/`);
    return response;
  },


/**
   * Lista bots criados pelo usuário logado.
   *
   * Backend: usa o endpoint já existente do BotListCreateView (GET /api/v1/bots/),
   * que filtra por owner=request.user no get_queryset.
   */
 async fetchCreatedBots(): Promise<Bot[]> {
    return api.get<Bot[]>(`/api/v1/bots/`);
  },
};



const mockBotService = {
    async getChatBootstrap(botId: string): Promise<ChatBootstrap> {
        console.log(`[MOCK] Fetching bootstrap data for botId: "${botId}"`);
        await new Promise(resolve => setTimeout(resolve, 800));
        return {
            conversationId: `mock_chat_${botId}`,
            bot: { name: 'Mock Bot', handle: '@mock', avatarUrl: '' },
            welcome: 'This is a mocked welcome message.',
            suggestions: [],
        };
    },
    async fetchCreatedBots(): Promise<Bot[]> {
    console.log('[MOCK] Fetching created bots for current user');
    await new Promise(resolve => setTimeout(resolve, 400));
    return [];
  },
};

const USE_MOCK_API = false;
export const botService = USE_MOCK_API ? mockBotService : realBotService;