// src/services/exploreService.ts
import api from './api';
import { BotItem } from '../components/allchats/ChatRow';

export type ExploreBotItem = BotItem & { followed?: boolean };
export type Category = { id: string; name: string; };

const USE_MOCK_API = true;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const allMockBots: ExploreBotItem[] = [
    { id: 'creative_writing', name: 'Creative WritingSE', description: 'Hello! I can provide assistance with your...', followed: false },
    { id: 'realvisxl_2', name: 'RealVisXL', description: 'Generate photo-realistic pictures with Re...', followed: false },
    { id: 'mrteacher_2', name: 'MrTeacherGPT', description: 'I will help you learn anything you need to.', followed: false },
    { id: 'photocreatee_2', name: 'Photo CreateE', description: 'This bot generates realistic, stock photo...', followed: true },
    { id: 'psychological_expert', name: 'PsychologicalExpert', description: 'Expert in Psychology', followed: false },
    { id: 'doctorsage', name: 'Doctorsage', description: 'Dr. Sage answers uni med questions in a...', followed: true },
    { id: 'mrstherapist', name: 'Mrstherapist', description: 'Your very own therapist with relationship...', followed: true },
];

const mockExploreService = {
  async getCategories(): Promise<Category[]> {
    console.log(`[MOCK] Fetching explore categories`);
    await delay(300);
    return [
      { id: 'official', name: 'Official' },
      { id: 'featured', name: 'Featured' },
      { id: 'professional', name: 'Professional' },
      { id: 'popular', name: 'Popular' },
    ];
  },
  async getBots(categoryId: string): Promise<ExploreBotItem[]> {
    console.log(`[MOCK] Fetching bots for category: ${categoryId}`);
    await delay(800);
    return allMockBots;
  },
  // NEW: Function to search bots based on a query.
  async searchBots(query: string): Promise<ExploreBotItem[]> {
    console.log(`[MOCK] Searching for bots with query: "${query}"`);
    await delay(500);
    if (!query) return [];
    const lowerCaseQuery = query.toLowerCase();
    // In a real scenario, this would be a backend query. Here we just filter the mock data.
    return allMockBots.filter(bot => bot.name.toLowerCase().includes(lowerCaseQuery));
  },
};

const realExploreService = {
  async getCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>('/v1/explore/categories');
    return response;
  },
  async getBots(categoryId: string): Promise<ExploreBotItem[]> {
    const response = await api.get<ExploreBotItem[]>(`/v1/explore/bots?category=${categoryId}`);
    return response;
  },
  // In a real app, this would make a request to your search endpoint.
  async searchBots(query: string): Promise<ExploreBotItem[]> {
    const response = await api.get<ExploreBotItem[]>(`/v1/explore/search?q=${encodeURIComponent(query)}`);
    return response;
  },
};

export const exploreService = USE_MOCK_API ? mockExploreService : realExploreService;