// src/services/chatService.ts
import api from './api';
import { ChatMessage } from '../types/chat';

// --- Configuration ---
// Flag to toggle between mock data and real API calls.
// Set this to `false` when you want to connect to the actual backend.
const USE_MOCK_API = false;

// Utility to simulate network latency.
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock implementation for the chat service.
 * Simulates API calls with a delay to mimic real network conditions.
 * This is ideal for frontend development and testing without a backend dependency.
 */
const mockChatService = {
  /**
   * Simulates sending a message and receiving a reply from the bot.
   * @param chatId - The ID of the conversation.
   * @param content - The text content of the user's message.
   * @returns A promise that resolves with a mocked assistant `ChatMessage`.
   */
  async sendMessage(chatId: string, content: string): Promise<ChatMessage> {
    await delay(450);
    console.log(`[MOCK] Sending message to ${chatId}: "${content}"`);

    // Generate dynamic suggestions based on message length for more realistic mocks.
    const suggestions = content.trim().length > 18
      ? ['Explain it better.', 'Give me some examples.']
      : ['Tell me more.', 'And then?'];

    return {
      id: String(Date.now()),
      role: 'assistant',
      content: `You said: "${content}". This is a mocked response.`,
      suggestions,
    };
  },

  /**
   * Simulates rewriting a message.
   * @param chatId - The ID of the conversation.
   * @param messageId - The ID of the message to rewrite.
   * @param content - The original content of the message.
   * @returns A promise that resolves with the rewritten message content.
   */
  async rewriteMessage(chatId: string, messageId: string, content: string): Promise<string> {
    await delay(600);
    console.log(`[MOCK] Rewriting message ${messageId} in chat ${chatId}`);
    return `This is a rewritten version of: "${content}"`;
  },

  /**
   * Simulates synthesizing speech for a message.
   * @param chatId - The ID of the conversation.
   * @param messageId - The ID of the message to convert to speech.
   * @param content - The text content to synthesize.
   * @returns A promise that resolves with a mock URL to an audio file.
   */
  async synthesizeSpeech(chatId: string, messageId: string, content: string): Promise<string> {
    await delay(300);
    console.log(`[MOCK] Synthesizing speech for message ${messageId}`);
    // In a real implementation, this would be a URL to an audio file (e.g., mp3).
    return 'https://example.com/mock-audio.mp3';
  },
};

/**
 * Real API implementation for the chat service.
 * This service makes actual HTTP requests to the backend API endpoints.
 */
const realChatService = {
  /**
   * Sends a user message to the backend and gets the bot's reply.
   * @param chatId - The ID of the conversation.
   * @param content - The text content of the user's message.
   * @returns A promise that resolves with the assistant's `ChatMessage` from the API.
   */
  async sendMessage(chatId: string, content: string): Promise<ChatMessage> {
    // Update the URL to match the backend
    const response = await api.post<ChatMessage>(`/api/v1/chats/${chatId}/messages/`, { content });
    return response;
  },

  /**
   * Requests the backend to rewrite a specific message.
   * @param chatId - The ID of the conversation.
   * @param messageId - The ID of the message to rewrite.
   * @param content - The original content, passed for context if needed by the API.
   * @returns A promise that resolves with the new message content.
   */
  async rewriteMessage(chatId: string, messageId: string, content: string): Promise<string> {
    // The backend should return an object like { newContent: "..." }.
    const response = await api.post<{ newContent: string }>(`/v1/chats/${chatId}/messages/${messageId}/rewrite`);
    return response.newContent;
  },

  /**
   * Requests the backend to generate a text-to-speech audio URL for a message.
   * @param chatId - The ID of the conversation.
   * @param messageId - The ID of the message to synthesize.
   * @param content - The text content to synthesize.
   * @returns A promise that resolves with the URL of the generated audio file.
   */
  async synthesizeSpeech(chatId: string, messageId: string, content: string): Promise<string> {
    // The backend should return an object like { audioUrl: "..." }.
    const response = await api.get<{ audioUrl: string }>(`/v1/chats/${chatId}/messages/${messageId}/tts`);
    return response.audioUrl;
  },
};

// Export the appropriate service implementation based on the `USE_MOCK_API` flag.
export const chatService = USE_MOCK_API ? mockChatService : realChatService;