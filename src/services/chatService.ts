// src/services/chatService.ts

import api from './api';
import { ChatMessage, PaginatedMessages, ChatListItem } from '../types/chat';
import config from '../config';

const env = config();

export interface VoiceInteractionResponse {
  transcription: string;
  ai_response_text: string;
  user_message: ChatMessage;
  ai_messages: ChatMessage[];
}

const realChatService = {
  // ... getMessages mantido igual ...
  async getMessages(chatId: string, page: number): Promise<PaginatedMessages> {
    console.log(`[API] Fetching messages for chat ${chatId}, page ${page}`);
    const response = await api.get<PaginatedMessages>(`/api/v1/chats/${chatId}/messages/?page=${page}`);
    return response;
  },

  /**
   * Sends a user message to the backend.
   * Updated to accept optional replyWithAudio flag.
   */
  async sendMessage(chatId: string, content: string, replyWithAudio: boolean = false): Promise<ChatMessage[]> {
    // Agora enviamos um objeto com 'content' e 'reply_with_audio'
    const response = await api.post<ChatMessage[]>(`/api/v1/chats/${chatId}/messages/`, { 
        content,
        reply_with_audio: replyWithAudio 
    });
    return response;
  },

  // ... Demais métodos mantidos para compatibilidade ...
  async archiveAndCreateNewChat(chatId: string): Promise<{ new_chat_id: string }> {
    const response = await api.post<{ new_chat_id: string }>(`/api/v1/chats/${chatId}/archive/`);
    return response;
  },

  async setActiveChat(chatId: string): Promise<ChatListItem> {
    const response = await api.post<ChatListItem>(`/api/v1/chats/${chatId}/set-active/`);
    return response;
  },

  async getMessageTTS(chatId: string, messageId: string): Promise<Blob> {
    const token = await import('expo-secure-store').then(m => m.getItemAsync('authToken'));
    const response = await fetch(`${env.api.baseUrl}/api/v1/chats/${chatId}/messages/${messageId}/tts/`, {
        method: 'GET', headers: {'Authorization': `Bearer ${token}`}
    });
    if (!response.ok) throw new Error('Erro ao buscar áudio');
    return response.blob();
  },

  async toggleMessageLike(chatId: string, messageId: string): Promise<{ liked: boolean }> {
    return await api.post<{ liked: boolean }>(`/api/v1/chats/${chatId}/messages/${messageId}/like/`);
  },

  async transcribeAudio(chatId: string, audioUri: string): Promise<string> {
      const formData = new FormData();
      // @ts-ignore
      formData.append('audio', { uri: audioUri, type: 'audio/m4a', name: 'recording.m4a' });
      const token = await import('expo-secure-store').then(m => m.getItemAsync('authToken'));
      const response = await fetch(`${env.api.baseUrl}/api/v1/chats/${chatId}/transcribe/`, {
          method: 'POST', headers: {'Authorization': `Bearer ${token}`}, body: formData
      });
      if (!response.ok) throw new Error('Failed to transcribe');
      const data = await response.json();
      return data.transcription;
  },

  async sendVoiceMessage(chatId: string, audioUri: string, replyWithAudio: boolean = false): Promise<ChatMessage[]> {
      const formData = new FormData();
      // @ts-ignore
      formData.append('audio', { uri: audioUri, type: 'audio/m4a', name: 'voice_message.m4a' });
      formData.append('reply_with_audio', String(replyWithAudio));
      const token = await import('expo-secure-store').then(m => m.getItemAsync('authToken'));
      const response = await fetch(`${env.api.baseUrl}/api/v1/chats/${chatId}/voice-message/`, {
        method: 'POST', headers: {'Authorization': `Bearer ${token}`}, body: formData
      });
      if (!response.ok) throw new Error('Failed to send voice message');
      return await response.json();
  },

  async sendVoiceInteraction(chatId: string, audioUri: string, options?: { signal?: AbortSignal }): Promise<VoiceInteractionResponse> {
    const formData = new FormData();
    // @ts-ignore
    formData.append('audio', { uri: audioUri, type: 'audio/m4a', name: 'voice_input.m4a' });
    const token = await import('expo-secure-store').then(m => m.getItemAsync('authToken'));
    const response = await fetch(`${env.api.baseUrl}/api/v1/chats/${chatId}/voice/`, {
      method: 'POST', headers: {'Authorization': `Bearer ${token}`}, body: formData, signal: options?.signal
    });
    if (!response.ok) throw new Error('Failed to process voice interaction');
    return await response.json();
  }
};

const USE_MOCK_API = false;
export const chatService = USE_MOCK_API ? realChatService : realChatService;