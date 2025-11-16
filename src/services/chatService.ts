// src/services/chatService.ts

import api from './api';
import { ChatMessage, PaginatedMessages, ChatListItem } from '../types/chat';
import { string } from 'yup';
import config from '../config';

const env = config();

const realChatService = {
  /**
   * Fetches a specific page of messages for a given chat.
   * @param chatId - The ID of the conversation.
   * @param page - The page number to fetch.
   * @returns A promise that resolves with a paginated list of ChatMessage objects.
   */
  async getMessages(chatId: string, page: number): Promise<PaginatedMessages> {
    console.log(`[API] Fetching messages for chat ${chatId}, page ${page}`);
    const response = await api.get<PaginatedMessages>(`/api/v1/chats/${chatId}/messages/?page=${page}`);
    return response;
  },

  /**
   * Sends a user message to the backend and gets the bot's reply.
   * @param chatId - The ID of the conversation.
   * @param content - The text content of the user's message.
   * @returns A promise that resolves with an array of ChatMessage objects from the API.
   */
  async sendMessage(chatId: string, content: string): Promise<ChatMessage[]> {
    const response = await api.post<ChatMessage[]>(`/api/v1/chats/${chatId}/messages/`, { content });
    return response;
  },

  /**
   * Archives the current chat and creates a new active one.
   * @param chatId - The ID of the chat to archive.
   * @returns A promise that resolves with the ID of the new active chat.
   */
  async archiveAndCreateNewChat(chatId: string): Promise<{ new_chat_id: string }> {
    console.log(`[API] Archiving chat ${chatId}`);
    const response = await api.post<{ new_chat_id: string }>(`/api/v1/chats/${chatId}/archive/`);
    return response;
  },

  /**
   * Sets a specific chat (usually archived) as the active one.
   * This will archive the currently active chat for the same bot.
   * @param chatId - The ID of the chat to activate.
   * @returns A promise that resolves with the details of the newly activated chat.
   */
  async setActiveChat(chatId: string): Promise<ChatListItem> {
    console.log(`[API] Setting chat ${chatId} as active`);
    const response = await api.post<ChatListItem>(`/api/v1/chats/${chatId}/set-active/`);
    return response;
  },

  /**
   * Gets TTS audio for a specific message.
   * @param chatId - The ID of the conversation.
   * @param messageId - The ID of the message to convert to speech.
   * @returns A promise that resolves with the audio blob.
   */
  async getMessageTTS(chatId: string, messageId: string): Promise<Blob> {
    console.log(`[API] Fetching TTS for message ${messageId} in chat ${chatId}`);
    
    const token = await import('expo-secure-store').then(m =>
      m.getItemAsync('authToken')
    );

    const response = await fetch(
      `${env.api.baseUrl}/api/v1/chats/${chatId}/messages/${messageId}/tts/`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Erro ao buscar áudio');
    }

    return response.blob();
  },

  /**
   * Toggles like status for a message.
   * @param chatId - The ID of the conversation.
   * @param messageId - The ID of the message to like/unlike.
   * @returns A promise that resolves with the updated like status.
   */
  async toggleMessageLike(chatId: string, messageId: string): Promise<{ liked: boolean }> {
    console.log(`[API] Toggling like for message ${messageId}`);
    const response = await api.post<{ liked: boolean }>(
      `/api/v1/chats/${chatId}/messages/${messageId}/like/`
    );
    return response;
  },

  /**
   * Transcreve um arquivo de áudio usando a API do backend (Gemini).
   * @param chatId - The ID of the conversation.
   * @param audioUri - URI local do arquivo de áudio gravado.
   * @returns A promise that resolves with the transcribed text.
   */
  async transcribeAudio(chatId: string, audioUri: string): Promise<string> {
    try {
      console.log(`[ChatService] Transcribing audio for chat ${chatId}`);
      console.log(`[ChatService] Audio URI: ${audioUri}`);

      // ✅ CORRIGIDO: Não precisa verificar se existe, apenas envia diretamente
      console.log(`[ChatService] Preparing audio file for upload`);

      // Cria FormData para enviar o arquivo de áudio
      const formData = new FormData();
      
      // Adiciona o arquivo ao FormData
      // @ts-ignore - FormData aceita arquivos de diferentes formas em React Native
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a', // Expo usa m4a no iOS e 3gp no Android por padrão
        name: 'recording.m4a',
      });

      console.log('[ChatService] Sending audio file for transcription...');

      // Obtém o token de autenticação
      const token = await import('expo-secure-store').then(m =>
        m.getItemAsync('authToken')
      );

      // Envia para o endpoint de transcrição usando fetch
      const response = await fetch(
        `${env.api.baseUrl}/api/v1/chats/${chatId}/transcribe/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // NÃO definir Content-Type manualmente
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[ChatService] Transcription error response:', errorData);
        throw new Error(errorData.detail || 'Failed to transcribe audio');
      }

      const data = await response.json();
      console.log('[ChatService] Transcription successful:', data.transcription);

      return data.transcription;
    } catch (error: any) {
      console.error('[ChatService] Transcription error:', error);
      
      if (error.response) {
        console.error('[ChatService] Error response:', error.response.data);
        throw new Error(error.response.data.detail || 'Failed to transcribe audio');
      }
      
      throw new Error('Failed to transcribe audio. Please try again.');
    }
  },
};

// Mocks for development
const mockChatService = {
  async getMessages(chatId: string, page: number): Promise<PaginatedMessages> {
    return { count: 0, next: null, previous: null, results: [] };
  },

  async sendMessage(chatId: string, content: string): Promise<ChatMessage[]> {
    return [{
      id: 'mock',
      role: 'assistant',
      content: 'Mock response',
      created_at: new Date().toISOString()
    }];
  },

  async archiveAndCreateNewChat(chatId: string): Promise<{ new_chat_id: string }> {
    return { new_chat_id: 'new_mock_id' };
  },

  async setActiveChat(chatId: string): Promise<ChatListItem> {
    console.log(`[MOCK] Setting chat ${chatId} as active`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      id: chatId,
      status: 'active',
      bot: { id: 'bot_1', name: 'Mock Bot', description: 'Mocked', avatar_url: null },
      last_message: null,
      last_message_at: new Date().toISOString(),
    };
  },

  async getMessageTTS(chatId: string, messageId: string): Promise<Blob> {
    console.log(`[MOCK] Getting TTS for message ${messageId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return new Blob([], { type: 'audio/wav' });
  },

  async toggleMessageLike(chatId: string, messageId: string): Promise<{ liked: boolean }> {
    console.log(`[MOCK] Toggling like for message ${messageId}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return { liked: true };
  },

  async transcribeAudio(chatId: string, audioUri: string): Promise<string> {
    console.log(`[MOCK] Transcribing audio for chat ${chatId}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return 'Este é um texto transcrito de exemplo do áudio mockado.';
  },
};

const USE_MOCK_API = false;

export const chatService = USE_MOCK_API ? mockChatService : realChatService;
