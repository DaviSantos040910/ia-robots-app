// src/services/allChatsService.ts
import api from './api';
import { BotItem } from '../components/allchats/ChatRow';

// --- Configuration ---
// Switch this flag to `false` to use the real API implementation.
const USE_MOCK_API = true;

// Utility to simulate network latency.
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock implementation for the AllChats service.
 * Simulates fetching a list of bots/chats.
 */
const mockAllChatsService = {
  async getChats(): Promise<BotItem[]> {
    console.log(`[MOCK] Fetching all chats`);
    await delay(800); // Simulate network delay

    // This mock data structure should match your backend response.
    return [
      { id: 'starry', name: 'StarryAI bot', description: 'Psychologist that always here for you.', createdByMe: true, avatarUrl: 'https://i.imgur.com/example.png' },
      { id: 'image_creator', name: 'Image Creators', description: 'Hello! I can provide assistance with your...' },
      { id: 'realvisxl', name: 'RealVisXL', description: 'Generate photo-realistic pictures with Re...' },
      { id: 'mrteacher', name: 'MrTeacherGPT', description: 'I will help you learn anything you need to.' },
    ];
  },
};

/**
 * Real API implementation for the AllChats service.
 */
const realAllChatsService = {
  async getChats(): Promise<BotItem[]> {
    console.log(`[API] Fetching all chats`);
    // The endpoint should return an array of objects matching the `BotItem` type.
    const response = await api.get<BotItem[]>('/v1/chats');
    return response;
  },
};

export const allChatsService = USE_MOCK_API ? mockAllChatsService : realAllChatsService;